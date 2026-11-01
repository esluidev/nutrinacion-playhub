# La organización es la unidad de operación

Fecha: 2026-10-28
Estado: aceptada
Sustituye a: la comunidad como tenancy operativo de la [decisión 005](005-base-nueva-y-acceso-educador.md), el modelo del hogar y el ámbito por comunidad de la [decisión 007](007-educador-hogar-y-ciclo-del-workshop.md), `platform_comunidades` de la [decisión 008](008-superadmin-administra-organizaciones.md) y el cupo de comunidades de la [decisión 010](010-licencia-solo-cupo-de-comunidades.md).

## Contexto

Durante el QA manual del 2026-10-28, Luis encuentra que la comunidad vuelve pesada y laboriosa la administración: tres contextos en Admin (Platform, organización y comunidad), educadores ligados comunidad por comunidad, colaboradores por comunidad, participantes, códigos de acceso y «Para casa». La comunidad existía para dar un país a los talleres, repartir el cupo de la licencia y enganchar a las familias de la app del hogar, que no existe. Las jornadas, además, eran un módulo aparte que ni el planificador ni el educador veían. El análisis está en la [tarea 011](../../tasks/011-organizacion-sin-comunidades.md).

## Decisión

Aceptada por Luis el 2026-10-28:

- **La organización es la única unidad de operación.** Tiene sus educadores (con sus grupos), sus colaboradores, sus talleres, sus jornadas, los storyboards disponibles y el planificador. Las comunidades desaparecen.
- **La organización declara en qué países opera** (`organizaciones.paises`, uno o varios). Un storyboard estándar está disponible para ella si está publicado en alguno de esos países; uno personalizado, si es suyo. El catálogo conserva su distribución por países sin pasar por una comunidad.
- **La licencia es el contrato:** vigencia, estado y notas. Sin cupos ni países.
- **El colaborador opera la organización:** educadores, grupos, talleres, jornadas y planificador. No toca la licencia, los administradores ni los colaboradores.
- **La jornada es dónde y cuándo se va:** un nombre, un lugar y uno o varios días (descripción opcional). No tiene área propia: se crea o se elige al programar un taller («¿es parte de una jornada?»: no, una en curso o nueva). Sus talleres caen en sus días y heredan su lugar (el del taller pasa a ser el detalle, «Aula 3A»); existe mientras tiene talleres y se borra sola al quedarse sin ninguno. En el planificador se ve como una banda sobre sus días; el educador ve su nombre y su lugar. Los talleres sueltos siguen siendo lo normal.
- **Fuera los participantes y todo el bloque del hogar:** perfiles de familias, avance, código de acceso, temarios, publicaciones y perfil público de la organización. La app del hogar no se construye ahora; cuando toque, se diseña sobre este modelo. El modo `home` del runner se queda como modo del runner.
- **La base se reescribe** en un juego nuevo de migraciones, el que irá al proyecto de la nube. No hay proyecto en la nube y los datos locales son de prueba.

## Consecuencias

- Admin queda con dos contextos: Platform y organización. La operación (talleres, planificador, educadores, colaboradores, storyboards) vive en la organización; la jornada aparece al programar un taller y como banda en el planificador.
- Educators muestra la organización y la jornada donde mostraba la comunidad; entrar, el PIN, el runner incrustado y el cierre no cambian.
- Player no cambia por esta decisión: el runner no usa la base y la publicación sigue por países y organización.
- La constitución de producto deja de hablar de comunidades como unidad de operación; los papeles «Participante» y «Familia o cuidador» siguen siendo producto aunque la base no los registre.
- Si una organización necesita operar en más países, se añaden a `paises`; el país no baja al taller.
