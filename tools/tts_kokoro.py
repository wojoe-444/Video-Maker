#!/usr/bin/env python3
"""Local narration with Kokoro (Apache-2.0), no cloud service.

Makes every line in <piece>/voice/script.json that has no audio file yet, then run tools/voice.mjs to place and time it.
  usage: python tools/tts_kokoro.py <piece dir> [--voice bm_george] [--speed 0.95] [--force]
Needs: pip install kokoro-onnx soundfile, plus the model files kokoro-v1.0.onnx and voices-v1.0.bin
(https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0) in KOKORO_DIR,
default <content root>/models/kokoro (content root: VIDEOMAKER_HOME, else %LOCALAPPDATA%/VideoMaker).

Voices, most specific first: a line's own "voice"/"speed", then its speaker's entry in the script's "cast" block
(dialogue reels: "cast": { "einstein": { "voice": "am_michael", "speed": 0.92 } }), then --voice/--speed.
A voice can be a blend, which makes a designed voice no single preset has: "am_onyx:0.6+bm_fable:0.4".
List the presets with --list.
"""
import argparse, json, os, sys
from pathlib import Path


def content_root():
    if os.environ.get('VIDEOMAKER_HOME'):
        return Path(os.environ['VIDEOMAKER_HOME'])
    if os.environ.get('LOCALAPPDATA'):
        return Path(os.environ['LOCALAPPDATA']) / 'VideoMaker'
    return Path.home() / '.local' / 'share' / 'VideoMaker'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('piece')
    ap.add_argument('--voice', default='bm_george')
    ap.add_argument('--speed', type=float, default=0.95)
    ap.add_argument('--force', action='store_true', help='remake lines that already have audio')
    ap.add_argument('--list', action='store_true', help='print the voice presets and stop')
    a = ap.parse_args()
    piece = Path(a.piece)
    if not piece.exists() and '/' not in a.piece and '\\' not in a.piece:
        piece = content_root() / 'pieces' / a.piece
    vdir = piece / 'voice'
    script = json.loads((vdir / 'script.json').read_text(encoding='utf-8'))
    mdir = Path(os.environ.get('KOKORO_DIR') or content_root() / 'models' / 'kokoro')
    model, voices = mdir / 'kokoro-v1.0.onnx', mdir / 'voices-v1.0.bin'
    if not model.exists() or not voices.exists():
        sys.exit(f'Kokoro model files not found in {mdir} (see the usage notes at the top of this file)')
    import soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(str(model), str(voices))
    if a.list:
        print(' '.join(sorted(k.get_voices())))
        return
    cast = script.get('cast', {})

    def style(spec):
        # "name" or a weighted blend "a:0.6+b:0.4" (weights are normalised)
        if '+' not in spec and ':' not in spec:
            return spec
        parts = [(p.split(':')[0].strip(), float(p.split(':')[1]) if ':' in p else 1.0) for p in spec.split('+')]
        total = sum(w for _, w in parts)
        return sum(k.get_voice_style(n) * (w / total) for n, w in parts)

    for line in script['lines']:
        out = vdir / line.get('file', line['id'] + '.wav')
        if out.exists() and not a.force:
            continue
        who = cast.get(line.get('speaker', ''), {})
        voice = line.get('voice', who.get('voice', a.voice))
        speed = line.get('speed', who.get('speed', a.speed))
        samples, sr = k.create(line['text'], voice=style(voice), speed=speed, lang=who.get('lang', 'en-us'))
        sf.write(str(out), samples, sr)
        print(f'{out.name}: {len(samples) / sr:.2f}s  {voice} x{speed}  "{line["text"]}"')


if __name__ == '__main__':
    main()
