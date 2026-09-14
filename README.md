# ABYSSAL — Descend to the Floor of the Ocean

A cinematic, scroll-driven website for ABYSSAL, a fictional deep-sea
expedition company that takes eight civilians a year to the ocean floor
aboard its submersible, the **EREBUS**. Scrolling down *is* diving down:
the depth runs 0 m → 3,800 m across five ocean zones, with a live HUD
depth meter, per-zone facts, spec callouts, pricing, and a "Join the
Manifest" CTA.

## Visuals: procedural 3D, not pre-rendered video

The original brief called for five Seedance 2.0 clips (via the Higgsfield
MCP) stitched into a frame-sequence scrub. That MCP server was not
available in the build environment, so the descent is instead a real-time
**Three.js / WebGL** scene: a procedurally built EREBUS model (black hull,
glowing cyan viewport ring, twin floodlights) descends through five
shader/particle-driven zones — sunlit god rays and a whale silhouette,
twilight jellyfish with flickering floodlights, a midnight bioluminescent
starfield, and a hydrothermal vent field on the floor. Because it's one
continuous scene driven directly by scroll position (not five joined
clips), the descent is seamless by construction.

## Run it

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173/` URL and scroll.

## Structure

- `src/main.js` — scroll → depth mapping, camera follow, HUD, reveals
- `src/scene/submersible.js` — the EREBUS model + floodlight/viewport behavior
- `src/scene/ocean.js` — fog/color grading, particles, god rays, whale,
  jellyfish, bioluminescence, sea floor + hydrothermal vents
- `src/scene/zones.js` — single source of truth for depth breakpoints,
  zone labels, and the depth → color gradient
- `src/scene/textures.js` — runtime-generated glow/ray textures (no image
  assets, no network dependency)
- `src/style.css` — HUD, pinned sections, responsive layout
- `index.html` — page structure: hero, per-zone fact cards, spec
  callouts, pricing, manifest CTA
