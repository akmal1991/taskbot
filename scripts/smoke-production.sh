#!/usr/bin/env bash
set -euo pipefail
readonly port="${SMOKE_PRODUCTION_PORT:-5002}"
readonly temp_dir="$(mktemp -d)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; fi
  rm -rf "$temp_dir"
}
trap cleanup EXIT
if curl -fsS --max-time 1 "http://127.0.0.1:$port/api/health" >/dev/null 2>&1; then
  echo "Production smoke-test port $port is in use." >&2; exit 1
fi
PORT="$port" NODE_ENV=production bun server/index.ts >"$temp_dir/server.log" 2>&1 &
server_pid=$!
ready=false
for attempt in $(seq 1 30); do
  if ! kill -0 "$server_pid" 2>/dev/null; then cat "$temp_dir/server.log" >&2; exit 1; fi
  if curl -fsS --max-time 2 "http://127.0.0.1:$port/api/health" >"$temp_dir/health.json" 2>/dev/null; then ready=true; break; fi
  sleep 1
done
if [[ "$ready" != true ]]; then cat "$temp_dir/server.log" >&2; exit 1; fi
curl -fsS -D "$temp_dir/headers" "http://127.0.0.1:$port/" >"$temp_dir/index.html"
grep -q '<div id="root"></div>' "$temp_dir/index.html"
grep -qi '^content-security-policy:' "$temp_dir/headers"
asset="$(grep -o '/assets/[^"]*\.js' "$temp_dir/index.html" | head -1)"
[[ -n "$asset" ]]
curl -fsS "http://127.0.0.1:$port$asset" >/dev/null
[[ "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/api/state")" == 401 ]]
curl -fsS "http://127.0.0.1:$port/api/auth/me" | grep -q '"user":null'
echo "Production startup, database health, built assets, CSP, and authorization smoke checks passed."
