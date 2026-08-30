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
export async function addCertificateToCart(payload) {
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
    window.parent.postMessage(
      {
        type: 'ADD_TO_CART',
        productId: payload.productId,
        orderNumber: payload.orderNumber,
        efficiencyClass: payload.efficiencyClass,
      },
      '*'
    );
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
