/**
 * Schritt 2: Energieträger, Perioden, Verbrauchsfelder.
 */

import { ENERGY_CARRIERS } from './units.js';
import { allPeriodOptions, buildThreePeriods } from './periods.js';
import { getState, patchConsumption } from './state.js';
import { validateConsumption, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError } from './utils.js';

function keepPeriodValues(oldPeriods, nextPeriods) {
  return nextPeriods.map((period, index) => {
    const prev = oldPeriods[index];
    return prev
      ? {
          ...period,
          consumption: prev.consumption,
          vacancy: prev.vacancy,
          warmWater: prev.warmWater,
        }
      : period;
  });
}

export function renderCarriers() {
  const grid = qs('#carrier-grid');
  const selected = getState().consumption.energietraeger;
  grid.innerHTML = ENERGY_CARRIERS.map(
    (c) => `<label class="choice">
      <input type="radio" name="energietraeger" value="${c.id}" ${
        c.id === selected ? 'checked' : ''
      } />
      <span>${c.label}</span>
    </label>`
  ).join('');
}

export function renderPeriodSelect() {
  const select = qs('#periodStartMonth');
  const current = Number(getState().consumption.periodStartMonth);
  select.innerHTML = allPeriodOptions()
    .map(
      (opt) =>
        `<option value="${opt.value}" ${
          opt.value === current ? 'selected' : ''
        }>${opt.label}</option>`
    )
    .join('');
}

export function renderPeriodCards() {
  const { consumption, building } = getState();
  const showWw = building.warmwasser !== 'enthalten';
  const root = qs('#periods-container');
  root.innerHTML = consumption.periods
    .map(
      (period, index) => `<article class="period-card">
      <h3>${period.label}</h3>
      <div class="grid-3">
        <div class="field">
          <label class="field__label" for="c-${index}">Verbrauch (${consumption.unit || 'kWh'})</label>
          <input class="input" id="c-${index}" type="number" min="0.01" step="0.01"
            value="${period.consumption}" data-period="${index}" data-field="consumption" required />
          <span class="field__error" data-error-for="period-${index}-consumption"></span>
        </div>
        <div class="field">
          <label class="field__label" for="v-${index}">Leerstand %</label>
          <input class="input" id="v-${index}" type="number" min="0" max="99.9" step="0.1"
            value="${period.vacancy}" data-period="${index}" data-field="vacancy" required />
          <span class="field__error" data-error-for="period-${index}-vacancy"></span>
        </div>
        ${
          showWw
            ? `<div class="field">
            <label class="field__label" for="w-${index}">Warmwasser (optional, kWh)</label>
            <input class="input" id="w-${index}" type="number" min="0" step="0.01"
              value="${period.warmWater}" data-period="${index}" data-field="warmWater" />
          </div>`
            : '<div></div>'
        }
      </div>
    </article>`
    )
    .join('');
}

export function syncPeriodsFromInputs() {
  const { consumption } = getState();
  const year = Number(qs('#startYear').value);
  const month = Number(qs('#periodStartMonth').value);
  const generated = buildThreePeriods(year, month);
  const periods = keepPeriodValues(consumption.periods, generated);
  const carrierId =
    qs('input[name="energietraeger"]:checked')?.value || consumption.energietraeger;
  const carrier = ENERGY_CARRIERS.find((c) => c.id === carrierId);
  const unit = consumption.unit && carrier?.units.some((u) => u.id === consumption.unit)
    ? consumption.unit
    : carrier?.units[0]?.id || '';
  patchConsumption({
    energietraeger: carrierId,
    unit,
    startYear: year,
    periodStartMonth: month,
    periods,
  });
  renderPeriodCards();
  renderUnitHint();
}

function renderUnitHint() {
  const { consumption } = getState();
  const carrier = ENERGY_CARRIERS.find((c) => c.id === consumption.energietraeger);
  if (!carrier) return;
  let bar = qs('#unit-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'unit-bar';
    bar.className = 'field';
    bar.style.marginTop = '1rem';
    qs('#form-consumption').insertBefore(bar, qs('#periods-container'));
  }
  bar.innerHTML = `<span class="field__label">Einheit</span>
    <div class="choice-group" role="radiogroup" aria-label="Einheit">
      ${carrier.units
        .map(
          (u) => `<label class="choice">
            <input type="radio" name="unit" value="${u.id}" ${
              u.id === consumption.unit ? 'checked' : ''
            } />
            <span>${u.label}</span>
          </label>`
        )
        .join('')}
    </div>`;
}

export function bindConsumption() {
  qs('#startYear').value = getState().consumption.startYear;
  renderCarriers();
  renderPeriodSelect();
  syncPeriodsFromInputs();

  qs('#form-consumption').addEventListener('change', (event) => {
    if (event.target.name === 'unit') {
      patchConsumption({ unit: event.target.value });
      renderPeriodCards();
      return;
    }
    if (event.target.name === 'energietraeger') {
      patchConsumption({ energietraeger: event.target.value, unit: '' });
    }
    if (
      event.target.id === 'startYear' ||
      event.target.id === 'periodStartMonth' ||
      event.target.name === 'energietraeger'
    ) {
      syncPeriodsFromInputs();
    }
  });

  qs('#periods-container').addEventListener('input', (event) => {
    const input = event.target;
    if (!input.dataset.period) return;
    const index = Number(input.dataset.period);
    const field = input.dataset.field;
    const periods = getState().consumption.periods.map((p, i) =>
      i === index ? { ...p, [field]: input.value } : p
    );
    patchConsumption({ periods });
  });
}

export function validateStepConsumption() {
  const form = qs('#form-consumption');
  clearFormErrors(form);
  const errors = validateConsumption(getState().consumption);
  Object.entries(errors).forEach(([name, message]) => {
    setFieldError(form, name, message);
  });
  return isEmpty(errors);
}
