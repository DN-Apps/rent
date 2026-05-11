#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

DIRS=(
  "src/app/[locale]"
  "src/components/ui"
  "src/components/rooms"
  "src/components/booking"
  "src/components/contact"
  "src/lib"
  "src/actions"
  "src/types"
  "src/messages"
)

for rel_dir in "${DIRS[@]}"; do
  abs_dir="${ROOT_DIR}/${rel_dir}"
  mkdir -p "${abs_dir}"
  touch "${abs_dir}/.gitkeep"
  echo "Created: ${rel_dir}/.gitkeep"
done

echo "Done. Source structure is ready."
