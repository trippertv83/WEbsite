/**
 * Wizard-Navigation, Stepper, Fokusverwaltung.
 */

import { getState, setStep } from './state.js';
import { qs, qsa } from './utils.js';

const STEPS = [
  { id: 1, title: 'Objektdaten', sub: 'Adresse & Gebäude', icon: 'home' },
  { id: 2, title: 'Wärmeverbrauch', sub: 'Energieträger', icon: 'flame' },
  { id: 3, title: 'Leerstand & Energienutzung', sub: 'Unterlagen', icon: 'leaf' },
  { id: 4, title: 'Bauteile', sub: 'Kennwerte', icon: 'layers' },
  { id: 5, title: 'Ausweisübersicht', sub: 'Energieband', icon: 'chart' },
  { id: 6, title: 'Abrechnung & Lieferung', sub: 'Bestellung', icon: 'box' },
];

const ICONS = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 3 10.2V21h6.2v-6.5h5.6V21H21V10.2L12 3z"/></svg>',
  flame:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2s4 4.2 4 8.2c0 2.4-1.4 4.4-3.3 5.3.6-1.1.9-2.3.7-3.6-.3-1.8-1.6-3.2-3.4-3.9C11.6 11.2 10 14 10 16.4 10 19.5 12.2 22 12 22c4.4 0 8-3.4 8-8.2C20 8 12 2 12 2z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 19c6-1 11-6 13-13-7 2-12 7-13 13zm4.2-3.2c2.3-2.7 5.3-4.8 8.8-6.1-1.4 3.4-3.6 6.3-6.4 8.4-1 .7-2 .8-2.4-2.3z"/></svg>',
  layers:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 2 8l10 5 10-5-10-5zm0 9.2L4.2 8.4 12 12.4l7.8-4L12 12.2zM4.2 13.2 12 17.2l7.8-4v2.2L12 19.6 4.2 15.4v-2.2z"/></svg>',
  chart:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 19h16v2H4v-2zm2-2V9h3v8H6zm5 0V5h3v12h-3zm5 0v-6h3v6h-3z"/></svg>',
  box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9zm9 2.2 6.2-3.1L12 3.6 5.8 6.6 12 9.7zm-7 1.4v6.3l6 3V13l-6-1.9zm8 9.3 6-3v-6.3L13 13v7.4z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.2 16.6 5 12.4l1.4-1.4 2.8 2.8 8.4-8.4L19 7l-9.8 9.6z"/></svg>',
};

function updateProgress(step) {
  const pct = Math.round((step / STEPS.length) * 100);
  const label = qs('#progress-step-label');
  const pctEl = qs('#progress-pct');
  const fill = qs('#progress-fill');
  const bar = qs('#wizard-progress-bar');
  if (label) label.textContent = `Schritt ${step} von ${STEPS.length}`;
  if (pctEl) pctEl.textContent = `${pct} % abgeschlossen`;
  if (fill) fill.style.width = `${pct}%`;
  if (bar) {
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuetext', `Schritt ${step} von ${STEPS.length}, ${pct} Prozent`);
  }
}

export function renderStepper() {
  const list = qs('#stepper-list');
  if (!list) return;
  const { step, maxReached } = getState();
  list.innerHTML = STEPS.map((item) => {
    const current = item.id === step ? 'is-current' : '';
    const done = item.id < step ? 'is-done' : '';
    const disabled = item.id > maxReached;
    const mark = item.id < step ? ICONS.check : ICONS[item.icon];
    return `<li class="stepper__item ${current} ${done}">
      <button type="button" data-goto="${item.id}" ${disabled ? 'disabled' : ''}
        aria-current="${item.id === step ? 'step' : 'false'}">
        <span class="stepper__num">${mark}</span>
        <span>
          <span class="stepper__kicker">${item.id < step ? 'Erledigt' : `Schritt ${item.id}`}</span>
          <span class="stepper__title">${item.title}</span>
          <span class="stepper__sub">${item.sub}</span>
        </span>
      </button>
    </li>`;
  }).join('');
  updateProgress(step);
}

export function showStep(step) {
  qsa('.panel[data-step]').forEach((panel) => {
    const id = Number(panel.dataset.step);
    panel.hidden = id !== step;
  });
  setStep(step);
  renderStepper();
  const heading = qs(`.panel[data-step="${step}"] h1`);
  if (heading) heading.focus?.();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function bindStepper(canEnterStep, onEnter) {
  const list = qs('#stepper-list');
  if (!list) return;
  list.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-goto]');
    if (!btn || btn.disabled) return;
    const next = Number(btn.dataset.goto);
    if (canEnterStep(next)) {
      showStep(next);
      onEnter?.(next);
    }
  });
}
