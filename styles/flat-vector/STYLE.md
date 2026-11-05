# flat-vector

An original flat-vector science-explainer look: deep indigo space, flat shapes with a diagonal shade and a light
rim, soft glows, a rounded sans, and round characters with dot eyes. It is in the general spirit of popular
science channels but uses no characters, logos or assets from any of them.

**Status:** first look frames only (proven on: `which-claude` look frames). Not yet matched against references,
and there is no `demo/` or `sample.png` yet.

## Palette (`FV` in kit.js)

| role | hex |
|---|---|
| ground / deep / glow | `#141a3a` / `#0b0f26` / `#2b3a7a` |
| ink (text) / dim text / grid line | `#f4f1ea` / `#8d95c4` / `#3a4683` |
| hero (courier) | teal `#35d0c0` |
| accents | coral `#ff7a5c`, gold `#ffc94a`, violet `#9d7cff`, green `#5fd38a` |

## Marks

- `fvBody(P, c)`: the core mark. Flat fill, a darker half-plane shade on the lower right (tilted 35°), a light rim
  2 to 9px on the upper left. No outlines anywhere.
- `fvGlow`, `fvCircle`, `fvRound`, `fvDot`, `fvText` (write-on with `frac`), `fvPill` (tags and price chips).
- `fvSky`: radial-glow backdrop with seeded, slowly twinkling stars.
- Characters: `fvCourier` (the hero), `fvHaiku`, `fvSonnet`, `fvOpus` (three thinking machines), `fvEyes`, `fvDial`.
- Charts: `fvAxes(box, xRange, yRange)` (log x, linear y), `fvGrid`.

## Motion

On 1s (`ones: true`), eased with `EZ.io` and `popS` springs; idle bob on the hero, twinkle in the sky.

## Frame checklist

- One subject lit by a glow; everything else sits back in the indigo.
- Text is the rounded sans at 26px or larger at 1080p, never over a busy shape.
- Every number on screen comes from the piece's `brief.md` sources.
