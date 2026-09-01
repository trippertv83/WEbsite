/**
 * E-Mail-Code vor SevDesk.
 * Speichert in der bestehenden CMS-Sammlung CertificateOrders
 * (status: auth-code / auth-session / auth-newcustomer),
 * weil neue Sammlungen per API oft FORBIDDEN sind.
 */

import wixData from 'wix-data';
import { createHash, randomBytes } from 'crypto';
import { createCustomer, findCustomerByEmail } from 'backend/sevdesk';
import { sendRegisterCodeEmail } from 'backend/email';
import { ensureCertificateOrders } from 'backend/database';

const COLLECTION = 'CertificateOrders';
const OPTIONS = { suppressAuth: true };
const CODE_MINUTES = 15;
const SESSION_DAYS = 30;
const MAX_CODES_EMAIL = 3;
const MAX_CODES_IP = 8;
const MAX_VERIFY_FAILS = 8;
const MAX_NEW_CUSTOMERS_IP_DAY = 8;

function sha(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function sixDigit() {
  const n = randomBytes(4).readUInt32BE(0) % 900000;
  return String(100000 + n);
}

function sessionToken() {
  return randomBytes(24).toString('hex');
}

export function clientIp(request) {
  const headers = request?.headers || {};
  const read = (name) => {
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name] || headers[name.toLowerCase()];
  };
  const raw = read('x-forwarded-for') || read('x-real-ip') || request?.ip || '';
  return String(raw).split(',')[0].trim().slice(0, 80) || 'unknown';
}

function normEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function authStatus(kind) {
  return `auth-${kind}`;
}

function toIso(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function authItem({
  kind,
  email,
  ip,
  codeHash,
  tokenHash,
  sevdeskCustomerId,
  customerNumber,
  customerName,
  attempts,
  expiresAt,
}) {
  const now = new Date();
  return {
    orderNumber: `AUTH-${kind}-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`,
    status: authStatus(kind),
    customerEmail: email || '',
    customerName: customerName || kind,
    hsvDownloadToken: ip || '',
    hsvContent: tokenHash || codeHash || '',
    calculation: {
      auth: true,
      kind,
      ip: ip || '',
      codeHash: codeHash || '',
      tokenHash: tokenHash || '',
      sevdeskCustomerId: sevdeskCustomerId || '',
      customerNumber: customerNumber || '',
      customerName: customerName || '',
      attempts: Number(attempts || 0),
      expiresAt: toIso(expiresAt),
    },
    createdAt: now,
    updatedAt: now,
  };
}

function fromItem(item) {
  if (!item) return null;
  const calc = item.calculation || {};
  return {
    item,
    kind: calc.kind,
    email: item.customerEmail,
    ip: calc.ip || item.hsvDownloadToken,
    codeHash: calc.codeHash,
    tokenHash: calc.tokenHash || item.hsvContent,
    attempts: Number(calc.attempts || 0),
    expiresAt: calc.expiresAt ? new Date(calc.expiresAt) : new Date(0),
    sevdeskCustomerId: calc.sevdeskCustomerId,
    customerNumber: calc.customerNumber,
    customerName: calc.customerName || item.customerName,
  };
}

async function ensure() {
  await ensureCertificateOrders();
}

async function countSince({ kind, email, ip, since }) {
  await ensure();
  let q = wixData.query(COLLECTION).eq('status', authStatus(kind)).ge('createdAt', since);
  if (email) q = q.eq('customerEmail', email);
  if (ip) q = q.eq('hsvDownloadToken', ip);
  const res = await q.limit(50).find(OPTIONS);
  return res.items.length;
}

export async function requestRegisterCode({ email, mode, ip }) {
  await ensure();
  const clean = normEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    throw new Error('Bitte eine gültige E-Mail angeben.');
  }

  const login = mode === 'login';
  const existing = await findCustomerByEmail(clean);
  if (login) {
    if (!existing) {
      const err = new Error(
        'Kein Kunde mit dieser E-Mail. Bitte „Neuer Kunde“ wählen.'
      );
      err.status = 404;
      throw err;
    }
    const err = new Error(
      'Als Bestandskunde brauchen Sie keinen Code. Bitte „Mit E-Mail anmelden“ klicken.'
    );
    err.status = 400;
    throw err;
  }
  if (existing) {
    const err = new Error(
      'Diese E-Mail ist schon Kunde. Bitte „Ich bin schon Kunde“ wählen. Es wurde kein neuer SevDesk-Kunde angelegt.'
    );
    err.status = 409;
    throw err;
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const window15 = new Date(now.getTime() - CODE_MINUTES * 60 * 1000);

  const byEmail = await countSince({
    kind: 'code',
    email: clean,
    since: window15,
  });
  if (byEmail >= MAX_CODES_EMAIL) {
    throw new Error(
      'Zu viele Codes an diese E-Mail. Bitte 15 Minuten warten.'
    );
  }
  const byIp = await countSince({ kind: 'code', ip, since: hourAgo });
  if (byIp >= MAX_CODES_IP) {
    throw new Error('Zu viele Anfragen von diesem Anschluss. Bitte später erneut versuchen.');
  }

  const code = sixDigit();
  const expiresAt = new Date(now.getTime() + CODE_MINUTES * 60 * 1000);
  await wixData.insert(
    COLLECTION,
    authItem({
      kind: 'code',
      email: clean,
      ip: ip || '',
      codeHash: sha(`${clean}:${code}`),
      attempts: 0,
      expiresAt,
    }),
    OPTIONS
  );

  const mailed = await sendRegisterCodeEmail({ email: clean, code, minutes: CODE_MINUTES });
  if (!mailed.ok) {
    throw new Error(
      mailed.reason ||
        mailed.detail ||
        'Code-Mail konnte nicht gesendet werden. Site veröffentlichen und RESEND_API_KEY prüfen.'
    );
  }
  return { ok: true, sent: true };
}

async function latestCode(email) {
  const now = new Date();
  const res = await wixData
    .query(COLLECTION)
    .eq('status', authStatus('code'))
    .eq('customerEmail', email)
    .descending('createdAt')
    .limit(8)
    .find(OPTIONS);
  const open = res.items
    .map(fromItem)
    .filter((row) => row.expiresAt.getTime() > now.getTime());
  return open[0] || null;
}

async function patchAuth(row, calcPatch) {
  const item = row.item;
  await wixData.update(
    COLLECTION,
    {
      ...item,
      calculation: { ...(item.calculation || {}), ...calcPatch },
      updatedAt: new Date(),
    },
    OPTIONS
  );
}

async function consumeCode({ email, code, ip }) {
  await ensure();
  const clean = normEmail(email);
  const row = await latestCode(clean);
  if (!row) {
    throw new Error('Kein gültiger Code. Bitte zuerst „Code senden“ klicken.');
  }
  const fails = Number(row.attempts || 0);
  if (fails >= MAX_VERIFY_FAILS) {
    throw new Error('Zu viele falsche Codes. Bitte 15 Minuten warten und neu anfordern.');
  }
  if (row.codeHash !== sha(`${clean}:${String(code || '').trim()}`)) {
    await patchAuth(row, { attempts: fails + 1 });
    throw new Error('Code ist ungültig.');
  }
  await patchAuth(row, { expiresAt: new Date().toISOString(), attempts: fails });
  return { email: clean, ip };
}

async function issueSession({ email, ip, customer }) {
  await ensure();
  const token = sessionToken();
  const now = new Date();
  const tokenHash = sha(token);
  await wixData.insert(
    COLLECTION,
    authItem({
      kind: 'session',
      email,
      ip: ip || '',
      tokenHash,
      sevdeskCustomerId: String(customer.id || customer.sevdeskCustomerId || ''),
      customerNumber: customer.customerNumber ? String(customer.customerNumber) : '',
      customerName: customer.name || '',
      attempts: 0,
      expiresAt: new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    }),
    OPTIONS
  );
  return token;
}

export async function completeRegistration({ customer, mode, code, ip }) {
  const clean = normEmail(customer?.email);
  const login = mode === 'login';
  if (!login) {
    await consumeCode({ email: clean, code, ip });
  }

  if (login) {
    const found = await findCustomerByEmail(clean);
    if (!found) {
      throw new Error('Kein SevDesk-Kunde mit dieser E-Mail.');
    }
    const token = await issueSession({ email: clean, ip, customer: found });
    return {
      ok: true,
      existing: true,
      sessionToken: token,
      sevdeskCustomerId: found.id,
      customerName: found.name,
      customerNumber: found.customerNumber || null,
      email: clean,
    };
  }

  const already = await findCustomerByEmail(clean);
  if (!already) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const createdToday = await countSince({
      kind: 'newcustomer',
      ip,
      since: dayAgo,
    });
    if (createdToday >= MAX_NEW_CUSTOMERS_IP_DAY) {
      throw new Error(
        'Heute wurden von diesem Anschluss schon zu viele neue Kunden angelegt. Bitte morgen erneut versuchen oder anrufen.'
      );
    }
  }

  const created = await createCustomer({ customer: { ...customer, email: clean } });
  if (!created.existing) {
    await wixData.insert(
      COLLECTION,
      authItem({
        kind: 'newcustomer',
        email: clean,
        ip: ip || '',
        attempts: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
      OPTIONS
    );
  }
  const token = await issueSession({ email: clean, ip, customer: created });
  return {
    ok: true,
    existing: Boolean(created.existing),
    sessionToken: token,
    sevdeskCustomerId: created.id,
    customerName: created.name || '',
    customerNumber: created.customerNumber || null,
    email: clean,
  };
}

export async function readSession(token) {
  if (!token) return null;
  await ensure();
  const res = await wixData
    .query(COLLECTION)
    .eq('status', authStatus('session'))
    .eq('hsvContent', sha(token))
    .limit(5)
    .find(OPTIONS);
  const now = Date.now();
  const row = res.items.map(fromItem).find((item) => item.expiresAt.getTime() > now);
  if (!row) return null;
  return {
    email: row.email,
    sevdeskCustomerId: row.sevdeskCustomerId,
    customerNumber: row.customerNumber,
    customerName: row.customerName,
  };
}
