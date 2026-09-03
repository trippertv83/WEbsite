import { bindWizardCart } from 'public/wizardCart';
import { bindFoerderrechner } from 'public/bindFoerderrechner';
import { bindKfwVergleich } from 'public/bindKfwVergleich';

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
  try {
    bindKfwVergleich();
  } catch (error) {
    console.warn('kfw-vergleich:', error);
  }
});
