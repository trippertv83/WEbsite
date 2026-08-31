import wixLocation from 'wix-location';
import { notifyPaymentComplete } from 'backend/paid-order';

$w.onReady(async function () {
  try {
    const wixOrder = await readThankYouOrder();
    await notifyPaymentComplete({
      query: wixLocation.query || {},
      wixOrder,
    });
  } catch (error) {
    console.error('Zahlungsabschluss:', error);
  }
});

async function readThankYouOrder() {
  const ids = ['#thankYouPage1', '#thankYouPage', '#ecomThankYouPage1'];
  for (const id of ids) {
    try {
      const el = $w(id);
      if (el && typeof el.getOrder === 'function') {
        const order = await el.getOrder();
        if (order) return order;
      }
    } catch (error) {
      console.error('Danke-Seite', id, error);
    }
  }
  try {
    const mod = await import('wix-ecom-frontend');
    if (mod.thankYouPage && typeof mod.thankYouPage.getOrder === 'function') {
      return await mod.thankYouPage.getOrder();
    }
  } catch (error) {
    console.error('ecom thankYouPage:', error);
  }
  return null;
}
