import { SCENES, frameLocation } from './frames.js';

// Renders the real AI-generated descent footage as a scroll-scrubbed
// canvas frame sequence: one <canvas>, sprite-sheet sourced tiles drawn
// with a cover-fit crop, cross-dissolving briefly at each zone boundary
// since the five clips were generated independently (not frame-chained)
// and don't join pixel-for-pixel.

const TRANSITION = 0.07; // fraction of a zone's pin range used for the cross-dissolve

export function buildFrameSequence(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = window.innerWidth;
  let height = window.innerHeight;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }
  resize();
  window.addEventListener('resize', resize);

  // Preload every sheet for every scene up front — the whole set is a
  // manageable ~11MB, small enough to eager-load rather than juggle
  // per-scene lazy loading.
  const sheetImages = SCENES.map((scene) =>
    scene.sheetUrls.map((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      return img;
    })
  );

  let firstFrameReady = false;
  const readyCallbacks = [];
  sheetImages[0][0].addEventListener('load', () => {
    firstFrameReady = true;
    readyCallbacks.forEach((cb) => cb());
  });

  function onFirstFrameReady(cb) {
    if (firstFrameReady) cb();
    else readyCallbacks.push(cb);
  }

  function drawTile(sceneIndex, frameIndex, alpha) {
    const scene = SCENES[sceneIndex];
    const { sheetIndex, sx, sy } = frameLocation(scene, frameIndex);
    const img = sheetImages[sceneIndex][sheetIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const scale = Math.max((width * dpr) / scene.tileW, (height * dpr) / scene.tileH);
    const drawW = scene.tileW * scale;
    const drawH = scene.tileH * scale;
    const dx = (width * dpr - drawW) / 2;
    const dy = (height * dpr - drawH) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, sx, sy, scene.tileW, scene.tileH, dx, dy, drawW, drawH);
    ctx.globalAlpha = 1;
  }

  function update({ zoneIndex, zoneT }) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scene = SCENES[zoneIndex];
    const frameIndex = Math.round(zoneT * (scene.frameCount - 1));
    drawTile(zoneIndex, frameIndex, 1);

    // Cross-dissolve in the previous scene's final frame at the start of
    // this zone's pin range, masking the jump cut between clips.
    if (zoneIndex > 0 && zoneT < TRANSITION) {
      const fadeAlpha = 1 - zoneT / TRANSITION;
      drawTile(zoneIndex - 1, SCENES[zoneIndex - 1].frameCount - 1, fadeAlpha);
    }
  }

  return { update, onFirstFrameReady };
}
