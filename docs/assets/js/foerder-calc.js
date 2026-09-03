/**
 * BEG-Förderrechner (Stand 21.07.2026).
 * Keine Rechtsberatung – Schätzung für Kundengespräche.
 */

function num(value) {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function speedBonusPercent(antragDate) {
  const d = antragDate ? new Date(antragDate) : new Date();
  if (Number.isNaN(d.getTime())) return 16;
  const t = d.getTime();
  const steps = [
    [new Date('2027-02-01').getTime(), 16],
    [new Date('2027-08-01').getTime(), 12],
    [new Date('2028-02-01').getTime(), 8],
    [new Date('2028-08-01').getTime(), 4],
  ];
  for (const [from, pct] of steps) {
    if (t < from) return pct;
  }
  return 0;
}

export function incomeBonusPercent({ income, hasChild, selfOccupied }) {
  if (!selfOccupied) return 0;
  const zvE = Math.max(0, num(income) - (hasChild ? 10000 : 0));
  if (zvE <= 30000) return 40;
  if (zvE <= 40000) return 30;
  if (zvE <= 50000) return 10;
  return 0;
}

export function heatingRateCap({ income, hasChild }) {
  const zvE = Math.max(0, num(income) - (hasChild ? 10000 : 0));
  return zvE <= 30000 ? 80 : 70;
}

export function weCap({ first, mid, rest, we }) {
  const n = Math.max(1, Math.min(200, Math.round(num(we) || 1)));
  let cap = first;
  for (let i = 2; i <= n; i += 1) cap += i <= 6 ? mid : rest;
  return { we: n, cap };
}

export function heatingEligibleCap(we) {
  return weCap({ first: 28000, mid: 15000, rest: 8000, we }).cap;
}

export function bafaEligibleCap(we, isfp) {
  return isfp
    ? weCap({ first: 60000, mid: 30000, rest: 16000, we }).cap
    : weCap({ first: 30000, mid: 15000, rest: 8000, we }).cap;
}

export function bafaIsfpThreshold(we) {
  return weCap({ first: 30000, mid: 15000, rest: 8000, we }).cap;
}

const SPEED_OLD = new Set(['oel', 'gas_zentral', 'gas_etage', 'kohle', 'nachtspeicher']);

export const MEASURES = [
  {
    id: 'wp',
    group: 'heizung',
    label: 'Wärmepumpe',
    hint: 'KfW 458',
    agency: 'kfw',
  },
  {
    id: 'biomasse',
    group: 'heizung',
    label: 'Biomasseheizung',
    hint: 'KfW 458',
    agency: 'kfw',
  },
  {
    id: 'solar',
    group: 'heizung',
    label: 'Solarthermie',
    hint: 'KfW 458',
    agency: 'kfw',
  },
  {
    id: 'netz',
    group: 'heizung',
    label: 'Anschluss Wärme- / Gebäudenetz',
    hint: 'KfW 458',
    agency: 'kfw',
  },
  {
    id: 'wand',
    group: 'huelle',
    label: 'Fassaden- / Außendämmung',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
    wpb: true,
  },
  {
    id: 'dach',
    group: 'huelle',
    label: 'Dach- / oberste Geschossdecke',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
    wpb: true,
  },
  {
    id: 'keller',
    group: 'huelle',
    label: 'Kellerdecke / Boden',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
    wpb: true,
  },
  {
    id: 'fenster',
    group: 'huelle',
    label: 'Fenster / Außentüren',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
    wpb: false,
  },
  {
    id: 'lueftung',
    group: 'anlage',
    label: 'Lüftungsanlage',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
  },
  {
    id: 'hopt',
    group: 'anlage',
    label: 'Heizungsoptimierung (hydraulischer Abgleich)',
    hint: 'BAFA BEG EM',
    agency: 'bafa',
  },
  {
    id: 'emission',
    group: 'anlage',
    label: 'Emissionsminderung Biomasse',
    hint: '50 % BAFA',
    agency: 'bafa',
    rate: 50,
  },
  {
    id: 'planung',
    group: 'planung',
    label: 'Fachplanung / Baubegleitung',
    hint: '50 % BAFA',
    agency: 'bafa',
    rate: 50,
  },
  {
    id: 'ebw',
    group: 'beratung',
    label: 'Energieberatung / iSFP (EBW)',
    hint: '80 % BAFA',
    agency: 'bafa',
    rate: 80,
  },
];

function euro(value) {
  return round2(Math.max(0, value));
}

export function calculate(input) {
  const we = Math.max(1, Math.min(200, Math.round(num(input.we) || 1)));
  const selfOccupied = Boolean(input.selfOccupied);
  const isfp = Boolean(input.isfp);
  const wpb = Boolean(input.wpb);
  const taxInstead = Boolean(input.taxInstead);
  const antrag = input.antrag || new Date().toISOString().slice(0, 10);
  const speedOk =
    selfOccupied &&
    (SPEED_OLD.has(input.oldHeating) ||
      (input.oldHeating === 'biomasse_alt' && input.biomassOld));
  const speedPct = speedOk ? speedBonusPercent(antrag) : 0;
  const incomePct = incomeBonusPercent({
    income: input.income,
    hasChild: input.hasChild,
    selfOccupied,
  });
  const heatCapRate = heatingRateCap({ income: input.income, hasChild: input.hasChild });
  const wpbFrom = antrag >= '2027-01-01';

  const costs = input.costs || {};
  const on = input.on || {};

  const heatingCost = MEASURES.filter((m) => m.group === 'heizung' && on[m.id]).reduce(
    (sum, m) => sum + num(costs[m.id]),
    0
  );
  const heatCap = heatingEligibleCap(we);
  const heatEligible = Math.min(heatingCost, heatCap);
  const heatShare = heatEligible / we;
  let heatRate = 30;
  if (selfOccupied) heatRate = Math.min(30 + speedPct + incomePct, heatCapRate);
  const kfwCapped = taxInstead
    ? 0
    : euro(heatShare * 0.3 * we + (selfOccupied ? heatShare * ((heatRate - 30) / 100) : 0));

  const bafaItems = MEASURES.filter(
    (m) => m.agency === 'bafa' && m.group !== 'beratung' && on[m.id]
  );
  const planningSeparate = MEASURES.filter((m) => m.rate && on[m.id]);
  const poolIds = bafaItems.filter((m) => !m.rate).map((m) => m.id);
  const poolCost = poolIds.reduce((sum, id) => sum + num(costs[id]), 0);
  const bafaCap = bafaEligibleCap(we, isfp);
  const poolEligible = Math.min(poolCost, bafaCap);
  const threshold = bafaIsfpThreshold(we);
  const baseBafa = taxInstead ? 0 : euro(poolEligible * 0.15);
  const over = isfp && !taxInstead ? Math.max(0, poolEligible - threshold) : 0;
  const isfpBonus = euro(over * 0.05);
  let wpbBonus = 0;
  if (!taxInstead && wpb && wpbFrom) {
    const insul = MEASURES.filter((m) => m.wpb && on[m.id]).reduce(
      (sum, m) => sum + num(costs[m.id]),
      0
    );
    const insulEligible = Math.min(insul, poolEligible);
    wpbBonus = euro(insulEligible * 0.05);
  }

  const special = planningSeparate.map((m) => {
    const c = num(costs[m.id]);
    const grant = euro(c * (m.rate / 100));
    return {
      id: m.id,
      label: m.label,
      agency: 'BAFA',
      cost: c,
      eligible: c,
      rate: m.rate,
      grant,
    };
  });

  const taxPool = heatingCost + poolCost;
  const taxGrant = taxInstead && selfOccupied ? euro(Math.min(taxPool * 0.2, 40000)) : 0;

  const rows = [];
  if (heatingCost > 0) {
    rows.push({
      id: 'heizung',
      label: 'Heizungstechnik (KfW 458)',
      agency: taxInstead ? 'Finanzamt' : 'KfW',
      cost: heatingCost,
      eligible: taxInstead ? heatingCost : heatEligible,
      rate: taxInstead ? 20 : heatRate,
      grant: taxInstead ? euro(taxGrant * (taxPool ? heatingCost / taxPool : 0)) : kfwCapped,
      detail: taxInstead
        ? '§ 35c EStG, nicht mit KfW kombinierbar'
        : `Grund 30 %${speedPct ? ` + Klima ${speedPct} %` : ''}${
            incomePct ? ` + Einkommen ${incomePct} %` : ''
          }, Deckel ${heatCapRate} %`,
    });
  }
  if (poolCost > 0) {
    const bafaGrant = euro(baseBafa + isfpBonus + wpbBonus);
    rows.push({
      id: 'bafa-pool',
      label: 'Gebäudehülle / Anlagentechnik',
      agency: taxInstead ? 'Finanzamt' : 'BAFA',
      cost: poolCost,
      eligible: taxInstead ? poolCost : poolEligible,
      rate: taxInstead ? 20 : 15,
      grant: taxInstead ? euro(taxGrant * (taxPool ? poolCost / taxPool : 0)) : bafaGrant,
      detail: taxInstead
        ? '§ 35c EStG'
        : `15 %${isfp ? ` + iSFP 5 % auf Betrag über ${threshold.toLocaleString('de-DE')} €` : ''}${
            wpbBonus ? ' + WPB 5 % (Dämmung, ab Q1/2027)' : ''
          }`,
    });
  }
  if (!taxInstead) {
    special.forEach((row) => {
      rows.push({
        ...row,
        detail: `${row.rate} % Zuschuss`,
      });
    });
  }

  const grantTotal = euro(rows.reduce((sum, r) => sum + r.grant, 0));
  const costTotal = euro(
    MEASURES.filter((m) => on[m.id]).reduce((sum, m) => sum + num(costs[m.id]), 0)
  );
  const rest = euro(costTotal - grantTotal);

  return {
    we,
    antrag,
    costTotal,
    grantTotal,
    rest,
    kfw: taxInstead ? 0 : kfwCapped,
    bafa: taxInstead
      ? 0
      : euro(baseBafa + isfpBonus + wpbBonus + special.reduce((s, r) => s + r.grant, 0)),
    tax: taxInstead ? euro(Math.min((heatingCost + poolCost) * 0.2, 40000)) : 0,
    heatEligible,
    heatCap,
    heatRate: taxInstead ? 0 : heatRate,
    speedPct,
    incomePct,
    heatCapRate,
    poolEligible,
    bafaCap,
    isfpBonus,
    wpbBonus,
    rows,
    notes: [
      'Stand Förderbedingungen: 21.07.2026 (BEG EM / KfW 458).',
      'Unverbindliche Schätzung. Antrag und BzA über Energieeffizienz-Experten.',
      taxInstead
        ? 'Steuerbonus und BAFA/KfW-Zuschuss sind für dieselbe Maßnahme nicht kombinierbar.'
        : 'Zuschusswege BAFA und KfW; Steuerbonus hier ausgeschaltet.',
    ],
  };
}
