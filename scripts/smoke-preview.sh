#!/usr/bin/env bash
set -euo pipefail

readonly port=5000
readonly url="http://127.0.0.1:${port}/"
readonly temp_dir="$(mktemp -d)"
readonly server_log="${temp_dir}/server.log"
readonly page="${temp_dir}/index.html"
server_pid=""

cleanup() {
  if [[ -n "${server_pid}" ]]; then
    kill "${server_pid}" 2>/dev/null || true
    wait "${server_pid}" 2>/dev/null || true
  fi
  rm -rf "${temp_dir}"
}
trap cleanup EXIT

if curl --silent --fail --max-time 1 "${url}" >/dev/null; then
  echo "Preview smoke test requires port ${port} to be free." >&2
  exit 1
fi

run_command="$(
  awk '
    /^\[\[workflows\.workflow\.tasks\]\]$/ { in_task = 1; is_shell = 0; next }
    /^\[/ { in_task = 0 }
    in_task && /^task = "shell\.exec"$/ { is_shell = 1; next }
    in_task && is_shell && /^args = "/ {
      sub(/^args = "/, "")
      sub(/"$/, "")
      print
      exit
    }
  ' .replit
)"

if [[ -z "${run_command}" ]]; then
  echo "Could not find the Replit shell workflow command in .replit." >&2
  exit 1
fi

bash -c "${run_command}" >"${server_log}" 2>&1 &
server_pid=$!

for attempt in $(seq 1 30); do
  if ! kill -0 "${server_pid}" 2>/dev/null; then
    echo "Preview server exited before becoming ready. Startup output:" >&2
    cat "${server_log}" >&2
    exit 1
  fi

  status="$(
    curl --silent --show-error --max-time 2 \
      --output "${page}" --write-out '%{http_code}' "${url}" 2>/dev/null || true
  )"
  if [[ "${status}" == "200" ]]; then
    if ! grep --fixed-strings --quiet '<div id="root"></div>' "${page}" \
      || ! grep --fixed-strings --quiet '/src/main.tsx' "${page}"; then
      echo "Preview returned HTTP 200, but the app entry page is missing its root or main script." >&2
      cat "${page}" >&2
      exit 1
    fi

    echo "Preview smoke test passed: ${url} returned the app entry page."
    exit 0
  fi

  sleep 1
done

echo "Preview server did not serve the app entry page on port ${port} within 30 seconds." >&2
cat "${server_log}" >&2
exit 1
