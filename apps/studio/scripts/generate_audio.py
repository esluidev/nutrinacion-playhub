#!/usr/bin/env python3
"""Batch-generate StoryPlay narration audio with VoiceBox.

The kid-mode narration of each storyboard (scene instructions, completion
feedback, knowledge-card voice, bean facts, quiz questions, closing line) is
authored once in a per-storyboard `audio.manifest.json` next to the scenes.
This script reads that manifest and renders one .wav per line into
`<storyboard>/audio/<locale>/<key>.wav`, in batch — never one curl at a time.

Full dev usage: scripts/README.md. How the manifest is authored (by hand, no
automation) and how the runner plays it: docs/storyboards.md -> Narración (audio).

VoiceBox (http://127.0.0.1:17493) generates asynchronously, so each line is:
  POST /generate            -> generation id (status "generating")
  GET  /history/{id}         -> poll until status "completed" / "failed"
  GET  /history/{id}/export-audio  -> download the wav

The cloned Spanish voice runs on the `qwen` engine (qwen_custom_voice rejects
cloned profiles). Tone for 4-8 year olds is set per manifest via `instruct`;
`personality` stays false so the exact scripted line is spoken verbatim.

Usage:
  # one storyboard
  python3 scripts/generate_audio.py content/storyboards/nutricion/los-frijoles/audio.manifest.json

  # every storyboard that has a manifest (batch over the whole catalogue)
  python3 scripts/generate_audio.py --all

  # options
  --locale es|all     locale(s) to render (default: every locale in the manifest)
  --force             re-render lines whose .wav already exists
  --concurrency N     parallel in-flight generations (default: 3)
  --profile-id ID     override the auto-picked voice profile
  --base-url URL      VoiceBox base url (default: http://127.0.0.1:17493)
  --dry-run           list what would be generated, call nothing
"""
from __future__ import annotations

import argparse
import json
import sys
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


# ── Manifest -> work list ───────────────────────────────────────────────────
def build_jobs(manifest_path: Path, locales: list[str] | None, force: bool):
    manifest = json.loads(manifest_path.read_text())
    root = manifest_path.parent  # <storyboard>/
    want = locales or list(manifest["locales"].keys())
    jobs = []  # (locale, language, line, dest_path)
    for locale in want:
        block = manifest["locales"].get(locale)
        if not block:
            print(f"  ! {manifest['storyboard']}: no '{locale}' locale in manifest, skipping")
            continue
        language = block.get("language", locale)
        out_dir = root / "audio" / locale
        for line in block["lines"]:
            dest = out_dir / f"{line['key']}.wav"
            if dest.exists() and not force:
                continue
            jobs.append((locale, language, line, dest))
    return manifest, jobs


def gen_params(manifest: dict, language: str, line: dict, profile_id: str) -> dict:
    params = {
        "profile_id": profile_id,
        "text": line["text"],
        "language": language,
        "engine": manifest.get("engine", "qwen"),
        "personality": manifest.get("personality", False),
        "instruct": line.get("instruct", manifest.get("instruct")),
    }
    seed = line.get("seed", manifest.get("seed"))
    if seed is not None:
        params["seed"] = seed
    return {k: v for k, v in params.items() if v is not None}


def find_manifests(repo_root: Path) -> list[Path]:
    # storyboards + the shared runner shell (content/runner/audio.manifest.json)
    return sorted((repo_root / "content").rglob("audio.manifest.json"))


def main() -> int:
    ap = argparse.ArgumentParser(description="Batch-generate StoryPlay narration audio.")
    ap.add_argument("manifests", nargs="*", type=Path, help="audio.manifest.json path(s)")
    ap.add_argument("--all", action="store_true", help="every storyboard with a manifest")
    ap.add_argument("--locale", default=None, help="locale to render (default: all in manifest)")
    ap.add_argument("--force", action="store_true", help="re-render existing .wav files")
    ap.add_argument("--concurrency", type=int, default=3)
    ap.add_argument("--profile-id", default=None)
    ap.add_argument("--base-url", default=DEFAULT_BASE_URL)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")
    manifests = list(args.manifests)
    if args.all:
        # repo root = two levels up from apps/studio/scripts/
        manifests += find_manifests(Path(__file__).resolve().parents[1])
    if not manifests:
        ap.error("pass a manifest path or --all")

    # Health check up front so a dead server fails loud, not per-line.
    if not args.dry_run:
        try:
            api_get(base, "/health")
        except Exception as e:  # noqa: BLE001
            sys.exit(f"VoiceBox unreachable at {base}: {e}")

    locales = [args.locale] if args.locale and args.locale != "all" else None
    profiles_cache: dict[str, dict] = {}
    total_ok = total_fail = total_skip = 0

    for manifest_path in manifests:
        if not manifest_path.exists():
            print(f"✗ {manifest_path} not found")
            continue
        manifest, jobs = build_jobs(manifest_path, locales, args.force)
        name = manifest.get("storyboard", manifest_path.parent.name)
        if not jobs:
            print(f"• {name}: nothing to do (all rendered — use --force to redo)")
            continue
        print(f"\n▶ {name}: {len(jobs)} line(s)")

        for locale, language, line, dest in jobs if args.dry_run else []:
            print(f"  would render [{locale}] {line['key']}")
        if args.dry_run:
            total_skip += len(jobs)
            continue

        # Resolve the profile once per locale.
        for locale in {j[0] for j in jobs}:
            if locale not in profiles_cache:
                p = pick_profile(base, locale, args.profile_id)
                profiles_cache[locale] = p
                print(f"  voice [{locale}]: {p['name']} ({p['id']}) · engine={manifest.get('engine','qwen')}")

        def work(job):
            locale, language, line, dest = job
            params = gen_params(manifest, language, line, profiles_cache[locale]["id"])
            _id, dur = generate_line(base, params, dest)
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
                    print(f"  ✗ [{job[0]}] {job[2].name}: {e}")

    print(f"\nDone. {total_ok} generated, {total_fail} failed, {total_skip} dry-run.")
    return 1 if total_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
