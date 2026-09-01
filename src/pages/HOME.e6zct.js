import { bindWizardCart } from 'public/wizardCart';
import { bindReferences } from 'public/bindReferences';

$w.onReady(function () {
  bindWizardCart();
  bindReferences();
});
