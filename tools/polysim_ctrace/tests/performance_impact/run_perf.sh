#!/usr/bin/env bash
set -euo pipefail

# Build simulator
g++ -std=c++17 sim.cpp -O2 -o sim

TRIALS=5
# durations to sweep (seconds)
DURS=(0.5 1 2 4 8)

MODES=(cpu occasional_io frequent_io open_close large_io)

OUT=perf_results_ext.csv
# add run_type column to distinguish native/wrapped
echo "mode,trial,mode_duration_sec,wall_time_sec,input_count,output_count,zip_bytes,run_type" > ${OUT}

for mode in "${MODES[@]}"; do
  echo "=== mode: ${mode} ==="
  for DUR in "${DURS[@]}"; do
    echo "--- duration: ${DUR}s ---"
  # native runs
    for i in $(seq 1 ${TRIALS}); do
      start=$(date +%s.%N)
      ./sim ${DUR} ${mode}
      end=$(date +%s.%N)
      dur=$(python3 -c "print(${end} - ${start})")
      # no wrapper activity
      echo "${mode},${i},${DUR},${dur},0,0,0,native" >> ${OUT}
    done

  # wrapped runs
    for i in $(seq 1 ${TRIALS}); do
    start=$(date +%s.%N)
    # run tracer and capture stdout for counts
    TMP_OUT=$(mktemp)
    # ensure tracer exists
    if [ -x ../polysim_ctrace ]; then
      TRACER=../polysim_ctrace
    elif [ -x ../../polysim_ctrace ]; then
      TRACER=../../polysim_ctrace
    else
      echo "polysim_ctrace missing; building..."
      (cd ../.. && make)
      if [ -x ../../polysim_ctrace ]; then
        TRACER=../../polysim_ctrace
      else
        echo "could not build tracer" >&2
        exit 1
      fi
    fi
  ${TRACER} ./sim ${DUR} ${mode} 2>&1 | tee ${TMP_OUT}
    end=$(date +%s.%N)
    dur=$(python3 -c "print(${end} - ${start})")
    # count INPUT/OUTPUT lines
    input_count=$(grep -c "\[INPUT\]" ${TMP_OUT} || true)
    output_count=$(grep -c "\[OUTPUT\]" ${TMP_OUT} || true)
    # find the created zip file and size
    ZIP=$(ls -1t run_*.zip 2>/dev/null | head -n1 || true)
    if [ -n "${ZIP}" ]; then
      zip_bytes=$(stat -c%s "${ZIP}" || echo 0)
    else
      zip_bytes=0
    fi
    echo "${mode},${i},${DUR},${dur},${input_count},${output_count},${zip_bytes},wrapped" >> ${OUT}
    rm -f ${TMP_OUT}
  done
  done
done

echo "Extended results written to ${OUT}"
echo "Sample (first 10 lines):"
head -n 10 ${OUT} || true
