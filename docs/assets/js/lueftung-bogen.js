import { OFFICE } from './isfp-docs.js';

function weCount() {
  const n = parseInt(document.getElementById('anzahlWE')?.value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 40) : 1;
}

function readUnitRow(index) {
  const name = String(document.getElementById('we-name-' + index)?.value || '').trim();
  const flaeche = String(document.getElementById('we-flaeche-' + index)?.value || '').trim();
  const fensterlos = document.querySelector(`input[name="we-fensterlos-${index}"]:checked`)?.value || 'nein';
  const abluft = String(document.getElementById('we-abluft-' + index)?.value || 'keine').trim();
  return { name, flaeche, fensterlos, abluft };
}

function unitRowHtml(index, preset = {}) {
  const n = index + 1;
  const name = preset.name || 'Wohnung ' + n;
  return `
    <div class="we-card" data-we="${index}">
      <p><b>Nutzungseinheit ${n}</b></p>
      <div class="row">
        <div>
          <label for="we-name-${index}">Bezeichnung</label>
          <input id="we-name-${index}" required value="${name.replace(/"/g, '&quot;')}" />
        </div>
        <div>
          <label for="we-flaeche-${index}">Wohnfläche (m²)</label>
          <input id="we-flaeche-${index}" required inputmode="decimal" value="${preset.flaeche || ''}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="we-abluft-${index}">Ventilatorgestützte Abluft</label>
          <select id="we-abluft-${index}">
            <option value="keine" ${preset.abluft !== 'kueche' && preset.abluft !== 'bad' && preset.abluft !== 'mehrere' ? 'selected' : ''}>keine</option>
            <option value="kueche" ${preset.abluft === 'kueche' ? 'selected' : ''}>Küche</option>
            <option value="bad" ${preset.abluft === 'bad' ? 'selected' : ''}>Bad / WC</option>
            <option value="mehrere" ${preset.abluft === 'mehrere' ? 'selected' : ''}>mehrere Räume</option>
          </select>
        </div>
      </div>
      <p>Fensterlose Räume?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="nein" ${preset.fensterlos !== 'ja' ? 'checked' : ''} /> Nein</label>
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="ja" ${preset.fensterlos === 'ja' ? 'checked' : ''} /> Ja</label>
      </div>
    </div>`;
}

export function lueftungFieldsetHtml() {
  return `
    <fieldset>
      <legend>Nutzungseinheiten für das Lüftungskonzept</legend>
      <p class="hint">Nur Bezeichnung und Wohnfläche je Wohnung. Eigentümer, Ersteller, Gebäudeart, Windzone und Belegung werden aus den Angaben oben übernommen.</p>
      <div id="we-list"></div>
    </fieldset>`;
}

export function renderWeList() {
  const list = document.getElementById('we-list');
  if (!list) return;
  const count = weCount();
  const prev = [];
  list.querySelectorAll('.we-card').forEach((_, i) => prev.push(readUnitRow(i)));
  list.innerHTML = Array.from({ length: count }, (_, i) => unitRowHtml(i, prev[i])).join('');
}

export function bindLueftungForm() {
  document.getElementById('anzahlWE')?.addEventListener('input', renderWeList);
  document.getElementById('anzahlWE')?.addEventListener('change', renderWeList);
  renderWeList();
}

export function collectWohnungen() {
  const count = weCount();
  const units = [];
  for (let i = 0; i < count; i += 1) units.push(readUnitRow(i));
  return units;
}

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

export function gebaeudeartFromWe(count) {
  const n = Number(count) || 1;
  if (n >= 3) return 'MFH';
  if (n === 2) return 'ZFH';
  return 'EFH';
}

export function gebaeudeStatusFromBaujahr(baujahr) {
  const year = parseInt(String(baujahr || '').replace(/\D/g, '').slice(0, 4), 10);
  const now = new Date().getFullYear();
  if (Number.isFinite(year) && year >= now - 2) return 'neubau';
  return 'bestand';
}

export function wohnungstypFromArt(art) {
  if (art === 'EFH') return 'freistehend';
  if (art === 'ZFH') return 'kopf';
  return 'mittel';
}

export function enrichLueftung(data) {
  const count = Number(data.anzahlWE) || 1;
  const art = gebaeudeartFromWe(count);
  const typ = wohnungstypFromArt(art);
  const plz = data.objPlz || data.plz || '';
  const ownerName = [data.anrede, data.firstName, data.lastName].filter(Boolean).join(' ');
  const wohnungen = (data.wohnungen || []).map((unit) => ({
    ...unit,
    belegung: 'hoch',
    typ,
    personen: '',
    fensterlos: unit.fensterlos || 'nein',
    abluft: unit.abluft || 'keine',
  }));
  return {
    ...data,
    lueftungEigentuemer: ownerName,
    lueftungErsteller: OFFICE.firma + ', ' + OFFICE.name,
    lueftungDatum: new Date().toLocaleDateString('de-DE'),
    gebaeudeStatus: gebaeudeStatusFromBaujahr(data.baujahr),
    gebaeudeartLueftung: art,
    windzone: windzoneFromPlz(plz),
    windzoneHinweis: 'aus PLZ ' + plz + ' (' + bundeslandFromPlz(plz) + ')',
    abluftGebaeude: wohnungen.some((unit) => unit.abluft && unit.abluft !== 'keine') ? 'ja' : 'nein',
    wohnungen,
  };
}

export function validateLueftung(units) {
  if (!units.length) throw new Error('Bitte mindestens eine Nutzungseinheit angeben.');
  units.forEach((unit, i) => {
    if (!unit.name) throw new Error('Bitte die Bezeichnung für Wohnung ' + (i + 1) + ' eintragen.');
    const area = Number(String(unit.flaeche).replace(',', '.'));
    if (!unit.flaeche || !Number.isFinite(area) || area <= 0) {
      throw new Error('Wohnfläche für ' + (unit.name || 'Wohnung ' + (i + 1)) + ' ist Pflicht (m²).');
    }
    if (area > 500) throw new Error('Wohnfläche für ' + unit.name + ' wirkt unplausibel. Bitte prüfen.');
  });
}
