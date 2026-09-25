// Low-power path for the hero: a looping video (or the static poster when the
// visitor prefers reduced motion / has Save-Data on).
import { CONFIG } from './config.js';

export function mountHeroVideo(device) {
  if (device.reducedMotion || device.saveData) return; // poster only
  const stage = document.querySelector('.hero__stage');
  const video = document.createElement('video');
  video.className = 'hero__video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = 'auto';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.poster = matchMedia('(max-width: 700px)').matches ? '/images/hero-poster-mobile.webp' : '/images/hero-poster.webp';
  for (const s of CONFIG.heroVideo) {
    const source = document.createElement('source');
    source.src = s.src;
    source.type = s.type;
    video.appendChild(source);
  }
  video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
  stage.insertBefore(video, stage.querySelector('.hero__canvas'));
  video.play().catch(() => {});

  // don't burn battery decoding video nobody can see
  new IntersectionObserver(([e]) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())).observe(stage);
}
