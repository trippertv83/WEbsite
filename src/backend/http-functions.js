/**
 * HTTP-Functions. CORS für den GitHub-Pages-Wizard.
 */

import { response } from 'wix-http-functions';
import { createCertificateOrder, appendOrderAttachment, receiveFileChunk } from 'backend/database';
import { createCustomer, findCustomerByEmail } from 'backend/sevdesk';
import { getCertificateProduct } from 'backend/payment';
import { lookupClimateFactor } from 'backend/climate';
import { hsvForDownload } from 'backend/paid-notify';
import { sendResendConnectionTest } from 'backend/email';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function json(status, body) {
  return response({
    status,
    headers: corsHeaders(),
    body,
  });
}

export function options_registerCustomer() {
  return json(200, { ok: true });
}

export function options_createCertificateOrder() {
  return json(200, { ok: true });
}

export function options_uploadOrderFile() {
  return json(200, { ok: true });
}

export function options_climateFactor() {
  return json(200, { ok: true });
}

export function options_downloadHsv() {
  return json(200, { ok: true });
}

export function options_productPrice() {
  return json(200, { ok: true });
}

export function options_testResendMail() {
  return json(200, { ok: true });
}

function queryParam(request, name) {
  const q = request.query;
  if (!q) return undefined;
  if (typeof q === 'function') return q(name);
  if (typeof q.get === 'function') return q.get(name);
  return q[name];
}

export async function get_climateFactor(request) {
  try {
    const plz = queryParam(request, 'plz');
    const from = queryParam(request, 'from');
    const to = queryParam(request, 'to');
    if (!plz || !from || !to) {
      return json(400, { error: 'plz, from und to sind Pflicht.' });
    }
    const result = await lookupClimateFactor(plz, from, to);
    return json(200, { ok: true, ...result });
  } catch (error) {
    console.error(error);
    return json(200, { ok: true, factor: 1, source: 'fallback' });
  }
}

export async function get_productPrice(request) {
  try {
    const productId = queryParam(request, 'productId');
    if (!productId || String(productId).startsWith('00000000')) {
      return json(400, { error: 'Produkt-ID fehlt.' });
    }
    const product = await getCertificateProduct(productId);
    return json(200, {
      ok: true,
      price: product.price,
      currency: product.currency || 'EUR',
      name: product.name,
    });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Produktpreis nicht lesbar.' });
  }
}

export async function get_downloadHsv(request) {
  try {
    const order = queryParam(request, 'order');
    const token = queryParam(request, 't');
    const file = await hsvForDownload(order, token);
    return response({
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=iso-8859-1',
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Access-Control-Allow-Origin': '*',
      },
      body: file.content,
    });
  } catch (error) {
    console.error(error);
    return json(404, { error: error.message || 'HSV nicht gefunden.' });
  }
}

export async function get_testResendMail() {
  try {
    const result = await sendResendConnectionTest();
    return json(result.ok ? 200 : 500, result);
  } catch (error) {
    console.error(error);
    return json(500, { ok: false, error: error.message || String(error) });
  }
}

export async function post_registerCustomer(request) {
  try {
    const body = await request.body.json();
    const c = body?.customer || {};
    const mode = body?.mode === 'login' ? 'login' : 'register';

    if (!c.email) {
      return json(400, { error: 'E-Mail ist Pflicht.' });
    }

    if (mode === 'login') {
      const found = await findCustomerByEmail(c.email);
      if (!found) {
        return json(404, {
          error:
            'Kein SevDesk-Kunde mit dieser E-Mail. Bitte „Neuer Kunde“ wählen und registrieren.',
        });
      }
      return json(200, {
        ok: true,
        existing: true,
        sevdeskCustomerId: found.id,
        customerName: found.name,
        customerNumber: found.customerNumber || null,
        email: c.email,
      });
    }

    if (!['firma', 'herr', 'frau'].includes(c.customerType)) {
      return json(400, { error: 'Bitte Firma, Herr oder Frau wählen.' });
    }
    if (c.customerType === 'firma' && (!c.companyName || !c.contactFirstName || !c.contactLastName)) {
      return json(400, { error: 'Firmenname und Ansprechpartner (Vor- und Nachname) sind Pflicht.' });
    }
    if (c.customerType !== 'firma' && (!c.firstName || !c.lastName)) {
      return json(400, { error: 'Vor- und Nachname sind Pflicht.' });
    }
    if (!c.plz || !c.ort || !c.strasse) {
      return json(400, { error: 'Anschrift und E-Mail sind Pflicht.' });
    }

    const customer = await createCustomer({ customer: c });
    return json(201, {
      ok: true,
      existing: Boolean(customer.existing),
      sevdeskCustomerId: customer.id,
      customerName: customer.name || `${c.firstName} ${c.lastName}`,
      customerNumber: customer.customerNumber || null,
      email: c.email,
    });
  } catch (error) {
    console.error(error);
    return json(500, {
      error:
        error.message ||
        'SevDesk-Kunde konnte nicht angelegt werden. Secret SEVDESK_API_TOKEN und API-Rechte prüfen.',
    });
  }
}

export async function post_createCertificateOrder(request) {
  try {
    const body = await request.body.json();
    if (!body?.building || !body?.consumption || !body?.orderNumber) {
      return json(400, { error: 'Unvollständige Bestelldaten.' });
    }

    const record = await createCertificateOrder(body);
    return json(201, {
      ok: true,
      orderNumber: body.orderNumber,
      id: record._id,
    });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Interner Fehler' });
  }
}

export async function post_uploadOrderFile(request) {
  try {
    const body = await request.body.json();
    if (!body?.orderNumber) {
      return json(400, { error: 'Auftragsnummer fehlt.' });
    }
    if (body.chunk != null) {
      const result = await receiveFileChunk({
        orderNumber: body.orderNumber,
        fileName: body.fileName,
        category: body.category,
        mimeType: body.mimeType,
        index: body.index,
        total: body.total,
        chunk: body.chunk,
      });
      return json(200, { ok: true, ...result });
    }
    if (!body?.file?.contentBase64) {
      return json(400, { error: 'Datei fehlt.' });
    }
    await appendOrderAttachment(body.orderNumber, body.file);
    return json(200, { ok: true, orderNumber: body.orderNumber, complete: true });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Upload fehlgeschlagen.' });
  }
}
