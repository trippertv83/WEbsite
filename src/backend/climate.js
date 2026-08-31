/**
 * DWD-Klimakorrekturfaktoren serverseitig (kein CORS).
 */

import { fetch } from 'wix-fetch';

const DWD_RECENT =
  'https://opendata.dwd.de/climate_environment/CDC/derived_germany/techn/monthly/climate_correction_factor/recent';
const DWD_HIST =
  'https://opendata.dwd.de/climate_environment/CDC/derived_germany/techn/monthly/climate_correction_factor/historical';

const csvCache = {};

function parseKfCsv(text) {
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

function plzKey(plz) {
  return Number(String(plz).replace(/\D/g, '').replace(/^0+/, '') || plz);
}

async function loadMap(start, end) {
  const key = `${start}_${end}`;
  if (csvCache[key]) return csvCache[key];
  const file = `KF_${start}_${end}.csv`;
  const urls = [`${DWD_RECENT}/${file}`, `${DWD_HIST}/${file}`];
  for (const url of urls) {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) continue;
    csvCache[key] = parseKfCsv(await res.text());
    return csvCache[key];
  }
  csvCache[key] = {};
  return csvCache[key];
}

export async function lookupClimateFactor(plz, from, to) {
  const map = await loadMap(from, to);
  const factor = map[plzKey(plz)];
  if (factor != null) {
    return { factor, source: 'dwd' };
  }
  return { factor: 1, source: 'fallback' };
}
