// Hero: a molten ember with a field of sparks that lean toward the cursor.
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  IcosahedronGeometry,
  PlaneGeometry,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Mesh,
  Points,
  Vector2,
  Vector3,
  AdditiveBlending,
  MathUtils,
} from 'three';
import { simplex3, heatRamp } from './glsl.js';

const coreVert = /* glsl */ `
  uniform float uTime;
  uniform float uIgnite;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  ${simplex3}
  void main(){
    vec3 p = position;
    float n = snoise(p * 1.4 + vec3(0.0, uTime * 0.35, uTime * 0.2));
    p *= 1.0 + n * 0.09 * uIgnite;
    vPos = position;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const coreFrag = /* glsl */ `
  uniform float uTime;
  uniform float uIgnite;
  uniform float uGlow;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  ${simplex3}
  ${heatRamp}
  void main(){
    vec3 p = vPos * 2.2 + vec3(0.0, -uTime * 0.25, uTime * 0.12);
    float veins = 1.0 - abs(snoise(p));
    veins = pow(veins, 5.0);
    float crust = snoise(vPos * 5.0 - uTime * 0.1) * 0.5 + 0.5;
    float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
    float t = 0.28 + veins * 0.72 + crust * 0.08 + fres * 0.25;
    t *= mix(0.35, 1.0, uIgnite) * uGlow;
    vec3 col = heatColor(clamp(t, 0.0, 1.0));
    col += vec3(1.0, 0.45, 0.15) * fres * 0.6 * uIgnite;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const glowFrag = /* glsl */ `
  uniform float uIgnite;
  uniform float uTime;
  uniform float uGlow;
  varying vec2 vUv;
  void main(){
    float d = length(vUv - 0.5) * 2.0;
    float core = exp(-d * 5.0);
    float halo = exp(-d * 2.2) * 0.55;
    float flicker = 0.92 + 0.08 * sin(uTime * 3.1) * sin(uTime * 1.7);
    vec3 col = vec3(1.0, 0.62, 0.22) * core + vec3(1.0, 0.36, 0.12) * halo;
    col *= 1.0 - smoothstep(0.55, 1.0, d);
    gl_FragColor = vec4(col * uIgnite * flicker * uGlow, 1.0);
  }
`;

const sparkVert = /* glsl */ `
  attribute vec4 aSeed;
  attribute vec3 aDir;
  uniform float uTime;
  uniform float uIgnite;
  uniform float uPixelRatio;
  uniform vec3 uEmber;
  uniform vec3 uMouse;
  uniform float uMouseForce;
  uniform float uScale;
  varying float vHeat;
  varying float vAlpha;
  ${simplex3}
  void main(){
    vec3 pos;
    float size;
    bool spark = aSeed.w < 0.45;
    if (spark) {
      // sparks leave the ember surface, rise, drift and cool
      float life = fract(uTime * (0.08 + aSeed.x * 0.12) + aSeed.y);
      vec3 start = uEmber + aDir * uScale;
      vec3 drift = vec3(snoise(vec3(aSeed.xy * 9.0, uTime * 0.2)), 0.0, snoise(vec3(aSeed.yz * 9.0, uTime * 0.2)));
      pos = start + aDir * life * (1.0 + aSeed.z * 3.0) * uScale
          + vec3(0.0, life * life * 5.0, 0.0)
          + drift * life * 1.6;
      vHeat = 1.0 - life * 0.95;
      vAlpha = smoothstep(0.0, 0.06, life) * (1.0 - life);
      size = mix(0.08, 0.025, life) * (0.6 + aSeed.z);
    } else {
      // slow dust: cooled flakes hanging in the forge air
      pos = (aSeed.xyz - 0.5) * vec3(26.0, 16.0, 10.0);
      pos.z -= 2.0;
      pos += vec3(
        snoise(vec3(pos.xy * 0.08, uTime * 0.05)),
        snoise(vec3(pos.yz * 0.08, uTime * 0.05 + 9.0)) + uTime * 0.04,
        0.0);
      pos.y = mod(pos.y + 8.0, 16.0) - 8.0;
      vec3 toEmber = pos - uEmber;
      float nearEmber = exp(-dot(toEmber, toEmber) * 0.04);
      vHeat = 0.25 + nearEmber * 0.5 + aSeed.x * 0.1;
      vAlpha = 0.28 + aSeed.y * 0.4;
      size = 0.02 + aSeed.z * 0.035;
    }

    // Ignition: everything bursts out of the ember
    float ig = 1.0 - pow(1.0 - uIgnite, 3.0);
    pos = mix(uEmber, pos, ig);
    vAlpha *= ig;

    // Lean toward the cursor
    vec3 toMouse = uMouse - pos;
    float d = length(toMouse.xy);
    float pull = exp(-d * d * 0.18) * uMouseForce;
    pos.xy += normalize(toMouse.xy + 1e-4) * pull * min(d, 1.8) * 0.65;
    vHeat = min(1.0, vHeat + pull * 0.35);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * uPixelRatio * (680.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const sparkFrag = /* glsl */ `
  varying float vHeat;
  varying float vAlpha;
  ${heatRamp}
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = heatColor(vHeat);
    gl_FragColor = vec4(col * a * vAlpha, 1.0);
  }
`;

export function createHero({ canvas, device }) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: device.tier >= 3,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(device.dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  const shared = {
    uTime: { value: 0 },
    uIgnite: { value: 0 },
    uGlow: { value: 1 },
  };

  // Core
  const detail = device.tier >= 3 ? 40 : device.tier === 2 ? 24 : 12;
  const core = new Mesh(
    new IcosahedronGeometry(1, detail),
    new ShaderMaterial({ vertexShader: coreVert, fragmentShader: coreFrag, uniforms: shared })
  );
  scene.add(core);

  // Glow billboard (camera is fixed, so a plane facing +z is enough)
  const glow = new Mesh(
    new PlaneGeometry(11, 11),
    new ShaderMaterial({
      vertexShader: glowVert,
      fragmentShader: glowFrag,
      uniforms: shared,
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  );
  glow.position.z = -0.6;
  scene.add(glow);

  // Particles
  const count = device.heroParticles;
  const seeds = new Float32Array(count * 4);
  const dirs = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seeds.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    const v = new Vector3().randomDirection();
    v.y = Math.abs(v.y) * 0.6 + 0.1; // bias upward
    v.normalize();
    dirs.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute('aSeed', new BufferAttribute(seeds, 4));
  geo.setAttribute('aDir', new BufferAttribute(dirs, 3));
  geo.boundingSphere = null;
  const sparkUniforms = {
    ...shared,
    uPixelRatio: { value: renderer.getPixelRatio() },
    uEmber: { value: new Vector3() },
    uMouse: { value: new Vector3(99, 99, 0) },
    uMouseForce: { value: 0 },
    uScale: { value: 1 },
  };
  const points = new Points(
    geo,
    new ShaderMaterial({
      vertexShader: sparkVert,
      fragmentShader: sparkFrag,
      uniforms: sparkUniforms,
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
  );
  points.frustumCulled = false;
  scene.add(points);

  // Layout: ember sits right of the headline on wide screens, above it on phones
  const view = new Vector2();
  const ember = new Vector3();
  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    view.set(halfH * camera.aspect, halfH);
    const wide = camera.aspect > 1.05;
    // portrait: tuck the ember into the top-right corner, clear of the headline
    ember.set(wide ? view.x * 0.42 : view.x * 0.56, wide ? view.y * 0.14 : view.y * 0.6, 0);
    const s = wide ? 1.15 : 0.6;
    core.position.copy(ember);
    core.scale.setScalar(s);
    glow.position.set(ember.x, ember.y, -0.6);
    glow.scale.setScalar(s);
    sparkUniforms.uEmber.value.copy(ember);
    sparkUniforms.uScale.value = s;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Pointer → world position on the z=0 plane, smoothed
  const target = new Vector3(99, 99, 0);
  let force = 0;
  let forceTarget = 0;
  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
    target.set(nx * view.x, ny * view.y, 0);
    forceTarget = 1;
  }
  const onLeave = () => (forceTarget = 0);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  let time = 0;
  function render(dt) {
    time += dt;
    shared.uTime.value = time;
    force += (forceTarget - force) * Math.min(1, dt * 3);
    sparkUniforms.uMouseForce.value = force;
    sparkUniforms.uMouse.value.lerp(target, Math.min(1, dt * 6));

    // the ember itself turns toward the cursor
    const m = sparkUniforms.uMouse.value;
    const tx = MathUtils.clamp((m.y - ember.y) * -0.08, -0.4, 0.4) * force;
    const ty = MathUtils.clamp((m.x - ember.x) * 0.08, -0.5, 0.5) * force;
    core.rotation.x += (tx - core.rotation.x) * 0.05;
    core.rotation.y += (ty + time * 0.12 - core.rotation.y) * 0.05;
    const pulse = 1 + Math.sin(time * 1.6) * 0.015;
    core.scale.setScalar(sparkUniforms.uScale.value * pulse * (0.35 + 0.65 * shared.uIgnite.value));

    renderer.render(scene, camera);
  }

  return {
    render,
    uniforms: shared,
    // 0 → 1: the ignition moment of the page-load sequence
    set ignite(v) {
      shared.uIgnite.value = v;
    },
    get ignite() {
      return shared.uIgnite.value;
    },
    // fades as the hero scrolls away (the metal leaves the fire)
    set glow(v) {
      shared.uGlow.value = v;
    },
    dispose() {
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      geo.dispose();
      renderer.dispose();
    },
  };
}
