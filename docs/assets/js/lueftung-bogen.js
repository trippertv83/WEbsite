import { OFFICE } from './isfp-docs.js';

export function bundeslandFromPlz(plz) {
  const n = Number(String(plz || '').replace(/\D/g, '').slice(0, 5));
  if (!n) return 'Bayern';
  if ((n >= 80000 && n <= 87999) || (n >= 89000 && n <= 97999)) return 'Bayern';
  if (n >= 70000 && n <= 79999) return 'Baden-Württemberg';
  if (n >= 60000 && n <= 65999) return 'Hessen';
  if (n >= 66000 && n <= 66999) return 'Saarland';
  if (n >= 67000 && n <= 67999) return 'Rheinland-Pfalz';
  if (n >= 54000 && n <= 57999) return 'Rheinland-Pfalz';
  if (n >= 20000 && n <= 21999) return 'Hamburg';
  if (n >= 22000 && n <= 25999) return 'Schleswig-Holstein';
  if (n >= 26000 && n <= 31999) return 'Niedersachsen';
  if (n >= 34000 && n <= 39999) return 'Niedersachsen';
  if (n >= 49000 && n <= 49999) return 'Niedersachsen';
  if (n >= 10000 && n <= 14999) return 'Berlin';
  if (n >= 15000 && n <= 16999) return 'Brandenburg';
  if (n >= 17000 && n <= 19999) return 'Mecklenburg-Vorpommern';
  if (n >= 27000 && n <= 28999) return 'Bremen';
  if (n >= 1000 && n <= 2999) return 'Sachsen';
  return 'Bayern';
}

export function windzoneFromPlz(plz) {
  const land = bundeslandFromPlz(plz);
  const n = Number(String(plz || '').replace(/\D/g, '').slice(0, 5));
  if ([25849, 25946, 25980, 25992, 25996, 25997, 25999, 26465, 26474, 26486, 26548, 26571, 26579, 26757, 27498].includes(n)) {
    return '4';
  }
  if (['Schleswig-Holstein', 'Hamburg', 'Bremen', 'Mecklenburg-Vorpommern'].includes(land)) return '3';
  if (land === 'Niedersachsen' && n >= 26000 && n <= 27999) return '3';
  if (land === 'Bayern' || land === 'Baden-Württemberg') return '1';
  return '2';
}

function gebaeudeartFromWe(count) {
  const n = Number(count) || 1;
  if (n >= 3) return 'MFH';
  if (n === 2) return 'ZFH';
  return 'EFH';
}

function gebaeudeStatusFromBaujahr(baujahr) {
  const year = parseInt(String(baujahr || '').replace(/\D/g, '').slice(0, 4), 10);
  const now = new Date().getFullYear();
  if (Number.isFinite(year) && year >= now - 2) return 'neubau';
  return 'bestand';
}

function wohnungstypFromArt(art) {
  if (art === 'EFH') return 'freistehend';
  if (art === 'ZFH') return 'kopf';
  return 'mittel';
}

function unitsFromForm(data) {
  const count = Math.min(Math.max(Number(data.anzahlWE) || 1, 1), 40);
  const flaeche = String(data.wohnflaecheWE || '').trim();
  const art = gebaeudeartFromWe(count);
  const typ = wohnungstypFromArt(art);
  return Array.from({ length: count }, (_, i) => ({
    name: 'Wohnung ' + (i + 1),
    flaeche,
    belegung: 'hoch',
    typ,
    personen: '',
    fensterlos: 'nein',
    abluft: 'keine',
  }));
}

export function enrichLueftung(data) {
  const count = Number(data.anzahlWE) || 1;
  const art = gebaeudeartFromWe(count);
  const plz = data.objPlz || data.plz || '';
  const ownerName = [data.anrede, data.firstName, data.lastName].filter(Boolean).join(' ');
  const wohnungen = unitsFromForm(data);
  return {
    ...data,
    lueftungEigentuemer: ownerName,
    lueftungErsteller: OFFICE.firma + ', ' + OFFICE.name,
    lueftungDatum: new Date().toLocaleDateString('de-DE'),
    gebaeudeStatus: gebaeudeStatusFromBaujahr(data.baujahr),
    gebaeudeartLueftung: art,
    windzone: windzoneFromPlz(plz),
    windzoneHinweis: 'aus PLZ ' + plz + ' (' + bundeslandFromPlz(plz) + ')',
    abluftGebaeude: 'nein',
    wohnungen,
  };
}
