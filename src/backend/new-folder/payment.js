/**
 * Zahlungs- und Shop-Anbindung über Wix Stores / Wix Pay.
 * Keine eigenen Payment-Provider-Schlüssel im Frontend.
 *
 * Der eigentliche Checkout erfolgt clientseitig über checkout.js
 * (wix-stores-frontend.cart.addProducts).
 *
 * Diese Datei:
 * - Bestellstatus nach Warenkorb / Zahlung setzen
 * - optional wix-pay für alternative Zahlstrecken
 */

import { updateOrderStatus } from 'backend/database';
import wixStoresBackend from 'wix-stores-backend';

export async function registerPaidOrder({ orderNumber }) {
  return updateOrderStatus(orderNumber, 'in_checkout');
}

export async function markPaid(orderNumber) {
  return updateOrderStatus(orderNumber, 'paid');
}

/**
 * Produktpreis aus Wix Stores lesen (Anzeige/Abgleich im Backend).
 */
export async function getCertificateProduct(productId) {
  const product = await wixStoresBackend.getProduct(productId);
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    currency: product.currency,
  };
}

export async function findStoreOrderByNumber(orderNumber) {
  const result = await wixStoresBackend.queryOrders().eq('number', orderNumber).find();
  return result.items[0] || null;
}
