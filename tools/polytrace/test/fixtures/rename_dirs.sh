#!/bin/sh
# Rename across dirs fixture: create two dirs, create file in dir1 and move to dir2

BASE_DIR=$(cd "$(dirname "$0")" && pwd)
D1="$BASE_DIR/tmp/rename_dirs/dir1"
D2="$BASE_DIR/tmp/rename_dirs/dir2"
F1="$D1/file"
F2="$D2/file"
rm -f "$F1" "$F2"
rmdir "$D1" 2>/dev/null || true
rmdir "$D2" 2>/dev/null || true

mkdir -p "$D1" "$D2" 2>/dev/null || true

# create file; use printf if echo behaves differently
printf '%s\n' "hello" > "$F1" 2>/dev/null || echo "hello" > "$F1" 2>/dev/null || true

mv "$F1" "$F2" 2>/dev/null || cp "$F1" "$F2" 2>/dev/null || true

exit 0
