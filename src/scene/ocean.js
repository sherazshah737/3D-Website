import * as THREE from 'three';
import { depthToColorHex, depthToWorldY, DEPTH_SCALE } from './zones.js';
import { makeGlowTexture, makeRayTexture } from './textures.js';

const FLOOR_DEPTH = 3800;
const FLOOR_Y = depthToWorldY(FLOOR_DEPTH) - 3;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function wrapCoord(seed, referenceY, span) {
  const local = seed - referenceY;
  const w = ((local % span) + span) % span;
  return referenceY + w - span / 2;
}

export function buildOcean(scene) {
  scene.fog = new THREE.Fog(0xbfe9ff, 10, 140);
  scene.background = new THREE.Color(0xbfe9ff);

  const hemi = new THREE.HemisphereLight(0xbfe9ff, 0x03121c, 1.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(10, 40, 20);
  scene.add(sun);

  const fill = new THREE.PointLight(0x2ff2ff, 0, 80, 2);
  scene.add(fill);

  // ---- Ambient marine snow / bubble field (whole descent, wraps forever) ----
  const snowCount = 900;
  const snowSpan = 60;
  const snowGeo = new THREE.BufferGeometry();
  const snowSeed = new Float32Array(snowCount * 3);
  for (let i = 0; i < snowCount; i++) {
    snowSeed[i * 3 + 0] = (Math.random() - 0.5) * 26; // x
    snowSeed[i * 3 + 1] = Math.random() * snowSpan; // y seed
    snowSeed[i * 3 + 2] = (Math.random() - 0.5) * 26 - 6; // z
  }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowSeed.slice(), 3));
  const snowTex = makeGlowTexture('#dff6ff', 64);
  const snowMat = new THREE.PointsMaterial({
    size: 0.22,
    map: snowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xdff6ff,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  scene.add(snow);

  // ---- Bioluminescent starfield (dense, wraps forever, active midnight+) ----
  const bioCount = 1400;
  const bioSpan = 90;
  const bioGeo = new THREE.BufferGeometry();
  const bioSeed = new Float32Array(bioCount * 3);
  const bioPhase = new Float32Array(bioCount);
  for (let i = 0; i < bioCount; i++) {
    bioSeed[i * 3 + 0] = (Math.random() - 0.5) * 40;
    bioSeed[i * 3 + 1] = Math.random() * bioSpan;
    bioSeed[i * 3 + 2] = (Math.random() - 0.5) * 40 - 8;
    bioPhase[i] = Math.random() * Math.PI * 2;
  }
  bioGeo.setAttribute('position', new THREE.BufferAttribute(bioSeed.slice(), 3));
  const bioTex = makeGlowTexture('#4dfcff', 64);
  const bioMat = new THREE.PointsMaterial({
    size: 0.32,
    map: bioTex,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0x63f7ff,
  });
  const bio = new THREE.Points(bioGeo, bioMat);
  scene.add(bio);

  // ---- God rays (sunlit zone) ----
  const rayTex = makeRayTexture(256);
  const rayGroup = new THREE.Group();
  const rayCount = 14;
  for (let i = 0; i < rayCount; i++) {
    const mat = new THREE.SpriteMaterial({
      map: rayTex,
      color: 0xeaffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      rotation: (Math.random() - 0.5) * 0.12,
    });
    const ray = new THREE.Sprite(mat);
    ray.scale.set(2.2 + Math.random() * 1.6, 30, 1);
    ray.userData.seedX = (Math.random() - 0.5) * 30;
    ray.userData.seedZ = (Math.random() - 0.5) * 20 - 10;
    ray.userData.phase = Math.random() * Math.PI * 2;
    rayGroup.add(ray);
  }
  scene.add(rayGroup);

  // ---- Whale silhouette (single scripted pass through the sunlit zone) ----
  const whale = new THREE.Group();
  const whaleMat = new THREE.MeshBasicMaterial({ color: 0x03141d, transparent: true, opacity: 0 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(2.4, 9, 8, 16), whaleMat);
  body.rotation.z = Math.PI / 2;
  whale.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.2, 4), whaleMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -7.2;
  tail.scale.set(1, 0.25, 1.4);
  whale.add(tail);
  const fin = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 4), whaleMat);
  fin.position.set(1.5, -2.4, 0);
  fin.rotation.z = Math.PI * 0.9;
  whale.add(fin);
  whale.position.y = depthToWorldY((40 + 200) / 2) - 3;
  whale.position.z = -18;
  scene.add(whale);

  // ---- Jellyfish field (twilight zone, world-fixed band) ----
  const jellyGroup = new THREE.Group();
  const jellyfish = [];
  const jellyMat = new THREE.MeshStandardMaterial({
    color: 0x0c2230,
    emissive: 0x6fe8ff,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    roughness: 0.3,
  });
  const twilightTopY = depthToWorldY(200);
  const twilightBotY = depthToWorldY(1000);
  for (let i = 0; i < 22; i++) {
    const j = new THREE.Group();
    const bellMat = jellyMat.clone();
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.55 + Math.random() * 0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.8), bellMat);
    j.add(bell);
    const tentacles = new THREE.Group();
    for (let t = 0; t < 5; t++) {
      const tent = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4 + Math.random() * 0.6, 4), bellMat);
      tent.position.set((Math.random() - 0.5) * 0.7, -1.1, (Math.random() - 0.5) * 0.7);
      tentacles.add(tent);
    }
    j.add(tentacles);
    j.position.set(
      (Math.random() - 0.5) * 30,
      twilightTopY + Math.random() * (twilightBotY - twilightTopY),
      -10 + (Math.random() - 0.5) * 26
    );
    j.userData.phase = Math.random() * Math.PI * 2;
    j.userData.bellMat = bellMat;
    jellyGroup.add(j);
    jellyfish.push(j);
  }
  scene.add(jellyGroup);

  // ---- Sea floor + hydrothermal vents ----
  const floorGroup = new THREE.Group();
  const floorGeo = new THREE.PlaneGeometry(140, 140, 48, 48);
  const posAttr = floorGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const bump = Math.sin(x * 0.15) * 1.4 + Math.cos(y * 0.18) * 1.4 + (Math.random() - 0.5) * 0.6;
    posAttr.setZ(i, bump);
  }
  floorGeo.computeVertexNormals();
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x08090b, roughness: 0.95, metalness: 0.05 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floorGroup.add(floor);

  const vents = [];
  const ventPositions = [
    [3, 4], [-4, 6], [1, 9], [-2, 2], [5, 5],
  ];
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: 0xff5b1f, emissiveIntensity: 0 });
  for (const [vx, vz] of ventPositions) {
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.1, 3.4 + Math.random() * 2, 10), ventMat.clone());
    chimney.position.set(vx, FLOOR_Y + 1.6, vz);
    floorGroup.add(chimney);

    const light = new THREE.PointLight(0xff6a2a, 0, 18, 2);
    light.position.set(vx, FLOOR_Y + 3, vz);
    floorGroup.add(light);

    // Rising plume particles
    const plumeCount = 60;
    const plumeGeo = new THREE.BufferGeometry();
    const plumeSeed = new Float32Array(plumeCount * 3);
    for (let i = 0; i < plumeCount; i++) {
      plumeSeed[i * 3 + 0] = vx + (Math.random() - 0.5) * 0.6;
      plumeSeed[i * 3 + 1] = Math.random() * 8;
      plumeSeed[i * 3 + 2] = vz + (Math.random() - 0.5) * 0.6;
    }
    plumeGeo.setAttribute('position', new THREE.BufferAttribute(plumeSeed, 3));
    const plumeMat = new THREE.PointsMaterial({
      size: 0.5,
      map: makeGlowTexture('#ffb37a', 64),
      color: 0xffb37a,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const plume = new THREE.Points(plumeGeo, plumeMat);
    plume.position.set(0, FLOOR_Y + 2, 0);
    floorGroup.add(plume);

    vents.push({ chimney, light, plume, baseY: vx });
  }
  scene.add(floorGroup);

  function update({ elapsed, depth, zoneIndex, zoneT, subY }) {
    // --- color grade: fog + background + lights follow depth continuously
    const color = depthToColorHex(depth);
    scene.fog.color.setHex(color);
    scene.background.setHex(color);

    const surfaceness = smoothstep(0, 60, 200 - Math.min(depth, 200));
    sun.intensity = 1.6 * smoothstep(0, 30, 60 - Math.min(depth, 60));
    hemi.intensity = 0.15 + 1.05 * smoothstep(0, 40, 80 - Math.min(depth, 80));

    const nearFog = 6 + 30 * smoothstep(0, 400, 400 - Math.min(depth, 400));
    const farFog = 40 + 160 * smoothstep(0, 1000, 1000 - Math.min(depth, 1000));
    scene.fog.near = Math.max(2, nearFog * 0.3);
    scene.fog.far = Math.max(20, farFog);

    // sub's own floodlight fill glow in the water
    fill.intensity = zoneIndex >= 2 ? THREE.MathUtils.lerp(0, 2.4, smoothstep(0, 1, zoneIndex === 2 ? zoneT : 1)) : 0;
    fill.position.set(0, subY, 2);

    // --- ambient snow, always present, wraps around current depth
    const sp = snow.geometry.attributes.position;
    for (let i = 0; i < snowCount; i++) {
      sp.setX(i, snowSeed[i * 3 + 0] + Math.sin(elapsed * 0.2 + i) * 0.4);
      sp.setY(i, wrapCoord(snowSeed[i * 3 + 1], subY, snowSpan));
      sp.setZ(i, snowSeed[i * 3 + 2]);
    }
    sp.needsUpdate = true;
    snowMat.opacity = 0.35 + 0.3 * (1 - surfaceness);

    // --- god rays: sunlit zone only
    const rayActive = smoothstep(0, 30, 80 - Math.min(depth, 80)) * smoothstep(200, 100, depth);
    rayGroup.children.forEach((ray) => {
      ray.material.opacity = 0.18 * rayActive;
      ray.position.set(ray.userData.seedX + Math.sin(elapsed * 0.15 + ray.userData.phase) * 1.5, subY + 14, ray.userData.seedZ);
    });

    // --- whale: fades in/out as the sub passes its fixed depth band
    const whaleActive = smoothstep(30, 90, depth) * smoothstep(210, 130, depth);
    whaleMat.opacity = whaleActive * 0.9;
    whale.position.x = -40 + smoothstep(40, 200, depth) * 80;

    // --- jellyfish: active through the twilight zone
    const jellyActive = smoothstep(180, 260, depth) * smoothstep(1020, 900, depth);
    jellyfish.forEach((j) => {
      j.userData.bellMat.opacity = jellyActive * 0.85;
      j.userData.bellMat.emissiveIntensity = jellyActive * 1.4;
      j.position.y += Math.sin(elapsed * 0.6 + j.userData.phase) * 0.004;
      j.rotation.z = Math.sin(elapsed * 0.5 + j.userData.phase) * 0.08;
    });

    // --- bioluminescent starfield: midnight zone onward
    const bioActive = smoothstep(900, 1200, depth);
    bioMat.opacity = bioActive * 0.9;
    const bp = bio.geometry.attributes.position;
    for (let i = 0; i < bioCount; i++) {
      bp.setX(i, bioSeed[i * 3 + 0]);
      bp.setY(i, wrapCoord(bioSeed[i * 3 + 1], subY, bioSpan));
      bp.setZ(i, bioSeed[i * 3 + 2]);
    }
    bp.needsUpdate = true;
    bioMat.size = 0.28 + Math.sin(elapsed * 3) * 0.04;

    // --- floor + vents: activate near the bottom
    const floorActive = smoothstep(2600, 3200, depth);
    vents.forEach((v) => {
      v.chimney.material.emissiveIntensity = floorActive * 1.8;
      v.light.intensity = floorActive * 5;
      v.plume.material.opacity = floorActive * 0.5;
      const pp = v.plume.geometry.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        let y = pp.getY(i) + 0.02;
        if (y > 8) y = 0;
        pp.setY(i, y);
      }
      pp.needsUpdate = true;
    });
  }

  return { update, FLOOR_Y };
}
