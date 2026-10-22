# מקצר קפיצות ארוכות (lbsr/lbra/lbxx) לקצרות כשהן בטווח. לא נוגע במשמעות: אותה קפיצה, פחות בתים.
import re,subprocess,glob,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src'))
files=[f for f in glob.glob('*.s')]
pat=re.compile(r'(\t)l(b(?:sr|ra|eq|ne|cs|cc|hi|ls|lo|hs|pl|mi|gt|ge|lt|le|vs|vc))(\t)')
orig={f:open(f).read() for f in files}
# 1. כל הארוכות → קצרות
for f in files:
    open(f,'w').write(pat.sub(lambda m:m.group(1)+m.group(2)+m.group(3),orig[f]))
# 2. חוזרים לארוכה רק איפה שהאסמבלר אומר שאין טווח, עד שנקי
for it in range(60):
    r=subprocess.run(['asm6809','-B','-o','/dev/null','exp.s'],capture_output=True,text=True)
    errs=re.findall(r'error: (\S+?):(\d+): 8-bit relative value out of range',r.stderr)
    if not errs:
        print('clean after',it,'rounds' if r.returncode==0 else r.stderr[:400]); break
    byf={}
    for f,l in errs: byf.setdefault(f,set()).add(int(l))
    for f,ls in byf.items():
        L=open(f).read().split('\n')
        for n in ls:
            L[n-1]=re.sub(r'(\t)(b(?:sr|ra|eq|ne|cs|cc|hi|ls|lo|hs|pl|mi|gt|ge|lt|le|vs|vc))(\t)',lambda m:m.group(1)+'l'+m.group(2)+m.group(3),L[n-1],count=1)
        open(f,'w').write('\n'.join(L))
