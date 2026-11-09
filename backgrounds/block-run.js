// =====================================================================
//  backgrounds/block-run.js — an endless blocky parkour run (original voxel look; no game's textures or marks).
//  A runner sprints left to right over floating grass blocks, jumping each gap, over lava, under a blocky sky.
//  Deterministic: everything is a function of t. Knobs: BG_OPTS.blockRun = { speed, seed, block }.
// =====================================================================
var BACKGROUND = {
  name: 'block-run',
  draw(t) {
    const o = (typeof BG_OPTS !== 'undefined' && BG_OPTS.blockRun) || {};
    const S = o.block ?? 96, speed = o.speed ?? 430, seed = o.seed ?? 'run';
    const camX = t * speed, RX = W * 0.36;
    ctx.save(); screen();
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fb8f5'); g.addColorStop(0.6, '#b9e6ff'); g.addColorStop(1, '#ffd9a8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // blocky clouds (parallax 0.15) and far hills (0.3)
    const R = (k, i) => RNG(seed, k, i).f();
    for (let i = Math.floor((camX * 0.15) / 420) - 1; i < Math.floor((camX * 0.15 + W) / 420) + 2; i++) {
      const x = i * 420 - camX * 0.15, y = 300 + R('cy', i) * 500, w = 160 + R('cw', i) * 180;
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x, y, w, 48); ctx.fillRect(x + 40, y - 40, w * 0.55, 44);
    }
    for (const [par, col, base, amp] of [[0.25, '#8cc7e8', 1180, 380], [0.45, '#6aa8cf', 1320, 300]]) {
      ctx.fillStyle = col;
      const i0 = Math.floor((camX * par) / 64) - 1;
      for (let i = i0; i < i0 + W / 64 + 3; i++) { const hgt = Math.round((0.5 + 0.5 * Math.sin(i * 0.37 + par * 9) * Math.cos(i * 0.11)) * amp / 64) * 64; ctx.fillRect(i * 64 - camX * par, base - hgt, 65, H); }
    }
    // lava with bubbles
    const ly = 1640;
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(0, ly, W, H - ly);
    for (let i = 0; i < 14; i++) { const x = mod(i * 97 - camX * 0.9, W + 40) - 20, k = mod(t * 1.3 + R('lb', i), 1); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, ly + 30 + (1 - k) * 160, 22 * (1 - k) + 6, 22 * (1 - k) + 6); }
    ctx.fillStyle = '#ffb22e'; for (let x = -mod(camX, 48); x < W; x += 48) ctx.fillRect(x, ly, 24, 14);
    // the course: platforms of 3-7 blocks at stepping heights, gaps of 2-3 blocks; generated from block 0 onward
    const plats = []; let bx = -8;
    for (let i = 0; bx * S < camX + W + S * 8; i++) {
      const len = 3 + Math.floor(R('len', i) * 5), lvl = 1 + Math.floor(R('lvl', i) * 3);
      plats.push({ x0: bx * S, x1: (bx + len) * S, top: 1180 - lvl * S * 0.5 });
      bx += len + 2 + Math.floor(R('gap', i) * 2);
    }
    for (const pl of plats) {
      if (pl.x1 < camX - S || pl.x0 > camX + W + S) continue;
      for (let x = pl.x0; x < pl.x1; x += S) for (let y = pl.top, r = 0; y < ly + S; y += S, r++) {
        const sx = x - camX, gx = Math.round(x / S);
        ctx.fillStyle = r === 0 ? '#5cb83c' : r < 3 ? '#8a5a32' : '#6d6d6d'; ctx.fillRect(sx, y, S + 1, S + 1);
        const Q = RNG(seed, 'blk', gx, r);
        for (let k = 0; k < 7; k++) { ctx.fillStyle = r === 0 ? '#4a9a2e' : r < 3 ? '#6e4424' : '#555555'; ctx.fillRect(sx + Math.floor(Q.f() * 6) * S / 6, y + Math.floor(Q.f() * 6) * S / 6, S / 6, S / 6); }
        if (r === 0) { ctx.fillStyle = '#8a5a32'; for (let k = 0; k < 6; k++) ctx.fillRect(sx + k * S / 6, y + S * 0.66 + (k % 2) * S / 6, S / 6, S / 3); }
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.strokeRect(sx, y, S, S);
      }
      // a gem over the gap after this platform, gone once the runner passes it
      const gx = pl.x1 + S, gyy = pl.top - S * 1.6;
      if (camX + RX < gx) { ctx.save(); ctx.translate(gx - camX, gyy + Math.sin(t * 4 + pl.x0) * 10); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#3ff0d0'; ctx.fillRect(-20, -20, 40, 40); ctx.fillStyle = '#c9fff4'; ctx.fillRect(-20, -20, 14, 14); ctx.strokeStyle = '#0b6b5c'; ctx.lineWidth = 4; ctx.strokeRect(-20, -20, 40, 40); ctx.restore(); }
    }
    // the runner: on a platform or in a jump arc from one edge to the next
    const wx = camX + RX;
    let y = 1180, air = 0;
    for (let i = 0; i < plats.length; i++) {
      const a = plats[i], b = plats[i + 1];
      if (wx >= a.x0 && wx < a.x1 - S * 0.3) { y = a.top; break; }
      if (b && wx >= a.x1 - S * 0.3 && wx < b.x0 + S * 0.3) { const u = (wx - (a.x1 - S * 0.3)) / (b.x0 - a.x1 + S * 0.6); y = lerp(a.top, b.top, u) - 4 * 220 * u * (1 - u); air = 1; break; }
    }
    const ph = t * 14, legA = air ? 0.7 : Math.sin(ph) * 0.8, s = S / 96;
    ctx.translate(RX, y); ctx.scale(s, s);
    const limb = (x, yy, w, h, ang, c) => { ctx.save(); ctx.translate(x, yy); ctx.rotate(ang); ctx.fillStyle = c; ctx.fillRect(-w / 2, 0, w, h); ctx.strokeStyle = '#1d1d1d'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2, 0, w, h); ctx.restore(); };
    limb(0, -78, 22, 78, legA, '#2f4fa8'); limb(0, -78, 22, 78, -legA, '#3a5fc4');
    limb(0, -150, 18, 64, -legA * 0.9, '#e0a878');
    ctx.fillStyle = '#e8503a'; ctx.fillRect(-24, -158, 48, 82); ctx.strokeStyle = '#1d1d1d'; ctx.lineWidth = 3; ctx.strokeRect(-24, -158, 48, 82);
    limb(0, -150, 18, 64, legA * 0.9, '#f0b88a');
    ctx.fillStyle = '#f0b88a'; ctx.fillRect(-26, -214, 52, 52); ctx.strokeRect(-26, -214, 52, 52);
    ctx.fillStyle = '#4a2c18'; ctx.fillRect(-26, -214, 52, 16); ctx.fillRect(-26, -214, 12, 32);
    ctx.fillStyle = '#1d1d1d'; ctx.fillRect(10, -190, 8, 8);
    ctx.restore();
  },
};
