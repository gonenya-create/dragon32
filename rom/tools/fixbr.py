import re,subprocess,sys
for it in range(20):
    r=subprocess.run(['asm6809','-B','-o','/dev/null','exp.s'],capture_output=True,text=True)
    errs=re.findall(r'error: (\S+?):(\d+): 8-bit relative value out of range',r.stderr)
    if not errs:
        print('clean' if r.returncode==0 else r.stderr[:500]); break
    byf={}
    for f,l in errs: byf.setdefault(f,set()).add(int(l))
    for f,ls in byf.items():
        L=open(f).read().split('\n')
        for n in ls:
            L[n-1]=re.sub(r'(\t)(b(?:sr|ra|eq|ne|cs|cc|hi|ls|lo|hs|pl|mi|gt|ge|lt|le|vs|vc))(\t)',lambda m:m.group(1)+'l'+m.group(2)+m.group(3),L[n-1],count=1)
        open(f,'w').write('\n'.join(L))
