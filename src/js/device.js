// Device / GPU tier detection.
//   0 — no 3D: video (or static poster when reduced motion / save-data)
//   1 — low: phones, weak iGPUs → few particles, low DPR
//   2 — mid: typical laptops
//   3 — high: desktop-class GPUs
// Override for testing with ?tier=0..3

const mm = (q) => window.matchMedia(q).matches;

function probeWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { renderer: String(renderer || ''), maxTex };
  } catch {
    return null;
  }
}

function detect() {
  const reducedMotion = mm('(prefers-reduced-motion: reduce)');
  const coarse = mm('(pointer: coarse)');
  const hover = mm('(hover: hover) and (pointer: fine)');
  const conn = navigator.connection || {};
  const saveData = Boolean(conn.saveData) || /(^|-)2g$/.test(conn.effectiveType || '');
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const small = Math.min(screen.width, screen.height) < 700;
  const mobile = coarse && small;

  const override = new URLSearchParams(location.search).get('tier');
  let tier;
  let gpu = '';

  if (override !== null && /^[0-3]$/.test(override)) {
    tier = Number(override);
  } else if (reducedMotion || saveData) {
    tier = 0;
  } else {
    const probe = probeWebGL();
    gpu = probe?.renderer || '';
    if (!probe || /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(gpu)) tier = 0;
    else if (memory <= 2 || cores <= 2) tier = 0;
    else if (mobile || /mali-[4t][0-9]|adreno \(tm\) [2-5]\d\d|powervr|intel.*hd graphics [2-5]\d{2,3}/i.test(gpu) || cores <= 4 || memory <= 4) tier = 1;
    else if (/nvidia|geforce|rtx|radeon rx|apple m[2-9]|apple gpu/i.test(gpu) && cores >= 8) tier = 3;
    else tier = 2;
  }

  const settings = [
    { heroParticles: 0, forgeParticles: 0, dpr: 1 },
    { heroParticles: 1400, forgeParticles: 5000, dpr: 1.25 },
    { heroParticles: 4200, forgeParticles: 12000, dpr: 1.5 },
    { heroParticles: 8000, forgeParticles: 22000, dpr: 2 },
  ][tier];

  return {
    tier,
    gpu,
    reducedMotion,
    saveData,
    hover,
    coarse,
    mobile,
    webgl: tier > 0,
    ...settings,
    dpr: Math.min(window.devicePixelRatio || 1, settings.dpr),
  };
}

export const device = detect();
document.documentElement.dataset.tier = String(device.tier);
