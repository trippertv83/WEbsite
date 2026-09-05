import { OFFICE } from './isfp-docs.js';

function weCount() {
  const n = parseInt(document.getElementById('anzahlWE')?.value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 40) : 1;
}

function readUnitRow(index) {
  const name = String(document.getElementById('we-name-' + index)?.value || '').trim();
  const flaeche = String(document.getElementById('we-flaeche-' + index)?.value || '').trim();
  const belegung = String(document.getElementById('we-belegung-' + index)?.value || '').trim();
  const typ = String(document.getElementById('we-typ-' + index)?.value || '').trim();
  const fensterlos = document.querySelector(`input[name="we-fensterlos-${index}"]:checked`)?.value || '';
  const abluft = String(document.getElementById('we-abluft-' + index)?.value || '').trim();
  const personen = String(document.getElementById('we-personen-' + index)?.value || '').trim();
  return { name, flaeche, belegung, typ, fensterlos, abluft, personen };
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
          <label for="we-belegung-${index}">Belegungsdichte</label>
          <select id="we-belegung-${index}" required>
            <option value="">Bitte wählen</option>
            <option ${preset.belegung === 'gering' ? 'selected' : ''}>gering</option>
            <option ${preset.belegung === 'mittel' ? 'selected' : ''}>mittel</option>
            <option ${preset.belegung === 'hoch' ? 'selected' : ''}>hoch</option>
          </select>
        </div>
        <div>
          <label for="we-personen-${index}">Personen <span class="hint">(optional)</span></label>
          <input id="we-personen-${index}" inputmode="numeric" value="${preset.personen || ''}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="we-typ-${index}">Wohnungstyp / Lage</label>
          <select id="we-typ-${index}" required>
            <option value="">Bitte wählen</option>
            <option ${preset.typ === 'freistehend' ? 'selected' : ''} value="freistehend">freistehend / Einfamilienhaus</option>
            <option ${preset.typ === 'kopf' ? 'selected' : ''} value="kopf">Kopfwohnung / Giebel</option>
            <option ${preset.typ === 'eck' ? 'selected' : ''} value="eck">Eckwohnung</option>
            <option ${preset.typ === 'mittel' ? 'selected' : ''} value="mittel">Mittelwohnung</option>
            <option ${preset.typ === 'dach' ? 'selected' : ''} value="dach">Dachgeschoss</option>
          </select>
        </div>
        <div>
          <label for="we-abluft-${index}">Ventilatorgestützte Abluft</label>
          <select id="we-abluft-${index}" required>
            <option value="">Bitte wählen</option>
            <option ${preset.abluft === 'keine' ? 'selected' : ''} value="keine">keine</option>
            <option ${preset.abluft === 'kueche' ? 'selected' : ''} value="kueche">Küche</option>
            <option ${preset.abluft === 'bad' ? 'selected' : ''} value="bad">Bad / WC</option>
            <option ${preset.abluft === 'mehrere' ? 'selected' : ''} value="mehrere">mehrere Räume</option>
          </select>
        </div>
      </div>
      <p>Fensterlose Räume in dieser Nutzungseinheit?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="nein" ${preset.fensterlos !== 'ja' ? 'required' : ''} ${preset.fensterlos !== 'ja' ? 'checked' : ''} /> Nein</label>
        <label class="check"><input type="radio" name="we-fensterlos-${index}" value="ja" ${preset.fensterlos === 'ja' ? 'checked' : ''} /> Ja</label>
      </div>
    </div>`;
}

export function lueftungFieldsetHtml() {
  const today = new Date().toLocaleDateString('de-DE');
  return `
    <fieldset>
      <legend>Lüftungskonzept DIN 1946-6</legend>
      <p class="hint">Angaben für das FS-Lüftungskonzept (Feuchteschutz). Bei mehreren Wohneinheiten ist die Wohnfläche je Wohnung Pflicht.</p>
      <div class="row">
        <div>
          <label for="lueftungEigentuemer">Eigentümer</label>
          <input id="lueftungEigentuemer" required />
        </div>
        <div>
          <label for="lueftungErsteller">Ersteller</label>
          <input id="lueftungErsteller" value="${OFFICE.firma}, ${OFFICE.name}" readonly />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="lueftungDatum">Erstellungsdatum</label>
          <input id="lueftungDatum" required value="${today}" />
        </div>
        <div>
          <label for="gebaeudeStatus">Neubau oder Bestandsgebäude</label>
          <select id="gebaeudeStatus" required>
            <option value="">Bitte wählen</option>
            <option value="bestand">Bestandsgebäude</option>
            <option value="neubau">Neubau</option>
          </select>
        </div>
      </div>
      <div class="row">
        <div>
          <label for="gebaeudeartLueftung">Gebäudeart</label>
          <select id="gebaeudeartLueftung" required>
            <option value="">Bitte wählen</option>
            <option value="EFH">Einfamilienhaus (EFH)</option>
            <option value="ZFH">Zweifamilienhaus</option>
            <option value="MFH">Mehrfamilienhaus (MFH)</option>
          </select>
        </div>
        <div>
          <label for="windzone">Windzone / Windstärke</label>
          <select id="windzone" required>
            <option value="">Bitte wählen</option>
            <option value="1">Windzone 1 (gering)</option>
            <option value="2">Windzone 2</option>
            <option value="3">Windzone 3</option>
            <option value="4">Windzone 4 (hoch)</option>
          </select>
        </div>
      </div>
      <p>Gesamtes Gebäude: ventilatorgestützte Abluftanlagen vorhanden?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="abluftGebaeude" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="abluftGebaeude" value="ja" /> Ja</label>
      </div>
      <p id="we-list-lead" class="hint">Nutzungseinheiten</p>
      <div id="we-list"></div>
    </fieldset>`;
}

export function renderWeList() {
  const list = document.getElementById('we-list');
  if (!list) return;
  const count = weCount();
  const prev = [];
  list.querySelectorAll('.we-card').forEach((_, i) => prev.push(readUnitRow(i)));
  const art = document.getElementById('gebaeudeartLueftung');
  if (art && !art.dataset.manual) {
    art.value = count >= 3 ? 'MFH' : count === 2 ? 'ZFH' : 'EFH';
  }
  list.innerHTML = Array.from({ length: count }, (_, i) => unitRowHtml(i, prev[i])).join('');
}

export function bindLueftungForm(session) {
  const owner = document.getElementById('lueftungEigentuemer');
  const name = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.name || '';
  const syncOwner = () => {
    if (!owner) return;
    if (document.querySelector('input[name="eigentuemer"]:checked')?.value === 'ja' && !owner.dataset.manual) {
      owner.value = name;
    }
  };
  document.querySelectorAll('input[name="eigentuemer"]').forEach((el) => el.addEventListener('change', syncOwner));
  owner?.addEventListener('input', () => {
    owner.dataset.manual = '1';
  });
  syncOwner();
  const art = document.getElementById('gebaeudeartLueftung');
  art?.addEventListener('change', () => {
    art.dataset.manual = '1';
  });
  document.getElementById('anzahlWE')?.addEventListener('input', renderWeList);
  document.getElementById('anzahlWE')?.addEventListener('change', renderWeList);
  renderWeList();
}

export function collectWohnungen() {
  const count = weCount();
  const units = [];
  for (let i = 0; i < count; i += 1) {
    units.push(readUnitRow(i));
  }
  return units;
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
    if (!unit.belegung) throw new Error('Bitte die Belegungsdichte für ' + unit.name + ' wählen.');
    if (!unit.typ) throw new Error('Bitte den Wohnungstyp für ' + unit.name + ' wählen.');
    if (!unit.fensterlos) throw new Error('Bitte angeben, ob in ' + unit.name + ' fensterlose Räume vorhanden sind.');
    if (!unit.abluft) throw new Error('Bitte die Abluftsituation für ' + unit.name + ' wählen.');
  });
  const requiredIds = ['lueftungEigentuemer', 'lueftungDatum', 'gebaeudeStatus', 'gebaeudeartLueftung', 'windzone'];
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el || !String(el.value || '').trim()) {
      throw new Error('Bitte alle Pflichtfelder zum Lüftungskonzept ausfüllen.');
    }
  }
  if (!document.querySelector('input[name="abluftGebaeude"]:checked')) {
    throw new Error('Bitte angeben, ob am Gebäude Abluftanlagen vorhanden sind.');
  }
}
