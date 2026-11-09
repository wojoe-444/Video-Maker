// =====================================================================
//  backgrounds/video.js — the user's own looping clip (gameplay they recorded, a satisfying clip they own or
//  generated). piece.json: "background": { "file": "assets-video/bg.mp4", "start": 0 }. The page itself stays one
//  file: it leaves the background transparent, and tools/export.mjs lays the rendered frames over the clip
//  (scaled to cover the frame, looped, its own audio dropped). The browser preview shows a placeholder.
// =====================================================================
var BACKGROUND = {
  name: 'video',
  draw(t) {
    if (new URLSearchParams(location.search).has('export')) return;
    ctx.save(); screen();
    for (let y = 0; y < H; y += 120) for (let x = 0; x < W; x += 120) { ctx.fillStyle = (x + y) / 120 % 2 ? '#2b2f3a' : '#323746'; ctx.fillRect(x, y, 120, 120); }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, mod(t * 300, H), W, 40);
    ctx.restore();
  },
};
