#!/bin/sh
# בונה את ה-ROM החדש (מסלול א) ומדפיס את הגודל בבתים. הרצה: sh rom/build-s1.sh
# אם המקור כבר מתאסף כמו שהוא (כל הגושים הקבועים במקומם: ה-fill עד הכתובת היה נכשל אחרת), לא מסדרים מחדש.
# הסידור מחדש (fixbr, shorten, islands) לא תמיד מגיע לאותו פתרון, ולכן רק כשצריך (30.10). FORCE=1 מכריח סידור
set -e
cd "$(dirname "$0")/src"
# בודקים גם שכל גוש ב-islands.s באמת מוצב בכתובת שלו (גוש חדש שעוד לא הוצב: מסדרים)
placed() { python3 -c '
import re,sys
want=set(re.findall(r"@island \$([0-9A-Fa-f]{4})",open("islands.s").read()))
lst=open("../build/s1.lst",encoding="utf-8",errors="replace").read().split("\n")
have={l[:4].lower() for l in lst if re.match(r"[0-9A-F]{4} [0-9A-F]",l) and ";@isl" in l and "fill" not in l and not re.search(r"bra\s+isl_[0-9a-f]{4}_e\s",l)}
sys.exit(0 if {w.lower() for w in want}<=have else 1)'; }
if [ -z "$FORCE" ] && asm6809 -B -o ../build/s1.rom -l ../build/s1.lst -s ../build/s1.sym exp.s 2>/dev/null && placed; then
  echo "islands: in place (no re-placement)"
else
  python3 ../tools/fixbr.py >/dev/null
  python3 ../tools/shorten.py >/dev/null
  python3 ../tools/islands.py
  asm6809 -B -o ../build/s1.rom -l ../build/s1.lst -s ../build/s1.sym exp.s
fi
awk '$3>=32768 && $3<49152 {if($3>m)m=$3} END{print m-32768}' ../build/s1.sym
