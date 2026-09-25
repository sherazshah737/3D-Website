// Generates the placeholder artwork (case-study images, hero poster, OG image,
// touch icon) from SVG. Only needed if you want to regenerate placeholders —
// real projects should simply overwrite the files in public/images.
//   npm i -D sharp && npm run images
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('[images] sharp is not installed. Run: npm i -D sharp');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p) => resolve(root, 'public', p);
mkdirSync(out('images/work'), { recursive: true });

const C = { black: '#0A0C10', steel: '#1B2A3A', gold: '#F2A93B', ember: '#FF6B2C', silver: '#C9D1DB' };
const W = 1600, H = 1100;

const grain = `
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
  <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0"/></filter>`;

const frame = (inner, { heat = 0.5, hue = C.gold, bgA = C.steel, bgB = C.black } = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="heat" cx=".78" cy=".85" r=".7">
      <stop offset="0" stop-color="${hue}" stop-opacity="${0.55 * heat}"/>
      <stop offset=".5" stop-color="${C.ember}" stop-opacity="${0.18 * heat}"/>
      <stop offset="1" stop-color="${C.black}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2A3B4E"/><stop offset="1" stop-color="#141D28"/>
    </linearGradient>
    <linearGradient id="hot" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.gold}"/>
    </linearGradient>
    ${grain}
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#heat)"/>
  ${inner}
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;

const bars = (x, y, w, n, gap = 26, o = 0.35) =>
  Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * gap}" width="${w * (0.55 + ((i * 37) % 45) / 100)}" height="10" rx="5" fill="${C.silver}" opacity="${o}"/>`).join('');

// 01 — Fintech web app dashboard
const work1 = frame(`
  <g transform="translate(180 150) rotate(-4 620 400)">
    <rect width="1240" height="800" rx="26" fill="url(#metal)" stroke="${C.silver}" stroke-opacity=".18"/>
    <rect width="1240" height="64" rx="26" fill="#0E151E"/>
    <circle cx="44" cy="32" r="9" fill="${C.ember}"/><circle cx="74" cy="32" r="9" fill="${C.gold}" opacity=".7"/><circle cx="104" cy="32" r="9" fill="${C.silver}" opacity=".35"/>
    <rect x="160" y="20" width="520" height="24" rx="12" fill="${C.silver}" opacity=".08"/>
    <rect x="36" y="100" width="220" height="660" rx="16" fill="#0E151E" opacity=".8"/>
    ${bars(64, 140, 150, 12, 44, 0.25)}
    <rect x="290" y="100" width="560" height="340" rx="16" fill="#0E151E" opacity=".8"/>
    <polyline fill="none" stroke="url(#hot)" stroke-width="6" stroke-linejoin="round" points="320,380 390,340 450,360 520,280 590,300 660,210 730,240 820,150"/>
    <polyline fill="none" stroke="${C.silver}" stroke-opacity=".25" stroke-width="3" points="320,400 390,390 450,370 520,360 590,330 660,320 730,290 820,270"/>
    <rect x="880" y="100" width="324" height="160" rx="16" fill="#0E151E" opacity=".8"/>
    <text x="910" y="170" font-family="Helvetica, Arial, sans-serif" font-size="54" font-weight="700" fill="${C.gold}">$1.28M</text>
    ${bars(910, 205, 200, 2, 24, 0.3)}
    <rect x="880" y="280" width="324" height="160" rx="16" fill="#0E151E" opacity=".8"/>
    <circle cx="960" cy="360" r="46" fill="none" stroke="${C.silver}" stroke-opacity=".15" stroke-width="14"/>
    <circle cx="960" cy="360" r="46" fill="none" stroke="${C.ember}" stroke-width="14" stroke-dasharray="200 290" transform="rotate(-90 960 360)"/>
    ${bars(1030, 330, 140, 3, 26, 0.3)}
    <rect x="290" y="470" width="914" height="290" rx="16" fill="#0E151E" opacity=".8"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="320" y="${505 + i * 42}" width="854" height="1" fill="${C.silver}" opacity=".08"/>${bars(330, 516 + i * 42, 260, 1, 0, 0.3)}<rect x="1050" y="${513 + i * 42}" width="${60 + (i * 23) % 60}" height="14" rx="7" fill="${i % 3 ? C.silver : C.gold}" opacity="${i % 3 ? 0.25 : 0.8}"/>`).join('')}
  </g>`, { heat: 0.9 });

// 02 — Mobile health app
const phone = (x, y, r, accent, content) => `
  <g transform="translate(${x} ${y}) rotate(${r} 190 390)">
    <rect width="380" height="780" rx="58" fill="#0B1118" stroke="${C.silver}" stroke-opacity=".35" stroke-width="4"/>
    <rect x="16" y="16" width="348" height="748" rx="44" fill="url(#metal)"/>
    <rect x="140" y="30" width="100" height="26" rx="13" fill="#0B1118"/>
    ${content(accent)}
  </g>`;
const ring = (a) => `
    <circle cx="190" cy="270" r="110" fill="none" stroke="${C.silver}" stroke-opacity=".12" stroke-width="22"/>
    <circle cx="190" cy="270" r="110" fill="none" stroke="${a}" stroke-width="22" stroke-linecap="round" stroke-dasharray="520 700" transform="rotate(-90 190 270)"/>
    <circle cx="190" cy="270" r="72" fill="none" stroke="${C.silver}" stroke-opacity=".12" stroke-width="18"/>
    <circle cx="190" cy="270" r="72" fill="none" stroke="${C.silver}" stroke-opacity=".6" stroke-width="18" stroke-linecap="round" stroke-dasharray="300 460" transform="rotate(-90 190 270)"/>
    <text x="190" y="287" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="${C.silver}">82</text>
    ${bars(50, 450, 240, 3, 34, 0.3)}
    <rect x="44" y="580" width="292" height="120" rx="24" fill="#0B1118" opacity=".7"/>
    <polyline fill="none" stroke="${a}" stroke-width="5" points="70,660 110,640 150,650 190,610 230,630 270,600 310,615"/>`;
const list = (a) => `
    ${Array.from({ length: 6 }, (_, i) => `<rect x="36" y="${110 + i * 104}" width="308" height="84" rx="20" fill="#0B1118" opacity=".7"/><circle cx="80" cy="${152 + i * 104}" r="22" fill="${i === 1 ? a : C.silver}" opacity="${i === 1 ? 1 : 0.2}"/>${bars(120, 138 + i * 104, 170, 2, 24, 0.3)}`).join('')}`;
const work2 = frame(`
  ${phone(360, 170, -8, C.gold, ring)}
  ${phone(860, 130, 6, C.ember, list)}`, { heat: 0.7, bgA: '#172433' });

// 03 — Logistics MVP (map + route)
const work3 = frame(`
  <g opacity=".22" stroke="${C.silver}" stroke-width="2" fill="none">
    ${Array.from({ length: 14 }, (_, i) => `<path d="M-50 ${120 + i * 70} C 400 ${60 + i * 80}, 900 ${200 + i * 60}, 1700 ${90 + i * 72}"/>`).join('')}
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${100 + i * 160} -50 C ${60 + i * 150} 400, ${220 + i * 160} 700, ${120 + i * 158} 1200"/>`).join('')}
  </g>
  <path d="M260 860 C 420 700, 520 760, 640 560 S 980 420, 1080 300 S 1300 220, 1380 180" fill="none" stroke="url(#hot)" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 0"/>
  ${[[260, 860], [640, 560], [1080, 300], [1380, 180]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 3 ? 26 : 16}" fill="${i === 3 ? C.gold : C.black}" stroke="${C.gold}" stroke-width="6"/>`).join('')}
  <g transform="translate(120 120)">
    <rect width="480" height="250" rx="24" fill="#0E151E" opacity=".92" stroke="${C.silver}" stroke-opacity=".15"/>
    <text x="36" y="80" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="${C.silver}">Route 14 · 3 stops</text>
    <rect x="36" y="112" width="408" height="12" rx="6" fill="${C.silver}" opacity=".12"/>
    <rect x="36" y="112" width="290" height="12" rx="6" fill="url(#hot)"/>
    ${bars(36, 160, 300, 2, 30, 0.3)}
  </g>`, { heat: 0.45, bgA: '#15212E' });

// 04 — Custom software (ops / kanban)
const work4 = frame(`
  <g transform="translate(140 150)">
    ${[0, 1, 2, 3].map((c) => `
      <g transform="translate(${c * 335} 0)">
        <rect width="305" height="800" rx="22" fill="#0E151E" opacity=".75"/>
        <rect x="24" y="28" width="${120 + c * 20}" height="14" rx="7" fill="${C.silver}" opacity=".5"/>
        ${Array.from({ length: 4 - (c % 2) }, (_, i) => `
          <rect x="20" y="${76 + i * 172}" width="265" height="152" rx="16" fill="url(#metal)" stroke="${c === 2 && i === 0 ? C.gold : C.silver}" stroke-opacity="${c === 2 && i === 0 ? 1 : 0.12}" stroke-width="${c === 2 && i === 0 ? 3 : 1}"/>
          ${bars(44, 104 + i * 172, 190, 3, 26, 0.3)}
          <circle cx="250" cy="${196 + i * 172}" r="14" fill="${(c + i) % 3 ? C.silver : C.ember}" opacity="${(c + i) % 3 ? 0.25 : 0.9}"/>`).join('')}
      </g>`).join('')}
  </g>`, { heat: 0.2, bgA: '#1B2A3A', bgB: '#0C1219' });

const works = [
  ['ledgerline', work1],
  ['tidepool', work2],
  ['fieldkit', work3],
  ['anvil-ops', work4],
];
for (const [name, svg] of works) {
  const img = sharp(Buffer.from(svg));
  await img.clone().webp({ quality: 72 }).toFile(out(`images/work/${name}.webp`));
  await img.clone().resize(800).webp({ quality: 70 }).toFile(out(`images/work/${name}-800.webp`));
  await img.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(out(`images/work/${name}.jpg`));
}

// Hero poster (static fallback for reduced motion / no-WebGL devices)
const poster = (w, h, cx, cy) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="g" cx="${cx}" cy="${cy}" r=".55">
      <stop offset="0" stop-color="#FFF4DC"/><stop offset=".05" stop-color="${C.gold}"/>
      <stop offset=".16" stop-color="${C.ember}" stop-opacity=".75"/><stop offset=".45" stop-color="#3A1A0C" stop-opacity=".45"/>
      <stop offset="1" stop-color="${C.black}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="s" cx=".2" cy="1" r="1"><stop offset="0" stop-color="${C.steel}" stop-opacity=".7"/><stop offset="1" stop-color="${C.black}" stop-opacity="0"/></radialGradient>
    ${grain}
  </defs>
  <rect width="100%" height="100%" fill="${C.black}"/>
  <rect width="100%" height="100%" fill="url(#s)"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  ${Array.from({ length: 140 }, (_, i) => {
    const a = i * 2.39996, r = 60 + ((i * 97) % 520);
    const x = w * cx + Math.cos(a) * r * 1.3, y = h * cy + Math.sin(a) * r - ((i * 13) % 90);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1 + (i % 4) * 0.7).toFixed(1)}" fill="${i % 5 ? C.gold : '#FFE7B8'}" opacity="${(0.25 + ((i * 7) % 60) / 100).toFixed(2)}"/>`;
  }).join('')}
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
await sharp(Buffer.from(poster(1920, 1080, 0.7, 0.5))).webp({ quality: 70 }).toFile(out('images/hero-poster.webp'));
await sharp(Buffer.from(poster(900, 1600, 0.5, 0.38))).webp({ quality: 70 }).toFile(out('images/hero-poster-mobile.webp'));

// Open Graph image
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <radialGradient id="g" cx=".82" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4DC"/><stop offset=".06" stop-color="${C.gold}"/><stop offset=".2" stop-color="${C.ember}" stop-opacity=".6"/><stop offset="1" stop-color="${C.black}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="${C.black}"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="80" y="120" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="${C.gold}" letter-spacing="2">DEVFORC</text>
  <text x="80" y="330" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="${C.silver}">Ideas go in.</text>
  <text x="80" y="440" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="${C.silver}">Software comes out.</text>
  <text x="80" y="540" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#8C97A4">Web apps · Mobile apps · MVPs · Custom software</text>
</svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 82, mozjpeg: true }).toFile(out('images/og-image.jpg'));

// Icons
const icon = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">
  <defs><radialGradient id="e" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#FFF4DC"/><stop offset=".3" stop-color="${C.gold}"/><stop offset=".75" stop-color="${C.ember}"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient></defs>
  <rect width="64" height="64" rx="14" fill="${C.black}"/><circle cx="32" cy="34" r="17" fill="url(#e)"/></svg>`;
writeFileSync(out('favicon.svg'), icon(64));
await sharp(Buffer.from(icon(180))).png().toFile(out('apple-touch-icon.png'));
await sharp(Buffer.from(icon(512))).png().toFile(out('icon-512.png'));
console.log('[images] placeholders written to public/images');
