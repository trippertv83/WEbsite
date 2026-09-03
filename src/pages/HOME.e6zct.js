import { bindWizardCart } from 'public/wizardCart';
import { bindReferences } from 'public/bindReferences';
import { bindLeistungen } from 'public/bindLeistungen';
import { bindFoerderrechner } from 'public/bindFoerderrechner';

$w.onReady(function () {
  bindWizardCart();
  bindReferences();
  bindLeistungen();
  bindFoerderrechner();
});
