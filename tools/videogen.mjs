#!/usr/bin/env node
// Generate a clip with a video model through OpenRouter's Video Generation API (async: submit, poll, download).
//   usage: node tools/videogen.mjs --prompt-file prompt.txt --out clip.mp4 [--image first.png] [--model google/gemini-omni-1.2-flash]
//          [--duration 4] [--resolution 720p] [--aspect 16:9] [--audio | --no-audio] [--seed N]
// Audio is left to the model unless --audio or --no-audio is given (some models, like Gemini Omni, always make audio).
// The key comes from OPENROUTER_API_KEY, else from pi's auth file (~/.pi/agent/auth.json, "openrouter" entry).
// --image is sent as the first frame (a data: URL), so the clip starts on that picture.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const flag = (k) => argv.includes(k);
const promptFile = opt('--prompt-file'), out = opt('--out', 'clip.mp4');
if (!promptFile) { console.error('usage: node tools/videogen.mjs --prompt-file prompt.txt --out clip.mp4 [--image first.png] ...'); process.exit(2); }

function key() {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  const f = path.join(os.homedir(), '.pi', 'agent', 'auth.json');
  if (fs.existsSync(f)) {
    const a = JSON.parse(fs.readFileSync(f, 'utf8')), e = a.openrouter;
    const k = typeof e === 'string' ? e : e && (e.key || e.apiKey || e.access || e.token);
    if (k) return k;
  }
  console.error('no OpenRouter key: set OPENROUTER_API_KEY (or log pi in to OpenRouter)'); process.exit(1);
}
const KEY = key(), API = 'https://openrouter.ai/api/v1';
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const body = {
  model: opt('--model', 'google/gemini-omni-1.2-flash'),
  prompt: fs.readFileSync(promptFile, 'utf8').trim(),
  duration: Number(opt('--duration', 4)),
  resolution: opt('--resolution', '720p'),
  aspect_ratio: opt('--aspect', '16:9'),
};
if (flag('--audio')) body.generate_audio = true;
if (flag('--no-audio')) body.generate_audio = false;
if (opt('--seed')) body.seed = Number(opt('--seed'));
const img = opt('--image');
if (img) {
  const ext = path.extname(img).slice(1).toLowerCase().replace('jpg', 'jpeg');
  body.frame_images = [{ type: 'image_url', image_url: { url: `data:image/${ext};base64,${fs.readFileSync(img).toString('base64')}` }, frame_type: 'first_frame' }];
}

const sub = await fetch(`${API}/videos`, { method: 'POST', headers: H, body: JSON.stringify(body) });
const job = await sub.json();
if (!sub.ok) { console.error('submit failed', sub.status, JSON.stringify(job)); process.exit(1); }
console.log(`submitted ${job.id} (${body.model}, ${body.duration}s ${body.resolution} ${body.aspect_ratio})`);
const t0 = Date.now();
let st;
for (;;) {
  await new Promise((r) => setTimeout(r, 15000));
  st = await (await fetch(`${API}/videos/${job.id}`, { headers: H })).json();
  console.log(`  ${Math.round((Date.now() - t0) / 1000)}s: ${st.status}`);
  if (st.status === 'completed') break;
  if (st.status === 'failed') { console.error('failed:', JSON.stringify(st.error || st)); process.exit(1); }
  if (Date.now() - t0 > 15 * 60e3) { console.error('timed out after 15 min; job', job.id); process.exit(1); }
}
const vid = await fetch(`${API}/videos/${job.id}/content?index=0`, { headers: { Authorization: `Bearer ${KEY}` } });
if (!vid.ok) { console.error('download failed', vid.status); process.exit(1); }
fs.writeFileSync(out, Buffer.from(await vid.arrayBuffer()));
fs.writeFileSync(out.replace(/\.mp4$/, '') + '.job.json', JSON.stringify({ request: { ...body, frame_images: img ? `[${path.basename(img)}]` : undefined }, job: st }, null, 1));
console.log(`wrote ${out}${st.usage ? ' — usage ' + JSON.stringify(st.usage) : ''}`);
