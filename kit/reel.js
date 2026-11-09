// =====================================================================
//  kit/reel.js — the renderer for DIALOGUE REELS: two characters banter through a technical explainer over a
//  looping background, one line at a time, with word-by-word captions and an optional diagram card.
//
//  The voice is the clock. Every line of <piece>/voice/script.json names its speaker (and optionally a card and a
//  mood); tools/voice.mjs times it into voice.json, and the build injects that as VOICE. Nothing here is keyed to
//  hand-typed seconds, so a re-take or a rewritten line moves the whole reel with it.
//
//  Layers, back to front:
//    background   BACKGROUND.draw() from backgrounds/<name>.js (a procedural loop), or nothing at all when the
//                 piece uses the user's own clip (backgrounds/video.js): export lays the frames over that clip
//    dim          REEL.dim (0..1) darkens the background so captions and cards read
//    header       REEL.title in a pill at the top, and a progress bar
//    card         CARDS[line.card](u, tl, line) inside the card box (see cardBox()); a card holds until the next one
//    cast         the speaker as a sticker cut-out (white outline, drop shadow), springing in from the bottom edge;
//                 REEL.layout 'solo' shows only the speaker, 'duo' keeps the listener in, smaller and dimmed
//    captions     the spoken words, a few at a time, the current word picked out in the speaker's colour
//
//  The piece defines (in src/head.html, before this file):
//    FPS, W, H, DURATION, NFRAMES, LOOP_T, SAFE, HAND and
//    REEL = { title, layout: 'solo' | 'duo', dim, cast: { <id>: { side: 'left' | 'right', scale? } },
//             caption: { words: 3, y, size }, bpm }
//  The cast files define CAST[<id>] = { name, color, h, draw(pose) }: draw() paints the character with its feet
//  (the bottom of the bust) at 0,0, about h px tall, using the global ctx. pose = { mouth 0..1, blink 0..1,
//  talk 0..1, mood, t }. A cast file must not draw text (it's drawn off-screen, so the text check can't see it).
//  The piece's src/scenes.js defines CARDS = { <key>: (u, tl, line) => ... } drawn in card space (CARD.w x CARD.h).
// =====================================================================
const STYLE = { name: 'reel', ones: true };   // on 1s: mouths and springs move every frame
var CAST = CAST || {};
var BACKGROUND = BACKGROUND || null;
const REEL_SANS = '"Arial Black", "Segoe UI Black", "Helvetica Neue", Impact, Arial, sans-serif';
const REEL_UI = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

// ---- the lines, from VOICE (tools/voice.mjs). Without it the reel draws a notice instead of guessing times.
const RL = (typeof VOICE !== 'undefined' ? VOICE.lines : []).map((l, i) => ({ ...l, i }));
const SPEAKERS = Object.keys(REEL.cast);
for (const l of RL) if (!REEL.cast[l.speaker]) l.speaker = SPEAKERS[0];
const lineAt = (t) => { let k = -1; for (let i = 0; i < RL.length; i++) if (RL[i].t0 - 0.15 <= t) k = i; return Math.max(0, k); };
// a card holds from its line's start until the next line that names a card ("none" clears it)
const CARD_LIST = RL.filter((l) => l.card).map((l) => ({ key: l.card, t0: l.t0 - 0.1, line: l }));
const cardAt = (t) => { let c = null; for (const k of CARD_LIST) if (k.t0 <= t) c = k; return c && c.key !== 'none' ? c : null; };

// ---- the TIMELINE the tools read: one shot per line, no hard cuts (a speaker change is a pop, not a cut)
const SHOT_LIST = RL.length ? RL.map((l, i) => ({ id: i + 1, key: l.speaker, era: i, t0: i ? l.t0 - 0.15 : 0, t1: i + 1 < RL.length ? RL[i + 1].t0 - 0.15 : DURATION, title: `${l.speaker}: ${l.text.slice(0, 40)}` }))
  : [{ id: 1, key: 'none', era: 0, t0: 0, t1: DURATION, title: 'no voice.json yet' }];
const TIMELINE = {
  width: W, height: H, fps: FPS, bpm: REEL.bpm || 100, duration: DURATION, frames: NFRAMES, loop: LOOP_T, safe: SAFE,
  format: 'dialogue-reel',
  shots: SHOT_LIST, cuts: [], morphs: [],
  cues: Object.fromEntries(RL.map((l) => [l.id, l.t0])),
  narration: RL.map((l) => ({ t0: l.t0, t1: l.t1, text: l.text, speaker: l.speaker })),
  board: RL.map((l) => ({ t: Math.min(l.t1 - 0.05, l.t0 + 0.6 * (l.t1 - l.t0)), title: `${l.id} · ${l.speaker}`, sound: l.text, next: l.card ? `card: ${l.card}` : '' })),
};
window.TIMELINE = TIMELINE;
function shotAtFrame(f) { const t = f / FPS; let s = SHOT_LIST[0]; for (const x of SHOT_LIST) if (x.t0 <= t + 1e-6) s = x; return s; }

// ---- off-screen canvases (one per use, reused every frame)
const OFF = {};
function offCanvas(name, w, h) {
  let c = OFF[name];
  if (!c) { c = OFF[name] = document.createElement('canvas'); c.width = w; c.height = h; }
  const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, w, h);
  return [c, g];
}
// draw(fn) as a sticker: white outline `edge` px thick and a soft drop shadow. fn draws with its origin at the
// sticker's bottom centre (in the global ctx, which is swapped for the off-screen one while it runs).
const ST_W = 1200, ST_H = 1500;
function sticker(fn, x, y, s, o = {}) {
  const [A, a] = offCanvas('stA', ST_W, ST_H), [Bc, b] = offCanvas('stB', ST_W, ST_H);
  a.translate(ST_W / 2, ST_H - 10);
  const main = ctx; ctx = a; try { fn(); } finally { ctx = main; }
  const edge = o.edge ?? 14;
  for (let i = 0; i < 16; i++) { const ang = i / 16 * TAU; b.drawImage(A, Math.cos(ang) * edge, Math.sin(ang) * edge); }
  b.globalCompositeOperation = 'source-in'; b.fillStyle = o.edgeColor || '#ffffff'; b.fillRect(0, 0, ST_W, ST_H);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  if (o.dim) ctx.filter = `brightness(${1 - o.dim}) saturate(${1 - o.dim * 0.6})`;
  ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
  ctx.drawImage(Bc, -ST_W / 2, -(ST_H - 10));
  ctx.shadowColor = 'transparent';
  ctx.drawImage(A, -ST_W / 2, -(ST_H - 10));
  ctx.restore();
}

// ---- talking: the mouth opens on each heard word, a beat per syllable, and closes between words
const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
function talkAt(line, t) {
  if (!line || !line.words) return { mouth: 0, talk: 0, word: null };
  const talk = t >= line.t0 - 0.02 && t <= line.t1 + 0.05 ? 1 : 0;
  for (const w of line.words) {
    if (t >= w.t0 && t < w.t1) {
      const n = syllables(w.w), u = (t - w.t0) / Math.max(0.05, w.t1 - w.t0);
      return { mouth: 0.25 + 0.75 * Math.abs(Math.sin(u * n * Math.PI)), talk, word: w };
    }
  }
  return { mouth: 0, talk, word: null };
}
const blinkAt = (id, t) => { const ph = RNG('blink', id).f() * 3, p = mod(t + ph, 3.4); return p < 0.07 ? p / 0.07 : p < 0.14 ? 1 - (p - 0.07) / 0.07 : 0; };

// ---- the cast on screen
function castX(id) { const side = REEL.cast[id].side || 'left'; return side === 'right' ? W * 0.68 : side === 'center' ? W * 0.5 : W * 0.3; }
function drawCharacter(id, enterT, exitT, speaking, line) {
  const C = CAST[id];
  if (!C) return;
  const s0 = (REEL.cast[id].scale ?? 1) * (REEL.castScale ?? 1);
  const up = enterT == null ? 1 : springMove(enterT, 0, 1, SPRING.playful);
  const down = exitT == null ? 0 : EZ.i2(seg(TT, exitT, exitT + 0.18));
  if (up <= 0 || down >= 1) return;
  const lift = (1 - up) * 900 + down * 900;
  const tk = speaking ? talkAt(line, TT) : { mouth: 0, talk: 0, word: null };
  const hop = tk.word ? 1 + 0.025 * Math.exp(-(TT - tk.word.t0) * 14) : 1;
  const sway = speaking ? Math.sin(TT * 3.1 + id.length) * 0.022 : Math.sin(TT * 1.3 + id.length) * 0.01;
  const listen = REEL.layout === 'duo' && !speaking;
  const k = s0 * hop * (listen ? 0.82 : 1);
  sticker(() => C.draw({ mouth: tk.mouth, blink: blinkAt(id, TT), talk: tk.talk, mood: (speaking && line?.mood) || 'neutral', t: TT, id }),
    castX(id), H + 30 + lift, k, { rot: sway, dim: listen ? 0.35 : 0 });
}
function drawCast() {
  if (!RL.length) return;
  const i = lineAt(TT), L = RL[i], start = (j) => (j ? RL[j].t0 - 0.15 : -1);
  if (REEL.layout === 'duo') {
    for (const id of SPEAKERS) if (id !== L.speaker) drawCharacter(id, null, null, false, null);
    drawCharacter(L.speaker, null, null, true, L);
    return;
  }
  // solo: the previous speaker drops out as the new one springs up (a speaker keeps the screen across their own lines)
  let j = i; while (j > 0 && RL[j - 1].speaker === L.speaker) j--;
  if (j > 0 && TT < start(j) + 0.2) drawCharacter(RL[j - 1].speaker, null, start(j), false, null);
  drawCharacter(L.speaker, j ? start(j) : -1, null, true, L);
}

// ---- captions: the line in chunks of a few words; the chunk holding the current word shows, that word picked out
function chunks(line) {
  if (!line.words) return [];
  const out = [], n = REEL.caption?.words ?? 3;
  let cur = [];
  line.words.forEach((w, k) => {
    cur.push(w);
    const end = /[.,!?;:]$/.test(w.w) || cur.length >= n || k === line.words.length - 1;
    if (end) { out.push(cur); cur = []; }
  });
  return out;
}
function drawCaptions() {
  if (!RL.length) return;
  const L = RL[lineAt(TT)];
  if (TT < L.t0 - 0.02 || TT > L.t1 + 0.3) return;
  const ch = chunks(L);
  let c = ch[0];
  for (const x of ch) if (x[0].t0 <= TT + 0.02) c = x;
  if (!c) return;
  const col = CAST[L.speaker]?.color || '#ffd84a';
  const size0 = REEL.caption?.size ?? 92, y = REEL.caption?.y ?? H * 0.5, cx = (70 + W - Math.max(70, SAFE.right)) / 2, maxW = (W - 70 - Math.max(70, SAFE.right)) / 1.12;   // room for the current word's pop
  const words = c.map((w) => w.w.replace(/^["“]|["”]$/g, '').toUpperCase());
  ctx.save(); screen();
  ctx.font = `900 ${size0}px ${REEL_SANS}`;
  const sp = size0 * 0.42, ws = words.map((w) => ctx.measureText(w).width), total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const size = total > maxW ? size0 * maxW / total : size0, f = size / size0;
  ctx.font = `900 ${size}px ${REEL_SANS}`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const pop = springMove(c[0].t0, 0.82, 1, SPRING.snappy);
  let x = cx - total * f / 2;
  words.forEach((w, k) => {
    const on = TT >= c[k].t0 - 0.02, now = on && (k === c.length - 1 || TT < c[k + 1].t0);
    const wk = now ? springMove(c[k].t0, 1.0, 1.08, SPRING.playful) : 1;
    ctx.save(); ctx.translate(x + ws[k] * f / 2, y); ctx.scale(pop * wk, pop * wk);
    ctx.lineWidth = size * 0.2; ctx.strokeStyle = '#111111'; ctx.strokeText(w, -ws[k] * f / 2, 0);
    ctx.fillStyle = now ? col : '#ffffff'; ctx.fillText(w, -ws[k] * f / 2, 0);
    ctx.restore();
    x += (ws[k] + sp) * f;
  });
  ctx.restore();
}

// ---- header: the title pill and a progress bar along the top
function drawHeader() {
  ctx.save(); screen();
  const y = SAFE.top + 20;
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(70, y - 30, W - 70 - Math.max(70, SAFE.right), 10);
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(70, y - 30, (W - 70 - Math.max(70, SAFE.right)) * clamp(TT / DURATION), 10);
  if (REEL.title) {
    ctx.font = `900 46px ${REEL_SANS}`; const tw = ctx.measureText(REEL.title).width;
    const x0 = 70, h = 76;
    ctx.fillStyle = '#111111'; ctx.beginPath(); ctx.roundRect(x0, y, tw + 56, h, 38); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(REEL.title, x0 + 28, y + h / 2 + 2);
  }
  ctx.restore();
}

// ---- the card: a rounded white panel below the header; CARDS[key](u, tl, line) draws in card space
const CARD = { x: 70, y: SAFE.top + 130, w: W - 70 - Math.max(70, SAFE.right), h: 560 };
function drawCard() {
  const c = cardAt(TT);
  if (!c || typeof CARDS === 'undefined' || !CARDS[c.key]) return;
  const tl = TT - c.t0, u = springMove(c.t0, 0, 1, SPRING.playful);
  ctx.save(); screen();
  ctx.translate(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2); ctx.scale(0.9 + 0.1 * u, 0.9 + 0.1 * u); ctx.globalAlpha = clamp(u * 1.6);
  ctx.translate(-CARD.w / 2, -CARD.h / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = REEL.cardColor || '#fffaf0'; ctx.beginPath(); ctx.roundRect(0, 0, CARD.w, CARD.h, 36); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 6; ctx.strokeStyle = '#111111'; ctx.stroke();
  ctx.beginPath(); ctx.roundRect(0, 0, CARD.w, CARD.h, 36); ctx.clip();
  CARDS[c.key](u, tl, c.line);
  ctx.restore();
}
// card helpers (card space): text, a pill label, an arrow, a dot
function cText(s, x, y, size, color = '#111111', o = {}) {
  ctx.save(); ctx.font = `${o.weight ?? 900} ${size}px ${o.font || REEL_SANS}`; ctx.fillStyle = color;
  ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.maxW) { const w = ctx.measureText(s).width; if (w > o.maxW) ctx.font = `${o.weight ?? 900} ${size * o.maxW / w}px ${o.font || REEL_SANS}`; }
  ctx.fillText(s, x, y); ctx.restore();
}
function cPill(s, x, y, size, bg, fg = '#ffffff') {
  ctx.save(); ctx.font = `900 ${size}px ${REEL_SANS}`; const w = ctx.measureText(s).width + size * 1.1, h = size * 1.6;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = '#111111'; ctx.stroke();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + size * 0.05); ctx.restore();
  return w;
}
function cArrow(x0, y0, x1, y1, u = 1, color = '#111111', w = 10) {
  if (u <= 0) return;
  const x = lerp(x0, x1, u), y = lerp(y0, y1, u), a = Math.atan2(y1 - y0, x1 - x0), hd = w * 3.2;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x - Math.cos(a) * hd * 0.6, y - Math.sin(a) * hd * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a - 0.5) * hd, y - Math.sin(a - 0.5) * hd); ctx.lineTo(x - Math.cos(a + 0.5) * hd, y - Math.sin(a + 0.5) * hd); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function cDot(x, y, r, fill, k = 1) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.22); ctx.strokeStyle = '#111111'; ctx.stroke(); ctx.restore();
}

// ---- the frame
function renderFrame(t, canvas, sub) {
  const cv = canvas || document.getElementById('c');
  ctx = cv.getContext('2d');
  F = ((Math.round(t * FPS) % NFRAMES) + NFRAMES) % NFRAMES;
  B = Math.floor(F / 2);
  TT = F / FPS;
  E0 = 0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.clearRect(0, 0, W, H);
  if (BACKGROUND) BACKGROUND.draw(TT);
  if (REEL.dim) { ctx.fillStyle = `rgba(0,0,0,${REEL.dim})`; ctx.fillRect(0, 0, W, H); }
  if (!RL.length) {
    ctx.font = `900 54px ${REEL_SANS}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.fillText('no voice yet:', W / 2, H / 2 - 40); ctx.fillText('run tools/voice.mjs', W / 2, H / 2 + 40);
  } else {
    drawHeader();
    drawCard();
    drawCast();
    drawCaptions();
  }
  ctx.restore();
  return shotAtFrame(F).id;
}
window.renderFrame = renderFrame;

// ---- cartoon drawing helpers for cast files (local coords, the global ctx): flat fills with a dark outline
const TOON_INK = '#22170f';
function toonPath(P, closed = true) { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (closed) ctx.closePath(); }
function toon(P, fill, o = {}) {
  toonPath(P, o.closed ?? true);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (o.line !== 0) { ctx.lineWidth = o.line ?? 8; ctx.strokeStyle = o.ink || TOON_INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
const toonEll = (cx, cy, rx, ry, fill, o = {}) => toon(ellipsePts(cx, cy, rx, ry, o.rot || 0, 64), fill, o);
// a puffy outline: n lobes around (cx, cy) between angles a0..a1, radius r +- amp, seeded so it never boils
function puffPts(cx, cy, rx, ry, n, amp, seed, a0 = 0, a1 = TAU, step = 8) {
  const R = RNG('puff', seed), lob = Array.from({ length: n + 1 }, () => 1 + (R.f() - 0.5) * 0.5), P = [];
  const full = Math.abs(a1 - a0 - TAU) < 1e-6, m = n * step;
  for (let i = 0; i <= m - (full ? 1 : 0); i++) {
    const u = i / m, a = lerp(a0, a1, u), k = Math.floor(u * n), f = u * n - k;
    const bump = Math.sin(f * Math.PI) ** 0.6 * amp * lob[Math.min(k, n)];
    P.push([cx + Math.cos(a) * (rx + bump), cy + Math.sin(a) * (ry + bump)]);
  }
  return P;
}
// a quadratic stroke: an eyebrow, a wrinkle, a smile line
function toonLine(P, w = 8, color = TOON_INK) {
  ctx.save(); ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(...P[0]);
  if (P.length === 3) ctx.quadraticCurveTo(...P[1], ...P[2]); else P.slice(1).forEach((p) => ctx.lineTo(...p));
  ctx.stroke(); ctx.restore();
}
// eyes: white, pupil looking (lx, ly), lid closing with blink (0..1) and a resting droop (0..1)
function toonEye(x, y, r, o = {}) {
  const lid = clamp(Math.max(o.blink || 0, o.droop || 0));
  toonEll(x, y, r, r * (o.tall ?? 1.1), '#ffffff', { line: 6 });
  ctx.save(); toonPath(ellipsePts(x, y, r, r * (o.tall ?? 1.1), 0, 48)); ctx.clip();
  ctx.fillStyle = o.iris || '#3b2a20'; ctx.beginPath(); ctx.arc(x + (o.lx || 0) * r * 0.35, y + (o.ly || 0) * r * 0.3 + r * 0.1, r * 0.48, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + (o.lx || 0) * r * 0.35 + r * 0.16, y + r * -0.08, r * 0.14, 0, TAU); ctx.fill();
  if (lid > 0) { ctx.fillStyle = o.skin || '#f0c8a0'; ctx.fillRect(x - r * 1.2, y - r * 1.3, r * 2.4, r * 2.5 * lid); }
  ctx.restore();
  if (lid > 0.02) toonLine([[x - r, y - r * 1.1 + r * 2.3 * lid], [x + r, y - r * 1.1 + r * 2.3 * lid]], 6);
}
// a talking mouth: closed is a line, open is a dark shape with a tongue; w = width, open = 0..1
function toonMouth(x, y, w, open, o = {}) {
  if (open < 0.08) { toonLine([[x - w / 2, y], [x, y + (o.smile ?? 6)], [x + w / 2, y - (o.smirk || 0)]], 7); return; }
  const h = w * (0.12 + 0.55 * open);
  const P = ellipsePts(x, y + h * 0.3, w / 2, h, 0, 40).map(([px, py]) => [px, Math.max(py, y - h * 0.15)]);
  toon(P, '#4a1716', { line: 7 });
  ctx.save(); toonPath(P); ctx.clip(); ctx.fillStyle = '#d65a5a'; ctx.beginPath(); ctx.ellipse(x, y + h * 1.1, w * 0.3, h * 0.55, 0, 0, TAU); ctx.fill();
  if (o.teeth !== false) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w * 0.35, y - h * 0.2, w * 0.7, h * 0.32); }
  ctx.restore();
}
