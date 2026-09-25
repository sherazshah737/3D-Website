import { gsap, ScrollTrigger, scrollToY } from './scroll.js';
import { splitText } from './split.js';
import { createLoop, observe, whenNear } from './loop.js';

const root = document.documentElement;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ---------------- Section headings: a wave of heat passes through ---------------- */
export function initHeatHeadings(device) {
  document.querySelectorAll('[data-split="heat"]').forEach((el) => {
    const { chars } = splitText(el);
    if (device.reducedMotion) return;
    // every state keeps AA contrast: dim silver → gold → silver
    gsap
      .timeline({ scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 45%', scrub: 0.6 } })
      .fromTo(chars, { color: '#8C97A4', textShadow: '0 0 0px rgba(255,107,44,0)' }, { color: '#F2A93B', textShadow: '0 0 18px rgba(255,107,44,0.55)', stagger: 0.04, duration: 0.3, ease: 'none' })
      .to(chars, { color: '#C9D1DB', textShadow: '0 0 0px rgba(255,107,44,0)', stagger: 0.04, duration: 0.45, ease: 'none' }, 0.3);
  });
}

/* ---------------- Page temperature (thermometer + ambient) ---------------- */
export function initThermo(device) {
  const value = document.querySelector('[data-thermo]');
  const fill = document.querySelector('.thermo__fill');
  let last = -1;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const p = self.progress;
      root.style.setProperty('--page-heat', (1 - p).toFixed(3));
      fill.style.setProperty('--progress', p.toFixed(3));
      const t = Math.round(1538 - (1538 - 22) * Math.pow(p, 0.8));
      if (t !== last) value.textContent = String((last = t));
    },
  });
  if (device.reducedMotion) root.style.setProperty('--page-heat', '0.6');
}

/* ---------------- Nav ---------------- */
export function initNav() {
  const nav = document.querySelector('.nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      const down = y > lastY && y > 400;
      // never hide while something inside the nav has focus
      nav.classList.toggle('is-hidden', down && !nav.contains(document.activeElement));
      lastY = y;
    },
  });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));
}

/* ---------------- 02 · The Forge ---------------- */
const STAGES = [
  { temp: 1538, state: 'Molten' },
  { temp: 1120, state: 'Casting' },
  { temp: 640, state: 'Forging' },
  { temp: 24, state: 'Quenched' },
];

export function initForge(device) {
  const section = document.getElementById('process');
  const steps = [...section.querySelectorAll('.forge__step')];
  const arts = [...section.querySelectorAll('[data-stage-art]')];
  const tempEl = section.querySelector('[data-forge-temp]');
  const stateEl = section.querySelector('[data-forge-state]');
  if (device.reducedMotion) return;

  let active = -1;
  let scene = null;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => {
      s.classList.toggle('is-active', k === i);
      if (k === i) s.setAttribute('aria-current', 'step');
      else s.removeAttribute('aria-current');
    });
    arts.forEach((a, k) => (a.style.opacity = k === i ? '1' : '0'));
    stateEl.textContent = STAGES[i].state;
  };
  setActive(0);

  const update = (p) => {
    // hold each shape, strike between them
    const s = clamp(p * 3.6 - 0.3, 0, 3);
    const i = Math.min(2, Math.floor(s));
    const morph = i + smooth(0.25, 0.75, s - i);
    const heat = 1 - morph / 3;
    setActive(Math.min(3, Math.round(morph)));
    section.style.setProperty('--forge-heat', heat.toFixed(3));
    section.style.setProperty('--forge-progress', p.toFixed(3));
    tempEl.textContent = String(Math.round(24 + (1538 - 24) * Math.pow(heat, 1.25)));
    if (scene) {
      scene.state.morph = morph;
      scene.state.heat = heat;
    }
  };

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${window.innerHeight * 3}`,
    pin: true,
    scrub: true,
    onUpdate: (self) => update(self.progress),
    onRefresh: (self) => update(self.progress),
  });

  // Lazy-load the 3D scene when the section approaches
  if (!device.webgl) return;
  whenNear(section, '80% 0px').then(async () => {
    const { createForge } = await import('../three/forge.js');
    scene = createForge({ canvas: section.querySelector('#forge-canvas'), device });
    root.classList.add('forge-3d');
    const loop = createLoop(scene.render);
    observe(section, (v) => (v ? loop.start() : loop.stop()));
    ScrollTrigger.refresh();
  });
}

/* ---------------- 04 · Selected work (horizontal) ---------------- */
export function initWork(device) {
  const section = document.getElementById('work');
  const viewport = section.querySelector('.work__viewport');
  const track = section.querySelector('.work__track');
  if (device.reducedMotion) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 769px)', () => {
    root.classList.add('work-pinned');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    // Keyboard users: tabbing to an off-screen case scrolls the page to it
    const onFocus = (e) => {
      const card = e.target.closest('.case');
      if (!card) return;
      viewport.scrollLeft = 0;
      const st = tween.scrollTrigger;
      const d = distance();
      const x = clamp(card.offsetLeft - (window.innerWidth - card.offsetWidth) / 2, 0, d);
      scrollToY(st.start + (st.end - st.start) * (d ? x / d : 0));
    };
    track.addEventListener('focusin', onFocus);
    return () => {
      track.removeEventListener('focusin', onFocus);
      root.classList.remove('work-pinned');
    };
  });
}

/* ---------------- 05 · Why: each statement runs hot as it passes centre ---------------- */
export function initWhy(device) {
  const items = document.querySelectorAll('.why__item');
  if (device.reducedMotion) {
    items.forEach((i) => i.style.setProperty('--t', '1'));
    return;
  }
  items.forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate(self) {
        // heat up on the way in, stay warm-ish once read (cooled, shipped)
        const p = self.progress;
        const t = p < 0.5 ? smooth(0.15, 0.45, p) : 1 - smooth(0.5, 0.85, p) * 0.7;
        item.style.setProperty('--t', t.toFixed(3));
      },
    });
  });
}

/* ---------------- 06 · Marquee ---------------- */
export function initMarquee() {
  document.querySelectorAll('[data-marquee]').forEach((m) => {
    const group = m.querySelector('.marquee__group');
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    m.appendChild(clone);
  });
}

/* ---------------- 07 · Testimonials ---------------- */
export function initQuotes(device) {
  const section = document.getElementById('testimonials');
  const quotes = [...section.querySelectorAll('.quote')];
  const idx = section.querySelector('[data-quote-index]');
  let current = 0;
  let busy = false;

  const show = (n) => {
    if (busy) return;
    const next = (n + quotes.length) % quotes.length;
    if (next === current) return;
    const from = quotes[current];
    const to = quotes[next];
    current = next;
    idx.textContent = String(next + 1).padStart(2, '0');

    if (device.reducedMotion) {
      from.hidden = true;
      to.hidden = false;
      return;
    }
    busy = true;
    const text = to.querySelector('blockquote p');
    gsap
      .timeline({ onComplete: () => (busy = false) })
      .to(from, { clipPath: 'inset(0 0 100% 0)', duration: 0.45, ease: 'power3.in' })
      .add(() => {
        from.hidden = true;
        from.style.clipPath = '';
        to.hidden = false;
      })
      .fromTo(to, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.7, ease: 'power3.out' })
      .fromTo(text, { color: '#F2A93B' }, { color: '#C9D1DB', duration: 1.2, ease: 'power2.out' }, '<')
      .set(to, { clearProps: 'clipPath' });
  };

  section.querySelector('[data-quote="prev"]').addEventListener('click', () => show(current - 1));
  section.querySelector('[data-quote="next"]').addEventListener('click', () => show(current + 1));
  section.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
}

/* ---------------- Footer: the ember cools to nothing ---------------- */
export function initFooter(device) {
  const footer = document.querySelector('.footer');
  const ember = footer.querySelector('.footer__ember');
  document.querySelector('[data-year]').textContent = String(new Date().getFullYear());
  if (device.reducedMotion) {
    ember.style.setProperty('--cool', '0.85');
    return;
  }
  ScrollTrigger.create({
    trigger: footer,
    start: 'top bottom',
    end: 'bottom bottom',
    onUpdate: (self) => ember.style.setProperty('--cool', smooth(0.05, 0.95, self.progress).toFixed(3)),
  });
}
