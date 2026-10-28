# Skills disponibles

Una skill explica cómo realizar una actividad recurrente. La documentación explica cómo funciona este proyecto. Registra aquí capacidades que realmente existan, sin convertir el índice en otro manual.

Este repositorio no tiene skills propias. Las de PlayHub viven en el proyecto padre y no se copian. Las rutas de la tabla son relativas a la raíz de PlayHub (`../` desde la raíz de este repositorio).

| Skill | Cuándo usarla | Ruta o recurso real | Disponibilidad y requisitos |
|---|---|---|---|
| `playhub-storyboard-games` | Diseñar el juego de cada escena de un storyboard y escribirlo en Player (`scene.json`, `datos.json`, voces y `scene.vue`). Su `references/estructura.md` es el contrato de la estructura nueva | `../skills/playhub-storyboard-games/SKILL.md` | Instalada en Claude Code como `anthropic-skills:playhub-storyboard-games` (comprobado el 2026-10-14) |
| `playhub-guides-design` | Escribir la guía del educador de un storyboard | `../skills/playhub-guides-design/SKILL.md` | Instalada como `anthropic-skills:playhub-guides-design` |
| `playhub-scenery-design` | Componer el juego de una escena a partir de su ficha | `../skills/playhub-scenery-design/SKILL.md` | No instalada en el entorno comprobado: leer el original |
| `eslui-motion-design` | Dibujar y preparar assets vectoriales para animación | `../skills/eslui-motion-design/SKILL.md` | Instalada como `anthropic-skills:eslui-motion-design`. Genérica de ESLUI: nunca añadir referencias a PlayHub |
| `eslui-motion-animation` | Animar e implementar interacción de assets con ESLUI Motion o Rive | `../skills/eslui-motion-animation/SKILL.md` | Instalada como `anthropic-skills:eslui-motion-animation`. Genérica de ESLUI: nunca añadir referencias a PlayHub |

El orden de uso en el flujo de contenido (guía → juegos → composición → dibujo → animación → escena en Player) está en `../AGENTS.md` de PlayHub.

## Uso

1. Busca una capacidad pertinente para la tarea y el área afectada.
2. Comprueba que está disponible y lee su fuente antes de aplicarla.
3. Si delegas, entrega la referencia concreta al agente correspondiente.
4. Si falta, continúa con un procedimiento suficiente cuando sea posible y explica únicamente la limitación que afecte al resultado.

Las skills pueden vivir aquí, en la ubicación nativa de la herramienta o en otra fuente configurada. No las copies a dos sitios para mantener versiones independientes. Para rutas locales que no existan en otra máquina, registra cómo resolverlas y evita tratarlas como requisito implícito.

Crear esta carpeta no instala skills ni garantiza que una herramienta las descubra. Si el formato real usa `SKILL.md`, referencia ese archivo; si usa otra interfaz, describe la forma real de acceso.

## Cuándo añadir una

Añade una skill cuando una práctica propia se repita y su procedimiento merezca reutilización: componentes de UI, inspección de datos o QA de un flujo, por ejemplo. Empieza por las que hagan falta. Un proyecto nuevo no requiere una biblioteca completa de skills de frameworks.

Una skill debe ayudar al trabajo solicitado. Su descripción no amplía el alcance ni autoriza efectos externos.
