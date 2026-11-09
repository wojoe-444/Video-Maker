// =====================================================================
//  cast/newton.js — "the rival": a caricature of Isaac Newton (long curled wig, white cravat, dark coat, and an
//  apple balanced on his head). Original drawing; Newton (1643-1727) is long out of any likeness or publicity right.
//  Persona: a petty, competitive genius who keeps comparing everything to gravity, calculus and Leibniz.
// =====================================================================
var CAST = CAST || {};
CAST.newton = {
  name: 'Isaac Newton', short: 'NEWTON', color: '#ff6b5e', h: 1200,
  draw(p) {
    const SK = '#f4d2bb', SKD = '#dcae92', WIG = '#7a5232', WIGD = '#5b3a20', COAT = '#3a2f3c', COATD = '#261e28';
    const mood = p.mood || 'grumpy';
    // the coat
    toon([[-400, 10], [-370, -240], [-240, -330], [-80, -350], [80, -350], [240, -330], [370, -240], [400, 10]], COAT);
    toonLine([[0, -300], [0, 0]], 6, COATD);
    [-240, -150, -60].forEach((y) => toonEll(-34, y, 13, 13, '#c9a54a', { line: 4 }));
    // long curls falling to the shoulders, behind the head
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) toon(puffPts(s * (205 + (i % 2) * 34), -660 + i * 105, 78, 70, 6, 22, 'nw-curl' + s + i), i % 2 ? WIGD : WIG, { line: 7 });
    toon(puffPts(0, -770, 255, 210, 14, 34, 'nw-top', Math.PI * 0.9, Math.PI * 2.1), WIG);
    // the cravat
    toon([[-80, -360], [80, -360], [60, -250], [90, -150], [0, -170], [-90, -150], [-60, -250]], '#fbfaf5', { line: 7 });
    toonLine([[-30, -300], [-20, -200]], 4, '#d8d4c8'); toonLine([[30, -300], [20, -200]], 4, '#d8d4c8');
    // neck and head: long and narrow
    toon([[-60, -350], [-60, -440], [60, -440], [60, -350]], SKD, { line: 7 });
    toon(ellipsePts(0, -680, 165, 228, 0, 64), SK);
    // the wig's centre parting and the curls framing the face
    toon(puffPts(-120, -820, 90, 70, 5, 26, 'nw-fl', Math.PI * 0.7, Math.PI * 1.9), WIG, { line: 7 });
    toon(puffPts(120, -820, 90, 70, 5, 26, 'nw-fr', Math.PI * 1.1, Math.PI * 2.3), WIG, { line: 7 });
    toon(puffPts(-168, -660, 48, 120, 5, 20, 'nw-sl', Math.PI * 0.4, Math.PI * 1.6), WIG, { line: 7 });
    toon(puffPts(168, -660, 48, 120, 5, 20, 'nw-sr', Math.PI * 1.4, Math.PI * 2.6), WIG, { line: 7 });
    // the apple, balanced on top
    const wob = Math.sin(p.t * 2.3) * 0.08 + (p.talk ? Math.sin(p.t * 9) * 0.04 : 0);
    ctx.save(); ctx.translate(0, -985); ctx.rotate(wob);
    toon([[0, -60], [-50, -70], [-78, -20], [-62, 34], [-24, 54], [0, 44], [24, 54], [62, 34], [78, -20], [50, -70]], '#e0392b');
    toonLine([[0, -60], [6, -95]], 7, '#5a3a1e');
    toon([[8, -88], [46, -110], [62, -86], [26, -78]], '#5fae46', { line: 5 });
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-36, -30, 12, 20, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
    // eyebrows: arched and sceptical (one higher); "shocked" lifts both, "grumpy" knits them
    const knit = mood === 'grumpy' ? 14 : mood === 'shocked' ? -26 : 0;
    toonLine([[-112, -742 + knit * 0.2], [-70, -768 - (mood === 'shocked' ? 20 : 0)], [-30, -746 + knit]], 13, WIGD);
    toonLine([[30, -756 + knit], [72, -792 - (mood === 'shocked' ? 16 : 0)], [112, -760]], 13, WIGD);
    // heavy-lidded eyes
    const look = mood === 'shocked' ? 0 : -0.5 + Math.sin(p.t * 0.9) * 0.2;
    toonEye(-68, -695, 28, { blink: p.blink, droop: mood === 'shocked' ? 0 : 0.42, skin: SK, lx: look, iris: '#2c3a4a' });
    toonEye(68, -695, 28, { blink: p.blink, droop: mood === 'shocked' ? 0 : 0.42, skin: SK, lx: look, iris: '#2c3a4a' });
    // a long sharp nose
    toon([[-4, -700], [-30, -600], [-14, -586], [10, -590], [22, -606], [8, -700]], SK, { line: 7 });
    // thin pursed lips, a small cleft chin
    toonMouth(0, -535, 80, p.mouth, { smile: mood === 'smug' ? 8 : -6, smirk: mood === 'smug' ? 10 : 0, teeth: true });
    toonLine([[-14, -478], [0, -470], [14, -478]], 5, SKD);
  },
};
