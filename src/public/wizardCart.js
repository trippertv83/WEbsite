/**
 * Warenkorb aus dem HTML-iFrame (postMessage).
 * HTML-Komponente: ID wizardHtml (Fallback html1).
 */

import { cart } from 'wix-stores-frontend';
import wixLocation from 'wix-location';

let lastOrder = '';

function htmlBox() {
  const ids = ['#wizardHtml', '#html1', '#htmlComp1'];
  for (const id of ids) {
    try {
      const el = $w(id);
      if (el && el.length !== 0) return el;
    } catch {
      /* Element fehlt auf dieser Seite */
    }
  }
  return null;
}

function payloadFrom(event) {
  let data = event?.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (data?.data?.type) data = data.data;
  return data;
}

async function addLine(productId, orderNumber, efficiencyClass) {
  const plain = [{ productId, quantity: 1 }];
  const withText = [
    {
      productId,
      quantity: 1,
      options: {
        customTextFields: [
          { title: 'Bestellnummer', value: String(orderNumber || '') },
          { title: 'Effizienzklasse', value: String(efficiencyClass || '') },
        ],
      },
    },
  ];
  try {
    await cart.addProducts(withText);
  } catch {
    await cart.addProducts(plain);
  }
}

async function goToCheckout() {
  try {
    const ecom = await import('wix-ecom-frontend');
    const api = ecom.default || ecom;
    if (typeof api.navigateToCheckoutPage === 'function') {
      await api.navigateToCheckoutPage();
      return;
    }
  } catch {
    /* ältere Sites */
  }
  if (typeof cart.showCart === 'function') {
    try {
      await cart.showCart();
    } catch {
      /* weiterleiten */
    }
  }
  const path = wixLocation.path || [];
  const lang = Array.isArray(path) && path[0] && path[0].length === 2 ? `/${path[0]}` : '';
  const targets = [`${lang}/checkout`, `${lang}/kasse`, '/checkout', '/kasse', '/cart', '/warenkorb'];
  wixLocation.to(targets[0] || '/checkout');
}

async function handleAddToCart(data) {
  if (!data || data.type !== 'ADD_TO_CART' || !data.productId) return;
  if (data.orderNumber && data.orderNumber === lastOrder) return;
  lastOrder = data.orderNumber || String(Date.now());
  await addLine(data.productId, data.orderNumber, data.efficiencyClass);
  await goToCheckout();
}

export function bindWizardCart() {
  const html = htmlBox();
  if (html && typeof html.onMessage === 'function') {
    html.onMessage(async (event) => {
      try {
        await handleAddToCart(payloadFrom(event));
      } catch (error) {
        console.error('Kasse:', error);
        try {
          html.postMessage({
            type: 'CART_ERROR',
            message: error.message || String(error),
          });
        } catch {
          /* */
        }
      }
    });
  }

  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('message', async (event) => {
      try {
        await handleAddToCart(payloadFrom(event));
      } catch (error) {
        console.error('Kasse:', error);
      }
    });
  }
}
