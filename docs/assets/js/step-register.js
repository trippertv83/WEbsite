/**
 * Registrierung oder Anmeldung: zuerst E-Mail-Code, danach SevDesk.
 */

import { getState, patch, patchCustomer } from './state.js';
import { validateLogin, validateRegistration, isEmpty } from './validation.js';
import { clearFormErrors, qs, setFieldError, showToast } from './utils.js';
import { registerCustomer, requestRegisterCode } from './api-client.js';
import { saveSession, loadSession, safeNextPath } from './session.js';

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

function currentParty() {
  return qs('input[name="customerType"]:checked')?.value || '';
}

export function readRegisterForm() {
  const form = qs('#form-register');
  const data = Object.fromEntries(new FormData(form).entries());
  const customerType = currentParty();
  const companyName = data.companyName || '';
  const firstName = data.firstName || '';
  const lastName = data.lastName || '';
  const contactFirstName = data.contactFirstName || '';
  const contactLastName = data.contactLastName || '';
  const name =
    customerType === 'firma'
      ? companyName.trim()
      : `${firstName} ${lastName}`.trim();
  patchCustomer({
    customerType,
    companyName,
    contactFirstName,
    contactLastName,
    firstName,
    lastName,
    name,
    email: data.email || '',
    phone: data.phone || '',
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

function continueAfterAuth() {
  const next = safeNextPath();
  if (next) {
    location.assign(next);
    return;
  }
  showWizard();
}

function syncPartyUi() {
  const type = currentParty();
  qs('#company-name-fields').hidden = type !== 'firma';
  qs('#person-name-fields').hidden = type !== 'herr' && type !== 'frau';
}

function syncModeUi() {
  const login = currentMode() === 'login';
  qs('#register-new-fields').hidden = login;
  qs('#btn-register').textContent = login
    ? 'Code bestätigen und anmelden'
    : 'Code bestätigen und Kunde anlegen';
  qs('#register-lead').textContent = login
    ? 'Bereits Kunde? Wir schicken einen Code an Ihre SevDesk-E-Mail. Es wird kein neuer Kunde angelegt.'
    : 'Neu hier? Nach dem E-Mail-Code legen wir Sie in SevDesk an. Ohne Code entsteht kein Kunde.';
  setAlert('');
  if (!login) syncPartyUi();
}

async function sendCode() {
  const mode = currentMode();
  const customer = readRegisterForm();
  const errors = mode === 'login' ? validateLogin(customer) : validateRegistration(customer);
  applyRegisterErrors(errors);
  if (!isEmpty(errors)) {
    setAlert(Object.values(errors)[0]);
    return;
  }
  const btn = qs('#btn-send-code');
  btn.disabled = true;
  setAlert('Code wird gesendet…', 'ok');
  try {
    await requestRegisterCode(customer.email, mode);
    setAlert('Code ist unterwegs. Bitte E-Mail prüfen (auch Spam) und den 6-stelligen Code eingeben.', 'ok');
    qs('#reg-code')?.focus();
  } catch (error) {
    setAlert(error.message || 'Code konnte nicht gesendet werden.');
  } finally {
    btn.disabled = false;
  }
}

export async function submitRegistration() {
  const mode = currentMode();
  const customer = readRegisterForm();
  const errors = mode === 'login' ? validateLogin(customer) : validateRegistration(customer);
  const code = String(qs('#reg-code')?.value || '').trim();
  if (!/^\d{6}$/.test(code)) {
    errors.code = 'Bitte den 6-stelligen Code aus der E-Mail eingeben.';
  }
  applyRegisterErrors(errors);
  if (!isEmpty(errors)) {
    setAlert(Object.values(errors)[0]);
    return false;
  }

  const btn = qs('#btn-register');
  btn.disabled = true;
  setAlert('Code wird geprüft…', 'ok');
  try {
    const result = await registerCustomer(customer, mode, code);
    saveSession(result);
    patchCustomer({
      sevdeskCustomerId: result.sevdeskCustomerId || null,
      customerNumber: result.customerNumber || customer.customerNumber || null,
      name: result.customerName || customer.name,
      email: result.email || customer.email,
    });
    showToast(
      result.existing
        ? 'Bestehender SevDesk-Kunde, Anmeldung bestätigt.'
        : `Kunde in SevDesk angelegt${result.customerNumber ? ` (Nr. ${result.customerNumber})` : ''}.`
    );
    continueAfterAuth();
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
  const existing = loadSession();
  if (existing?.token && existing?.sevdeskCustomerId) {
    patchCustomer({
      email: existing.email,
      name: existing.name,
      sevdeskCustomerId: existing.sevdeskCustomerId,
      customerNumber: existing.customerNumber,
    });
    const next = safeNextPath();
    if (next) {
      location.replace(next);
      return;
    }
    showWizard();
    return;
  }
  qs('#form-register').addEventListener('input', () => readRegisterForm());
  qs('#auth-mode-register').addEventListener('change', syncModeUi);
  qs('#auth-mode-login').addEventListener('change', syncModeUi);
  qs('#form-register').addEventListener('change', (event) => {
    if (event.target.name === 'customerType') syncPartyUi();
  });
  qs('#btn-send-code').addEventListener('click', () => sendCode());
  qs('#btn-register').addEventListener('click', () => submitRegistration());
  syncModeUi();
}
