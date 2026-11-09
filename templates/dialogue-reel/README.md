# Dialogue reel template

Vertical short-form reels where two characters banter through a technical explainer: one explains, one riffs.
Each reel picks its **cast** (a drawn caricature and a voice per character), its **background loop**, and its
**cards** (the diagram above the captions). Captions run word by word, the current word in the speaker's colour.
The format is the familiar "one character explains X to another over gameplay footage" reel, with our own characters.

The shipped example is *Git in 60 seconds*: Einstein explains commit, push, pull request and merge to a petty Isaac
Newton over a blocky parkour run (about 56 s).

## Make a reel

```
# 1. copy the template into the content root (never inside the repo)
xcopy /E /I templates\dialogue-reel "%VIDEOMAKER_HOME%\pieces\my-reel"

# 2. write the dialogue: voice\script.json, one line per entry
#    { "id", "speaker", "text", "card"?, "mood"?, "after"? }

# 3. voices, timing, build, export, review
python tools/tts_kokoro.py my-reel
node tools/voice.mjs my-reel
node tools/build.mjs my-reel
node tools/export.mjs my-reel --share --no-captions
node tools/review.mjs my-reel
```

`--no-captions` skips the old narration-preview burn-in: the reel draws its own captions.

## What to swap per reel

| what | where | notes |
|---|---|---|
| cast | `piece.json` `"cast": ["einstein", "newton"]` and `REEL.cast` in `src/head.html` (side, scale) | the speaker id in each script line is the cast name; drawings live in `cast/<name>.js` (see [cast/README.md](../../cast/README.md)) |
| voices | `voice/script.json` `"cast": { "<name>": { "voice", "speed" } }` | Kokoro presets or blends such as `"am_michael:0.7+bm_fable:0.3"` make a voice no preset has; a line can override with its own `voice` |
| background | `piece.json` `"background"` | `"block-run"` (blocky parkour), `"sand-slice"` (kinetic sand, a "satisfying" loop), a clip from the b-roll library: `{ "broll": "<id>" }` (see [broll/](../../broll/README.md)), or any clip you own: `{ "file": "bg.mp4", "start": 0 }` |
| cards | `src/scenes.js` `CARDS` | one function per card key named in the script; a card holds until the next line that names one (`"none"` clears it) |
| layout | `REEL` in `src/head.html` | `layout: 'solo'` (only the speaker, springing in) or `'duo'` (both, the listener dimmed); `dim`, `castScale`, `caption.{words,y,size}`, `title` |
| moods | a line's `"mood"` | each character reads its own: Einstein `neutral`/`excited`/`smug`, Newton `grumpy`/`smug`/`shocked` |

## The rules that make it work

- **The voice is the clock.** Nothing is keyed to typed seconds: lines, captions, mouths, cards and the sound effects
  all follow `voice.json`. Rewrite a line, rerun `tts_kokoro.py --force`, `voice.mjs` and `build.mjs`, and it all moves.
- **Cards cue on spoken words** with `sayT(line, 'push')`, so a diagram step lands as the word is said.
- **Word times:** with `faster-whisper` installed `voice.mjs` hears every word; without it the times are estimated
  from letters and punctuation pauses, which is close enough for chunked captions but can drift a word inside long lines.
- **Your own clip as the background:** the page stays a single file. The frames are rendered with a transparent
  background, and export lays them over the clip (scaled to cover, looped, its sound dropped). Use footage you own:
  your own gameplay recordings, or generated clips (`tools/videogen.mjs`). Game footage someone else uploaded is
  theirs. The browser preview shows a placeholder where the clip goes.
- **Persona jokes, not impersonation.** Caricatures and designed voices only. No real living people, no cloned
  voices, and no characters someone else owns (see cast/README.md).
