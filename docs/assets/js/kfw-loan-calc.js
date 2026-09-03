/**
 * Hausbank vs. KfW: Annuität, tilgungsfreie Jahre, Teilschulderlass, Szenarien.
 */

export function n(v) {
  const x = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}

export function euro(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

export function money(v) {
  return euro(v).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function pct(v) {
  return `${Number(v).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

/**
 * Monatliche Simulation. Zahlung nach tilgungsfreien Jahren = Restkapital × (Soll + Anfangstilgung) / 12.
 */
export function simulateLoan(opts) {
  const amount = euro(opts.amount);
  const grant = Math.max(0, euro(opts.grant || 0));
  const rate = n(opts.ratePct) / 100;
  const years = Math.max(1, n(opts.years));
  const graceYears = Math.max(0, n(opts.graceYears));
  const bindYears = Math.max(0.25, n(opts.bindYears) || years);
  const tilg = n(opts.tilgPct) / 100;
  const extraYear = Math.max(0, euro(opts.annualExtra || 0));
  const extraCost = Math.max(0, euro(opts.extraCost || 0));
  const i = rate / 12;
  const totalM = Math.round(years * 12);
  const graceM = Math.min(Math.round(graceYears * 12), totalM);
  const bindM = Math.min(Math.round(bindYears * 12), totalM);
  const horizon = opts.horizonMonths ? Math.min(opts.horizonMonths, totalM) : bindM;

  const grantMonth = Math.max(0, Math.round(n(opts.grantAfterMonths || 0)));
  let P = amount;
  let grantApplied = 0;
  let annuity = 0;
  let interestSum = 0;
  let tilgSum = 0;
  let cash = extraCost;
  const yearMark = {};
  let firstRepay = null;

  for (let m = 1; m <= totalM && P > 0.005; m += 1) {
    if (grant && grantMonth && m === grantMonth && !grantApplied) {
      const cut = Math.min(grant, P);
      P = euro(P - cut);
      grantApplied = cut;
    }
    const interest = euro(P * i);
    let pay = 0;
    let prin = 0;
    if (m <= graceM) {
      pay = interest;
    } else {
      if (!annuity) {
        const base = P;
        annuity = euro(base * (rate + tilg) / 12);
        if (annuity < interest + 1) annuity = euro(interest + base * Math.max(tilg, 0.01) / 12);
      }
      pay = Math.min(annuity, euro(P + interest));
      prin = euro(pay - interest);
      if (prin > P) {
        prin = P;
        pay = euro(interest + prin);
      }
      if (!firstRepay) firstRepay = { payment: pay, interest, tilgung: prin };
    }
    P = euro(P - prin);
    interestSum += interest;
    tilgSum += prin;
    cash += pay;
    if (m % 12 === 0 && extraYear && P > 0) {
      const extra = Math.min(extraYear, P);
      P = euro(P - extra);
      tilgSum += extra;
      cash += extra;
    }
    if (m === 12 || m === 60 || m === 120 || m === bindM || m === horizon || m === totalM) {
      yearMark[m] = { rest: P, interest: euro(interestSum), tilgung: euro(tilgSum), cash: euro(cash) };
    }
  }
  [12, 60, 120, bindM, horizon, totalM].forEach((m) => {
    if (!yearMark[m]) yearMark[m] = { rest: P, interest: euro(interestSum), tilgung: euro(tilgSum), cash: euro(cash) };
  });

  const at = (m) => yearMark[m] || { rest: P, interest: euro(interestSum), tilgung: euro(tilgSum), cash: euro(cash) };
  const h = at(Math.min(horizon, totalM));
  return {
    amount,
    grant,
    ratePct: n(opts.ratePct),
    years,
    graceYears,
    bindYears,
    tilgPct: n(opts.tilgPct),
    monthlyAfterGrace: annuity,
    monthlyGrace: euro(amount * i),
    splitGrace: { payment: euro(amount * i), interest: euro(amount * i), tilgung: 0 },
    splitRepay: firstRepay || { payment: annuity, interest: euro(amount * i), tilgung: euro(Math.max(0, annuity - amount * i)) },
    interest: h.interest,
    tilgung: h.tilgung,
    rest: h.rest,
    cash: h.cash,
    extraCost,
    grantApplied,
    grantAfterMonths: grantMonth,
    horizonMonths: Math.min(horizon, totalM),
    bindMonths: bindM,
    totalMonths: totalM,
    atBind: at(bindM),
    atEnd: at(totalM),
    atYear: {
      1: at(12),
      5: at(60),
      10: at(120),
    },
    paidOff: P <= 0.5,
  };
}

function addPos(a, b) {
  return {
    rest: euro((a?.rest || 0) + (b?.rest || 0)),
    interest: euro((a?.interest || 0) + (b?.interest || 0)),
    tilgung: euro((a?.tilgung || 0) + (b?.tilgung || 0)),
    cash: euro((a?.cash || 0) + (b?.cash || 0)),
  };
}

export function compareScenarios(input) {
  const total = euro(input.totalFinance);
  const kfwAmt = Math.min(total, Math.max(0, euro(input.kfwAmount)));
  const bankAmtB = euro(total - kfwAmt);
  const horizon = Math.min(
    Math.round(n(input.bank.bindYears) * 12) || 120,
    Math.round(n(input.kfw.bindYears) * 12) || 120
  );

  const bankA = simulateLoan({ ...input.bank, amount: total, horizonMonths: horizon });
  const kfw = simulateLoan({ ...input.kfw, amount: kfwAmt, horizonMonths: horizon });
  const bankB = simulateLoan({ ...input.bank, amount: bankAmtB, horizonMonths: horizon });

  const posA = { rest: bankA.rest, interest: bankA.interest, tilgung: bankA.tilgung, cash: bankA.cash };
  const posB = addPos(
    { rest: kfw.rest, interest: kfw.interest, tilgung: kfw.tilgung, cash: kfw.cash },
    { rest: bankB.rest, interest: bankB.interest, tilgung: bankB.tilgung, cash: bankB.cash }
  );

  const obligationA = euro(posA.cash + posA.rest);
  const obligationB = euro(posB.cash + posB.rest);
  const zinsersparnis = euro(posA.interest - posB.interest);
  const extraDelta = euro((bankB.extraCost + kfw.extraCost) - bankA.extraCost);
  const grant = euro(input.kfw.grant || 0);
  const netto = euro(obligationA - obligationB);

  function splitOf(loan, amt) {
    if (!amt) return { payment: 0, interest: 0, tilgung: 0 };
    return loan.splitRepay || loan.splitGrace;
  }
  const splitA = splitOf(bankA, total);
  const splitKfw = splitOf(kfw, kfwAmt);
  const splitBankB = splitOf(bankB, bankAmtB);
  const splitB = {
    payment: euro(splitKfw.payment + splitBankB.payment),
    interest: euro(splitKfw.interest + splitBankB.interest),
    tilgung: euro(splitKfw.tilgung + splitBankB.tilgung),
  };
  const splitAGrace = bankA.splitGrace;
  const splitBGrace = {
    payment: euro((kfwAmt ? kfw.splitGrace.payment : 0) + (bankAmtB ? bankB.splitGrace.payment : 0)),
    interest: euro((kfwAmt ? kfw.splitGrace.interest : 0) + (bankAmtB ? bankB.splitGrace.interest : 0)),
    tilgung: 0,
  };

  return {
    total,
    kfwAmt,
    bankAmtB,
    horizonMonths: horizon,
    bankA,
    kfw,
    bankB,
    posA,
    posB,
    monthlyA: splitA.payment,
    monthlyB: splitB.payment,
    monthlyAGrace: splitAGrace.payment,
    monthlyBGrace: splitBGrace.payment,
    splitA,
    splitB,
    splitKfw,
    splitBankB,
    splitAGrace,
    splitBGrace,
    zinsersparnis,
    grant,
    extraDelta,
    netto,
    obligationA,
    obligationB,
    bindMismatch: n(input.bank.bindYears) !== n(input.kfw.bindYears),
  };
}

export function breakEvenKfwRate(input) {
  const bankRate = n(input.bank.ratePct);
  let lo = 0;
  let hi = Math.max(bankRate + 8, 12);
  const base = compareScenarios(input).netto;
  if (base === 0) return { rate: n(input.kfw.ratePct), found: true };
  const wantSign = base >= 0 ? 1 : -1;
  for (let i = 0; i < 28; i += 1) {
    const mid = (lo + hi) / 2;
    const r = compareScenarios({ ...input, kfw: { ...input.kfw, ratePct: mid } });
    if (r.netto * wantSign >= 0) lo = mid;
    else hi = mid;
  }
  return { rate: euro(lo * 100) / 100, found: true };
}

export function sensitivity(input) {
  const rows = [];
  const variants = [
    { k: 'Basis', kfw: 0, bank: 0 },
    { k: 'KfW-Zins +0,25 %', kfw: 0.25, bank: 0 },
    { k: 'KfW-Zins +0,50 %', kfw: 0.5, bank: 0 },
    { k: 'Hausbank −0,25 %', kfw: 0, bank: -0.25 },
    { k: 'Hausbank −0,50 %', kfw: 0, bank: -0.5 },
  ];
  variants.forEach((v) => {
    const r = compareScenarios({
      ...input,
      bank: { ...input.bank, ratePct: n(input.bank.ratePct) + v.bank },
      kfw: { ...input.kfw, ratePct: n(input.kfw.ratePct) + v.kfw },
    });
    rows.push({ label: v.k, netto: r.netto, zins: r.zinsersparnis });
  });
  return rows;
}

export function verdict(netto) {
  if (netto > 50) {
    return `Unter den eingegebenen Annahmen ist die KfW-Variante gegenüber der reinen Hausbankfinanzierung um insgesamt ${money(netto)} günstiger.`;
  }
  if (netto < -50) {
    return `Unter den eingegebenen Annahmen ist die KfW-Variante gegenüber der reinen Hausbankfinanzierung um insgesamt ${money(Math.abs(netto))} teurer.`;
  }
  return 'Unter den aktuellen Annahmen bietet die KfW-Variante keinen nennenswerten wirtschaftlichen Vorteil gegenüber der Hausbankfinanzierung.';
}
