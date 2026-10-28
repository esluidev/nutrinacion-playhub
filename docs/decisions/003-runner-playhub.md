# Runner nuevo de Player sobre el player de referencia

Fecha: 2026-10-14
Estado: aceptada
Sustituye a: no aplica
Precisada por la [decisión 006](006-modelo-y-catalogo-desde-player.md) (2026-10-15): Player registra el catálogo en la base.

## Contexto

El runner de Player (antes Studio) se construyó para el enfoque anterior: una página de 1.347 líneas con barra, hoja de conocimiento y escenas `scene.vue` con `scene.config.ts`, primitivas de dibujo y sprites. El player de referencia de PlayHub define otro marco (consola, consigna fija, pie con feedback, paneles, ventanas, modos y ediciones) y otro modelo de escena (plantilla + contenido).

## Decisión

- Se **retiran** los storyboards existentes de Player y el código que solo los servía: primitivas de dibujo, `app/sprites/`, demos, `storyplay.css`, la página del runner y el contrato `scene.config.ts`.
- Se **rehace el marco** del runner a partir del player de referencia, portado a Vue con el UI Kit, y se **conservan los motores** que funcionan:
  - narración por texto con respaldo de voz del navegador;
  - interacción (tocar, mantener, arrastrar y soltar, ordenar, temporizador);
  - carga del contenido por glob;
  - metadata del build y estado del registro;
  - `generate_audio.py`.
- **Una escena es una plantilla más su contenido.** `scene.json` declara su plantilla (`template`); el `scene.vue` propio existe solo cuando ninguna plantilla sirve. Las escenas compartidas (`bienvenida`, `hidratacion`, `despedida`) no llevan `scene.vue`.
- El primer contenido es el huevo del player de referencia, con la estructura de `estructura.md`.

## Consecuencias

- `estructura.md` (skill `playhub-storyboard-games`) debe recoger el campo `template`.
- Hasta tener servicio de sesión real, el modo dispositivo sigue simulado entre pestañas.
