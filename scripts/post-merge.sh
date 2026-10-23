#!/usr/bin/env bash
set -euo pipefail

# Regenerate the lockfile with the Bun version configured by this Repl.
bun install
bun run db:migrate:dev
bun run build
