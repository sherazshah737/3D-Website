import { device } from './device.js';
import { initScroll, ScrollTrigger, getVelocity, gsap } from './scroll.js';
import { playIntro } from './intro.js';
import { initCursor, initMagnetic } from './interactions.js';
import { initHeatHeadings, initThermo, initNav, initForge, initWork, initWhy, initMarquee, initQuotes, initFooter } from './sections.js';
import { initForm } from './form.js';
import { mountHeroVideo } from './hero-fallback.js';
import { createLoop, observe, whenNear, idle } from './loop.js';

const root = document.documentElement;

initScroll(device);
const intro = playIntro(device);

// Sections — created in document order so ScrollTrigger pin spacing resolves correctly
initNav();
initThermo(device);
initForge(device);
initWork(device);
initHeatHeadings(device);
initWhy(device);
initMarquee();
initQuotes(device);
initForm();
initFooter(device);
initCursor(device);
initMagnetic(device);
ScrollTrigger.sort();

document.fonts?.ready.then(() => ScrollTrigger.refresh());

/* ---------------- Hero: 3D ember, or video / poster fallback ---------------- */
async function startHero() {
  if (!device.webgl) {
    mountHeroVideo(device);
    return;
  }
  try {
    const { createHero } = await import('../three/hero.js');
    const hero = createHero({ canvas: document.getElementById('hero-canvas'), device });
    const loop = createLoop(hero.render);
    observe(document.getElementById('hero'), (v) => (v ? loop.start() : loop.stop()));
    root.classList.add('hero-3d');
    // join the intro: ignite once the CSS spark has flared
    const delay = intro ? Math.max(0, 0.55 - intro.time()) : 0;
    gsap.to(hero, { ignite: 1, duration: 2.4, delay, ease: 'expo.out' });
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => (hero.glow = 1 - self.progress * 0.7),
    });
  } catch (err) {
    console.warn('[hero] WebGL failed, using video fallback', err);
    mountHeroVideo(device);
  }
}

/* ---------------- Services + gallery: DOM-synced 3D views ---------------- */
async function startViews() {
  if (!device.webgl) return;
  const services = document.getElementById('services');
  await whenNear(services, '60% 0px');
  const { createViews } = await import('../three/views.js');
  const views = createViews({
    canvas: document.getElementById('views-canvas'),
    device,
    services: [...document.querySelectorAll('[data-view="service"]')],
    // image distortion is a hover effect — skip it on touch screens
    gallery: device.hover ? [...document.querySelectorAll('[data-view="gallery"]')] : [],
    getVelocity,
  });
  root.classList.add('views-3d');
  const loop = createLoop(views.render);
  const visible = new Set();
  const track = (el) => (v) => {
    v ? visible.add(el) : visible.delete(el);
    if (visible.size) loop.start();
    else loop.stop(), views.render(0);
  };
  observe(services, track(services));
  const work = document.getElementById('work');
  if (device.hover) observe(work, track(work));
}

// Keep 3D off the critical path: wait for load + an idle slot
const afterLoad = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));
afterLoad.then(() => idle()).then(() => {
  startHero();
  startViews();
});
