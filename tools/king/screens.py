# Builds the 12 JUNGLE KING round-1 maps (32x21) from a compact spec and prints JS.
# Redesign (Gonen, 27.10: "אלה לא מסכים פשוטים מדי?"): every floor crosses the whole width (the rope up is always on the
# other side), gaps to jump, torn ropes, two kinds of danger per screen, tape pieces off the main path; in the swamps two
# crossings: over the water, then up and back over it on branches and vines.
# Fine look (Gonen, 27.10: "הכל גס וגדול מדי", the model is Donkey King on the Dragon): no thick side walls, so the screen
# is open and barrels drop off the floor ends. The barrel thrower (K) sits on its own ledge in row 0, in a top corner, where
# PIP can never reach it; its barrels roll down the zigzag against PIP's way up (the bot checks both).
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
def walls(m): plat(m, 20, 0, 31, '#')   # only the ground: the sides are open
# the thrower's ledge: row 0 in a corner, out of reach (32 px above the top floor, and PIP jumps 26)
def ledge(m, c0, c1, k): plat(m, 0, c0, c1); put(m, 0, k, 'K')
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
block(m, 2, 3, 26, 27, 'E'); ledge(m, 26, 31, 29); put(m, 19, 3, 'P')
put(m, 19, 28, 'T'); put(m, 11, 28, 'T'); put(m, 7, 3, 'T')
add('1-1', 'THE FIRST STEP', m, time=60, rate=240, dir=-1)

# 1-2: the near mushroom only reaches a side island (a tape piece, no way on). The far mushroom lifts PIP to the islands;
# jump between them, then the island mushroom up to the top, and left past the monkey's barrels to the exit
m = new(); walls(m)
plat(m, 12, 2, 7); plat(m, 12, 13, 19); plat(m, 12, 22, 29); plat(m, 5, 4, 18)
put(m, 19, 4, 'M'); put(m, 11, 14, 'M'); put(m, 19, 27, 'M')
block(m, 3, 4, 4, 5, 'E'); ledge(m, 0, 5, 2); put(m, 19, 2, 'P'); put(m, 19, 14, 'S')
put(m, 11, 3, 'T'); put(m, 11, 29, 'T'); put(m, 4, 10, 'T')
add('1-2', 'MUSHROOM HOP', m, time=60, rate=200, dir=1)

# 1-3: four full crossings, two gaps, two snakes
m = new(); walls(m)
plat(m, 16, 2, 16); plat(m, 16, 19, 27); plat(m, 12, 4, 10); plat(m, 12, 13, 29); plat(m, 8, 2, 28); plat(m, 4, 6, 29)
rope(m, 26, 17, 19); rope(m, 5, 13, 15); rope(m, 28, 9, 11, gap=(10,)); rope(m, 7, 5, 7)
block(m, 2, 3, 28, 29, 'E'); ledge(m, 26, 31, 29); put(m, 19, 4, 'P')
put(m, 11, 20, 'S'); put(m, 7, 15, 'S')
put(m, 15, 3, 'T'); put(m, 7, 3, 'T'); put(m, 19, 29, 'T')
add('1-3', 'THE TANGLED ROOTS', m, time=60, rate=170, dir=-1)

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
block(m, 2, 3, 20, 21, 'E'); put(m, 0, 25, 'K'); put(m, 19, 11, 'P')
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
plat(m, 7, 10, 18); ledge(m, 4, 9, 6); plat(m, 7, 2, 6)
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

# ---------------- WORLD 3: RIVERS (round 2) ----------------
# 3-1: logs that the current carries to the right. At the end of the river a log sinks, so jump to the bank in time.
# Then up the rope and back to the left on the branches, past a beaver
m = new(); swamp(m, 16, 4, 16, 27)
for c in (7, 13, 19, 25): put(m, 18, c, 'L')
plat(m, 8, 19, 31); rope(m, 29, 9, 15); plat(m, 8, 10, 15); plat(m, 8, 0, 6); put(m, 7, 24, 'S')
block(m, 6, 7, 2, 3, 'E'); put(m, 15, 2, 'P')
put(m, 14, 16, 'T'); put(m, 15, 30, 'T'); put(m, 7, 12, 'T')
add('3-1', 'RIVER BEND', m, time=60, current=0.45, logs=[[5, 28]] * 4)

# 3-2: stepping stones over the river, with fish jumping in arcs between them; back over on high branches,
# where the big fish jump almost up to the branch
m = new(); swamp(m, 16, 4, 16, 27)
for c0 in (7, 12, 17, 22): plat(m, 17, c0, c0 + 1)
for c in (10, 15, 20): put(m, 18, c, 'J')
plat(m, 9, 20, 31); rope(m, 29, 10, 15); plat(m, 9, 12, 16); plat(m, 9, 0, 8)
put(m, 18, 18, 'J'); put(m, 18, 10, 'J')
block(m, 7, 8, 2, 3, 'E'); put(m, 15, 2, 'P')
put(m, 15, 13, 'T'); put(m, 15, 30, 'T'); put(m, 8, 14, 'T')
add('3-2', 'JUMPING FISH', m, time=60, fish=[[28, 34, 130], [-28, 34, 150], [28, 34, 170], [-24, 64, 160], [24, 64, 190]])

# 3-3: climb behind the waterfall. On a rope inside the falls, stop climbing and the water pushes PIP down;
# the lowest rope hangs over the pool. A monkey at the top drops barrels down the falls
m = new(); swamp(m, 18, 7, 18, 24)
plat(m, 16, 3, 13); rope(m, 4, 17, 17)
rope(m, 13, 12, 15); plat(m, 12, 12, 27)
rope(m, 26, 9, 11); plat(m, 8, 9, 27)
rope(m, 15, 5, 7); plat(m, 4, 2, 18)
ledge(m, 24, 29, 26)
block(m, 2, 3, 3, 4, 'E'); put(m, 17, 2, 'P')
put(m, 15, 9, 'T'); put(m, 11, 22, 'T'); put(m, 3, 12, 'T')
add('3-3', 'THE WATERFALL', m, time=60, falls=[[12, 19, 1, 17]], rate=150, dir=0, dropX=128)

# 3-4: ride a barrel raft down the rapids: three steps of water, and fish jump across the river.
# Jump off to the ledge at the end, then climb to the exit
m = new()
block(m, 13, 20, 0, 11); block(m, 15, 20, 12, 21); block(m, 18, 20, 22, 31)
plat(m, 12, 2, 11, '~'); plat(m, 14, 12, 21, '~'); plat(m, 17, 22, 31, '~'); block(m, 18, 20, 22, 31, '~')
block(m, 11, 12, 0, 1); put(m, 12, 3, 'A')
plat(m, 14, 27, 31); rope(m, 30, 5, 13); plat(m, 4, 18, 31)
put(m, 17, 26, 'J'); put(m, 14, 16, 'J')
block(m, 2, 3, 20, 21, 'E'); put(m, 10, 0, 'P')
put(m, 7, 8, 'T'); put(m, 9, 17, 'T'); put(m, 3, 26, 'T')
add('3-4', 'RAPIDS RIDE', m, time=60, raftEnd=29, raftV=0.65, fish=[[-20, 40, 140], [20, 48, 170]])

# 3-5: the beaver dam. Beavers walk on the dam; on the ropes up, a beaver gnaws the rope while PIP climbs it,
# so climb without stopping. A torn rope on the way
m = new(); swamp(m, 16, 5, 16, 26)
plat(m, 16, 6, 25); put(m, 15, 12, 'S'); put(m, 15, 20, 'S')
rope(m, 28, 11, 15); put(m, 15, 29, 'N'); plat(m, 10, 6, 31)
rope(m, 7, 5, 9); put(m, 9, 8, 'N'); plat(m, 4, 2, 24); put(m, 3, 16, 'S')
block(m, 2, 3, 22, 23, 'E'); put(m, 15, 2, 'P')
put(m, 15, 30, 'T'); put(m, 9, 20, 'T'); put(m, 3, 4, 'T')
add('3-5', 'BEAVER DAM', m, time=60, chew=70)

# 3-6: the whirlpool. Two logs circle around it; ride one and jump to the far bank. In the air the whirlpool
# pulls PIP toward its middle. Then up and back on the branches, past the jumping fish
m = new(); swamp(m, 16, 5, 16, 26)
put(m, 18, 16, 'G')
plat(m, 8, 20, 31); rope(m, 29, 9, 15); plat(m, 8, 11, 16); plat(m, 8, 0, 7)
put(m, 18, 9, 'J'); put(m, 18, 22, 'J')
block(m, 6, 7, 2, 3, 'E'); put(m, 15, 2, 'P')
put(m, 12, 16, 'T'); put(m, 15, 30, 'T'); put(m, 7, 13, 'T')
add('3-6', 'THE WHIRLPOOL', m, time=75, guard='whirl', whirlR=64, fish=[[0, 84, 170], [0, 84, 200]])

# ---------------- WORLD 4: HIVES (round 2) ----------------
# 4-1: bees fly on fixed loops over the wax shelves; watch the loop and pass when the bee is away
m = new(); walls(m)
plat(m, 16, 0, 26); plat(m, 12, 4, 31); plat(m, 8, 0, 27); plat(m, 4, 5, 31)
rope(m, 24, 17, 19); rope(m, 6, 13, 15); rope(m, 25, 9, 11); rope(m, 7, 5, 7)
put(m, 18, 12, 'Z'); put(m, 14, 16, 'Z'); put(m, 10, 13, 'Z'); put(m, 6, 18, 'Z')
block(m, 2, 3, 28, 29, 'E'); put(m, 19, 2, 'P')
put(m, 15, 2, 'T'); put(m, 11, 30, 'T'); put(m, 3, 10, 'T')
add('4-1', 'BUZZING DOOR', m, time=60, bees=[[40, 6, 0.025], [44, 5, 0.03], [36, 6, 0.035], [44, 5, 0.03]])

# 4-2: honey drips from the ceiling; where a drop lands, the shelf is sticky for a while (slow walk, low jump).
# Barrels from the corner roll down through the sticky patches
m = new(); walls(m)
plat(m, 16, 3, 31); plat(m, 12, 0, 27); plat(m, 8, 4, 31); plat(m, 4, 0, 25)
rope(m, 5, 17, 19); rope(m, 25, 13, 15); rope(m, 6, 9, 11); rope(m, 28, 5, 7)
for (r, c) in ((13, 10), (13, 18), (9, 14), (9, 21), (5, 11), (17, 15)): put(m, r, c, 'D')
ledge(m, 0, 5, 2)
block(m, 2, 3, 6, 7, 'E'); put(m, 19, 28, 'P')
put(m, 15, 30, 'T'); put(m, 11, 1, 'T'); put(m, 3, 20, 'T')
add('4-2', 'HONEY DRIPS', m, time=60, rate=220, dir=1, drip=140)

# 4-3: wax elevators instead of ropes: they go up and down between the shelves. A bee guards the top.
# (lifts=[top row, bottom row, speed] in map order: top to bottom)
m = new(); walls(m)
plat(m, 16, 0, 12); plat(m, 16, 17, 31); plat(m, 12, 0, 8); plat(m, 12, 13, 31); plat(m, 8, 0, 20); plat(m, 8, 25, 31); plat(m, 4, 8, 31)
put(m, 19, 14, 'U'); put(m, 15, 10, 'U'); put(m, 11, 22, 'U'); put(m, 7, 5, 'U')
put(m, 2, 20, 'Z'); put(m, 10, 28, 'Z')
block(m, 2, 3, 28, 29, 'E'); put(m, 19, 3, 'P')
put(m, 15, 28, 'T'); put(m, 11, 2, 'T'); put(m, 7, 29, 'T')
add('4-3', 'WAX ELEVATORS', m, time=75, lifts=[[4, 8, 0.5], [8, 12, 0.55], [12, 16, 0.5], [16, 20, 0.45]], bees=[[40, 5, 0.03], [14, 10, 0.04]])

# 4-4: the sticky hall: honey puddles on the floors slow PIP down while a big swarm of bees circles the hall
m = new(); walls(m)
plat(m, 16, 0, 25); plat(m, 16, 8, 14, 'h'); plat(m, 12, 5, 31); plat(m, 12, 15, 22, 'h'); plat(m, 8, 0, 26); plat(m, 8, 6, 12, 'h'); plat(m, 4, 4, 31)
rope(m, 23, 17, 19); rope(m, 7, 13, 15); rope(m, 24, 9, 11); rope(m, 5, 5, 7)
plat(m, 20, 14, 20, 'h')
for c, r in ((16, 9), (10, 9), (22, 9), (16, 13)): put(m, r, c, 'Z')
block(m, 2, 3, 28, 29, 'E'); put(m, 19, 2, 'P')
put(m, 15, 11, 'T'); put(m, 11, 30, 'T'); put(m, 7, 9, 'T')
add('4-4', 'THE STICKY HALL', m, time=75, bees=[[64, 40, 0.012], [64, 40, 0.012], [64, 40, 0.012], [30, 20, 0.03]])

# 4-5: a corridor full of bees; pick up the smoke pot and the bees sleep for a few seconds. Run past them then
m = new(); walls(m)
plat(m, 16, 0, 28); plat(m, 12, 3, 31); plat(m, 8, 0, 28); plat(m, 4, 3, 31)
rope(m, 27, 17, 19); rope(m, 4, 13, 15); rope(m, 27, 9, 11); rope(m, 4, 5, 7)
put(m, 11, 5, 'Y'); put(m, 3, 26, 'Y')
for c in (9, 13, 17, 21, 25): put(m, 10, c, 'Z')
for c in (8, 13, 18, 23): put(m, 2, c, 'Z')
put(m, 14, 14, 'Z')
block(m, 2, 3, 29, 30, 'E'); put(m, 19, 2, 'P')
put(m, 15, 1, 'T'); put(m, 11, 30, 'T'); put(m, 7, 14, 'T')
add('4-5', 'SMOKE TRICK', m, time=75, bees=[[3, 8, 0.05]] * 5 + [[3, 8, 0.05]] * 4 + [[40, 6, 0.03]])

# 4-6: the queen's room. The queen marks where PIP is and dives at him; take the 3 honey jars and the gate opens
m = new(); walls(m)
plat(m, 15, 2, 9); plat(m, 15, 22, 29); plat(m, 10, 11, 20); plat(m, 6, 0, 8); plat(m, 6, 23, 31)
rope(m, 5, 16, 19); rope(m, 26, 16, 19); rope(m, 15, 11, 19); rope(m, 3, 7, 14); rope(m, 28, 7, 14)
put(m, 14, 4, 'H'); put(m, 9, 15, 'H'); put(m, 14, 27, 'H')
put(m, 1, 16, 'G')
block(m, 4, 5, 2, 3, 'E'); put(m, 19, 15, 'P')
put(m, 19, 2, 'T'); put(m, 5, 28, 'T'); put(m, 9, 12, 'T')
add('4-6', "THE QUEEN'S ROOM", m, time=90, guard='queen')

# ---------------- WORLD 5: CAVES (round 2) ----------------
# All dark: PIP sees only what his torch lights, and the torch burns down. New torches on the way light it up again.
# 5-1: the first dark climb. Torches on every floor
m = new(); walls(m)
plat(m, 16, 3, 31); plat(m, 12, 0, 26); plat(m, 8, 5, 31); plat(m, 4, 0, 24)
rope(m, 28, 17, 19); rope(m, 4, 13, 15); rope(m, 25, 9, 11); rope(m, 7, 5, 7)
put(m, 15, 16, 'I'); put(m, 11, 10, 'I'); put(m, 7, 18, 'I')
block(m, 2, 3, 2, 3, 'E'); put(m, 19, 2, 'P')
put(m, 15, 30, 'T'); put(m, 11, 1, 'T'); put(m, 3, 20, 'T')
add('5-1', 'INTO THE DARK', m, time=60, dark=1, torch=20)

# 5-2: bats hang under the shelves and dive when the torch light reaches them
m = new(); walls(m)
plat(m, 16, 0, 27); plat(m, 12, 4, 31); plat(m, 8, 0, 26); plat(m, 4, 5, 31)
rope(m, 25, 17, 19); rope(m, 6, 13, 15); rope(m, 24, 9, 11); rope(m, 7, 5, 7)
for (r, c) in ((17, 9), (17, 18), (13, 14), (13, 24), (9, 10), (9, 19), (5, 15)): put(m, r, c, 'X')
put(m, 15, 4, 'I'); put(m, 7, 14, 'I')
block(m, 2, 3, 28, 29, 'E'); put(m, 19, 2, 'P')
put(m, 15, 22, 'T'); put(m, 11, 30, 'T'); put(m, 3, 11, 'T')
add('5-2', 'THE BAT CAVE', m, time=60, dark=1, torch=22)

# 5-3: stalactites hang over the paths and fall when PIP passes under them. Walk past, then wait, or run
m = new(); walls(m)
plat(m, 16, 3, 31); plat(m, 12, 0, 27); plat(m, 8, 4, 31); plat(m, 4, 0, 25)
rope(m, 5, 17, 19); rope(m, 25, 13, 15); rope(m, 6, 9, 11); rope(m, 27, 5, 7)
for (r, c) in ((17, 12), (17, 20), (13, 8), (13, 16), (13, 22), (9, 12), (9, 19), (5, 9), (5, 16), (5, 23), (1, 14)): put(m, r, c, 'v')
put(m, 11, 14, 'I')
block(m, 2, 3, 2, 3, 'E'); put(m, 19, 28, 'P')
put(m, 15, 30, 'T'); put(m, 11, 1, 'T'); put(m, 3, 18, 'T')
add('5-3', 'FALLING STONES', m, time=60, dark=1, torch=30)

# 5-4: no torch at all. Glow worms light the way, a little at a time
m = new(); walls(m)
plat(m, 16, 0, 12); plat(m, 16, 15, 28); plat(m, 12, 3, 31); plat(m, 8, 0, 14); plat(m, 8, 17, 27); plat(m, 4, 4, 31)
rope(m, 26, 17, 19); rope(m, 5, 13, 15); rope(m, 25, 9, 11); rope(m, 6, 5, 7)
for (r, c) in ((19, 6), (19, 15), (19, 23), (15, 3), (15, 10), (15, 20), (11, 8), (11, 16), (11, 26), (7, 4), (7, 11), (7, 22), (3, 14), (3, 24)): put(m, r, c, 'W')
put(m, 9, 21, 'X')
block(m, 2, 3, 28, 29, 'E'); put(m, 19, 2, 'P')
put(m, 15, 1, 'T'); put(m, 11, 30, 'T'); put(m, 7, 19, 'T')
add('5-4', 'GLOW WORM TUNNEL', m, time=75, dark=1, torch=0)

# 5-5: a wide chasm with no bottom; swing over it on vines in the dark, then back over on a high ledge
m = new()
block(m, 16, 20, 0, 8); block(m, 16, 20, 23, 31)
put(m, 2, 12, 'V'); put(m, 2, 19, 'V')
plat(m, 4, 20, 31); rope(m, 28, 5, 15); plat(m, 4, 11, 16); plat(m, 4, 0, 8)
put(m, 5, 26, 'X'); put(m, 5, 4, 'X')
put(m, 15, 3, 'I'); put(m, 3, 29, 'I')
block(m, 2, 3, 2, 3, 'E'); put(m, 15, 1, 'P')
put(m, 10, 16, 'T'); put(m, 15, 29, 'T'); put(m, 3, 13, 'T')
add('5-5', 'THE ECHO CHASM', m, time=75, dark=1, torch=24, vines=[80, 80])

# 5-6: the sleeping bear lies on the long floor. Walking near it makes noise; standing still calms it. Landing from a
# jump is loud. Too much noise wakes it, and it chases PIP for a while. Walk, stop, walk
m = new(); walls(m)
plat(m, 15, 0, 7); plat(m, 15, 24, 31); plat(m, 10, 3, 28); plat(m, 5, 6, 31)
rope(m, 4, 16, 19); rope(m, 29, 16, 19); rope(m, 6, 11, 14); rope(m, 26, 6, 9)
put(m, 19, 16, 'G')
put(m, 14, 2, 'I'); put(m, 9, 20, 'I')
block(m, 3, 4, 8, 9, 'E'); put(m, 19, 28, 'P')
put(m, 19, 2, 'T'); put(m, 14, 29, 'T'); put(m, 4, 4, 'T')
add('5-6', 'THE SLEEPING BEAR', m, time=90, dark=1, torch=30, guard='bear')

out = '// JUNGLE KING: מפות המסכים. נוצר ב-tools/king/screens.py (לא לערוך ביד: משנים שם ומריצים מחדש).\n'
out += '// כל מסך: 32×21 אריחים. # קיר/קרקע, = שורש או ענף (עומדים עליו מלמעלה), | חבל או ליאנה, ~ מים, E יציאה, c סדק סודי.\n'
out += '// דמויות וחפצים: P התחלה, T חלק קלטת, K קוף שזורק חביות, S נחש, R נחש על חבל, M פטרייה, G שומר, V ליאנה מתנדנדת,\n'
out += '// C תנין, F צפרדע, O עלה לוטוס, L בול עץ צף, l בול עץ ששוקע, Q נחיל יתושים.\n'
out += 'export const SCREENS = ' + json.dumps(S, indent=1, ensure_ascii=False) + ';\n'
sys.stdout.write(out)
