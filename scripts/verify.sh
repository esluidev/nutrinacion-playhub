#!/usr/bin/env bash
#
# Verifica que el proyecto esté sano en las tres apps.
# Obligatorio antes de marcar una tarea como lista para revisión.
#
# Uso: ./scripts/verify.sh
#
# Códigos de salida:
#   0 = todo OK
#   ≠0 = al menos un chequeo falló (ver salida)
#
# Notas:
#  - Mínimo a propósito: las apps están parcialmente implementadas y la BD no está
#    conectada. Descomentá / ajustá los pasos a medida que cada app tenga sus scripts.
#  - admin y studio son Nuxt (npm/pnpm). educators es Flutter (dart/flutter).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_MANAGER="npm run"   # las apps Nuxt usan npm (lockfile package-lock.json)

run_node_app() {
  local app="$1"; shift
  local app_path="$ROOT/apps/$app"
  if [ ! -f "$app_path/package.json" ]; then
    echo "✗ apps/$app sin package.json, omitido"
    return 0
  fi
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  apps/$app (Nuxt)"
  echo "═══════════════════════════════════════════════════════"
  cd "$app_path"
  for step in "$@"; do
    echo ""
    echo "→ apps/$app: $PKG_MANAGER $step"
    $PKG_MANAGER "$step"
  done
  cd "$ROOT"
}

run_flutter_app() {
  local app="$1"
  local app_path="$ROOT/apps/$app"
  if [ ! -f "$app_path/pubspec.yaml" ]; then
    echo "✗ apps/$app sin pubspec.yaml, omitido"
    return 0
  fi
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  apps/$app (Flutter)"
  echo "═══════════════════════════════════════════════════════"
  cd "$app_path"
  echo "→ apps/$app: flutter analyze"
  flutter analyze
  echo "→ apps/$app: flutter test"
  flutter test
  cd "$ROOT"
}

# admin (Nuxt) — typecheck + tests (vitest) + build
run_node_app admin typecheck test build

# studio (Nuxt)
run_node_app studio typecheck build

# educators (Flutter) — descomentar cuando el proyecto Flutter esté listo
# run_flutter_app educators

# Las apps sin bloque activo todavía no tienen sus chequeos listos. Las tareas
# que toquen una app van a activar su bloque acá como parte de su plan.

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ verify OK"
echo "═══════════════════════════════════════════════════════"
