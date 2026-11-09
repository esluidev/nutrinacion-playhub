---
id: 016
estado: haciendo
prioridad: alta
creada: 2026-11-09
---
# Juegos de «El huevo» en el Player

## Objetivo

Llevar al runner del Player las escenas del storyboard «El huevo» (Infantil 4–8), una por una. Cada escena parte de la guía del educador (`playhub/storyboards/alimentacion/el-huevo/01-guia-educador.md`) y sigue el patrón de piezas de `packages/ui/PLAYER-DESIGN.md`. Se juzga desde la pantalla compartida del taller.

## Alcance

Entran las nueve escenas de la guía. En el Player hay cuatro: Bienvenida (`anuncio`), Origen (`historia`), Descubrimiento (`destapar`) y Preparación (`colocar`). Quedan fuera las voces, porque el storyboard todavía no tiene audio.

Decisiones acordadas con Luis:

- **Origen:**
  - El huevo se arrastra del nido a la tienda y a la casa con el gesto del runner (`useDrag`).
  - Cada lugar muestra su interior: el mostrador en la tienda y la cocina con refrigerador en la casa.
  - La mano demuestra el arrastre en cada tramo.
- **Pie del runner:** sin banda; solo la hoja del feedback le da fondo, sin línea ni sombra.
- **Descubrimiento (Descubrir, 2026-11-09):**
  - Arriba, tres tarjetas con escenario de 320 × 280. Cada ave tiene su suelo: corral, campo y estanque.
  - Abajo, cada huevo en su nido, a una escala.
  - Mientras esconde un ave, la tarjeta lleva un «?» de 72 en el gris de su contorno.
  - Al tocar el huevo (o la tarjeta), el ave aparece, sin crecer, y la tarjeta rebota.
  - La hoja dice de qué ave es (`fact`) y cómo es el huevo (`description`), con las palabras de la Pedagogía: «más pequeño», «más grande», «con manchitas» y «sin manchitas».
  - Se descartó arrastrar el huevo hasta el ave correcta: muestra las aves antes de descubrirlas y se resuelve adivinando.
- **Colocar:** por ahora no lleva la mano que demuestra. Con dos fichas, demostrar el arrastre a un hueco revela el orden. Luis respondió «no» el 2026-11-09.

## Criterios de aceptación

- [ ] Cada escena de la guía corre en el runner con su plantilla y los textos de la guía.
- [ ] Luis la revisa en la tableta y en el teléfono.

## Pasos

- [x] 1 Bienvenida: aprobada y en master.
- [x] 2 Origen: aprobada y en master. Falta probar el arrastre con dedos reales en la tableta.
- [ ] 3 Descubrimiento: rehecha el 2026-11-09 y en master. Sus tres suelos son de prueba y falta el QA de Luis.
- [ ] 4 Propiedades: no existe en el Player.
- [ ] 5 Hidratación (compartida): no existe en el Player.
- [ ] 6 Preparación: existe (`colocar`), pero no se revisó en esta tanda.
- [ ] 7 Beneficio: no existe en el Player.
- [ ] 8 Retroalimentación: no existe en el Player.
- [ ] 9 Despedida (compartida): no existe en el Player.

## Pendientes y siguiente paso

- **Suelos `suelo-corral`, `suelo-campo` y `suelo-estanque`:** son de prueba. Están en `playhub/assets/escenarios/` y en la librería, pero no en el catálogo de escenarios. Tienen que pasar por la aprobación de assets.
- **Skill:** subir `playhub/skills/playhub-storyboard-games.zip` a claude.ai y quitar de ahí `playhub-scenery-design`.
- **QA en la tableta:** el arrastre de Origen y la escena Descubrimiento.
- **Siguiente escena según la guía:** 4 Propiedades.
- **Fuera de esta tarea:** los teléfonos del administrador (migración 0017) son de otra sesión y siguen sin commitear ni verificar.

## Log

- **2026-11-09, mañana. Origen y el gesto de arrastre:**
  - Interior de la tienda con mostrador (el escaparate parecía un horno) y refrigerador en la cocina, ambos aprobados.
  - Pie sin banda.
  - `useDrag`: un dedo a la vez, toque o arrastre, cancelaciones y vuelta a casa que termina siempre. Arregla el huevo que se quedaba flotando en la tableta. Tiene 12 pruebas.
  - Commits autorizados: `722ad6c`, `cd5d087`, `d6b1701`, `5310ac1`, `ffb3d3b` y `1b5b1ee`.
  - Verificado en `apps/player`: `npm run typecheck` (0 errores), `npm test` (63 aprobadas) y `check-context` aprobado.
- **2026-11-09, tarde. Piezas compartidas:**
  - La mano que demuestra pasa a `app/runner/useDemo.ts` y `DemoHand.vue`.
  - La animación con respaldo pasa a `useAnimation` y `animate` en `board.ts`.
  - Historia y `useDrag` las usan, y se comportan igual que antes.
  - Revisado en el navegador: la mano recorre el camino hasta la Tienda y la marca, agarrar el huevo la corta, y el arrastre a la Casa entra.
  - Pruebas: 76 aprobadas (13 nuevas); typecheck en 0.
  - Documentado en el `AGENTS.md` del Player, en `PLAYER-DESIGN.md` y en la skill, con el zip regenerado.
- **2026-11-09, tarde. Descubrimiento rehecho tras varias vueltas con Luis:**
  - Rechazos de Luis:
    - las tapas de color con base;
    - las cartas de 500;
    - el huevo y el ave en una sola pieza;
    - la marca de agua;
    - el ave que crecía desde las patas;
    - los nidos grandes que se tragaban los huevos;
    - el «?» en amarillo y luego en uva.
  - La tarjeta con escenario pasa a ser compartida con Historia (`sceneryCard` en `board.ts`, `.tb-tarjeta` y `.tb-suelo`).
  - Revisado en el navegador antes y después de destapar las tres tarjetas. Historia se ve igual.
  - Verificado en `apps/player`: `npm run typecheck` (0 errores) y `npm test` (76 aprobadas). En la raíz, `node scripts/check-ui.mjs` aprobado.
  - Sin QA humano todavía.
- **2026-11-09, tarde. Commit autorizado por Luis** («Confirma los cambios del árbol de trabajo»):
  - Entra el trabajo del Player de la tarde (piezas compartidas, Descubrimiento y suelos de prueba), `PLAYER-DESIGN.md` y esta tarea.
  - Quedan fuera los teléfonos del administrador (Admin, Supabase y la migración 0017), que son de otra sesión y no están verificados.
  - Antes del commit, en `apps/player`: `npm run typecheck` (0 errores) y `npm test` (76 aprobadas). En la raíz, `node scripts/check-context.mjs` y `node scripts/check-ui.mjs`, ambos aprobados.
