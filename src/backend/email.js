/**
 * Nach Zahlung: alle Auftragsdaten + HSV an die Admin-Adresse.
 * Secret ADMIN_NOTIFY_EMAIL (Standard: lukas@spaderna.org).
 * Anhänge: SENDGRID_API_KEY, RESEND_API_KEY oder BREVO_API_KEY im Secrets Manager.
 */

import { Buffer } from 'buffer';
import { fetch } from 'wix-fetch';
import { contacts, triggeredEmails } from 'wix-crm-backend';
import { getSecret } from 'wix-secrets-backend';

export const DEFAULT_ADMIN_EMAIL = 'lukas@spaderna.org';

export async function resolveAdminEmail() {
  try {
    const fromSecret = await getSecret('ADMIN_NOTIFY_EMAIL');
    if (fromSecret && String(fromSecret).includes('@')) return String(fromSecret).trim();
  } catch {
    /* Secret fehlt */
  }
  return DEFAULT_ADMIN_EMAIL;
}

export async function sendPaidOrderEmails(body) {
  const adminEmail = await resolveAdminEmail();
  const html = buildPaidHtml(body);
  const subject = `Verbrauchsausweis bezahlt ${body.orderNumber || ''}`.trim();
  const text = buildPaidText(body);
  const attachments = body.mailAttachments || [];

  const httpResult = await sendViaHttpMail({
    to: adminEmail,
    subject,
    html,
    text,
    attachments,
  });

  let triggered = { ok: false, skipped: true };
  if (!httpResult.ok) {
    triggered = await sendTriggeredFallback({
      adminEmail,
      customerEmail: body.customer?.email,
      customerName: body.customer?.name || 'Kunde',
      variables: {
        orderNumber: String(body.orderNumber || ''),
        customerName: String(body.customer?.name || ''),
        customerEmail: String(body.customer?.email || ''),
        address: formatAddress(body.building),
        efficiencyClass: String(body.calculation?.efficiencyClass || ''),
        endEnergy: String(Math.round(body.calculation?.endSpecific || 0)),
        htmlSummary: html.slice(0, 15000),
        hsvDownloadUrl: String(body.hsvDownloadUrl || ''),
      },
    }).catch((error) => {
      console.error('Triggered Email:', error);
      return { ok: false, error: String(error.message || error) };
    });
  }

  return {
    ok: Boolean(httpResult.ok || triggered.ok),
    adminEmail,
    http: httpResult,
    triggered,
  };
}

async function secretOrEmpty(name) {
  try {
    const value = await getSecret(name);
    return value ? String(value).trim().replace(/^Bearer\s+/i, '') : '';
  } catch {
    return '';
  }
}

async function readResendKey() {
  const names = ['RESEND_API_KEY', 'Resend', 'resend_api_key'];
  for (const name of names) {
    const value = await secretOrEmpty(name);
    if (value) return value;
  }
  return '';
}

async function sendViaHttpMail({ to, subject, html, text, attachments }) {
  const sendgrid = await secretOrEmpty('SENDGRID_API_KEY');
  if (sendgrid) {
    return sendSendgrid(sendgrid, { to, subject, html, text, attachments });
  }
  const resend = await readResendKey();
  if (resend) {
    return sendResend(resend, { to, subject, html, text, attachments });
  }
  const brevo = await secretOrEmpty('BREVO_API_KEY');
  if (brevo) {
    return sendBrevo(brevo, { to, subject, html, text, attachments });
  }
  return {
    ok: false,
    skipped: true,
    reason: 'Kein SENDGRID_API_KEY, RESEND_API_KEY oder BREVO_API_KEY – nur Wix-Triggered-Email.',
  };
}

async function sendSendgrid(apiKey, { to, subject, html, text, attachments }) {
  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: to, name: 'Verbrauchsausweis' },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html },
    ],
    attachments: attachments.map((file) => ({
      content: file.contentBase64,
      filename: file.name,
      type: file.mimeType || 'application/octet-stream',
      disposition: 'attachment',
    })),
  };
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, provider: 'sendgrid', status: res.status };
}

function resendUserMessage(detail, from) {
  const text = String(detail || '');
  if (/only send testing emails|verify a domain|onboarding@resend\.dev/i.test(text)) {
    return (
      'Resend ist noch im Testmodus: Mails gehen nur an lukas@spaderna.org. ' +
      'Unter resend.com/domains die Domain spaderna.org verifizieren (DNS-Einträge). ' +
      'Danach im Wix Secrets Manager RESEND_FROM_EMAIL setzen, z. B. Ingenieurbüro Spaderna <noreply@spaderna.org>. ' +
      `Aktueller Absender: ${from || '–'}`
    );
  }
  return text.slice(0, 500);
}

async function sendResend(apiKey, { to, subject, html, text, attachments }) {
  const from =
    (await secretOrEmpty('RESEND_FROM_EMAIL')) ||
    'Ingenieurbüro Spaderna <lukas@spaderna.org>';
  const payload = {
    from,
    to: [to],
    reply_to: DEFAULT_ADMIN_EMAIL,
    subject,
    html,
    text,
    attachments: (attachments || []).map((file) => ({
      filename: file.name,
      content: file.contentBase64,
    })),
  };
  let res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  let detail = await res.text();
  if (!res.ok && payload.attachments.length) {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, attachments: [] }),
    });
    detail = await res.text();
  }
  const explained = resendUserMessage(detail, from);
  return {
    ok: res.ok,
    provider: 'resend',
    status: res.status,
    detail: explained,
    reason: res.ok ? undefined : explained,
    from,
    to,
  };
}

export async function sendResendConnectionTest() {
  const key = await readResendKey();
  if (!key) {
    return {
      ok: false,
      error:
        'Secret RESEND_API_KEY fehlt in Wix (Developer Tools → Secrets Manager). Der Name muss genau RESEND_API_KEY sein.',
    };
  }
  return sendPaidOrderEmails({
    orderNumber: 'TEST-RESEND',
    customer: {
      name: 'Resend-Test',
      email: DEFAULT_ADMIN_EMAIL,
      phone: '',
    },
    building: { strasse: 'Test', hausnummer: '1', plz: '96215', ort: 'Lichtenfels' },
    consumption: { energietraeger: 'heizoel', unit: 'liter', periods: [] },
    calculation: { efficiencyClass: '–' },
    mailAttachments: [
      {
        name: 'test.hsv',
        mimeType: 'text/plain',
        contentBase64: Buffer.from(
          '[Version]\r\nProgrammversion=HS Verbrauchspass 5.2.11\r\n',
          'utf8'
        ).toString('base64'),
      },
    ],
  });
}

async function sendBrevo(apiKey, { to, subject, html, text, attachments }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: to, name: 'Verbrauchsausweis' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      attachment: attachments.map((file) => ({
        name: file.name,
        content: file.contentBase64,
      })),
    }),
  });
  return { ok: res.ok, provider: 'brevo', status: res.status };
}

async function sendTriggeredFallback({ adminEmail, customerEmail, customerName, variables }) {
  const results = { admin: false, customer: false };
  if (adminEmail) {
    const adminId = await upsertContact({ name: 'Lukas Spaderna', email: adminEmail });
    await triggeredEmails.emailContact('email_order_admin', adminId, { variables });
    results.admin = true;
  }
  if (customerEmail) {
    const customerId = await upsertContact({ name: customerName, email: customerEmail });
    await triggeredEmails.emailContact('email_order_customer', customerId, { variables });
    results.customer = true;
  }
  return { ok: results.admin || results.customer, ...results };
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

function formatAddress(entity = {}) {
  return `${entity.strasse || ''} ${entity.hausnummer || ''}, ${entity.plz || ''} ${entity.ort || ''}`.trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label, value) {
  return `<tr><td style="padding:6px 0;color:#64748b;width:40%">${escapeHtml(label)}</td><td style="padding:6px 0">${escapeHtml(value || '–')}</td></tr>`;
}

function partyLabel(customer = {}) {
  if (customer.customerType === 'firma') return 'Firma';
  if (customer.customerType === 'herr') return 'Herr';
  if (customer.customerType === 'frau') return 'Frau';
  return '';
}

export function buildPaidText(body) {
  const c = body.customer || {};
  const b = body.building || {};
  const cons = body.consumption || {};
  const calc = body.calculation || {};
  const periods = cons.periods || [];
  const lines = [
    `Zahlung eingegangen: ${body.orderNumber || ''}`,
    `Wix-Bestellung: ${body.wixOrderNumber || ''}`,
    '',
    'Kunde',
    `${c.name || ''} (${partyLabel(c)})`,
    `Kundennummer: ${c.customerNumber || ''}`,
    `E-Mail: ${c.email || ''}`,
    `Telefon: ${c.phone || ''}`,
    `Anschrift: ${formatAddress(c)}`,
    '',
    'Gebäude',
    formatAddress(b),
    `Wohnfläche: ${b.wohnflaeche || ''} m²`,
    `Typ: ${b.gebaeudetyp || ''}`,
    `Baujahr: ${b.baujahr || ''} / Heizung ${b.baujahrHeizung || ''}`,
    `Keller beheizt: ${b.beheizterKeller || ''}`,
    `Warmwasser: ${b.warmwasser || ''}`,
    '',
    `Energieträger: ${calc.carrierLabel || cons.energietraeger || ''} ${cons.unit || ''}`,
    `Klasse: ${calc.efficiencyClass || ''}`,
    `Endenergie: ${calc.endSpecific != null ? Math.round(calc.endSpecific) : ''} kWh/(m²a)`,
    '',
    'Perioden',
    ...periods.map((p, i) => {
      const from = p.from?.year ? `${p.from.month}.${p.from.year}` : JSON.stringify(p.from);
      const to = p.to?.year ? `${p.to.month}.${p.to.year}` : JSON.stringify(p.to);
      return `${i + 1}. ${p.label || ''} ${from}–${to} Verbrauch ${p.consumption} Leerstand ${p.vacancy}% KF ${calc.climateFactors?.[i] ?? ''}`;
    }),
    '',
    `HSV: ${body.hsvFileName || ''}`,
    body.hsvDownloadUrl ? `HSV-Download: ${body.hsvDownloadUrl}` : '',
    ...(body.fileUrls || []).map((f) => `Dokument: ${f.name} ${f.downloadUrl || f.fileUrl || ''}`),
  ];
  return lines.filter((line) => line !== undefined).join('\n');
}

export function buildPaidHtml(body) {
  const c = body.customer || {};
  const b = body.building || {};
  const cons = body.consumption || {};
  const calc = body.calculation || {};
  const periods = cons.periods || [];
  const files = body.fileUrls || [];
  const hsvLink = body.hsvDownloadUrl
    ? `<p><a href="${escapeHtml(body.hsvDownloadUrl)}">HSV-Datei herunterladen</a> (${escapeHtml(body.hsvFileName || '.hsv')})</p>`
    : '';
  const fileLinks = files
    .map((f) => {
      const href = f.downloadUrl || f.fileUrl || '';
      return href
        ? `<li><a href="${escapeHtml(href)}">${escapeHtml(f.name || 'Dokument')}</a></li>`
        : `<li>${escapeHtml(f.name || 'Dokument')}</li>`;
    })
    .join('');
  const periodHtml = periods
    .map((p, i) => {
      const label = p.label || `Periode ${i + 1}`;
      return `<li>${escapeHtml(label)}: ${escapeHtml(p.consumption)} ${escapeHtml(cons.unit || '')}, Leerstand ${escapeHtml(p.vacancy || '0')} %, Klimafaktor ${escapeHtml(calc.climateFactors?.[i] ?? '')}</li>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8" /><title>Bezahlt ${escapeHtml(body.orderNumber)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Segoe UI,Arial,sans-serif;color:#2a3038;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td style="padding:24px;">
      <table role="presentation" width="640" align="center" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;">
        <tr><td style="background:#1C618C;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:700;">Zahlung eingegangen</td></tr>
        <tr><td style="padding:24px;">
          <p>Der Bezahlvorgang ist abgeschlossen. HSV-Datei und Kundendaten sind angefügt bzw. verlinkt.</p>
          ${hsvLink}
          <h3>Bestellung</h3>
          <table width="100%">${row('Bestellnummer', body.orderNumber)}${row('Wix-Bestellung', body.wixOrderNumber)}${row('Effizienzklasse', calc.efficiencyClass)}</table>
          <h3>Kunde</h3>
          <table width="100%">
            ${row('Name', c.name)}
            ${row('Geschlecht / Art', partyLabel(c))}
            ${row('Firma', c.companyName)}
            ${row('Kundennummer', c.customerNumber)}
            ${row('E-Mail', c.email)}
            ${row('Telefon', c.phone)}
            ${row('Anschrift', formatAddress(c))}
          </table>
          <h3>Gebäude</h3>
          <table width="100%">
            ${row('Objekt', formatAddress(b))}
            ${row('Wohnfläche', `${b.wohnflaeche || ''} m²`)}
            ${row('Gebäudetyp', b.gebaeudetyp === 'efh' ? '1-2 Familienhaus' : b.gebaeudetyp)}
            ${row('Baujahr Gebäude', b.baujahr)}
            ${row('Baujahr Heizung', b.baujahrHeizung)}
            ${row('Keller beheizt', b.beheizterKeller)}
            ${row('Warmwasser', b.warmwasser)}
          </table>
          <h3>Verbrauch</h3>
          <table width="100%">
            ${row('Energieträger', calc.carrierLabel || cons.energietraeger)}
            ${row('Einheit', cons.unit)}
            ${row('Endenergie', calc.endSpecific != null ? `${Math.round(calc.endSpecific)} kWh/(m²·a)` : '')}
            ${row('Primärenergie', calc.primarySpecific != null ? `${Math.round(calc.primarySpecific)} kWh/(m²·a)` : '')}
          </table>
          <ul>${periodHtml}</ul>
          <h3>Dokumente</h3>
          <ul>${fileLinks || '<li>keine</li>'}</ul>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderEmails(body) {
  return sendPaidOrderEmails(body);
}

export async function sendAdminMail(opts) {
  return sendViaHttpMail(opts);
}

export async function sendRegisterCodeEmail({ email, code, minutes }) {
  const html = `<p>Ihr Bestätigungscode für die Kundenanlage beim Ingenieurbüro Spaderna:</p>
<p style="font-size:28px;letter-spacing:6px;font-weight:700">${escapeHtml(code)}</p>
<p>Der Code ist ${Number(minutes) || 15} Minuten gültig. Wenn Sie das nicht waren, ignorieren Sie diese Mail.</p>`;
  const text = `Ihr Bestätigungscode: ${code}\nGültig ${Number(minutes) || 15} Minuten.`;
  return sendViaHttpMail({
    to: email,
    subject: 'Ihr Bestätigungscode',
    html,
    text,
    attachments: [],
  });
}

export async function sendServiceInquiryEmail(body = {}) {
  const adminEmail = await resolveAdminEmail();
  const contact = body.contact || {};
  const answers = body.answers || {};
  const files = Array.isArray(body.files) ? body.files : [];
  const fileHtml = files
    .map((file) => {
      const label = file.label || file.name || 'Datei';
      const url = file.url || file.downloadUrl || '';
      return url
        ? `<li>${escapeHtml(label)}: <a href="${escapeHtml(url)}">${escapeHtml(file.name || 'Download')}</a></li>`
        : `<li>${escapeHtml(label)}</li>`;
    })
    .join('');
  const fileText = files
    .map((file) => `${file.label || file.name}: ${file.url || file.downloadUrl || ''}`)
    .join('\n');
  const subject = `Anfrage: ${body.titel || body.serviceId || 'Leistung'}`;
  const html = `<p>Neue Leistungsanfrage.</p>
<p><b>${escapeHtml(body.titel || '')}</b>${body.preis ? ` · ${escapeHtml(body.preis)}` : ''}</p>
<p>SevDesk-Kunde: ${escapeHtml(body.sevdeskCustomerId || '')}
${body.customerNumber ? ` · Nr. ${escapeHtml(body.customerNumber)}` : ''}</p>
<h3>Kontakt</h3>
<ul>
<li>Name: ${escapeHtml(contact.name || '')}</li>
<li>E-Mail: ${escapeHtml(contact.email || '')}</li>
<li>Telefon: ${escapeHtml(contact.phone || '')}</li>
<li>Ort: ${escapeHtml(contact.ort || '')}</li>
<li>Adresse: ${escapeHtml(contact.adresse || '')}</li>
</ul>
<h3>Erfassung</h3>
<ul>
<li>Gebäudetyp: ${escapeHtml(answers.gebaeudetyp || '')}</li>
<li>Baujahr: ${escapeHtml(answers.baujahr || '')}</li>
<li>Fläche: ${escapeHtml(answers.wohnflaeche || '')}</li>
<li>Heizung: ${escapeHtml(answers.heizung || '')}</li>
</ul>
<p>${escapeHtml(answers.nachricht || '')}</p>
<h3>Dateien</h3>
<ul>${fileHtml || '<li>keine</li>'}</ul>`;
  const text = `${subject}
${contact.name} ${contact.email} ${contact.phone}
${contact.ort} ${contact.adresse}
${answers.gebaeudetyp} ${answers.baujahr} ${answers.wohnflaeche} ${answers.heizung}
${answers.nachricht || ''}
${fileText}`;
  return sendViaHttpMail({ to: adminEmail, subject, html, text, attachments: [] });
}
