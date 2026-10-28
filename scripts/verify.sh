#!/usr/bin/env bash
#
# Verifica que el monorepo esté sano: contexto y las tres apps.
# Obligatorio antes de marcar una tarea como lista para revisión.
#
# Uso: ./scripts/verify.sh    (desde la raíz; las dependencias se instalan con `npm install`)
#
# Códigos de salida:
#   0 = todo OK
#   ≠0 = al menos un chequeo falló (ver salida)
#
# Cobertura:
#  - contexto: archivos, symlinks y enlaces locales (check-context.mjs).
#  - UI Kit: las vistas no escriben paleta, hex, sombras, anillos, tamaños sueltos ni SVG (check-ui.mjs).
#  - admin, player y educators: typecheck + Vitest + build (las tres extienden @playhub/ui,
#    así que esto también verifica el UI Kit compartido).
#  - Supabase local: si está levantado (`supabase start`), las pruebas pgTAP de supabase/tests
#    (RLS por identidad y acceso de educadores) con `supabase test db`. Si no, se avisa como
#    «no ejecutado»: no cuenta como aprobado.
#  - Cloud y navegador: ver docs/backend.md y el plan de cada tarea.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "→ Contexto y documentación"
node "$ROOT/scripts/check-context.mjs"

echo ""
echo "→ UI Kit en las vistas"
node "$ROOT/scripts/check-ui.mjs"

if [ ! -d "$ROOT/node_modules" ]; then
  echo "✗ Faltan dependencias: ejecuta npm install en la raíz del monorepo."
  exit 1
fi

run_app() {
  local app="$1"; shift
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  apps/$app"
  echo "═══════════════════════════════════════════════════════"
  for step in "$@"; do
    echo ""
    echo "→ apps/$app: npm run $step"
    npm --prefix "$ROOT/apps/$app" run "$step"
  done
}

run_app admin typecheck test build
run_app player typecheck test build
run_app educators typecheck test build

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  supabase (local)"
echo "═══════════════════════════════════════════════════════"
SUPABASE_PENDIENTE=""
if command -v supabase >/dev/null 2>&1 && (cd "$ROOT" && supabase status >/dev/null 2>&1); then
  echo ""
  echo "→ supabase test db"
  (cd "$ROOT" && supabase test db)
else
  SUPABASE_PENDIENTE="1"
  echo "! Supabase local no está levantado: pruebas de base de datos NO EJECUTADAS (supabase start)."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
if [ -n "$SUPABASE_PENDIENTE" ]; then
  echo "  ✓ verify OK, sin las pruebas de base de datos (no ejecutadas)"
else
  echo "  ✓ verify OK"
fi
echo "═══════════════════════════════════════════════════════"
