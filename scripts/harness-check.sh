#!/usr/bin/env bash
# Comprueba la estructura de eslui-harness sin modificar el proyecto.
# No ejecuta verify.sh ni evalúa comandos del contexto o documentación.
# Salida: 0 = estructura válida (puede haber avisos), 1 = errores, 2 = uso.

set -u

if [ "$#" -ne 0 ]; then
  printf '%s\n' 'Uso: bash scripts/harness-check.sh' >&2
  exit 2
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)" || exit 1
PROJECT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)" || exit 1
errors=0
warnings=0

ok() { printf 'OK    %s\n' "$1"; }
warn() { printf 'AVISO %s\n' "$1"; warnings=$((warnings + 1)); }
fail() { printf 'ERROR %s\n' "$1"; errors=$((errors + 1)); }

printf '%s\n' 'eslui-harness: comprobación de estructura'

required_files=(
  'AGENTS.md'
  '.harness/VERSION'
  '.harness/core.md'
  '.harness/project.md'
  '.harness/workflows/integrate.md'
  '.harness/workflows/context.md'
  '.harness/workflows/plan.md'
  '.harness/workflows/implement.md'
  '.harness/workflows/review.md'
  '.harness/workflows/update.md'
  '.harness/templates/task.md'
  '.harness/templates/decision.md'
  'docs/README.md'
  'docs/decisions/README.md'
  'skills/README.md'
  'tasks/README.md'
  'scripts/verify.sh'
)

missing=0
for relative_path in "${required_files[@]}"; do
  if [ ! -f "$PROJECT_DIR/$relative_path" ] || [ ! -s "$PROJECT_DIR/$relative_path" ]; then
    fail "Falta el archivo o está vacío: $relative_path"
    missing=$((missing + 1))
  fi
done
if [ "$missing" -eq 0 ]; then
  ok 'Archivos base presentes y no vacíos.'
fi

if [ -s "$PROJECT_DIR/.harness/VERSION" ]; then
  version="$(tr -d '\r\n' < "$PROJECT_DIR/.harness/VERSION")"
  if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    ok "Versión registrada: $version"
  else
    fail 'La versión debe usar el formato numérico X.Y.Z.'
  fi
fi

if [ -s "$PROJECT_DIR/AGENTS.md" ]; then
  if awk '
    $0 == "<!-- eslui-harness:start -->" { starts++; start_line = NR }
    $0 == "<!-- eslui-harness:end -->" { ends++; end_line = NR }
    END { exit !(starts == 1 && ends == 1 && start_line < end_line) }
  ' "$PROJECT_DIR/AGENTS.md"; then
    ok 'Un único bloque de entrada delimitado en AGENTS.md.'
  else
    fail 'AGENTS.md debe tener un solo bloque eslui-harness:start/end, en orden.'
  fi

  agents_text="$(< "$PROJECT_DIR/AGENTS.md")"
  if [[ "$agents_text" == *'.harness/core.md'* && "$agents_text" == *'.harness/project.md'* ]]; then
    ok 'AGENTS.md referencia contrato y contexto.'
  else
    fail 'Falta la referencia al contrato o al contexto en AGENTS.md.'
  fi
fi

if [ -s "$PROJECT_DIR/.harness/project.md" ]; then
  context_state="$(sed -n 's/^Estado del contexto: //p' "$PROJECT_DIR/.harness/project.md")"
  case "$context_state" in
    listo) ok 'Contexto marcado como listo; su contenido requiere revisión del agente.' ;;
    parcial|pendiente) warn "Contexto $context_state; consulta los pendientes antes del trabajo que dependa de ellos." ;;
    *) warn 'No hay un estado único reconocido del contexto (pendiente, parcial o listo).' ;;
  esac
fi

if [ -s "$PROJECT_DIR/scripts/verify.sh" ]; then
  if awk '/ESLUI_VERIFY_UNCONFIGURED/ { found = 1 } END { exit !found }' "$PROJECT_DIR/scripts/verify.sh"; then
    warn 'verify.sh conserva el marcador SIN CONFIGURAR; no hay evidencia de verificación del software.'
  else
    ok 'Entrada de verificación presente, sin ejecutar. Consulta su cobertura en project.md.'
  fi
fi

printf '\nResultado: %s error(es), %s aviso(s).\n' "$errors" "$warnings"
printf '%s\n' \
  'Este script solo comprueba estructura, referencias de entrada y marcadores.' \
  'No valida todos los enlaces, la calidad del contexto ni el funcionamiento de la aplicación.'

if [ "$errors" -gt 0 ]; then
  exit 1
fi
exit 0
