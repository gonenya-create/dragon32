# מחקר: אילו כתובות ב-ROM תוכנות של אז השתמשו בהן, וכמה מהיר היה ה-BASIC המקורי (22.10.2026)

> **מה זה:** מחקר של סוכן Claude ב"חדר הספרים". הוא קרא ספרים, מגזינים ועלונים מהתקופה, ולא פתח את הקוד המקורי ולא פירוק שלו. אין כאן קוד.
> **הממצאים העיקריים:**
> - כ-20 כתובות פנימיות היו בשימוש נפוץ. הנפוצה ביותר: ‎$A0EA, "חכה למקש עם סמן מהבהב".
> - כתובת הפסיקה היא ‎$9D3D ולא ‎$9D93 (היפוך ספרות בספר Inside the Dragon, עמ' 193). תוקן ב-`DRAGON-SPEC-INTERFACES.md`.
> - תוכנות קראו גם טבלאות מתוך ה-ROM: רשימת הפקודות ב-‎$8033 והודעות השגיאה.
> - זמני ריצה שפורסמו ב-1982 לתוכניות הבדיקה BM1-BM8, ומה שמדדנו אצלנו (בסוף המסמך).
> **הדוח המשלים מהקורא:** `docs/DRAGON-SPEC-ENTRIES.md`.

# Era research: which ROM addresses real Dragon 32 programs used, and how fast the original BASIC was

*Books-room research, 22.10.2026. Clean-room rules were followed. I did not open the original Dragon BASIC source, any ROM disassembly or commented listing (no "Unravelled", no ROM disassembly sites, no chibiakumas token tables, no dragon32.info "romref"), and no ROM images. Everything below comes from era books, magazines, the Dragon Data leaflet and forum/search snippets. The report gives addresses, plain-language descriptions, citations and numbers only. It contains no code and no byte dumps.*

**Caveat on the numbers.** Most values were read from OCR text of scanned books and magazines. OCR often confuses "8" with "B" and "0" with "D". Values marked ⚠ are doubtful. I checked some pages by eye (rendered page images), and those are marked 👁. Nothing here was verified on a real machine or in a ROM.

**Page numbers.** "p." is the printed page number. Where only the PDF page is known, I say so. Book abbreviations:

| Abbreviation | Source |
|---|---|
| **DD83** | Dragon Data Ltd, *Information for Machine Code Users!*, March 1983, 8 pp. 👁 (all pages viewed). [PDF](https://colorcomputerarchive.com/repo/Documents/Books/Dragon/Dragon%2032%20Information%20for%20Machine%20Code%20Users%20(Dragon%20Data%20Ltd).pdf) |
| **ITD** | Smeed & Sommerville, *Inside the Dragon* (Addison-Wesley 1983). Printed page = PDF page − 7. [PDF](http://www.dragondata.co.uk/Publications/InsideTheDragon.pdf) |
| **COMP** | M. Jarvis, *The Dragon 32 – Dragon Companion* (1982) |
| **PRG** | John Vander Reyden, *Dragon 32 Programmer's Reference Guide* (Melbourne House / Beam Software 1983) |
| **MLAB** | John Vander Reyden, *Dragon Machine Language for the Absolute Beginner* (Melbourne House) |
| **LOD** | Mike James, *The Language of the Dragon – 6809 Assembler* |
| **AOD** | Mike James, *The Anatomy of the Dragon* |
| **IDMC** | Ian Sinclair, *Introducing Dragon Machine Code* |
| **BAR** | David Barrow, *6809 Machine Code Programming* |
| **PH** | Gerrard & Doyle, *A Pocket Handbook for the Dragon* (1984) |
| **ETD** | Colin Carter, *Enter the Dragon* |
| **DU** | *Dragon User* magazine. archive.org item `DragonUser08Dec83`; files `DragonUser/DragonUserNN_MonYY_djvu.txt`. Includes **Brian Cadge, "Firmware" series**, DU Sep 1985 – Mar 1986 (7 parts), and the "Dragon Answers" column. |

All books except DD83 and ITD are on colorcomputerarchive.com under `/repo/Documents/Books/Dragon/`.

---

## PART 1: ROM addresses that era sources told programmers to use

### 1.0 The headline findings

1. **The official interface was the 17-entry `$8000` jump table plus the 7 `$A000` vectors** (DD83 pp. 4–5; COMP pp. 33–35; ITD pp. 146, 217–218, 348–349). The leaflet itself breaks this rule in two places: it tells USR programmers to call **$8B2D** and **$8C37** directly (DD83 p. 7 👁).
2. **Real programs used many internal addresses.** The most important source is **Brian Cadge's "Firmware" series in Dragon User (Sep 1985 – Mar 1986)**. It gave dozens of internal entry points, each with its CoCo equivalent. DU type-ins and "Dragon Answers" (1983–88) used them freely. The most-used internal address of all is **$A0EA (41194), "wait for key with flashing cursor"**: at least 10 DU type-in listings use it, often as `EXEC 41194` for "press any key".
3. **The `$9D93` in our interface spec is very likely a misprint in *Inside the Dragon*.** ITD p. 193 says the IRQ secondary vector holds a jump to $9D93. Five other places give **$9D3D**:
   - ITD itself, four pages later (p. 197: "clock update service routine at address $9D3D")
   - LOD p. 189 👁 (table: IRQ → $10C → JMP $9D3D; FIRQ → JMP $B469; Reset → $B3B4)
   - BAR p. 105 (on-screen clock: "jump to the original destination… $9D3D if you still want TIMER and PLAY")
   - DU Dec 1985 "Dragon Answers"
   - DU Nov 1986 listing

   ITD's Dragon 64 appendix (p. 340) also gives the 64K-mode equivalent as **$DD3D** ($9D3D + $4000), which fits $9D3D. **Recommendation: change the spec from $9D93 to $9D3D (flag it ⚠ until we see real hardware).** Programs that chain their own IRQ code end with a jump to $9D3D, so this is a real compatibility address.
4. **The RAM routine that fetches the next BASIC character jumps back into ROM at $BB26.** The ROM copies a small self-modifying routine to RAM at $9F. It ends with a jump into ROM at **$BB26**, which DD83 p. 6 describes as "continued in ROM". COMP p. 37 (OCR "$8826" ⚠), ITD p. 246 (system variables table, RAM $A8–$AA) and AOD p. 127 (says $BB26 in prose; OCR also shows "B826/8B26" ⚠) all show this. Every "add a new command" article of the era hooks this routine and then jumps to $BB26. **Our ROM must place that routine at $BB26, or at least put that address in the RAM jump.**
5. **ROM data was published and used.** The keyword and dispatch tables are at **$8033 / $8154 / $81CA / $8250**. The command count is $4E and the function count is $22. These come from ITD p. 239 (stub contents at $120–$129) and COMP p. 35. PRG p. 97 also gives the error-message table at **$82A9–$82DB** and says interpreter code starts around $82E0. IDMC p. 142 says "ROM instructions start at $82F7". Programs that add commands copy these RAM stub pointers and re-enter the ROM.

### 1.1 Ranked table: most-used first

"Sources" counts independent books, magazine articles and type-in listings that I or the sub-agent saw. Counts are **lower bounds**, because OCR misses many listings.

| # | Address (dec) | What it does (my words) | Inputs → outputs, as published | Sources (where) | Usage | Notes |
|---|---|---|---|---|---|---|
| 1 | **$8006** (32774) / **[$A000]** | Poll keyboard once | none → A = ASCII key, or 0 and Z=1 if no key. COMP: B and X kept, other registers changed | DD83 p. 5; COMP p. 33/35; ITD pp. 103, 112, 145–146; LOD pp. 51, 139, 144, 223; IDMC pp. 114–115, 139; PRG p. 105 (BREAK-disable routine); DU Feb85, Jan88, Feb88, Nov88 listings | **Very wide** (≥8 books + ≥4 DU listings) | Official entry. IDMC p. 114: "later versions of Dragon [may] have these routines at different addresses… [but] their addresses are stored at $A000…" (the clearest era advice to use the vectors) |
| 2 | **$800C** (32780) / **[$A002]** | Print the character in A to the screen (scrolls; cursor at $88/$89). [$A002] goes to the device in $6F | A = char → only CC changed (COMP) | DD83 p. 5; COMP p. 35; ITD pp. 103, 112, 349; LOD pp. 47–48, 223; AOD p. 135; DU Feb84, Feb85, Jan88 | **Very wide** | DU Feb84: change JSR $800C to JSR $800F to send to the printer. DD83 numbers the screen-output and reset entries correctly; the Codex spec noted a misprint elsewhere |
| 3 | **$8C37** (35895) "GIVABF" | Return the integer in D to BASIC as the USR result (end a USR routine by jumping here) | D → FAC; sets VALTYP=0 (ITD) | DD83 p. 7 👁; ITD p. 234; LOD p. 198; MLAB pp. 128–144 (many listings); ETD p. 175 (draughts program); DU Dec87 letter; PRG (OCR "BC37" ⚠) | **Very wide** (7 sources, 27 hits in books) | Officially documented, although internal |
| 4 | **$A0EA** (41194) | Wait for a key with a flashing cursor, then remove the cursor | → key in A | Cadge, DU Nov85 ("Wait with Cursor", CoCo 36038); DU type-ins Aug83, Dec83, Apr86, May86, Jul86 ×4, Sep86, Nov86 ×2, Oct87; Brian Cadge disassembler, *Your Computer* May 1983, reprinted in IDMC p. 143 (`EXEC 41194` after "ATTEND TO PRINTER"); Dragon Notebook (WoD wiki) "EXEC41194" | **Most-used internal address** (≥12) | Often used as a harmless EXEC address in CSAVEM, so a wrong routine here breaks many tapes' auto-exec |
| 5 | **$8B2D** (35629) "INTCNV" | Convert the FAC (USR argument) to a 16-bit integer in D | X → FAC; result in D | DD83 p. 7 👁; ITD p. 234; LOD p. 198; DU Dec87 letter | Wide (4+) | ⚠ Nearby entries also published: PRG "BB30" (= $8B30?); Cadge Jan86 "GetUSR 35625" ($8B29); DU Nov84 "JSR 35623" ($8B27) returns VARPTR in D. Possibly different entry points into one routine; unresolved |
| 6 | **$8015 / $8018** (32789 / 32792) | Cassette motor on (with delay) / off | — | DD83 p. 4; COMP p. 35; ITD pp. 217–218; LOD p. 223; PH pp. 81, 84 (`DEFUSR8=&H8015`, `DEFUSR9=&H8018`) | Wide | Official |
| 7 | **$8021** (32801) / **[$A004]**, **[$A006]** BLKIN, **[$A008]** BLKOUT, **$801B / [$A00C]** leader | Cassette read-sync, block in/out, leader | Block type $7C, length $7D, buffer $7E/$7F, error $81 (full contracts in PRG p. 94, COMP p. 34) | DD83 pp. 4–5; COMP pp. 33–35; ITD pp. 217–218; LOD p. 223; PRG p. 94; MLAB p. 240; IDMC p. 139 (OCR); DU Jun85 Answers; Cadge Oct85 | Wide | DD83 points to *PCW* Feb 1983 for a cassette-verify example using them |
| 8 | **$BA77** (47735) | Clear the text screen, cursor home (CLS) | — | DU Jan85 Answers; Cadge Nov85 (CoCo 43304); DU Dec87 ("EXEC &HBA77"); DU Jan88, Nov88 listings | 5+ | $BA79 (47737) = clear to the character in B (DU Jan85; Cadge) |
| 9 | **$8E83** (36483) | Read the next numeric expression (e.g. after `EXEC addr,`) into X; FC error if out of range | → X | DU Jul85 Answers; Dec85 ×2; Cadge Jan86 (CoCo 46909); Nov86; Dec87 (= CoCo $B73D) | 5 | Used for "EXEC with parameters". $8E51 (36433) = same but 8-bit value in B (DU Jul85; Cadge) |
| 10 | **$9D3D** (40253) | Rest of the system IRQ handler (TIMER, SOUND/PLAY timing); user IRQ code must end by jumping here | — | ITD p. 197; LOD p. 189 👁; BAR p. 105; DU Dec85 Answers; DU Nov86 listing | 5 | **Replaces $9D93 in our spec** (see 1.0 #3). DU: with DragonDOS the chain target is 50944 instead |
| 11 | **$BB26** (47910) | ROM tail of the RAM "get next character" routine at $9F | A = char; flags set for BASIC (not described further) | DD83 p. 6 (prose "continued in ROM", no address); COMP p. 37 (OCR ⚠); ITD p. 246; AOD p. 127 | 4 books; every "new command" article | Address is stored in RAM by the ROM at start-up |
| 12 | **$89AA** (35242) | Check for a comma, else SN error | — | DU Dec85 ×2; Cadge Jan86 (CoCo 45677); DU Nov86; Dec87 (= CoCo $B26D) | 4 | Siblings, one source each: $89A4 ")" check, $89A7 "(" check, $89AC check for the char in B (Cadge; Dec87). ITD p. 241 gives **$89B4** as "SYNERR" (syntax-error entry) |
| 13 | **$BBE5** (48101) "POLCAT" | Keyboard scan (target of $8006) | → A, Z; B, X kept | PRG p. 95; MLAB pp. 162, 241; DU Dec83 Answers ("used by many of the cartridges"); Cadge Nov85 (CoCo 41409) | 4 | DU says cartridges called it directly |
| 14 | **$B54A** (46410) "CHROUT" | Central character output to the device in $6F | A = char; all registers except CC kept | PRG p. 95; MLAB p. 241; IDMC pp. 93, 114–115 (code bytes show $B54A; prose says "$854A" ⚠ typo/OCR); Cadge Nov85 (CoCo 41602) | 4 | Target of $800C / [$A002] |
| 15 | **$800F** (32783) | Printer output of A (LPOUT, with end-of-line housekeeping, uses $99–$9C, $148–$150) | A = char | DD83 p. 5; ITD pp. 206, 243 (hook $167 → JMP $800F copies all output to the printer); LOD p. 223; DU Feb84, Feb85 (×5) | 4+ | Official |
| 16 | **$B3B4** (46004) | RESET routine (cold/warm start, $71 = $55 test) | — | DD83 p. 3 👁 (reset vector table); ITD pp. 193, 224; LOD p. 189 👁; Cadge Mar86 (Tandy equivalent 40999); PRG (OCR "B384") | 4 | The famous "EXEC 40999 warm start" is the **CoCo** address (Cadge) |
| 17 | **$8371** (33649) | Back to command mode, print OK | — | DU Oct84 listing (×3, as JMP); Oct87 listing; Cadge Mar86 ⚠ | 3 | |
| 18 | **$849F** (33951) | RUN the program in memory (autorun after load) | — | DU Jun84 Answers; Cadge Mar86 (CoCo 44446); DU Feb88; ITD p. 243 also lists $849F as the place that calls the "fetch next statement" hook | 3 | |
| 19 | **$841F + $83ED** (33823 / 33773) | Fix up BASIC pointers after loading a program (call both, then RUN) | — | DU Jun85 Answers; Cadge Mar86; DU Feb88 | 3 | |
| 20 | **$BBB5** (48053) "BLINK" | Cursor-flash countdown at $8F | — | PRG p. 93 / MLAB p. 239 ("decrements 008F"); Cadge Nov85 (CoCo 41369); DU Nov87 (`EXEC&HBBB5`) | 3 | Target of $8009. **$8009** itself: DD83, COMP, ITD; DU Sep88 (`EXEC32777`) |
| 21 | **$BD52** (48466) "JOYIN" | Read the joysticks into $15A–$15D (up to 10 samples each, per BAR) | U, X, D, CC changed (BAR); Y kept (PRG) | PRG p. 95; MLAB p. 241; BAR p. 62 ("located at $BD52 (on my Dragon)"); Cadge Mar86 (CoCo 43486) | 3 (+ $8012: DD83; LOD; DU Jan86 `EXEC &H8012`) | BAR's "on my Dragon" suggests he expected addresses could differ between machines |
| 22 | **$90E5** (37093) "OUTSTR" | Print a zero-terminated string; X → byte *before* the string | — | ITD p. 241; Cadge Nov85 (CoCo 47516); DU Nov88 | 3 | |
| 23 | **$8B8D** (35725) "FCERR" | Raise ?FC error (ITD fills the relocated USR vector table with it) | — | ITD p. 242 | 1 book | Already in our spec |
| 24 | **$84ED** (34029) "ROMCMD" | Re-enter BASIC's statement dispatch with X = new table, A = index | — | ITD p. 241 | 1 | For the "new commands" method |
| 25 | **$903D** (36925) | PRINT statement action routine | — | ITD p. 240 (OUTPUT = PRINT); DU May85 listing (JMP exit, purpose not stated) | 2 | |
| 26 | **$B469** (46185) | FIRQ (cartridge auto-start) handler | — | ITD p. 193; LOD p. 189 👁 | 2 | Already in spec; confirmed |
| 27 | **$BD41** (48449) "SNDSEL" | Select analogue-MUX source by B (0 DAC, 1 cassette, 2 cartridge); MUX not enabled | B → ; U, A, B, CC destroyed | ITD p. 209; Cadge (joystick source select) | 2 | Already in spec |
| 28 | **$BCF5** (48373) "TXLPCH" | Raw printer output with no CR/LF housekeeping | A = char | ITD p. 207; DU Jul85 Answers (screen-dump fix); Cadge Nov85 (OCR "40373" ⚠) | 3 | |
| 29 | **$BD1A** (48410) | Printer output with EOL handling, waits while busy | — | DU Jul85; Cadge Nov85 | 2 | On the **D64** it also waits while a key is held (Cadge) |
| 30 | **$B6D0 / $B6D4** (46800 / 46804) | CLOAD (first file) | — | PH p. 84 ("EXEC 46800" to CLOAD without a filename); DU Oct84 listing uses 46804 (CLOAD label) | 2 | ⚠ Two different values; may be two entry points |
| 31 | **$B93E / $B999 / $BE12 / $BDAD / $BDA5 / $BE6A** | BLKIN / BLKOUT / byte out / byte in / bit in / write leader (targets of the $8000/$A000 cassette entries) | as in row 7 | PRG pp. 93–94; MLAB pp. 239–240; Cadge Oct85 (with CoCo pairs); IDMC p. 139 ("$893E, $8999 and $801B… reading and writing tapes", OCR of $B93E/$B999 ⚠) | 2–3 each | |
| 32 | **$852B** (34091) | Wait for a key (Dragon Notebook); used by PRG's BREAK-disable routine when BREAK is seen | — | Dragon Notebook (WoD wiki, search snippet only); PRG p. 105 (routine in the hook at $19A; it also jumps to **$84A6**) | 2 | CoCo equivalent 44539 per WoD "CoCo ROM equivalents" (snippet) |
| 33 | **$978E** (38798) | 8-bit random number to location 278 | — | DU Aug84; Cadge Mar86 | 2 | |
| 34 | **$957A** (38266) | Print the unsigned 16-bit number in D | — | DU Nov84; Cadge Nov85 | 2 | |
| 35 | **$A93A / $AA10** | Reset VDU to text / select colour set from B | — | Cadge Nov85/Dec85; DU Nov88 | 2 each | |
| 36 | **$BAEC / $BAC3** | Audio on (B=0) / off | — | DU Sep85; Cadge Oct85/Dec85 | 2 | |
| 37 | **$B6A5** (46757) | CSAVE the BASIC program (name 466–473, length 465) | — | DU Jun85 ("46757, not 46756"); Cadge Oct85 | 2 | |
| 38 | **$BB40 / $BB88 or $BBBB** | Hardware init (INIT) / BASIC variables setup (SETUP) | — | PRG p. 93 ("SETUP &HBBBB"); MLAB p. 239 ("SETUP &HBB88") | 1 author | ⚠ The two books by the same author disagree on SETUP |

**Seen once (DU / Cadge, one source each)**, for reference: graphics ($A989 set VDG mode, $A99D, $A9CD, $A9A4, $A928, $A938, $AA23 PCLEAR, $A8C7, $BA28, $B9DF/$BA07 SET/RESET, $B051 DRAW, $A6EF PSET, $A6F3 PRESET, $A749 LINE, $A6AB/$A626 for PPOINT); sound ($BAA0 beep, $BAA5 SOUND, $BAC5, $AE9A play note, $BAD4/$BAD6 D/A); parse and variables ($8877, $8887, $8A94, $8C36, $9C3E, $8CD7 garbage collect, $8D9F, $B7CC); system ($8344 system error, B = code×2, also ITD hook table p. 243; $8417 NEW; $8434 reset stack; $B400 cold boot; $83F3 used by UNNEW routines in PRG pp. 107–108 and DU Dec87; $862D, $8B06 purpose unstated); cassette ($BDCF motor on, $B991, $B65F, $BDE7, $B933, $B8B3, $B748, $991B CSAVEM, $A092 CLOADM, $B682 CSAVE, $B81E SKIPF, $B714 load BASIC with a damaged header).

### 1.2 Addresses that were documented but not "called"

- **ITD p. 242–243: the complete RAM-hook table with the ROM address that calls each hook.** For example, hook $167 (char output) is called from $B54B; hook $19A (new statement) from $849F; hook $1A3/$1A6 (crunch/expand) from $8F67/$8F08. This matters only for strict fidelity: hook timing must match.
- **ITD Appendix 7 (pp. 345–348): every keyword with its token and dispatch address.** ITD p. 341 says these dispatch addresses are **the same on the Dragon 64 in 32K mode**. I did not copy that table here. It is available if the team decides dispatch addresses must match.
- **Interrupt vectors** $BFF2–$BFFF → $100/$103/$10F/$10C/$106/$109 and reset $B3B4: DD83 p. 3 👁, ITD p. 193, LOD p. 189 👁.
- **D64 64K-mode bootstrap at $BF49**, and **unused auto-repeat code at $BF20 in the "old" ROM** (ITD p. 340, D64 appendix). Both concern the D64 ROM, not the D32.

### 1.3 Use of ROM data

| Data | Address(es) | Source | Use |
|---|---|---|---|
| Command keyword list / dispatch table | $8033 (to $8153) / $8154 | ITD p. 239 (stub at $120–$124: count $4E); COMP p. 35; PRG p. 97 (gives keyword table as $8033–$8128 ⚠, which conflicts with COMP's $8153) | Programs adding or redefining keywords copy or point to them. PRG shows how to copy the tables to RAM and redefine keywords |
| Function keyword list / dispatch | $81CA (to $824F) / $8250 (to $8293) | ITD p. 239 (count $22); COMP p. 35; PRG p. 97 | same |
| Error-message 2-letter table | $82A9–$82DB | PRG p. 97 | Cadge Mar86 gives the order NF SN RG OD FC OV OM UL BS DD /0 ID TM OS LS ST CN UF FD AO DN IO FM NO IE DS NE (codes 0–52 in steps of 2) |
| Whole ROM as "noise" | $9000–$B000 | LOD p. 174 (plays the ROM bytes through the DAC as white noise) | Only a curiosity, but it does read ROM contents |
| Whole ROM via disassembler | from $82F7 | Cadge disassembler (*Your Computer* May 1983, reprinted in IDMC App. H) | — |

No era program was found that PEEKs specific ROM bytes as constants.

### 1.4 Compatibility findings from the era

- **The clearest advice to use the vectors is from Ian Sinclair, not Dragon Data** (IDMC p. 114): "it's possible that later versions of Dragon will have these routines at different addresses. Their addresses are, however, stored at other addresses!" ($A000/$A002). ITD p. 146 explains the two jump tables in the same way.
- **I found no Dragon Data sentence saying "use only $8000/$A000".** DD83 itself sends USR programmers to $8B2D/$8C37 and describes RAM hooks.
- **Dragon 64 (ITD Appendix 5, pp. 340–341):**
  - In 32K mode, "very few differences between the BASIC ROM entry points"; "all the dispatch addresses given in Appendix 7 remain the same". Patches went into previously unused ROM areas, with bigger changes in the I/O driver area (RS-232, auto-repeat, 64K boot).
  - In 64K mode the ROM is copied to RAM at +$4000 ($C000 jump table, $E000 vectors, IRQ $DD3D, auto-repeat IRQ entry $FE18). This holds up to the init code at $B39B/$F39B.
  - Other D64 differences:
    - USR1–USR9 no longer need a leading zero. On the D64, "USR01" is a syntax error.
    - VARPTR and MEM return unsigned values.
    - DLOAD/DLOADM work.
    - RAM $11A–$11F and $3FD–$3FF are now used.
  - Auto-repeat was put only in 64K mode "to avoid incompatibilities with existing software" (DU Dec 1983 D64 review).
  - The D64 printer routine also waits while a key is held (Cadge, DU Nov85).
- **CoCo:**
  - Cadge (DU Sep85): routines are "generally identical… differing only by position in the ROM". He gives a CoCo pair for almost every address.
  - DU Dec87 maps CoCo $A59A/$B26A/$B73D/$B26D/$B267 → Dragon 47052/35239/36483/35242/35236.
  - DU Jul87: a BREAK-disable routine failed on a CoCo because it used Dragon ROM addresses.
- **Named commercial games that broke on the D64 or a later ROM revision: none found.**

---

## PART 2: Speed of the original BASIC (published measurements)

### 2.1 Rugg/Feldman ("PCW benchmarks") BM1–BM8, seconds

| Machine | BM1 | BM2 | BM3 | BM4 | BM5 | BM6 | BM7 | BM8 | Source |
|---|---|---|---|---|---|---|---|---|---|
| **Dragon 32** | 1.6 | 10.2 | 19.7 | 21.6 | 23.3 | 34.3 | 50.0 | **12.9** (100 loops) | *Personal Computer World*, **Aug 1982**, Dragon 32 Benchtest, "Benchmark timings" box, p. 116. The box refers to PCW Vol 4 No 11 (Nov 1981) for the programs. https://archive.org/details/PersonalComputerWorld1982-08 |
| Dragon 32 (same data) | 1.60 | 10.20 | 19.70 | 21.60 | 23.30 | 34.30 | 50.00 | **129.00** (= 12.9 × 10, extrapolated) | *PCW*, **Jan 1985**, "On your marks" round-up, pp. 184–187 (table about p. 186); row "Dragon 32, Aug82"; average 36.21. The text says early 100-loop BM8 figures "have been multiplied by 10". https://archive.org/details/PersonalComputerWorld1985-01 |
| **Dragon 32** | **1.27** | **9.14** | **17.70** | **19.17** | **22.16** | **31.07** | **44.68** | **10.82** (100 loops) | *Computing Today*, **Nov 1982**, "Enter the Dragon", Henry Budgett, p. 24, Table 1: "timed using the internal clock function. Note that BM8 is taken over 100 loops". Scan checked by the sub-agent. https://archive.org/details/computing-today-1982 (file ComputingToday198211) |
| Dragon 32 (rounded CT) | 1.2 | 9.1 | 17.7 | 19.2 | 22.2 | 31.1 | 44.7 | 10.8 | *Computing Today*, **Feb 1985**, p. 49, "Benchmarks analysed" (from the *Microchoice* table). The footnote "all CT benchmarks… 1000 iterations" contradicts the 1982 note that BM8 was 100 loops. https://archive.org/details/computing-today-1985 |
| Dragon 32/64 (copy of PCW) | 1.6 | 10.2 | 19.7 | 21.6 | 23.3 | 34.3 | 50.0 | 129 | Wikipedia "Rugg/Feldman benchmarks" (cites *DatorHobby* 1/84, not opened); CPCWiki "BASIC Benchmark" (cites PCW, no issue) |
| *Comparison:* Tandy CoCo 2 64K (6809) | 1.4 | 10.5 | 20.4 | 22.3 | 24.0 | 34.7 | 51.1 | 132.6 | *Practical Computing*, Feb 1984, p. 65 (Jack Schofield). https://archive.org/details/PracticalComputing1984February02 |

**The sources disagree.**
- *Computing Today* (Dragon's own TIMER) is about 10–20 % faster than *PCW*: BM2 9.14 vs 10.2; BM7 44.68 vs 50.0; BM8 (100 loops) 10.82 vs 12.9.
- *PCW* does not say how it timed. Its 1985 article mentions stop-watch timing.
- **One possible reason (my inference, not verified):** the 50 Hz TIMER may count slightly slow during heavy BASIC work, or the stop-watch adds reaction time. Our emulator should be compared with both sets, and real-hardware runs should decide.

**The programs.**
- Printed in *PCW* Jan 1985, pp. 184–185 (lines 100–190 for each test; BM8 to 1000 loops).
- Earlier in PCW Vol 4 No 11 (Nov 1981).
- *CT* Feb 1985, p. 49 prints BM8 with 1000 loops. Wikipedia prints the full set with BM8 at 100 loops.
- In short:
  - BM1 = empty FOR K=1 TO 1000 loop.
  - BM2 = K=K+1 / IF K<1000 THEN loop.
  - BM3 adds `A=K/K*K+K-K`.
  - BM4 uses `A=K/2*3+4-5`.
  - BM5 adds GOSUB/RETURN to an empty subroutine.
  - BM6 adds DIM M(5) and an inner FOR L=1 TO 5 loop.
  - BM7 adds `M(L)=A` in the inner loop.
  - BM8 = `A=K^2`, `B=LOG(K)`, `C=SIN(K)` loop.

  Each test prints "S" at the start and "E" at the end for manual timing.

### 2.2 Other published timings

| Test | Dragon 32 | Comparison | Source |
|---|---|---|---|
| Ahl's *Creative Computing* benchmark (100 × (10 SQR + 10 squaring + RND)) | **2:29 (149 s)**; accuracy .000596284867; random 7.3 | Color Computer 2:23; Micro Color Computer 1:59 | *Creative Computing*, **Jan 1984, p. 12**, 107-machine table (scan checked by the sub-agent). https://archive.org/details/Creative_Computing_1984-01 |
| FOR loop to 1000 | = BM1: 1.6 s (PCW) / 1.27 s (CT) | | as above |
| Cassette | only the rated speed: "1500 baud" | | *CT* Nov 1982 factsheet; *Practical Computing* Oct 1982 (Mike Hughes) |
| BYTE Jan 1983 | no timings ("6809E, speed unknown") | | |

### 2.3 Speed-up POKE (65495,0)

**No published timing found.** *Popular Computing Weekly* letters (13 Jan 1983, 10 Feb 1983) discuss the POKE, the SAM addresses and its side effects on cassette and keyboard, but give no benchmark numbers.

---

## Open questions / could not find

1. **$9D3D vs $9D93.** The evidence strongly favours $9D3D (5 sources vs 1), but this should be confirmed on real hardware: chain an IRQ and check that TIMER keeps running.
2. **INTCNV entry:** $8B2D (DD83, ITD, LOD, DU), with neighbours $8B27/$8B29/$8B30 cited elsewhere. These may be separate entry points; unresolved.
3. **SETUP:** $BBBB vs $BB88 (same author, two books); **CLOAD:** $B6D0 (PH) vs $B6D4 (DU listing).
4. **What $852B and $84A6 do exactly.** Only a wiki snippet and one BREAK-disable routine.
5. **PRG keyword-table end $8128 vs COMP $8153.** Probably OCR or misprint; ITD's dispatch-table start $8154 supports $8153.
6. **Any named commercial game that failed on the D64 or a ROM revision**, and the address it used: none found. **Any explicit Dragon Data "use only the tables" statement**: none found.
7. **World of Dragon archive and wiki were unreachable** (connection timed out). "Dragon Notebook" and "CoCo ROM equivalents" were seen only as search snippets.
8. Not checked: *Dragon Update*, *Popular Computing Weekly* / *Home Computing Weekly* listings, *Which Micro?*, *Your Computer* reviews, *DatorHobby* 1/84, the *Microchoice* table. Two DU issues (Aug85, Jun86) did not download.
9. **Benchmarks not found:** Dragon 64 BM1–BM8; any Byte Sieve, PRINT-speed, PAINT/fill or measured CLOAD time; any timing with POKE 65495,0; the author of the PCW Aug 1982 benchtest.
10. Counts are lower bounds. OCR misses many type-in listings, and many values rest on OCR (marked ⚠ where doubtful).

---

## Our measurement (22.10.2026)

Our one-chip ROM (`rom/`, build of 21.10) in XRoar, Dragon 32 PAL, the same BM1–BM8 programs (BM8 at 100 loops), timed with TIMER (50 per second), like Computing Today. Seconds:

| | BM1 | BM2 | BM3 | BM4 | BM5 | BM6 | BM7 | BM8 |
|---|---|---|---|---|---|---|---|---|
| PCW Aug 1982 | 1.6 | 10.2 | 19.7 | 21.6 | 23.3 | 34.3 | 50.0 | 12.9 |
| Computing Today Nov 1982 | 1.27 | 9.14 | 17.70 | 19.17 | 22.16 | 31.07 | 44.68 | 10.82 |
| **Ours** | **1.56** | **10.44** | **20.48** | **22.48** | **24.14** | **36.02** | **53.56** | **12.28** |

Against PCW we are 2–7% slower (BM8 5% faster). Against Computing Today 10–20% slower. The two magazines differ from each other by about the same amount, so only a real machine can decide. Decision (22.10): no speed work now; keep these as real-machine tests.
