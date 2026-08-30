/**
 * POST /_functions/createCertificateOrder
 * Dateiname und Ort sind verpflichtend: src/backend/http-functions.js
 */

import { created, badRequest, serverError } from 'wix-http-functions';
import { createCertificateOrder } from 'backend/database';
import { sendOrderEmails } from 'backend/email';
import { createCustomer, createInvoice, createOrder, uploadDocuments } from 'backend/sevdesk';
import { registerPaidOrder } from 'backend/payment';

export async function post_createCertificateOrder(request) {
  try {
    const body = await request.body.json();
    if (!body?.building || !body?.consumption || !body?.orderNumber) {
      return badRequest({ body: { error: 'Unvollständige Bestelldaten.' } });
    }

    const record = await createCertificateOrder(body);

    try {
      const customer = await createCustomer(body);
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
        'Auftrag in Wix gespeichert. SevDesk/E-Mail/Status übersprungen:',
        integrationError
      );
    }

    return created({
      headers: { 'Content-Type': 'application/json' },
      body: {
        ok: true,
        orderNumber: body.orderNumber,
        id: record._id,
      },
    });
  } catch (error) {
    console.error(error);
    return serverError({
      body: { error: error.message || 'Interner Fehler' },
    });
  }
}
