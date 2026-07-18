# App: Creador de juegos / Studio (`apps/studio`)

Herramienta interna de la startup para crear, almacenar y exponer los juegos HTML que
componen las escenas de los storyboards. Stack: Nuxt. Solo español (uso interno).

> Estado: **no existe todavía.** Es una de las apps a construir. Este documento describe
> la intención; los detalles técnicos finos se definirán al implementarla.

## Propósito

Los juegos de las escenas son **HTML interactivos**, que un modelo de IA o un desarrollador
puede escribir directamente. Studio es donde esos juegos se crean, guardan y publican.

## Responsabilidades

1. **Crear juegos HTML** — un editor/entorno para construir los juegos interactivos de
   cada escena (puzzles, retos, interacciones, mini-juegos).
2. **Almacenar** — guardar los juegos y sus assets.
3. **Exponer** — publicar los juegos de forma que la app de educadores los consuma vía
   webview. Ver el contrato en `docs/games.md`.
4. **Traducir** — los juegos se traducen aquí (studio es donde vive la traducción de los
   juegos, aunque su propia UI sea solo español).

## Audiencia

El equipo interno de Nutrinación (diseñadores de contenido, desarrolladores). No es una
app de cara al cliente.

## A definir al implementar

- Cómo se modela un juego (estructura, metadatos, versión, idioma).
- Cómo se asocia un juego a una escena de un storyboard.
- El formato de empaquetado y publicación (un bundle HTML/JS/CSS por juego, hospedaje,
  URL pública o firmada).
- El contrato de comunicación juego ↔ app de educadores (eventos de inicio, progreso,
  completado, recompensas). Ver `docs/games.md`.
- Almacenamiento (Supabase Storage u otro) y control de acceso.
- **Entrega** del audio narrado a educators (hospedaje/servido por webview). La
  generación ya está definida: cada storyboard pregraba su narración con VoiceBox desde un
  `audio.manifest.json` (ver `docs/storyboards.md` → Narración) usando
  `scripts/generate_audio.py` (ver `scripts/README.md`); el runner ya la reproduce con
  fallback a Web Speech.

## Notas

- UI de studio: solo español.
- Los juegos creados aquí sí son multi-idioma (se traducen para las apps que los consumen);
  el patrón de traducción del contenido vive en `docs/storyboards.md` (Traducciones).
- Comparte el backend Supabase con las otras dos apps.
