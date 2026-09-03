/**
 * Förderrechner Wohngebäude – öffentliche BEG-Regeln ab 21.07.2026.
 * Pro Maßnahme: BAFA / KfW / Steuer, empfohlen = höchster Betrag.
 */

const TAX_MAX = 40000;
const HEAT_CAP1 = 28000;

function n(v) {
  const x = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

function euro(v) {
  return Math.round(Math.max(0, Number(v) || 0) * 100) / 100;
}

function money(v) {
  return euro(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function weStack(we, first, mid, rest) {
  const count = Math.max(1, Math.min(200, Math.round(n(we) || 1)));
  let cap = first;
  for (let i = 2; i <= count; i += 1) cap += i <= 6 ? mid : rest;
  return cap;
}

export function incomeBonus(income, family, self) {
  if (!self) return 0;
  const zve = Math.max(0, n(income) - (family ? 10000 : 0));
  if (zve <= 30000) return 40;
  if (zve <= 40000) return 30;
  if (zve <= 50000) return 10;
  return 0;
}

export function rateCap(income, family) {
  const zve = Math.max(0, n(income) - (family ? 10000 : 0));
  return zve <= 30000 ? 80 : 70;
}

export function speedRate(date) {
  const t = new Date(date || Date.now()).getTime();
  if (t < Date.parse('2027-02-01')) return 16;
  if (t < Date.parse('2027-08-01')) return 12;
  if (t < Date.parse('2028-02-01')) return 8;
  if (t < Date.parse('2028-08-01')) return 4;
  return 0;
}

function opt(agency, program, amount, unit, lines, note) {
  if (!amount) return null;
  return { agency, program, amount: euro(amount), unit, lines: lines || [], note: note || '' };
}

function pickRec(bafa, kfw, fa) {
  const opts = [bafa, kfw, fa].filter(Boolean);
  if (!opts.length) return null;
  return opts.reduce((a, b) => (b.amount > a.amount ? b : a));
}

function heatLike(cost, g) {
  const cap = weStack(g.we, HEAT_CAP1, 15000, 8000);
  let elig = Math.min(cost, cap);
  if (g.eeVor) elig = Math.min(cost * 0.25, cap);
  const share = elig / g.we;
  const base = share * 0.3 * g.we;
  const bonusPct = Math.min(g.speed + g.eink, g.capRate - 30);
  const bonus = g.self ? share * (bonusPct / 100) : 0;
  const amount = euro(base + bonus);
  const lines = [
    { k: `Förderfähig Gebäude (gedeckelt ${cap.toLocaleString('de-DE')} €)`, v: money(elig) },
    { k: 'Basisförderung 30 % · ganzes Gebäude', v: money(base) },
  ];
  if (g.self) {
    lines.push({
      k: `WE 1 · Bonus ${bonusPct} % (${g.speed}% Geschw. + ${g.eink}% Eink., gedeckelt) · Anteil ${money(share)}`,
      v: '+ ' + money(bonus),
    });
  }
  if (g.eeVor) {
    lines.unshift({
      k: 'EE-Ersatz vor 01.01.2008 (Q1/2027): 25 % förderfähig',
      v: `${money(cost)} → ${money(cost * 0.25)}`,
    });
  }
  return { amount, elig, lines };
}

function tax20(cost, self, left) {
  if (!self || cost <= 0) return null;
  const amount = euro(Math.min(cost * 0.2, left));
  return opt(
    'Finanzamt',
    '§ 35c EStG',
    amount,
    'Steuerbonus',
    [
      { k: 'Selbstgenutzter Anteil (100 % der Ausgaben)', v: money(cost) },
      { k: '20 % Steuerbonus (über 3 Jahre)', v: money(amount) },
    ],
    '20 % über 3 Jahre (7/7/6 %), max. 40.000 € je selbstnutzendem Eigentümer. Nicht mit Zuschuss für dieselbe Maßnahme kombinierbar.'
  );
}

function tax50(cost, self, left) {
  if (!self || cost <= 0) return null;
  const amount = euro(Math.min(cost * 0.5, left));
  return opt(
    'Finanzamt',
    '§ 35c EStG',
    amount,
    'Steuerbonus',
    [
      { k: 'Selbstgenutzter Anteil (100 %)', v: money(cost) },
      { k: '50 % Steuerbonus', v: money(amount) },
    ],
    '50 % Steuerbonus auf Fachplanung/Baubegleitung. Keine Doppelförderung.'
  );
}

export const CATALOG = [
  { id: 'energieberatung', group: 'PLANUNG & BERATUNG', label: 'Energieberatung / iSFP', hint: 'BAFA EBW, 50 % gedeckelt' },
  { id: 'waermepumpe', group: 'HEIZUNG', label: 'Heizungstechnik', hint: 'Wärmepumpe, Biomasse, Solarthermie · KfW 458' },
  { id: 'bb_kfw458', group: 'HEIZUNG', label: 'Fachplanung & Baubegleitung – Heizungstechnik', hint: 'Steuer 50 %, in 458 enthalten' },
  { id: 'gebaeudenetz', group: 'HEIZUNG', label: 'Gebäudenetz', hint: 'BAFA BEG EM, analog Heizung' },
  { id: 'bb_gebnetz', group: 'HEIZUNG', label: 'Fachplanung & Baubegleitung – Gebäudenetz', hint: 'optional' },
  { id: 'heizopt_eff', group: 'HEIZUNGSOPTIMIERUNG', label: 'Heizungsoptimierung – Effizienzsteigerung', hint: 'BAFA 15/20 % oder Steuer 20 %' },
  { id: 'heizopt_emiss', group: 'HEIZUNGSOPTIMIERUNG', label: 'Heizungsoptimierung – Emissionsminderung', hint: 'BAFA 50 %, eigener Deckel' },
  { id: 'daemmung', group: 'GEBÄUDEHÜLLE & TECHNIK', label: 'Gebäudehülle – Dämmung', hint: 'BAFA oder Steuer, WPB ab Q1/2027' },
  { id: 'fenster', group: 'GEBÄUDEHÜLLE & TECHNIK', label: 'Gebäudehülle – Fenster + Türen', hint: 'BAFA oder Steuer' },
  { id: 'anlagen', group: 'GEBÄUDEHÜLLE & TECHNIK', label: 'Anlagentechnik (Lüftung, Smart Home)', hint: 'BAFA oder Steuer' },
  { id: 'bb_em', group: 'GEBÄUDEHÜLLE & TECHNIK', label: 'Fachplanung & Baubegleitung – alle Einzelmaßnahmen', hint: 'BAFA 50 % Deckel 5.000 € oder Steuer' },
  { id: 'ergkredit', group: 'ERGÄNZUNGSKREDIT', label: 'Ergänzungskredit Einzelmaßnahmen', hint: 'KfW 358/359, nur Kredit' },
  { id: 'komplett', group: 'EFFIZIENZHAUS', label: 'Komplettsanierung zum Effizienzhaus', hint: 'KfW 261, nicht mit BEG EM kombinierbar' },
  { id: 'bb_wg', group: 'EFFIZIENZHAUS', label: 'Fachplanung & Baubegleitung – BEG WG', hint: '50 %, Deckel 10.000 €' },
  { id: 'kauf_altbau', group: 'KAUF & UMBAU', label: 'Jung kauft alt', hint: 'KfW 308 Kredit' },
  { id: 'gewerbe', group: 'KAUF & UMBAU', label: 'Gewerbe zu Wohnen', hint: 'KfW 266, 30 % Zuschuss' },
  { id: 'wohneigentum', group: 'SONSTIGES', label: 'Wohneigentumsprogramm', hint: 'KfW 124 Kredit' },
  { id: 'stromerzeugung', group: 'SONSTIGES', label: 'Erneuerbare Energien (PV, Wind, Speicher)', hint: 'KfW 270 Kredit' },
  { id: 'altersgerecht', group: 'SONSTIGES', label: 'Altersgerechter Umbau', hint: 'KfW 159 Kredit' },
];

export function emptyMeasures() {
  const m = {};
  CATALOG.forEach((item) => {
    m[item.id] = { active: false, invest: 0, kredit: 0 };
  });
  return m;
}

export function calculate(state) {
  const we = Math.max(1, Math.min(200, Math.round(n(state.we) || 1)));
  const self = Boolean(state.selfOccupied);
  const family = Boolean(state.family);
  const isfp = Boolean(state.isfp);
  const date = state.date || new Date().toISOString().slice(0, 10);
  const g = {
    we,
    self,
    family,
    isfp,
    date,
    speed: self && state.oldFossil ? speedRate(date) : 0,
    eink: incomeBonus(state.income, family, self),
    capRate: rateCap(state.income, family),
    eeVor: Boolean(state.eeVor),
    wpbHuelle: Boolean(state.wpbHuelle),
    q1: Boolean(state.q12027) || date >= '2027-01-01',
  };
  const m = { ...emptyMeasures(), ...(state.measures || {}) };
  const cost = (id) => (m[id]?.active ? n(m[id].invest) : 0);
  const on = (id) => Boolean(m[id]?.active) && (n(m[id].invest) > 0 || n(m[id].kredit) > 0 || id === 'ergkredit');

  const poolIds = ['heizopt_eff', 'daemmung', 'fenster', 'anlagen'];
  const poolSum = poolIds.reduce((s, id) => s + cost(id), 0);
  const baseCap = weStack(we, 30000, 15000, 8000);
  const maxCap = isfp ? weStack(we, 60000, 30000, 16000) : baseCap;

  const per = [];
  const loans = [];

  function row(id, label, bafa, kfw, fa, extraLoans, xnote) {
    const rec = pickRec(bafa, kfw, fa);
    const grants = [bafa, kfw, fa].filter(Boolean);
    per.push({
      id,
      label,
      active: true,
      invest: cost(id) || n(m[id]?.kredit),
      bafa,
      kfw,
      fa,
      rec,
      grants,
      loans: extraLoans || [],
      xnote,
    });
  }

  if (on('energieberatung')) {
    const c = cost('energieberatung');
    const cap = we <= 2 ? 650 : 850;
    const raw = c * 0.5;
    const amount = euro(Math.min(raw, cap));
    row(
      'energieberatung',
      'Energieberatung / iSFP',
      opt('BAFA', 'EBW', amount, 'Zuschuss', [
        { k: '50 % der Kosten', v: money(raw) },
        { k: we <= 2 ? 'Höchstzuschuss (EFH/ZFH)' : 'Höchstzuschuss (MFH)', v: money(cap) },
      ], '50 % der Kosten der Energieberatung/des Sanierungsfahrplans, gedeckelt auf 650 € (EFH/ZFH).'),
      null,
      null
    );
  }

  if (on('waermepumpe')) {
    const c = cost('waermepumpe');
    const h = heatLike(c, g);
    row(
      'waermepumpe',
      'Heizungstechnik',
      null,
      opt('KfW', 'BEG EM 458', h.amount, 'Zuschuss', h.lines, 'Basisförderung 30 %. Boni nur selbstgenutzte WE. Gesamtsatz max. 80/70 %. Ab Q1/2027: 15 % + 15 % Wertschöpfungs-Bonus (EU).'),
      tax20(c, self, TAX_MAX)
    );
  }

  if (on('bb_kfw458')) {
    row('bb_kfw458', 'Fachplanung & Baubegleitung – Heizungstechnik', null, null, tax50(cost('bb_kfw458'), self, TAX_MAX));
  }

  if (on('gebaeudenetz')) {
    const c = cost('gebaeudenetz');
    const h = heatLike(c, { ...g, eeVor: false });
    row(
      'gebaeudenetz',
      'Gebäudenetz',
      opt('BAFA', 'BEG EM', h.amount, 'Zuschuss', h.lines, 'Wie Heizungsförderung, Antrag BAFA. Gesamtsatz max. 80/70 %.'),
      null,
      tax20(c, self, TAX_MAX)
    );
  }

  if (on('heizopt_emiss')) {
    const c = cost('heizopt_emiss');
    row(
      'heizopt_emiss',
      'Heizungsoptimierung – Emissionsminderung',
      opt('BAFA', 'BEG EM', c * 0.5, 'Zuschuss', [
        { k: 'Förderfähige Ausgaben', v: money(c) },
        { k: '50 % Fördersatz (Emissionsminderung)', v: money(c * 0.5) },
      ], '50 % an Biomasseheizungen, kein gemeinsamer Deckel der übrigen EM.'),
      null,
      null
    );
  }

  const poolOrder = ['daemmung', 'heizopt_eff', 'anlagen', 'fenster'];
  let remainMax = maxCap;
  let remainBase = baseCap;
  poolOrder.forEach((id) => {
    if (!on(id)) return;
    const c = cost(id);
    const elig = Math.min(c, Math.max(0, remainMax));
    remainMax -= elig;
    const inBase = Math.min(elig, remainBase);
    remainBase -= inBase;
    const extra = Math.max(0, elig - inBase);
    let bafaAmt = inBase * 0.15 + extra * 0.2;
    const lines = [
      { k: 'Förderfähige Kosten', v: money(elig) },
      { k: extra || inBase < elig ? `15 % auf ${money(inBase)} (Basis)` : '15 % Basisförderung', v: money(inBase * 0.15) },
    ];
    if (extra) lines.push({ k: `20 % auf ${money(extra)} (iSFP-Erhöhung)`, v: money(extra * 0.2) });
    if (id === 'daemmung' && g.wpbHuelle && g.q1) {
      bafaAmt += elig * 0.05;
      lines.push({ k: 'WPB-Bonus 5 % (Dämmung, ab Q1/2027)', v: money(elig * 0.05) });
    }
    const label = CATALOG.find((x) => x.id === id).label;
    row(
      id,
      label,
      opt(
        'BAFA',
        'BEG EM',
        bafaAmt,
        'Zuschuss',
        lines,
        `Gemeinsamer Höchstbetrag ${maxCap.toLocaleString('de-DE')} €${isfp ? ' (mit iSFP)' : ''}.`
      ),
      null,
      tax20(c, self, TAX_MAX)
    );
  });

  const anyBafaEm = per.some((p) => p.rec?.agency === 'BAFA' && p.rec?.program === 'BEG EM');
  if (on('bb_em')) {
    const c = cost('bb_em');
    const cap = 5000;
    const elig = Math.min(c, cap);
    const bafa = anyBafaEm
      ? opt('BAFA', 'BEG EM', elig * 0.5, 'Zuschuss', [
          { k: `Förderfähig (Deckel ${cap.toLocaleString('de-DE')} €)`, v: money(elig) },
          { k: '50 % Fördersatz', v: money(elig * 0.5) },
        ], '50 % – möglich, weil min. eine Maßnahme über BAFA BEG EM gefördert wird. Deckel 5.000 € (EFH/ZFH).')
      : null;
    row('bb_em', 'Fachplanung & Baubegleitung – alle Einzelmaßnahmen', bafa, null, tax50(c, self, TAX_MAX));
  }

  if (on('komplett')) {
    const c = cost('komplett');
    const loan = Math.min(c, 150000 * we);
    const eh = m.komplett.eh || '40';
    let pct = eh === '40' || eh === '40ee' ? 10 : eh === '55' ? 10 : 5;
    const lines = [
      { k: 'Förderkredit (bis 150.000 €/WE)', v: money(loan) },
      { k: `Basis-Tilgungszuschuss ${eh === '40' ? '40 EE' : 'EH ' + eh}`, v: `${pct} %` },
    ];
    if (m.komplett.nh) {
      pct += 5;
      lines.push({ k: '+ NH-Klasse (Nachhaltigkeit)', v: '+ 5 %' });
    }
    if (m.komplett.wpb) {
      pct += 10;
      lines.push({ k: '+ Worst Performing Building', v: '+ 10 %' });
    }
    if (m.komplett.ser) {
      pct += 15;
      lines.push({ k: '+ Serielle Sanierung', v: '+ 15 %' });
    }
    lines.push({ k: 'Tilgungszuschuss gesamt', v: `${pct} %` });
    const amount = euro(loan * (pct / 100));
    lines.push({ k: '= Zuschussbetrag', v: money(amount) });
    row(
      'komplett',
      'Komplettsanierung zum Effizienzhaus',
      null,
      opt('KfW', 'BEG WG 261', amount, 'Tilgungszuschuss', lines, 'Nicht kombinierbar mit BEG EM 458 / BAFA-Einzelmaßnahmen. 3 Jahre Sperre.'),
      null
    );
  }

  if (on('bb_wg') && on('komplett')) {
    const c = cost('bb_wg');
    const elig = Math.min(c, 10000);
    row(
      'bb_wg',
      'Fachplanung & Baubegleitung – BEG WG',
      null,
      opt('KfW', 'BEG WG 261', elig * 0.5, 'Tilgungszuschuss', [
        { k: 'Förderfähig (Deckel 10.000 €)', v: money(elig) },
        { k: '50 % Fördersatz', v: money(elig * 0.5) },
      ], '50 %, weil Komplettsanierung über 261 läuft.'),
      null
    );
  }

  if (on('gewerbe')) {
    const c = cost('gewerbe');
    const elig = Math.min(c, 100000 * we, 300000);
    row(
      'gewerbe',
      'Gewerbe zu Wohnen',
      null,
      opt('KfW', '266', elig * 0.3, 'Zuschuss', [
        { k: 'Förderfähig (100.000 €/WE)', v: money(elig) },
        { k: '30 % Zuschuss', v: money(elig * 0.3) },
      ], 'Umbau Gewerbe zu Wohnen. 01.07.2026–31.12.2026. Max. 300.000 €.'),
      null
    );
  }

  if (m.ergkredit?.active) {
    const emInv =
      cost('waermepumpe') +
      cost('gebaeudenetz') +
      cost('heizopt_eff') +
      cost('heizopt_emiss') +
      cost('daemmung') +
      cost('fenster') +
      cost('anlagen');
    const want = n(m.ergkredit.kredit) || n(m.ergkredit.invest);
    loans.push({
      id: 'ergkredit',
      title: 'Ergänzungskredit Einzelmaßnahmen',
      program: 'KfW · 358/359',
      amount: euro(Math.min(want || emInv, emInv || want, 120000 * we)),
      text: 'Setzt BAFA-Bescheid oder KfW-458-Zusage voraus. Bis 120.000 €/WE. Zinsvorteil Selbstnutzer bis 90.000 € zvE.',
    });
  }
  if (on('kauf_altbau')) {
    loans.push({
      id: 'kauf_altbau',
      title: 'Jung kauft alt',
      program: 'KfW · 308',
      amount: euro(cost('kauf_altbau')),
      text: 'Kredit 140.000 / 160.000 / 180.000 € nach Kinderzahl. EH 85 EE oder Paket Einzelmaßnahmen.',
    });
  }
  if (on('wohneigentum')) {
    loans.push({
      id: 'wohneigentum',
      title: 'Wohneigentumsprogramm',
      program: 'KfW · 124',
      amount: euro(Math.min(cost('wohneigentum'), 100000)),
      text: 'Zinsgünstiger Kredit bis 100.000 €, kombinierbar.',
    });
  }
  if (on('stromerzeugung')) {
    loans.push({
      id: 'stromerzeugung',
      title: 'Erneuerbare Energien',
      program: 'KfW · 270',
      amount: euro(cost('stromerzeugung')),
      text: 'Nur Kredit, kein Zuschuss. PV, Wind, Wasser, Speicher.',
    });
  }
  if (on('altersgerecht')) {
    loans.push({
      id: 'altersgerecht',
      title: 'Altersgerechter Umbau',
      program: 'KfW · 159',
      amount: euro(Math.min(cost('altersgerecht'), 50000 * we)),
      text: 'Kredit bis 50.000 €/WE. Zuschuss 455-B seit 31.07.2026 gestoppt.',
    });
  }

  const recs = per.filter((p) => p.rec);
  const grantTotal = euro(recs.reduce((s, p) => s + p.rec.amount, 0));
  const totals = { BAFA: 0, KfW: 0, Finanzamt: 0 };
  recs.forEach((p) => {
    totals[p.rec.agency] = euro((totals[p.rec.agency] || 0) + p.rec.amount);
  });
  const investTotal = euro(CATALOG.reduce((s, item) => s + cost(item.id) + n(m[item.id]?.kredit), 0));
  const warnings = [];
  if (on('komplett') && (on('waermepumpe') || poolSum > 0 || on('gebaeudenetz'))) {
    warnings.push(
      'Achtung: BEG WG (Komplettsanierung) und BEG EM (Einzelmaßnahmen/Heizung) sind nicht kombinierbar. Ab 21.07.2026 gilt eine 3-jährige Sperre – nur einen Weg beantragen; die hier ausgewiesene Summe darf nicht gemeinsam beantragt werden.'
    );
  }

  return {
    g: { we, selfWE: self ? 1 : 0, rentWE: self ? 0 : we, isfp, date, speedRate: g.speed },
    per,
    loans,
    totals,
    grantTotal,
    investTotal,
    warnings,
    quote: investTotal ? Math.round((grantTotal / investTotal) * 100) : 0,
  };
}

export function importEfbJson(data) {
  const e = data?.eingaben || {};
  const we0 = (e.we || [])[0] || {};
  const measures = emptyMeasures();
  Object.entries(e.measures || {}).forEach(([id, row]) => {
    measures[id] = { ...measures[id], ...row };
  });
  return {
    we: (e.we || []).length || 1,
    selfOccupied: we0.use !== 'rent',
    income: we0.income || 40000,
    family: Boolean(we0.family),
    isfp: Boolean(e.isfp),
    date: e.date,
    built: e.built,
    oldFossil: Boolean(e.measures?.waermepumpe?.old || e.measures?.gebaeudenetz?.old),
    eeVor: Boolean(e.measures?.waermepumpe?.eeVor),
    q12027: false,
    wpbHuelle: Boolean(e.measures?.daemmung?.wpb),
    measures,
  };
}
