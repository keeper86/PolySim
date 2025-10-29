#!/bin/bash
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE"

# Build test program
g++ -std=c++17 testprog.cpp -o testprog

# Delete old run zip artifacts and run_*/ dirs so only the latest remains
echo "Cleaning old run_*.zip files and run_*/ dirs in parent and tests dir..."
rm -f ../run_*.zip
rm -rf ../run_*
rm -f run_*.zip
rm -rf run_*

# run the tracer against the test program
echo "hello" > input.txt

# Run trace wrapper (the binary is expected one level up)
../polysim_ctrace ./testprog

# Find created zip (newest)
ZIP=$(ls -t ./run_*.zip 2>/dev/null | head -n1 || true)
if [ -z "${ZIP:-}" ]; then
  echo "No zip created" >&2
  exit 2
fi

# List zip contents
unzip -l "$ZIP"

# Check that output.txt was archived
if unzip -l "$ZIP" | grep -q "output.txt"; then
  echo "TEST PASS: output.txt found in $ZIP"
else
  echo "TEST FAIL: output.txt not found in $ZIP" >&2
fi

 # --- Validate hashes in outputs_manifest.json ---
echo "Validating hashes from JSON manifest inside $ZIP"
TMPDIR=$(mktemp -d)
unzip -p "$ZIP" outputs_manifest.json > "$TMPDIR/outputs_manifest.json" || { echo "No outputs_manifest.json in $ZIP" >&2; exit 4; }

echo "Manifest content:" && sed -n '1,200p' "$TMPDIR/outputs_manifest.json"

# Use Python to parse JSON and validate hashes
python3 - "$TMPDIR/outputs_manifest.json" <<'PY'
import json,sys,subprocess,os
path=sys.argv[1]
with open(path,'r') as f:
  data=json.load(f)
ok=True
for entry in data.get('files',[]):
  p=entry.get('path')
  expected=entry.get('sha256','')
  # try as absolute, then relative to tests dir
  if os.path.isfile(p):
    source=p
  elif os.path.isfile(os.path.join('.',p)):
    source=os.path.join('.',p)
  else:
    print(f'WARN: file {p} not found on disk; cannot validate',file=sys.stderr)
    ok=False
    continue
  res=subprocess.run(['sha256sum',source],capture_output=True,text=True)
  actual=res.stdout.split()[0] if res.stdout else ''
  if actual==expected:
    print(f'OK: {p} matches manifest')
  else:
    print(f'MISMATCH: {p} manifest={expected} actual={actual}',file=sys.stderr)
    ok=False
if ok:
  print('HASH VALIDATION PASS')
  sys.exit(0)
else:
  print('HASH VALIDATION FAILED',file=sys.stderr)
  sys.exit(5)
PY
