# Builds the 12 JUNGLE KING round-1 maps (32x21) from a compact spec and prints JS.
import json, sys
W, H = 32, 21
def new(): return [['.'] * W for _ in range(H)]
def plat(m, r, c0, c1, ch='='):
    for c in range(c0, c1 + 1): m[r][c] = ch
def block(m, r0, r1, c0, c1, ch='#'):
    for r in range(r0, r1 + 1):
        for c in range(c0, c1 + 1): m[r][c] = ch
def rope(m, c, r0, r1, gap=()):
    for r in range(r0, r1 + 1):
        if r not in gap: m[r][c] = '|'
def put(m, r, c, ch): m[r][c] = ch
def walls(m): block(m, 0, 20, 0, 1); block(m, 0, 20, 30, 31); plat(m, 20, 0, 31, '#')
S = []
def add(id, name, m, **meta):
    rows = [''.join(r) for r in m]
    assert len(rows) == H and all(len(r) == W for r in rows)
    S.append(dict(id=id, name=name, map=rows, **meta))

# ---- WORLD 1: ROOTS ----
m = new(); walls(m)
plat(m, 5, 6, 17); plat(m, 10, 2, 21); plat(m, 15, 10, 29)
rope(m, 26, 16, 19); rope(m, 14, 11, 14); rope(m, 9, 6, 9)
block(m, 3, 4, 6, 7, 'E'); put(m, 4, 15, 'K'); put(m, 19, 4, 'P')
put(m, 19, 16, 'T'); put(m, 14, 27, 'T'); put(m, 9, 4, 'T')
add('1-1', 'THE FIRST STEP', m, time=60, rate=260, dir=-1)

m = new(); walls(m)
plat(m, 12, 2, 7); plat(m, 12, 10, 15); plat(m, 5, 16, 28); plat(m, 13, 26, 29)
rope(m, 12, 13, 19)
put(m, 19, 8, 'M'); put(m, 11, 14, 'M'); put(m, 19, 23, 'M')
block(m, 3, 4, 27, 28, 'E'); put(m, 4, 22, 'K'); put(m, 19, 3, 'P')
put(m, 11, 3, 'T'); put(m, 12, 28, 'T'); put(m, 4, 22, 'T')
add('1-2', 'MUSHROOM HOP', m, time=60, rate=230, dir=-1)

m = new(); walls(m)
plat(m, 16, 2, 22); plat(m, 12, 8, 29); plat(m, 8, 2, 22); plat(m, 4, 14, 29)
rope(m, 20, 17, 19); rope(m, 10, 13, 15); rope(m, 20, 9, 11); rope(m, 16, 5, 7)
block(m, 2, 3, 28, 29, 'E'); put(m, 3, 26, 'K'); put(m, 11, 18, 'S'); put(m, 19, 4, 'P')
put(m, 15, 4, 'T'); put(m, 11, 27, 'T'); put(m, 7, 3, 'T')
add('1-3', 'THE TANGLED ROOTS', m, time=60, rate=170, dir=-1)

m = new(); walls(m)
plat(m, 16, 2, 12); plat(m, 16, 16, 29); plat(m, 11, 4, 27); plat(m, 6, 2, 20)
rope(m, 6, 17, 19); rope(m, 24, 12, 15); rope(m, 8, 7, 10)
put(m, 13, 24, 'R'); put(m, 8, 8, 'R')
put(m, 15, 22, 'S'); put(m, 10, 13, 'S'); put(m, 5, 15, 'S')
block(m, 4, 5, 2, 3, 'E'); put(m, 19, 14, 'P')
put(m, 19, 27, 'T'); put(m, 15, 10, 'T'); put(m, 10, 26, 'T')
add('1-4', 'SNAKE PIT', m, time=60)

m = new(); block(m, 0, 20, 0, 9); block(m, 0, 20, 22, 31); plat(m, 20, 10, 21, '#')
plat(m, 16, 10, 13); plat(m, 12, 18, 21); plat(m, 8, 10, 13); plat(m, 4, 18, 21)
rope(m, 14, 9, 19); rope(m, 16, 2, 14, gap=(7,))
block(m, 6, 7, 9, 9, 'c')
block(m, 2, 3, 20, 21, 'E'); put(m, 3, 19, 'K'); put(m, 19, 12, 'P')
put(m, 15, 11, 'T'); put(m, 11, 20, 'T'); put(m, 19, 19, 'T')
add('1-5', 'THE DEEP SHAFT', m, time=60, rate=150, dir=0, dropX=126)

m = new(); walls(m)
plat(m, 16, 2, 6); plat(m, 16, 25, 29); plat(m, 12, 10, 21)
rope(m, 4, 17, 19); rope(m, 27, 17, 19)
put(m, 19, 15, 'M'); block(m, 10, 11, 15, 16, 'E'); put(m, 19, 8, 'G'); put(m, 15, 3, 'P')
put(m, 15, 5, 'T'); put(m, 15, 28, 'T'); put(m, 11, 11, 'T')
add('1-6', 'THE ROOT GATE', m, time=75, guard='beetle', passes=3)

# ---- WORLD 2: SWAMPS ----
def swamp(m, l_top, l_end, r_top, r_start):
    block(m, l_top, 20, 0, l_end); block(m, r_top, 20, r_start, 31); block(m, 18, 20, l_end + 1, r_start - 1, '~')

m = new(); swamp(m, 14, 9, 12, 22)
put(m, 2, 15, 'V'); block(m, 10, 11, 28, 29, 'E'); put(m, 13, 3, 'P')
put(m, 9, 16, 'T'); put(m, 13, 6, 'T'); put(m, 11, 25, 'T')
add('2-1', 'MUDDY BANK', m, time=60, vines=[80])

m = new(); swamp(m, 15, 6, 14, 25)
put(m, 18, 10, 'C'); put(m, 18, 16, 'L'); put(m, 2, 19, 'V'); put(m, 13, 27, 'F')
block(m, 12, 13, 29, 30, 'E'); put(m, 14, 2, 'P')
put(m, 15, 18, 'T'); put(m, 14, 4, 'T'); put(m, 13, 25, 'T')
add('2-2', 'CROC CREEK', m, time=60, vines=[96], logs=[[15, 22]], frogHop=[[26, 28]])

m = new(); swamp(m, 16, 3, 16, 28)
for c in (6, 9, 12, 15, 18, 21, 24): put(m, 18, c, 'O')
plat(m, 15, 12, 18); put(m, 17, 15, 'F')
block(m, 14, 15, 29, 30, 'E'); put(m, 15, 1, 'P')
put(m, 14, 15, 'T'); put(m, 16, 21, 'T'); put(m, 15, 2, 'T')
add('2-3', 'LILY HOP', m, time=60, frogHop=[[12, 18]])

m = new(); swamp(m, 13, 4, 13, 27)
for c in (9, 16, 23): put(m, 2, c, 'V')
put(m, 8, 13, 'Q'); put(m, 10, 20, 'Q')
plat(m, 5, 0, 4, '#'); block(m, 3, 4, 1, 1, 'c')
block(m, 11, 12, 29, 30, 'E'); put(m, 12, 2, 'P')
put(m, 10, 12, 'T'); put(m, 10, 19, 'T'); put(m, 12, 28, 'T')
add('2-4', 'MOSQUITO MARSH', m, time=60, vines=[80, 80, 80])

m = new(); swamp(m, 16, 3, 12, 28)
plat(m, 12, 26, 27); rope(m, 27, 13, 17)
put(m, 18, 7, 'l'); put(m, 18, 15, 'l'); put(m, 18, 22, 'l')
plat(m, 6, 10, 18); put(m, 5, 11, 'K')
block(m, 10, 11, 29, 30, 'E'); put(m, 15, 1, 'P')
put(m, 16, 10, 'T'); put(m, 15, 20, 'T'); put(m, 11, 29, 'T')
add('2-5', 'THE SINKING LOGS', m, time=60, rate=200, dir=1, logs=[[5, 12], [13, 20], [19, 25]])

m = new(); swamp(m, 15, 5, 15, 26)
put(m, 18, 7, 'G'); put(m, 3, 22, 'V')
block(m, 13, 14, 29, 30, 'E'); put(m, 14, 2, 'P')
put(m, 16, 12, 'T'); put(m, 12, 16, 'T'); put(m, 14, 27, 'T')
add('2-6', "OLD CROC'S MOUTH", m, time=75, guard='croc', vines=[72])

out = '// JUNGLE KING: מפות המסכים. נוצר ב-tools/king/screens.py (לא לערוך ביד: משנים שם ומריצים מחדש).\n'
out += '// כל מסך: 32×21 אריחים. # קיר/קרקע, = שורש או ענף (עומדים עליו מלמעלה), | חבל או ליאנה, ~ מים, E יציאה, c סדק סודי.\n'
out += '// דמויות וחפצים: P התחלה, T חלק קלטת, K קוף שזורק חביות, S נחש, R נחש על חבל, M פטרייה, G שומר, V ליאנה מתנדנדת,\n'
out += '// C תנין, F צפרדע, O עלה לוטוס, L בול עץ צף, l בול עץ ששוקע, Q נחיל יתושים.\n'
out += 'export const SCREENS = ' + json.dumps(S, indent=1, ensure_ascii=False) + ';\n'
sys.stdout.write(out)
