/**
 * HTTP-Functions. CORS für den GitHub-Pages-Wizard.
 */

import { response } from 'wix-http-functions';
import { createCertificateOrder } from 'backend/database';
import { sendOrderEmails } from 'backend/email';
import {
  createCustomer,
  createInvoice,
  createOrder,
  findCustomerByEmail,
  uploadDocuments,
} from 'backend/sevdesk';
import { registerPaidOrder } from 'backend/payment';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        email: c.email,
      });
    }

    if (!c.firstName || !c.lastName || !c.plz || !c.ort || !c.strasse) {
      return json(400, { error: 'Name, Anschrift und E-Mail sind Pflicht.' });
    }

    const customer = await createCustomer({ customer: c });
    return json(201, {
      ok: true,
      existing: Boolean(customer.existing),
      sevdeskCustomerId: customer.id,
      customerName: customer.name || `${c.firstName} ${c.lastName}`,
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
    const sevdeskCustomerId =
      body.customer?.sevdeskCustomerId || body.sevdeskCustomerId;

    try {
      const customer = sevdeskCustomerId
        ? { id: sevdeskCustomerId }
        : await createCustomer(body);
      const order = await createOrder({ ...body, sevdeskCustomerId: customer.id });
      const media = await uploadDocuments({
        orderNumber: body.orderNumber,
        attachments: body.attachments || [],
      });
      await createInvoice({
        ...body,
        sevdeskCustomerId: customer.id,
        sevdeskOrderId: order.id,
      });
      await registerPaidOrder({
        orderNumber: body.orderNumber,
        recordId: record._id,
      });
      await sendOrderEmails({ ...body, record, invoice: null, media });
    } catch (integrationError) {
      console.error(
        'Auftrag in Wix gespeichert. SevDesk-Auftrag/E-Mail übersprungen:',
        integrationError
      );
    }

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
