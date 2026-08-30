/**
 * PDF-Upload: Validierung, Fortschritt, Vorschau, Löschen.
 * Dateien bleiben im Speicher, bis die Bestellung über das Backend läuft.
 */

import { AppConfig } from '../../config.example.js';
import { formatBytes } from './utils.js';

const MAX_BYTES = AppConfig.maxFileSizeMb * 1024 * 1024;

export function isPdf(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function validateFile(file) {
  if (!isPdf(file)) return 'Nur PDF-Dateien sind zulässig.';
  if (file.size > MAX_BYTES) {
    return `Maximale Dateigröße: ${AppConfig.maxFileSizeMb} MB.`;
  }
  return null;
}

export function validateTotalSize(allFiles) {
  const total = allFiles.reduce((acc, f) => acc + f.size, 0);
  const max = AppConfig.maxTotalUploadMb * 1024 * 1024;
  if (total > max) {
    return `Gesamtgröße überschreitet ${AppConfig.maxTotalUploadMb} MB.`;
  }
  return null;
}

export function createFileRecord(file, category) {
  return {
    id: `${category}-${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    size: file.size,
    sizeLabel: formatBytes(file.size),
    category,
    file,
    progress: 0,
  };
}

export function simulateProgress(onTick) {
  return new Promise((resolve) => {
    let value = 0;
    const timer = setInterval(() => {
      value = Math.min(100, value + 18 + Math.random() * 12);
      onTick(Math.round(value));
      if (value >= 100) {
        clearInterval(timer);
        resolve();
      }
    }, 80);
  });
}

export function collectAllFiles(documents) {
  return [
    ...documents.heatingBills,
    ...documents.floorPlan,
    ...documents.heatingPhoto,
    ...documents.other,
  ];
}
