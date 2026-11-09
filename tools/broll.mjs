#!/usr/bin/env node
// Background / b-roll clip library for reels. The repo keeps only the list (broll/manifest.json, with source and
// license for every clip); the clips themselves download to <content root>/broll/<category>/<id>.mp4.
//   node tools/broll.mjs list                     show the manifest by category
//   node tools/broll.mjs fetch [--only a,b] [--category satisfying] [--force]
//                                                 download what is missing, then refresh library.json + index.html
//   node tools/broll.mjs sheet                    rebuild <root>/broll/index.html (a page that plays every clip)
// Options: --manifest <file> (default broll/manifest.json), --out <dir> (default <content root>/broll).
// Pexels: uses the API when PEXELS_API_KEY is set (free key at https://www.pexels.com/api/), which also records the
// author; without a key it uses the public download link https://www.pexels.com/download/video/<id>/.
// Mixkit / Pixabay / Commons / other: give a direct "url" in the manifest entry.
// ffprobe (from ffmpeg) is used to record width, height and duration when it is on PATH.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contentRoot } from './paths.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const cmd = argv[0] || 'list';
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);

const manifestPath = path.resolve(opt('--manifest', path.join(here, '..', 'broll', 'manifest.json')));
const outDir = path.resolve(opt('--out', path.join(contentRoot(), 'broll')));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const libPath = path.join(outDir, 'library.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

for (const c of manifest.clips) {
  if (!manifest.licenses[c.license]) { console.error(`${c.id}: license "${c.license}" is not in manifest.licenses`); process.exit(1); }
}

const clipFile = (c) => path.join(outDir, c.category, `${c.id}.mp4`);
const loadLib = () => (fs.existsSync(libPath) ? JSON.parse(fs.readFileSync(libPath, 'utf8')) : { clips: {} });

function probe(file) {
  try {
    const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
      'stream=width,height:format=duration', '-of', 'json', file], { encoding: 'utf8' }));
    const s = j.streams?.[0] || {};
    return { width: s.width, height: s.height, duration: Math.round(Number(j.format?.duration) * 100) / 100 };
  } catch { return {}; }
}

// Pick the file whose short side is the smallest one >= 1080 (else the largest), so 9:16 crops stay sharp
// without pulling 4K masters.
function pickPexelsFile(files) {
  const mp4 = files.filter((f) => /mp4/.test(f.file_type || '') && f.width && f.height);
  const short = (f) => Math.min(f.width, f.height);
  const big = mp4.filter((f) => short(f) >= 1080).sort((a, b) => short(a) - short(b));
  return big[0] || mp4.sort((a, b) => short(b) - short(a))[0];
}

async function resolve(c) {
  if (c.url) return { url: c.url };
  if (c.source !== 'pexels') throw new Error('no "url" in manifest entry');
  const key = process.env.PEXELS_API_KEY;
  if (key) {
    const r = await fetch(`https://api.pexels.com/videos/videos/${c.sourceId}`, { headers: { Authorization: key } });
    if (!r.ok) throw new Error(`pexels api ${r.status}`);
    const j = await r.json();
    const f = pickPexelsFile(j.video_files || []);
    if (!f) throw new Error('pexels api: no mp4 file');
    return { url: f.link, author: j.user?.name, authorUrl: j.user?.url };
  }
  return { url: `https://www.pexels.com/download/video/${c.sourceId}/` };
}

async function download(url, file) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!r.ok) throw new Error(`download ${r.status}`);
  const type = r.headers.get('content-type') || '';
  if (!/video|octet-stream/.test(type)) throw new Error(`download returned ${type || 'no content-type'}, not a video`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.part';
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
  fs.renameSync(tmp, file);
  return r.url;
}

function writeSheet(lib) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const cats = [...new Set(manifest.clips.map((c) => c.category))];
  let body = '';
  for (const cat of cats) {
    body += `<h2>${esc(cat)}</h2><div class="grid">`;
    for (const c of manifest.clips.filter((x) => x.category === cat)) {
      const e = lib.clips[c.id];
      const lic = manifest.licenses[c.license];
      const media = e ? `<video src="${esc(`${c.category}/${c.id}.mp4`)}" muted loop autoplay playsinline></video>` : '<div class="missing">not downloaded</div>';
      const dims = e?.width ? `${e.width}x${e.height}, ${e.duration}s` : '';
      body += `<figure>${media}<figcaption><b>${esc(c.id)}</b> ${esc(dims)}<br>${esc(c.title)}<br>` +
        `<a href="${esc(c.page)}">source</a> · <a href="${esc(lic.url)}">${esc(lic.name)}</a>${e?.author ? ` · ${esc(e.author)}` : ''}</figcaption></figure>`;
    }
    body += '</div>';
  }
  const html = `<!doctype html><meta charset="utf-8"><title>b-roll library</title><style>
body{font:13px system-ui,sans-serif;background:#111;color:#ddd;margin:20px}a{color:#8cf}
.grid{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:180px}
video,.missing{width:180px;height:320px;object-fit:cover;background:#222;border-radius:6px;display:flex;align-items:center;justify-content:center}
</style><h1>b-roll library</h1><p>Cropped to 9:16 for preview. Sources and licenses: broll/manifest.json in the repo.</p>${body}`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`sheet: ${path.join(outDir, 'index.html')}`);
}

if (cmd === 'list') {
  const lib = loadLib();
  for (const cat of [...new Set(manifest.clips.map((c) => c.category))]) {
    console.log(`\n${cat}`);
    for (const c of manifest.clips.filter((x) => x.category === cat)) console.log(`  ${lib.clips[c.id] ? '✓' : ' '} ${c.id.padEnd(18)} ${c.title}`);
  }
  console.log(`\nclips go to ${outDir}`);
} else if (cmd === 'fetch') {
  const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
  const cat = opt('--category');
  const lib = loadLib();
  let ok = 0, fail = 0;
  for (const c of manifest.clips) {
    if ((only && !only.has(c.id)) || (cat && c.category !== cat)) continue;
    const file = clipFile(c);
    if (fs.existsSync(file) && !flag('--force')) { lib.clips[c.id] ||= { file: path.relative(outDir, file), ...probe(file) }; continue; }
    try {
      const r = await resolve(c);
      const finalUrl = await download(r.url, file);
      lib.clips[c.id] = { file: path.relative(outDir, file), category: c.category, source: c.source, page: c.page,
        license: c.license, author: r.author || c.author, authorUrl: r.authorUrl, downloadedFrom: finalUrl,
        downloadedAt: new Date().toISOString(), ...probe(file) };
      ok++; console.log(`✓ ${c.id}  ${lib.clips[c.id].width || '?'}x${lib.clips[c.id].height || '?'}`);
    } catch (e) { fail++; console.error(`✗ ${c.id}: ${e.message}`); }
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(libPath, JSON.stringify(lib, null, 1));
  writeSheet(lib);
  console.log(`${ok} downloaded, ${fail} failed -> ${outDir}`);
  if (fail) process.exitCode = 1;
} else if (cmd === 'sheet') {
  writeSheet(loadLib());
} else {
  console.error('usage: node tools/broll.mjs list | fetch [--only ids] [--category name] [--force] | sheet'); process.exit(2);
}
