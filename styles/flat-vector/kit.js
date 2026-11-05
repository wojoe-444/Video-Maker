// =====================================================================
//  styles/flat-vector/kit.js — a flat-vector science-explainer look (original; no characters or marks from any studio).
//  Deep indigo space with a soft radial glow and seeded star specks; shapes are flat fills with no outlines,
//  a diagonal shade on the lower-right, a thin light rim on the upper-left, and a soft glow behind subjects.
//  Rounded geometry, a rounded sans, four accents (teal, coral, gold, violet). Motion on 1s with eased springs.
//  Built on kit/core.js. Helpers are prefixed fv*. Needs from the piece head: HAND (a font stack), CX.
// =====================================================================
const FV = {
  ground: '#141a3a', deep: '#0b0f26', glow: '#2b3a7a', ink: '#f4f1ea', dim: '#8d95c4', line: '#3a4683',
  teal: '#35d0c0', coral: '#ff7a5c', gold: '#ffc94a', violet: '#9d7cff', grass: '#5fd38a', valley: '#0e1330',
};
const fvHex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function fvTone(h, k) {   // k > 0 lightens toward white, k < 0 darkens toward the deep ground
  if (h[0] !== '#') return h;
  const c = fvHex(h), t = k > 0 ? [255, 250, 240] : fvHex(FV.deep), a = Math.abs(k);
  return `rgb(${c.map((v, i) => Math.round(v + (t[i] - v) * a)).join(',')})`;
}
// the backdrop: deep ground, a radial glow at (gx, gy), and star specks that twinkle on a slow seeded cycle
function fvSky(o = {}) {
  ctx.save(); screen();
  const gx = o.gx ?? W * 0.5, gy = o.gy ?? H * 0.42;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.75);
  g.addColorStop(0, o.glow ?? FV.glow); g.addColorStop(0.55, o.ground ?? FV.ground); g.addColorStop(1, FV.deep);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = RNG('fv-stars', o.key ?? '').f;
  for (let i = 0; i < (o.stars ?? 90); i++) {
    const x = r() * W, y = r() * H, s = 0.8 + r() * 2.2, ph = r() * TAU;
    ctx.globalAlpha = (0.25 + 0.5 * r()) * (0.7 + 0.3 * Math.sin(TT * 1.3 + ph));
    ctx.fillStyle = FV.ink; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
// a soft glow behind a subject
function fvGlow(x, y, r, c, a = 0.35) {
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}
// the core mark: a flat body with shade and rim. P = outline (world coords), c = 6-digit hex
function fvBody(P, c, o = {}) {
  const q = bbox(P), bb = { x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 }, d = o.rim ?? clamp(Math.min(bb.w, bb.h) * 0.035, 2, 9);
  const path = () => { if (o.sharp) { ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); } else trace(P, true); };
  ctx.save(); path(); ctx.fillStyle = c; ctx.fill(); ctx.clip();
  if (o.shade !== false) {   // the lower-right shade: a half-plane through the centre, tilted 35 degrees
    const cx = bb.x + bb.w * (o.sx ?? 0.58), cy = bb.y + bb.h * (o.sy ?? 0.5), R = Math.hypot(bb.w, bb.h);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.6);
    ctx.fillStyle = fvTone(c, -0.28); ctx.fillRect(0, -R, R, 2 * R); ctx.restore();
  }
  if (o.rimOn !== false) {   // the light rim on the upper-left edge: P minus P shifted down-right
    ctx.beginPath(); ctx.rect(bb.x - bb.w, bb.y - bb.h, bb.w * 3, bb.h * 3);
    P.forEach(([x, y], i) => (i ? ctx.lineTo(x + d, y + d) : ctx.moveTo(x + d, y + d))); ctx.closePath();
    ctx.fillStyle = fvTone(c, 0.3); ctx.fill('evenodd');
  }
  ctx.restore();
}
const fvCircle = (x, y, r, c, o) => fvBody(ellipsePts(x, y, r, r, 0, 72), c, o);
const fvRound = (x, y, w, h, r, c, o) => fvBody(rrectPts(x, y, w, h, r, 8), c, o);
function fvDot(x, y, r, c, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
// text in a rounded sans, with write-on (o.frac) and fade (o.alpha)
function fvText(str, x, y, size, color, o = {}) {
  ctx.save(); ctx.font = `${o.weight ?? 800} ${size}px ${o.font ?? HAND}`; ctx.fillStyle = color; ctx.textAlign = o.align ?? 'left';
  ctx.globalAlpha = o.alpha ?? 1; ctx.textBaseline = 'alphabetic';
  if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
  const w = ctx.measureText(str).width, frac = clamp(o.frac ?? 1);
  if (frac < 1) { const x0 = x - (ctx.textAlign === 'center' ? w / 2 : ctx.textAlign === 'right' ? w : 0); ctx.beginPath(); ctx.rect(x0 - 4, y - size * 1.2, w * frac + 4, size * 1.7); ctx.clip(); }
  if (frac > 0) ctx.fillText(str, x, y);
  ctx.restore(); return w;
}
// a pill label (price tags, model chips)
function fvPill(str, x, y, size, bg, fg = FV.deep, o = {}) {
  ctx.save(); ctx.font = `800 ${size}px ${HAND}`; const w = ctx.measureText(str).width + size * 1.1, h = size * 1.6;
  const s = o.s ?? 1; ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = o.alpha ?? 1;
  const ax = o.align === 'left' ? 0 : o.align === 'right' ? -w : -w / 2;
  trace(rrectPts(ax, -h / 2, w, h, h / 2, 6), true); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, ax + w / 2, size * 0.06);
  ctx.restore(); return w;
}
// two dot eyes with a highlight and a seeded blink; look = [dx, dy] in -1..1
function fvEyes(x, y, r, look = [0, 0], key = 'e', gap = 0.36) {
  const blink = (Math.floor(TT * 12) + key.length * 7) % 47 < 2;
  for (const s of [-1, 1]) {
    const ex = x + s * r * gap + look[0] * r * 0.08, ey = y + look[1] * r * 0.06;
    ctx.save(); ctx.fillStyle = FV.deep; ctx.beginPath(); ctx.ellipse(ex, ey, r * 0.11, blink ? r * 0.02 : r * 0.15, 0, 0, TAU); ctx.fill();
    if (!blink) fvDot(ex - r * 0.035, ey - r * 0.06, r * 0.04, FV.ink);
    ctx.restore();
  }
}
// the hero: a round teal courier, two eyes, a little antenna light, carrying a glowing parcel. Sets SPARK_AT.
function fvCourier(x, y, r, o = {}) {
  const key = o.key ?? 'courier';
  y += Math.sin(TT * TAU * 0.6) * r * 0.06;
  SPARK_AT = toScreen(x, y);
  fvGlow(x, y, r * 2.4, FV.teal, 0.18);
  // antenna
  ctx.save(); ctx.strokeStyle = fvTone(FV.teal, -0.2); ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + r * 0.1, y - r * 0.92); ctx.quadraticCurveTo(x + r * 0.2, y - r * 1.3, x + r * 0.42, y - r * 1.38); ctx.stroke(); ctx.restore();
  fvDot(x + r * 0.44, y - r * 1.4, r * 0.11, FV.gold); fvGlow(x + r * 0.44, y - r * 1.4, r * 0.4, FV.gold, 0.4 + 0.2 * Math.sin(TT * 5));
  fvBody(ellipsePts(x, y, r, r * 0.94, 0, 72), FV.teal);
  fvEyes(x, y - r * 0.15, r, o.look, key);
  if (o.parcel !== false) {   // the task parcel, held in front
    const px = x + r * 0.15, py = y + r * 0.62, s = r * 0.62;
    fvGlow(px, py, s * 1.8, FV.gold, 0.45);
    fvRound(px - s / 2, py - s / 2, s, s * 0.8, s * 0.14, o.parcelColor ?? FV.gold);
    ctx.save(); ctx.fillStyle = fvTone(o.parcelColor ?? FV.gold, -0.35); ctx.fillRect(px - s * 0.06, py - s / 2, s * 0.12, s * 0.8); ctx.restore();
    for (const s2 of [-1, 1]) fvCircle(px + s2 * s * 0.55, py + s * 0.05, r * 0.15, FV.teal, { rimOn: false });   // hands
  }
}
// the effort dial: a ring of n notches, filled up to level (0..1), a needle
function fvDial(x, y, r, level, c, o = {}) {
  const n = o.n ?? 5, a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  fvCircle(x, y, r, FV.ground, { rimOn: false, shade: false });
  for (let i = 0; i < n; i++) {
    const a = lerp(a0, a1, i / (n - 1)), on = i / (n - 1) <= level + 1e-6;
    fvDot(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72, r * 0.11, on ? c : FV.line);
  }
  const a = lerp(a0, a1, level);
  ctx.save(); ctx.strokeStyle = FV.ink; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); ctx.stroke(); ctx.restore();
  fvDot(x, y, r * 0.14, FV.ink);
}
// the three thinking machines (original designs). x, y = base centre; s = scale (1 = about 300px tall for Opus)
function fvHaiku(x, y, s = 1, o = {}) {   // a small quick dart with fins and a single round window
  const c = FV.gold, h = 150 * s, w = 70 * s;
  fvGlow(x, y - h * 0.5, h, c, 0.2);
  for (const k of [-1, 1]) fvBody([[x + k * w * 0.35, y - h * 0.35], [x + k * w * 0.95, y - h * 0.02], [x + k * w * 0.4, y - h * 0.08]], fvTone(c, -0.15), { rimOn: false });
  fvBody([...ellipsePts(x, y - h * 0.55, w / 2, h * 0.5, 0, 64, Math.PI, TAU), [x + w / 2, y - h * 0.1], [x - w / 2, y - h * 0.1]], c);
  fvCircle(x, y - h * 0.6, w * 0.22, FV.deep, { rimOn: false, shade: false });
  fvEyes(x, y - h * 0.6, w * 0.3, o.look, 'haiku', 0.34);
  const fl = 0.7 + 0.3 * Math.sin(TT * 31);   // the exhaust flicker
  fvBody(ellipsePts(x, y - h * 0.02 + 18 * s * fl, w * 0.22, 26 * s * fl, 0, 32), FV.coral, { rimOn: false, shade: false });
}
function fvSonnet(x, y, s = 1, o = {}) {   // a mid-size round engine with two rings
  const c = FV.violet, r = 95 * s;
  fvGlow(x, y - r, r * 2.2, c, 0.2);
  fvRound(x - r * 0.5, y - r * 0.35, r, r * 0.35, r * 0.1, fvTone(c, -0.25), { rimOn: false });
  fvCircle(x, y - r * 1.15, r, c);
  ctx.save(); ctx.strokeStyle = fvTone(c, 0.35); ctx.lineWidth = 8 * s; ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.ellipse(x, y - r * 1.15, r * 1.45, r * 0.38, -0.25 + 0.05 * Math.sin(TT), 0, TAU); ctx.stroke(); ctx.restore();
  fvEyes(x, y - r * 1.2, r * 0.9, o.look, 'sonnet');
}
function fvOpus(x, y, s = 1, o = {}) {   // a tall observatory: a tower, a dome with a slit, a telescope
  const c = FV.coral, w = 150 * s, h = 210 * s;
  fvGlow(x, y - h, h * 1.4, c, 0.18);
  fvBody([[x - w * 0.55, y], [x - w * 0.45, y - h], [x + w * 0.45, y - h], [x + w * 0.55, y]], fvTone(c, -0.1));
  for (let i = 0; i < 3; i++) fvRound(x - w * 0.09, y - h * (0.28 + i * 0.26), w * 0.18, h * 0.12, w * 0.05, FV.gold, { rimOn: false, shade: false });
  const dr = w * 0.55;
  fvBody(ellipsePts(x, y - h, dr, dr * 0.95, 0, 72, Math.PI, TAU), c);
  ctx.save(); ctx.translate(x + dr * 0.3, y - h - dr * 0.55); ctx.rotate(-0.7 + 0.05 * Math.sin(TT * 0.7));
  fvRound(-12 * s, -dr * 0.9, 24 * s * 1.6, dr * 1.05, 10 * s, fvTone(FV.ink, -0.1)); ctx.restore();
  fvEyes(x - dr * 0.12, y - h - dr * 0.38, dr * 0.75, o.look, 'opus');
}
// ---- the chart: log-x cost, linear-y intelligence, in a box [x, y, w, h]
function fvAxes(box, xr, yr) {
  const lx = (v) => box.x + (Math.log10(v) - Math.log10(xr[0])) / (Math.log10(xr[1]) - Math.log10(xr[0])) * box.w;
  const ly = (v) => box.y + box.h - (v - yr[0]) / (yr[1] - yr[0]) * box.h;
  return { box, x: lx, y: ly, at: (c, s) => [lx(c), ly(s)] };
}
function fvGrid(A, xt, yt, p = 1) {
  const b = A.box; ctx.save(); ctx.globalAlpha = p;
  ctx.strokeStyle = FV.line; ctx.lineWidth = 2;
  for (const v of xt) { const x = A.x(v); ctx.beginPath(); ctx.moveTo(x, b.y); ctx.lineTo(x, b.y + b.h); ctx.stroke(); fvText('$' + v, x, b.y + b.h + 44, 30, FV.dim, { align: 'center', weight: 700 }); }
  for (const v of yt) { const y = A.y(v); ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke(); fvText(String(v), b.x - 18, y + 10, 30, FV.dim, { align: 'right', weight: 700 }); }
  ctx.strokeStyle = FV.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.x, b.y - 10); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x + b.w + 10, b.y + b.h); ctx.stroke();
  ctx.restore();
}
// captions and tags at screen size, through DEFER
const fvTag = (str, c = FV.gold) => { const f = () => fvPill(str, 90, 96, 34, c, FV.deep, { align: 'left', alpha: ev(E0 + 0.1, 0.3) }); if (DEFER) DEFER.push(f); else f(); };
const fvCaption = (str) => { const f = () => fvText(str, CX, H - 70, 46, FV.ink, { align: 'center', frac: ev(E0 + 0.3, 0.5) }); if (DEFER) DEFER.push(f); else f(); };

// =====================================================================
//  STYLE — the renderer's hooks (styles/README.md has the contract)
// =====================================================================
const STYLE = {
  name: 'flat-vector',
  paper: FV.ground,
  backdrop(c) { fvSky({ ground: c[0] === '#' ? c : FV.ground }); },
  window(P, key, src) {
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 8; ctx.strokeStyle = fvTone(FV.teal, 0.2); ctx.stroke(); ctx.restore();
  },
  blob(P, c, key) { fvBody(P, c[0] === '#' ? c : FV.teal, { rimOn: c[0] === '#' }); },
  hero(x, y, r, o) { fvCourier(x, y, r * 0.6, { ...o, parcel: false }); },
  heroColor: FV.teal,
  post() {},
  ones: true,
};
