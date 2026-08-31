/**
 * HTTP-Functions. CORS für Aufrufe vom GitHub-Pages-Wizard.
 *
 * POST /_functions/registerCustomer
 * POST /_functions/createCertificateOrder
 */

import { created, badRequest, serverError, ok } from 'wix-http-functions';
import { createCertificateOrder } from 'backend/database';
import { sendOrderEmails } from 'backend/email';
import { createCustomer, createInvoice, createOrder, uploadDocuments } from 'backend/sevdesk';
import { registerPaidOrder } from 'backend/payment';

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

export function options_registerCustomer() {
  return ok({ headers: corsHeaders() });
}

export function options_createCertificateOrder() {
  return ok({ headers: corsHeaders() });
}

export async function post_registerCustomer(request) {
  try {
    const body = await request.body.json();
    const c = body?.customer || {};
    if (!c.email || !c.firstName || !c.lastName || !c.plz || !c.ort || !c.strasse) {
      return badRequest({
        headers: corsHeaders(),
        body: { error: 'Name, Anschrift und E-Mail sind Pflicht.' },
      });
    }

    const customer = await createCustomer({ customer: c });
    return created({
      headers: corsHeaders(),
      body: {
        ok: true,
        sevdeskCustomerId: customer.id,
      },
    });
  } catch (error) {
    console.error(error);
    return serverError({
      headers: corsHeaders(),
      body: { error: error.message || 'SevDesk-Kunde konnte nicht angelegt werden.' },
    });
  }
}

export async function post_createCertificateOrder(request) {
  try {
    const body = await request.body.json();
    if (!body?.building || !body?.consumption || !body?.orderNumber) {
      return badRequest({
        headers: corsHeaders(),
        body: { error: 'Unvollständige Bestelldaten.' },
      });
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
      await registerPaidOrder({ orderNumber: body.orderNumber, recordId: record._id });
      await sendOrderEmails({ ...body, record, invoice: null, media });
    } catch (integrationError) {
      console.error(
        'Auftrag in Wix gespeichert. SevDesk-Auftrag/E-Mail übersprungen:',
        integrationError
      );
    }

    return created({
      headers: corsHeaders(),
      body: {
        ok: true,
        orderNumber: body.orderNumber,
        id: record._id,
      },
    });
  } catch (error) {
    console.error(error);
    return serverError({
      headers: corsHeaders(),
      body: { error: error.message || 'Interner Fehler' },
    });
  }
}
