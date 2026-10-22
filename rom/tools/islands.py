# מציב את "שלטי ההפניה" בכתובות הקבועות של המקור (docs/DRAGON-SPEC-ENTRIES.md).
# הרשימה ב-src/islands.s: כל גוש מתחיל בשורה "; @island $XXXX", והקוד שלו בא אחריה.
# הכלי מכניס כל גוש לקוד המקור, לפני הפקודה שהייתה דורסת את הכתובת, עם קפיצה מעליו (כשצריך)
# ומילוי עד הכתובת. כל שורה שהכלי מכניס מסומנת ";@isl", ובכל הרצה הוא מוחק אותן ומציב מחדש.
# לא נכנסים לטבלאות (fcb/fdb/fcc/fcs/fill), ולא לאזורים שבין ";@nofill" ל-";@endnofill" (לולאות מתוזמנות).
# הרצה (מתוך build-s1.sh): python3 ../tools/islands.py   — מדפיס איפה הוצב כל גוש.
import os, re, subprocess, sys, tempfile, shutil

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src')
os.chdir(SRC)
TAG = ';@isl'
FREEGAP = 2
DATA = re.compile(r'^\S*\s+(fcb|fdb|fcc|fcs|fill|rmb|zmb|equ|org|setdp|include|end)\b', re.I)
UNCOND = re.compile(r'^\S*\s+(rts|rti|bra|lbra|jmp)\b|^\S*\s+puls\s+.*\bpc\b', re.I)

def read_blocks():
    blocks, cur = [], None
    for line in open('islands.s').read().split('\n'):
        m = re.match(r';\s*@island\s+\$([0-9A-Fa-f]{4})', line)
        if m:
            cur = {'addr': int(m.group(1), 16), 'body': []}
            blocks.append(cur)
        elif cur is not None and line.strip() and not line.lstrip().startswith(';'):
            cur['body'].append(line)
    blocks.sort(key=lambda b: b['addr'])
    return blocks

def files():
    out, seen = [], set()
    def walk(f):
        if f in seen: return
        seen.add(f); out.append(f)
        for l in open(f).read().split('\n'):
            m = re.match(r'\s+include\s+"([^"]+)"', l)
            if m: walk(m.group(1))
    walk('exp.s')
    return out

def strip_islands():
    for f in files():
        t = open(f).read().split('\n')
        u = [l for l in t if not l.rstrip().endswith(TAG)]
        if u != t: open(f, 'w').write('\n'.join(u))

def code_map():
    """מחזיר רשימה של (כתובת, קובץ, שורה, טקסט) לכל שורה שמייצרת קוד, לפי הסדר."""
    tmp = tempfile.mkdtemp()
    try:
        for f in files():
            t = open(f).read().split('\n')
            open(os.path.join(tmp, f), 'w').write('\n'.join(
                (l + ('\t' if ';' in l else '\t;') + f'@L{f}:{i+1}@') for i, l in enumerate(t)))
        r = subprocess.run(['asm6809', '-B', '-o', 'x.rom', '-l', 'x.lst', 'exp.s'], cwd=tmp, capture_output=True, text=True)
        if r.returncode:
            return None, r.stderr
        res = []
        for l in open(os.path.join(tmp, 'x.lst')).read().split('\n'):
            m = re.match(r'^([0-9A-F]{4}) ([0-9A-F]+)\s', l)
            t = re.search(r'@L([^:]+):(\d+)@', l)
            if m and t:
                res.append((int(m.group(1), 16), t.group(1), int(t.group(2))))
        return res, ''
    finally:
        shutil.rmtree(tmp)

def nofill_lines():
    bad = set()
    for f in files():
        on = first = False
        for i, l in enumerate(open(f).read().split('\n')):
            if '@nofill' in l: on = first = True; continue
            if '@endnofill' in l: on = False
            if not on: continue
            code = l.strip() and not l.lstrip().startswith(';')
            if first and code: first = False; continue   # לפני הפקודה הראשונה באזור מותר להכניס גוש
            bad.add((f, i + 1))
    return bad

def place(b, report):
    A = b['addr']
    cm, err = code_map()
    if cm is None and 'out of range' in err:   # גוש קודם הרחיק קפיצה קצרה: מאריכים אותה
        subprocess.run(['python3', '../tools/fixbr.py'], capture_output=True)
        cm, err = code_map()
    if cm is None and 'negative count for FILL' in err:
        raise Retry(err)          # גוש קודם נדחף מעבר לכתובת שלו: מתחילים סבב חדש (הקפיצות שהוארכו נשארות)
    if cm is None: sys.exit('assembly failed before placing $%04X:\n%s' % (A, err[:800]))
    bad = nofill_lines()
    text = {f: open(f).read().split('\n') for f in files()}
    best = bestfree = None
    for k, (addr, f, n) in enumerate(cm):
        if addr > A: break
        src = text[f][n - 1]
        if DATA.match(src) or (f, n) in bad: continue
        prev = text[cm[k-1][1]][cm[k-1][2] - 1] if k else ''
        if k and DATA.match(prev) and cm[k-1][0] < addr: continue   # בתוך טבלה
        free = bool(UNCOND.match(prev))
        if addr <= A - (0 if free else 2):
            best = (addr, f, n, free)
            if free: bestfree = best
    if not best: sys.exit('no place for $%04X' % A)
    # עדיף מקום בסוף שגרה (בלי קפיצה שמאטה את הקוד), אם הוא עולה עד FREEGAP בתים של מילוי
    if not best[3] and bestfree and A - bestfree[0] <= FREEGAP: best = bestfree
    addr, f, n, free = best
    lab = 'isl_%04x_e' % A
    ins = ([] if free else [f'\t\tbra\t{lab}\t{TAG}']) + [f'\t\tfill\t$ff,${A:04x}-*\t{TAG}'] + \
          [l + '\t' + TAG for l in b['body']] + ([] if free else [f'{lab}\t{TAG}'])
    L = text[f]
    # עולים מעל תוויות, הערות ושורות ריקות שלפני הפקודה, כדי שתווית לא תצביע על הגוש
    at = n - 1
    while at > 0 and (not L[at-1].strip() or L[at-1].lstrip().startswith(';') or re.match(r'^\S+\s*(;.*)?$', L[at-1])):
        at -= 1
    L[at:at] = ins
    open(f, 'w').write('\n'.join(L))
    report.append('$%04X: %s:%d (נדחף מ-$%04X, %s)' % (A, f, n, addr, 'אחרי קפיצה' if free else 'עם bra'))

def assemble_ok():
    r = subprocess.run(['asm6809', '-B', '-o', '/dev/null', 'exp.s'], capture_output=True, text=True)
    return r.returncode == 0, r.stderr

class Retry(Exception): pass

blocks = read_blocks()
err = ''
for rnd in range(8):
    strip_islands()
    report = []
    try:
        for b in blocks: place(b, report)
    except Retry as e:
        err = str(e); continue
    subprocess.run(['python3', '../tools/fixbr.py'], capture_output=True)
    ok, err = assemble_ok()
    cm, _ = code_map()
    # בדיקה: כל גוש יושב בדיוק בכתובת שלו
    if ok and cm is not None:
        starts = {}
        for addr, f, n in cm:
            line = open(f).read().split('\n')[n-1]
            if line.rstrip().endswith(TAG) and 'fill' not in line and not re.search(r'bra\tisl_[0-9a-f]{4}_e\t', line):
                starts.setdefault(addr, line)
        missing = [b for b in blocks if b['addr'] not in starts]
        err = 'not at their address: ' + ' '.join('$%04X' % b['addr'] for b in missing)
        if not missing:
            print('\n'.join(report)); print('islands: %d placed, round %d' % (len(blocks), rnd + 1)); sys.exit(0)
print(err[:800]); sys.exit('islands did not settle')
