#!/bin/sh
# Pipeline fixture: use sed if available, otherwise fall back to head/cat
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
OUT="$BASE_DIR/tmp/pipeline_out/1"
OUT2="$BASE_DIR/tmp/pipeline_out/2"
SYM="$BASE_DIR/tmp/pipeline_out/symlink"
rm -f "$OUT" "$OUT2" "$SYM"

mkdir -p "$(dirname "$OUT")" 2>/dev/null || true

if command -v sed >/dev/null 2>&1; then
	sed -n '1,5p' /etc/hosts > "$OUT" 2>/dev/null || cat /etc/hosts | head -n 5 > "$OUT" 2>/dev/null || true
else
	# fallback: try head, otherwise cat entire file
	if command -v head >/dev/null 2>&1; then
		head -n 5 /etc/hosts > "$OUT" 2>/dev/null || cat /etc/hosts > "$OUT" 2>/dev/null || true
	else
		cat /etc/hosts > "$OUT" 2>/dev/null || true
	fi
fi

# create symlink if possible
ln -s "$OUT" "$SYM" 2>/dev/null || true
mv "$OUT" "$OUT2" 2>/dev/null || true
exit 0
