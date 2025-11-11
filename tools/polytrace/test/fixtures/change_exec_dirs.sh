#!/bin/sh
BASE_DIR=$(cd "$(dirname "$0")" && pwd)
OUT="$BASE_DIR/tmp/change_exec_dirs_out/tmp/"
rm -rf "$OUT"
mkdir -p "$OUT"
echo "
#!/bin/sh
BASE_DIR=\$(cd \"\$(dirname \"\$0\")\" && pwd)
echo hallo > test.txt
exit 0
" > "$OUT/copied_script.sh"
chmod +x "$OUT/copied_script.sh"
cd "$OUT"
./copied_script.sh
cd -
exit 0
