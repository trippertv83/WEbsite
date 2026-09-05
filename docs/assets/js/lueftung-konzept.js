import { OFFICE, objectLine } from './isfp-docs.js';

const FS_FAKTOR = { gering: 0.3, mittel: 0.4, hoch: 0.5 };

function areaOf(unit) {
  return Number(String(unit.flaeche || '').replace(',', '.')) || 0;
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function assessUnit(unit, building) {
  const area = areaOf(unit);
  const qFs = Math.round(area * (FS_FAKTOR[unit.belegung] || 0.4));
  const wind = Number(building.windzone) || 2;
  const windowless = unit.fensterlos === 'ja';
  const noExhaust = unit.abluft === 'keine';
  const fensterMassnahme = String(building.massnahmen || '').includes('fenster');
  let freiLueftungOk = !windowless && wind >= 2 && area >= 20;
  if (windowless && noExhaust) freiLueftungOk = false;
  if (wind <= 1 && fensterMassnahme) freiLueftungOk = false;
  if (unit.belegung === 'hoch' && area < 40) freiLueftungOk = false;
  const hinweise = [];
  if (windowless) hinweise.push('Fensterlose Räume: Überströmen bzw. ventilatorgestützte Abluft prüfen.');
  if (fensterMassnahme) hinweise.push('Geplanter Fensteraustausch: Lüftungskonzept nach DIN 1946-6 ist erforderlich.');
  if (!freiLueftungOk) hinweise.push('Freie Lüftung reicht für den Feuchteschutz voraussichtlich nicht aus.');
  return {
    qFs,
    freiLueftungOk,
    empfehlung: freiLueftungOk
      ? 'Lüftung zum Feuchteschutz über freie Lüftung (Fensterlüftung) nach DIN 1946-6 grundsätzlich möglich, sofern die Nutzungsanleitung eingehalten wird.'
      : 'Es ist eine ventilatorgestützte Lüftung bzw. ein detaillierter Nachweis zu prüfen.',
    hinweise,
  };
}

export function renderLueftungKonzeptHtml(data) {
  const units = Array.isArray(data.wohnungen) ? data.wohnungen : [];
  const objekt = objectLine(data);
  const unitBlocks = units
    .map((unit) => {
      const result = assessUnit(unit, data);
      return `
        <section class="detail pdf-keep">
          <h3>${esc(unit.name || 'Nutzungseinheit')}</h3>
          <table>
            <tr><th>Wohnfläche</th><td>${esc(unit.flaeche)} m²</td></tr>
            <tr><th>Belegungsdichte</th><td>${esc(unit.belegung)}</td></tr>
            <tr><th>Personen</th><td>${esc(unit.personen || '—')}</td></tr>
            <tr><th>Wohnungstyp</th><td>${esc(unit.typ)}</td></tr>
            <tr><th>Fensterlose Räume</th><td>${esc(unit.fensterlos)}</td></tr>
            <tr><th>Ventilatorgestützte Abluft</th><td>${esc(unit.abluft)}</td></tr>
            <tr><th>Volumenstrom Feuchteschutz (Ansatz)</th><td>${result.qFs} m³/h</td></tr>
          </table>
          <p><b>Bewertung:</b> ${esc(result.empfehlung)}</p>
          ${result.hinweise.map((line) => `<p class="warn">${esc(line)}</p>`).join('')}
        </section>`;
    })
    .join('');
  return `
    <article>
      <div class="print-cover pdf-keep">
        <h1>FS Lüftungskonzept nach DIN 1946-6</h1>
        <p>Lüftung zum Feuchteschutz · Ingenieurbüro Spaderna</p>
      </div>
      <section class="detail pdf-keep">
        <h2>Projekt</h2>
        <table>
          <tr><th>Eigentümer</th><td>${esc(data.lueftungEigentuemer)}</td></tr>
          <tr><th>Ersteller</th><td>${esc(data.lueftungErsteller || OFFICE.firma + ', ' + OFFICE.name)}</td></tr>
          <tr><th>Erstellungsdatum</th><td>${esc(data.lueftungDatum)}</td></tr>
          <tr><th>Objekt</th><td>${esc(objekt)}</td></tr>
          <tr><th>Neubau / Bestand</th><td>${esc(data.gebaeudeStatus === 'neubau' ? 'Neubau' : 'Bestandsgebäude')}</td></tr>
          <tr><th>Baujahr</th><td>${esc(data.baujahr)}</td></tr>
          <tr><th>Gebäudeart</th><td>${esc(data.gebaeudeartLueftung)}</td></tr>
          <tr><th>Windzone</th><td>${esc(data.windzone)}</td></tr>
          <tr><th>Abluftanlagen Gebäude</th><td>${esc(data.abluftGebaeude)}</td></tr>
          <tr><th>Anzahl Nutzungseinheiten</th><td>${esc(data.anzahlWE)}</td></tr>
          <tr><th>Geplante Maßnahmen</th><td>${esc(data.massnahmen || '—')}</td></tr>
        </table>
      </section>
      ${unitBlocks}
      <section class="detail pdf-keep">
        <h2>Hinweise</h2>
        <p>Dieses FS-Lüftungskonzept wertet die Angaben aus dem Erfassungsbogen nach DIN 1946-6 (Lüftung zum Feuchteschutz) aus. Es ersetzt keine Ausführungsplanung einer Lüftungsanlage. Nutzungsanleitung: Stoßlüften der Aufenthaltsräume, Abluft in Feuchträumen nicht dauerhaft abdecken.</p>
        <p>${esc(OFFICE.firma)} · ${esc(OFFICE.street)} · ${esc(OFFICE.plz)} ${esc(OFFICE.ort)}</p>
      </section>
    </article>`;
}
