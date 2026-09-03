/** Offizieller KfW-Konditionen-Anzeiger – nur dokumentierte Sätze, kein Schätzen. */
export const KFW_ANZEIGER =
  'https://www.kfw-formularsammlung.de/KonditionenanzeigerINet/KonditionenAnzeiger?ProgrammNameNr=124+159+261+270+308+358+359';

export const PROGRAMS = [
  {
    id: '261',
    name: 'BEG Wohngebäude – Kredit (261)',
    maxHint: 'bis 150.000 € je Wohneinheit (Tilgungszuschuss separat eingeben)',
    match: ['sanierung', 'effizienzhaus'],
  },
  {
    id: '358',
    name: 'BEG EM Ergänzungskredit Plus (358)',
    maxHint: 'bis 120.000 € je WE, setzt BAFA-/458-Zusage voraus (Selbstnutzer-Plus)',
    match: ['einzelmassnahme', 'heizung'],
  },
  {
    id: '359',
    name: 'BEG EM Ergänzungskredit (359)',
    maxHint: 'bis 120.000 € je WE, setzt BAFA-/458-Zusage voraus',
    match: ['einzelmassnahme'],
  },
  {
    id: '124',
    name: 'Wohneigentumsprogramm (124)',
    maxHint: 'bis 100.000 €, Kauf/Bau selbstgenutztes Wohneigentum',
    match: ['kauf', 'neubau'],
  },
  {
    id: '308',
    name: 'Jung kauft Alt / Wohneigentum für Familien (308)',
    maxHint: '140.000–180.000 € nach Kinderzahl; Einkommensgrenzen prüfen',
    match: ['kauf', 'altbau'],
  },
  {
    id: '159',
    name: 'Altersgerecht Umbauen (159)',
    maxHint: 'Kredit bis 50.000 € je WE (Zuschuss 455-B gestoppt)',
    match: ['barriere'],
  },
  {
    id: '270',
    name: 'Erneuerbare Energien – Standard (270)',
    maxHint: 'bis 100 % der förderfähigen Kosten; hier Preisklasse A (beihilfefrei)',
    match: ['pv', 'ee'],
  },
];

function v(program, label, years, grace, bind, soll, eff, validFrom, note) {
  return {
    id: `${program}-${years}-${grace}-${bind}${note ? '-' + note : ''}`,
    program,
    label,
    years,
    grace,
    bind,
    soll,
    eff,
    validFrom,
    note: note || '',
    provisionPm: 0.15,
    payout: 100,
  };
}

/** Referenz aus dem offiziellen Konditionen-Anzeiger, Stand 02.09.2026, abgerufen 03.09.2026. */
export const SNAPSHOT_STAND = '02.09.2026';
export const SNAPSHOT_FETCHED = '2026-09-03';

export const SNAPSHOT = [
  v('261', 'BEG WG Effizienzhaus 10/2/10', 10, 2, 10, 2.14, 2.16, '2026-08-27'),
  v('261', 'BEG WG Effizienzhaus 10/10/10', 10, 10, 10, 3.07, 3.11, '2026-08-27'),
  v('261', 'BEG WG Effizienzhaus 20/3/10', 20, 3, 10, 2.82, 2.86, '2026-08-27'),
  v('261', 'BEG WG Effizienzhaus 30/5/10', 30, 5, 10, 2.99, 3.03, '2026-08-27'),
  v('358', 'Ergänzungskredit Plus 10/2/10', 10, 2, 10, 0.98, 0.98, '2026-07-24'),
  v('358', 'Ergänzungskredit Plus 10/10/10', 10, 10, 10, 2.34, 2.37, '2026-07-24'),
  v('358', 'Ergänzungskredit Plus 25/3/10', 25, 3, 10, 2.08, 2.1, '2026-07-24'),
  v('358', 'Ergänzungskredit Plus 35/5/10', 35, 5, 10, 2.25, 2.27, '2026-07-24'),
  v('358', 'Ergänzungskredit Plus 5/1/5', 5, 1, 5, 0.01, 0.01, '2024-02-27'),
  v('359', 'Ergänzungskredit 10/2/10', 10, 2, 10, 4.03, 4.11, '2026-07-24'),
  v('359', 'Ergänzungskredit 10/10/10', 10, 10, 10, 4.21, 4.29, '2026-07-24'),
  v('359', 'Ergänzungskredit 25/3/10', 25, 3, 10, 4.17, 4.25, '2026-07-24'),
  v('359', 'Ergänzungskredit 35/5/10', 35, 5, 10, 4.19, 4.27, '2026-07-24'),
  v('359', 'Ergänzungskredit 5/1/5', 5, 1, 5, 3.86, 3.93, '2026-07-24'),
  v('124', 'Wohneigentum 10/10/10', 10, 10, 10, 4.29, 4.38, '2026-08-24'),
  v('124', 'Wohneigentum 25/3/10', 25, 3, 10, 4.25, 4.33, '2026-08-24'),
  v('124', 'Wohneigentum 25/3/5', 25, 3, 5, 4.01, 4.09, '2026-08-24'),
  v('124', 'Wohneigentum 35/5/10', 35, 5, 10, 4.27, 4.36, '2026-08-24'),
  v('124', 'Wohneigentum 35/5/5', 35, 5, 5, 4.01, 4.09, '2026-08-24'),
  v('308', 'Jung kauft Alt 10/2/10', 10, 2, 10, 0.01, 0.01, '2025-10-23'),
  v('308', 'Jung kauft Alt 10/10/10', 10, 10, 10, 0.69, 0.69, '2026-06-18'),
  v('308', 'Jung kauft Alt 25/3/10', 25, 3, 10, 0.25, 0.25, '2026-06-18'),
  v('308', 'Jung kauft Alt 35/5/10', 35, 5, 10, 0.53, 0.53, '2026-06-18'),
  v('159', 'Altersgerecht 10/2/10', 10, 2, 10, 3.22, 3.27, '2026-07-24'),
  v('159', 'Altersgerecht 10/2/5', 10, 2, 5, 2.79, 2.83, '2026-07-24'),
  v('159', 'Altersgerecht 10/10/10', 10, 10, 10, 3.73, 3.79, '2026-07-24'),
  v('159', 'Altersgerecht 20/3/10', 20, 3, 10, 3.59, 3.65, '2026-07-24'),
  v('159', 'Altersgerecht 20/3/5', 20, 3, 5, 2.9, 2.94, '2026-07-24'),
  v('159', 'Altersgerecht 30/5/10', 30, 5, 10, 3.68, 3.74, '2026-07-24'),
  v('159', 'Altersgerecht 30/5/5', 30, 5, 5, 2.93, 2.97, '2026-07-24'),
  v('270', 'EE Standard 10/2/10 · Klasse A', 10, 2, 10, 4.51, 4.59, '2026-09-02', 'klasse-a'),
  v('270', 'EE PV-Aufdach 10/2/10 · Klasse A', 10, 2, 10, 4.31, 4.38, '2026-09-02', 'pv-a'),
  v('270', 'EE Standard 20/3/10 · Klasse A', 20, 3, 10, 4.71, 4.8, '2026-09-02', 'klasse-a'),
];

export function suggestProgram(vorhaben, family) {
  if (vorhaben === 'pv' || vorhaben === 'ee') return '270';
  if (vorhaben === 'barriere') return '159';
  if (vorhaben === 'einzelmassnahme') return '358';
  if (vorhaben === 'sanierung') return '261';
  if ((vorhaben === 'kauf' || vorhaben === 'altbau') && family) return '308';
  if (vorhaben === 'kauf' || vorhaben === 'neubau') return '124';
  return '261';
}

export function variantsFor(program, rows) {
  return (rows || SNAPSHOT).filter((r) => r.program === program);
}

/** Offizielle KfW-Produktseite 261 – Tabelle Tilgungszuschuss in % des Kreditbetrags. */
export const GRANT_PAGE =
  'https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Bundesf%C3%B6rderung-f%C3%BCr-effiziente-Geb%C3%A4ude-Wohngeb%C3%A4ude-Kredit-(261-262)/';
export const GRANT_SOURCE = GRANT_PAGE;

/** Stand laut kfw.de, Tabelle „Kredithöhe und Tilgungszuschuss“. */
export const GRANT_SNAPSHOT = {
  stand: '2026-09-03',
  eh: {
    '40': { ee: 10, nh: 15 },
    '55': { ee: 5, nh: 10 },
    '70': { ee: 0, nh: 5 },
    '85': { ee: 0, nh: 5 },
    denkmal: { ee: 5, nh: 10 },
  },
  wpbPp: 10,
  sersanPp: 15,
};

let grantTable = GRANT_SNAPSHOT;

export function parseGrantPage(html) {
  const t = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
  const grab = (label) => {
    const m = t.match(new RegExp(label + '[^0-9\\-]{0,40}(\\d+)\\s*%', 'i'));
    if (m) return Number(m[1]);
    if (new RegExp(label + '[^0-9%]{0,40}-', 'i').test(t)) return 0;
    return null;
  };
  const eh = {
    '40': {
      ee: grab('Effizienzhaus 40 Erneuerbare-Energien'),
      nh: grab('Effizienzhaus 40 Nachhaltigkeits-Klasse'),
    },
    '55': {
      ee: grab('Effizienzhaus 55 Erneuerbare-Energien'),
      nh: grab('Effizienzhaus 55 Nachhaltigkeits-Klasse'),
    },
    '70': {
      ee: grab('Effizienzhaus 70 Erneuerbare-Energien'),
      nh: grab('Effizienzhaus 70 Nachhaltigkeits-Klasse'),
    },
    '85': {
      ee: grab('Effizienzhaus 85 Erneuerbare-Energien'),
      nh: grab('Effizienzhaus 85 Nachhaltigkeits-Klasse'),
    },
    denkmal: {
      ee: grab('Effizienzhaus Denkmal Erneuerbare-Energien'),
      nh: grab('Effizienzhaus Denkmal Nachhaltigkeits-Klasse'),
    },
  };
  if (eh['40'].ee == null || eh['55'].ee == null) return null;
  Object.keys(eh).forEach((k) => {
    eh[k].ee = eh[k].ee == null ? GRANT_SNAPSHOT.eh[k].ee : eh[k].ee;
    eh[k].nh = eh[k].nh == null ? GRANT_SNAPSHOT.eh[k].nh : eh[k].nh;
  });
  return { stand: '', eh, wpbPp: GRANT_SNAPSHOT.wpbPp, sersanPp: GRANT_SNAPSHOT.sersanPp };
}

export function begWgGrantPct({ eh, nh, wpb, sersan }, table = grantTable) {
  const row = (table.eh && table.eh[eh]) || GRANT_SNAPSHOT.eh[eh] || GRANT_SNAPSHOT.eh['40'];
  let pct = nh ? row.nh : row.ee;
  if (wpb && (eh === '70' || eh === '55' || eh === '40')) pct += table.wpbPp;
  if (sersan && (eh === '55' || eh === '40')) pct += table.sersanPp;
  return pct;
}

export async function loadGrantTable() {
  try {
    const res = await fetch(GRANT_PAGE, { mode: 'cors' });
    if (res.ok) {
      const parsed = parseGrantPage(await res.text());
      if (parsed && parsed.eh['40'].ee === 10) {
        parsed.stand = new Date().toISOString().slice(0, 10);
        grantTable = parsed;
        return { ok: true, auto: true, table: grantTable, source: GRANT_PAGE };
      }
    }
  } catch {
    /* CORS */
  }
  grantTable = GRANT_SNAPSHOT;
  return { ok: false, auto: false, table: grantTable, source: GRANT_PAGE };
}

function parseDe(s) {
  const n = Number(String(s || '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseAnzeiger(text) {
  const rows = [];
  const re =
    /(BEG Wohngebäude[^|]*?|BEG Einzelmaß[^\n]*?|Wohneigentumsprogramm|Wohneigentum für Familien[^|]*?|Altersgerecht Umbauen|Erneuerbare Energien Standard)\s+(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)[\s\S]{0,80}?(\d{3})[\s\S]{0,120}?(\d+,\d+)\s*\((\d+,\d+)\)/gi;
  let m;
  while ((m = re.exec(text))) {
    const program = m[5];
    const soll = parseDe(m[6]);
    const eff = parseDe(m[7]);
    if (!soll) continue;
    rows.push({
      id: `${program}-${m[2]}-${m[3]}-${m[4]}-${soll}`,
      program,
      label: `${m[1].trim()} ${m[2]}/${m[3]}/${m[4]}`,
      years: Number(m[2]),
      grace: Number(m[3]),
      bind: Number(m[4]),
      soll,
      eff,
      validFrom: '',
      note: 'live',
      provisionPm: 0.15,
      payout: 100,
    });
  }
  return rows;
}

export async function loadKonditionen() {
  const source = KFW_ANZEIGER;
  try {
    const res = await fetch(source, { mode: 'cors' });
    if (res.ok) {
      const text = await res.text();
      const live = parseAnzeiger(text);
      if (live.length >= 4) {
        return {
          ok: true,
          auto: true,
          rows: live,
          stand: (text.match(/Stand:\s*([0-9.]+)/) || [])[1] || SNAPSHOT_STAND,
          fetched: new Date().toISOString().slice(0, 10),
          source,
        };
      }
    }
  } catch {
    /* CORS oder Netz */
  }
  return {
    ok: false,
    auto: false,
    rows: SNAPSHOT,
    stand: SNAPSHOT_STAND,
    fetched: SNAPSHOT_FETCHED,
    source,
  };
}
