/**
 * Schritt 2: Energieträger, Perioden, Verbrauchsfelder.
 */

import { ENERGY_CARRIERS } from './units.js';
import { allPeriodOptions, buildThreePeriods } from './periods.js';
import {
  emptyLager,
  encodeLagerHsv,
  fillVolumeLiters,
  isStorableCarrier,
  lagerConsumption,
  litersToStock,
  periodsFromLager,
  tankVolumeLiters,
  unitLabel,
} from './lager.js';
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

function currentLager() {
  return { ...emptyLager(), ...(getState().consumption.lager || {}) };
}

function readLagerForm() {
  const prev = currentLager();
  return {
    ...prev,
    anfangDatum: qs('#lager-anfang-datum')?.value || prev.anfangDatum,
    anfangBestand: qs('#lager-anfang-bestand')?.value || '',
    endeDatum: qs('#lager-ende-datum')?.value || prev.endeDatum,
    endeBestand: qs('#lager-ende-bestand')?.value || '',
    zukaeufe: [0, 1, 2].map((i) => ({
      datum: qs(`#lager-z${i}-datum`)?.value || '',
      menge: qs(`#lager-z${i}-menge`)?.value || '',
    })),
    tankform: qs('input[name="tankform"]:checked')?.value || prev.tankform,
    maxLager: qs('#lager-max')?.value || prev.maxLager,
    breite: qs('#tank-breite')?.value || prev.breite,
    tiefe: qs('#tank-tiefe')?.value || prev.tiefe,
    hoehe: qs('#tank-hoehe')?.value || prev.hoehe,
    durchmesser: qs('#tank-durchmesser')?.value || prev.durchmesser,
    laenge: qs('#tank-laenge')?.value || prev.laenge,
    fuellAnfang: qs('#lager-fuell-anfang')?.value || '',
    fuellEnde: qs('#lager-fuell-ende')?.value || '',
  };
}

function writeLagerForm(lager) {
  const set = (id, value) => {
    const el = qs(id);
    if (el && value != null) el.value = value;
  };
  set('#lager-anfang-datum', lager.anfangDatum);
  set('#lager-anfang-bestand', lager.anfangBestand);
  set('#lager-ende-datum', lager.endeDatum);
  set('#lager-ende-bestand', lager.endeBestand);
  set('#lager-max', lager.maxLager);
  set('#lager-fuell-anfang', lager.fuellAnfang);
  set('#lager-fuell-ende', lager.fuellEnde);
  (lager.zukaeufe || []).forEach((row, i) => {
    set(`#lager-z${i}-datum`, row.datum);
    set(`#lager-z${i}-menge`, row.menge);
  });
  const formRadio = qs(`input[name="tankform"][value="${lager.tankform || 'rechteck'}"]`);
  if (formRadio) formRadio.checked = true;
}

function renderTankDims(lager) {
  const root = qs('#tank-dims');
  if (!root) return;
  const form = lager.tankform || 'rechteck';
  if (form === 'rechteck') {
    root.innerHTML = `
      <div class="field"><label class="field__label" for="tank-breite">Breite b (cm)</label>
        <input class="input" id="tank-breite" type="number" min="0" step="0.1" value="${lager.breite || ''}" /></div>
      <div class="field"><label class="field__label" for="tank-tiefe">Tiefe t (cm)</label>
        <input class="input" id="tank-tiefe" type="number" min="0" step="0.1" value="${lager.tiefe || ''}" /></div>
      <div class="field"><label class="field__label" for="tank-hoehe">Höhe h (cm)</label>
        <input class="input" id="tank-hoehe" type="number" min="0" step="0.1" value="${lager.hoehe || ''}" /></div>`;
    return;
  }
  if (form === 'liegend') {
    root.innerHTML = `
      <div class="field"><label class="field__label" for="tank-durchmesser">Durchmesser (cm)</label>
        <input class="input" id="tank-durchmesser" type="number" min="0" step="0.1" value="${lager.durchmesser || ''}" /></div>
      <div class="field"><label class="field__label" for="tank-laenge">Länge (cm)</label>
        <input class="input" id="tank-laenge" type="number" min="0" step="0.1" value="${lager.laenge || ''}" /></div>`;
    return;
  }
  root.innerHTML = `
    <div class="field"><label class="field__label" for="tank-durchmesser">Durchmesser (cm)</label>
      <input class="input" id="tank-durchmesser" type="number" min="0" step="0.1" value="${lager.durchmesser || ''}" /></div>
    <div class="field"><label class="field__label" for="tank-hoehe">Höhe h (cm)</label>
      <input class="input" id="tank-hoehe" type="number" min="0" step="0.1" value="${lager.hoehe || ''}" /></div>`;
}

function applyTankFill(target) {
  const lager = readLagerForm();
  const fill = target === 'ende' ? lager.fuellEnde : lager.fuellAnfang;
  const liters = fillVolumeLiters(lager, fill);
  const { consumption } = getState();
  const stock = Math.round(litersToStock(liters, consumption.energietraeger, consumption.unit) * 100) / 100;
  if (target === 'ende') {
    qs('#lager-ende-bestand').value = String(stock);
  } else {
    qs('#lager-anfang-bestand').value = String(stock);
  }
  previewLager();
}

function previewLager() {
  const { consumption } = getState();
  const lager = readLagerForm();
  const total = lagerConsumption(lager);
  const unit = unitLabel(consumption.unit);
  const liters = tankVolumeLiters(lager);
  const result = qs('#lager-result');
  if (result) {
    result.textContent = `Ermittelter Verbrauch: ${total.toLocaleString('de-DE', {
      maximumFractionDigits: 2,
    })} ${unit}`;
  }
  const vol = qs('#tank-volume');
  if (vol) vol.textContent = `Tankvolumen: ${Math.round(liters)} Liter`;
  return { lager, total };
}

function applyLager() {
  const { consumption } = getState();
  const { lager, total } = previewLager();
  const periods = periodsFromLager(lager, total);
  if (!periods.length || total <= 0) return false;
  patchConsumption({
    useLager: true,
    lager: { ...lager, consumption: total, hsv: encodeLagerHsv(lager) },
    periods,
    startYear: periods[0]?.from?.year || consumption.startYear,
  });
  if (qs('#startYear') && periods[0]?.from?.year) {
    qs('#startYear').value = String(periods[0].from.year);
  }
  renderPeriodCards();
  return true;
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

function lagerDialog() {
  return qs('#lager-dialog');
}

function toggleLagerUi() {
  const { consumption } = getState();
  const storable = isStorableCarrier(consumption.energietraeger);
  const wrap = qs('#lager-open-wrap');
  if (wrap) wrap.hidden = !storable;
  const setup = qs('#period-setup');
  if (setup) setup.hidden = false;
}

function openLagerDialog() {
  const lager = currentLager();
  writeLagerForm(lager);
  renderTankDims(lager);
  previewLager();
  const dialog = lagerDialog();
  if (dialog?.showModal) dialog.showModal();
}

function closeLagerDialog() {
  const dialog = lagerDialog();
  if (dialog?.open) dialog.close();
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
    useLager: isStorableCarrier(carrierId) ? consumption.useLager : false,
  });
  renderPeriodCards();
  renderUnitHint();
  toggleLagerUi();
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
    qs('#form-consumption').insertBefore(bar, qs('#lager-open-wrap') || qs('#periods-container'));
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
  const state = getState();
  if (!state.consumption.lager) patchConsumption({ lager: emptyLager() });
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
      patchConsumption({ energietraeger: event.target.value, unit: '', useLager: false });
    }
    if (
      event.target.id === 'startYear' ||
      event.target.id === 'periodStartMonth' ||
      event.target.name === 'energietraeger'
    ) {
      syncPeriodsFromInputs();
    }
  });

  qs('#btn-open-lager')?.addEventListener('click', openLagerDialog);
  qs('#btn-lager-cancel')?.addEventListener('click', closeLagerDialog);
  qs('#btn-lager-apply')?.addEventListener('click', () => {
    if (applyLager()) closeLagerDialog();
  });
  lagerDialog()?.addEventListener('change', (event) => {
    if (event.target.name === 'tankform') {
      renderTankDims(readLagerForm());
    }
    previewLager();
  });
  lagerDialog()?.addEventListener('input', previewLager);
  lagerDialog()?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-tank-target]');
    if (!btn) return;
    applyTankFill(btn.dataset.tankTarget);
  });

  qs('#periods-container').addEventListener('input', (event) => {
    const input = event.target;
    if (!input.dataset.period) return;
    const index = Number(input.dataset.period);
    const field = input.dataset.field;
    const periods = getState().consumption.periods.map((p, i) =>
      i === index ? { ...p, [field]: input.value } : p
    );
    patchConsumption({ periods, useLager: false });
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
