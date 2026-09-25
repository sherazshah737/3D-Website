// Converts every .jpg/.png/.webp in public/images/work into a GPU-compressed
// .ktx2 texture (UASTC/ETC1S via Basis) using KTX-Software's `toktx`.
// Install toktx from https://github.com/KhronosGroup/KTX-Software/releases
// then run: npm run textures
// The gallery automatically prefers <img data-ktx2="..."> when present.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/images/work');

if (spawnSync('toktx', ['--version']).status !== 0) {
  console.error('[textures] `toktx` not found. Install KTX-Software first.');
  process.exit(1);
}

for (const file of readdirSync(dir)) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext) || file.includes('-800')) continue;
  const out = resolve(dir, basename(file, ext) + '.ktx2');
  const r = spawnSync('toktx', ['--t2', '--encode', 'etc1s', '--clevel', '4', '--qlevel', '192', '--genmipmap', '--assign_oetf', 'srgb', out, resolve(dir, file)], { stdio: 'inherit' });
  console.log(r.status === 0 ? `[textures] ${basename(out)}` : `[textures] failed: ${file}`);
}
console.log('[textures] done — add data-ktx2="/images/work/<name>.ktx2" to each gallery <img>.');
