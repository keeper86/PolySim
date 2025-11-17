#!/bin/sh
# Complex system-read fixture: try to exercise a variety of programs that
# touch many system files. Each command is guarded and failures are ignored.

# read a list of typical system files
for f in /proc/version /proc/cpuinfo /etc/os-release /etc/ld.so.cache /etc/passwd; do
  [ -r "$f" ] && cat "$f" > /dev/null 2>/dev/null || true
done

# Try ldd, readelf, strings on /bin/ls where available
if command -v ldd >/dev/null 2>&1 && [ -x /bin/ls ]; then
  ldd /bin/ls >/dev/null 2>/dev/null || true
fi
if command -v readelf >/dev/null 2>&1 && [ -x /bin/ls ]; then
  readelf -a /bin/ls >/dev/null 2>/dev/null || true
fi
if command -v strings >/dev/null 2>&1 && [ -x /bin/ls ]; then
  strings /bin/ls | head -n 10 >/dev/null 2>/dev/null || true
fi

# Run find on /etc but limit depth to avoid heavy scans (if available)
if command -v find >/dev/null 2>&1; then
  find /etc -maxdepth 2 -type f -readable -exec head -c 8 {} \; >/dev/null 2>/dev/null || true
fi

# Try df/du to produce extra I/O syscalls
if command -v df >/dev/null 2>&1; then
  df -h / >/dev/null 2>/dev/null || true
fi
if command -v du >/dev/null 2>&1; then
  du -sh /etc >/dev/null 2>/dev/null || true
fi

exit 0
