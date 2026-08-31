/**
 * Warenkorb + Kasse. HTML-Komponente: #wizardHtml
 */

import { currentCart } from 'wix-ecom-backend';
import wixEcomFrontend from 'wix-ecom-frontend';
import { cart } from 'wix-stores-frontend';

const STORES_APP = '215238eb-22a5-4c36-9e7b-e7c08025e04e';
let lastOrder = '';

function htmlBox() {
  const ids = ['#wizardHtml', '#html1', '#htmlComp1'];
  for (const id of ids) {
    try {
      const el = $w(id);
      if (el && el.length !== 0) return el;
    } catch {
      /* fehlt */
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

function checkoutIdOf(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return result.checkoutId || result._id || '';
}

async function addLine(productId, orderNumber, efficiencyClass) {
  const line = {
    lineItems: [
      {
        catalogReference: {
          appId: STORES_APP,
          catalogItemId: productId,
          options: {
            customTextFields: {
              Bestellnummer: String(orderNumber || ''),
              Effizienzklasse: String(efficiencyClass || ''),
            },
          },
        },
        quantity: 1,
      },
    ],
  };
  try {
    await currentCart.addToCurrentCart(line);
    return;
  } catch {
    /* ohne Textfelder */
  }
  try {
    await currentCart.addToCurrentCart({
      lineItems: [
        {
          catalogReference: {
            appId: STORES_APP,
            catalogItemId: productId,
          },
          quantity: 1,
        },
      ],
    });
    return;
  } catch {
    await cart.addProducts([{ productId, quantity: 1 }]);
  }
}

async function goToCheckout() {
  await wixEcomFrontend.refreshCart();
  try {
    const created = await currentCart.createCheckoutFromCurrentCart({
      channelType: 'WEB',
    });
    const id = checkoutIdOf(created);
    if (!id) throw new Error('Keine Checkout-ID');
    await wixEcomFrontend.navigateToCheckoutPage(id, {
      skipDeliveryStep: true,
    });
    return;
  } catch (error) {
    console.error('Checkout-ID:', error);
  }
  if (typeof wixEcomFrontend.navigateToCartPage === 'function') {
    await wixEcomFrontend.navigateToCartPage();
    return;
  }
  if (typeof wixEcomFrontend.openSideCart === 'function') {
    await wixEcomFrontend.openSideCart();
  }
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
