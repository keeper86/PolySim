#!/bin/sh
# Hardlink + chmod fixture: create a file, hardlink if possible, chmod link if possible
A_BASE_DIR=$(cd "$(dirname "$0")" && pwd)
A="$A_BASE_DIR/tmp/hard_link/hard_a"
B="$A_BASE_DIR/tmp/hard_link/hard_b"
rm -f "$A" "$B"
mkdir -p "$(dirname "$A")" 2>/dev/null || true

printf '%s\n' "hard" > "$A" 2>/dev/null || echo "hard" > "$A" 2>/dev/null || true

# create hardlink if ln supports it (most systems do); ignore failures
if command -v ln >/dev/null 2>&1; then
	ln "$A" "$B" 2>/dev/null || cp "$A" "$B" 2>/dev/null || true
else
	cat "$A" > "$B" 2>/dev/null || true
fi

if command -v chmod >/dev/null 2>&1; then
	chmod 600 "$B" 2>/dev/null || true
fi

exit 0
