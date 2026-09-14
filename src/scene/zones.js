// Single source of truth for the descent: depth breakpoints (meters) and
// zone labels. Depth range 0m -> 3,800m (a plausible hydrothermal vent
// field depth on a mid-ocean ridge). Each zone here corresponds 1:1 to a
// pinned .zone-section in index.html and a footage scene in frames.js.

export const MAX_DEPTH = 3800;

export const ZONES = [
  { id: 'surface', label: 'SURFACE', depthStart: 0, depthEnd: 40 },
  { id: 'sunlit', label: 'SUNLIT ZONE', depthStart: 40, depthEnd: 200 },
  { id: 'twilight', label: 'TWILIGHT ZONE', depthStart: 200, depthEnd: 1000 },
  { id: 'midnight', label: 'MIDNIGHT ZONE', depthStart: 1000, depthEnd: 3000 },
  { id: 'floor', label: 'THE FLOOR', depthStart: 3000, depthEnd: 3800 },
];
