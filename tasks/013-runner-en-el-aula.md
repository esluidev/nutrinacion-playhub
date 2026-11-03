---
id: 013
estado: backlog
prioridad: alta
creada: 2026-11-03
---
# El runner en un aula real

## Objetivo

Que un educador dé el taller con el runner incrustado en Educators en sus dispositivos (iPad, Android), con voces y aunque falle la red. Reúne lo que quedaba abierto de la [tarea 009](009-runner-dentro-de-educators.md) y C2, C3, C6 y C9 de la [010](010-pendientes-plataforma.md).

## Alcance

- **Demostración dentro de un taller real (C2):** el modo educador siempre muestra 7 dispositivos de prueba y el texto «Taller · demostración», también dentro de Educators (`RunnerFrame.vue`). Solo deberían salir al abrir el runner directo o en desarrollo.
- **Prueba en iPad (Safari) y Android:** que la primera voz suene sin un toque extra dentro del iframe, la pantalla completa, las zonas seguras y que el almacenamiento del iframe sea el de Player.
- **Voces (C6):** el runner carga `.wav` del build y no hay ninguno. El bucket `narracion` solo admite mpeg/mp4/aac, `NUXT_PUBLIC_NARRATION_URL` no está en el código y la voz de respaldo es siempre `es-MX`. Hay que decidir formato y origen y pasar la narración al bucket (público o con enlaces firmados). El respaldo debe ir según el idioma del storyboard.
- **Sin conexión:** service worker en Player y la orden `preparar` para que Educators pida los talleres de la semana; probar que siguen días después.
- **Dispositivos reales (C3), decisión de alcance:** la sesión va por `BroadcastChannel`, que solo une pestañas del mismo navegador. No hay código ni QR para que un dispositivo se sume.
- **«Probar» en Platform:** cada escena sigue abriendo otra pestaña. El detalle del storyboard de la organización ya incrusta el runner en modo `preview`.

## Criterios de aceptación

- [ ] Dentro de un taller real no aparecen dispositivos de demostración.
- [ ] El taller completo funciona en iPad y en Android, con voz y a pantalla completa.
- [ ] Un taller preparado se da sin red.

## Pendientes y siguiente paso

C2 se puede hacer ya. La prueba en dispositivos necesita la red local o el despliegue ([tarea 012](012-puesta-en-marcha-en-la-nube.md)). Las voces y C3 necesitan decisión de Luis.

## Log

- 2026-11-03 15:06 — Creada al cerrar las tareas 001–011 (Luis: «finaliza todo y quita cosas del backlog, ordena las tareas»). Viene de «Pendiente» de la 009 y de C2, C3, C6 y C9 de la 010. Comprobado en el navegador hoy: los 7 dispositivos de demostración siguen dentro de Educators.
