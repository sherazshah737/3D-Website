import * as THREE from 'three';
import { makeGlowTexture } from './textures.js';

// Builds the EREBUS: sleek deep-black hull, glowing cyan viewport ring,
// twin floodlights. Returns a THREE.Group plus an update() for idle motion,
// floodlight flicker/sweep and the viewport pulse.

export function buildErebus() {
  const group = new THREE.Group();
  group.name = 'EREBUS';

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x05070a,
    metalness: 0.9,
    roughness: 0.28,
    envMapIntensity: 1.2,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0d1117,
    metalness: 0.8,
    roughness: 0.4,
  });

  const cyanEmissive = new THREE.MeshStandardMaterial({
    color: 0x001217,
    emissive: 0x2ff2ff,
    emissiveIntensity: 1.6,
    metalness: 0.2,
    roughness: 0.3,
  });

  // Main pressure hull
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(2.1, 6.4, 10, 20), hullMat);
  hull.rotation.x = Math.PI / 2;
  hull.castShadow = false;
  group.add(hull);

  // Dorsal spine ridge
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.5, 6.6),
    trimMat
  );
  spine.position.y = 2.0;
  group.add(spine);

  // Nose viewport ring (glowing cyan)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.19, 16, 48), cyanEmissive);
  ring.position.z = 4.55;
  group.add(ring);

  // Halo sprite so the ring reads as glowing even under bright surface light
  const ringGlowTex = makeGlowTexture('#4dfcff', 128);
  const ringGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: ringGlowTex,
    color: 0x4dfcff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  ringGlow.scale.set(3.4, 3.4, 3.4);
  ringGlow.position.z = 4.6;
  group.add(ringGlow);

  const ringLight = new THREE.PointLight(0x4dfcff, 1.4, 6, 2);
  ringLight.position.z = 4.6;
  group.add(ringLight);

  // Viewport glass (dark, faint cyan glint)
  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x001215, metalness: 0.1, roughness: 0.05, emissive: 0x0b3b44, emissiveIntensity: 0.4 })
  );
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 4.3;
  group.add(glass);

  // Rear thruster shroud
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 1.0, 20, 1, true), trimMat);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.z = -4.6;
  group.add(shroud);

  const thrusterGlow = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), cyanEmissive);
  thrusterGlow.position.z = -5.05;
  thrusterGlow.rotation.y = Math.PI;
  group.add(thrusterGlow);

  // Twin floodlight housings (front, port + starboard)
  const floodMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, metalness: 0.7, roughness: 0.35 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a10,
    emissive: 0xfff4d6,
    emissiveIntensity: 0,
    metalness: 0.1,
    roughness: 0.2,
  });

  const spotlights = [];
  const lenses = [];
  const sideSign = [-1, 1];
  const glowSprites = [];
  const glowTex = makeGlowTexture('#fff4d6', 128);

  for (const s of sideSign) {
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.7, 14), floodMat);
    housing.rotation.x = Math.PI / 2;
    housing.position.set(s * 1.55, -0.6, 3.2);
    group.add(housing);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), lensMat.clone());
    lens.position.set(s * 1.55, -0.6, 3.56);
    group.add(lens);
    lenses.push(lens);

    const spot = new THREE.SpotLight(0xfff4d6, 0, 60, Math.PI / 6, 0.5, 1.4);
    spot.position.set(s * 1.55, -0.6, 3.6);
    const target = new THREE.Object3D();
    target.position.set(s * 1.55, -8, 14);
    group.add(target);
    spot.target = target;
    group.add(spot);
    spotlights.push(spot);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff4d6, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    sprite.scale.set(1.4, 1.4, 1.4);
    sprite.position.set(s * 1.55, -0.6, 3.6);
    group.add(sprite);
    glowSprites.push(sprite);
  }

  // Small rear stabilizer fins
  for (const s of sideSign) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 1.1), trimMat);
    fin.position.set(s * 1.9, 0, -3.4);
    fin.rotation.z = s * 0.15;
    group.add(fin);
  }

  let flickerSeed = Math.random() * 100;

  function update({ elapsed, zoneIndex, zoneT, depth, sweep = false }) {
    // Gentle idle bob + sway so the sub always feels alive in the water.
    group.position.x = Math.sin(elapsed * 0.35) * 0.6;
    group.rotation.z = Math.sin(elapsed * 0.3) * 0.035;
    group.rotation.y = Math.sin(elapsed * 0.22) * 0.05;

    // Viewport ring pulse
    const pulse = 1.2 + Math.sin(elapsed * 1.6) * 0.5;
    cyanEmissive.emissiveIntensity = pulse;
    ringGlow.material.opacity = 0.55 + pulse * 0.22;
    ringLight.intensity = 1.1 + pulse * 0.6;

    // Floodlights: off at surface/sunlit, flicker on through twilight,
    // full brightness by midnight, sweeping search pattern at the floor.
    let targetIntensity = 0;
    if (zoneIndex === 2) {
      // twilight: flicker on
      const flicker = 0.5 + 0.5 * Math.sin(elapsed * 40 + flickerSeed);
      const onChance = zoneT > 0.4 ? 1 : 0;
      targetIntensity = onChance * (zoneT > 0.75 ? 6 : (flicker > 0.3 ? 6 : 0));
    } else if (zoneIndex === 3) {
      targetIntensity = 9;
    } else if (zoneIndex === 4) {
      targetIntensity = 11;
    }

    for (let i = 0; i < spotlights.length; i++) {
      spotlights[i].intensity += (targetIntensity - spotlights[i].intensity) * 0.15;
      const lensGlow = Math.min(1, spotlights[i].intensity / 9);
      lenses[i].material.emissiveIntensity = lensGlow * 2.2;
      glowSprites[i].material.opacity = lensGlow * 0.9;
    }

    // Floor sweep: floodlights pan left-right hunting across the vent field
    if (zoneIndex === 4) {
      const sweepAngle = Math.sin(elapsed * 0.6) * 6;
      spotlights.forEach((spot, i) => {
        spot.target.position.x = sideSign[i] * 1.55 + sweepAngle;
        spot.target.position.y = -9;
        spot.target.position.z = 12;
      });
    }
  }

  return { group, update, spotlights };
}
