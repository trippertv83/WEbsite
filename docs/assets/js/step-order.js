/**
 * Schritt 6: Zusammenfassung, AGB, Datenschutz, Kundendaten.
 */

import { getState, patchCustomer } from './state.js';
import { validateCustomer, isEmpty } from './validation.js';
import { collectAllFiles } from './upload.js';
import { formatDeNumber, qs, setFieldError } from './utils.js';

export function renderOrder() {
  const { building, consumption, calculation, documents, customer } = getState();
  const files = collectAllFiles(documents);
  qs('#order-root').innerHTML = `
    <div class="summary">
      <div class="card" style="box-shadow:none">
        <h2 style="margin-top:0">Zusammenfassung</h2>
        <dl>
          <dt>Adresse</dt>
          <dd>${building.strasse} ${building.hausnummer}, ${building.plz} ${building.ort}</dd>
          <dt>Wohnfläche</dt>
          <dd>${formatDeNumber(Number(building.wohnflaeche), 1)} m²</dd>
          <dt>Gebäudetyp</dt>
          <dd>${building.gebaeudetyp === 'efh' ? '1-2 Familienhaus' : 'Mehrfamilienhaus'}</dd>
          <dt>Energieträger</dt>
          <dd>${calculation?.carrierLabel || consumption.energietraeger}</dd>
          <dt>Effizienzklasse</dt>
          <dd>${calculation?.efficiencyClass || '–'}</dd>
          <dt>Dokumente</dt>
          <dd>${files.length} PDF</dd>
        </dl>
        <div class="order-price">
          <span>Verbrauchsausweis (Preis im Wix Shop)</span>
          <strong>Shop-Artikel</strong>
        </div>
      </div>
      <form id="form-order" novalidate>
        <div class="grid-2">
          <div class="field">
            <label class="field__label" for="customer-name">Name</label>
            <input class="input" id="customer-name" name="name" value="${customer.name}" required autocomplete="name" />
            <span class="field__error" data-error-for="name"></span>
          </div>
          <div class="field">
            <label class="field__label" for="customer-email">E-Mail</label>
            <input class="input" id="customer-email" name="email" type="email" value="${customer.email}" required autocomplete="email" />
            <span class="field__error" data-error-for="email"></span>
          </div>
        </div>
        <div class="legal">
          <label class="checkbox">
            <input type="checkbox" id="accept-agb" ${customer.acceptAgb ? 'checked' : ''} />
            <span>Ich akzeptiere die <a href="#agb" target="_blank" rel="noopener">Allgemeinen Geschäftsbedingungen</a>.</span>
          </label>
          <span class="field__error" data-error-for="acceptAgb"></span>
          <label class="checkbox">
            <input type="checkbox" id="accept-privacy" ${customer.acceptPrivacy ? 'checked' : ''} />
            <span>Ich habe die <a href="#datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und willige in die Verarbeitung zur Auftragserfüllung ein.</span>
          </label>
          <span class="field__error" data-error-for="acceptPrivacy"></span>
        </div>
      </form>
    </div>
  `;

  qs('#form-order').addEventListener('input', syncCustomer);
  qs('#accept-agb').addEventListener('change', syncCustomer);
  qs('#accept-privacy').addEventListener('change', syncCustomer);
}

function syncCustomer() {
  patchCustomer({
    name: qs('#customer-name').value,
    email: qs('#customer-email').value,
    acceptAgb: qs('#accept-agb').checked,
    acceptPrivacy: qs('#accept-privacy').checked,
  });
}

export function validateStepOrder() {
  syncCustomer();
  const errors = validateCustomer(getState().customer);
  const form = qs('#form-order');
  Object.entries(errors).forEach(([name, message]) => {
    setFieldError(form, name, message);
  });
  return isEmpty(errors);
}
