/**
 * Einstiegspunkt: verdrahtet Wizard, Schritte und Checkout.
 */

import { AppConfig } from './config.example.js';
import { getState, patch, patchCustomer, patchBuilding, serializeForBackend } from './assets/js/state.js';
import { createOrderNumber, qs, showToast } from './assets/js/utils.js';
import { bindStepper, renderStepper, showStep } from './assets/js/wizard.js';
import { bindRegister, showWizard } from './assets/js/step-register.js?v=20260905a';
import { bindBuildingLive, validateStepBuilding } from './assets/js/step-building.js';
import {
  bindConsumption,
  validateStepConsumption,
} from './assets/js/step-consumption.js';
import {
  bindDocuments,
  validateStepDocuments,
} from './assets/js/step-documents.js';
import { renderCalculation } from './assets/js/step-calculation.js';
import { renderPreview } from './assets/js/step-preview.js';
import { renderOrder, validateStepOrder } from './assets/js/step-order.js';
import { addCertificateToCart, getProductId, isPlaceholderProductId } from './assets/js/checkout.js';
import { submitOrder } from './assets/js/api-client.js';
import { loadSession } from './assets/js/session.js';

function canEnterStep(target) {
  if (!getState().registered) return false;
  if (target <= getState().step) return true;
  if (target === 2) return validateStepBuilding();
  if (target === 3) return validateStepBuilding() && validateStepConsumption();
  if (target === 4) {
    return validateStepBuilding() && validateStepConsumption() && validateStepDocuments();
  }
  return target <= getState().maxReached + 1;
}

function enterStep(step) {
  if (step === 4) return renderCalculation();
  if (step === 5) renderPreview();
  if (step === 6) return renderOrder();
  return undefined;
}

async function onNext(from) {
  if (from === 1 && !validateStepBuilding()) return;
  if (from === 2 && !validateStepConsumption()) return;
  if (from === 3 && !validateStepDocuments()) return;
  const next = from + 1;
  if (next > 6) return;
  showStep(next);
  await enterStep(next);
}

function onPrev(from) {
  showStep(Math.max(1, from - 1));
}

async function onCheckout() {
  if (!validateStepOrder()) {
    showToast('Bitte Pflichtfelder und Einwilligungen prüfen.');
    return;
  }
  if (isPlaceholderProductId(getProductId())) {
    showToast(
      'Kein Shop-Artikel hinterlegt. Wix-Produkt-ID in config.example.js eintragen (wixProductId).'
    );
    return;
  }
  const orderNumber = createOrderNumber();
  patch({ order: { number: orderNumber, status: 'pending' } });
  const payload = serializeForBackend();
  payload.orderNumber = orderNumber;
  payload.brandName = AppConfig.brandName;

  const btn = qs('#btn-checkout');
  btn.disabled = true;
  try {
    const saved = await submitOrder({
      payload,
      documents: getState().documents,
    });
    const cart = await addCertificateToCart({
      productId: getProductId(),
      orderNumber,
      efficiencyClass: getState().calculation?.efficiencyClass || '',
      customer: getState().customer,
    });
    showToast(
      cart.mode === 'demo'
        ? `Auftrag ${orderNumber} im Demo-Modus erfasst.`
        : `Auftrag ${saved.orderNumber} liegt im Warenkorb.`
    );
    patch({ order: { number: orderNumber, status: 'submitted' } });
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Bestellung fehlgeschlagen.');
    patch({ order: { number: orderNumber, status: 'error' } });
    btn.disabled = false;
  }
}

function bindNav() {
  document.addEventListener('click', (event) => {
    const next = event.target.closest('[data-next]');
    const prev = event.target.closest('[data-prev]');
    if (next) {
      const panel = event.target.closest('.panel');
      onNext(Number(panel.dataset.step));
    }
    if (prev) {
      const panel = event.target.closest('.panel');
      onPrev(Number(panel.dataset.step));
    }
  });
  qs('#btn-checkout').addEventListener('click', onCheckout);
}

function init() {
  const session = loadSession();
  const next = new URLSearchParams(location.search).get('next');
  if (next) {
    location.replace('kunde.html' + location.search);
    return;
  }
  if (!session) {
    location.replace('kunde.html?next=' + encodeURIComponent('index.html'));
    return;
  }
  patchCustomer({
    name: session.name || '',
    email: session.email || '',
    phone: session.phone || '',
    strasse: session.strasse || '',
    hausnummer: session.hausnummer || '',
    plz: session.plz || '',
    ort: session.ort || '',
    customerType: session.customerType || '',
    companyName: session.companyName || '',
    firstName: session.firstName || '',
    lastName: session.lastName || '',
    sevdeskCustomerId: session.sevdeskCustomerId || null,
    customerNumber: session.customerNumber || null,
  });
  patch({ registered: true });
  if (session.plz || session.ort || session.strasse) {
    patchBuilding({
      plz: session.plz || '',
      ort: session.ort || '',
      strasse: session.strasse || '',
      hausnummer: session.hausnummer || '',
    });
  }
  bindRegister();
  renderStepper();
  bindStepper(canEnterStep, (step) => enterStep(step));
  bindBuildingLive();
  bindConsumption();
  bindDocuments();
  bindNav();
  showWizard();
  showStep(1);
  ['plz', 'ort', 'strasse', 'hausnummer'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && session[id] && !el.value) el.value = session[id];
  });
}

init();
