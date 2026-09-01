/**
 * E-Mail-Code vor SevDesk, damit niemand massenhaft Kunden anlegt.
 */

import wixData from 'wix-data';
import { collections } from 'wix-data.v2';
import { createHash, randomBytes } from 'crypto';
import { createCustomer, findCustomerByEmail } from 'backend/sevdesk';
import { sendRegisterCodeEmail } from 'backend/email';

const COLLECTION = 'AuthChallenges';
const OPTIONS = { suppressAuth: true };
const CODE_MINUTES = 15;
const SESSION_DAYS = 30;
const MAX_CODES_EMAIL = 3;
const MAX_CODES_IP = 8;
const MAX_VERIFY_FAILS = 8;
const MAX_NEW_CUSTOMERS_IP_DAY = 8;

function field(key, displayName, type) {
  return { key, displayName, type };
}

const SCHEMA = {
  _id: COLLECTION,
  displayName: 'Anmelde-Codes',
  displayField: 'email',
  permissions: {
    read: 'ADMIN',
    insert: 'ADMIN',
    update: 'ADMIN',
    remove: 'ADMIN',
  },
  fields: [
    field('kind', 'Art', 'TEXT'),
    field('email', 'E-Mail', 'TEXT'),
    field('ip', 'IP', 'TEXT'),
    field('codeHash', 'Code-Hash', 'TEXT'),
    field('tokenHash', 'Token-Hash', 'TEXT'),
    field('sevdeskCustomerId', 'SevDesk-ID', 'TEXT'),
    field('customerNumber', 'Kundennummer', 'TEXT'),
    field('customerName', 'Name', 'TEXT'),
    field('attempts', 'Versuche', 'NUMBER'),
    field('expiresAt', 'Gültig bis', 'DATETIME'),
    field('createdAt', 'Erstellt', 'DATETIME'),
  ],
};

let ready = false;

async function ensure() {
  if (ready) return;
  try {
    await collections.getDataCollection(COLLECTION);
    ready = true;
    return;
  } catch {
    /* anlegen */
  }
  try {
    await collections.createDataCollection(SCHEMA);
    ready = true;
  } catch (error) {
    const msg = String(error.message || error);
    if (msg.includes('already exists') || msg.includes('WDE0026')) {
      ready = true;
      return;
    }
    throw new Error(
      'CMS-Sammlung AuthChallenges fehlt. Im Wix-Dashboard anlegen (ID genau AuthChallenges) und Site veröffentlichen. ' +
        msg
    );
  }
}

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

async function countSince({ kind, email, ip, since }) {
  await ensure();
  let q = wixData.query(COLLECTION).eq('kind', kind).ge('createdAt', since);
  if (email) q = q.eq('email', email);
  if (ip) q = q.eq('ip', ip);
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
  if (login && !existing) {
    const err = new Error(
      'Kein Kunde mit dieser E-Mail. Bitte „Neuer Kunde“ wählen.'
    );
    err.status = 404;
    throw err;
  }
  if (!login && existing) {
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
    {
      kind: 'code',
      email: clean,
      ip: ip || '',
      codeHash: sha(`${clean}:${code}`),
      attempts: 0,
      expiresAt,
      createdAt: now,
    },
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
    .eq('kind', 'code')
    .eq('email', email)
    .gt('expiresAt', now)
    .descending('createdAt')
    .limit(1)
    .find(OPTIONS);
  return res.items[0] || null;
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
    await wixData.update(
      COLLECTION,
      { ...row, attempts: fails + 1 },
      OPTIONS
    );
    throw new Error('Code ist ungültig.');
  }
  await wixData.update(
    COLLECTION,
    { ...row, expiresAt: new Date(), attempts: fails },
    OPTIONS
  );
  return { email: clean, ip };
}

async function issueSession({ email, ip, customer }) {
  await ensure();
  const token = sessionToken();
  const now = new Date();
  await wixData.insert(
    COLLECTION,
    {
      kind: 'session',
      email,
      ip: ip || '',
      tokenHash: sha(token),
      sevdeskCustomerId: String(customer.id || customer.sevdeskCustomerId || ''),
      customerNumber: customer.customerNumber ? String(customer.customerNumber) : '',
      customerName: customer.name || '',
      attempts: 0,
      expiresAt: new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
    },
    OPTIONS
  );
  return token;
}

export async function completeRegistration({ customer, mode, code, ip }) {
  const clean = normEmail(customer?.email);
  await consumeCode({ email: clean, code, ip });
  const login = mode === 'login';

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
      {
        kind: 'newcustomer',
        email: clean,
        ip: ip || '',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        attempts: 0,
      },
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
    .eq('kind', 'session')
    .eq('tokenHash', sha(token))
    .gt('expiresAt', new Date())
    .limit(1)
    .find(OPTIONS);
  const row = res.items[0];
  if (!row) return null;
  return {
    email: row.email,
    sevdeskCustomerId: row.sevdeskCustomerId,
    customerNumber: row.customerNumber,
    customerName: row.customerName,
  };
}
