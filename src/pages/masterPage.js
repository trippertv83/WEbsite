import { bindWizardCart } from 'public/wizardCart';

$w.onReady(function () {
  try {
    bindWizardCart();
  } catch (error) {
    console.warn('wizardCart:', error);
  }
});
