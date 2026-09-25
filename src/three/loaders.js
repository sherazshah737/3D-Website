// Compressed-asset loaders, created lazily and shared.
//  - KTX2 (Basis Universal) textures: GPU-compressed, ~4–8× less VRAM than PNG/JPG
//  - Draco-compressed glTF models
// three r17x+ resolves its bundled Basis/Draco decoders via import.meta.url, so
// Vite emits them as hashed assets. Neither the loader code nor the WASM is
// downloaded until a .ktx2 texture or Draco-compressed .glb is actually requested.
import { TextureLoader, SRGBColorSpace } from 'three';

let ktx2;
let gltf;

export async function getKTX2Loader(renderer) {
  if (!ktx2) {
    const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js');
    ktx2 = new KTX2Loader().detectSupport(renderer);
  }
  return ktx2;
}

export async function getGLTFLoader() {
  if (!gltf) {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/loaders/DRACOLoader.js'),
    ]);
    const draco = new DRACOLoader();
    gltf = new GLTFLoader().setDRACOLoader(draco);
  }
  return gltf;
}

/** Load a model (e.g. a real device mockup) — `await loadModel('/models/phone.glb')` */
export async function loadModel(url) {
  const loader = await getGLTFLoader();
  return (await loader.loadAsync(url)).scene;
}

/**
 * Load an image texture, preferring a .ktx2 version when the <img> declares one
 * via data-ktx2. Falls back to the browser-chosen srcset candidate.
 */
export async function loadImageTexture(renderer, img) {
  if (img.dataset.ktx2) {
    try {
      const loader = await getKTX2Loader(renderer);
      const tex = await loader.loadAsync(img.dataset.ktx2);
      tex.colorSpace = SRGBColorSpace;
      return { texture: tex, width: tex.image.width, height: tex.image.height };
    } catch (err) {
      console.warn('[ktx2] falling back to image', err);
    }
  }
  if (!img.complete || !img.naturalWidth) {
    img.loading = 'eager';
    await img.decode().catch(() => new Promise((r) => img.addEventListener('load', r, { once: true })));
  }
  const tex = await new TextureLoader().loadAsync(img.currentSrc || img.src);
  tex.colorSpace = SRGBColorSpace;
  return { texture: tex, width: img.naturalWidth, height: img.naturalHeight };
}
