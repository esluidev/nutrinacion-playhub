# Educators — instrucciones para agentes

Ámbito: `apps/educators`. Hereda las reglas del `AGENTS.md` raíz.

## Lectura mínima

1. README de esta app y tarea activa.
2. `docs/apps/educators.md`.
3. Para runner/webview: `docs/games.md` y `docs/game-rules.md`.
4. Para datos/auth: `docs/backend.md` y las migraciones concretas.

## Reglas

- Flutter/Dart: archivos snake_case, clases/widgets PascalCase y análisis estricto.
- La app está parcialmente implementada con datos locales; no documentar Supabase o auth como
  completos hasta que existan código y pruebas.
- La ejecución de juegos pertenece al runner de Studio; Educators aloja y comunica, no duplica las
  mecánicas HTML.
- Mantener targets táctiles, landscape y el lenguaje visual lúdico existente.
- Separar repositorio/servicio de datos de widgets cuando se conecte Supabase.
- El flujo de educador requiere un boundary de auth propio; no reutilizar sin diseño la sesión de
  administradores.

## Verificación

```bash
flutter analyze
flutter test
```

Como el verify raíz todavía no ejecuta Flutter, registra esta salida por separado en la tarea.
