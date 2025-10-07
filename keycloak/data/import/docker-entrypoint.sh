#!/bin/sh
set -e

if /opt/keycloak/bin/kc.sh start --optimized; then
  exit 0
else
  echo "[Keycloak] Optimized start failed, assuming first deployment. Retrying with import-realm..."
  /opt/keycloak/bin/kc.sh start --import-realm
fi