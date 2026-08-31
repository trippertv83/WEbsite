/**
 * Registrierung vor dem Erfassungsbogen.
 * Daten gehen nur über das Wix-Backend an SevDesk – kein Token im Browser.
 */

import { getState, patch, patchCustomer } from './state.js';
import { validateRegistration, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError, showToast } from './utils.js';
import { registerCustomer } from './api-client.js';

export function readRegisterForm() {
  const form = qs('#form-register');
  const data = Object.fromEntries(new FormData(form).entries());
  patchCustomer({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    email: data.email || '',
    strasse: data.strasse || '',
    hausnummer: data.hausnummer || '',
    plz: data.plz || '',
    ort: data.ort || '',
    acceptRegisterPrivacy: Boolean(form.querySelector('#accept-register-privacy')?.checked),
  });
  return getState().customer;
}

export function applyRegisterErrors(errors) {
  const form = qs('#form-register');
  clearFormErrors(form);
  Object.entries(errors).forEach(([name, message]) => {
    const field = form.elements[name];
    if (field && typeof field.setAttribute === 'function') {
      field.setAttribute('aria-invalid', 'true');
    }
    setFieldError(form, name, message);
  });
}

export function showWizard() {
  document.body.classList.remove('is-register-only');
  qs('#register-gate').hidden = true;
  qs('#wizard-app').hidden = false;
  patch({ registered: true });
}

export async function submitRegistration() {
  const customer = readRegisterForm();
  const errors = validateRegistration(customer);
  applyRegisterErrors(errors);
  if (!isEmpty(errors)) return false;

  const btn = qs('#btn-register');
  btn.disabled = true;
  try {
    const result = await registerCustomer(customer);
    patchCustomer({ sevdeskCustomerId: result.sevdeskCustomerId || null });
    showWizard();
    return true;
  } finally {
    btn.disabled = false;
  }
}

export function bindRegister() {
  const form = qs('#form-register');
  form.addEventListener('input', () => readRegisterForm());
  qs('#btn-register').addEventListener('click', async () => {
    try {
      await submitRegistration();
    } catch (error) {
      showToast(error.message || 'Registrierung fehlgeschlagen.');
    }
  });
}
