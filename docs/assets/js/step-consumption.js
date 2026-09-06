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
import { getState, patchBuilding, patchConsumption } from './state.js';
import { validateConsumption, validateExtraPlants, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError } from './utils.js';
import { readBuildingForm, applyBuildingErrors } from './step-building.js';

function keepPeriodValues(oldPeriods, nextPeriods) {
  return nextPeriods.map((period, index) => {
    const prev = oldPeriods[index];
    return prev
      ? {
          ...period,
          consumption: prev.consumption,
          consumption2: prev.consumption2 || '',
          consumption3: prev.consumption3 || '',
          consumption4: prev.consumption4 || '',
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
  const prevPeriods = consumption.periods;
  const periods = periodsFromLager(lager, total).map((period, index) => ({
    ...period,
    consumption2: prevPeriods[index]?.consumption2 || '',
    consumption3: prevPeriods[index]?.consumption3 || '',
    consumption4: prevPeriods[index]?.consumption4 || '',
  }));
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
    (c) => `<label class="choice choice-card">
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

function plantCount() {
  return Math.min(4, Math.max(1, Number(getState().building.anzahlHeizungsanlagen) || 1));
}

function readExtraPlantsFromForm() {
  const prev = getState().consumption.extraPlants || [];
  return [2, 3, 4].map((number, index) => {
    const carrier =
      qs(`input[name="anlage${number}Energietraeger"]:checked`)?.value ||
      qs(`[name="anlage${number}Energietraeger"]`)?.value ||
      prev[index]?.energietraeger ||
      '';
    const carrierInfo = ENERGY_CARRIERS.find((item) => item.id === carrier);
    const selectedUnit = qs(`input[name="anlage${number}Unit"]:checked`)?.value || prev[index]?.unit || '';
    const unit =
      carrierInfo?.units.some((item) => item.id === selectedUnit)
        ? selectedUnit
        : carrierInfo?.units[0]?.id || '';
    return {
      energietraeger: carrier,
      unit,
      baujahr: qs(`#anlage${number}Baujahr`)?.value || prev[index]?.baujahr || '',
    };
  });
}

function extraCarrierGrid(number, selected) {
  return ENERGY_CARRIERS.map(
    (c) => `<label class="choice choice-card">
      <input type="radio" name="anlage${number}Energietraeger" value="${c.id}" ${
        c.id === selected ? 'checked' : ''
      } />
      <span>${c.label}</span>
    </label>`
  ).join('');
}

function extraUnitGrid(number, carrierId, selectedUnit) {
  const carrier = ENERGY_CARRIERS.find((item) => item.id === carrierId);
  if (!carrier) return '<p class="field__hint">Zuerst Energieträger wählen.</p>';
  const unit = carrier.units.some((item) => item.id === selectedUnit)
    ? selectedUnit
    : carrier.units[0].id;
  return `<div class="choice-group" role="radiogroup" aria-label="Einheit Anlage ${number}">
    ${carrier.units
      .map(
        (u) => `<label class="choice choice-card" style="flex:1;min-width:7rem">
          <input type="radio" name="anlage${number}Unit" value="${u.id}" ${
            u.id === unit ? 'checked' : ''
          } />
          <span>${u.label}</span>
        </label>`
      )
      .join('')}
  </div>
  <span class="field__error" data-error-for="anlage${number}Unit"></span>`;
}

function renderExtraAnlagen() {
  const root = qs('#extra-anlagen');
  if (!root) return;
  const n = plantCount();
  const plants = readExtraPlantsFromForm();
  patchConsumption({ extraPlants: plants });
  root.innerHTML = [2, 3, 4]
    .map((number) => {
      const plant = plants[number - 2] || {};
      return `<div class="anlage-box" id="anlage-${number}" ${n < number ? 'hidden' : ''}>
        <h3>Anlage ${number}</h3>
        <div class="field">
          <span class="field__label"><span class="req" aria-hidden="true">*</span>Energieträger</span>
          <div class="carrier-grid" role="radiogroup">${extraCarrierGrid(number, plant.energietraeger)}</div>
          <span class="field__error" data-error-for="anlage${number}Energietraeger"></span>
        </div>
        <div class="field" style="margin-top: 0.85rem">
          <span class="field__label"><span class="req" aria-hidden="true">*</span>Einheit</span>
          ${extraUnitGrid(number, plant.energietraeger, plant.unit)}
        </div>
        <div class="field" style="margin-top: 0.85rem">
          <label class="field__label" for="anlage${number}Baujahr">Baujahr</label>
          <input class="input" id="anlage${number}Baujahr" name="anlage${number}Baujahr" type="number" min="1800" max="2026" value="${plant.baujahr || ''}" />
        </div>
      </div>`;
    })
    .join('');
}

export function renderPeriodCards() {
  const { consumption, building } = getState();
  const showWw = building.warmwasser !== 'enthalten';
  const extras = plantCount();
  const extraPlants = consumption.extraPlants || [];
  const root = qs('#periods-container');
  root.innerHTML = consumption.periods
    .map((period, index) => {
      let extraFields = '';
      for (let number = 2; number <= extras; number += 1) {
        const plant = extraPlants[number - 2] || {};
        const unit = plant.unit || 'kWh';
        const field = `consumption${number}`;
        extraFields += `<div class="field">
          <label class="field__label" for="c${number}-${index}"><span class="req" aria-hidden="true">*</span>Verbrauch Anlage ${number} (${unit})</label>
          <input class="input" id="c${number}-${index}" type="number" min="0.01" step="0.01"
            value="${period[field] || ''}" data-period="${index}" data-field="${field}" required />
          <span class="field__error" data-error-for="period-${index}-${field}"></span>
        </div>`;
      }
      return `<article class="period-card">
      <h3>${period.label}</h3>
      <div class="grid-3">
        <div class="field">
          <div class="label-line">
            <label class="field__label" for="c-${index}"><span class="req" aria-hidden="true">*</span>Verbrauch Anlage 1 (${consumption.unit || 'kWh'})</label>
            ${
              index === 0
                ? `<button type="button" class="info-btn" aria-label="Hinweis zum Verbrauch" aria-expanded="false">i<span class="info-pop" role="tooltip">Je Anlage den Jahresverbrauch des ganzen Gebäudes eintragen – keine Monatswerte. Mehrere Anlagen werden addiert.</span></button>`
                : ''
            }
          </div>
          <input class="input" id="c-${index}" type="number" min="0.01" step="0.01"
            value="${period.consumption}" data-period="${index}" data-field="consumption" required />
          <span class="field__error" data-error-for="period-${index}-consumption"></span>
        </div>
        ${extraFields}
        <div class="field">
          <label class="field__label" for="v-${index}"><span class="req" aria-hidden="true">*</span>Leerstand %</label>
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
            : ''
        }
      </div>
    </article>`;
    })
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
  bar.innerHTML = `<div class="label-line">
      <span class="field__label" id="unit-label"><span class="req" aria-hidden="true">*</span>Einheit</span>
      <button type="button" class="info-btn" aria-label="Hinweis zur Einheit" aria-expanded="false">
        i
        <span class="info-pop" role="tooltip">Verwenden Sie dieselbe Einheit wie auf der Rechnung. Bei Erdgas in kWh kann zusätzlich der Brennwert (Hs) oder Heizwert (Hi) relevant sein.</span>
      </button>
    </div>
    <div class="choice-group" role="radiogroup" aria-labelledby="unit-label">
      ${carrier.units
        .map(
          (u) => `<label class="choice choice-card" style="flex:1;min-width:7rem">
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
    if (event.target.name === 'anzahlHeizungsanlagen' || event.target.name === 'heizzweck') {
      syncPlantCount();
      readBuildingForm();
      return;
    }
    if (/^anlage[2-4]Energietraeger$/.test(event.target.name)) {
      const plants = readExtraPlantsFromForm();
      patchConsumption({ extraPlants: plants });
      renderExtraAnlagen();
      renderPeriodCards();
      return;
    }
    if (/^anlage[2-4]Unit$/.test(event.target.name)) {
      patchConsumption({ extraPlants: readExtraPlantsFromForm() });
      renderPeriodCards();
      return;
    }
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

  qs('#form-consumption').addEventListener('input', (event) => {
    if (event.target.name === 'baujahrHeizung' || String(event.target.name || '').startsWith('anlage')) {
      if (String(event.target.name || '').startsWith('anlage')) {
        patchConsumption({ extraPlants: readExtraPlantsFromForm() });
      }
      readBuildingForm();
    }
  });
  syncPlantCount();

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

function syncPlantCount() {
  const n = Number(qs('input[name="anzahlHeizungsanlagen"]:checked')?.value || 1);
  patchBuilding({ anzahlHeizungsanlagen: String(n) });
  patchConsumption({ extraPlants: readExtraPlantsFromForm() });
  renderExtraAnlagen();
  renderPeriodCards();
}

export function validateStepConsumption() {
  const form = qs('#form-consumption');
  clearFormErrors(form);
  const building = readBuildingForm();
  const heatErrors = {};
  const plants = Number(building.anzahlHeizungsanlagen);
  if (!Number.isFinite(plants) || plants < 1 || plants > 4) {
    heatErrors.anzahlHeizungsanlagen = 'Bitte die Anzahl der Heizungsanlagen wählen.';
  }
  const heatYear = Number(building.baujahrHeizung);
  if (heatYear < 1800 || heatYear > 2026) {
    heatErrors.baujahrHeizung = 'Baujahr der Heizung prüfen.';
  }
  applyBuildingErrors(heatErrors);
  const consumptionState = {
    ...getState().consumption,
    extraPlants: readExtraPlantsFromForm(),
  };
  patchConsumption({ extraPlants: consumptionState.extraPlants });
  const errors = {
    ...validateConsumption(consumptionState),
    ...validateExtraPlants(consumptionState, plants),
  };
  Object.entries(errors).forEach(([name, message]) => {
    setFieldError(form, name, message);
  });
  return isEmpty(errors) && isEmpty(heatErrors);
}
