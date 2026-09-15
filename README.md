# HISTORIA MEZE GRILL — High Wycombe

A cinematic, scroll-driven website for Historia Meze Grill, a Mediterranean
charcoal grill in High Wycombe, UK. Built around the restaurant's own promo
video, with a full-bleed hero, restrained story copy, a two-column Meze /
Grill menu, a private dining section, and a hours + map + reservation form.

## Visuals

The hero and private dining sections use the restaurant's real promo video
(`public/video/historia-promo.mp4`) rather than generated footage. The
brief called for true scroll-scrubbing through separate clips (via Seedance
2.0 / Higgsfield MCP), but only one real clip was supplied and no video
tooling (ffmpeg) was available in this environment to extract a frame
sequence from it. Instead, `src/main.js` drives a scroll-tied parallax
(the hero video scales and drifts, the title fades and lifts) — a
lightweight scroll-scrub stand-in with no extra dependencies.

## Placeholder business details

Address, phone, hours, and menu items/prices are realistic placeholders
(see `index.html`) — swap them for the real details before launch.

## Run it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173/` URL.

## Structure

- `index.html` — hero, story, menu, private dining, hours/map/reserve, footer
- `src/style.css` — design tokens, layout, film grain, responsive rules
- `src/main.js` — nav state, hero parallax, scroll reveals, reservation form
- `public/video/historia-promo.mp4` — the restaurant's promo video
