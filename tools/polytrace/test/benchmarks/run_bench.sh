#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

require_bin() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 2
  fi
}

find_newest_zip() {
  local glob="$1"
  shopt -s nullglob
  local files=( $glob )
  shopt -u nullglob
  if [ ${#files[@]} -eq 0 ]; then
    echo ""
    return
  fi
  ls -t -- "${files[@]}" 2>/dev/null | head -n1 || true
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/../.."
TRACER="$ROOT_DIR/build/bin/trace"
TARGET="$ROOT_DIR/build/bin/bench_program"

ZIP_GLOB='*.zip'

require_bin unzip
require_bin jq

if [ ! -x "$TRACER" ]; then
  echo "Warning: tracer not executable or missing at: $TRACER" >&2
fi
if [ ! -x "$TARGET" ]; then
  echo "Warning: bench program not executable or missing at: $TARGET" >&2
fi

RESULT_CSV="$SCRIPT_DIR/results.csv"
if [ ! -f "$RESULT_CSV" ]; then
  echo "run_id,wall_ms_traced,traced_ms,postproc_ms,wall_ms_untraced" > "$RESULT_CSV"
fi

BENCH_JSONS=("$SCRIPT_DIR"/*.json)
if [ ${#BENCH_JSONS[@]} -eq 0 ]; then
  echo "No benchmark JSON files found in $SCRIPT_DIR" >&2
fi

run_count=0
for benchjson in "${BENCH_JSONS[@]}"; do
  benchname=$(basename "$benchjson" .json)

  has_plan=0
  if jq -e 'has("plan")' "$benchjson" >/dev/null 2>&1; then
    has_plan=1
    plan_len=$(jq '.plan | length' "$benchjson")
  else
    plan_len=1
  fi

  for step_idx in $(seq 0 $((plan_len-1))); do
    tmpcfg=""
    if [ "$has_plan" -eq 1 ]; then
    tmpcfg=$(mktemp --suffix=.json)
    jq '(.bench_program // {}) as $base
      | (.plan['$step_idx'].bench_program // {}) as $s
      | {bench_program: ($base + $s)}' "$benchjson" > "$tmpcfg"
    else
      tmpcfg="$benchjson"
    fi

    step_repeats=$(jq -r '
      if (.plan?['$step_idx']?.repeats) then
        .plan['$step_idx'].repeats
      elif (.repeats != null) then
        .repeats
      else
        empty
      end' "$benchjson" 2>/dev/null || true)

    if [ -n "$step_repeats" ]; then
      STEP_REPEATS="$step_repeats"
    else
      STEP_REPEATS="1"
    fi

    for r in $(seq 1 "$STEP_REPEATS"); do
      run_count=$((run_count+1))
      run_id="run_${benchname}_step${step_idx}_${run_count}"

      pushd "$SCRIPT_DIR" >/dev/null

      cmd=("$TRACER" "$TARGET" "$tmpcfg")

      echo "[$run_id] Starting: bench=$benchname step=$step_idx repeat=$r"
      start_ns=$(date +%s%N)
      if ! "${cmd[@]}"; then
        echo "[$run_id] Command failed: ${cmd[*]}" >&2
      fi
      end_ns=$(date +%s%N)
      wall_ns=$((end_ns - start_ns))
      wall_ms=$(LC_NUMERIC=C awk -v ns="$wall_ns" 'BEGIN{printf "%.3f", ns/1000000}')

      zipfile=$(find_newest_zip "$ZIP_GLOB")
      traced_ms=""
      if [ -n "$zipfile" ]; then
        tmpdir=$(mktemp -d)
        unzip -qq "$zipfile" -d "$tmpdir" || true
        jsonf=$(find "$tmpdir" -type f -name '*.json' | head -n1 || true)
        if [ -n "$jsonf" ]; then
          candidate=$(jq -r '
            if (.activity.startedAt and .activity.endedAt) then
              ((.activity.endedAt - .activity.startedAt)/1000000)
            elif (.activities and (.activities|length>0)) then
              (reduce .activities[] as $a (0; . + ($a.endedAt - $a.startedAt)) / 1000000)
            else
              empty
            end' "$jsonf" 2>/dev/null || true)
          if [ -n "$candidate" ]; then
            traced_ms=$(LC_NUMERIC=C awk -v v="$candidate" 'BEGIN{printf "%.3f", v}')
          fi
        fi
        rm -rf "$tmpdir"
        rm -f -- "$zipfile" 2>/dev/null || true
      fi

      postproc_ms=""
      if [ -n "$traced_ms" ]; then
        w_norm=$(echo "$wall_ms" | tr ',' '.')
        t_norm=$(echo "$traced_ms" | tr ',' '.')
        postproc_ms=$(LC_NUMERIC=C awk -v w="$w_norm" -v t="$t_norm" 'BEGIN{printf "%.3f", (w - t)}')
      fi

      untraced_run_id="${run_id}_untraced"
      echo "[${untraced_run_id}] Starting untraced run: bench=$benchname step=$step_idx repeat=$r"
      start_ns_untraced=$(date +%s%N)
      if ! "$TARGET" "$tmpcfg"; then
        echo "[${untraced_run_id}] Command failed: $TARGET --config $tmpcfg" >&2
      fi
      end_ns_untraced=$(date +%s%N)
      wall_ns_untraced=$((end_ns_untraced - start_ns_untraced))
      wall_ms_untraced=$(LC_NUMERIC=C awk -v ns="$wall_ns_untraced" 'BEGIN{printf "%.3f", ns/1000000}')


      echo "${run_id},${wall_ms},${traced_ms},${postproc_ms},${wall_ms_untraced}" >> "$RESULT_CSV"
      echo "[$run_id] Done: traced_wall=${wall_ms}ms traced=${traced_ms}ms postproc=${postproc_ms}ms untraced_wall=${wall_ms_untraced}ms"

      popd >/dev/null

      rm -rf -- "$SCRIPT_DIR/bench_out" 2>/dev/null || true
      rm -rf -- "$SCRIPT_DIR/test" 2>/dev/null || true
      echo "Cleaned bench output: $SCRIPT_DIR/bench_out"
    done

    if [ "$has_plan" -eq 1 ] && [ -n "$tmpcfg" ] && [ -f "$tmpcfg" ] && [ "$tmpcfg" != "$benchjson" ]; then
      rm -f -- "$tmpcfg" || true
    fi
  done
done

echo "All runs finished. Results: $RESULT_CSV"
