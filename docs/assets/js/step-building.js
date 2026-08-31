/**
 * Schritt 1: Gebäudedaten.
 */

import { getState, patchBuilding } from './state.js';
import { validateBuilding, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError } from './utils.js';

function nutzFromWohn(wohnflaeche) {
  const living = Number(wohnflaeche);
  if (!Number.isFinite(living) || living <= 0) return '';
  return String(Math.round(living * 1.2 * 10) / 10);
}

function syncNutzflaeche(form) {
  const living = form.elements.wohnflaeche?.value;
  const nutz = nutzFromWohn(living);
  const field = form.elements.nutzflaeche;
  if (field) field.value = nutz;
  return nutz;
}

function syncErneuerbare(form) {
  const usage = form.elements.erneuerbareEnergien;
  const art = form.elements.erneuerbareEnergienA;
  if (!usage || !art) return;
  const on = Boolean(usage.value);
  art.disabled = !on;
  if (!on) art.value = '';
}

function syncCoolingPanel(form) {
  const panel = qs('#cooling-panel');
  if (!panel) return;
  const cooled = form.querySelector('input[name="gekuehlt"]:checked')?.value === 'ja';
  panel.hidden = !cooled;
  panel.open = cooled;
}

export function readBuildingForm() {
  const form = qs('#form-building');
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.recommendation;
  delete data.kuehlungArt;
  data.recommendations = [...form.querySelectorAll('input[name="recommendation"]:checked')].map(
    (el) => el.value
  );
  data.lueftung = [...form.querySelectorAll('input[name="lueftung"]:checked')].map((el) => el.value);
  data.kuehlungArt = [...form.querySelectorAll('input[name="kuehlungArt"]:checked')].map(
    (el) => el.value
  );
  data.warmwasserSolar = form.querySelector('[name="warmwasserSolar"]')?.checked ? '1' : '';
  data.klimaanlage12kWohne = form.querySelector('[name="klimaanlage12kWohne"]')?.checked ? '1' : '0';
  data.klimaanlage12kWmit = form.querySelector('[name="klimaanlage12kWmit"]')?.checked ? '1' : '0';
  data.klimaanlage70kW = form.querySelector('[name="klimaanlage70kW"]')?.checked ? '1' : '0';
  data.nutzflaeche = syncNutzflaeche(form);
  if (data.gekuehlt !== 'ja') {
    data.kuehlungArt = [];
    data.klimaanlageAnzahl = '0';
    data.klimaanlage12kWohne = '0';
    data.klimaanlage12kWmit = '0';
    data.klimaanlage70kW = '0';
  }
  if (!data.erneuerbareEnergien) data.erneuerbareEnergienA = '';
  patchBuilding(data);
  return getState().building;
}

export function applyBuildingErrors(errors) {
  const form = qs('#form-building');
  clearFormErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    if (field && typeof field.setAttribute === 'function') {
      field.setAttribute('aria-invalid', 'true');
    }
    setFieldError(form, name, message);
  });
}

export function validateStepBuilding() {
  const building = readBuildingForm();
  const errors = validateBuilding(building);
  applyBuildingErrors(errors);
  return isEmpty(errors);
}

export function bindBuildingLive() {
  const form = qs('#form-building');
  const refresh = () => {
    syncNutzflaeche(form);
    syncErneuerbare(form);
    syncCoolingPanel(form);
    readBuildingForm();
  };
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh();
}
