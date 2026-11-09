# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

Video-Maker is Walter's personal tool for making short animated videos in code. It starts from
[cth9191/animate](https://github.com/cth9191/animate) (MIT), a Claude Code skill that draws every frame
procedurally on one `<canvas>`, synthesizes the score in code, and renders to MP4 with a headless
browser and ffmpeg. We adapt it to our own uses rather than tracking it as a fork. Keep its license
notice when copying its code in.

The reference skill's contents are copied to the repo root (`kit/`, `tools/`, `styles/`, `templates/`,
`grammar/`, `examples/`, and the workflow docs `SKILL.md`, `intake.md`, `craft.md`, `new-style.md`). Its MIT
license is kept in `LICENSE-animate`. Where the docs say `pieces/<name>`, a bare piece name now resolves to the
content root (see `tools/paths.mjs`).

## The golden rule: code here, content in AppData

This repo holds **code and structure only**: the kit, styles, templates, tools, and docs.
Generated content and working media never go in the repo. That covers pieces in progress, frames,
renders, audio, voice takes, reference media, and screenshots.

- Content root on Windows: `%LOCALAPPDATA%\VideoMaker\`
  (e.g. `C:\Users\walte\AppData\Local\VideoMaker\`). Suggested layout:
  - `pieces\<name>\` for a piece's `piece.json`, `src\`, `brief.md`, `LOG.md`, `assets\`, `audio\`,
    `frames\`, `renders\`, `review\`
  - `references\<look>\` for reference media used to match a new style
  - `styles\<name>\` for personal styles that aren't ready to promote into the repo
- Tools take a piece path as an argument, so point them at the AppData folder, never at a path in
  the repo. `build`, `export`, `review`, `voice` and `tile` also accept a bare piece name and resolve it with
  `tools/paths.mjs` to `%VIDEOMAKER_HOME%\pieces\<name>` (default `%LOCALAPPDATA%\VideoMaker`).
- **Gotcha:** anything launched by the Claude desktop app (an MSIX package), including Remote Control
  sessions, has its `AppData\Local` writes silently redirected to
  `%LOCALAPPDATA%\Packages\Claude_<id>\LocalCache\Local\`, so the files don't show up under
  `%LOCALAPPDATA%\VideoMaker` in Explorer. When running tools from the Claude app, set `VIDEOMAKER_HOME`
  to a folder outside AppData (Walter's references live in `Downloads\THD_Video References\`).
- `.gitignore` must exclude `pieces/`, `frames/`, `renders/`, `review/`, `*.mp4`, `*.wav`, built
  `index.html` files, `node_modules/` and `__pycache__/` as a safety net.
- A style that is proven and reusable may be promoted into the repo (code, `STYLE.md`, a small
  `sample.png`, and a tiny `demo/`). Its reference media still stays local.

## Local setup

- Local clone: `C:\Users\walte\Repos\Videos-Maker` (Windows). Write paths and scripts so they
  work on Windows first: use `path.join`, avoid shell-only syntax in npm scripts, and quote paths.
- Requirements (same as the reference): Node 18+, Playwright with Chromium
  (`npm i -g playwright && npx playwright install chromium`), and ffmpeg on PATH. For voice-overs,
  Python with `faster-whisper` for word timing. Narration is local by default with Kokoro:
  `pip install kokoro-onnx soundfile`, put `kokoro-v1.0.onnx` and `voices-v1.0.bin` in
  `%LOCALAPPDATA%\VideoMaker\models\kokoro\` (or set `KOKORO_DIR`), then
  `python tools/tts_kokoro.py <piece>` followed by `node tools/voice.mjs <piece>`. ElevenLabs is optional.

## Intended stack and structure (from the reference)

Plain JavaScript (ES modules, Node tools) plus HTML canvas and Web Audio. There are no frameworks
and no bundler; the build concatenates sources into one self-contained `index.html`.

In the reference everything lives under `plugins/animate/skills/animate/`; here it lives at the repo root:

| path | role |
|---|---|
| `SKILL.md`, `intake.md`, `craft.md`, `new-style.md` | the workflow and the rules learned building pieces |
| `grammar/` | `STORY.md`, `FORMATS.md` (8 short-form formats), `FRAME.md` (what any frame needs) |
| `kit/` | the shared runtime: `core.js` (seeded RNG, boil, cameras, easing), `morph.js` (shape-morph transitions), `board.js` (storyboard), `score-head.js` / `score-tail.js` (synth + loudness) |
| `styles/<name>/` | plug-in looks: `kit.js`, `STYLE.md`, `sample.png`, `demo/` (cut-paper, crosshatch, riso, sketchbook, math, pixel, isometric) |
| `templates/` | starting points: `piece/` (morph chain), `beat-cut/` (cuts on the beat), `style/`, `dialogue-reel/` (two characters banter through an explainer) |
| `kit/reel.js`, `cast/`, `backgrounds/` | dialogue reels: the renderer (stickers, word captions, cards), the characters, the background loops |
| `tools/` | Node CLIs: `build`, `tile`, `still`, `storyboard`, `export`, `review`, `compare`, `capture`, `beats`, `voice`, `gallery`, `framehash`, `gpu`, `measure/`, plus `videogen` and `musicgen` (video and song models through OpenRouter), and `broll` (downloads the stock clip library) |
| `broll/` | `manifest.json`: every background/b-roll clip with its source and license (clips themselves download to `<content root>roll\`); `README.md` has the license and gameplay rules |
| `examples/history-of-ai/` | a complete 60s reference piece |

A **piece** is `piece.json` (format: width, height, fps, bpm, duration, frames; `style`; review safe
areas) plus `src/head.html`, `src/scenes.js`, `src/bridges.js`, `src/score.js`.

## Workflow

1. Intake, then three cheap check-ins before animating: **story** (beat table), **look** (2 to 4
   style frames), **storyboard** (every beat).
2. Build: `node tools/build.mjs <piece>` makes `index.html`. Preview it in a browser; `?t=12.5`
   freezes a frame.
3. Check while building: `tools/tile.mjs`, `tools/still.mjs`, `tools/storyboard.mjs`.
4. Export: `node tools/export.mjs <piece> --share [--formats 9:16,1:1,16:9]` writes frames, WAV,
   and `renders/final.mp4` / `share.mp4` into the piece folder (in AppData).
5. Review: `node tools/review.mjs <piece>` must pass. Report its numbers, not "looks good".

## Rules carried over from the reference

- **Deterministic:** seeded `RNG(...)` and the boil index only. Never `Math.random()` or wall-clock
  time in a piece.
- **Single file, all code:** the built `index.html` has no external URLs, `data:` URIs, or web
  fonts. The only exceptions are the user's own assets (embedded by the build) and a music track
  (joined at export).
- **Facts on screen are web-checked** and listed with sources in the piece's `brief.md`.
- **Kit changes must not silently change existing pieces:** use `tools/framehash.mjs` to confirm
  pixel-identical output.

## Conventions

- Keep tools as small standalone Node scripts that take paths as arguments.
- Commit only code, docs, and small sample images. Never commit generated media.
