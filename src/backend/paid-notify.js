/**
 * Nach erfolgreicher Zahlung: HSV erzeugen, speichern, E-Mail an Admin.
 */

import { Buffer } from 'buffer';
import { fetch } from 'wix-fetch';
import {
  downloadUrlFor,
  findCertificateOrderByEmail,
  getCertificateOrder,
  saveHsvFile,
  updateOrderStatus,
} from 'backend/database';
import { sendPaidOrderEmails } from 'backend/email';
import { buildHsvContent, hsvFileName } from 'backend/hsv';

const FUNCTIONS_BASE =
  'https://energieberater4.wixsite.com/dieterspaderna/_functions';

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
  const vaNumber =
    extractVaOrderNumber(order) || extractVaOrderNumber(event);
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
      candidate.status !== 'paid_notified'
    ) {
      record = candidate;
    }
  }
  if (!record) {
    const diagnostic = await sendPaidOrderEmails({
      orderNumber: vaNumber || 'UNBEKANNT',
      customer: { name: 'Unbekannt', email: email || '' },
      building: {},
      consumption: {},
      calculation: {},
      wixOrderNumber: shopNumber,
      wixOrderId,
    }).catch((error) => ({ ok: false, error: String(error.message || error) }));
    throw new Error(
      `Kein Verbrauchsausweis-Auftrag gefunden (${vaNumber || email || 'ohne Nummer'}). Mail-Versuch: ${JSON.stringify(diagnostic)}`
    );
  }
  if (!force && (record.status === 'paid' || record.status === 'paid_notified')) {
    return { ok: true, skipped: true, orderNumber: record.orderNumber };
  }

  const body = {
    orderNumber: record.orderNumber,
    customer: record.customer || {
      name: record.customerName,
      email: record.customerEmail,
    },
    building: record.building || {},
    consumption: record.consumption || {},
    calculation: record.calculation || {},
    fileUrls: record.fileUrls || [],
    wixOrderNumber: shopNumber,
    wixOrderId,
  };

  const hsvContent = buildHsvContent(body);
  const fileName = hsvFileName(body);
  const saved = await saveHsvFile(record.orderNumber, {
    fileName,
    content: hsvContent,
  });

  const token = saved.hsvDownloadToken;
  const hsvDownloadUrl = `${FUNCTIONS_BASE}/downloadHsv?order=${encodeURIComponent(
    record.orderNumber
  )}&t=${encodeURIComponent(token)}`;

  const fileUrls = [];
  for (const file of saved.fileUrls || []) {
    fileUrls.push({
      ...file,
      downloadUrl: await downloadUrlFor(file.fileUrl),
    });
  }

  const mailAttachments = [
    {
      name: fileName,
      mimeType: 'text/plain',
      contentBase64: Buffer.from(hsvContent, 'utf8').toString('base64'),
    },
  ];

  for (const file of fileUrls) {
    const bytes = await fetchFileBase64(file.downloadUrl);
    if (bytes) {
      mailAttachments.push({
        name: file.name || 'dokument.pdf',
        mimeType: file.mimeType || 'application/pdf',
        contentBase64: bytes,
      });
    }
  }

  const mail = await sendPaidOrderEmails({
    ...body,
    hsvFileName: fileName,
    hsvDownloadUrl,
    fileUrls,
    mailAttachments,
  });

  await updateOrderStatus(record.orderNumber, 'paid_notified', {
    hsvFileName: fileName,
    hsvFileUrl: saved.hsvFileUrl,
    hsvDownloadToken: token,
    wixOrderNumber: shopNumber || record.wixOrderNumber,
    wixOrderId: wixOrderId || record.wixOrderId,
  });

  return { ok: true, orderNumber: record.orderNumber, mail };
}

async function fetchFileBase64(url) {
  if (!url) return '';
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const buf = await res.buffer();
    return Buffer.from(buf).toString('base64');
  } catch (error) {
    console.error('Anhang laden:', error);
    return '';
  }
}

export async function hsvForDownload(orderNumber, token) {
  const record = await getCertificateOrder(orderNumber);
  if (!record || !token || record.hsvDownloadToken !== token) {
    throw new Error('HSV nicht gefunden oder Token ungültig.');
  }
  const body = {
    orderNumber: record.orderNumber,
    customer: record.customer || {
      name: record.customerName,
      email: record.customerEmail,
    },
    building: record.building || {},
    consumption: record.consumption || {},
    calculation: record.calculation || {},
  };
  return {
    fileName: hsvFileName(body),
    content: buildHsvContent(body),
  };
}
