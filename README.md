# DevForc — The Forge

Single-page site for **DevForc** (devforc.com), a software development agency.

**Concept:** raw ideas go in, finished software comes out. Heat means building and cooling means shipping. The whole page cools as you scroll. A thermometer on the right edge drops from 1,538 °C (the melting point of iron) to room temperature, the ambient light moves from ember to steel, and the footer ember dies out.

| Section | What happens |
| --- | --- |
| 01 Hero | A molten ember in Three.js. Sparks leave it, rise and cool, and every particle leans toward the cursor. On load the ember ignites and the headline letters arrive white-hot, glow gold and cool to silver. This is the page's one orchestrated moment. |
| 02 The Forge | A pinned four-stage sequence (Idea → Design → Build → Launch). One body of metal particles is struck from a sphere into a wireframe, then UI panels, then a phone, cooling from gold to steel blue. A live temperature readout tracks it. |
| 03 Services | Four editorial rows, each with its own layout. Each has a real-time 3D metal object (globe, phone slab, ingot stack, torus knot) that heats and turns on hover. |
| 04 Selected work | A pinned horizontal gallery of four case studies with WebGL heat-haze distortion on hover (ripple, magnification, chromatic shift and ember glow under the cursor). |
| 05 Why DevForc | Three statements whose key phrase runs hot as it crosses the middle of the screen. |
| 06 Stack | A slow, seamless marquee that pauses on hover. |
| 07 Testimonials | One quote at a time in large type, changed with buttons or the arrow keys. |
| 08 Contact | A validated form (name, email, project type, budget, message) and a *Book a call* button. |
| Footer | The ember cools to nothing as the page ends. |

## Tech

- **Vite** and vanilla HTML/CSS/JS
- **Three.js r186**: custom GLSL shaders, and one shared "DOM views" renderer that uses scissor rendering so the services and gallery need only one extra WebGL context
- **GSAP + ScrollTrigger** for pinning and scrubbing, and **Lenis** for smooth scrolling (on the same ticker, so WebGL and DOM stay in sync)
- **Clash Display** (Fontshare) and **Inter Tight** (Google Fonts), loaded without blocking rendering, with metric-matched system fallbacks

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

Node 18+ is required.

To test device tiers, add `?tier=0` (video fallback, no 3D), `?tier=1` (phone), `?tier=2` or `?tier=3` to the URL.

## Folder structure

```
index.html                 semantic markup, SEO, Open Graph, schema.org Organization
public/
  images/work/*.webp       case-study images (+ -800 variants for srcset)
  images/hero-poster*.webp static hero fallback (reduced motion / Save-Data)
  images/og-image.jpg      social share image (1200×630)
  video/                   put hero-loop.mp4 / hero-loop.webm here
  contact.php              optional form handler for cPanel
  .htaccess                caching/compression for Apache (cPanel)
  robots.txt, sitemap.xml, site.webmanifest, favicon.svg, icons
src/
  js/main.js               boot order, lazy-loading of every 3D scene
  js/config.js             ← hero video sources, form provider, contact email
  js/device.js             GPU/device tier detection
  js/scroll.js             Lenis + ScrollTrigger + accessible anchor links
  js/intro.js              page-load sequence
  js/sections.js           forge pin, horizontal gallery, why, quotes, footer, thermometer
  js/interactions.js       custom cursor, magnetic buttons
  js/form.js               validation + delivery
  js/split.js              accessible split text
  js/hero-fallback.js      video / poster path for low-power devices
  three/hero.js            ember + sparks
  three/forge.js           four-shape morphing particle object
  three/views.js           service objects + gallery distortion (one shared renderer)
  three/loaders.js         KTX2 + Draco loaders (lazy)
  three/glsl.js            shared noise + heat colour ramp
  styles/                  base (tokens, reset, a11y), components, sections
scripts/
  fetch-video.mjs          download + transcode the hero video
  generate-placeholders.mjs regenerate the placeholder artwork
  compress-textures.mjs    turn gallery images into KTX2
netlify.toml, vercel.json  deploy config
```

## Replacing placeholder content

### Case-study images (Selected work)
1. Export each image at **1600 × 1100 px** (16:11) as WebP, plus an 800 px-wide copy. For example `acme.webp` and `acme-800.webp` in `public/images/work/`.
2. In `index.html`, find the `SELECTED WORK` block and update each `<li class="case">`: the `src`, the `srcset`, the **`alt` text** (describe what the image shows), and the title, description and year.
3. Point each `case__link` `href` at the real case study when you have one.

The WebGL distortion picks up whatever image the `<img>` loads, so it needs no extra setup. Other aspect ratios work because the shader cover-fits the image, but 16:11 matches the frame.

**Optional GPU-compressed textures:** install [KTX-Software](https://github.com/KhronosGroup/KTX-Software/releases) (`toktx`), put JPG/PNG masters in `public/images/work/`, run `npm run textures`, then add `data-ktx2="/images/work/acme.ktx2"` to the `<img>`. The gallery prefers the KTX2 version and falls back to the WebP. The Basis transcoder is only downloaded when a `.ktx2` file is actually used.

### Hero video (low-power fallback)
Devices without a capable GPU (no WebGL2, software rendering, 2 GB RAM or less) get a looping video instead of the 3D ember. By default it streams the DevForc clip from its CDN URL, set in `src/js/config.js`.

To self-host it (faster, and no third-party dependency):

```bash
npm run fetch:video               # the default clip
npm run fetch:video -- <url>      # or your own clip
```

This saves `public/video/hero-loop.mp4`. If `ffmpeg` is installed it also writes a smaller `hero-loop.webm` and a matching `public/images/hero-poster.webp`. The `config.js` source list already tries `/video/hero-loop.webm` and `/video/hero-loop.mp4` first. Once they exist you can delete the remote URL from that list.

To use a different clip manually, drop `hero-loop.webm` and/or `hero-loop.mp4` (silent, about 1280 px wide, a few MB at most) into `public/video/`.

Visitors with `prefers-reduced-motion` or Save-Data enabled get the static poster (`public/images/hero-poster*.webp`) and no video.

### Testimonials
The three quotes in `index.html` (section `07`) are **placeholders**. Replace them with real, attributable quotes before launch.

### Contact details and links
- Email: `hello@devforc.com` appears in `index.html` (schema, mailto link) and `src/js/config.js`.
- Book a call: change the `href` of the `data-booking` link (default `https://cal.com/devforc/intro`) to your Cal.com or Calendly link.
- Social links: LinkedIn and GitHub URLs are in the footer and in the JSON-LD `sameAs` list.
- Domain: `https://devforc.com/` appears in the canonical, `og:url`, `og:image`, JSON-LD, `robots.txt` and `sitemap.xml`.

### Regenerating the placeholder art
```bash
npm i -D sharp && npm run images
```

## Contact form

Set `formProvider` in `src/js/config.js`:

| Value | Where it works | Setup |
| --- | --- | --- |
| `'mailto'` (default) | anywhere | Opens the visitor's email app with the enquiry filled in. No backend needed. |
| `'netlify'` | Netlify | The form already has `data-netlify="true"` and a honeypot. Enable form detection in the Netlify dashboard. |
| `'endpoint'` | Vercel, any host | Create a form at Formspree, Getform or similar, or use your own API, and set `formEndpoint` to its URL. |
| `'php'` | cPanel / shared hosting | Uses `public/contact.php`. Set `$TO` and `$FROM` in that file (`$FROM` must be an address on your domain). Needs PHP 7.4+. |

If sending fails, the visitor sees a message with a pre-filled email link, so no enquiry is lost.

## Deploy

Build first: `npm run build`. The site is fully static; the output is in `dist/`.

**Vercel:** import the repo. `vercel.json` sets the build command, the `dist` output and cache headers. Use `formProvider: 'endpoint'` or `'mailto'`.

**Netlify:** import the repo. `netlify.toml` sets `npm run build` → `dist`. Set `formProvider: 'netlify'` to use Netlify Forms.

**cPanel:**
1. Run `npm run build` locally.
2. Upload the **contents** of `dist/` (including the hidden `.htaccess`) to `public_html/` using File Manager or FTP.
3. Optionally set `formProvider: 'php'` before building, and edit the addresses in `contact.php`.

The site assumes it is served from the domain root. To serve it from a subfolder, set `base` in `vite.config.js` and update the absolute `/images/…` and `/video/…` paths.

## Performance, accessibility and fallbacks

- **Device tiers** (`src/js/device.js`) take into account WebGL2 support, the GPU renderer string (software renderers count as tier 0), core count, device memory, touch plus small screen, Save-Data and reduced motion. The tier sets particle counts (hero 1.4k–8k, forge 5k–22k), the pixel-ratio cap and antialiasing.
- **Nothing 3D is on the critical path.** Three.js (about 147 KB gzipped) loads only after the `load` event plus an idle slot. The forge and views scenes load when their section comes within about one viewport. Every render loop stops while its section is off-screen.
- **Procedural geometry:** every 3D object is generated in code, so there are no model downloads. `src/three/loaders.js` has Draco (`loadModel()`) and KTX2 loaders ready for when you add a real `.glb` or compressed textures.
- **Reduced motion:** no Lenis, no pinning, no WebGL, no marquee movement and no custom cursor. You get the static poster, all four forge stages with illustrations, a native-scroll gallery and fully readable content.
- **Accessibility:** semantic landmarks, a skip link, a visible gold `:focus-visible` ring, keyboard-reachable gallery cards (tabbing to an off-screen card scrolls to it), labelled form fields with live error messages, split text exposed through `aria-label`, and decorative canvases marked `aria-hidden`. Every animated colour state keeps AA contrast.
- **Responsive:** tested from 360 px up. The pinned forge collapses to a single expanding step on phones, and the gallery becomes a swipeable scroll-snap row below 769 px.

Local Lighthouse runs on the production build (headless Chromium, no GPU): **mobile 96 / 100 / 96 / 100** and **desktop 100 / 100 / 96 / 100** (Performance / Accessibility / Best practices / SEO). The Best-practices deductions in that run came from the sandbox blocking the font CDNs.
