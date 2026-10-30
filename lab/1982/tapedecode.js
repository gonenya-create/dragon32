// קורא קלטות Dragon מהמיקרופון (גונן, 30.10: "רכיב שעובד לטייפ להשמעה מאייפון או מכל מכשיר אחר שיהיה עמיד").
// Reads a Dragon cassette from a microphone recording (a phone or tape deck playing near the computer) and returns
// the files on it as blocks, exactly as the ROM wrote them. The machine then loads them with CLOAD like any tape.
//
// Why not just hand the sound to the machine: a phone speaker and a laptop microphone weaken the high tone (bit 1)
// and shift its timing, so many waves come out the wrong length. The original circuit only measures where the wave
// crosses zero and fails on such a recording. Here:
//  1. Band-pass, find the stretches with signal, and measure the real pace from the leader (every device's clock differs).
//  2. Learn the speaker-room-microphone sound from the leader (known pattern 1,0,1,0) and build a filter that undoes it.
//  3. Split the sound into whole waves by dynamic programming: each wave is a 0 (long) or a 1 (short), and the best
//     split overall is chosen. A long 0 can no longer turn into two short 1s.
//  4. Learn from the recording itself how each wave really sounds after the waves before it, and read again (a few rounds).
//  5. Keep only blocks whose checksum and structure are right; several readings vote. A block that failed in one
//     playing can be taken from another playing of the same tape.
// Cassette format (Dragon 32): one sine wave per bit, 0 = 813 CPU cycles, 1 = 435 (0.894886 MHz), low bit first.
// Leader 0x55, sync 0x3C, then type, length, data, checksum (sum of type, length and data, low byte).
(function () {
  'use strict';
  const CPU = 894886, T1 = 435 / CPU, T0 = 813 / CPU;

  // ---------- signal basics ----------
  function fft(re, im, inv) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const a = (inv ? 2 : -2) * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a), h = len >> 1;
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
        for (let j = 0; j < h; j++) { const p = i + j, q = p + h, vr = re[q] * cr - im[q] * ci, vi = re[q] * ci + im[q] * cr;
          re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
    }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  // overlap-add FFT convolution; the filter is centred, so the output lines up with the input
  function convolve(x, h) {
    const M = h.length, N = 1 << Math.ceil(Math.log2(M * 4)), B = N - M + 1, Hr = new Float64Array(N), Hi = new Float64Array(N);
    Hr.set(h); fft(Hr, Hi, false);
    const y = new Float32Array(x.length + M), re = new Float64Array(N), im = new Float64Array(N);
    for (let s = 0; s < x.length; s += B) {
      re.fill(0); im.fill(0); re.set(x.subarray(s, Math.min(x.length, s + B))); fft(re, im, false);
      for (let i = 0; i < N; i++) { const r = re[i] * Hr[i] - im[i] * Hi[i]; im[i] = re[i] * Hi[i] + im[i] * Hr[i]; re[i] = r; }
      fft(re, im, true); for (let i = 0; i < N && s + i < y.length; i++) y[s + i] += re[i];
    }
    return y.subarray(M >> 1, (M >> 1) + x.length);
  }
  function bandpass(x, sr) {
    const hp = Math.exp(-2 * Math.PI * 250 / sr), lp = Math.exp(-2 * Math.PI * 6000 / sr), y = new Float32Array(x.length);
    let a = 0, px = 0, s = 0;
    for (let i = 0; i < x.length; i++) { a = hp * (a + x[i] - px); px = x[i]; s = lp * s + (1 - lp) * a; y[i] = s; }
    return y;
  }
  function envelope(y, sr, tau) {
    const e = new Float32Array(y.length), c = Math.exp(-1 / (sr * tau)); let v = 0;
    for (let i = 0; i < y.length; i++) { v = Math.max(Math.abs(y[i]), c * v); e[i] = v; }
    return e;
  }
  // stretches with tape signal. Loudness per 20 ms; the line between quiet and tape sits a third of the way (in dB)
  // from the room's quiet to the tape's level, so dips in the middle of a tape (a speaker, a hand, the room) don't cut it.
  // A stretch ends after 60 ms below the line.
  function segments(y, sr) {
    const F = Math.max(1, Math.round(sr * 0.02)), nf = Math.floor(y.length / F), lv = new Float32Array(nf);
    for (let f = 0; f < nf; f++) { let s = 0; for (let i = f * F; i < (f + 1) * F; i++) s += y[i] * y[i]; lv[f] = 10 * Math.log10(s / F + 1e-12); }
    const so = Array.from(lv).sort((p, q) => p - q), floor = so[Math.floor(nf * 0.005)], top = so[Math.floor(nf * 0.95)];
    if (!(top - floor > 6)) { // all one level: either all tape (recording started late) or no tape at all
      for (let t = 0; t + sr * 0.4 < y.length; t += Math.round(sr * 0.25)) if (leaderAt(y, sr, t, t + Math.round(sr * 0.4))) return Object.assign([[0, y.length]], { quiet: [] });
      return Object.assign([], { quiet: [] });
    }
    const th = floor + (top - floor) / 3, out = []; let s = -1, quiet = 0, lastOn = -1;
    for (let f = 0; f < nf; f++) {
      if (lv[f] > th) { if (s < 0) s = f; quiet = 0; lastOn = f; }
      else if (s >= 0 && ++quiet >= 3) { out.push([s * F, (lastOn + 1) * F]); s = -1; quiet = 0; }
    }
    if (s >= 0) out.push([s * F, (lastOn + 1) * F]);
    const segs = out.filter(([a, b]) => b - a > sr * 0.05);
    // frames 12 dB or more under the tape's level: an echo or a pause, not a block
    segs.quiet = []; for (let f = 0; f < nf; f++) if (lv[f] < top - 12) segs.quiet.push([f * F, (f + 1) * F]);
    return segs;
  }
  // does the stretch start with a leader (1,0,1,0...)? Strong self-similarity one pair (1+0) apart.
  function leaderAt(y, sr, a, b) {
    const P = Math.round((T1 + T0) * sr), e = Math.min(b, a + Math.round(sr * 0.3)) - P; if (e - a < P * 4) return false;
    let c = 0, p = 0, q = 0; for (let i = a; i < e; i++) { c += y[i] * y[i + P]; p += y[i] * y[i]; q += y[i + P] * y[i + P]; }
    return c / Math.sqrt(p * q + 1e-20) > 0.4;
  }
  // the real pace: autocorrelation peak near 12 leader pairs (1+0), refined between samples
  function measureScale(y, sr, a, b) {
    const P = (T1 + T0) * sr, K = 12, cc = l => { let c = 0; for (let i = a; i < b - l; i++) c += y[i] * y[i + l]; return c; };
    let best = null;
    for (let lag = Math.floor(K * P * 0.95); lag <= Math.ceil(K * P * 1.05); lag++) { const c = cc(lag); if (!best || c > best.c) best = { c, lag }; }
    const c0 = cc(best.lag - 1), c1 = best.c, c2 = cc(best.lag + 1), d = c0 - 2 * c1 + c2;
    return (best.lag + (d ? (c0 - c2) / (2 * d) : 0)) / (K * P);
  }
  const idealAt = (t, k) => { const t1 = T1 * k, P = (T1 + T0) * k; t = ((t % P) + P) % P; return t < t1 ? Math.sin(2 * Math.PI * t / t1) : Math.sin(2 * Math.PI * (t - t1) / (T0 * k)); };
  function dft(f, n, get) { let r = 0, i = 0; for (let j = 0; j < n; j++) { const v = get(j), a = 2 * Math.PI * f * j; r += v * Math.cos(a); i -= v * Math.sin(a); } return [r, i]; }
  // filter that undoes the channel: measure it at the leader's harmonics, smooth between them, invert (with a gain limit)
  function design(y, sr, a, b, k) {
    const N = 1 << Math.ceil(Math.log2(sr * 0.008)), P = (T1 + T0) * k, f0 = 1 / P, n = Math.round(Math.floor((b - a) / sr / P) * P * sr);
    let best = null;
    for (let s = 0; s < 200; s++) { const tau = s / 200 * P; let c = 0; for (let j = 0; j < n; j += 2) c += y[a + j] * idealAt(j / sr + tau, k); if (!best || Math.abs(c) > Math.abs(best.c)) best = { c, tau }; }
    const pts = [];
    for (let h = 1; h * f0 < Math.min(5200, sr * 0.45); h++) {
      const f = h * f0 / sr, X = dft(f, n, j => idealAt(j / sr + best.tau, k)), Y = dft(f, n, j => y[a + j]), xm2 = X[0] * X[0] + X[1] * X[1];
      if (Math.sqrt(xm2) < n * 0.02) continue;
      const hr = (Y[0] * X[0] + Y[1] * X[1]) / xm2, hi = (Y[1] * X[0] - Y[0] * X[1]) / xm2;
      pts.push({ f: h * f0, mag: Math.hypot(hr, hi), ph: Math.atan2(hi, hr) });
    }
    if (pts.length < 2) return null;
    for (let i = 1; i < pts.length; i++) { while (pts[i].ph - pts[i - 1].ph > Math.PI) pts[i].ph -= 2 * Math.PI; while (pts[i].ph - pts[i - 1].ph < -Math.PI) pts[i].ph += 2 * Math.PI; }
    const re = new Float64Array(N), im = new Float64Array(N); let maxG = 0; for (const p of pts) maxG = Math.max(maxG, p.mag);
    const fa = pts[0].f, fb = pts[pts.length - 1].f;
    for (let i = 0; i <= N / 2; i++) {
      const f = i * sr / N; let g = 0, ph = 0;
      if (f >= fa * 0.6 && f <= fb) {
        let j = pts.findIndex(p => p.f >= f); if (j <= 0) j = 1;
        const p0 = pts[j - 1], p1 = pts[j], u = Math.min(1, Math.max(0, (f - p0.f) / (p1.f - p0.f)));
        const lm = Math.log(Math.max(p0.mag, maxG * 1e-3)) * (1 - u) + Math.log(Math.max(p1.mag, maxG * 1e-3)) * u;
        ph = p0.ph * (1 - u) + p1.ph * u; g = Math.min(1 / Math.exp(lm), 40 / maxG) * Math.max(0, Math.min(1, (f - fa * 0.6) / (fa * 0.4), (fb - f) / 800));
      }
      re[i] = g * Math.cos(-ph); im[i] = g * Math.sin(-ph); if (i && i < N / 2) { re[N - i] = re[i]; im[N - i] = -im[i]; }
    }
    fft(re, im, true);
    const h = new Float32Array(N); for (let i = 0; i < N; i++) { const j = (i + N / 2) % N; h[j] = re[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / (N - 1))); }
    return h;
  }

  // ---------- reading waves ----------
  // normalise by a fast peak envelope, so the loudness of the playing doesn't matter
  function normalise(z, a, b, sr) {
    const n = b - a, x = new Float32Array(n + 2), c = Math.exp(-1 / (sr * 0.004)); let v = 0;
    for (let i = 0; i < n; i++) { v = Math.max(Math.abs(z[a + i]), c * v); x[i] = z[a + i] / (v + 1e-9); }
    return x;
  }
  function stretch(t, L) {
    const o = new Float32Array(L), n = t.length;
    for (let i = 0; i < L; i++) { const p = (i + 0.5) * n / L - 0.5, f = Math.floor(p), w = p - f, a = t[Math.max(0, Math.min(n - 1, f))], b = t[Math.max(0, Math.min(n - 1, f + 1))]; o[i] = a + (b - a) * w; }
    return o;
  }
  const M = 48, sine = () => Float32Array.from({ length: M }, (_, i) => 0.8 * Math.sin(2 * Math.PI * (i + 0.5) / M));
  // best split of x into waves. tpl[ctx] = how a wave sounds, by context (C bits before it + the bit itself).
  // With C = 0 the templates are plain sines. Each wave may be up to J samples longer or shorter than nominal.
  function viterbi1(x, n, sr, k, tpl, C, J, st) {
    const NS = 1 << C, Ls = [Math.round(T0 * k * sr), Math.round(T1 * k * sr)], T = [];
    for (let s = 0; s < NS; s++) { T[s] = [[], []]; for (let c = 0; c < 2; c++) for (let j = -J; j <= J; j++) { const L = Ls[c] + j, t = stretch(tpl[(s << 1) | c], L); let e = 0; for (let i = 0; i < L; i++) e += t[i] * t[i]; T[s][c].push({ t, L, cost: 0.5 * e + 0.3 * Math.abs(j) }); } }
    const best = [], from = [], prev = [], bitAt = [];
    for (let s = 0; s < NS; s++) { best.push(new Float64Array(n + 1).fill(-Infinity)); from.push(new Int32Array(n + 1).fill(-1)); prev.push(new Int8Array(n + 1)); bitAt.push(new Int8Array(n + 1)); }
    if (st < 0) { for (let p = 0; p < Ls[0] * 2 && p <= n; p++) for (let s = 0; s < NS; s++) best[s][p] = 0; } // free start
    else best[st][0] = 0; // continue exactly where the last window stopped
    for (let p = 0; p < n; p++) for (let s = 0; s < NS; s++) {
      const bp = best[s][p]; if (bp === -Infinity) continue;
      for (let c = 0; c < 2; c++) { const ns = ((s << 1) | c) & (NS - 1), bn = best[ns], list = T[s][c];
        for (let m = 0; m < list.length; m++) { const o = list[m], q = p + o.L; if (q > n) continue; const t = o.t; let d = 0; for (let i = 0; i < o.L; i++) d += x[p + i] * t[i];
          const sc = bp + d - o.cost; if (sc > bn[q]) { bn[q] = sc; from[ns][q] = p; prev[ns][q] = s; bitAt[ns][q] = c; } } }
    }
    let q = n, s = 0, bq = -Infinity;
    for (let p = n; p > Math.max(0, n - Ls[0] * 2); p--) for (let t = 0; t < NS; t++) if (best[t][p] > bq) { bq = best[t][p]; q = p; s = t; }
    const bits = [], starts = [];
    while (q > 0 && from[s][q] >= 0) { const p = from[s][q]; bits.push(bitAt[s][q]); starts.push(p); const ps = prev[s][q]; q = p; s = ps; }
    return { bits: bits.reverse(), starts: starts.reverse() };
  }
  // long stretches in windows of 2 s (plus 0.3 s to look ahead), each window continuing the last one's path
  function viterbi(x, n, sr, k, tpl, C, J) {
    const W = Math.round(sr * 2), O = Math.round(sr * 0.3), bits = [], starts = [];
    let off = 0, st = -1;
    while (off < n) {
      const len = Math.min(n - off, W + O), last = off + len >= n, r = viterbi1(x.subarray(off), len, sr, k, tpl, C, J, st);
      let i = 0;
      for (; i < r.bits.length; i++) { if (!last && r.starts[i] >= W) break; bits.push(r.bits[i]); starts.push(off + r.starts[i]); }
      if (last || i >= r.bits.length || i === 0) break;
      st = 0; for (let j = Math.max(0, bits.length - C); j < bits.length; j++) st = ((st << 1) | bits[j]) & ((1 << C) - 1);
      off += r.starts[i];
    }
    return { bits, starts };
  }
  // learn the templates from the waves just read: average each context's waves, stretched to M points
  function train(x, bits, starts, C) {
    const NC = 1 << (C + 1), acc = Array.from({ length: NC }, () => new Float64Array(M)), cnt = new Array(NC).fill(0);
    for (let i = C; i < bits.length - 1; i++) {
      let ctx = 0; for (let j = C; j >= 0; j--) ctx = (ctx << 1) | bits[i - j];
      const a = starts[i], L = starts[i + 1] - a; if (L < 8) continue;
      for (let m = 0; m < M; m++) { const p = a + (m + 0.5) * L / M - 0.5, f = Math.floor(p), w = p - f; acc[ctx][m] += x[f] + (x[f + 1] - x[f]) * w; }
      cnt[ctx]++;
    }
    return acc.map((a, i) => cnt[i] > 3 ? Float32Array.from(a, v => v / cnt[i]) : sine());
  }

  // ---------- bytes and blocks ----------
  const byteAt = (b, p) => { let v = 0; for (let k = 0; k < 8; k++) v |= b[p + k] << k; return v; };
  function blocksOf(r, base) {
    const b = r.bits, out = [];
    for (let i = 8; i + 24 <= b.length; i++) {
      if (byteAt(b, i) !== 0x3c || byteAt(b, i - 8) !== 0x55) continue;
      const p = i + 8, t = byteAt(b, p), l = byteAt(b, p + 8);
      const at = base + r.starts[i];
      if (p + 16 + 8 * (l + 1) > b.length) { if (i >= 16 && byteAt(b, i - 16) === 0x55) out.push({ at, ok: false }); break; }
      let s = t + l; const data = []; for (let k = 0; k < l; k++) { const v = byteAt(b, p + 16 + 8 * k); data.push(v); s += v; }
      const ok = (s & 255) === byteAt(b, p + 16 + 8 * l) && sane(t, data);
      // a failed block counts only after two leader bytes (0x55 0x55, as between real blocks): otherwise it is noise
      if (!ok && (i < 16 || byteAt(b, i - 16) !== 0x55)) continue;
      out.push({ at, ok, t, data, end: base + (r.starts[p + 16 + 8 * (l + 1)] ?? r.starts[r.starts.length - 1]) });
      if (ok) i = p + 16 + 8 * (l + 1) - 1;
    }
    return out;
  }
  // structure checks, so a block that passes its checksum by chance is still refused
  function sane(t, d) {
    if (t === 0) { if (d.length < 15) return false; for (let i = 0; i < 8; i++) if (d[i] < 0x20 || d[i] > 0x7e) return false; return d[8] <= 2 && (d[9] === 0 || d[9] === 0xff) && (d[10] === 0 || d[10] === 0xff || d[10] === 1); }
    if (t === 1) return d.length > 0;
    return t === 0xff && d.length === 0;
  }

  // ---------- the whole reader ----------
  // x: Float32Array of samples, sr: sample rate. progress(fraction) is optional.
  // Returns { files: [{ n, b: [[type, ...data], ...], ok }], blocks: [...all slots in time order], seconds }
  const LIMIT = 90000; // ms
  function decode(x, sr, progress) {
    const t0 = Date.now();
    const y = bandpass(x, sr), segs = segments(y, sr), slots = [], calm = [];
    let k = 1, h = null, done = 0; const total = segs.reduce((s, [a, b]) => s + b - a, 0) || 1;
    // calm = stretches that are surely not a block: silence between the stretches, and leader runs found while reading
    // (and the first and last 80 ms of each stretch, where the sound fades in and out)
    let prevEnd = 0; for (const [a, b] of segs) { calm.push([prevEnd, a + Math.round(sr * 0.08)]); prevEnd = b - Math.round(sr * 0.08); } calm.push([prevEnd, y.length]); calm.push(...segs.quiet);
    for (let [a, b] of segs) {
      const b0 = b;
      b = Math.min(y.length, b + Math.round(sr * 0.025)); // the last waves fade under the threshold: keep 25 ms more
      // measure the pace and the sound at the first leader in this stretch (usually right at its start)
      for (let t = a + Math.round(sr * 0.03); t + sr * 0.3 < b; t += Math.round(sr * 0.05)) {
        if (!leaderAt(y, sr, t, b)) continue;
        const tb = t + Math.round(sr * 0.3); k = measureScale(y, sr, t, tb); h = design(y, sr, t, tb, k) || h; break;
      }
      const pad = h ? h.length : 0, lo = Math.max(0, a - pad), hi = Math.min(y.length, b + pad), ys = y.subarray(lo, hi);
      const streams = [];
      for (const pol of [-1, 1]) { const v = pol > 0 ? ys : ys.map(q => -q); streams.push(normalise(v, a - lo, b - lo, sr)); }
      if (h) { const z = convolve(ys, h); for (const pol of [-1, 1]) { const v = pol > 0 ? z : z.map(q => -q); streams.push(normalise(v, a - lo, b - lo, sr)); } }
      const n = b - a, cands = [];
      // a failed block in a quiet moment (an echo) or in the last 40 ms (noise after the trailer) is not a block
      const real = s => s.best || (s.at < b0 - sr * 0.04 && calmIn(calm, s.at, s.at + Math.round(sr * 0.02)) < sr * 0.01);
      const read = (x2, tpl, C, from = 0, to = n) => { const r = viterbi(x2.subarray(from), to - from, sr, k, tpl, C, 2); cands.push(...blocksOf(r, a + from)); leaderRuns(r, a + from, calm); return r; };
      const current = () => groupSlots(cands, sr).filter(real);
      // problem spots: failed blocks and gaps that are neither leader nor silence, as ranges inside this stretch
      const trouble = () => {
        const sl = current(), good = sl.filter(q => q.best).map(q => q.best).sort((p, q) => p.at - q.at), out = [];
        if (!good.length) return n > sr * 0.15 ? [[0, n]] : []; // nothing read yet: the whole stretch (unless it is too short for a block)
        for (const q of sl) if (!q.best) out.push(q.at - a);
        for (const t of holes(good, calm, sr, a, b0)) out.push(t - a);
        return out.map(t => { // from the end of the good block before it to the start of the good block after it
          const before = good.filter(g => g.end - a <= t).pop(), after = good.find(g => g.at - a > t);
          return [Math.max(0, (before ? before.end - a : 0) - Math.round(sr * 0.2)), Math.min(n, (after ? after.at - a : n) + Math.round(sr * 0.2))];
        });
      };
      // stage 1: plain sine waves on every stream
      const first = streams.map(x2 => read(x2, [sine(), sine()], 0));
      // stage 2 and 3, only where something is still wrong: learn how the waves really sound (2, 3, then 4 waves back)
      // and read again. A short stretch is read again whole, 4 rounds; a long one (a long tape) only around the problem
      // spots, with the sounds learnt from the whole stretch. A time limit keeps the browser from working for ever.
      outer: for (const C of [2, 3, 4]) for (let si = 0; si < streams.length; si++) {
        if (C > 2 && si > 1) continue;
        const spots = trouble(); if (!spots.length) break outer;
        if (Date.now() - t0 > LIMIT) break outer;
        const x2 = streams[si]; let r = first[si], tpl = train(x2, r.bits, r.starts, C);
        if (n < sr * 20) for (let round = 0; round < 4; round++) { r = read(x2, tpl, C); tpl = train(x2, r.bits, r.starts, C); }
        else for (let round = 0; round < 2; round++) for (const [p, q] of spots) read(x2, tpl, C, p, q);
      }
      slots.push(...groupSlots(cands, sr).filter(real));
      done += b - a; if (progress) progress(done / total);
    }
    return { files: assemble(slots, calm, sr), blocks: slots, seconds: x.length / sr, calm };
  }
  // runs of 1,0,1,0... (at least two leader bytes) are leader, not data
  function leaderRuns(r, base, calm) {
    const b = r.bits; let s = 0;
    for (let i = 1; i <= b.length; i++) if (i === b.length || b[i] === b[i - 1]) { if (i - s >= 16) calm.push([base + r.starts[s], base + (r.starts[i] ?? r.starts[i - 1])]); s = i; }
  }
  function calmIn(calm, a, b) { let c = 0; const iv = calm.filter(([p, q]) => q > a && p < b).map(([p, q]) => [Math.max(p, a), Math.min(q, b)]).sort((u, v) => u[0] - v[0]); let e = a; for (const [p, q] of iv) { if (q <= e) continue; c += q - Math.max(p, e); e = q; } return c; }
  // where between good blocks there is something that is neither leader nor silence (more than 30 ms): a block is missing there
  function holes(blocks, calm, sr, from, to) {
    const out = [], bl = blocks.filter(Boolean).sort((p, q) => p.at - q.at);
    const gap = (a, b, lim) => { if (b - a - calmIn(calm, a, b) > sr * lim) out.push(a); };
    if (from !== undefined && bl.length) gap(from, bl[0].at, 0.03);
    for (let i = 1; i < bl.length; i++) gap(bl[i - 1].end, bl[i].at, 0.03);
    if (to !== undefined && bl.length) gap(bl[bl.length - 1].end, to, 0.045);
    return out;
  }
  // blocks found by different readings at the same moment (within 15 ms) are the same block; vote among the good ones
  function groupSlots(cands, sr) {
    const sorted = cands.slice().sort((p, q) => p.at - q.at), out = [];
    for (const c of sorted) { const last = out[out.length - 1]; if (last && c.at - last.at0 < sr * 0.015) last.list.push(c); else out.push({ at0: c.at, list: [c] }); }
    for (const s of out) {
      const votes = new Map();
      for (const c of s.list) if (c.ok) { const key = c.t + ':' + c.data.join(','); const v = votes.get(key) || { c, n: 0 }; v.n++; votes.set(key, v); }
      let best = null; for (const v of votes.values()) if (!best || v.n > best.n) best = v;
      s.at = s.at0; s.best = best ? best.c : null; s.votes = best ? best.n : 0; s.tries = s.list.length;
    }
    // a lone failed reading (fewer than 2 readings saw a block there) is noise, not a missing block
    return out.filter(s => s.best || s.tries >= 2);
  }
  // header, data blocks, end block, in time order. parts keeps a null where a block is missing (for merging two playings).
  // ok = header, every data block and the end block, with nothing missing between them.
  function assemble(slots, calm, sr) {
    const files = []; let cur = null;
    const good = slots.filter(s => s.best).map(s => s.best);
    for (const c of good) {
      if (c.t === 0) { if (cur) files.push(cur); cur = { n: String.fromCharCode(...c.data.slice(0, 8)).trim(), list: [c], end: false }; }
      else if (!cur) continue;
      else { cur.list.push(c); if (c.t === 0xff) { cur.end = true; files.push(cur); cur = null; } }
    }
    if (cur) files.push(cur);
    for (const f of files) {
      f.parts = [];
      for (let i = 0; i < f.list.length; i++) {
        if (i && holes([f.list[i - 1], f.list[i]], calm, sr).length) f.parts.push(null);
        f.parts.push([f.list[i].t, ...f.list[i].data]);
      }
      // every data block but the last is full (255 bytes)
      const data = f.parts.filter(q => q && q[0] === 1);
      for (let i = 0; i < data.length - 1; i++) if (data[i].length !== 256) f.parts.splice(f.parts.indexOf(data[i]) + 1, 0, null);
      delete f.list;
      f.missing = f.parts.filter(q => !q).length + (f.end ? 0 : 1);
      f.b = f.parts.filter(Boolean);
      f.ok = f.end && !f.missing && data.length > 0;
    }
    return files;
  }
  // a second playing of the same tape fills the blocks the first one missed: same header, blocks by their place
  function merge(prev, cur) {
    if (!prev || !prev.length) return cur;
    const out = cur.map(g => {
      const f = prev.find(q => q.parts[0] && g.parts[0] && q.parts[0].join() === g.parts[0].join());
      if (!f || g.ok) return g;
      if (f.ok) return f;
      if (f.parts.length !== g.parts.length) return f.missing < g.missing ? f : g;
      const parts = g.parts.map((p, i) => p || f.parts[i]), end = f.end || g.end, missing = parts.filter(q => !q).length + (end ? 0 : 1);
      return { n: g.n, parts, end, missing, b: parts.filter(Boolean), ok: end && !missing };
    });
    for (const f of prev) if (!out.some(g => g.parts[0] && f.parts[0] && g.parts[0].join() === f.parts[0].join())) out.push(f);
    return out;
  }

  const api = { decode, merge, _internal: { bandpass, segments, viterbi, train, blocksOf, calmIn, holes } };
  if (typeof window !== 'undefined') window.D32TapeDecode = api;
  else if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof module === 'undefined') {
    // as a Web Worker: { x, sr, prev } in (prev = the files of an earlier playing), progress and the result out
    self.onmessage = e => { const { x, sr, prev } = e.data; try { const r = decode(x, sr, f => self.postMessage({ progress: f })); self.postMessage({ result: { files: merge(prev, r.files), slots: r.blocks.map(s => ({ at: s.at / sr, ok: !!s.best, t: s.best ? s.best.t : null })), seconds: r.seconds } }); } catch (err) { self.postMessage({ error: String(err && err.message || err) }); } };
  }
  if (typeof module !== 'undefined') module.exports = api;
})();
