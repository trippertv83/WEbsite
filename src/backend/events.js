/**
 * Backend-Events. E-Mail + HSV erst nach abgeschlossener Zahlung.
 */

import { handlePaidOrderEvent } from 'backend/paid-notify';

async function run(event, label) {
  try {
    const result = await handlePaidOrderEvent(event);
    console.log(label, result);
  } catch (error) {
    console.error(label, error);
  }
}

export function wixEcom_onOrderApproved(event) {
  return run(event, 'wixEcom_onOrderApproved');
}

export function wixEcom_onOrderPaid(event) {
  return run(event, 'wixEcom_onOrderPaid');
}

export function wixStores_onOrderPaid(event) {
  return run(event, 'wixStores_onOrderPaid');
}

export function wixStores_onNewOrder(event) {
  const order = event?.order || event?.data?.order || event;
  const paid = String(order?.paymentStatus || order?.status || '').toUpperCase();
  if (paid.includes('PAID') || paid.includes('COMPLETE') || paid.includes('APPROVED')) {
    return run(event, 'wixStores_onNewOrder');
  }
}

export function wixEcom_onOrderTransactionsUpdated(event) {
  return run(event, 'wixEcom_onOrderTransactionsUpdated');
}
