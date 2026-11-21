#!/usr/bin/env bash
set -euo pipefail

UPSTREAM_REPO="https://github.com/classabbyamp/espresso-logic.git"
UPSTREAM_COMMIT="85265139e9598852f9388d293658a1977a829a01"

OUT="$(cd "$(dirname "$0")" && pwd)/espresso.wasm"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Using $(zig version 2>/dev/null || { echo 'zig not found in PATH' >&2; exit 1; })"

git clone --quiet "$UPSTREAM_REPO" "$WORK/espresso-logic"
git -C "$WORK/espresso-logic" checkout --quiet "$UPSTREAM_COMMIT"
cd "$WORK/espresso-logic/espresso-src"

sed -i \
  -e 's|^\(\s*struct rlimit rlp_st.*\)$|//\1|' \
  -e 's|^\(\s*rlp->rlim_cur = seconds;\)$|//\1|' \
  -e 's|^\(\s*setrlimit(RLIMIT_CPU, rlp);\)$|//\1|' \
  util_signature.c

# strdup.c duplicates the strdup() provided by wasi-libc.
SOURCES=$(ls *.c | grep -v '^strdup\.c$')

# -std=gnu99: the K&R-era code uses identifiers like `false` as goto labels.
zig cc \
  -target wasm32-wasi \
  -std=gnu99 -O2 -w \
  -D_WASI_EMULATED_SIGNAL -D_WASI_EMULATED_PROCESS_CLOCKS \
  -lwasi-emulated-signal -lwasi-emulated-process-clocks \
  $SOURCES \
  -o "$OUT"

echo "Built $OUT"
