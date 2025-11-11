#!/bin/sh
# Concurrent append fixture: spawn multiple background appenders.
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
F="$BASE_DIR/tmp/concurrent_append_file"
rm -f "$F"

# append using sh builtins or echo; ensure subshells do not fail the script
(printf 'a\n' >> "$F" &) || (echo a >> "$F" &) || true
(printf 'b\n' >> "$F" &) || (echo b >> "$F" &) || true
(printf 'c\n' >> "$F" &) || (echo c >> "$F" &) || true
wait 2>/dev/null || true

cat "$F" > /dev/null 2>/dev/null || true
exit 0
