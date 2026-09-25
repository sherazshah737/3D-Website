// The one orchestrated moment: the ember ignites, the headline is forged in.
import { gsap } from './scroll.js';
import { splitText } from './split.js';

export function playIntro(device) {
  const title = document.querySelector('.hero__title');
  const { chars } = splitText(title, { lines: true });
  if (device.reducedMotion) return null;

  const spark = document.querySelector('.hero__spark');
  const rest = document.querySelectorAll('.hero .eyebrow, .hero__sub, .hero__actions, .hero__meta');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(spark, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' }, 0.1)
    .to(spark, { scale: 4, opacity: 0, duration: 1, ease: 'power2.in' }, 0.6)
    // letters arrive white-hot, glow gold, then cool to silver — left to right
    .fromTo(
      chars,
      { opacity: 0, yPercent: 35, color: '#FFF4DC', textShadow: '0 0 28px rgba(242,169,59,0.95), 0 0 70px rgba(255,107,44,0.75)' },
      { opacity: 1, yPercent: 0, color: '#F2A93B', duration: 0.55, stagger: 0.03 },
      0.35
    )
    .to(
      chars,
      { color: '#C9D1DB', textShadow: '0 0 0px rgba(242,169,59,0), 0 0 0px rgba(255,107,44,0)', duration: 1.1, stagger: 0.03, ease: 'power2.out' },
      0.8
    )
    .fromTo(rest, { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.1 }, 1.2)
    .set(chars, { clearProps: 'color,textShadow,transform' });
  return tl;
}
