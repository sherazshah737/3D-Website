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
// Hero scroll-scrub parallax: video drifts/scales, text fades & lifts as the
// hero is scrolled through — a lightweight, dependency-free stand-in for
// true frame-sequence scrubbing (kept to one real clip, no frame extraction
// tooling in this environment).
// ---------------------------------------------------------------------------
const heroMedia = document.getElementById('heroMedia');
const heroContent = document.querySelector('.hero__content');
const heroSection = document.querySelector('.hero');

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

let ticking = false;
function onScroll() {
  updateNavState();
  if (!ticking) {
    requestAnimationFrame(applyParallax);
    ticking = true;
  }
}

function applyParallax() {
  ticking = false;
  const vh = window.innerHeight;
  const heroHeight = heroSection.offsetHeight;
  const p = clamp(window.scrollY / heroHeight, 0, 1);

  const scale = 1.06 + p * 0.14;
  const translateY = p * 90;
  heroMedia.style.transform = `translateY(${translateY}px) scale(${scale})`;

  const contentP = clamp(window.scrollY / (vh * 0.7), 0, 1);
  heroContent.style.opacity = String(1 - contentP);
  heroContent.style.transform = `translateY(${contentP * -60}px)`;
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', applyParallax);
applyParallax();

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
