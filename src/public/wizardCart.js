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

function checkoutPhone(raw) {
  const compact = String(raw || '').replace(/[^\d+]/g, '');
  if (!compact) return '';
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (compact.startsWith('0')) return `+49${compact.slice(1)}`;
  return `+49${compact}`;
}

function checkoutBuyer(customer = {}) {
  const firstName =
    customer.firstName ||
    customer.contactFirstName ||
    String(customer.name || 'Kunde').trim().split(/\s+/)[0] ||
    'Kunde';
  const lastName =
    customer.lastName ||
    customer.contactLastName ||
    String(customer.name || '').trim().split(/\s+/).slice(1).join(' ') ||
    firstName;
  const phone = checkoutPhone(customer.phone);
  const address = {
    country: 'DE',
    city: customer.ort || '',
    postalCode: String(customer.plz || ''),
    addressLine1: `${customer.strasse || ''} ${customer.hausnummer || ''}`.trim(),
    streetAddress: {
      name: customer.strasse || '',
      number: String(customer.hausnummer || ''),
    },
    phone,
  };
  return {
    channelType: 'WEB',
    email: customer.email || '',
    shippingAddress: address,
    billingInfo: {
      address,
      contactDetails: {
        firstName,
        lastName,
        phone,
        company: customer.companyName || '',
      },
    },
  };
}

async function goToCheckout(customer) {
  await wixEcomFrontend.refreshCart();
  try {
    const created = await currentCart.createCheckoutFromCurrentCart(checkoutBuyer(customer));
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
  await goToCheckout(data.customer);
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
