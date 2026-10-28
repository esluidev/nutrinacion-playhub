# scripts/generate_audio.py — voces de un storyboard (VoiceBox)

Genera en lote un `.wav` por línea del `audio.manifest.json` de un storyboard, en `content/storyboards/<eje>/<storyboard>/audio/<idioma>/<key>.wav`. Solo usa la biblioteca estándar de Python 3.

El script **consume** el manifiesto, no lo crea. Su forma (`key`, `text`, `engine`, `seed`, `instruct`, `personality`) está en `../../../skills/playhub-storyboard-games/references/estructura.md` (raíz de PlayHub). Lo esencial: el runner busca la grabación por `text`, no por `key`; si el texto difiere en una letra del que se dice en el juego, no la encuentra y usa la voz del navegador. Una línea puede sobreescribir `instruct` o `seed`. Una voz clonada corre con `engine: "qwen"` (`qwen_custom_voice` rechaza perfiles clonados).

## Requisitos

- VoiceBox corriendo (por defecto en `http://127.0.0.1:17493`) con al menos un perfil de voz.
- Python 3 (probado con 3.11).

## Uso

```bash
cd apps/player
python3 scripts/generate_audio.py content/storyboards/<eje>/<storyboard>/audio.manifest.json
python3 scripts/generate_audio.py --all       # todos los manifiestos de content/, incluido content/runner/
python3 scripts/generate_audio.py <manifiesto> --dry-run
```

| Opción | Por defecto | Para qué |
|---|---|---|
| `--locale es` \| `--locale all` | todos los del manifiesto | Qué idiomas generar |
| `--force` | no | Regenerar los `.wav` que ya existen |
| `--concurrency N` | `3` | Generaciones en paralelo |
| `--profile-id ID` | automático | Fijar el perfil de voz |
| `--base-url URL` | `http://127.0.0.1:17493` | URL de VoiceBox |
| `--dry-run` | no | Listar sin generar |

- **Idempotente:** salta las líneas cuyo `.wav` ya existe.
- **Perfil:** toma el primero cuyo `language` coincide con el idioma. Con varios perfiles del mismo idioma el resultado no es determinista: pasa `--profile-id`.
- Imprime `✓`/`✗` por línea y sale con código distinto de 0 si alguna falló.
- Por línea: `POST /generate` devuelve un id; se consulta `GET /history/{id}` hasta `completed` y `GET /history/{id}/export-audio` descarga el `.wav` (16 bits, mono, 24 kHz). `GET /profiles` lista las voces.
