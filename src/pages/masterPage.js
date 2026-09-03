import { bindWizardCart } from 'public/wizardCart';
import { bindFoerderrechner } from 'public/bindFoerderrechner';

$w.onReady(function () {
  try {
    bindWizardCart();
  } catch (error) {
    console.warn('wizardCart:', error);
  }
  try {
    bindFoerderrechner();
  } catch (error) {
    console.warn('foerderrechner:', error);
  }
});
