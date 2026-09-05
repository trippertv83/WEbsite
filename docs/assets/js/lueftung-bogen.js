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
  const art = gebaeudeartFromWe(count);
  const typ = wohnungstypFromArt(art);
  if (Array.isArray(data.wohnungen) && data.wohnungen.length) {
    return data.wohnungen.map((unit, i) => ({
      name: unit.name || 'Wohnung ' + (i + 1),
      flaeche: String(unit.flaeche || '').trim(),
      belegung: 'hoch',
      typ,
      personen: '',
      fensterlos: unit.fensterlos === 'ja' ? 'ja' : 'nein',
      abluft: 'keine',
    }));
  }
  const flaeche = String(data.wohnflaecheWE || '').trim();
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

function weCount() {
  const n = parseInt(document.getElementById('anzahlWE')?.value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 40) : 1;
}

function readWeRow(index) {
  return {
    name: 'Wohnung ' + (index + 1),
    flaeche: String(document.getElementById('we-flaeche-' + index)?.value || '').trim(),
    fensterlos: document.querySelector(`input[name="we-fensterlos-${index}"]:checked`)?.value || '',
  };
}

function weRowHtml(index, preset = {}) {
  const n = index + 1;
  return `
    <div class="we-card" data-we="${index}">
      <p><b>Wohnung ${n}</b></p>
      <label for="we-flaeche-${index}">Beheizte Wohnfläche (m²)</label>
      <input id="we-flaeche-${index}" required inputmode="decimal" value="${String(preset.flaeche || '').replace(/"/g, '&quot;')}" />
      <p>Fensterlose Räume in dieser Wohnung?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="nein" required ${preset.fensterlos !== 'ja' ? 'checked' : ''} /> Nein</label>
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="ja" ${preset.fensterlos === 'ja' ? 'checked' : ''} /> Ja</label>
      </div>
    </div>`;
}

export function renderWeFlaechen() {
  const list = document.getElementById('we-flaechen');
  if (!list) return;
  const count = weCount();
  const prev = [];
  list.querySelectorAll('.we-card').forEach((_, i) => prev.push(readWeRow(i)));
  list.innerHTML = Array.from({ length: count }, (_, i) => weRowHtml(i, prev[i])).join('');
}

export function bindWeFlaechen() {
  document.getElementById('anzahlWE')?.addEventListener('input', renderWeFlaechen);
  document.getElementById('anzahlWE')?.addEventListener('change', renderWeFlaechen);
  renderWeFlaechen();
}

export function collectWeFlaechen() {
  const count = weCount();
  const units = [];
  for (let i = 0; i < count; i += 1) units.push(readWeRow(i));
  return units;
}

export function validateWeFlaechen(units) {
  if (!units.length) throw new Error('Bitte die Anzahl der Wohneinheiten angeben.');
  units.forEach((unit, i) => {
    const area = Number(String(unit.flaeche).replace(',', '.'));
    if (!unit.flaeche || !Number.isFinite(area) || area <= 0) {
      throw new Error('Bitte die Wohnfläche für Wohnung ' + (i + 1) + ' eintragen.');
    }
    if (!unit.fensterlos) {
      throw new Error('Bitte angeben, ob in Wohnung ' + (i + 1) + ' fensterlose Räume vorhanden sind.');
    }
  });
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
