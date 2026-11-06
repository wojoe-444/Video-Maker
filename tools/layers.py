#!/usr/bin/env python3
"""Cut a flat illustration (e.g. an image-model still) into layers for a parallax shot.

  usage: python tools/layers.py <image> <piece dir> [--clouds x,y,w,h ...] [--figure x,y,w,h ...] [--scale 1.5]

Writes into <piece>/assets/ (positions in 1920x1080 frame coordinates):
  sky.jpg       the sky with the chosen clouds removed, extended ~60px under the skyline so parallax never shows a gap
  cloudN.png    each --clouds box's cloud as a transparent sprite (to drift)
  building.png  everything that isn't sky, transparent sky; the area behind each --figure filled row by row
  figureN.png   each --figure box's dark figure (the flat indigo people style) as a sprite, rim light included
The positions go to <piece>/layers.json.
Boxes are in the source image's pixels. The sky is found as bright blue (plus the sun) connected to the top edge.
Needs: pip install opencv-python-headless numpy
"""
import argparse, json
from pathlib import Path
import cv2
import numpy as np


def box(s):
    return tuple(int(v) for v in s.split(','))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image'); ap.add_argument('piece')
    ap.add_argument('--clouds', type=box, nargs='*', default=[])
    ap.add_argument('--figure', type=box, nargs='*', default=[])
    ap.add_argument('--scale', type=float, default=1.5, help='upscale factor for the saved layers')
    a = ap.parse_args()
    out = Path(a.piece) / 'assets'; out.mkdir(parents=True, exist_ok=True)
    im = cv2.imread(a.image); H, W = im.shape[:2]
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); h, s, v = [hsv[..., i].astype(int) for i in range(3)]
    fx, fy = 1920 / W, 1080 / H
    size = (int(round(W * a.scale)), int(round(H * a.scale)))
    up = lambda x: cv2.resize(x, size, interpolation=cv2.INTER_LANCZOS4)
    upto = lambda x, w, hh: cv2.resize(x, (int(w * a.scale), int(hh * a.scale)), interpolation=cv2.INTER_LANCZOS4)
    sharpen = lambda x: cv2.addWeighted(x, 1.35, cv2.GaussianBlur(x, (0, 0), 1.2), -0.35, 0)
    meta = {'clouds': [], 'figures': []}

    # sky: bright blue or yellow (the sun), connected to the top edge
    m = (((h >= 98) & (h <= 126) & (v > 170)) | ((h >= 15) & (h <= 40) & (s > 80) & (v > 200))).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab = cv2.connectedComponents(m)
    sky = np.isin(lab, list(set(np.unique(lab[0, :])) - {0}))
    core = cv2.erode(sky.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0

    # clouds: low-saturation sky pixels inside each box
    cm = np.zeros((H, W), np.uint8)
    for i, (x, y, w, hh) in enumerate(a.clouds):
        sub = (sky[y:y + hh, x:x + w] & (s[y:y + hh, x:x + w] < 150)).astype(np.uint8)
        cm[y:y + hh, x:x + w] |= sub
        alpha = cv2.GaussianBlur(cv2.dilate(sub * 255, np.ones((3, 3), np.uint8)), (0, 0), 1.0)
        cv2.imwrite(str(out / f'cloud{i}.png'), upto(np.dstack([im[y:y + hh, x:x + w], alpha]), w, hh))
        meta['clouds'].append({'name': f'cloud{i}.png', 'x': x * fx, 'y': y * fy, 'w': w * fx, 'h': hh * fy})
    cm = cv2.dilate(cm, np.ones((9, 9), np.uint8))
    band = cv2.dilate(sky.astype(np.uint8), np.ones((121, 121), np.uint8)) > 0
    base = im.copy(); base[~core] = 0
    skyimg = cv2.inpaint(base, ((cm > 0) | (band & ~core)).astype(np.uint8) * 255, 21, cv2.INPAINT_TELEA)
    cv2.imwrite(str(out / 'sky.jpg'), up(skyimg), [cv2.IMWRITE_JPEG_QUALITY, 92])

    # figures: dark indigo pixels in each box (largest blob) plus the lavender rim light beside them
    b, g, r = [im[..., i].astype(int) for i in range(3)]
    holes = np.zeros((H, W), bool)
    for i, (x, y, w, hh) in enumerate(a.figure):
        f = np.zeros((H, W), np.uint8)
        f[y:y + hh, x:x + w] = ((v < 130) & (b > r + 5))[y:y + hh, x:x + w]
        f = cv2.morphologyEx(f, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        k, lab, st, _ = cv2.connectedComponentsWithStats(f)
        if k < 2: continue
        f = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
        f |= ((b > r + 15) & (b > g + 40)).astype(np.uint8) & cv2.dilate(f, np.ones((19, 19), np.uint8))
        f = cv2.morphologyEx(f, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        ff = np.pad(f, 1); cv2.floodFill(ff, None, (0, 0), 1); f |= 1 - ff[1:-1, 1:-1]
        ys, xs = np.nonzero(f); x0, x1, y0, y1 = max(0, xs.min() - 4), min(W, xs.max() + 5), max(0, ys.min() - 4), min(H, ys.max() + 5)
        alpha = cv2.GaussianBlur(f[y0:y1, x0:x1] * 255, (0, 0), 0.7)
        cv2.imwrite(str(out / f'figure{i}.png'), sharpen(upto(np.dstack([im[y0:y1, x0:x1], alpha]), x1 - x0, y1 - y0)))
        meta['figures'].append({'name': f'figure{i}.png', 'x': x0 * fx, 'y': y0 * fy, 'w': (x1 - x0) * fx, 'h': (y1 - y0) * fy})
        holes |= cv2.dilate(f, np.ones((7, 7), np.uint8)) > 0

    # building: fill behind the figures row by row (planks, beams and pavement run horizontally)
    bld = im.astype(np.float32)
    for y in range(H):
        xs = np.nonzero(holes[y])[0]
        for run in (np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1) if len(xs) else []):
            l, rr = run[0] - 1, run[-1] + 1
            L = bld[y, l] if l >= 0 else None; R = bld[y, rr] if rr < W else None
            for x in run:
                bld[y, x] = R if L is None else L if R is None else L + (R - L) * (x - l) / (rr - l)
    bld = bld.astype(np.uint8); blur = cv2.GaussianBlur(bld, (0, 0), 1.5); bld[holes] = blur[holes]
    alpha = cv2.GaussianBlur((~sky).astype(np.uint8) * 255, (0, 0), 0.7)
    cv2.imwrite(str(out / 'building.png'), sharpen(up(np.dstack([bld, alpha]))))
    (Path(a.piece) / 'layers.json').write_text(json.dumps(meta, indent=1))
    print(json.dumps(meta, indent=1))


if __name__ == '__main__':
    main()
