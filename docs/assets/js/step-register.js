/**
 * Registrierung oder Anmeldung per E-Mail vor dem Erfassungsbogen.
 */

import { getState, patch, patchCustomer } from './state.js';
import { validateLogin, validateRegistration, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError, showToast } from './utils.js';
import { registerCustomer } from './api-client.js';

function currentMode() {
  return qs('#auth-mode-login')?.checked ? 'login' : 'register';
}

function setAlert(message, kind = 'error') {
  const el = qs('#register-alert');
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || '';
  el.className = kind === 'ok' ? 'notice' : 'notice notice--error';
}

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

function syncModeUi() {
  const login = currentMode() === 'login';
  qs('#register-new-fields').hidden = login;
  qs('#btn-register').textContent = login
    ? 'Mit E-Mail anmelden'
    : 'Neu registrieren und zum Erfassungsbogen';
  qs('#register-lead').textContent = login
    ? 'Bereits Kunde? Melden Sie sich mit der E-Mail-Adresse an, die in SevDesk hinterlegt ist. Es wird kein neues Konto angelegt.'
    : 'Neu hier? Wir legen Sie mit Name, Anschrift und E-Mail als Kunden in SevDesk an.';
  setAlert('');
}

export async function submitRegistration() {
  const mode = currentMode();
  const customer = readRegisterForm();
  const errors = mode === 'login' ? validateLogin(customer) : validateRegistration(customer);
  applyRegisterErrors(errors);
  if (!isEmpty(errors)) {
    const first = Object.values(errors)[0];
    setAlert(first);
    return false;
  }

  const btn = qs('#btn-register');
  btn.disabled = true;
  setAlert('Verbindung zu SevDesk…', 'ok');
  try {
    const result = await registerCustomer(customer, mode);
    patchCustomer({
      sevdeskCustomerId: result.sevdeskCustomerId || null,
      name: result.customerName || customer.name,
      email: result.email || customer.email,
    });
    showToast(
      result.existing
        ? 'Bestehender SevDesk-Kunde gefunden.'
        : 'Kunde in SevDesk angelegt.'
    );
    showWizard();
    return true;
  } catch (error) {
    console.error(error);
    setAlert(error.message || 'Vorgang fehlgeschlagen.');
    showToast(error.message || 'Vorgang fehlgeschlagen.');
    return false;
  } finally {
    btn.disabled = false;
  }
}

export function bindRegister() {
  qs('#form-register').addEventListener('input', () => readRegisterForm());
  qs('#auth-mode-register').addEventListener('change', syncModeUi);
  qs('#auth-mode-login').addEventListener('change', syncModeUi);
  qs('#btn-register').addEventListener('click', () => submitRegistration());
  syncModeUi();
}
