import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;

export function initScroll(device) {
  if (!device.reducedMotion) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // In-page anchors: smooth when allowed, and always move keyboard focus
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === 'top' ? 0 : target, { duration: 1.4 });
    else target.scrollIntoView();
    const focusEl = id === 'top' ? document.querySelector('.nav__brand') : target;
    if (!focusEl.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|TEXTAREA)$/.test(focusEl.tagName)) focusEl.setAttribute('tabindex', '-1');
    focusEl.focus({ preventScroll: true });
    history.replaceState(null, '', id === 'top' ? location.pathname : `#${id}`);
  });
}

export const getLenis = () => lenis;

/** Scroll velocity in px/s (0 when native scrolling). */
export const getVelocity = () => (lenis ? lenis.velocity * 60 : 0);

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { immediate: true });
  else window.scrollTo(0, y);
}

export { gsap, ScrollTrigger };
