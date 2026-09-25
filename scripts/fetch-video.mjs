// Downloads the hero fallback video into public/video/hero-loop.mp4 and, if
// ffmpeg is installed, also produces a smaller hero-loop.webm and a poster.
//   npm run fetch:video               -> uses the default DevForc clip
//   npm run fetch:video -- <url>      -> uses your own clip
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DEFAULT_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_051048_5ef213b5-26db-4da8-b604-7ef823760b6b.mp4';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/video');
const url = process.argv[2] || DEFAULT_URL;
mkdirSync(dir, { recursive: true });

const raw = resolve(dir, 'hero-source.mp4');
console.log(`[fetch-video] downloading ${url}`);
const res = await fetch(url);
if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
await pipeline(Readable.fromWeb(res.body), createWriteStream(raw));

const ffmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
if (!ffmpeg) {
  const { renameSync } = await import('node:fs');
  renameSync(raw, resolve(dir, 'hero-loop.mp4'));
  console.log('[fetch-video] saved public/video/hero-loop.mp4 (ffmpeg not found — skipped webm + poster)');
  process.exit(0);
}

const run = (args) => {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '));
};
// Silent, 1280px wide, web-optimised loops. No audio track = autoplay-safe.
run(['-i', raw, '-an', '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(dir, 'hero-loop.mp4')]);
run(['-i', raw, '-an', '-vf', 'scale=1280:-2', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', resolve(dir, 'hero-loop.webm')]);
run(['-i', raw, '-vf', 'scale=1600:-2', '-frames:v', '1', '-q:v', '70', resolve(root, 'public/images/hero-poster.webp')]);
const { rmSync } = await import('node:fs');
rmSync(raw);
console.log('[fetch-video] wrote hero-loop.mp4, hero-loop.webm and images/hero-poster.webp');
if (!existsSync(resolve(dir, 'hero-loop.webm'))) console.warn('webm missing');
