import * as THREE from 'three';
import { buildErebus } from './scene/submersible.js';
import { buildOcean } from './scene/ocean.js';
import { ZONES, MAX_DEPTH, depthToWorldY } from './scene/zones.js';

// ---------------------------------------------------------------------------
// Renderer / scene / camera
// ---------------------------------------------------------------------------
const canvasHost = document.getElementById('bg-canvas');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
canvasHost.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 6, 16);

const erebus = buildErebus();
scene.add(erebus.group);

const ocean = buildOcean(scene);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  measureSections();
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
      return { depth: THREE.MathUtils.lerp(s.depthStart, s.depthEnd, t), zoneIndex: i, zoneT: t };
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
    const p = pinEnd > pinStart ? THREE.MathUtils.clamp((scrollY - pinStart) / (pinEnd - pinStart), 0, 1) : 0;
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
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  const { depth, zoneIndex, zoneT } = computeDepth();
  const subY = depthToWorldY(depth);

  erebus.group.position.y = subY;
  erebus.group.rotation.x = -0.08 - 0.22 * Math.min(1, depth / MAX_DEPTH);
  erebus.update({ elapsed, zoneIndex, zoneT, depth });
  ocean.update({ elapsed, depth, zoneIndex, zoneT, subY });

  const overall = Math.min(1, depth / MAX_DEPTH);
  const backOffset = THREE.MathUtils.lerp(15, 8.5, overall);
  const heightOffset = THREE.MathUtils.lerp(6.5, 3, overall);
  const desiredX = erebus.group.position.x * 0.35 + Math.sin(elapsed * 0.35) * 0.5;

  camera.position.x += (desiredX - camera.position.x) * Math.min(1, dt * 2.2);
  camera.position.y += (subY + heightOffset - camera.position.y) * Math.min(1, dt * 2.2);
  camera.position.z += (backOffset - camera.position.z) * Math.min(1, dt * 2.2);

  const lookY = subY - THREE.MathUtils.lerp(1, 11, overall);
  const lookTarget = new THREE.Vector3(desiredX * 0.6, lookY, -8);
  camera.lookAt(lookTarget);

  renderer.render(scene, camera);
  updateHUD(depth, zoneIndex, dt);
  updateReveals();
}

animate();
