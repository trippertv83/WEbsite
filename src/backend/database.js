/**
 * Wix Data: Collection "CertificateOrders"
 * Secrets gehören in den Wix Secrets Manager, nicht in diese Datei.
 */

import wixData from 'wix-data';
import { mediaManager } from 'wix-media-backend';
import { Buffer } from 'buffer';

const COLLECTION = 'CertificateOrders';

export async function createCertificateOrder(body) {
  const now = new Date();
  const fileUrls = await storeAttachments(body.orderNumber, body.attachments || []);

  const item = {
    orderNumber: body.orderNumber,
    status: 'received',
    customerName: body.customer?.name || '',
    customerEmail: body.customer?.email || '',
    building: body.building,
    consumption: body.consumption,
    calculation: body.calculation,
    fileUrls,
    createdAt: now,
    updatedAt: now,
  };

  const existing = await wixData
    .query(COLLECTION)
    .eq('orderNumber', body.orderNumber)
    .limit(1)
    .find();

  if (existing.items.length) {
    return wixData.update(COLLECTION, {
      ...existing.items[0],
      ...item,
      _id: existing.items[0]._id,
    });
  }

  return wixData.insert(COLLECTION, item);
}

export async function updateOrderStatus(orderNumber, status) {
  const result = await wixData
    .query(COLLECTION)
    .eq('orderNumber', orderNumber)
    .limit(1)
    .find();
  if (!result.items.length) {
    throw new Error(`Auftrag ${orderNumber} nicht gefunden.`);
  }
  return wixData.update(COLLECTION, {
    ...result.items[0],
    status,
    updatedAt: new Date(),
  });
}

async function storeAttachments(orderNumber, attachments) {
  const urls = [];
  for (const file of attachments) {
    const buffer = Buffer.from(file.contentBase64, 'base64');
    const path = `/energieausweis/${orderNumber}/${sanitize(file.name)}`;
    const uploaded = await mediaManager.upload(path, buffer, {
      mediaOptions: {
        mimeType: file.mimeType || 'application/pdf',
        mediaType: 'document',
      },
      metadataOptions: {
        isPrivate: true,
        isVisitorUpload: false,
      },
    });
    urls.push({
      category: file.category,
      name: file.name,
      fileUrl: uploaded.fileUrl,
      fileName: uploaded.fileName,
    });
  }
  return urls;
}

function sanitize(name) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
