/**
 * DWD-Klimakorrekturfaktoren (GEG / Potsdam-Institut).
 * CSV: https://opendata.dwd.de/.../climate_correction_factor/
 */

import { AppConfig } from '../../config.example.js';

const DWD_RECENT =
  'https://opendata.dwd.de/climate_environment/CDC/derived_germany/techn/monthly/climate_correction_factor/recent';
const DWD_HIST =
  'https://opendata.dwd.de/climate_environment/CDC/derived_germany/techn/monthly/climate_correction_factor/historical';

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function dwdWindow(from, to) {
  const lastDay = new Date(to.year, to.month, 0).getDate();
  return {
    start: `${from.year}${pad2(from.month)}01`,
    end: `${to.year}${pad2(to.month)}${pad2(lastDay)}`,
  };
}

function plzKey(plz) {
  return Number(String(plz).replace(/\D/g, '').replace(/^0+/, '') || plz);
}

export function parseKfCsv(text) {
  const map = {};
  String(text || '')
    .split(/\r?\n/)
    .slice(1)
    .forEach((line) => {
      const parts = line.split(';');
      if (parts.length < 4) return;
      const kf = Number(String(parts[3]).replace(',', '.'));
      if (!Number.isFinite(kf)) return;
      map[Number(parts[2])] = kf;
    });
  return map;
}

export function factorFromMap(map, plz) {
  const key = plzKey(plz);
  const padded = Number(String(plz).replace(/\D/g, ''));
  if (map[key] != null) return map[key];
  if (map[padded] != null) return map[padded];
  return null;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function loadKfMap(start, end) {
  const file = `KF_${start}_${end}.csv`;
  const urls = [`${DWD_RECENT}/${file}`, `${DWD_HIST}/${file}`];
  let lastError;
  for (const url of urls) {
    try {
      return parseKfCsv(await fetchText(url));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('DWD-CSV nicht geladen');
}

async function lookupViaWix(plz, start, end) {
  const base = AppConfig.wixHttpFunctionsBaseUrl || '';
  if (!base || base.includes('ihre-site')) return null;
  const url = `${base.replace(/\/$/, '')}/climateFactor?plz=${encodeURIComponent(plz)}&from=${start}&to=${end}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const factor = Number(data.factor);
  if (!Number.isFinite(factor)) return null;
  return { factor, source: data.source || 'dwd' };
}

export async function lookupPeriodFactor(plz, from, to) {
  const { start, end } = dwdWindow(from, to);
  const viaWix = await lookupViaWix(plz, start, end).catch(() => null);
  if (viaWix) return { ...viaWix, start, end };

  try {
    const map = await loadKfMap(start, end);
    const factor = factorFromMap(map, plz);
    if (factor != null) return { factor, source: 'dwd', start, end };
  } catch {
    /* CORS oder fehlendes Fenster */
  }

  return { factor: 1, source: 'fallback', start, end };
}

export async function lookupClimateFactors(plz, periods) {
  const list = [];
  for (const period of periods) {
    list.push(await lookupPeriodFactor(plz, period.from, period.to));
  }
  return list;
}
