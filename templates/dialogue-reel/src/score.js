  // SCORE BODY — dialogue reel (inside buildScore(); see kit/score-head.js). A quiet lo-fi bed under the voices
  // (export mixes it at piece.json voice.music dB and ducks it while anyone speaks), a pop when the speaker changes,
  // a soft chime when a card appears.
  const T = TIMELINE, bar = 4 * 60 / T.bpm;
  to = 'm';
  const CH = [['D3', 'A3', 'Fs4', 'Cs5'], ['B2', 'Fs3', 'D4', 'A4'], ['G2', 'D3', 'B3', 'Fs4'], ['A2', 'E3', 'Cs4', 'E4']];
  for (let b = 0, i = 0; b < LOOP_T; b += bar, i++) {
    const c = CH[i % 4];
    pad(b, Math.min(LOOP_T, b + bar + 0.2), c, 0.022, { type: 'triangle', cut: 900, att: 0.3, rel: 0.3, send: 0.35 });
    for (let k = 0; k < 8; k++) { const t = b + k * bar / 8; if (t < LOOP_T - 0.3 && k % 3 !== 2) pluck(t, nz(c[1 + (k % 3)]) * 2, 0.06, k % 2 ? 0.3 : -0.3, 0.25, 1800, 0.3); }
    bass(b, nz(c[0]), 0.12); bass(b + bar / 2, nz(c[0]), 0.08);
  }
  to = 's';
  RL.forEach((l, i) => { if (i && l.speaker !== RL[i - 1].speaker) blip(l.t0 - 0.15, 520, 880, 0.08, 0.05, REEL.cast[l.speaker].side === 'right' ? 0.4 : -0.4); });
  CARD_LIST.forEach((c) => chime(c.t0, [nz('A5'), nz('D6')], 0.03));
