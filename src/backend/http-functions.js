/**
 * HTTP-Functions. CORS für den GitHub-Pages-Wizard.
 */

import { response } from 'wix-http-functions';
import { createCertificateOrder, appendOrderAttachment, receiveFileChunk, uploadInquiryFile } from 'backend/database';
import { getCertificateProduct } from 'backend/payment';
import { lookupClimateFactor } from 'backend/climate';
import { hsvForDownload } from 'backend/paid-notify';
import { sendResendConnectionTest, sendServiceInquiryEmail } from 'backend/email';
import {
  requestRegisterCode,
  completeRegistration,
  readSession,
  clientIp,
} from 'backend/auth';

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

export function options_requestRegisterCode() {
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

export function options_inquiryFile() {
  return json(200, { ok: true });
}

export function options_serviceInquiry() {
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

export async function post_requestRegisterCode(request) {
  try {
    const body = await request.body.json();
    const result = await requestRegisterCode({
      email: body?.email || body?.customer?.email,
      mode: body?.mode === 'login' ? 'login' : 'register',
      ip: clientIp(request),
    });
    return json(200, result);
  } catch (error) {
    console.error(error);
    return json(error.status || 400, {
      error: error.message || 'Code konnte nicht gesendet werden.',
    });
  }
}

export async function post_registerCustomer(request) {
  try {
    const body = await request.body.json();
    const c = body?.customer || {};
    const mode = body?.mode === 'login' ? 'login' : 'register';
    const ip = clientIp(request);

    if (!c.email) {
      return json(400, { error: 'E-Mail ist Pflicht.' });
    }

    if (mode === 'register') {
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
    }

    const customer = await completeRegistration({
      customer: c,
      mode,
      code: body.code,
      ip,
      skipCode: !body.code,
    });
    return json(mode === 'register' && !customer.existing ? 201 : 200, customer);
  } catch (error) {
    console.error(error);
    return json(error.status || 500, {
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

export async function post_inquiryFile(request) {
  try {
    const body = await request.body.json();
    const session = await readSession(body?.sessionToken);
    if (!session) {
      return json(401, { error: 'Bitte zuerst als Kunde registrieren oder anmelden.' });
    }
    if (!body?.contentBase64) {
      return json(400, { error: 'Datei fehlt.' });
    }
    const saved = await uploadInquiryFile(body);
    return json(200, { ok: true, ...saved });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Upload fehlgeschlagen.' });
  }
}

export async function post_serviceInquiry(request) {
  try {
    const body = await request.body.json();
    const session = await readSession(body?.sessionToken);
    if (!session) {
      return json(401, { error: 'Bitte zuerst als Kunde registrieren oder anmelden.' });
    }
    if (!body?.contact?.email || !body?.contact?.name) {
      return json(400, { error: 'Name und E-Mail sind Pflicht.' });
    }
    const mail = await sendServiceInquiryEmail({
      ...body,
      contact: {
        ...body.contact,
        email: session.email || body.contact.email,
      },
      sevdeskCustomerId: session.sevdeskCustomerId,
      customerNumber: session.customerNumber,
    });
    if (!mail.ok) {
      return json(500, {
        error:
          mail.reason ||
          mail.detail ||
          'E-Mail konnte nicht gesendet werden. RESEND_API_KEY prüfen und Site veröffentlichen.',
      });
    }
    return json(200, { ok: true, sevdeskCustomerId: session.sevdeskCustomerId });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || 'Anfrage fehlgeschlagen.' });
  }
}
