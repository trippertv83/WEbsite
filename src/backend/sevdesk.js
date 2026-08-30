/**
 * SevDesk API – nur serverseitig.
 * Secrets: SEVDESK_API_TOKEN, SEVDESK_USER_ID
 */

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const BASE = 'https://my.sevdesk.de/api/v1';

async function sevdeskFetch(path, { method = 'GET', body } = {}) {
  const token = await getSecret('SEVDESK_API_TOKEN');
  const url = `${BASE}${path}`;
  const headers = {
    Authorization: token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`SevDesk ${method} ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

export async function createCustomer(body) {
  const userId = Number(await getSecret('SEVDESK_USER_ID'));
  const name = body.customer?.name || 'Unbekannt';
  const created = await sevdeskFetch('/Contact', {
    method: 'POST',
    body: {
      name,
      category: { id: 3, objectName: 'Category' },
      status: 1000,
      customerNumber: body.orderNumber,
    },
  });
  const id = created.objects?.id || created.objects?.[0]?.id;
  if (body.customer?.email) {
    await sevdeskFetch('/CommunicationWay', {
      method: 'POST',
      body: {
        contact: { id, objectName: 'Contact' },
        type: 'EMAIL',
        value: body.customer.email,
        key: { id: 1, objectName: 'CommunicationWayKey' },
        main: 1,
      },
    });
  }
  const address = body.building || {};
  await sevdeskFetch('/ContactAddress', {
    method: 'POST',
    body: {
      contact: { id, objectName: 'Contact' },
      street: `${address.strasse || ''} ${address.hausnummer || ''}`.trim(),
      zip: address.plz || '',
      city: address.ort || '',
      country: { id: 1, objectName: 'StaticCountry' },
      category: { id: 47, objectName: 'Category' },
    },
  }).catch(() => null);
  return { id, userId, raw: created };
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
  const orderId = created.objects?.id || created.objects?.[0]?.id;
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
  const invoiceId = created.objects?.id || created.objects?.[0]?.id;
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
      body: {
        fileName: file.name,
        folder: null,
      },
    }).catch((error) => ({ error: error.message, name: file.name }));
    uploaded.push(saved);
  }
  return uploaded;
}
