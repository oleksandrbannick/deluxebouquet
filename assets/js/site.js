// Site interactions: admin toggle, copy-to-clipboard, toast notifications, visual upgrades
document.addEventListener('click', (e) => {
  // Admin toggle
  if (e.target && e.target.id === 'admin-toggle') {
    const btn = e.target;
    const link = document.getElementById('admin-link');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if (link) {
      link.hidden = expanded; // show when not expanded
    }
  }

  // Copy buttons for contact info
  if (e.target && e.target.classList.contains('copy-btn')) {
    const text = e.target.dataset.copy || '';
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
      }).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }
});

// Close admin link on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const btn = document.getElementById('admin-toggle');
    const link = document.getElementById('admin-link');
    if (btn && link && !link.hidden) {
      link.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }
    // Close lightbox on Escape
    const lightbox = document.getElementById('lightbox');
    if (lightbox && lightbox.classList.contains('active')) {
      lightbox.classList.remove('active');
    }
  }
});

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); showToast('Copied to clipboard'); } catch (err) { alert('Copy failed: ' + err); }
  document.body.removeChild(el);
}

function showToast(msg) {
  const existing = document.getElementById('site-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'site-toast';
  t.className = 'site-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('visible'), 20);
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2200);
}

// ===== UPGRADE 1: Scroll-Reveal Animations =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ===== UPGRADE 2: Sticky Header that Shrinks =====
(function () {
  const header = document.getElementById('site-header');
  const spacer = document.getElementById('header-spacer');
  if (!header || !spacer) return;

  let headerHeight = header.offsetHeight;
  let isScrolled = false;

  function onScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    if (scrollY > 80 && !isScrolled) {
      isScrolled = true;
      headerHeight = header.offsetHeight;
      header.classList.add('scrolled');
      spacer.classList.add('active');
      spacer.style.height = headerHeight + 'px';
    } else if (scrollY <= 80 && isScrolled) {
      isScrolled = false;
      header.classList.remove('scrolled');
      spacer.classList.remove('active');
      spacer.style.height = '0';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ===== UPGRADE 3: Image Lightbox =====
(function () {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg = lightbox.querySelector('img');
  const lbCaption = lightbox.querySelector('.lightbox-caption');
  const lbClose = lightbox.querySelector('.lightbox-close');

  document.addEventListener('click', (e) => {
    // Open lightbox when clicking product card images
    const img = e.target.closest('.product-card img');
    if (img) {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCaption.textContent = img.alt;
      lightbox.classList.add('active');
    }
  });

  // Close lightbox
  lbClose.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
  });
})();

// ===== UPGRADE 5: Petal Animation in Hero =====
(function () {
  const hero = document.getElementById('hero-section');
  if (!hero) return;

  function createPetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';
    petal.style.left = Math.random() * 100 + '%';
    petal.style.width = (8 + Math.random() * 10) + 'px';
    petal.style.height = petal.style.width;
    const duration = 6 + Math.random() * 8;
    petal.style.animationDuration = duration + 's';
    petal.style.animationDelay = Math.random() * 2 + 's';
    hero.appendChild(petal);
    setTimeout(() => petal.remove(), (duration + 2) * 1000);
  }

  // Create petals periodically
  setInterval(createPetal, 800);
  // Start with a few
  for (let i = 0; i < 6; i++) {
    setTimeout(createPetal, i * 300);
  }
})();

// ===== UPGRADE 6: Back-to-Top Button =====
(function () {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if ((window.scrollY || window.pageYOffset) > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
