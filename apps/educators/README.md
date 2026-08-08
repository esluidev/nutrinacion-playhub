# StoryPlay Educators

Aplicación Flutter para que educadores ejecuten talleres en aula. Está orientada a tablet/PWA y a
uso táctil landscape. Actualmente es un prototipo con pantallas y datos locales; la conexión real a
Supabase, autenticación por código y bridge final con Studio siguen pendientes.

## Superficies actuales

- login provisional;
- listado de talleres;
- ejecución del taller;
- resumen y feedback;
- integración web todavía no cerrada con el runner público de Studio.

## Desarrollo

```bash
flutter pub get
flutter run
```

## Verificación

```bash
flutter analyze
flutter test
```

Educators aún no forma parte de `../../scripts/verify.sh`; toda tarea que la toque debe ejecutar
estos comandos explícitamente.

## Contexto

- [`../../docs/apps/educators.md`](../../docs/apps/educators.md)
- [`../../docs/games.md`](../../docs/games.md)
- [`AGENTS.md`](AGENTS.md)
