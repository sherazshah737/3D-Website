import { gsap } from './scroll.js';

/** A render loop on the GSAP ticker (so it runs right after Lenis each frame). */
export function createLoop(render) {
  let running = false;
  const tick = (_t, deltaMs) => render(Math.min(deltaMs / 1000, 1 / 20));
  return {
    start() {
      if (!running) gsap.ticker.add(tick), (running = true);
    },
    stop() {
      if (running) gsap.ticker.remove(tick), (running = false);
    },
  };
}

/** Calls cb(isVisible) whenever the element enters/leaves the (expanded) viewport. */
export function observe(el, cb, rootMargin = '0px') {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { rootMargin });
  io.observe(el);
  return io;
}

/** Resolves once the element is within `rootMargin` of the viewport. */
export function whenNear(el, rootMargin = '100% 0px') {
  return new Promise((resolve) => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          resolve();
        }
      },
      { rootMargin }
    );
    io.observe(el);
  });
}

export const idle = (timeout = 1500) =>
  new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout }) : setTimeout(r, 200)));
