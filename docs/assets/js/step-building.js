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

function eeUsage(form) {
  return [...form.querySelectorAll('input[name="eeVerwendung"]:checked')].map((el) => el.value);
}

function syncErneuerbare(form) {
  const art = form.elements.erneuerbareEnergienA;
  if (!art) return;
  const on = eeUsage(form).length > 0;
  art.disabled = !on;
  if (!on) art.value = '';
}

function inspectionRequired(form) {
  return Boolean(
    form.querySelector('[name="klimaanlage12kWohne"]')?.checked ||
      form.querySelector('[name="klimaanlage12kWmit"]')?.checked ||
      form.querySelector('[name="klimaanlage70kW"]')?.checked
  );
}

function syncCoolingPanel(form) {
  const panel = qs('#cooling-panel');
  if (!panel) return;
  const cooled = form.querySelector('input[name="gekuehlt"]:checked')?.value === 'ja';
  panel.hidden = !cooled;
  panel.open = cooled;
  const inspect = qs('#inspection-fields');
  if (inspect) inspect.hidden = !cooled || !inspectionRequired(form);
}

function syncRecommendations(form, event) {
  const none = form.querySelector('[name="keineEmpfehlungen"]');
  const boxes = [...form.querySelectorAll('input[name="recommendation"]')];
  if (none?.checked) {
    boxes.forEach((box) => {
      box.checked = false;
      box.disabled = true;
    });
    return;
  }
  boxes.forEach((box) => {
    box.disabled = false;
  });
  const checked = boxes.filter((box) => box.checked);
  if (event?.target?.name === 'recommendation' && checked.length > 2) {
    event.target.checked = false;
  }
}

export function readBuildingForm() {
  const form = qs('#form-building');
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.recommendation;
  delete data.kuehlungArt;
  delete data.eeVerwendung;
  data.recommendations = [...form.querySelectorAll('input[name="recommendation"]:checked')].map(
    (el) => el.value
  );
  data.keineEmpfehlungen = form.querySelector('[name="keineEmpfehlungen"]')?.checked ? '1' : '';
  data.lueftung = [...form.querySelectorAll('input[name="lueftung"]:checked')].map((el) => el.value);
  data.kuehlungArt = [...form.querySelectorAll('input[name="kuehlungArt"]:checked')].map(
    (el) => el.value
  );
  data.erneuerbareEnergien = eeUsage(form).join(' ');
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
  if (!inspectionRequired(form) || data.gekuehlt !== 'ja') {
    data.klimaanlageAnzahl = '0';
    data.klimaanlageFaelligkeit = '';
    data.baujahrKlimaanlage = '';
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
  const refresh = (event) => {
    syncRecommendations(form, event);
    syncNutzflaeche(form);
    syncErneuerbare(form);
    syncCoolingPanel(form);
    readBuildingForm();
  };
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh();
}
