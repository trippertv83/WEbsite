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
