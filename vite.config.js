import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { host: true, port: 5173 },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // three.js lands in its own lazily-loaded chunk shared by all scenes
        manualChunks: (id) => (id.includes('node_modules/three/build') ? 'three' : id.includes('node_modules/gsap') || id.includes('node_modules/lenis') ? 'motion' : undefined),
      },
    },
  },
});
