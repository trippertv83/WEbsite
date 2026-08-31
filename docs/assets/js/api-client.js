/**
 * Frontend-Client für Wix HTTP-Functions.
 * Sendet Auftragsdaten und PDF-Inhalte (Base64) an das Backend.
 * API-Schlüssel werden nur serverseitig gelesen.
 */

import { AppConfig } from '../../config.example.js';
import { fileToBase64 } from './utils.js';
import { collectAllFiles } from './upload.js';

export async function postJson(url, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'Zeitüberschreitung: Das Wix-Backend antwortet nicht. Site veröffentlichen und Dateigröße prüfen (max. 4 MB je PDF).'
      );
    }
    throw new Error(
      'Keine Verbindung zum Wix-Backend (CORS oder Funktion nicht veröffentlicht). Bitte die Site im Wix-Editor veröffentlichen. Details: ' +
        (error.message || 'Netzwerkfehler')
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${response.status}` };
  }

  const message = data.error || data.message || data.body?.error;
  if (!response.ok) {
    throw new Error(message || `Serverfehler ${response.status}.`);
  }
  return data;
}

export async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(url, { method: 'GET', signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Zeitüberschreitung beim Laden vom Wix-Backend.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(data.error || `Serverfehler ${response.status}.`);
  }
  return data;
}

export async function fetchProductPrice(productId) {
  const base = AppConfig.wixHttpFunctionsBaseUrl || '';
  if (!base || !productId || String(productId).startsWith('00000000')) {
    return null;
  }
  const url = `${base.replace(/\/$/, '')}/productPrice?productId=${encodeURIComponent(productId)}`;
  return getJson(url);
}

export async function registerCustomer(customer, mode) {
  const base = AppConfig.wixHttpFunctionsBaseUrl || '';
  if (!base || base.includes('ihre-site')) {
    throw new Error(
      'Wix-Backend-URL fehlt. In config.example.js wixHttpFunctionsBaseUrl eintragen.'
    );
  }

  const url = `${base.replace(/\/$/, '')}/registerCustomer`;
  return postJson(url, { customer, mode });
}

export async function submitOrder({ payload, documents }) {
  const files = collectAllFiles(documents);

  if (AppConfig.demoMode) {
    return {
      ok: true,
      mode: 'demo',
      orderNumber: payload.orderNumber,
      stored: true,
    };
  }

  const base = String(AppConfig.wixHttpFunctionsBaseUrl || '').replace(/\/$/, '');
  const saved = await postJson(`${base}/createCertificateOrder`, {
    ...payload,
    attachments: files.map((record) => ({
      name: record.name,
      category: record.category,
      mimeType: 'application/pdf',
    })),
  });

  const chunkSize = 18000;
  for (const record of files) {
    const contentBase64 = await fileToBase64(record.file);
    const total = Math.max(1, Math.ceil(contentBase64.length / chunkSize));
    for (let index = 0; index < total; index += 1) {
      await postJson(`${base}/uploadOrderFile`, {
        orderNumber: payload.orderNumber,
        fileName: record.name,
        category: record.category,
        mimeType: 'application/pdf',
        index,
        total,
        chunk: contentBase64.slice(index * chunkSize, (index + 1) * chunkSize),
      });
    }
  }

  return saved;
}
