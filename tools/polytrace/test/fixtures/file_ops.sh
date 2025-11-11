#!/bin/sh
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
A="$BASE_DIR/tmp/file_ops/a"
B="$BASE_DIR/tmp/file_ops/b"
rm -f "$A" "$B"

mkdir -p "$(dirname "$A")" 2>/dev/null || true

echo x > "$A"
cp "$A" "$B"
cat "$B" > /dev/null

exit 0
