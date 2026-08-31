/**
 * Nach erfolgreicher Zahlung: HSV einmal erzeugen und an Admin senden.
 */

import { Buffer } from 'buffer';
import {
  findCertificateOrderByEmail,
  getCertificateOrder,
  saveHsvFile,
  tryClaimPaidMail,
  updateOrderStatus,
} from 'backend/database';
import { sendPaidOrderEmails } from 'backend/email';
import { buildHsvContent, hsvFileName, orderBodyFromRecord } from 'backend/hsv';

export function extractVaOrderNumber(source) {
  const text = typeof source === 'string' ? source : JSON.stringify(source || {});
  const match = text.match(/VA-\d{8}-[A-Z0-9]+/i);
  return match ? match[0] : '';
}

function orderFromEvent(event) {
  return (
    event?.order ||
    event?.data?.order ||
    event?.data?.actionEvent?.body?.order ||
    event?.actionEvent?.body?.order ||
    event?.data ||
    event ||
    {}
  );
}

function buyerEmailFrom(order) {
  return (
    order?.buyerInfo?.email ||
    order?.billingInfo?.contactDetails?.email ||
    order?.recipientInfo?.email ||
    ''
  );
}

async function loadWixOrder(id) {
  if (!id) return null;
  try {
    const mod = await import('wix-ecom-backend');
    if (mod.orders?.getOrder) return await mod.orders.getOrder(id);
  } catch (error) {
    console.error('Wix-Bestellung:', error);
  }
  return null;
}

export async function handlePaidOrderEvent(event) {
  const order = orderFromEvent(event);
  const vaNumber = extractVaOrderNumber(order) || extractVaOrderNumber(event);
  const email = buyerEmailFrom(order);
  return notifyPaidCertificate({
    orderNumber: vaNumber,
    buyerEmail: email,
    wixOrderNumber: String(order?.number || order?.orderNumber || ''),
    wixOrderId: String(order?._id || order?.id || ''),
  });
}

export async function notifyPaidCertificate({
  orderNumber,
  buyerEmail,
  wixOrderNumber,
  wixOrderId,
  force = false,
}) {
  let vaNumber = orderNumber || '';
  let email = buyerEmail || '';
  let shopNumber = wixOrderNumber || '';

  if (wixOrderId && !vaNumber) {
    const shopOrder = await loadWixOrder(wixOrderId);
    if (shopOrder) {
      vaNumber = extractVaOrderNumber(shopOrder);
      email = email || buyerEmailFrom(shopOrder);
      shopNumber = shopNumber || String(shopOrder.number || '');
    }
  }

  let record = vaNumber ? await getCertificateOrder(vaNumber) : null;
  if (!record && email) {
    const candidate = await findCertificateOrderByEmail(email);
    if (
      candidate &&
      candidate.status !== 'paid' &&
      candidate.status !== 'paid_notified' &&
      candidate.status !== 'mail_sending'
    ) {
      record = candidate;
    }
  }
  if (!record) {
    console.error('Kein Verbrauchsausweis-Auftrag nach Zahlung', {
      vaNumber,
      email,
      shopNumber,
    });
    throw new Error(
      `Kein Verbrauchsausweis-Auftrag gefunden (${vaNumber || email || 'ohne Nummer'}).`
    );
  }

  if (!force) {
    const claim = await tryClaimPaidMail(record.orderNumber);
    if (!claim.claimed) {
      return { ok: true, skipped: true, orderNumber: record.orderNumber };
    }
    record = claim.record || record;
  }

  const body = orderBodyFromRecord(record);
  body.wixOrderNumber = shopNumber;
  body.wixOrderId = wixOrderId;
  body.fileUrls = record.fileUrls || [];

  const fileName =
    record.hsvFileName || record.calculation?.hsvFileName || hsvFileName(body);
  const hsvContent = buildHsvContent(body);

  const mailAttachments = [
    {
      name: fileName,
      mimeType: 'text/plain; charset=iso-8859-1',
      contentBase64: Buffer.from(hsvContent, 'latin1').toString('base64'),
    },
  ];

  const mail = await sendPaidOrderEmails({
    ...body,
    hsvFileName: fileName,
    hsvDownloadUrl: '',
    fileUrls: body.fileUrls,
    mailAttachments,
  });

  try {
    await saveHsvFile(record.orderNumber, {
      fileName,
      content: hsvContent,
    });
  } catch (error) {
    console.error('HSV in der Mediathek:', error);
  }

  await updateOrderStatus(record.orderNumber, 'paid_notified', {
    hsvFileName: fileName,
    hsvContent,
    wixOrderNumber: shopNumber || record.wixOrderNumber,
    wixOrderId: wixOrderId || record.wixOrderId,
    mailResult: mail,
  });

  return { ok: true, orderNumber: record.orderNumber, mail };
}

export async function hsvForDownload(orderNumber, token) {
  const record = await getCertificateOrder(orderNumber);
  if (!record || !token || record.hsvDownloadToken !== token) {
    throw new Error('HSV nicht gefunden oder Token ungültig.');
  }
  const body = orderBodyFromRecord(record);
  return {
    fileName: record.hsvFileName || record.calculation?.hsvFileName || hsvFileName(body),
    content: buildHsvContent(body),
  };
}
