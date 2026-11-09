# Cast

Characters for dialogue reels ([templates/dialogue-reel](../templates/dialogue-reel/README.md)). Each is one file,
`cast/<name>.js`, that registers `CAST.<name> = { name, short, color, h, draw(pose) }`. `draw` paints the bust with
its bottom centre at 0,0 using the toon helpers in `kit/reel.js` (`toon`, `toonEll`, `puffPts`, `toonEye`,
`toonMouth`, `toonLine`), and reads `pose = { mouth, blink, talk, mood, t }`. The kit turns it into a sticker
cut-out (white edge, shadow), springs it in, and drives the mouth from the voice's word times. Don't draw text in a
cast file. Personal characters that aren't ready for the repo can live in `<content root>/cast/<name>.js`: the
build looks beside the piece and above it first.

## Shipped

| name | persona | caption colour | default voice (Kokoro) |
|---|---|---|---|
| `einstein` | the kindly professor who makes hard things sound easy; smug about puns | yellow | `am_michael:0.7+bm_fable:0.3` at 0.95 |
| `newton` | a petty, competitive genius with an apple on his head; compares everything to gravity and Leibniz | apple red | `bm_george` at 1.05 |

## Rules for new characters

- **Public domain persons and characters only, drawn as our own caricatures.** Nothing from a studio's version
  (no Disney Alice, no Universal Frankenstein with the flat head and neck bolts, no Bela Lugosi Dracula).
- **No real living people, and no voice clones.** Voices are Kokoro presets or blends, designed to suit the persona.
- **Flag the managed estates.** Einstein's name and likeness are licensed by the Hebrew University of Jerusalem,
  which enforces it commercially (a US court limited its post-mortem publicity claim in 2012, but it still sends
  letters). A light caricature in a free educational reel is low risk; don't sell merchandise or ads built on it.
  Similar care: Tesla (the person is fine, the car brand is a trademark), Marilyn Monroe, Elvis and other
  20th-century celebrities (skip those).

## Roster ideas (not drawn yet)

Pairings that carry a topic, most promising first:

| pair | the joke | fits |
|---|---|---|
| Tesla and Edison | the visionary and the credit thief | `git blame`, code ownership, licences |
| Henry VIII and Thomas Cromwell | "divorced, beheaded, rebased" | `git reset --hard`, deleting branches, data retention |
| Sisyphus and Zeus | the boulder is a flaky test | CI pipelines, retries, technical debt |
| Dr Jekyll and Mr Hyde | one character, two environments | staging vs production, environment variables, feature flags |
| Dracula and Van Helsing | the vampire who must finish before sunrise | cron jobs, time zones, daylight-saving bugs |
| Ada Lovelace and Charles Babbage | she wrote the program, he never finished the machine | APIs, scope creep, shipping |
| Julius Caesar and Brutus | "Et tu, reviewer?" | code review, permissions, least privilege |
| Socrates and a fed-up intern | answers every question with a question | rubber-duck debugging, requirements |
| Beethoven and Mozart | the prodigy ships fast; the deaf genius can't hear the alerts | monitoring and alerting, on-call |
| Scrooge and the three ghosts | bills past, present and yet to come | cloud costs, FinOps |
| Prometheus and Zeus | he stole fire; you pushed an API key | secrets management |
| Sherlock Holmes and Watson | deduction from the logs | debugging, observability |
| Don Quixote and Sancho Panza | tilting at windmills | premature optimisation, yak shaving |
| Frankenstein (the 1818 novel's creature) and Victor | "it's alive", and it's a monolith | monoliths vs microservices |
