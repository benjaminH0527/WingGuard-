/* ============================================================
   WingGuard · index interaction polish
   Smooth scroll (Lenis) · scroll-reveal · nav progress line
   Purely presentational — never touches app data logic.
   ============================================================ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- smooth scroll ---------- */
async function initLenis() {
  if (REDUCED) return null;
  try {
    const { default: Lenis } = await import('lenis');
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // route in-page anchors through Lenis
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.length < 2) return;
      const el = document.querySelector(href);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -72 }); }
    });

    // let inner vertical lists keep their native scroll
    document.querySelectorAll('#myObsList, #reportsQueue, #leaderboardList').forEach((el) => {
      el.setAttribute('data-lenis-prevent', '');
    });
    return lenis;
  } catch (_) { return null; }
}
initLenis();

/* ---------- scroll reveal (blur settle + stagger) ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal, [data-stagger]').forEach((el) => io.observe(el));

/* ---------- nav scroll-progress line + condensed state ---------- */
const prog = document.getElementById('navProgress');
const header = document.querySelector('header.glass-nav');
function onScroll() {
  const h = document.documentElement;
  const max = (h.scrollHeight - h.clientHeight) || 1;
  const p = Math.min(Math.max(window.scrollY / max, 0), 1);
  if (prog) prog.style.width = (p * 100).toFixed(2) + '%';
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
