#!/bin/sh
# בונה את ה-ROM: rom/build/d32.rom (16K, נטען במקום BASIC המקורי ב-$8000)
set -e
cd "$(dirname "$0")/src"
mkdir -p ../build
asm6809 -B -o ../build/d32.rom -l ../build/d32.lst -s ../build/d32.sym boot.s
# העותק לדף הניסוי באפליקציה (lab/1982)
cp ../build/d32.rom ../../lab/1982/d32.rom
