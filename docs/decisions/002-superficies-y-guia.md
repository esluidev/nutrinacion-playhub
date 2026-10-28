# Educators en web y la guía en la base de datos

Fecha: 2026-10-14
Estado: aceptada
Sustituye a: no aplica

## Contexto

Educators era un prototipo Flutter con datos locales, sin Supabase ni webview. Todo lo que debe mostrar —el runner, la guía y el UI Kit— es web. La guía del educador se necesita en tres lugares: Admin (la edita), Educators y el propio juego en modo educador.

## Decisión

- **Educators pasa a ser una app web** (Nuxt, con la capa `@playhub/ui`), pensada sobre todo para **móviles y tabletas**: densidad `touch`, control táctil cuidado (áreas de toque de al menos 44 px, sin zoom accidental, sin selección de texto en controles, orientación vertical y horizontal). La app Flutter se retira. Instalación como PWA y funcionamiento sin conexión se evalúan aparte.
- **La guía vive en la base de datos.** Admin la escribe; Educators y el modo educador del runner la leen. El runner público (modos dispositivo y casa, participantes anónimos) nunca la pide: solo el modo educador, que requiere sesión, muestra la guía.
- **El educador inicia sesión con su correo y un código**, no con Supabase Auth. El diseño (emisión de sesión, RLS y caducidad) se hace en la tarea del modelo de datos.
- El trabajo de base de datos se hace **primero en Supabase local** (migraciones, seed y pruebas de RLS) y después en producción con autorización; se evalúan las ramas de Supabase como segunda puerta.

## Consecuencias

- Hasta rediseñar la base, Educators y la guía del runner funcionan con datos de prueba.
- Si Educators termina dentro de Player o como app propia queda abierto; hoy es app propia en `apps/educators`.
- Precisada por la [decisión 004](004-runner-incrustado.md) (2026-10-15): Educators es app propia e incrusta el runner de Player. El runner no lee la guía: se la da la app que lo incrusta, con su sesión.
- Precisada por la [decisión 005](005-base-nueva-y-acceso-educador.md) (2026-10-15): el educador entra con correo y un código que genera Admin, recibe un token de sesión y Educators solo usa funciones de la base que lo validan; sin Supabase Auth ni políticas por tabla para educadores.
