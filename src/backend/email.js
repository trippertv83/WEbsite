/**
 * Triggered Emails. Secret: ADMIN_NOTIFY_EMAIL
 */

import { contacts, triggeredEmails } from 'wix-crm-backend';
import { getSecret } from 'wix-secrets-backend';

export async function sendOrderEmails(body) {
  const adminEmail = await getSecret('ADMIN_NOTIFY_EMAIL');
  const variables = buildVariables(body);

  const customerId = await upsertContact({
    name: body.customer?.name || 'Kunde',
    email: body.customer?.email,
  });

  await triggeredEmails.emailContact('email_order_customer', customerId, {
    variables,
  });

  if (adminEmail) {
    const adminId = await upsertContact({
      name: 'Administration',
      email: adminEmail,
    });
    await triggeredEmails.emailContact('email_order_admin', adminId, {
      variables,
    });
  }

  return { ok: true, customerId };
}

async function upsertContact({ name, email }) {
  if (!email) throw new Error('E-Mail für Kontakt fehlt.');
  const parts = String(name).trim().split(/\s+/);
  const info = {
    name: { first: parts[0], last: parts.slice(1).join(' ') || parts[0] },
    emails: [{ email, tag: 'MAIN' }],
  };
  const created = await contacts.createContact(info);
  return created._id || created.contactId || created;
}

export function buildVariables(body) {
  const address = formatAddress(body.building);
  return {
    orderNumber: body.orderNumber,
    customerName: body.customer?.name || '',
    customerEmail: body.customer?.email || '',
    address,
    efficiencyClass: body.calculation?.efficiencyClass || '',
    endEnergy: String(Math.round(body.calculation?.endSpecific || 0)),
    htmlSummary: buildHtml(body),
  };
}

function formatAddress(building = {}) {
  return `${building.strasse || ''} ${building.hausnummer || ''}, ${building.plz || ''} ${building.ort || ''}`.trim();
}

export function buildHtml(body) {
  const brand = body.brandName || 'Energieausweis Pro';
  const address = formatAddress(body.building);
  const name = escapeHtml(body.customer?.name || '');
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /><title>Auftrag ${escapeHtml(body.orderNumber)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#2a3038;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td style="padding:24px;">
      <table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;">
        <tr><td style="background:#0B78D1;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:700;">${escapeHtml(brand)}</td></tr>
        <tr><td style="padding:24px;">
          <p>Guten Tag ${name},</p>
          <p>Ihre Bestellung eines Verbrauchsausweises ist eingegangen.</p>
          <p><strong>Bestellnummer:</strong> ${escapeHtml(body.orderNumber)}</p>
          <p><strong>Objekt:</strong> ${escapeHtml(address)}</p>
          <p><strong>Klasse (Vorschau):</strong> ${escapeHtml(body.calculation?.efficiencyClass || '–')}</p>
          <p>Freundliche Grüße<br/>${escapeHtml(brand)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
