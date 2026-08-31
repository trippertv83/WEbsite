/**
 * Schritt 6: Zusammenfassung, AGB, Datenschutz, Kundendaten.
 */

import { AppConfig } from '../../config.example.js';
import { fetchProductPrice } from './api-client.js';
import { getProductId } from './checkout.js';
import { getState, patchCustomer } from './state.js';
import { validateCustomer, isEmpty } from './validation.js';
import { collectAllFiles } from './upload.js';
import { escapeHtml, formatDeNumber, formatEuro, qs, setFieldError } from './utils.js';

function partyLabel(customer) {
  if (customer.customerType === 'firma') return 'Firma';
  if (customer.customerType === 'herr') return 'Herr';
  if (customer.customerType === 'frau') return 'Frau';
  return '–';
}

function customerDisplayName(customer) {
  if (customer.customerType === 'firma') {
    return customer.companyName || customer.name || '–';
  }
  const person = `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  return person || customer.name || '–';
}

function addressHtml(entity) {
  const line1 = `${entity.strasse || ''} ${entity.hausnummer || ''}`.trim();
  const line2 = `${entity.plz || ''} ${entity.ort || ''}`.trim();
  if (!line1 && !line2) return '–';
  return `${escapeHtml(line1)}${line1 && line2 ? '<br />' : ''}${escapeHtml(line2)}`;
}

export async function renderOrder() {
  const { building, consumption, calculation, documents, customer } = getState();
  const files = collectAllFiles(documents);
  let priceText = formatEuro(AppConfig.productPriceEuro || null);
  try {
    const shop = await fetchProductPrice(getProductId());
    if (shop?.price != null) priceText = formatEuro(shop.price);
  } catch {
    /* Anzeigepreis aus Config */
  }

  qs('#order-root').innerHTML = `
    <div class="summary">
      <div class="card" style="box-shadow:none">
        <h2 style="margin-top:0">Zusammenfassung</h2>
        <dl>
          <dt>Kunde</dt>
          <dd>${escapeHtml(customerDisplayName(customer))}</dd>
          <dt>Kundennummer</dt>
          <dd>${escapeHtml(customer.customerNumber || '–')}</dd>
          <dt>Geschlecht</dt>
          <dd>${escapeHtml(partyLabel(customer))}</dd>
          <dt>Name</dt>
          <dd>${escapeHtml(customerDisplayName(customer))}</dd>
          <dt>Anschrift</dt>
          <dd>${addressHtml(customer)}</dd>
          <dt>Telefon</dt>
          <dd>${escapeHtml(customer.phone || '–')}</dd>
          <dt>Gebäude</dt>
          <dd>${addressHtml(building)}</dd>
          <dt>Wohnfläche</dt>
          <dd>${formatDeNumber(Number(building.wohnflaeche), 1)} m²</dd>
          <dt>Gebäudetyp</dt>
          <dd>${building.gebaeudetyp === 'efh' ? '1-2 Familienhaus' : 'Mehrfamilienhaus'}</dd>
          <dt>Energieträger</dt>
          <dd>${escapeHtml(calculation?.carrierLabel || consumption.energietraeger)}</dd>
          <dt>Effizienzklasse</dt>
          <dd>${escapeHtml(calculation?.efficiencyClass || '–')}</dd>
          <dt>Dokumente</dt>
          <dd>${files.length} PDF</dd>
        </dl>
        <div class="order-price">
          <span>Verbrauchsausweis inkl. MwSt.</span>
          <strong>${priceText}</strong>
        </div>
      </div>
      <form id="form-order" novalidate>
        <p class="field__hint">Kontaktdaten stammen aus der Registrierung (SevDesk-Kunde ${escapeHtml(customer.sevdeskCustomerId || 'wird zugeordnet')}).</p>
        <input type="hidden" id="customer-name" value="${escapeHtml(customer.name)}" />
        <input type="hidden" id="customer-email" value="${escapeHtml(customer.email)}" />
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
