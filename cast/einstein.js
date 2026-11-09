// =====================================================================
//  cast/einstein.js — "the professor": a light caricature of Albert Einstein (wild white hair, walrus moustache,
//  grey cardigan). Original drawing, no photo traced. Rights note (cast/README.md): his name and likeness are
//  licensed by his estate's agent, so keep it to personal and educational reels and don't sell merchandise with it.
//  Voice: a designed Kokoro voice (see the reel's script.json cast block), never a clone of his recordings.
// =====================================================================
var CAST = CAST || {};
CAST.einstein = {
  name: 'Albert Einstein', short: 'EINSTEIN', color: '#ffd84a', h: 1150,
  draw(p) {
    const SK = '#f1c7a2', SKD = '#dca37f', HAIR = '#f7f5f0', HAIRD = '#cfcac0', WOOL = '#8d8f96', WOOLD = '#6f7178';
    const mood = p.mood || 'neutral', excited = mood === 'excited' || mood === 'smug';
    // the cardigan and shirt
    toon([[-400, 10], [-360, -250], [-250, -330], [-90, -360], [90, -360], [250, -330], [360, -250], [400, 10]], WOOL);
    toon([[-100, -355], [0, -150], [100, -355], [60, -362], [0, -250], [-60, -362]], '#f4f1e8', { line: 6 });
    toon([[-26, -300], [26, -300], [36, -40], [0, 0], [-36, -40]], '#7a3b3b', { line: 6 });
    toonLine([[-240, -300], [-200, -120], [-210, 0]], 7, WOOLD); toonLine([[240, -300], [200, -120], [210, 0]], 7, WOOLD);
    [-150, -60, 30].forEach((y) => toonEll(-120 + (y + 150) * 0.02, y - 140, 12, 12, '#4b4d53', { line: 4 }));
    // neck
    toon([[-70, -330], [-70, -420], [70, -420], [70, -330], [0, -300]], SKD, { line: 7 });
    // the back of the hair: a big wild cloud, widest at the temples
    toon(puffPts(0, -720, 330, 290, 15, 70, 'ein-back', Math.PI * 0.82, Math.PI * 2.18), HAIR);
    // ears
    toonEll(-196, -650, 36, 56, SK, { line: 7 }); toonEll(196, -650, 36, 56, SK, { line: 7 });
    // the head
    toon(ellipsePts(0, -690, 196, 236, 0, 64), SK);
    // forehead wrinkles
    toonLine([[-90, -830], [0, -845 - (excited ? 10 : 0)], [90, -830]], 5, SKD); toonLine([[-70, -800], [0, -812], [70, -800]], 5, SKD);
    // front tufts over the temples
    toon(puffPts(-170, -800, 70, 90, 5, 40, 'ein-tl', Math.PI * 0.6, Math.PI * 1.7), HAIR, { line: 7 });
    toon(puffPts(170, -800, 70, 90, 5, 40, 'ein-tr', Math.PI * 1.3, Math.PI * 2.4), HAIR, { line: 7 });
    toonLine([[-230, -720], [-290, -760], [-330, -700]], 5, HAIRD); toonLine([[230, -720], [290, -770], [335, -710]], 5, HAIRD);
    // bushy eyebrows, raised at the inner ends (kind, a little sad); excited lifts them
    const bl = excited ? -22 : 0;
    toon(puffPts(-82, -748 + bl, 62, 20, 6, 12, 'ein-bl', Math.PI, TAU + Math.PI), HAIR, { line: 6 });
    toon(puffPts(82, -748 + bl - (mood === 'smug' ? 14 : 0), 62, 20, 6, 12, 'ein-br', Math.PI, TAU + Math.PI), HAIR, { line: 6 });
    // eyes with bags under them
    const look = Math.sin(p.t * 0.7) * 0.4;
    toonEye(-78, -690, 34, { blink: p.blink, droop: excited ? 0.12 : 0.3, skin: SK, lx: look });
    toonEye(78, -690, 34, { blink: p.blink, droop: excited ? 0.12 : 0.3, skin: SK, lx: look });
    toonLine([[-108, -640], [-78, -628], [-48, -640]], 4, SKD); toonLine([[48, -640], [78, -628], [108, -640]], 4, SKD);
    // the nose: big and round
    toon([[-14, -700], [-36, -610], [-48, -588], [-30, -570], [0, -566], [30, -570], [48, -588], [36, -610], [14, -700]], SK, { line: 7 });
    // the mouth, then the moustache over its top edge
    toonMouth(0, -515, 110, p.mouth, { smile: excited ? 12 : 4 });
    const lift = p.mouth * 10;
    toon(puffPts(0, -548 - lift, 118, 34, 9, 14, 'ein-stache', Math.PI * 0.95, Math.PI * 2.05), HAIR, { line: 7 });
    toon([[-120, -548 - lift], [-136, -510 - lift], [-100, -520 - lift]], HAIR, { line: 6 });
    toon([[120, -548 - lift], [136, -510 - lift], [100, -520 - lift]], HAIR, { line: 6 });
    // smile lines
    toonLine([[-112, -600], [-132, -560], [-118, -520]], 5, SKD); toonLine([[112, -600], [132, -560], [118, -520]], 5, SKD);
  },
};
