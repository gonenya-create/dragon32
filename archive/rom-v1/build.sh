#!/bin/sh
# בונה את ה-ROM: rom/build/d32.rom (16K, נטען במקום BASIC המקורי ב-$8000)
# ו-rom/build/d32x.rom (8K, שבב ההרחבה בחריץ המחסנית ב-$C000)
set -e
cd "$(dirname "$0")/src"
mkdir -p ../build
asm6809 -B -o ../build/all.bin -l ../build/d32.lst -s ../build/d32.sym boot.s
size=$(wc -c < ../build/all.bin)
if [ "$size" -gt 24576 ]; then echo "ההרחבה גדולה מ-8K ($size)"; exit 1; fi
head -c 16384 ../build/all.bin > ../build/d32.rom
# ההרחבה מרופדת ל-8K
{ tail -c +16385 ../build/all.bin; head -c $((24576 - size)) /dev/zero; } > ../build/d32x.rom
rm ../build/all.bin
# העותק לדף הניסוי באפליקציה (lab/1982)
cp ../build/d32.rom ../build/d32x.rom ../../lab/1982/
