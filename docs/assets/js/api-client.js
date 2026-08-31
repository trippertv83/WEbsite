/**
 * Frontend-Client für Wix HTTP-Functions.
 * Sendet Auftragsdaten und PDF-Inhalte (Base64) an das Backend.
 * API-Schlüssel werden nur serverseitig gelesen.
 */

import { AppConfig } from '../../config.example.js';
import { fileToBase64 } from './utils.js';
import { collectAllFiles } from './upload.js';

export async function registerCustomer(customer) {
  const base = AppConfig.wixHttpFunctionsBaseUrl || '';
  if (!base || base.includes('ihre-site')) {
    throw new Error(
      'Wix-Backend-URL fehlt. In config.example.js wixHttpFunctionsBaseUrl eintragen.'
    );
  }

  const url = `${base.replace(/\/$/, '')}/registerCustomer`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer }),
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!response.ok) {
    throw new Error(data.error || `Registrierung fehlgeschlagen (${response.status}).`);
  }

  return data;
}

export async function submitOrder({ payload, documents }) {
  const files = collectAllFiles(documents);
  const attachments = [];
  for (const record of files) {
    attachments.push({
      name: record.name,
      category: record.category,
      mimeType: 'application/pdf',
      contentBase64: await fileToBase64(record.file),
    });
  }

  if (AppConfig.demoMode) {
    return {
      ok: true,
      mode: 'demo',
      orderNumber: payload.orderNumber,
      stored: true,
    };
  }

  const url = `${AppConfig.wixHttpFunctionsBaseUrl}/createCertificateOrder`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, attachments }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bestellung fehlgeschlagen (${response.status}): ${text}`);
  }

  return response.json();
}
