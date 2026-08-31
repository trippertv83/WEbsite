/**
 * Warenkorb aus dem HTML-iFrame (postMessage).
 * HTML-Komponente auf der Seite: ID wizardHtml
 */

import { cart } from 'wix-stores-frontend';
import wixLocation from 'wix-location';

export function bindWizardCart() {
  const html = $w('#wizardHtml');
  if (!html || html.length === 0) return;
  html.onMessage(async (event) => {
    const data = event.data;
    if (!data || data.type !== 'ADD_TO_CART') return;
    await cart.addProducts([
      {
        productId: data.productId,
        quantity: 1,
        options: {
          customTextFields: [
            { title: 'Bestellnummer', value: data.orderNumber },
            { title: 'Effizienzklasse', value: data.efficiencyClass },
          ],
        },
      },
    ]);
    wixLocation.to('/checkout');
  });
}
