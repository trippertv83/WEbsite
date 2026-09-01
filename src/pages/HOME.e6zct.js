import { bindWizardCart } from 'public/wizardCart';
import { bindReferences } from 'public/bindReferences';
import { bindLeistungen } from 'public/bindLeistungen';

$w.onReady(function () {
  bindWizardCart();
  bindReferences();
  bindLeistungen();
});
