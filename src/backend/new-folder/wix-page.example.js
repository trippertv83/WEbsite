/**
 * Beispiel-Page-Code für eine Wix-Seite (Velo).
 * Nicht im Browser ohne Wix laden.
 *
 * 1. HTML-Komponente mit der Wizard-URL oder den Dateien hosten.
 * 2. postMessage von der Komponente empfangen und in den Warenkorb legen.
 */

import { cart } from 'wix-stores-frontend';

$w.onReady(() => {
  $w('#wizardHtml').onMessage(async (event) => {
    const data = event.data;
    if (data.type !== 'ADD_TO_CART') return;
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
    await cart.showCart();
  });
});
