// The Forge: one body of molten metal that is struck into four shapes —
// sphere (idea) → wireframe (design) → UI panels (build) → device (launch) —
// and cools from gold to steel blue as it goes.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  Group,
  IcosahedronGeometry,
  EdgesGeometry,
  Vector3,
  Euler,
  Matrix4,
  AdditiveBlending,
  MathUtils,
} from 'three';
import { simplex3, heatRamp } from './glsl.js';

/* ---------- shape samplers: each returns N points (Float32Array) ---------- */

function sampleSphere(n, r = 1.25) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const rr = r * (0.94 + Math.random() * 0.06);
    out.set([Math.cos(th) * rad * rr, y * rr, Math.sin(th) * rad * rr], i * 3);
  }
  return out;
}

function sampleSegments(n, segs) {
  // segs: flat array [ax,ay,az,bx,by,bz, ...]; points distributed by length
  const lens = [];
  let total = 0;
  for (let i = 0; i < segs.length; i += 6) {
    const l = Math.hypot(segs[i + 3] - segs[i], segs[i + 4] - segs[i + 1], segs[i + 5] - segs[i + 2]);
    lens.push(l);
    total += l;
  }
  const out = new Float32Array(n * 3);
  let k = 0;
  for (let s = 0; s < lens.length && k < n; s++) {
    const cnt = s === lens.length - 1 ? n - k : Math.round((lens[s] / total) * n);
    const o = s * 6;
    for (let j = 0; j < cnt && k < n; j++, k++) {
      const t = Math.random();
      out[k * 3] = segs[o] + (segs[o + 3] - segs[o]) * t;
      out[k * 3 + 1] = segs[o + 1] + (segs[o + 4] - segs[o + 1]) * t;
      out[k * 3 + 2] = segs[o + 2] + (segs[o + 5] - segs[o + 2]) * t;
    }
  }
  for (; k < n; k++) out.set(out.subarray(0, 3), k * 3);
  return out;
}

const rectSegs = (x, y, w, h, z = 0) => [
  x, y, z, x + w, y, z,
  x + w, y, z, x + w, y + h, z,
  x + w, y + h, z, x, y + h, z,
  x, y + h, z, x, y, z,
];

function roundRectSegs(x, y, w, h, r, z, steps = 6) {
  const pts = [];
  const corner = (cx, cy, a0) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  const segs = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    segs.push(a[0], a[1], z, b[0], b[1], z);
  }
  return segs;
}

function fillRect(n, x, y, w, h, z = 0) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(x + Math.random() * w, y + Math.random() * h, z);
  return out;
}

function transform(arr, euler, offset = new Vector3()) {
  const m = new Matrix4().makeRotationFromEuler(euler);
  const v = new Vector3();
  for (let i = 0; i < arr.length; i += 3) {
    v.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(m).add(offset);
    arr[i] = v.x;
    arr[i + 1] = v.y;
    arr[i + 2] = v.z;
  }
  return arr;
}

function merge(n, parts) {
  // parts: [{ weight, make(count) → Float32Array|number[] }]
  const total = parts.reduce((s, p) => s + p.weight, 0);
  const out = new Float32Array(n * 3);
  let k = 0;
  parts.forEach((p, i) => {
    const cnt = i === parts.length - 1 ? n - k : Math.round((p.weight / total) * n);
    const pts = p.make(cnt);
    out.set(pts.slice(0, cnt * 3), k * 3);
    k += cnt;
  });
  return out;
}

function sampleWireframe(n) {
  const edges = new EdgesGeometry(new IcosahedronGeometry(1.45, 1));
  const segs = Array.from(edges.attributes.position.array);
  edges.dispose();
  const verts = [];
  for (let i = 0; i < segs.length; i += 3) verts.push([segs[i], segs[i + 1], segs[i + 2]]);
  return merge(n, [
    { weight: 0.86, make: (c) => sampleSegments(c, segs) },
    {
      weight: 0.14,
      make: (c) => {
        const out = [];
        for (let i = 0; i < c; i++) {
          const v = verts[(Math.random() * verts.length) | 0];
          out.push(v[0] + (Math.random() - 0.5) * 0.05, v[1] + (Math.random() - 0.5) * 0.05, v[2] + (Math.random() - 0.5) * 0.05);
        }
        return out;
      },
    },
  ]);
}

function samplePanels(n) {
  const panel = (c, ox, oy, oz, w, h) =>
    merge(c, [
      { weight: 0.36, make: (k) => sampleSegments(k, roundRectSegs(ox, oy, w, h, 0.08, oz)) },
      { weight: 0.1, make: (k) => sampleSegments(k, [ox, oy + h - 0.24, oz, ox + w, oy + h - 0.24, oz]) },
      { weight: 0.12, make: (k) => fillRect(k, ox + 0.12, oy + h - 0.17, 0.3, 0.06, oz) },
      { weight: 0.2, make: (k) => fillRect(k, ox + 0.14, oy + 0.18, w * 0.38, h * 0.45, oz) },
      {
        weight: 0.22,
        make: (k) => {
          const lines = [];
          for (let i = 0; i < 4; i++) {
            const ly = oy + 0.28 + i * 0.2;
            lines.push(ox + w * 0.52, ly, oz, ox + w * (0.72 + (i % 2) * 0.18), ly, oz);
          }
          return sampleSegments(k, lines);
        },
      },
    ]);
  const arr = merge(n, [
    { weight: 0.3, make: (c) => panel(c, -1.55, -0.2, -0.55, 2.0, 1.35) },
    { weight: 0.4, make: (c) => panel(c, -0.95, -0.75, 0, 2.2, 1.5) },
    { weight: 0.3, make: (c) => panel(c, -0.25, -1.25, 0.55, 1.8, 1.2) },
  ]);
  return transform(arr, new Euler(-0.12, 0.42, 0), new Vector3(0.05, 0.25, 0));
}

function samplePhone(n) {
  const w = 1.25, h = 2.55, r = 0.2;
  const x = -w / 2, y = -h / 2;
  const arr = merge(n, [
    { weight: 0.26, make: (c) => sampleSegments(c, roundRectSegs(x, y, w, h, r, 0.07)) },
    { weight: 0.14, make: (c) => sampleSegments(c, roundRectSegs(x, y, w, h, r, -0.07)) },
    { weight: 0.16, make: (c) => sampleSegments(c, roundRectSegs(x + 0.08, y + 0.08, w - 0.16, h - 0.16, 0.14, 0.071)) },
    { weight: 0.05, make: (c) => sampleSegments(c, roundRectSegs(-0.2, h / 2 - 0.2, 0.4, 0.09, 0.045, 0.072)) },
    {
      weight: 0.2,
      make: (c) => {
        const segs = [];
        for (let i = 0; i < 6; i++) {
          const ly = 0.55 - i * 0.24;
          segs.push(x + 0.25, ly, 0.072, x + 0.25 + (i % 3 === 0 ? 0.75 : 0.5), ly, 0.072);
        }
        return sampleSegments(c, segs);
      },
    },
    { weight: 0.12, make: (c) => fillRect(c, x + 0.22, 0.72, w - 0.44, 0.28, 0.072) },
    { weight: 0.07, make: (c) => fillRect(c, -0.4, -h / 2 + 0.2, 0.8, 0.14, 0.072) },
  ]);
  return transform(arr, new Euler(0.05, -0.38, 0.06));
}

/* ---------- shaders ---------- */

const vert = /* glsl */ `
  attribute vec3 aP0;
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec3 aP3;
  attribute vec4 aRnd;
  uniform float uMorph;
  uniform float uHeat;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vHeat;
  varying float vAlpha;
  ${simplex3}
  float ease(float t){ return t * t * (3.0 - 2.0 * t); }
  void main(){
    float m = clamp(uMorph, 0.0, 3.0);
    float seg = min(floor(m), 2.0);
    // each point starts its move a little later than the last: a pour, not a jump
    float delay = aRnd.x * 0.35;
    float f = ease(clamp((m - seg - delay) / 0.65, 0.0, 1.0));
    vec3 a = seg < 0.5 ? aP0 : seg < 1.5 ? aP1 : aP2;
    vec3 b = seg < 0.5 ? aP1 : seg < 1.5 ? aP2 : aP3;
    vec3 pos = mix(a, b, f);

    // mid-strike: metal splashes out, then settles into the new shape
    float strike = sin(f * 3.14159);
    pos += (aRnd.yzw - 0.5) * strike * 0.9;

    // molten surface wobble, fading as it cools
    float n = snoise(pos * 1.6 + vec3(0.0, uTime * 0.5, 0.0));
    pos += normalize(pos + 1e-4) * n * 0.14 * uHeat;

    vHeat = clamp(uHeat * (0.72 + aRnd.x * 0.4) + strike * 0.35 * (0.4 + uHeat), 0.0, 1.0);
    vAlpha = 0.7 + aRnd.w * 0.3;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = uSize * (0.55 + aRnd.w * 0.9) * (1.0 + uHeat * 0.35) * uPixelRatio * (8.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const frag = /* glsl */ `
  varying float vHeat;
  varying float vAlpha;
  ${heatRamp}
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    // cooled metal reads as steel blue with a silver glint, not black
    vec3 cool = mix(vec3(0.33, 0.47, 0.62), vec3(0.79, 0.82, 0.86), step(0.93, vAlpha));
    vec3 col = mix(cool, heatColor(vHeat), smoothstep(0.12, 0.45, vHeat));
    gl_FragColor = vec4(col * a * vAlpha, 1.0);
  }
`;

export function createForge({ canvas, device }) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(device.dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 8);

  const n = device.forgeParticles;
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aP0', new BufferAttribute(sampleSphere(n), 3));
  geo.setAttribute('aP1', new BufferAttribute(sampleWireframe(n), 3));
  geo.setAttribute('aP2', new BufferAttribute(samplePanels(n), 3));
  geo.setAttribute('aP3', new BufferAttribute(samplePhone(n), 3));
  const rnd = new Float32Array(n * 4);
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  geo.setAttribute('aRnd', new BufferAttribute(rnd, 4));

  const uniforms = {
    uMorph: { value: 0 },
    uHeat: { value: 1 },
    uTime: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uSize: { value: device.tier >= 3 ? 1.6 : device.tier === 2 ? 2.1 : 2.8 },
  };
  const points = new Points(
    geo,
    new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, blending: AdditiveBlending, depthWrite: false, transparent: true })
  );
  points.frustumCulled = false;
  const group = new Group();
  group.add(points);
  scene.add(group);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the ~3 unit object framed in portrait containers too
    camera.position.z = (camera.aspect < 1 ? 8 / Math.max(camera.aspect, 0.55) : 8) * (h < 340 ? 1.3 : 1);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const pointer = { x: 0, y: 0 };
  const onPointer = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let time = 0;
  let morph = 0;
  let heat = 1;
  const state = { morph: 0, heat: 1 };

  function render(dt) {
    time += dt;
    // smooth toward scroll-driven targets so fast flicks still read as a strike
    const k = Math.min(1, dt * 5);
    morph += (state.morph - morph) * k;
    heat += (state.heat - heat) * k;
    uniforms.uTime.value = time;
    uniforms.uMorph.value = morph;
    uniforms.uHeat.value = heat;

    group.rotation.y = MathUtils.lerp(group.rotation.y, Math.sin(time * 0.25) * 0.35 + pointer.x * 0.25, 0.05);
    group.rotation.x = MathUtils.lerp(group.rotation.x, pointer.y * 0.15, 0.05);
    renderer.render(scene, camera);
  }

  return {
    render,
    state,
    dispose() {
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      geo.dispose();
      renderer.dispose();
    },
  };
}
