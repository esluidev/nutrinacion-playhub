# Un solo UI Kit, compartido por todas las apps web

Fecha: 2026-10-14
Estado: aceptada
Sustituye a: no aplica

## Contexto

El PlayHub UI Kit nació como prototipo en `../references/demo` (fuera de Git; retirado el 2026-10-14, cuando todo pasó a `packages/ui`) y es la referencia visual de todas las aplicaciones. Admin y Player tenían cada una su sistema visual, sus `Ui*` duplicados y Tailwind 3. La constitución exige un solo sistema de diseño para todo el producto (`../product/01 - Constitucion de producto.md`, Modelo de contenido).

## Decisión

- **Fuente única:** el kit vive en `packages/ui/` como **capa de Nuxt** (`@playhub/ui`). Cada app la extiende (`extends: ['@playhub/ui']`) y recibe tokens, CSS de componentes, componentes Vue `Ui*`, iconos y fuente. Un cambio en el kit llega a todas las apps al recompilarlas; cada app sigue desplegándose por separado.
- **npm workspaces** en la raíz (`apps/*`, `packages/*`) con un solo lockfile. Sin workspaces, la capa no puede declarar sus dependencias y TypeScript no tipa sus componentes (comprobado: el typecheck dejaba pasar props incorrectos).
- **Tailwind 4** en todas las apps, con los tokens del kit como tema. La paleta por defecto de Tailwind no existe: un color que no es token no se puede escribir.
- **Escala: densidad + variantes.** La densidad fija las medidas (alto de control, iconos, relieve, separaciones) y se hereda por contenedor (`data-density`):
  - `compact`, por defecto, para las apps de gestión (Admin, gestión de Player): controles de 40;
  - `touch`, para el runner y Educators (móviles y tabletas): controles de 48.

  La forma no cambia con la densidad: rectángulos redondeados de 12 en los controles y 16 en las superficies, en todas las apps. Se probó la cápsula en táctil y se descartó el mismo día: Educators y Admin parecían de sistemas distintos.

  Dentro de cada densidad, los componentes tienen variantes `sm`, `md` y `lg` para dar jerarquía.
- **Roles de color** (los del kit original):
  - lima (`lime`) es la acción principal y el tono por defecto (foco, interruptores, selección), y también correcto y progreso;
  - sol (`sun`), acento, celebración y reintento amable;
  - coral, salir o una consecuencia;
  - cielo, información y selección;
  - uva, novedad;
  - rosa, cuidado;
  - noche (`night`), estructura y texto.
  Se probó sol como acción principal y se descartó el mismo día: en Admin llenaba de amarillo cada acento.
- **El color dice algo, en las tres apps por igual.** Cada tono tiene un significado (tabla en `packages/ui/DESIGN.md`, «Roles de color»): hoy en sol, lo próximo en cielo, lo completado en lima, lo que falta en coral. La navegación marca el lugar actual con un tinte lima claro, nunca con el relleno de la acción. Los estados de una sesión (`UI_SESSION_TONES`) y las áreas educativas (`data-area`) se comparten entre Admin y Educators. Las vistas no escriben pasos de paleta (`bg-lime-400`, `text-night-600`), colores hex, sombras ni radios sueltos: usan roles, `data-tone` y los componentes del kit. Los composables entregan el significado (`tone`), no clases de color.
- **Un solo relieve.** Todo lo elevado (controles y superficies) lleva la misma base, `--ph-depth`; los carriles van hundidos, los campos planos y lo flotante con sombra difusa. En una barra, todo mide lo mismo. Los tintes de resalte (por ejemplo, la columna de hoy) son suaves: un acento, no un foco.
- El laboratorio del kit (lámina de componentes y player de prototipo) vive en `packages/ui/lab/` y consume los mismos tokens.

## Consecuencias

- Rediseño de Admin y de la gestión de Player sobre el kit. Admin migró de Tailwind 3 con un puente temporal de colores, ya retirado; después se rehízo vista a vista con los roles de color.
- Instalar dependencias se hace en la raíz (`npm install`); la plataforma de despliegue debe instalar desde la raíz del workspace.
- npm 10 necesita `legacy-peer-deps` para resolver los peers opcionales de Vite que trae Nuxt 4.4 (fijado en `.npmrc`).
- Se revisa si una app nueva no web (por ejemplo, nativa) llegara a necesitar el kit: los tokens tendrían que exportarse a su formato.
