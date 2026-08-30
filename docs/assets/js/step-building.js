/**
 * Schritt 1: Gebäudedaten.
 */

import { getState, patchBuilding } from './state.js';
import { validateBuilding, isEmpty } from './validation.js';
import { clearFormErrors, qs, qsa, setFieldError } from './utils.js';

export function readBuildingForm() {
  const form = qs('#form-building');
  const data = Object.fromEntries(new FormData(form).entries());
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
  qsa('input[type="radio"]', form).forEach((el) => {
    el.addEventListener('change', () => readBuildingForm());
  });
}
