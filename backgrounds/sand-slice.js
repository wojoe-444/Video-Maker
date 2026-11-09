// =====================================================================
//  backgrounds/sand-slice.js — a "satisfying" loop: a knife slices a block of layered pastel kinetic sand, one slab
//  a second; each slab tips over and crumbles while the block slides in for the next cut. Deterministic.
//  Knobs: BG_OPTS.sandSlice = { period, seed }.
// =====================================================================
var BACKGROUND = {
  name: 'sand-slice',
  draw(t) {
    const o = (typeof BG_OPTS !== 'undefined' && BG_OPTS.sandSlice) || {};
    const P = o.period ?? 1.1, seed = o.seed ?? 'sand', n = Math.floor(t / P), p = (t - n * P) / P;
    const top = 760, bot = 1380, cutX = 470, sw = 84, COLS = ['#f7a8c4', '#ffd38a', '#a8e6cf', '#9fc9ff', '#c8b0ff', '#ffb59a'];
    ctx.save(); screen();
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6efe6'); g.addColorStop(1, '#e3d3c2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d7c3ae'; ctx.fillRect(0, bot, W, H - bot);
    ctx.fillStyle = '#cbb49c'; ctx.fillRect(0, bot, W, 14);
    // the layers: wavy bands, the same at every slice so the cut face reads as one block
    const band = (x0, x1, y0, y1, dx = 0, rot = 0, px = x0, py = y1) => {
      ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.translate(-px, -py);
      ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
      const L = 9, hh = (y1 - y0) / L;
      for (let i = 0; i < L; i++) {
        ctx.fillStyle = COLS[i % COLS.length]; ctx.beginPath(); ctx.moveTo(x0 - 4, y0 + i * hh + 2);
        for (let x = x0; x <= x1 + 8; x += 12) ctx.lineTo(x, y0 + i * hh + Math.sin((x + dx) * 0.02 + i) * 9);
        ctx.lineTo(x1 + 8, y1 + 4); ctx.lineTo(x0 - 4, y1 + 4); ctx.closePath(); ctx.fill();
      }
      const R = RNG(seed, 'grain', Math.round(dx)); ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let k = 0; k < 120; k++) ctx.fillRect(x0 + R.f() * (x1 - x0), y0 + R.f() * (y1 - y0), 3, 3);
      ctx.restore();
    };
    // the block slides left by one slab over the second half of each cycle
    const slide = EZ.io(seg(p, 0.55, 1)) * sw, base = n * sw + slide;
    band(cutX - slide, W + 40, top, bot, base);
    // this cycle's slab tips over to the left, then crumbles into grains
    const tip = EZ.i2(seg(p, 0.32, 0.7));
    if (p < 0.78) band(cutX - sw, cutX, top, bot, n * sw - sw, -tip * 1.45, cutX - sw, bot);
    const R = RNG(seed, 'crumb', n), fall = seg(p, 0.6, 1);
    if (fall > 0) for (let k = 0; k < 80; k++) {
      const x = cutX - sw - R.f() * 520 * fall, y = bot - 6 - R.f() * 60 * (1 - fall) - 10, s = 8 + R.f() * 12;
      ctx.globalAlpha = 1 - fall * 0.6; ctx.fillStyle = COLS[k % COLS.length]; ctx.fillRect(x, y, s, s * 0.7);
    }
    ctx.globalAlpha = 1;
    // last cycle's pile, fading
    const R2 = RNG(seed, 'crumb', n - 1);
    for (let k = 0; k < 80; k++) { const x = cutX - sw - R2.f() * 520, s = 8 + R2.f() * 12; R2.f(); ctx.globalAlpha = 0.4 * (1 - p); ctx.fillStyle = COLS[k % COLS.length]; ctx.fillRect(x, bot - 16, s, s * 0.7); }
    ctx.globalAlpha = 1;
    // the knife: down through the block, then back up
    const down = p < 0.3 ? EZ.io(seg(p, 0.02, 0.3)) : 1 - EZ.io(seg(p, 0.45, 0.62));
    const ky = lerp(top - 560, bot - 560, down);
    ctx.fillStyle = '#d9dee6'; ctx.beginPath(); ctx.moveTo(cutX - 6, ky); ctx.lineTo(cutX + 6, ky); ctx.lineTo(cutX + 6, ky + 560); ctx.lineTo(cutX - 6, ky + 520); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cutX - 6, ky, 3, 520);
    ctx.fillStyle = '#3b3f48'; ctx.fillRect(cutX - 18, ky - 260, 36, 270);
    ctx.restore();
  },
};
