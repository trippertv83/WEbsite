/**
 * Shop-Status. Checkout selbst läuft über wix-stores-frontend auf der Seite.
 */

import { updateOrderStatus } from 'backend/database';
import wixStoresBackend from 'wix-stores-backend';

export async function registerPaidOrder({ orderNumber }) {
  return updateOrderStatus(orderNumber, 'in_checkout');
}

export async function markPaid(orderNumber) {
  return updateOrderStatus(orderNumber, 'paid');
}

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
