#!/usr/bin/env python3
"""Genera en lote las voces de un storyboard con VoiceBox.

La narración vive en los propios JSON del storyboard (storyboard.json, datos.json
y scenes/*/scene.json): cada texto narrado trae lo que se ve (`text`), lo que se
dice (`voice`) y la clave de su grabación (`audio`). Este script recorre esos
JSON, junta las grabaciones que piden y genera un .wav por clave e idioma en
`<storyboard>/audio/<idioma>/<clave>.wav`. Sin `voice`, se dice el `text`.

Uso completo: scripts/README.md. El formato: la skill playhub-storyboard-games
(references/estructura.md, «Textos narrados»).

Cada grabación recuerda lo que dice en `audio/<idioma>/voces.json`: si la voz
cambia en el JSON, se vuelve a generar; si no, se salta. La voz del storyboard
(motor, semilla, indicaciones de tono) va en `storyboard.json`, en `narration`.

VoiceBox (http://127.0.0.1:17493) genera de forma asíncrona; por línea:
  POST /generate            -> id de la generación (status "generating")
  GET  /history/{id}         -> consulta hasta "completed" / "failed"
  GET  /history/{id}/export-audio  -> descarga el wav

Uso:
  # un storyboard (su carpeta o su storyboard.json)
  python3 scripts/generate_audio.py content/storyboards/alimentacion/el-huevo

  # todos los storyboards de content/
  python3 scripts/generate_audio.py --all

  # opciones
  --locale es|all     idioma(s) a generar (por defecto, los del storyboard)
  --force             volver a generar aunque la voz no haya cambiado
  --concurrency N     generaciones en paralelo (por defecto: 3)
  --profile-id ID     fijar el perfil de voz
  --base-url URL      URL de VoiceBox (por defecto: http://127.0.0.1:17493)
  --dry-run           listar lo que se generaría, sin llamar a nada
"""
from __future__ import annotations

import argparse
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DEFAULT_BASE_URL = "http://127.0.0.1:17493"
POLL_INTERVAL_S = 0.5
POLL_TIMEOUT_S = 180


# ── HTTP helpers (stdlib only — no pip install needed) ──────────────────────
def _request(method: str, url: str, payload: dict | None = None, timeout: int = 30) -> bytes:
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def api_get(base: str, path: str) -> dict:
    return json.loads(_request("GET", base + path))


def api_post(base: str, path: str, payload: dict) -> dict:
    try:
        return json.loads(_request("POST", base + path, payload))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{e.code} {e.read().decode(errors='replace')}") from e


# ── Profile selection ───────────────────────────────────────────────────────
def pick_profile(base: str, locale: str, override: str | None) -> dict:
    profiles = api_get(base, "/profiles")
    if not profiles:
        sys.exit("No voice profiles available in VoiceBox. Create one first.")
    if override:
        match = next((p for p in profiles if p["id"] == override), None)
        if not match:
            sys.exit(f"Profile id {override} not found.")
        return match
    # Prefer a profile whose language matches the locale, else fall back to the
    # first one (the user currently keeps a single Spanish storyteller profile).
    return next((p for p in profiles if p.get("language") == locale), profiles[0])


# ── One line: generate -> poll -> download ──────────────────────────────────
def generate_line(base: str, params: dict, dest: Path) -> tuple[str, float]:
    created = api_post(base, "/generate", params)
    gen_id = created["id"]
    deadline = time.time() + POLL_TIMEOUT_S
    while True:
        record = api_get(base, f"/history/{gen_id}")
        status = record.get("status")
        if status == "completed":
            break
        if status == "failed":
            raise RuntimeError(record.get("error") or "generation failed")
        if time.time() > deadline:
            raise RuntimeError(f"timed out after {POLL_TIMEOUT_S}s (status={status})")
        time.sleep(POLL_INTERVAL_S)
    audio = _request("GET", f"{base}/history/{gen_id}/export-audio", timeout=120)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(audio)
    return gen_id, float(record.get("duration") or 0.0)


# ── Los JSON del storyboard -> lista de trabajo ─────────────────────────────
def is_narrated(value) -> bool:
    return isinstance(value, dict) and "text" in value


def localized(value, locale: str) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        text = value.get(locale) or value.get("es") or next(iter(value.values()), "")
        return str(text).strip()
    return ""


def collect_lines(node, where: str, out: list) -> None:
    """Los textos narrados con grabación (`audio`), con dónde están."""
    if is_narrated(node):
        if node.get("audio"):
            out.append((where, node))
        return
    if isinstance(node, list):
        for i, child in enumerate(node):
            collect_lines(child, f"{where}[{i}]", out)
    elif isinstance(node, dict):
        for key, child in node.items():
            collect_lines(child, f"{where}.{key}", out)


def storyboard_root(path: Path) -> Path:
    return path.parent if path.name == "storyboard.json" else path


def storyboard_files(root: Path) -> list[Path]:
    return [root / "storyboard.json", root / "datos.json", *sorted((root / "scenes").glob("*/scene.json"))]


def build_jobs(root: Path, locales: list[str] | None, force: bool):
    """Por idioma, cada clave con lo que dice. Una clave que dice dos cosas distintas es un error."""
    story = json.loads((root / "storyboard.json").read_text())
    want = locales or story.get("languages") or [story.get("defaultLanguage", "es")]
    found: list = []
    for path in storyboard_files(root):
        if path.exists():
            collect_lines(json.loads(path.read_text()), str(path.relative_to(root)), found)
    jobs, errors = [], []
    for locale in want:
        out_dir = root / "audio" / locale
        index_path = out_dir / "voces.json"
        said = json.loads(index_path.read_text()) if index_path.exists() else {}
        lines: dict[str, tuple[str, str]] = {}
        for where, node in found:
            key = node["audio"]
            text = localized(node.get("voice") or node["text"], locale)
            if key in lines and lines[key][0] != text:
                errors.append(f"[{locale}] «{key}» dice dos cosas: {lines[key][1]} y {where}")
                continue
            lines[key] = (text, where)
        for key, (text, _where) in sorted(lines.items()):
            dest = out_dir / f"{key}.wav"
            if not text or (dest.exists() and said.get(key) == text and not force):
                continue
            jobs.append((locale, {"key": key, "text": text}, dest))
    return story, jobs, errors


def gen_params(narration: dict, language: str, line: dict, profile_id: str) -> dict:
    params = {
        "profile_id": profile_id,
        "text": line["text"],
        "language": language,
        "engine": narration.get("engine", "qwen"),
        "personality": narration.get("personality", False),
        "instruct": narration.get("instruct"),
    }
    seed = narration.get("seed")
    if seed is not None:
        params["seed"] = seed
    return {k: v for k, v in params.items() if v is not None}


def remember(dest: Path, key: str, text: str, lock) -> None:
    """Anota en `voces.json` lo que dice la grabación recién generada."""
    with lock:
        index_path = dest.parent / "voces.json"
        said = json.loads(index_path.read_text()) if index_path.exists() else {}
        said[key] = text
        index_path.write_text(json.dumps(dict(sorted(said.items())), ensure_ascii=False, indent=2) + "\n")


def find_storyboards(app_root: Path) -> list[Path]:
    return sorted(p.parent for p in (app_root / "content" / "storyboards").glob("*/*/storyboard.json"))


def main() -> int:
    ap = argparse.ArgumentParser(description="Genera en lote las voces de los storyboards.")
    ap.add_argument("storyboards", nargs="*", type=Path, help="carpeta del storyboard o su storyboard.json")
    ap.add_argument("--all", action="store_true", help="todos los storyboards de content/")
    ap.add_argument("--locale", default=None, help="idioma a generar (por defecto, los del storyboard)")
    ap.add_argument("--force", action="store_true", help="volver a generar aunque la voz no haya cambiado")
    ap.add_argument("--concurrency", type=int, default=3)
    ap.add_argument("--profile-id", default=None)
    ap.add_argument("--base-url", default=DEFAULT_BASE_URL)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")
    roots = [storyboard_root(p) for p in args.storyboards]
    if args.all:
        # apps/player = un nivel por encima de scripts/
        roots += find_storyboards(Path(__file__).resolve().parents[1])
    if not roots:
        ap.error("pasa la carpeta de un storyboard o --all")

    # Comprobar VoiceBox antes de nada: si no está, que falle de una vez y no línea por línea.
    if not args.dry_run:
        try:
            api_get(base, "/health")
        except Exception as e:  # noqa: BLE001
            sys.exit(f"VoiceBox no responde en {base}: {e}")

    locales = [args.locale] if args.locale and args.locale != "all" else None
    profiles_cache: dict[str, dict] = {}
    total_ok = total_fail = total_skip = 0
    lock = threading.Lock()

    for root in roots:
        if not (root / "storyboard.json").exists():
            print(f"✗ {root}: no tiene storyboard.json")
            total_fail += 1
            continue
        story, jobs, errors = build_jobs(root, locales, args.force)
        name = story.get("slug", root.name)
        narration = story.get("narration", {})
        for error in errors:
            print(f"  ✗ {name}: {error}")
        total_fail += len(errors)
        if not jobs:
            print(f"• {name}: nada que generar (todo al día; --force para rehacer)")
            continue
        print(f"\n▶ {name}: {len(jobs)} grabación(es)")

        if args.dry_run:
            for locale, line, _dest in jobs:
                print(f"  generaría [{locale}] {line['key']}: {line['text']}")
            total_skip += len(jobs)
            continue

        # El perfil de voz, una vez por idioma.
        for locale in {j[0] for j in jobs}:
            if locale not in profiles_cache:
                p = pick_profile(base, locale, args.profile_id)
                profiles_cache[locale] = p
                print(f"  voz [{locale}]: {p['name']} ({p['id']}) · motor={narration.get('engine', 'qwen')}")

        def work(job):
            locale, line, dest = job
            params = gen_params(narration, locale, line, profiles_cache[locale]["id"])
            _id, dur = generate_line(base, params, dest)
            remember(dest, line["key"], line["text"], lock)
            return locale, line["key"], dest, dur

        with ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as pool:
            futures = {pool.submit(work, j): j for j in jobs}
            for fut in as_completed(futures):
                job = futures[fut]
                try:
                    locale, key, dest, dur = fut.result()
                    total_ok += 1
                    print(f"  ✓ [{locale}] {key}  ({dur:.1f}s)  → {dest.name}")
                except Exception as e:  # noqa: BLE001
                    total_fail += 1
                    print(f"  ✗ [{job[0]}] {job[1]['key']}: {e}")

    print(f"\nListo. {total_ok} generadas, {total_fail} con error, {total_skip} en simulacro.")
    return 1 if total_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
