#!/usr/bin/env bash
#
# Publica las apps de desarrollo en internet con Tailscale Funnel, para que alguien sin Tailscale
# las pruebe. Funnel solo sirve HTTPS y solo en los puertos 443, 8443 y 10000: una app en cada uno y
# Supabase local en /supabase de cada app. `urlEnEsteEquipo` (packages/ui/app/utils/equipo-local.ts)
# sigue el mismo reparto.
#
#   https://<equipo>.<tailnet>.ts.net         Admin      (localhost:3000)
#   https://<equipo>.<tailnet>.ts.net:8443    Player     (localhost:3001)
#   https://<equipo>.<tailnet>.ts.net:10000   Educators  (localhost:3002)
#   …/supabase en cada una                    Supabase   (localhost:54321)
#
# Uso: ./scripts/funnel.sh        publica (con las apps y Supabase local en marcha)
#      ./scripts/funnel.sh off    deja de publicar
#
# Mientras está publicado, cualquiera con el enlace llega a las apps y a la API de Supabase local,
# cuyas claves son las de ejemplo de Supabase (públicas). Solo datos de prueba, y apágalo al terminar.

set -euo pipefail

if [[ "${1:-}" == "off" ]]; then
  tailscale funnel reset
  echo "Funnel apagado."
  exit 0
fi

for par in 443:3000 8443:3001 10000:3002; do
  publico=${par%%:*}
  local_=${par##*:}
  tailscale funnel --bg --yes --https="$publico" "http://127.0.0.1:$local_" >/dev/null
  tailscale funnel --bg --yes --https="$publico" --set-path=/supabase http://127.0.0.1:54321 >/dev/null
done

tailscale funnel status
