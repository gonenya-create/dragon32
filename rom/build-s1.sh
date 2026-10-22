#!/bin/sh
# בונה את ה-ROM החדש (מסלול א) ומדפיס את הגודל בבתים. הרצה: sh rom/build-s1.sh
set -e
cd "$(dirname "$0")/src"
python3 ../tools/fixbr.py >/dev/null
python3 ../tools/shorten.py >/dev/null
python3 ../tools/islands.py
asm6809 -B -o ../build/s1.rom -l ../build/s1.lst -s ../build/s1.sym exp.s
awk '$3>=32768 && $3<49152 {if($3>m)m=$3} END{print m-32768}' ../build/s1.sym
