/**
 * Info-Icons: Tooltip per Hover (Desktop) und Klick (Mobil/Tastatur).
 */

export function bindInfoTips() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.info-btn');
    if (!btn) {
      closeTips();
      return;
    }
    event.preventDefault();
    const wasOpen = btn.classList.contains('is-open');
    closeTips();
    if (!wasOpen) {
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeTips();
  });
}

function closeTips() {
  document.querySelectorAll('.info-btn.is-open').forEach((btn) => {
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  });
}
