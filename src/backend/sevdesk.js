/**
 * SevDesk API v1 – nur serverseitig.
 * Secrets: SEVDESK_API_TOKEN, optional SEVDESK_USER_ID
 * https://api.sevdesk.de/
 */

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const BASE = 'https://my.sevdesk.de/api/v1';

async function sevdeskFetch(path, { method = 'GET', body } = {}) {
  const token = await getSecret('SEVDESK_API_TOKEN');
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`SevDesk ${method} ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

function extractId(payload) {
  const obj = payload.objects;
  if (!obj) return null;
  if (Array.isArray(obj)) return obj[0]?.id || null;
  return obj.id || null;
}

function customerAddress(body) {
  const c = body.customer || {};
  const b = body.building || {};
  return {
    strasse: c.strasse || b.strasse || '',
    hausnummer: c.hausnummer || b.hausnummer || '',
    plz: c.plz || b.plz || '',
    ort: c.ort || b.ort || '',
  };
}

export async function createCustomer(body) {
  const c = body.customer || {};
  const first = String(c.firstName || '').trim();
  const last = String(c.lastName || '').trim();
  const name = String(c.name || `${first} ${last}`).trim() || 'Unbekannt';
  const created = await sevdeskFetch('/Contact', {
    method: 'POST',
    body: {
      name,
      surename: first || name,
      familyname: last || name,
      category: { id: 3, objectName: 'Category' },
      status: 1000,
      customerNumber: body.orderNumber || `WEB-${Date.now()}`,
    },
  });
  const id = extractId(created);
  if (!id) {
    throw new Error('SevDesk hat keine Kontakt-ID zurückgegeben.');
  }

  if (c.email) {
    await sevdeskFetch('/CommunicationWay', {
      method: 'POST',
      body: {
        contact: { id, objectName: 'Contact' },
        type: 'EMAIL',
        value: c.email,
        key: { id: 1, objectName: 'CommunicationWayKey' },
        main: 1,
      },
    });
  }

  const address = customerAddress(body);
  if (address.plz || address.ort || address.strasse) {
    await sevdeskFetch('/ContactAddress', {
      method: 'POST',
      body: {
        contact: { id, objectName: 'Contact' },
        street: `${address.strasse} ${address.hausnummer}`.trim(),
        zip: address.plz,
        city: address.ort,
        country: { id: 1, objectName: 'StaticCountry' },
        category: { id: 47, objectName: 'Category' },
      },
    });
  }

  return { id, raw: created };
}

export async function createOrder(body) {
  const userId = Number(await getSecret('SEVDESK_USER_ID'));
  const created = await sevdeskFetch('/Order', {
    method: 'POST',
    body: {
      orderNumber: body.orderNumber,
      contact: { id: body.sevdeskCustomerId, objectName: 'Contact' },
      orderDate: new Date().toISOString().slice(0, 10),
      status: 100,
      header: 'Verbrauchsausweis Wohngebäude',
      headText: `Objekt: ${body.building?.strasse || ''} ${body.building?.hausnummer || ''}`,
      footText: 'Ausstellung nach GEG nach Prüfung der Unterlagen.',
      addressCountry: { id: 1, objectName: 'StaticCountry' },
      contactPerson: { id: userId, objectName: 'SevUser' },
    },
  });
  const orderId = extractId(created);
  await sevdeskFetch('/OrderPos', {
    method: 'POST',
    body: {
      order: { id: orderId, objectName: 'Order' },
      quantity: 1,
      name: 'Verbrauchsausweis Wohngebäude',
      text: `Bestellnr. ${body.orderNumber}`,
      price: 0,
      taxRate: 19,
      unity: { id: 1, objectName: 'Unity' },
    },
  });
  return { id: orderId, raw: created };
}

export async function createInvoice(body) {
  const userId = Number(await getSecret('SEVDESK_USER_ID'));
  const created = await sevdeskFetch('/Invoice', {
    method: 'POST',
    body: {
      invoiceNumber: body.orderNumber,
      contact: { id: body.sevdeskCustomerId, objectName: 'Contact' },
      invoiceDate: new Date().toISOString().slice(0, 10),
      status: 100,
      invoiceType: 'RE',
      currency: 'EUR',
      mapAll: true,
      header: 'Verbrauchsausweis Wohngebäude',
      headText: `Referenz ${body.orderNumber}`,
      contactPerson: { id: userId, objectName: 'SevUser' },
      addressCountry: { id: 1, objectName: 'StaticCountry' },
    },
  });
  const invoiceId = extractId(created);
  await sevdeskFetch('/InvoicePos', {
    method: 'POST',
    body: {
      invoice: { id: invoiceId, objectName: 'Invoice' },
      quantity: 1,
      name: 'Verbrauchsausweis Wohngebäude',
      price: 0,
      taxRate: 19,
      unity: { id: 1, objectName: 'Unity' },
    },
  });
  return { id: invoiceId, raw: created };
}

export async function uploadDocuments(body) {
  const uploaded = [];
  for (const file of body.attachments || []) {
    const saved = await sevdeskFetch('/Document/Factory/upload', {
      method: 'POST',
      body: { fileName: file.name, folder: null },
    }).catch((error) => ({ error: error.message, name: file.name }));
    uploaded.push(saved);
  }
  return uploaded;
}
