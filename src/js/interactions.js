import { gsap } from './scroll.js';

const INTERACTIVE = 'a, button, label.chip, input, textarea, [data-magnetic], .case__link, .service';

/* Custom cursor: a silver point that glows gold as it nears anything interactive */
export function initCursor(device) {
  if (!device.hover || device.reducedMotion) return;
  const root = document.documentElement;
  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor__dot');
  const glow = cursor.querySelector('.cursor__glow');
  root.classList.add('has-cursor');

  const pos = { x: -100, y: -100 };
  const g = { x: -100, y: -100 };
  let near = 0;
  let nearTarget = 0;
  let targets = [...document.querySelectorAll(INTERACTIVE)];
  let dirty = true;

  window.addEventListener(
    'pointermove',
    (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dirty = true;
      cursor.classList.remove('is-hidden');
    },
    { passive: true }
  );
  window.addEventListener('scroll', () => (dirty = true), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  window.addEventListener('resize', () => (targets = [...document.querySelectorAll(INTERACTIVE)]));

  const RANGE = 90;
  gsap.ticker.add((_t, dt) => {
    if (dirty) {
      dirty = false;
      let best = RANGE;
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -RANGE || r.top > innerHeight + RANGE) continue;
        const dx = Math.max(r.left - pos.x, 0, pos.x - r.right);
        const dy = Math.max(r.top - pos.y, 0, pos.y - r.bottom);
        const d = Math.hypot(dx, dy);
        if (d < best) best = d;
        if (best === 0) break;
      }
      nearTarget = 1 - best / RANGE;
    }
    const k = Math.min(1, dt / 90);
    near += (nearTarget - near) * Math.min(1, dt / 60);
    g.x += (pos.x - g.x) * k * 2;
    g.y += (pos.y - g.y) * k * 2;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${1 + near * 0.6})`;
    glow.style.transform = `translate3d(${g.x}px, ${g.y}px, 0) scale(${0.5 + near * 0.7})`;
    cursor.style.setProperty('--near', near.toFixed(3));
  });
}

/* Magnetic buttons: they lean toward the pointer, then spring back */
export function initMagnetic(device) {
  if (!device.hover || device.reducedMotion) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const strength = el.classList.contains('icon-btn') ? 0.4 : 0.28;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
      el.style.setProperty('--hx', `${e.clientX - r.left}px`);
      el.style.setProperty('--hy', `${e.clientY - r.top}px`);
    });
    el.addEventListener('pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: true });
    });
  });
}
