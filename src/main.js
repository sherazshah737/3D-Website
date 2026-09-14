import { buildFrameSequence } from './frameSequence.js';
import { ZONES, MAX_DEPTH } from './scene/zones.js';

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ---------------------------------------------------------------------------
// Frame-sequence renderer (real AI-generated descent footage)
// ---------------------------------------------------------------------------
const canvas = document.getElementById('bg-canvas');
const frameSeq = buildFrameSequence(canvas);

const loadingEl = document.getElementById('loading');
frameSeq.onFirstFrameReady(() => {
  if (loadingEl) loadingEl.classList.add('hidden');
});

// ---------------------------------------------------------------------------
// Scroll -> depth mapping
// ---------------------------------------------------------------------------
const zoneSectionEls = Array.from(document.querySelectorAll('.zone-section'));
let sectionRects = [];

function measureSections() {
  sectionRects = zoneSectionEls.map((el) => {
    const top = el.offsetTop;
    const height = el.offsetHeight;
    return {
      el,
      top,
      height,
      depthStart: parseFloat(el.dataset.depthStart),
      depthEnd: parseFloat(el.dataset.depthEnd),
      reveal: el.querySelector('.reveal'),
    };
  });
}
measureSections();
window.addEventListener('load', measureSections);
window.addEventListener('resize', measureSections);

function computeDepth() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  let result = { depth: 0, zoneIndex: 0, zoneT: 0 };
  for (let i = 0; i < sectionRects.length; i++) {
    const s = sectionRects[i];
    const pinStart = s.top;
    const pinEnd = s.top + s.height - vh;
    if (scrollY < pinStart) break;
    if (scrollY <= pinEnd) {
      const t = pinEnd > pinStart ? (scrollY - pinStart) / (pinEnd - pinStart) : 1;
      return { depth: lerp(s.depthStart, s.depthEnd, t), zoneIndex: i, zoneT: t };
    }
    result = { depth: s.depthEnd, zoneIndex: i, zoneT: 1 };
  }
  return result;
}

function fadeCurve(p) {
  if (p < 0.12) return Math.max(0, p / 0.12);
  if (p > 0.85) return Math.max(0, 1 - (p - 0.85) / 0.15);
  return 1;
}

function updateReveals() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  for (const s of sectionRects) {
    if (!s.reveal) continue;
    const pinStart = s.top;
    const pinEnd = s.top + s.height - vh;
    const p = pinEnd > pinStart ? clamp((scrollY - pinStart) / (pinEnd - pinStart), 0, 1) : 0;
    const visible = scrollY >= pinStart - vh * 0.5 && scrollY <= pinEnd + vh * 0.5;
    if (!visible) continue;
    const curve = fadeCurve(p);
    s.reveal.style.opacity = curve;
    s.reveal.style.transform = `translateY(${(1 - curve) * 18}px)`;
  }
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
const depthValueEl = document.getElementById('depth-value');
const zoneLabelEl = document.getElementById('zone-label');
const gaugeFillEl = document.getElementById('gauge-fill');
const gaugeMarkerEl = document.getElementById('gauge-marker');
const hudRoot = document.getElementById('hud');
let displayedDepth = 0;

function updateHUD(depth, zoneIndex, dt) {
  displayedDepth += (depth - displayedDepth) * Math.min(1, dt * 6);
  depthValueEl.textContent = Math.round(displayedDepth).toLocaleString();
  const zone = ZONES[zoneIndex];
  if (zoneLabelEl.textContent !== zone.label) zoneLabelEl.textContent = zone.label;
  const pct = Math.min(100, (displayedDepth / MAX_DEPTH) * 100);
  gaugeFillEl.style.height = pct + '%';
  gaugeMarkerEl.style.top = pct + '%';
  hudRoot.dataset.zone = zone.id;
}

// ---------------------------------------------------------------------------
// Reveal-on-scroll for the non-depth sections (specs / pricing / manifest)
// ---------------------------------------------------------------------------
const staticReveal = document.querySelectorAll('.content-section .reveal');
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    }
  },
  { threshold: 0.2 }
);
staticReveal.forEach((el) => io.observe(el));

// ---------------------------------------------------------------------------
// Manifest form (front-end only)
// ---------------------------------------------------------------------------
const manifestForm = document.getElementById('manifest-form');
if (manifestForm) {
  manifestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = document.getElementById('manifest-status');
    const email = document.getElementById('manifest-email').value;
    if (status && email) {
      status.textContent = `LOGGED — ${email} ADDED TO THE 2027 MANIFEST QUEUE.`;
      status.classList.add('active');
      manifestForm.reset();
    }
  });
}

// ---------------------------------------------------------------------------
// Animation loop
// ---------------------------------------------------------------------------
let lastT = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastT) / 1000, 0.1);
  lastT = now;

  const { depth, zoneIndex, zoneT } = computeDepth();

  frameSeq.update({ zoneIndex, zoneT });
  updateHUD(depth, zoneIndex, dt);
  updateReveals();
}

requestAnimationFrame(animate);
