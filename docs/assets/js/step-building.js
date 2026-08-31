/**
 * Schritt 1: Gebäudedaten.
 */

import { getState, patchBuilding } from './state.js';
import { validateBuilding, isEmpty } from './validation.js';
import { clearFormErrors, qs, qsa, setFieldError } from './utils.js';

export function readBuildingForm() {
  const form = qs('#form-building');
  const data = Object.fromEntries(new FormData(form).entries());
  delete data.recommendation;
  data.recommendations = [...form.querySelectorAll('input[name="recommendation"]:checked')].map(
    (el) => el.value
  );
  data.warmwasserSolar = form.querySelector('[name="warmwasserSolar"]')?.checked ? '1' : '';
  const living = Number(data.wohnflaeche);
  if ((!data.nutzflaeche || data.nutzflaeche === '') && Number.isFinite(living) && living > 0) {
    data.nutzflaeche = String(Math.round(living * 1.2 * 10) / 10);
  }
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
  form.addEventListener('input', () => readBuildingForm());
  form.addEventListener('change', () => readBuildingForm());
}
