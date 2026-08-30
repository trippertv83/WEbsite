import { bindWizardCart } from 'public/wizardCart';

$w.onReady(function () {
  try {
    bindWizardCart();
  } catch (error) {
    console.warn('HTML-Komponente #wizardHtml noch nicht auf HOME:', error);
  }
});
