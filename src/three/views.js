// One fixed, transparent WebGL canvas that renders many small scenes into the
// screen rectangles of their DOM placeholders (scissor rendering). This keeps
// the page to a single extra WebGL context for all services + gallery images.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  OrthographicCamera,
  Group,
  Mesh,
  LineSegments,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  IcosahedronGeometry,
  EdgesGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  PlaneGeometry,
  ExtrudeGeometry,
  Shape,
  CanvasTexture,
  SRGBColorSpace,
  DirectionalLight,
  AmbientLight,
  PMREMGenerator,
  Color,
  Vector2,
  MathUtils,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadImageTexture } from './loaders.js';

const GOLD = new Color('#F2A93B');
const STEEL = new Color('#8a9bb0');

/* ------------------------------------------------------------------ */
/* Service objects                                                     */
/* ------------------------------------------------------------------ */

function metal(extra = {}) {
  return new MeshStandardMaterial({
    color: STEEL.clone(),
    metalness: 1,
    roughness: 0.32,
    emissive: new Color('#ff7a2f'),
    emissiveIntensity: 0,
    ...extra,
  });
}

function roundedRect(w, h, r) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function screenTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#1B2A3A');
  grd.addColorStop(1, '#0A0C10');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#F2A93B';
  g.beginPath();
  g.arc(128, 150, 62, -Math.PI / 2, Math.PI * 1.1);
  g.lineWidth = 14;
  g.strokeStyle = '#F2A93B';
  g.stroke();
  g.fillStyle = 'rgba(201,209,219,.35)';
  for (let i = 0; i < 5; i++) g.fillRect(40, 270 + i * 38, 120 + ((i * 53) % 60), 12);
  g.fillStyle = 'rgba(201,209,219,.6)';
  g.fillRect(96, 486, 64, 6);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

const builders = {
  web() {
    const g = new Group();
    const mats = [metal({ roughness: 0.55, color: new Color('#2a3a4c') })];
    g.add(new Mesh(new SphereGeometry(0.78, 48, 32), mats[0]));
    const lineMat = new LineBasicMaterial({ color: STEEL.clone(), transparent: true, opacity: 0.9 });
    g.add(new LineSegments(new EdgesGeometry(new IcosahedronGeometry(0.98, 2)), lineMat));
    const ringMat = metal({ roughness: 0.2 });
    const ring = new Mesh(new TorusGeometry(1.25, 0.022, 12, 128), ringMat);
    ring.rotation.set(1.2, 0.2, 0.3);
    g.add(ring);
    mats.push(ringMat);
    return { object: g, mats, lines: [lineMat], radius: 1.3 };
  },
  mobile() {
    const g = new Group();
    const body = metal({ roughness: 0.25 });
    const geo = new ExtrudeGeometry(roundedRect(1.05, 2.1, 0.18), { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 12 });
    geo.center();
    g.add(new Mesh(geo, body));
    const screenMat = new MeshBasicMaterial({ map: screenTexture(), transparent: true, opacity: 0.92 });
    const screen = new Mesh(new PlaneGeometry(0.92, 1.96), screenMat);
    screen.position.z = 0.085;
    g.add(screen);
    g.rotation.set(0.1, -0.5, 0.05);
    return { object: g, mats: [body], screen: screenMat, radius: 1.2 };
  },
  mvp() {
    // a small stack of cast ingots — the first one still warm from the mould
    const g = new Group();
    const mats = [];
    const profile = new Shape();
    profile.moveTo(-0.62, -0.17);
    profile.lineTo(0.62, -0.17);
    profile.lineTo(0.5, 0.17);
    profile.lineTo(-0.5, 0.17);
    profile.closePath();
    const geo = new ExtrudeGeometry(profile, { depth: 0.46, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3 });
    geo.center();
    const place = [
      [-0.36, -0.2, 0.0, 0],
      [0.36, -0.2, 0.0, 0],
      [0.0, 0.18, 0.0, 0.22],
    ];
    place.forEach(([x, y, z, ry], i) => {
      const m = metal({ roughness: 0.26 + i * 0.04 });
      if (i === 2) m.emissiveIntensity = 0.18;
      const ingot = new Mesh(geo, m);
      ingot.position.set(x, y, z);
      ingot.rotation.y = ry;
      g.add(ingot);
      mats.push(m);
    });
    g.rotation.set(0.45, -0.6, 0);
    return { object: g, mats, radius: 1.0 };
  },
  custom() {
    const m = metal({ roughness: 0.22 });
    const knot = new Mesh(new TorusKnotGeometry(0.62, 0.2, 220, 32, 2, 3), m);
    return { object: knot, mats: [m], radius: 1.05 };
  },
};

function serviceView(el, envTexture) {
  const shape = el.dataset.shape;
  const built = builders[shape]();
  const scene = new Scene();
  scene.environment = envTexture;
  scene.add(new AmbientLight(0xffffff, 0.15));
  const key = new DirectionalLight(0xffd7a0, 1.6);
  key.position.set(2, 3, 4);
  const rim = new DirectionalLight(0x6f8fb5, 1.4);
  rim.position.set(-3, -1, -2);
  scene.add(key, rim, built.object);

  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const host = el.closest('.service');
  const hover = { v: 0, target: 0, x: 0, y: 0 };
  host.addEventListener('pointerenter', () => (hover.target = 1));
  host.addEventListener('pointerleave', () => {
    hover.target = 0;
    hover.x = hover.y = 0;
  });
  host.addEventListener('focusin', () => (hover.target = 1));
  host.addEventListener('focusout', () => (hover.target = 0));
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    hover.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    hover.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });

  const baseRot = built.object.rotation.clone();
  let spin = 0;
  const tmp = new Color();

  return {
    el,
    scene,
    camera,
    resize(w, h) {
      camera.aspect = w / h;
      const fit = built.radius / Math.sin(MathUtils.degToRad(camera.fov / 2));
      camera.position.z = (fit / Math.min(1, camera.aspect)) * 1.05;
      camera.updateProjectionMatrix();
    },
    update(dt, t) {
      hover.v += (hover.target - hover.v) * Math.min(1, dt * 4);
      const h = hover.v;
      // subtle idle drift, a slow turn once heated by hover
      spin += dt * (0.08 + h * 0.55);
      const o = built.object;
      o.rotation.y = baseRot.y + spin + hover.x * 0.3 * h;
      o.rotation.x = baseRot.x + Math.sin(t * 0.6) * 0.05 + hover.y * 0.25 * h;
      o.position.y = Math.sin(t * 0.9 + shape.length) * 0.04;
      for (const m of built.mats) {
        const base = (m.userData.base ??= { e: m.emissiveIntensity, c: m.color.clone() });
        m.emissiveIntensity = base.e + h * 0.22;
        m.color.copy(tmp.copy(base.c).lerp(GOLD, h * 0.6));
      }
      built.lines?.forEach((l) => l.color.copy(STEEL).lerp(GOLD, h));
      if (built.screen) built.screen.opacity = 0.75 + h * 0.25;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Gallery images: heat-haze distortion on hover                       */
/* ------------------------------------------------------------------ */

const galleryVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const galleryFrag = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uPlane;
  uniform vec2 uImage;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform float uVel;
  varying vec2 vUv;

  vec2 cover(vec2 uv){
    float rp = uPlane.x / uPlane.y;
    float ri = uImage.x / uImage.y;
    vec2 s = rp > ri ? vec2(1.0, ri / rp) : vec2(rp / ri, 1.0);
    return (uv - 0.5) * s + 0.5;
  }
  void main(){
    vec2 asp = vec2(uPlane.x / uPlane.y, 1.0);
    vec2 d = (vUv - uMouse) * asp;
    float dist = length(d);
    vec2 dir = normalize(d + 1e-5);
    float falloff = exp(-dist * 3.5) * uHover;

    // rising heat haze: vertical shimmer + ripple around the cursor
    float haze = sin(vUv.y * 38.0 - uTime * 4.0 + sin(vUv.x * 12.0 + uTime) * 1.5) * 0.004 * uHover;
    float ripple = sin(dist * 26.0 - uTime * 5.0) * 0.012 * falloff;
    vec2 uv = vUv + vec2(haze, 0.0) + dir * ripple / asp;
    // gentle magnification under the cursor, like looking through hot air
    uv = mix(uv, uMouse + (uv - uMouse) * 0.9, falloff * 0.6);
    uv.x += uVel * (vUv.y - 0.5) * 0.04;
    uv = cover(uv);

    float shift = 0.004 * uHover + abs(uVel) * 0.008;
    vec2 off = dir * shift / asp;
    vec3 col;
    col.r = texture2D(uTex, uv + off).r;
    col.g = texture2D(uTex, uv).g;
    col.b = texture2D(uTex, uv - off).b;

    // the metal glows where the cursor touches it
    col += vec3(1.0, 0.42, 0.17) * falloff * 0.22;
    col += vec3(0.95, 0.66, 0.23) * exp(-dist * 9.0) * uHover * 0.12;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function galleryView(el, renderer, getVelocity) {
  const img = el.querySelector('img');
  const uniforms = {
    uTex: { value: null },
    uPlane: { value: new Vector2(1, 1) },
    uImage: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uVel: { value: 0 },
  };
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ vertexShader: galleryVert, fragmentShader: galleryFrag, uniforms, depthTest: false })));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const hover = { target: 0, mouse: new Vector2(0.5, 0.5) };
  const link = el.closest('a') || el;
  link.addEventListener('pointerenter', () => (hover.target = 1));
  link.addEventListener('pointerleave', () => (hover.target = 0));
  link.addEventListener('focus', () => {
    hover.target = 1;
    hover.mouse.set(0.5, 0.5);
  });
  link.addEventListener('blur', () => (hover.target = 0));
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    hover.mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  });

  let ready = false;
  loadImageTexture(renderer, img)
    .then(({ texture, width, height }) => {
      uniforms.uTex.value = texture;
      uniforms.uImage.value.set(width, height);
      ready = true;
      el.classList.add('is-gl');
    })
    .catch(() => {});

  return {
    el,
    scene,
    camera,
    get ready() {
      return ready;
    },
    resize(w, h) {
      uniforms.uPlane.value.set(w, h);
    },
    update(dt, t) {
      uniforms.uTime.value = t;
      uniforms.uHover.value += (hover.target - uniforms.uHover.value) * Math.min(1, dt * 5);
      uniforms.uMouse.value.lerp(hover.mouse, Math.min(1, dt * 8));
      const v = MathUtils.clamp(getVelocity() / 4000, -1, 1);
      uniforms.uVel.value += (v - uniforms.uVel.value) * Math.min(1, dt * 6);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Shared renderer                                                     */
/* ------------------------------------------------------------------ */

export function createViews({ canvas, device, services = [], gallery = [], getVelocity = () => 0 }) {
  const renderer = new WebGLRenderer({ canvas, antialias: device.tier >= 2, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(device.dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const views = [
    ...services.map((el) => serviceView(el, env)),
    ...gallery.map((el) => galleryView(el, renderer, getVelocity)),
  ];

  let W = 0, H = 0;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
  }
  window.addEventListener('resize', resize);
  resize();

  let time = 0;
  let drewLastFrame = true;
  function render(dt) {
    time += dt;
    let drew = false;
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const v of views) {
      const r = v.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W || !r.width) continue;
      if (v.ready === false) continue;
      if (v._w !== r.width || v._h !== r.height) {
        v._w = r.width;
        v._h = r.height;
        v.resize(r.width, r.height);
      }
      v.update(dt, time);
      const y = H - r.bottom;
      renderer.setViewport(r.left, y, r.width, r.height);
      renderer.setScissor(r.left, y, r.width, r.height);
      renderer.clearDepth();
      renderer.render(v.scene, v.camera);
      drew = true;
    }
    drewLastFrame = drew;
    return drewLastFrame;
  }

  return {
    render,
    dispose() {
      window.removeEventListener('resize', resize);
      env.dispose();
      renderer.dispose();
    },
  };
}
