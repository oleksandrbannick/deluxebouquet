// Site interactions: admin toggle, copy-to-clipboard, toast notifications
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