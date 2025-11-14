#!/bin/sh
# Fork/exec fixture: spawn a background reader that writes a temp file,
# then run a few common commands if available to produce additional trace lines.
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
OUT="$BASE_DIR/tmp/fork_exec_out"
rm -f "$OUT"

# background read of /etc/passwd (should exist on most Linux systems)
if [ -r /etc/passwd ]; then
	(cat /etc/passwd > "$OUT" 2>/dev/null &) || true
else
	# fallback: try /proc/version
	(cat /proc/version > "$OUT" 2>/dev/null &) || true
fi

# run a few common commands if present
if command -v ls >/dev/null 2>&1; then
	ls / >/dev/null 2>&1 || true
fi
if command -v uname >/dev/null 2>&1; then
	uname -a >/dev/null 2>&1 || true
fi

exit 0
