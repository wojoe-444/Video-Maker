// =====================================================================
//  CARDS — the diagram panel above the captions, one function per card key named in voice/script.json.
//  Each draws in card space (0..CARD.w x 0..CARD.h) and gets u (the pop-in, 0..1), tl (seconds since the card
//  appeared) and its line (with word times: sayT(line, 'push') is when that word is spoken, in card time).
//  Helpers from kit/reel.js: cText, cPill, cArrow, cDot. Keep text >= 34px and apart (the text check reads it).
// =====================================================================
const GIT = { main: '#8a8f99', mine: '#f2a33a', hub: '#2f2f3a', ok: '#2e9e5b', ink: '#111111' };
// when a word of a line is spoken, in seconds after its card appeared (or `fallback` if the word isn't found)
function sayT(line, word, fallback = 0.6) {
  const w = (line.words || []).find((x) => x.w.toLowerCase().replace(/[^a-z]/g, '') === word);
  return w ? w.t0 - (line.t0 - 0.1) : fallback;
}
const pop = (tl, at) => (tl < at ? 0 : EZ.back(clamp((tl - at) / 0.3)));
function panel(x, y, w, h, label, on) {
  ctx.save(); ctx.globalAlpha *= on ? 1 : 0.35;
  ctx.fillStyle = '#f0ebe0'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 24); ctx.fill();
  ctx.lineWidth = 5; ctx.strokeStyle = GIT.ink; ctx.stroke();
  cText(label, x + w / 2, y + 42, 34, GIT.ink, { maxW: w - 30 });
  ctx.restore();
}
function laptop(x, y, k = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = '#3d4250'; ctx.beginPath(); ctx.roundRect(-48, -60, 96, 64, 8); ctx.fill(); ctx.fillStyle = '#8fd3ff'; ctx.fillRect(-40, -52, 80, 48); ctx.fillStyle = '#3d4250'; ctx.fillRect(-62, 4, 124, 12); ctx.restore(); }
function cloud(x, y, k = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = GIT.hub; [[-30, 0, 30], [0, -18, 36], [32, 0, 28]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, TAU); ctx.fill(); }); ctx.fillRect(-60, 0, 120, 28); ctx.restore(); }
function check(x, y, s, k = 1) { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = GIT.ok; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.28; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(-s * 0.1, s * 0.35); ctx.lineTo(s * 0.5, -s * 0.35); ctx.stroke(); ctx.restore(); }
function commits(x0, y, n, k0, gap = 100, col = GIT.mine) {
  ctx.save(); ctx.strokeStyle = GIT.ink; ctx.lineWidth = 8;
  for (let i = 1; i < n; i++) { const k = k0(i); if (k > 0) { ctx.beginPath(); ctx.moveTo(x0 + (i - 1) * gap, y); ctx.lineTo(x0 + (i - 1) * gap + gap * clamp(k), y); ctx.stroke(); } }
  ctx.restore();
  for (let i = 0; i < n; i++) cDot(x0 + i * gap, y, 26, col, k0(i));
}
// the two places, side by side: your computer and GitHub
function twoPlaces(onL, onR) {
  panel(24, 70, 390, 400, 'YOUR COMPUTER', onL);
  panel(456, 70, 390, 400, 'GITHUB', onR);
  ctx.save(); ctx.globalAlpha *= onL ? 1 : 0.35; laptop(219, 200); ctx.restore();
  ctx.save(); ctx.globalAlpha *= onR ? 1 : 0.35; cloud(651, 190); ctx.restore();
}
const CARDS = {
  title(u, tl, line) {
    cText('4 WORDS EVERY', CARD.w / 2, 90, 64, GIT.ink, { maxW: CARD.w - 60 });
    cText('DEVELOPER USES', CARD.w / 2, 168, 64, GIT.ink, { maxW: CARD.w - 60 });
    const L = [['COMMIT', 225, 300], ['PUSH', 645, 300], ['PULL REQUEST', 225, 440], ['MERGE', 645, 440]];
    L.forEach(([s, x, y], i) => { const k = pop(tl, 0.5 + i * 0.35); if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); cPill(s, 0, 0, 44, ['#f2a33a', '#3a7bd5', '#8e5bd8', '#2e9e5b'][i]); ctx.restore(); });
  },
  commit(u, tl, line) {
    twoPlaces(true, false);
    const t = sayT(line, 'snapshot', 1.2);
    commits(99, 330, 3, (i) => pop(tl, t + i * 0.35), 120);
    cText('1. COMMIT', CARD.w / 2, 515, 46, GIT.mine);
    if (tl > sayT(line, 'computer', 3)) cText('saved here only', 219, 410, 34, GIT.ink, { weight: 700, font: REEL_UI });
  },
  push(u, tl, line) {
    const t = sayT(line, 'sends', 1.4);
    twoPlaces(true, tl > t);
    commits(99, 330, 3, () => 1, 120);
    cArrow(300, 260, 560, 260, EZ.io(seg(tl, t, t + 0.6)), '#3a7bd5', 12);
    commits(531, 330, 3, (i) => pop(tl, t + 0.6 + i * 0.2), 120);
    cText('2. PUSH', CARD.w / 2, 515, 46, '#3a7bd5');
    if (tl > sayT(line, 'team', 3)) cText('team sees it', 651, 410, 34, GIT.ink, { weight: 700, font: REEL_UI });
  },
  pr(u, tl, line) {
    cloud(80, 70, 0.6); cText('GITHUB', 180, 72, 36, GIT.ink, { align: 'left' });
    // main, and your branch above it
    ctx.save(); ctx.strokeStyle = GIT.main; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(40, 420); ctx.lineTo(830, 420); ctx.stroke(); ctx.restore();
    cText('main', 60, 470, 34, GIT.main, { align: 'left' });
    [100, 260, 420, 580, 740].forEach((x) => cDot(x, 420, 20, '#c9ccd3'));
    ctx.save(); ctx.strokeStyle = GIT.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(260, 420); ctx.quadraticCurveTo(300, 260, 380, 260); ctx.lineTo(580, 260); ctx.stroke(); ctx.restore();
    commits(380, 260, 3, () => 1, 100);
    cText('your branch', 480, 205, 34, GIT.mine, { weight: 800 });
    // the request and its reviews
    const t = sayT(line, 'review', 2);
    const k = pop(tl, 0.6);
    if (k > 0) { ctx.save(); ctx.translate(710, 150); ctx.scale(k, k); ctx.fillStyle = '#8e5bd8'; ctx.beginPath(); ctx.roundRect(-110, -45, 220, 90, 20); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = GIT.ink; ctx.stroke(); cText('PR #1', 0, 2, 44, '#ffffff'); ctx.restore(); }
    for (let i = 0; i < 3; i++) check(640 + i * 70, 240, 26, pop(tl, t + 0.3 + i * 0.3));
    cText('3. PULL REQUEST', CARD.w / 2, 525, 46, '#8e5bd8');
  },
  merge(u, tl, line) {
    cloud(80, 70, 0.6); cText('GITHUB', 180, 72, 36, GIT.ink, { align: 'left' });
    const t = sayT(line, 'joins', 2), m = EZ.io(seg(tl, t - 0.2, t + 0.5));
    ctx.save(); ctx.strokeStyle = GIT.main; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(40, 420); ctx.lineTo(830, 420); ctx.stroke(); ctx.restore();
    cText('main', 60, 470, 34, GIT.main, { align: 'left' });
    [100, 260, 420].forEach((x) => cDot(x, 420, 20, '#c9ccd3'));
    ctx.save(); ctx.strokeStyle = GIT.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(260, 420); ctx.quadraticCurveTo(300, 260, 380, 260); ctx.lineTo(580, 260); ctx.stroke();
    if (m > 0) { ctx.beginPath(); ctx.moveTo(580, 260); const ex = lerp(580, 700, m), ey = lerp(260, 420, m); ctx.quadraticCurveTo(660, 260, ex, ey); ctx.stroke(); }
    ctx.restore();
    commits(380, 260, 3, () => 1, 100);
    cDot(700, 420, 34, GIT.ok, pop(tl, t + 0.4));
    check(700, 420, 22, pop(tl, t + 0.5));
    const st = pop(tl, sayT(line, 'everyones', 3.2));
    if (st > 0) { ctx.save(); ctx.translate(640, 160); ctx.rotate(-0.12); ctx.scale(st, st); ctx.strokeStyle = GIT.ok; ctx.lineWidth = 8; ctx.strokeRect(-150, -46, 300, 92); cText('MERGED', 0, 2, 60, GIT.ok); ctx.restore(); }
    cText('4. MERGE', CARD.w / 2, 525, 46, GIT.ok);
  },
  recap(u, tl, line) {
    const R = [['COMMIT', 'saves it', '#f2a33a', 'commit'], ['PUSH', 'shares it', '#3a7bd5', 'push'], ['PULL REQUEST', 'asks', '#8e5bd8', 'pull'], ['MERGE', 'makes it official', '#2e9e5b', 'merge']];
    R.forEach(([a, b, c, w], i) => {
      const k = pop(tl, sayT(line, w, 0.4 + i * 0.8)); if (k <= 0) return;
      const y = 85 + i * 125;
      ctx.save(); ctx.translate(230, y); ctx.scale(k, k); cPill(a, 0, 0, 42, c); ctx.restore();
      if (k > 0.5) cText(b, 470, y, 46, GIT.ink, { align: 'left', weight: 800, maxW: 380 });
    });
  },
};
