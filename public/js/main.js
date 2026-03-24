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
