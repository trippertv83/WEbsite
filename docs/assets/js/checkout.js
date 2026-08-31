/**
 * Wix Stores Checkout.
 * Produkt in den Warenkorb legen – keine API-Schlüssel im Browser.
 *
 * In Wix Velo auf der Seite:
 *   import { cart } from 'wix-stores-frontend';
 * Diese Datei kapselt denselben Aufruf und fällt lokal auf Demo-Modus zurück.
 */

import { AppConfig } from '../../config.example.js';

/**
 * @param {object} payload
 * @param {string} payload.productId
 * @param {string} payload.orderNumber
 * @param {string} payload.efficiencyClass
 */
export function isPlaceholderProductId(productId) {
  return !productId || String(productId).startsWith('00000000');
}

function flattenCustomer(customer = {}) {
  return {
    email: customer.email || '',
    phone: customer.phone || '',
    firstName: customer.firstName || customer.contactFirstName || '',
    lastName: customer.lastName || customer.contactLastName || '',
    companyName: customer.companyName || '',
    strasse: customer.strasse || '',
    hausnummer: customer.hausnummer || '',
    plz: customer.plz || '',
    ort: customer.ort || '',
    name: customer.name || '',
  };
}

export async function addCertificateToCart(payload) {
  if (isPlaceholderProductId(payload.productId)) {
    throw new Error(
      'Kein Wix-Produkt hinterlegt. Im Wix-Shop den Artikel „Verbrauchsausweis“ anlegen, die Produkt-ID in config.example.js (wixProductId) eintragen, Site veröffentlichen und GitHub Pages aktualisieren.'
    );
  }

  if (AppConfig.demoMode) {
    return {
      ok: true,
      mode: 'demo',
      message: 'Demo: Warenkorb-Aufruf übersprungen.',
      productId: payload.productId,
    };
  }

  const inIframe =
    typeof window !== 'undefined' && window.parent && window.parent !== window;
  if (inIframe) {
    const flat = flattenCustomer(payload.customer || {});
    const message = {
      type: 'ADD_TO_CART',
      productId: payload.productId,
      orderNumber: payload.orderNumber,
      efficiencyClass: payload.efficiencyClass,
      ...flat,
    };
    const encoded = JSON.stringify(message);
    window.parent.postMessage(encoded, '*');
    try {
      if (window.top && window.top !== window.parent) {
        window.top.postMessage(encoded, '*');
      }
    } catch {
      /* cross-origin top */
    }
    return { ok: true, mode: 'wix-iframe' };
  }

  const wixCart = await loadWixCart();
  if (!wixCart) {
    throw new Error(
      'wix-stores-frontend ist nicht verfügbar. Datei in eine Wix-Seite einbinden.'
    );
  }

  await wixCart.addProducts([
    {
      productId: payload.productId,
      quantity: 1,
      options: {
        customTextFields: [
          { title: 'Bestellnummer', value: payload.orderNumber },
          { title: 'Effizienzklasse', value: payload.efficiencyClass },
        ],
      },
    },
  ]);

  if (typeof wixCart.showCart === 'function') {
    await wixCart.showCart();
  }

  return { ok: true, mode: 'wix' };
}

async function loadWixCart() {
  try {
    const mod = await import('wix-stores-frontend');
    return mod.cart;
  } catch {
    return null;
  }
}

export function getProductId() {
  return AppConfig.wixProductId;
}
