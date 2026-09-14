// Frame-sequence metadata for the real AI-generated descent footage.
// Each scene was extracted at 10fps from a 10s clip (100 frames) and
// packed into 5x4 sprite sheets (20 frames/sheet, 5 sheets/scene).

const COLS = 5;
const ROWS = 4;
const TILE_W = 640;
const TILE_H = 360;
const FRAMES_PER_SHEET = COLS * ROWS;
const FRAME_COUNT = 100;
const SHEET_COUNT = 5;

export const SCENES = ['surface', 'sunlit', 'twilight', 'midnight', 'floor'].map((id) => ({
  id,
  frameCount: FRAME_COUNT,
  cols: COLS,
  rows: ROWS,
  tileW: TILE_W,
  tileH: TILE_H,
  sheetUrls: Array.from(
    { length: SHEET_COUNT },
    (_, i) => `frames/${id}/sheet_${String(i + 1).padStart(2, '0')}.jpg`
  ),
}));

export function frameLocation(scene, frameIndex) {
  const clamped = Math.max(0, Math.min(scene.frameCount - 1, frameIndex));
  const sheetIndex = Math.floor(clamped / FRAMES_PER_SHEET);
  const indexInSheet = clamped % FRAMES_PER_SHEET;
  const col = indexInSheet % scene.cols;
  const row = Math.floor(indexInSheet / scene.cols);
  return { sheetIndex, sx: col * scene.tileW, sy: row * scene.tileH };
}
