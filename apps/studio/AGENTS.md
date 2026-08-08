# Studio — instrucciones para agentes

Ámbito: `apps/studio`. Hereda las reglas del `AGENTS.md` raíz.

## Lectura mínima por tipo de cambio

- Gestión, auth o catálogo: README, tarea, `docs/apps/studio.md`, `docs/backend.md`.
- Runner o bridge: además `docs/games.md` y `docs/game-rules.md`.
- Storyboard/escena: además contrato del tipo en `docs/storyboards.md` y `docs/design.md` completos.
- Audio: `scripts/README.md` y la sección Narración de `docs/storyboards.md`.

## Reglas

- Studio UI y el design system de juegos son superficies distintas (`main.css` vs
  `storyplay.css`). No mezclar sus componentes/tokens.
- La UI interna es español; todo texto del runner/escena es `Localized` y nunca se hardcodea en
  `scene.vue`.
- Reutilizar primitivas de `app/primitives/`, sprites de `app/sprites/` y clases `.sp-*`.
- Mantener `/play/**` fuera del guard de autenticación y cubrir esa frontera con tests.
- Supabase es read-only desde Studio. No agregar escrituras, service-role ni secretos server-side.
- Metadata build-owned y datos editoriales no se mezclan; Admin es quien persiste lo editorial.
- `typecheck` incluye `content/**/*.ts|vue`; una escena nueva debe pasar por esa cobertura.

## Verificación

```bash
npm run typecheck
npm test
npm run build
```

Para escenas, añade además QA en el runner a la resolución objetivo y evidencia de audio/locale si
aplica.
