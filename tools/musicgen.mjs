#!/usr/bin/env node
// Generate a song (vocals + lyrics) or a clip with a music model through OpenRouter's chat completions API.
//   usage: node tools/musicgen.mjs --prompt-file prompt.txt --out song.mp3 [--model google/lyria-3-pro-preview]
//   models: google/lyria-3-pro-preview (a full song, about $0.08), google/lyria-3-clip-preview (30 s, about $0.04)
// The prompt holds the musical direction, then the lyrics with [Verse] / [Chorus] / [Bridge] tags.
// The key comes from OPENROUTER_API_KEY, else from pi's auth file (~/.pi/agent/auth.json, "openrouter" entry).
// Audio output is streamed; the base64 audio chunks are joined and written to --out. Any lyrics or notes the
// model sends back go to <out>.txt, and if no audio arrives the raw stream is kept in <out>.raw.txt.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const promptFile = opt('--prompt-file'), out = opt('--out', 'song.mp3');
if (!promptFile) { console.error('usage: node tools/musicgen.mjs --prompt-file prompt.txt --out song.mp3 [--model google/lyria-3-pro-preview]'); process.exit(2); }

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

const model = opt('--model', 'google/lyria-3-pro-preview');
const fmt = path.extname(out).slice(1).toLowerCase() === 'wav' ? 'wav' : 'mp3';
const body = {
  model,
  messages: [{ role: 'user', content: fs.readFileSync(promptFile, 'utf8').trim() }],
  modalities: ['text', 'audio'],
  audio: { format: fmt },
  stream: true,
};
console.log(`requesting ${model} -> ${out}`);
const t0 = Date.now();
const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error('request failed', res.status, await res.text()); process.exit(1); }

// read the SSE stream; collect audio from delta.audio.data (OpenAI style) or audio parts in delta.content
const b64 = [], text = [], raw = [];
let usage, buf = '';
const take = (line) => {
  if (!line.startsWith('data:')) return;
  const d = line.slice(5).trim();
  if (!d || d === '[DONE]') return;
  raw.push(d);
  let j; try { j = JSON.parse(d); } catch { return; }
  if (j.error) { console.error('model error:', JSON.stringify(j.error)); process.exit(1); }
  if (j.usage) usage = j.usage;
  for (const c of j.choices || []) {
    const m = c.delta || c.message || {};
    if (m.audio?.data) b64.push(m.audio.data);
    if (m.audio?.transcript) text.push(m.audio.transcript);
    if (typeof m.content === 'string') text.push(m.content);
    else for (const p of m.content || []) {
      if (p.type === 'text' && p.text) text.push(p.text);
      const a = p.input_audio || p.audio || p.output_audio;
      if (a?.data) b64.push(a.data);
    }
  }
};
const dec = new TextDecoder();
for await (const chunk of res.body) {
  buf += dec.decode(chunk, { stream: true });
  let i;
  while ((i = buf.indexOf('\n')) >= 0) { take(buf.slice(0, i).trim()); buf = buf.slice(i + 1); }
  process.stdout.write(`\r  ${Math.round((Date.now() - t0) / 1000)}s, ${b64.reduce((n, s) => n + s.length, 0) * 3 >> 12} KB audio`);
}
take(buf.trim());
console.log('');
const stem = out.replace(/\.(mp3|wav)$/i, '');
if (text.length) fs.writeFileSync(stem + '.txt', text.join(''));
if (!b64.length) {
  fs.writeFileSync(stem + '.raw.txt', raw.join('\n'));
  console.error(`no audio in the response; the raw stream is in ${stem}.raw.txt`); process.exit(1);
}
fs.writeFileSync(out, Buffer.from(b64.join(''), 'base64'));
console.log(`wrote ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB) in ${Math.round((Date.now() - t0) / 1000)}s${usage ? ' — usage ' + JSON.stringify(usage) : ''}`);
