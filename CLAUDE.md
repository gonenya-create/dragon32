# Dragon 32 (dragon1982.com)

The Dragon 32 home computer (1982) in the browser: an installable app (PWA) built by Gonen Yarom, a hobbyist
who grew up on this machine. Answer the owner in Hebrew, simply. He is not a programmer.

**Read `docs/DRAGON-SESSION.md` first** (rules, workflow, owner rules), then `docs/DRAGON-APP.md`
(founding document: goal and decisions), then `docs/DRAGON.md` (what is built).

## Hard rules
- **Never infringe copyright.** No original ROM, no original games or software, no names, logos or graphics of others.
- **This repo is public.** No key, password or `.env` file ever goes into git. Keys live only in Vercel env.
- **Merge to main only on the owner's "מזג" / "תמזג", written directly in this session.**
- **Separate from the personal site** `gonenyarom.co.il` (repo `gonenyarom`, owned by the "Mac manager" session).
  The basic edition at `gonenyarom.co.il/dragon/` stays there, frozen. Anything that touches the site is coordinated with that session first.

## How it is built
- Static HTML/CSS/JS, no build step. `index.html` is the full computer.
- The engine is in `assets/dragon/` (our own BASIC interpreter, graphics, sound, cartridges, tapes).
- `api/dragon-ai.js` is one Vercel function: the AI helper (Claude Sonnet 5.5, `ANTHROPIC_API_KEY` in Vercel env only).
- `sw.js` + `manifest.webmanifest` make it installable and usable offline.
- Tests: `cd tools && npm test` (full, once before a merge); `ONLY="<part>" node dragon-test.mjs` while working.
