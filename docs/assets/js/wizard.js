/**
 * Wizard-Navigation, Stepper, Fokusverwaltung.
 */

import { getState, setStep } from './state.js';
import { qs, qsa } from './utils.js';

const STEPS = [
  { id: 1, title: 'Gebäude', sub: 'Adresse & Typ' },
  { id: 2, title: 'Verbrauch', sub: 'Energieträger' },
  { id: 3, title: 'Dokumente', sub: 'PDF-Upload' },
  { id: 4, title: 'Berechnung', sub: 'Kennwerte' },
  { id: 5, title: 'Vorschau', sub: 'Energieband' },
  { id: 6, title: 'Bestellung', sub: 'Warenkorb' },
];

export function renderStepper() {
  const list = qs('#stepper-list');
  const { step, maxReached } = getState();
  list.innerHTML = STEPS.map((item) => {
    const current = item.id === step ? 'is-current' : '';
    const done = item.id < step ? 'is-done' : '';
    const disabled = item.id > maxReached;
    return `<li class="stepper__item ${current} ${done}">
      <button type="button" data-goto="${item.id}" ${disabled ? 'disabled' : ''}
        aria-current="${item.id === step ? 'step' : 'false'}">
        <span class="stepper__num">${item.id}</span>
        <span>
          <span class="stepper__title">${item.title}</span>
          <span class="stepper__sub">${item.sub}</span>
        </span>
      </button>
    </li>`;
  }).join('');
}

export function showStep(step) {
  qsa('.panel').forEach((panel) => {
    const id = Number(panel.dataset.step);
    panel.hidden = id !== step;
  });
  setStep(step);
  renderStepper();
  const heading = qs(`.panel[data-step="${step}"] h1`);
  if (heading) heading.focus?.();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function bindStepper(canEnterStep) {
  qs('#stepper-list').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-goto]');
    if (!btn || btn.disabled) return;
    const next = Number(btn.dataset.goto);
    if (canEnterStep(next)) showStep(next);
  });
}
