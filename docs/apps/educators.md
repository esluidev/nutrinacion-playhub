# Educators / StoryPlay (`apps/educators`)

Aplicación Flutter para educadores en aula, orientada a tablet/PWA y ejecución landscape.

## Estado vigente

Es un prototipo con pantallas locales de login, home, ejecución, resumen y feedback. No está
conectada todavía a Supabase y el bridge productivo con el runner de Studio no está cerrado.

No confundir la UI existente con un flujo end-to-end terminado.

## Flujo objetivo

1. Educador inicia sesión con correo+código mediante un boundary de auth propio.
2. Ve talleres/asignaciones de su comunidad.
3. Abre la guía y ejecuta el runner público de Studio en webview.
4. El host entrega idioma, escena y contexto; recibe progreso/cierre.
5. Educators persiste asignación completada y feedback en Supabase.

## Responsabilidades

- navegación y experiencia del educador;
- sesión/autorización del educador;
- datos de talleres/asignaciones/guía;
- alojamiento y bridge del webview;
- persistencia final del feedback.

Los juegos, mecánicas y contenido no se reimplementan en Flutter.

## Diseño

Interfaz táctil, lúdica y legible frente a audiencia; landscape durante ejecución. Conservar los
targets grandes y patrones actuales hasta que exista una decisión de rediseño. Ver
[`../design.md`](../design.md).

## Verificación

```bash
cd apps/educators
flutter analyze
flutter test
```

Estos comandos aún no corren desde el verify raíz. El futuro bridge necesita pruebas de contrato y
QA en dispositivo/web real, además del widget test.
