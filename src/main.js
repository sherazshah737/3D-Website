// ---------------------------------------------------------------------------
// Nav: scrolled state + mobile burger menu
// ---------------------------------------------------------------------------
const nav = document.getElementById('nav');
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

function updateNavState() {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
}
updateNavState();

burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

mobileMenu.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ---------------------------------------------------------------------------
// Hero scroll-scrub: the hero is a tall (340vh) scroll track with a sticky
// inner stage. As the user scrolls through that track, the promo video's
// currentTime is driven directly by scroll progress — true frame-accurate
// scrubbing, not just autoplay behind a parallax layer. The opening ~9s of
// the clip is used as the "scrub window" (Seedance-clip-length feel); the
// title fades in, holds, then fades out as the scrub completes and the
// page moves on to the Story section.
// ---------------------------------------------------------------------------
const heroSection = document.querySelector('.hero');
const heroVideo = document.getElementById('heroVideo');
const heroContent = document.getElementById('heroContent');
const heroScrollcue = document.getElementById('heroScrollcue');

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

const SCRUB_WINDOW_SECONDS = 9;
let scrubDuration = SCRUB_WINDOW_SECONDS;
let videoReady = false;

heroVideo.addEventListener('loadedmetadata', () => {
  scrubDuration = Math.min(SCRUB_WINDOW_SECONDS, heroVideo.duration || SCRUB_WINDOW_SECONDS);
  videoReady = true;
  applyHeroScrub();
});

function heroProgress() {
  const rect = heroSection.getBoundingClientRect();
  const scrollable = heroSection.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return clamp(-rect.top / scrollable, 0, 1);
}

let ticking = false;
function onScroll() {
  updateNavState();
  if (!ticking) {
    requestAnimationFrame(applyHeroScrub);
    ticking = true;
  }
}

function applyHeroScrub() {
  ticking = false;
  const p = heroProgress();

  if (videoReady) {
    heroVideo.currentTime = p * scrubDuration;
  }

  // title/tagline/CTA track in on load (handled by .reveal-up), then fade
  // away as soon as scrolling starts so the scrubbing video carries the rest
  const contentOpacity = 1 - clamp(p / 0.15, 0, 1);
  heroContent.style.opacity = String(contentOpacity);
  heroContent.style.transform = `translateY(${-p * 120}px)`;

  heroScrollcue.style.opacity = String(1 - clamp(p / 0.1, 0, 1));
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', applyHeroScrub);
applyHeroScrub();

// ---------------------------------------------------------------------------
// Reveal-on-scroll
// ---------------------------------------------------------------------------
const revealEls = document.querySelectorAll('.reveal, .reveal-up');
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
);
revealEls.forEach((el) => io.observe(el));

// ---------------------------------------------------------------------------
// Reservation form
// ---------------------------------------------------------------------------
const form = document.getElementById('reserveForm');
const status = document.getElementById('formStatus');
const dateInput = document.getElementById('resDate');

if (dateInput) {
  const today = new Date();
  dateInput.min = today.toISOString().split('T')[0];
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    status.textContent = `Thank you, ${data.name.split(' ')[0]} — table for ${data.party} requested on ${data.date} at ${data.time}. We'll confirm by phone shortly.`;
    form.reset();
    dateInput.min = new Date().toISOString().split('T')[0];
  });
}

// ---------------------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------------------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
