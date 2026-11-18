# scripts/generate_audio.py — voces de un storyboard (VoiceBox)

Genera en lote las grabaciones de la narración de un storyboard. La narración está en sus propios JSON (`storyboard.json`, `datos.json` y `scenes/*/scene.json`): cada texto narrado trae lo que se ve (`text`), lo que se dice (`voice`) y la clave de su grabación (`audio`). El script recorre esos JSON y genera un `.wav` por clave e idioma en `content/storyboards/<eje>/<storyboard>/audio/<idioma>/<clave>.wav`. Solo usa la biblioteca estándar de Python 3.

El formato está en `../../../skills/playhub-storyboard-games/references/estructura.md` (raíz de PlayHub), «Textos narrados». Lo esencial:
- El runner busca la grabación por su clave, no por el texto: cambiar lo que se ve no la pierde.
- Sin `voice`, se dice el `text`.
- Una clave dice siempre lo mismo. Si dos textos usan la misma clave para decir cosas distintas, el script lo marca como error y no la genera.
- `audio/<idioma>/voces.json` anota lo que dice cada grabación: si la voz cambia en el JSON, se vuelve a generar.
- La voz del storyboard va en `storyboard.json`, en `narration` (`engine`, `personality`, `seed` e `instruct`). Una voz clonada corre con `engine: "qwen"` (`qwen_custom_voice` rechaza perfiles clonados).

## Requisitos

- VoiceBox corriendo (por defecto en `http://127.0.0.1:17493`) con al menos un perfil de voz.
- Python 3 (probado con 3.11).

## Uso

```bash
cd apps/player
python3 scripts/generate_audio.py content/storyboards/<eje>/<storyboard>
python3 scripts/generate_audio.py --all       # todos los storyboards de content/
python3 scripts/generate_audio.py content/storyboards/<eje>/<storyboard> --dry-run
```

| Opción | Por defecto | Para qué |
|---|---|---|
| `--locale es` \| `--locale all` | los del storyboard | Qué idiomas generar |
| `--force` | no | Regenerar aunque la voz no haya cambiado |
| `--concurrency N` | `3` | Generaciones en paralelo |
| `--profile-id ID` | automático | Fijar el perfil de voz |
| `--base-url URL` | `http://127.0.0.1:17493` | URL de VoiceBox |
| `--dry-run` | no | Listar sin generar |

- **Idempotente:** salta las grabaciones que ya existen y dicen lo mismo que el JSON (`voces.json`).
- **Perfil:** toma el primero cuyo `language` coincide con el idioma. Con varios perfiles del mismo idioma el resultado no es determinista: pasa `--profile-id`.
- Imprime `✓`/`✗` por línea y sale con código distinto de 0 si alguna falló.
- Por línea: `POST /generate` devuelve un id; se consulta `GET /history/{id}` hasta `completed` y `GET /history/{id}/export-audio` descarga el `.wav` (16 bits, mono, 24 kHz). `GET /profiles` lista las voces.
