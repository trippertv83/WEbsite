/**
 * Wix Data: Collection "CertificateOrders"
 * Secrets gehören in den Wix Secrets Manager, nicht in diese Datei.
 */

import wixData from 'wix-data';
import { collections } from 'wix-data.v2';
import { mediaManager } from 'wix-media-backend';
import { Buffer } from 'buffer';
import { buildHsvContent, hsvFileName } from 'backend/hsv';

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
    field('customer', 'Kunde', 'OBJECT'),
    field('building', 'Gebäude', 'OBJECT'),
    field('consumption', 'Verbrauch', 'OBJECT'),
    field('calculation', 'Berechnung', 'OBJECT'),
    field('fileUrls', 'Dateien', 'OBJECT'),
    field('hsvFileName', 'HSV-Datei', 'TEXT'),
    field('hsvFileUrl', 'HSV-URL', 'TEXT'),
    field('hsvDownloadToken', 'HSV-Token', 'TEXT'),
    field('hsvContent', 'HSV-Inhalt', 'TEXT'),
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
  const hsvContent = buildHsvContent(body);
  const hsvName = hsvFileName(body);

  const item = {
    orderNumber: body.orderNumber,
    status: 'received',
    customerName: body.customer?.name || '',
    customerEmail: body.customer?.email || '',
    customer: body.customer || {},
    building: body.building,
    consumption: body.consumption,
    calculation: {
      ...(body.calculation || {}),
      hsvContent,
      hsvFileName: hsvName,
      orderSnapshot: {
        orderNumber: body.orderNumber,
        customer: body.customer || {},
        building: body.building || {},
        consumption: body.consumption || {},
      },
    },
    fileUrls: [],
    hsvContent,
    hsvFileName: hsvName,
    hsvDownloadToken: randomToken(),
    createdAt: now,
    updatedAt: now,
  };

  const existing = await wixData
    .query(COLLECTION)
    .eq('orderNumber', body.orderNumber)
    .limit(1)
    .find(OPTIONS);

  if (existing.items.length) {
    return writeOrder({ ...existing.items[0], ...item, _id: existing.items[0]._id }, true);
  }

  return writeOrder(item, false);
}

async function writeOrder(item, isUpdate) {
  try {
    return isUpdate
      ? await wixData.update(COLLECTION, item, OPTIONS)
      : await wixData.insert(COLLECTION, item, OPTIONS);
  } catch (error) {
    console.error('Auftrag mit HSV-Feldern nicht speicherbar, Fallback:', error);
    const slim = {
      orderNumber: item.orderNumber,
      status: item.status,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      building: item.building,
      consumption: item.consumption,
      calculation: item.calculation,
      fileUrls: item.fileUrls,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    if (isUpdate && item._id) slim._id = item._id;
    return isUpdate
      ? wixData.update(COLLECTION, slim, OPTIONS)
      : wixData.insert(COLLECTION, slim, OPTIONS);
  }
}

export async function getCertificateOrder(orderNumber) {
  await ensureCollection();
  if (!orderNumber) return null;
  const result = await wixData
    .query(COLLECTION)
    .eq('orderNumber', orderNumber)
    .limit(1)
    .find(OPTIONS);
  return result.items[0] || null;
}

export async function findCertificateOrderByEmail(email) {
  await ensureCollection();
  if (!email) return null;
  const result = await wixData
    .query(COLLECTION)
    .eq('customerEmail', String(email).trim())
    .descending('createdAt')
    .limit(1)
    .find(OPTIONS);
  return result.items[0] || null;
}

export async function tryClaimPaidMail(orderNumber) {
  const existing = await getCertificateOrder(orderNumber);
  if (!existing) return { claimed: false, record: null };
  if (existing.status === 'paid_notified' || existing.status === 'mail_sending') {
    return { claimed: false, record: existing };
  }
  await wixData.update(
    COLLECTION,
    {
      ...existing,
      status: 'mail_sending',
      updatedAt: new Date(),
    },
    OPTIONS
  );
  return { claimed: true, record: existing };
}

export async function updateOrderStatus(orderNumber, status, extra = {}) {
  const existing = await getCertificateOrder(orderNumber);
  if (!existing) {
    throw new Error(`Auftrag ${orderNumber} nicht gefunden.`);
  }
  return wixData.update(
    COLLECTION,
    {
      ...existing,
      ...extra,
      status,
      updatedAt: new Date(),
    },
    OPTIONS
  );
}

export async function saveHsvFile(orderNumber, { fileName, content }) {
  const existing = await getCertificateOrder(orderNumber);
  if (!existing) throw new Error(`Auftrag ${orderNumber} nicht gefunden.`);
  const folder = `/energieausweis/${String(orderNumber || 'ohne-nummer')}`;
  const buffer = Buffer.from(content, 'latin1');
  const uploaded = await mediaManager.upload(folder, buffer, fileName, {
    mediaOptions: {
      mimeType: 'text/plain',
      mediaType: 'document',
    },
    metadataOptions: {
      isPrivate: true,
      isVisitorUpload: false,
    },
  });
  const token = existing.hsvDownloadToken || randomToken();
  return wixData.update(
    COLLECTION,
    {
      ...existing,
      hsvFileName: fileName,
      hsvFileUrl: uploaded.fileUrl,
      hsvDownloadToken: token,
      updatedAt: new Date(),
    },
    OPTIONS
  );
}

export async function downloadUrlFor(fileUrl, minutes = 60 * 24 * 14) {
  if (!fileUrl) return '';
  try {
    return await mediaManager.getDownloadUrl(fileUrl, minutes);
  } catch (error) {
    console.error('Download-URL:', error);
    return '';
  }
}

function randomToken() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export async function appendOrderAttachment(orderNumber, file) {
  await ensureCollection();
  const existing = await getCertificateOrder(orderNumber);
  if (!existing) throw new Error(`Auftrag ${orderNumber} nicht gefunden.`);
  const urls = await storeAttachments(orderNumber, [file]);
  return wixData.update(
    COLLECTION,
    {
      ...existing,
      fileUrls: [...(existing.fileUrls || []), ...urls],
      updatedAt: new Date(),
    },
    OPTIONS
  );
}

const CHUNKS = 'OrderFileChunks';

export async function receiveFileChunk({
  orderNumber,
  fileName,
  category,
  mimeType,
  index,
  total,
  chunk,
}) {
  await ensureCollection();
  if (!orderNumber || chunk == null || index == null || !total) {
    throw new Error('Unvollständiger Datei-Upload.');
  }
  try {
    await wixData.insert(
      CHUNKS,
      {
        orderNumber,
        fileName: sanitize(fileName) || 'dokument.pdf',
        category: category || 'other',
        mimeType: mimeType || 'application/pdf',
        index: Number(index),
        total: Number(total),
        chunk: String(chunk),
        createdAt: new Date(),
      },
      OPTIONS
    );
  } catch (error) {
    try {
      await collections.createDataCollection({
        _id: CHUNKS,
        displayName: 'Auftragsdatei-Teile',
        displayField: 'fileName',
        permissions: {
          read: 'ADMIN',
          insert: 'ADMIN',
          update: 'ADMIN',
          remove: 'ADMIN',
        },
        fields: [
          field('orderNumber', 'Bestellnummer', 'TEXT'),
          field('fileName', 'Datei', 'TEXT'),
          field('category', 'Kategorie', 'TEXT'),
          field('mimeType', 'MIME', 'TEXT'),
          field('index', 'Index', 'NUMBER'),
          field('total', 'Gesamt', 'NUMBER'),
          field('chunk', 'Teil', 'TEXT'),
          field('createdAt', 'Erstellt', 'DATETIME'),
        ],
      });
    } catch {
      /* existiert */
    }
    await wixData.insert(
      CHUNKS,
      {
        orderNumber,
        fileName: sanitize(fileName) || 'dokument.pdf',
        category: category || 'other',
        mimeType: mimeType || 'application/pdf',
        index: Number(index),
        total: Number(total),
        chunk: String(chunk),
        createdAt: new Date(),
      },
      OPTIONS
    );
  }

  if (Number(index) + 1 < Number(total)) {
    return { complete: false, received: Number(index) + 1, total: Number(total) };
  }

  const result = await wixData
    .query(CHUNKS)
    .eq('orderNumber', orderNumber)
    .eq('fileName', sanitize(fileName) || 'dokument.pdf')
    .limit(1000)
    .find(OPTIONS);
  const parts = [...result.items].sort((a, b) => Number(a.index) - Number(b.index));
  if (parts.length < Number(total)) {
    return { complete: false, received: parts.length, total: Number(total) };
  }
  const contentBase64 = parts.map((item) => item.chunk).join('');
  await appendOrderAttachment(orderNumber, {
    name: fileName,
    category,
    mimeType,
    contentBase64,
  });
  await Promise.all(
    parts.map((item) => wixData.remove(CHUNKS, item._id, OPTIONS).catch(() => null))
  );
  return { complete: true };
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
