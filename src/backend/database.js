/**
 * Wix Data: Collection "CertificateOrders"
 * Secrets gehören in den Wix Secrets Manager, nicht in diese Datei.
 */

import wixData from 'wix-data';
import { collections } from 'wix-data.v2';
import { mediaManager } from 'wix-media-backend';
import { Buffer } from 'buffer';

const COLLECTION = 'CertificateOrders';
const OPTIONS = { suppressAuth: true };

function field(key, displayName, type) {
  return { key, displayName, type };
}

const COLLECTION_SCHEMA = {
  _id: COLLECTION,
  displayName: 'Verbrauchsausweis-Aufträge',
  displayField: 'orderNumber',
  permissions: {
    read: 'ADMIN',
    insert: 'ADMIN',
    update: 'ADMIN',
    remove: 'ADMIN',
  },
  fields: [
    field('orderNumber', 'Bestellnummer', 'TEXT'),
    field('status', 'Status', 'TEXT'),
    field('customerName', 'Kundenname', 'TEXT'),
    field('customerEmail', 'E-Mail', 'TEXT'),
    field('building', 'Gebäude', 'OBJECT'),
    field('consumption', 'Verbrauch', 'OBJECT'),
    field('calculation', 'Berechnung', 'OBJECT'),
    field('fileUrls', 'Dateien', 'OBJECT'),
    field('createdAt', 'Erstellt', 'DATETIME'),
    field('updatedAt', 'Aktualisiert', 'DATETIME'),
  ],
};

let collectionReady = false;

async function ensureCollection() {
  if (collectionReady) return;
  try {
    await collections.getDataCollection(COLLECTION);
    collectionReady = true;
    return;
  } catch {
    /* anlegen */
  }
  try {
    await collections.createDataCollection(COLLECTION_SCHEMA);
    collectionReady = true;
  } catch (error) {
    const msg = String(error.message || error);
    if (msg.includes('already exists') || msg.includes('WDE0026')) {
      collectionReady = true;
      return;
    }
    throw new Error(
      'CMS-Sammlung CertificateOrders fehlt und konnte nicht automatisch angelegt werden. ' +
        'Im Wix-Dashboard: CMS → Sammlung erstellen, ID genau CertificateOrders, dann Site veröffentlichen. ' +
        'Original: ' +
        msg
    );
  }
}

export async function createCertificateOrder(body) {
  await ensureCollection();
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
    .find(OPTIONS);

  if (existing.items.length) {
    return wixData.update(
      COLLECTION,
      {
        ...existing.items[0],
        ...item,
        _id: existing.items[0]._id,
      },
      OPTIONS
    );
  }

  return wixData.insert(COLLECTION, item, OPTIONS);
}

export async function updateOrderStatus(orderNumber, status) {
  await ensureCollection();
  const result = await wixData
    .query(COLLECTION)
    .eq('orderNumber', orderNumber)
    .limit(1)
    .find(OPTIONS);
  if (!result.items.length) {
    throw new Error(`Auftrag ${orderNumber} nicht gefunden.`);
  }
  return wixData.update(
    COLLECTION,
    {
      ...result.items[0],
      status,
      updatedAt: new Date(),
    },
    OPTIONS
  );
}

async function storeAttachments(orderNumber, attachments) {
  const urls = [];
  const folder = `/energieausweis/${String(orderNumber || 'ohne-nummer')}`;
  for (const file of attachments) {
    if (!file?.contentBase64) continue;
    const buffer = Buffer.from(file.contentBase64, 'base64');
    const fileName = sanitize(file.name) || 'dokument.pdf';
    const uploaded = await mediaManager.upload(folder, buffer, fileName, {
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
