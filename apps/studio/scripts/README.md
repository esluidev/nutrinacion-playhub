# scripts/generate_audio.py — narración de storyboards (VoiceBox)

Genera **en lote** los audios de narración de modo niño de un storyboard, a partir de su
`audio.manifest.json`. Renderiza un `.wav` por línea del manifiesto en
`content/storyboards/<categoría>/<storyboard>/audio/<locale>/<clave>.wav`.

Solo usa la stdlib de Python 3 (no hay que instalar nada). El runner reproduce estos `.wav`
por clave y cae a Web Speech si falta alguno — ver `docs/storyboards.md` → **Narración (audio)**.

## Requisitos

- **VoiceBox** corriendo (por defecto `http://127.0.0.1:17493`) con al menos un perfil de voz.
- Python 3 (probado con 3.11).

El script **solo consume** el manifiesto; **no lo crea**. El `audio.manifest.json` se autora a
mano (lo escribe el modelo leyendo la narración de las escenas): cómo y por qué, en
`docs/storyboards.md` → **Narración (audio)**.

## El manifiesto

Vive en la raíz del storyboard: `content/storyboards/<cat>/<id>/audio.manifest.json`.

```jsonc
{
  "storyboard": "los-frijoles",
  "engine": "qwen",            // motor de VoiceBox (cloned → qwen)
  "personality": false,        // false = habla el texto literal (no lo reescribe)
  "seed": 7,                   // opcional, para reproducibilidad
  "instruct": "Warm, friendly storyteller for children ages 4 to 8 ...",  // tono
  "locales": {
    "es": {
      "language": "es",
      "lines": [
        { "key": "bienvenida-titulo",     "text": "¡A conocer los frijoles! ..." },
        { "key": "bienvenida-instruccion", "text": "Hoy toca conocer los frijoles. ..." }
        // ...
      ]
    }
  }
}
```

- `key` → solo el **nombre del archivo** (`<key>.wav`); semántica, con prefijo de escena
  (`descubrimiento-frijol-rojo`, `retroalimentacion-pregunta-1`, …). El runner NO resuelve por
  clave sino por **`text`**: reproduce el wav cuyo `text` coincide con lo que la escena narra. Por
  eso el `text` debe ser **idéntico** al de runtime (ver `docs/storyboards.md` → Narración).
- `engine` / `instruct` / `personality` / `seed`: a nivel raíz (valen para todo el storyboard);
  una línea puede sobreescribir `instruct` o `seed` con un campo propio.
- `engine`: la voz **clonada** corre en `qwen` (`qwen_custom_voice` rechaza perfiles clonados).

## Uso

```bash
cd apps/studio

# un storyboard
python3 scripts/generate_audio.py content/storyboards/nutricion/los-frijoles/audio.manifest.json

# todos los storyboards que tengan manifiesto (lote sobre el catálogo)
python3 scripts/generate_audio.py --all

# ver qué generaría, sin llamar a VoiceBox
python3 scripts/generate_audio.py content/storyboards/nutricion/los-frijoles/audio.manifest.json --dry-run
```

El primer argumento es **la ruta al `audio.manifest.json`** del storyboard que quieres generar
(puedes pasar varias rutas). Con `--all` el script descubre todos los manifiestos bajo
`content/` (storyboards + el shell compartido `content/runner/audio.manifest.json`).

**Perfil de voz:** por defecto toma el primer perfil cuyo `language` coincide con el locale. Si
tienes **varios perfiles** del mismo idioma, eso es no-determinista — pasa `--profile-id` para
fijar la voz y mantener todos los audios consistentes.

### Opciones

| Opción | Default | Para qué |
|--------|---------|----------|
| `--locale es` \| `--locale all` | todos los del manifiesto | qué idioma(s) renderizar |
| `--force` | off | re-generar los `.wav` que ya existen |
| `--concurrency N` | `3` | generaciones en paralelo en vuelo |
| `--profile-id ID` | auto | forzar un perfil de voz concreto |
| `--base-url URL` | `http://127.0.0.1:17493` | URL de VoiceBox |
| `--dry-run` | off | listar sin generar |

### Comportamiento

- **Idempotente**: salta las líneas cuyo `.wav` ya existe (usa `--force` para rehacerlas).
- **Perfil**: por defecto toma el perfil cuyo `language` coincide con el locale; si no, el
  primero. Pásalo explícito con `--profile-id`.
- Salida y resumen por consola (`✓` / `✗` por línea, conteo final). Devuelve exit code ≠ 0 si
  alguna línea falló.

## Cómo funciona (VoiceBox es asíncrono)

Por cada línea: `POST /generate` → devuelve un id (`status: "generating"`) →
`GET /history/{id}` en poll hasta `completed` → `GET /history/{id}/export-audio` baja el `.wav`
(16-bit mono 24 kHz). `GET /profiles` lista las voces disponibles.
