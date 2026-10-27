# Builds the 12 JUNGLE KING round-1 maps (32x21) from a compact spec and prints JS.
# Redesign (Gonen, 27.10: "אלה לא מסכים פשוטים מדי?"): every floor crosses the whole width (the rope up is always on the
# other side), gaps to jump, torn ropes, two kinds of danger per screen, tape pieces off the main path; in the swamps two
# crossings: over the water, then up and back over it on branches and vines.
# Run: python3 tools/king/screens.py > assets/dragon/carts/king-screens.js
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
def swamp(m, l_top, l_end, r_top, r_start):
    block(m, l_top, 20, 0, l_end); block(m, r_top, 20, r_start, 31); block(m, 18, 20, l_end + 1, r_start - 1, '~')
S = []
def add(id, name, m, **meta):
    rows = [''.join(r) for r in m]
    assert len(rows) == H and all(len(r) == W for r in rows), id
    S.append(dict(id=id, name=name, map=rows, **meta))

# ---------------- WORLD 1: ROOTS ----------------
# 1-1: the first zigzag. A gap to jump on the first root, barrels from the top
m = new(); walls(m)
plat(m, 16, 2, 12); plat(m, 16, 15, 25); plat(m, 12, 6, 29); plat(m, 8, 2, 26); plat(m, 4, 5, 27)
rope(m, 24, 17, 19); rope(m, 7, 13, 15); rope(m, 25, 9, 11); rope(m, 6, 5, 7)
block(m, 2, 3, 26, 27, 'E'); put(m, 3, 12, 'K'); put(m, 19, 3, 'P')
put(m, 19, 28, 'T'); put(m, 11, 28, 'T'); put(m, 7, 3, 'T')
add('1-1', 'THE FIRST STEP', m, time=60, rate=240, dir=1)

# 1-2: mushrooms lift PIP to islands; a gap at the top; a snake on the floor
m = new(); walls(m)
plat(m, 12, 3, 10); plat(m, 12, 13, 20); plat(m, 13, 24, 29); plat(m, 5, 2, 13); plat(m, 5, 17, 29)
rope(m, 19, 13, 19)
put(m, 19, 7, 'M'); put(m, 11, 9, 'M'); put(m, 19, 23, 'M')
block(m, 3, 4, 28, 29, 'E'); put(m, 4, 22, 'K'); put(m, 19, 3, 'P'); put(m, 19, 14, 'S')
put(m, 11, 17, 'T'); put(m, 12, 28, 'T'); put(m, 4, 3, 'T')
add('1-2', 'MUSHROOM HOP', m, time=60, rate=220, dir=-1)

# 1-3: four full crossings, two gaps, two snakes
m = new(); walls(m)
plat(m, 16, 2, 16); plat(m, 16, 19, 27); plat(m, 12, 4, 10); plat(m, 12, 13, 29); plat(m, 8, 2, 28); plat(m, 4, 6, 29)
rope(m, 26, 17, 19); rope(m, 5, 13, 15); rope(m, 28, 9, 11, gap=(10,)); rope(m, 7, 5, 7)
block(m, 2, 3, 28, 29, 'E'); put(m, 3, 9, 'K'); put(m, 19, 4, 'P')
put(m, 11, 20, 'S'); put(m, 7, 15, 'S')
put(m, 15, 3, 'T'); put(m, 7, 3, 'T'); put(m, 19, 29, 'T')
add('1-3', 'THE TANGLED ROOTS', m, time=60, rate=170, dir=1)

# 1-4: snakes everywhere; the snakes on the ropes rest at the top
m = new(); walls(m)
plat(m, 16, 2, 12); plat(m, 16, 16, 29); plat(m, 12, 4, 27); plat(m, 8, 2, 27); plat(m, 4, 3, 20)
rope(m, 28, 17, 19); rope(m, 4, 13, 15); rope(m, 26, 9, 11); rope(m, 18, 5, 7, gap=(6,))
put(m, 14, 4, 'R'); put(m, 10, 26, 'R')
put(m, 15, 22, 'S'); put(m, 11, 15, 'S'); put(m, 7, 8, 'S'); put(m, 3, 10, 'S')
block(m, 2, 3, 3, 4, 'E'); put(m, 19, 3, 'P')
put(m, 15, 6, 'T'); put(m, 11, 26, 'T'); put(m, 3, 19, 'T')
add('1-4', 'SNAKE PIT', m, time=60)

# 1-5: a narrow shaft; jump from each ledge to the rope on the other side; barrels drop down the middle; a secret crack
m = new(); block(m, 0, 20, 0, 9); block(m, 0, 20, 22, 31); plat(m, 20, 10, 21, '#')
plat(m, 16, 10, 14); plat(m, 12, 17, 21); plat(m, 8, 10, 14); plat(m, 4, 17, 21)
rope(m, 13, 17, 19); rope(m, 17, 13, 15); rope(m, 14, 9, 11); rope(m, 17, 5, 7)
put(m, 10, 14, 'R')
block(m, 6, 7, 9, 9, 'c')
block(m, 2, 3, 20, 21, 'E'); put(m, 3, 19, 'K'); put(m, 19, 11, 'P')
put(m, 15, 10, 'T'); put(m, 11, 21, 'T'); put(m, 19, 20, 'T')
add('1-5', 'THE DEEP SHAFT', m, time=60, rate=140, dir=0, dropX=126)

# 1-6: the guard. Dodge the giant barrel 3 times on the floor; then up the mushroom and the rope to the gate at the top
m = new(); walls(m)
plat(m, 16, 2, 6); plat(m, 16, 25, 29); plat(m, 12, 10, 21); plat(m, 6, 6, 25)
rope(m, 4, 17, 19); rope(m, 27, 17, 19); rope(m, 11, 7, 11)
put(m, 19, 15, 'M'); block(m, 4, 5, 15, 16, 'E'); put(m, 19, 8, 'G'); put(m, 15, 3, 'P'); put(m, 5, 21, 'S')
put(m, 15, 5, 'T'); put(m, 15, 28, 'T'); put(m, 5, 8, 'T')
add('1-6', 'THE ROOT GATE', m, time=75, guard='beetle', passes=3)

# ---------------- WORLD 2: SWAMPS ----------------
# 2-1: swing over the water; climb the rope on the far bank; swing back over on a higher vine
m = new(); swamp(m, 14, 7, 14, 24)
plat(m, 8, 18, 31); rope(m, 26, 9, 13); plat(m, 8, 0, 9)
put(m, 2, 15, 'V'); put(m, 1, 14, 'V')
block(m, 6, 7, 3, 4, 'E'); put(m, 13, 3, 'P')
put(m, 10, 15, 'T'); put(m, 5, 14, 'T'); put(m, 13, 29, 'T')
add('2-1', 'MUDDY BANK', m, time=60, vines=[104, 56])

# 2-2: the croc, the log and the vine; a frog on the far bank; back over on the branches, past the mosquitoes
m = new(); swamp(m, 15, 6, 14, 25)
plat(m, 8, 20, 31); rope(m, 28, 9, 13); plat(m, 8, 11, 16); plat(m, 8, 0, 7)
put(m, 18, 9, 'C'); put(m, 18, 16, 'L'); put(m, 2, 19, 'V'); put(m, 13, 27, 'F'); put(m, 6, 18, 'Q')
block(m, 6, 7, 2, 3, 'E'); put(m, 14, 2, 'P')
put(m, 16, 18, 'T'); put(m, 13, 30, 'T'); put(m, 7, 13, 'T')
add('2-2', 'CROC CREEK', m, time=60, vines=[96], logs=[[14, 22]], frogHop=[[26, 28]])

# 2-3: lily pads that sink; a frog hopping between them; back over on a vine
m = new(); swamp(m, 16, 3, 16, 28)
for c in (6, 9, 12, 15, 18, 21, 24): put(m, 18, c, 'O')
plat(m, 15, 12, 18); put(m, 17, 15, 'F')
plat(m, 8, 19, 31); rope(m, 30, 9, 15); plat(m, 8, 0, 11); put(m, 1, 15, 'V')
block(m, 6, 7, 2, 3, 'E'); put(m, 15, 1, 'P')
put(m, 14, 15, 'T'); put(m, 16, 21, 'T'); put(m, 5, 15, 'T')
add('2-3', 'LILY HOP', m, time=60, frogHop=[[12, 18]], vines=[54])

# 2-4: three vines in a row, two mosquito swarms; back over on the branches; a secret crack beside the exit
m = new(); swamp(m, 13, 4, 13, 27)
for c in (9, 16, 23): put(m, 2, c, 'V')
put(m, 8, 13, 'Q'); put(m, 10, 20, 'Q')
plat(m, 6, 22, 31); rope(m, 29, 7, 12); plat(m, 6, 12, 18); plat(m, 6, 2, 8); put(m, 4, 15, 'Q')
block(m, 1, 5, 0, 1); block(m, 4, 5, 1, 1, 'c')
block(m, 4, 5, 6, 7, 'E'); put(m, 12, 2, 'P')
put(m, 10, 12, 'T'); put(m, 10, 19, 'T'); put(m, 5, 15, 'T')
add('2-4', 'MOSQUITO MARSH', m, time=75, vines=[80, 80, 80])

# 2-5: logs that sink; barrels from the monkey float; up the rope, a vine to the monkey's branch, and on to the exit
m = new(); swamp(m, 16, 3, 12, 28)
plat(m, 12, 26, 27); rope(m, 27, 13, 17)
put(m, 18, 7, 'l'); put(m, 18, 15, 'l'); put(m, 18, 22, 'l')
plat(m, 7, 24, 31); rope(m, 30, 8, 11); put(m, 0, 21, 'V')
plat(m, 7, 10, 18); put(m, 6, 11, 'K'); plat(m, 7, 2, 6)
block(m, 5, 6, 2, 3, 'E'); put(m, 15, 1, 'P')
put(m, 16, 10, 'T'); put(m, 15, 20, 'T'); put(m, 11, 29, 'T')
add('2-5', 'THE SINKING LOGS', m, time=90, rate=280, dir=1, logs=[[5, 12], [13, 20], [19, 25]], vines=[50])

# 2-6: the old croc. Run on its back while its mouth is shut; then back over on a high vine, past a mosquito swarm
m = new(); swamp(m, 15, 5, 15, 26)
put(m, 18, 7, 'G'); put(m, 3, 22, 'V')
plat(m, 8, 20, 31); rope(m, 29, 9, 14); plat(m, 8, 13, 16); plat(m, 8, 0, 9); put(m, 6, 17, 'Q')
block(m, 6, 7, 3, 4, 'E'); put(m, 14, 2, 'P')
put(m, 16, 12, 'T'); put(m, 12, 16, 'T'); put(m, 7, 25, 'T')
add('2-6', "OLD CROC'S MOUTH", m, time=75, guard='croc', vines=[88])

out = '// JUNGLE KING: מפות המסכים. נוצר ב-tools/king/screens.py (לא לערוך ביד: משנים שם ומריצים מחדש).\n'
out += '// כל מסך: 32×21 אריחים. # קיר/קרקע, = שורש או ענף (עומדים עליו מלמעלה), | חבל או ליאנה, ~ מים, E יציאה, c סדק סודי.\n'
out += '// דמויות וחפצים: P התחלה, T חלק קלטת, K קוף שזורק חביות, S נחש, R נחש על חבל, M פטרייה, G שומר, V ליאנה מתנדנדת,\n'
out += '// C תנין, F צפרדע, O עלה לוטוס, L בול עץ צף, l בול עץ ששוקע, Q נחיל יתושים.\n'
out += 'export const SCREENS = ' + json.dumps(S, indent=1, ensure_ascii=False) + ';\n'
sys.stdout.write(out)
