// Single source of truth for the descent: depth breakpoints (meters) and the
// color grade at each stop. Depth range 0m -> 3,800m (a plausible hydrothermal
// vent field depth on a mid-ocean ridge).

export const MAX_DEPTH = 3800;

// World units per meter of depth. Keeps the whole descent inside a
// manageable Three.js scene scale while still reading as a huge drop.
export const DEPTH_SCALE = 1 / 20;

export function depthToWorldY(depth) {
  return -depth * DEPTH_SCALE;
}

export const ZONES = [
  {
    id: 'surface',
    label: 'SURFACE',
    depthStart: 0,
    depthEnd: 40,
    fogNear: 0x9fe0ff,
  },
  {
    id: 'sunlit',
    label: 'SUNLIT ZONE',
    depthStart: 40,
    depthEnd: 200,
    fogNear: 0x1f8fd0,
  },
  {
    id: 'twilight',
    label: 'TWILIGHT ZONE',
    depthStart: 200,
    depthEnd: 1000,
    fogNear: 0x0a3352,
  },
  {
    id: 'midnight',
    label: 'MIDNIGHT ZONE',
    depthStart: 1000,
    depthEnd: 3000,
    fogNear: 0x00060c,
  },
  {
    id: 'floor',
    label: 'THE FLOOR',
    depthStart: 3000,
    depthEnd: 3800,
    fogNear: 0x000000,
  },
];

// Gradient stops used to color-grade fog / background / lighting continuously
// by depth (not just per-zone) so the transition always reads as one
// unbroken descent.
const COLOR_STOPS = [
  { depth: 0, color: 0xcdeeff },
  { depth: 40, color: 0x6cc7ee },
  { depth: 120, color: 0x2f95cf },
  { depth: 200, color: 0x136b9e },
  { depth: 400, color: 0x0a4d78 },
  { depth: 1000, color: 0x051f36 },
  { depth: 2000, color: 0x02090f },
  { depth: 3000, color: 0x000203 },
  { depth: 3800, color: 0x000000 },
];

export function depthToColorHex(depth) {
  const stops = COLOR_STOPS;
  if (depth <= stops[0].depth) return stops[0].color;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (depth >= a.depth && depth <= b.depth) {
      const t = (depth - a.depth) / (b.depth - a.depth);
      return lerpColor(a.color, b.color, t);
    }
  }
  return stops[stops.length - 1].color;
}

function lerpColor(hexA, hexB, t) {
  const ar = (hexA >> 16) & 255, ag = (hexA >> 8) & 255, ab = hexA & 255;
  const br = (hexB >> 16) & 255, bg = (hexB >> 8) & 255, bb = hexB & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | b;
}

export function getZoneAt(depth) {
  for (let i = 0; i < ZONES.length; i++) {
    if (depth >= ZONES[i].depthStart && depth <= ZONES[i].depthEnd) {
      return { index: i, zone: ZONES[i], t: (depth - ZONES[i].depthStart) / (ZONES[i].depthEnd - ZONES[i].depthStart) };
    }
  }
  if (depth < 0) return { index: 0, zone: ZONES[0], t: 0 };
  return { index: ZONES.length - 1, zone: ZONES[ZONES.length - 1], t: 1 };
}
