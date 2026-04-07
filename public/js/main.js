// ── Nav toggle (mobile) ────────────────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// ── Active nav link ────────────────────────────────────────────────────────
const links = document.querySelectorAll('.nav-links a');
const path = window.location.pathname;
links.forEach(link => {
  const href = link.getAttribute('href');
  if (href === path || (href !== '/' && path.startsWith(href))) {
    link.classList.add('active');
  }
});

// ── Scroll reveal ──────────────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.noticia-card, .producto-card, .patrocinador-card, .tabla-jugadores tr').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ── Contador animado (stats del hero) ─────────────────────────────────────
function animarContadores() {
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = Math.ceil(target / 50);
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current + (el.dataset.suffix || '');
      if (current >= target) clearInterval(interval);
    }, 30);
  });
}

// Trigger on page load
window.addEventListener('load', () => {
  setTimeout(animarContadores, 400);
});

// ── Carrusel Virolos ───────────────────────────────────────────────────────
(function () {
  const track    = document.getElementById('virolo-track');
  const viewport = document.getElementById('virolo-viewport');
  const btnPrev  = document.getElementById('virolo-prev');
  const btnNext  = document.getElementById('virolo-next');
  const dotsWrap = document.getElementById('virolo-dots');
  if (!track) return;

  const cards = track.querySelectorAll('.virolo-card');
  const total = cards.length;
  let current = 0;
  let autoTimer;

  function visibles() {
    const vw = viewport.offsetWidth;
    const cw = cards[0].offsetWidth;
    return Math.round(vw / cw);
  }

  function maxIndex() { return Math.max(0, total - visibles()); }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));
    const cw = cards[0].offsetWidth + 1; // +1 for the gap (1px background)
    track.style.transform = 'translateX(-' + (current * cw) + 'px)';
    dotsWrap.querySelectorAll('.virolo-dot').forEach((d, i) => {
      d.classList.toggle('activo', i === current);
    });
    btnPrev.disabled = current === 0;
    btnNext.disabled = current >= maxIndex();
  }

  // Build dots
  for (let i = 0; i < total; i++) {
    const d = document.createElement('button');
    d.className = 'virolo-dot' + (i === 0 ? ' activo' : '');
    d.setAttribute('aria-label', 'Ir al ' + (i + 1));
    d.addEventListener('click', () => { goTo(i); resetAuto(); });
    dotsWrap.appendChild(d);
  }

  btnPrev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  btnNext.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  // Touch / swipe
  let touchX = null;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) dx < 0 ? goTo(current + 1) : goTo(current - 1);
    touchX = null;
    resetAuto();
  });

  // Auto-advance
  function startAuto() {
    autoTimer = setInterval(() => {
      goTo(current >= maxIndex() ? 0 : current + 1);
    }, 3800);
  }
  function resetAuto() { clearInterval(autoTimer); startAuto(); }

  viewport.addEventListener('mouseenter', () => clearInterval(autoTimer));
  viewport.addEventListener('mouseleave', startAuto);

  window.addEventListener('resize', () => goTo(Math.min(current, maxIndex())));

  goTo(0);
  startAuto();
})();
