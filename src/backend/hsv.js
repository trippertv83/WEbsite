/**
 * HS Verbrauchspass 5.2.11 (.hsv) aus den Wizard-Auftragsdaten.
 * Reines Modul ohne Wix-Imports – gleiche Datei in Tests nutzbar.
 */

const FUELS = {
  heizoel: {
    brennstoff: 'Heizöl EL',
    name: 'Heizöl',
    einheit: { liter: 'Liter', kwh: 'kWh' },
    kwhPer: { liter: '10,08', kwh: '1' },
    prim: '1,1',
    co2: '0,31',
  },
  erdgas: {
    brennstoff: 'Erdgas H',
    name: 'Erdgas',
    einheit: { m3: 'm³', kwh: 'kWh' },
    kwhPer: { m3: '10,00', kwh: '1' },
    prim: '1,1',
    co2: '0,20',
  },
  fernwaerme: {
    brennstoff: 'Fernwärme',
    name: 'Fernwärme',
    einheit: { kwh: 'kWh' },
    kwhPer: { kwh: '1' },
    prim: '0,7',
    co2: '0,20',
  },
  strom: {
    brennstoff: 'Strom',
    name: 'Strom',
    einheit: { kwh: 'kWh' },
    kwhPer: { kwh: '1' },
    prim: '1,8',
    co2: '0,38',
  },
  holz: {
    brennstoff: 'Stückholz',
    name: 'Holz',
    einheit: { rm: 'Raummeter', kwh: 'kWh' },
    kwhPer: { rm: '1500', kwh: '1' },
    prim: '0,2',
    co2: '0,03',
  },
  pellets: {
    brennstoff: 'Holzpellets',
    name: 'Pellets',
    einheit: { kg: 'kg', t: 'Tonne', kwh: 'kWh' },
    kwhPer: { kg: '4,80', t: '4800', kwh: '1' },
    prim: '0,2',
    co2: '0,03',
  },
  waermepumpe: {
    brennstoff: 'Strom',
    name: 'Wärmepumpe',
    einheit: { kwh: 'kWh' },
    kwhPer: { kwh: '1' },
    prim: '1,8',
    co2: '0,38',
  },
};

function deNum(value, digits) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toFixed(digits).replace('.', ',');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function germanDate(year, month, day) {
  return `${pad2(day)}.${pad2(month)}.${year}`;
}

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function periodBounds(period) {
  if (!period) return { from: '30.12.1899', to: '30.12.1899' };
  const from = period.from;
  const to = period.to;
  if (from && typeof from === 'object' && from.year) {
    const fy = Number(from.year);
    const fm = Number(from.month);
    const ty = Number(to?.year || fy);
    const tm = Number(to?.month || fm);
    return {
      from: germanDate(fy, fm, 1),
      to: germanDate(ty, tm, lastDayOfMonth(ty, tm)),
    };
  }
  const fromStr = String(from || '');
  const iso = fromStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const toStr = String(to || fromStr);
    const toIso = toStr.match(/^(\d{4})-(\d{2})-(\d{2})/) || iso;
    return {
      from: germanDate(iso[1], iso[2], iso[3]),
      to: germanDate(toIso[1], toIso[2], toIso[3]),
    };
  }
  return { from: fromStr || '30.12.1899', to: String(to || fromStr || '30.12.1899') };
}

export function bundeslandFromPlz(plz) {
  const n = Number(String(plz || '').replace(/\D/g, '').slice(0, 5));
  if (!n) return '- Bundesland auswählen -';
  if ((n >= 80000 && n <= 87999) || (n >= 89000 && n <= 97999)) return 'Bayern';
  if (n >= 70000 && n <= 79999) return 'Baden-Württemberg';
  if (n >= 60000 && n <= 65999) return 'Hessen';
  if (n >= 66000 && n <= 66999) return 'Saarland';
  if (n >= 67000 && n <= 67999) return 'Rheinland-Pfalz';
  if (n >= 54000 && n <= 57999) return 'Rheinland-Pfalz';
  if (n >= 50000 && n <= 53999) return 'Nordrhein-Westfalen';
  if (n >= 32000 && n <= 33999) return 'Nordrhein-Westfalen';
  if (n >= 40000 && n <= 48999) return 'Nordrhein-Westfalen';
  if (n >= 58000 && n <= 59999) return 'Nordrhein-Westfalen';
  if (n >= 20000 && n <= 21999) return 'Hamburg';
  if (n >= 22000 && n <= 25999) return 'Schleswig-Holstein';
  if (n >= 26000 && n <= 31999) return 'Niedersachsen';
  if (n >= 34000 && n <= 39999) return 'Niedersachsen';
  if (n >= 49000 && n <= 49999) return 'Niedersachsen';
  if (n >= 10000 && n <= 14999) return 'Berlin';
  if (n >= 15000 && n <= 16999) return 'Brandenburg';
  if (n >= 3000 && n <= 4999) return 'Brandenburg';
  if (n >= 17000 && n <= 19999) return 'Mecklenburg-Vorpommern';
  if (n >= 1000 && n <= 2999) return 'Sachsen';
  if (n >= 8000 && n <= 9999) return 'Sachsen';
  if (n >= 6000 && n <= 6999) return 'Sachsen-Anhalt';
  if (n >= 38800 && n <= 39699) return 'Sachsen-Anhalt';
  if (n >= 7000 && n <= 7999) return 'Thüringen';
  if (n >= 98000 && n <= 99999) return 'Thüringen';
  if (n >= 27000 && n <= 28999) return 'Bremen';
  return '- Bundesland auswählen -';
}

function todayGerman(now = new Date()) {
  return germanDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function warmwasserTyp(mode) {
  if (mode === 'enthalten') return 'wwEnthalten';
  if (mode === 'separat') return 'wwMesswertkWh';
  return 'wwPauschal';
}

function gebaeudetyp(id) {
  return id === 'efh' ? 'Einfamilienhaus' : 'Mehrfamilienhaus';
}

function iniValue(value) {
  return String(value ?? '').replace(/[\r\n]/g, ' ').trim();
}

function linesFrom(section, entries) {
  const rows = [`[${section}]`];
  for (const [key, value] of entries) {
    rows.push(`${key}=${iniValue(value)}`);
  }
  return rows;
}

function periodList(consumption = {}) {
  return Array.isArray(consumption.periods) ? consumption.periods : [];
}

function climateOf(body, index) {
  const calc = body.calculation || {};
  const period = periodList(body.consumption)[index] || {};
  const fromCalc = calc.climateFactors?.[index] ?? calc.yearly?.[index]?.climateFactor;
  const n = Number(fromCalc ?? period.climateFactor ?? calc.climateFactor ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function hsvFileName(body) {
  const order = String(body.orderNumber || 'auftrag').replace(/[^\w.-]/g, '_');
  const plz = String(body.building?.plz || body.customer?.plz || '').replace(/\D/g, '');
  return `${order}${plz ? `_${plz}` : ''}.hsv`;
}

export function buildHsvContent(body, now = new Date()) {
  const building = body.building || {};
  const customer = body.customer || {};
  const consumption = body.consumption || {};
  const periods = periodList(consumption);
  const fuel = FUELS[consumption.energietraeger] || FUELS.heizoel;
  const unit = consumption.unit || 'kwh';
  const einheit = fuel.einheit[unit] || fuel.einheit.kwh || 'kWh';
  const kwhPer = fuel.kwhPer[unit] || '1';
  const area = deNum(building.wohnflaeche, 1);
  const street = `${building.strasse || ''} ${building.hausnummer || ''}`.trim();
  const plz = building.plz || customer.plz || '';
  const wwMode = building.warmwasser;
  const wwPercent = wwMode === 'unbekannt' ? '0,18' : '0';
  const isStrom =
    consumption.energietraeger === 'strom' || consumption.energietraeger === 'waermepumpe';
  const n = Math.max(periods.length, 1);

  const periodRows = [];
  for (let i = 0; i < n; i += 1) {
    const p = periods[i] || {};
    const bounds = periodBounds(p);
    const menge = p.consumption === '' || p.consumption == null ? '0' : deNum(p.consumption, 2);
    const ww = p.warmWater ? deNum(p.warmWater, 2) : '0';
    periodRows.push(
      [`PeriodeVon${i}`, bounds.from],
      [`PeriodeBis${i}`, bounds.to],
      [`PeriodeVerbrauchMenge${i}`, menge],
      [`PeriodeVerbrauchHZ${i}`, '0'],
      [`PeriodeVerbrauchWW${i}`, wwMode === 'separat' ? ww : '0'],
      [`PeriodeVerbrauchWWPro${i}`, '0'],
      [`PeriodeVerbrauchWWKubik${i}`, '0'],
      [`PeriodeVerbrauchKE${i}`, '0'],
      [`PeriodeVerbrauchKF${i}`, deNum(climateOf(body, i), 3)],
      [`PeriodeVerbrauchHZEKZ${i}`, '0'],
      [`PeriodeVerbrauchWWEKZ${i}`, '0'],
      [`PeriodeVerbrauchEKZ${i}`, '0'],
      [`PeriodeSystem${i}`, '0']
    );
  }

  const stromRows = [];
  for (let i = 0; i < n; i += 1) {
    const p = periods[i] || {};
    const bounds = periodBounds(p);
    const kwh = isStrom && p.consumption != null && p.consumption !== '' ? deNum(p.consumption, 2) : '0';
    stromRows.push(
      [`StromVon${i}`, bounds.from],
      [`StromBis${i}`, bounds.to],
      [`StromkWh${i}`, kwh],
      [`StromKE${i}`, '0'],
      [`StromEKZ${i}`, '0']
    );
  }

  const leerstand = periods
    .map((p, i) => ({ p, i, v: Number(p.vacancy) }))
    .filter((x) => Number.isFinite(x.v) && x.v > 0);

  const leerstandRows = [];
  leerstand.forEach((item, idx) => {
    const bounds = periodBounds(item.p);
    leerstandRows.push(
      [`LeerstandVon${idx}`, bounds.from],
      [`LeerstandBis${idx}`, bounds.to],
      [`LeerstandProzent${idx}`, deNum(item.v, 1)]
    );
  });

  const customerName =
    customer.name ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.companyName ||
    '';

  const rows = [
    ...linesFrom('Version', [['Programmversion', 'HS Verbrauchspass 5.2.11']]),
    ...linesFrom('Energieausweis', [
      ['EnEVAusgabe', 'GEG2024'],
      ['IstNichtwohngebaeude', '0'],
      ['DatenerfassungDurchEigentuemer', '1'],
      ['MitZusatzInfos', '1'],
      ['AusstellerZeile1', 'Dieter Spaderna'],
      ['AusstellerZeile2', 'Schornsteinfegermeister'],
      ['AusstellerZeile3', 'Ziegelanger 5'],
      ['AusstellerZeile4', '96250 Ebensfeld'],
      ['Anlass', ''],
      ['Ausstellungsdatum', todayGerman(now)],
      ['FirmenlogoAktiviert', '0'],
      ['FirmenlogoPfad', ''],
      ['ZusatzlogoAktiviert', '0'],
      ['ZusatzlogoPfad', ''],
      ['UnterschriftAktiviert', '0'],
      ['UnterschriftPfad', ''],
      ['UnterschriftTransparent', '0'],
      ['UnterschriftFarbe', '16777215'],
      ['UnterschriftToleranz', '1'],
    ]),
    ...linesFrom('DIBt', [
      ['Registriernummer', ''],
      ['XML_Senden', 'xsUnbekannt'],
    ]),
    ...linesFrom('Gebaeude', [
      ['Gebaeudetyp', gebaeudetyp(building.gebaeudetyp)],
      ['PLZ', plz],
      ['Ort', building.ort || customer.ort || ''],
      ['Strasse', street],
      ['Gebaeudeteil', ''],
      ['Bundesland', bundeslandFromPlz(plz)],
      ['ErneuerbareEnergien', ''],
      ['ErneuerbareEnergienA', ''],
      ['Lueftung', ''],
      ['BaujahrGeb', building.baujahr || ''],
      ['BaujahrAnlage', building.baujahrHeizung || ''],
      ['BaujahrKlimaanlage', ''],
      ['AnzahlWohnungen', building.gebaeudetyp === 'efh' ? '1' : ''],
      ['Nutzflaeche', area],
      ['WestentlTraeger', fuel.name],
      ['WestentlTraegerHeizung', fuel.name],
      ['WestentlTraegerWasser', ''],
      ['WestentlTraegerAuto', '1'],
      ['Foto', ''],
      ['FotoDrehung', '0'],
      ['FotoRelativ', ''],
      ['KlimaanlageAnzahl', '0'],
      ['KlimaanlageFaelligkeit', todayGerman(now)],
      ['Klimaanlage12kWohne', '0'],
      ['Klimaanlage12kWmit', '0'],
      ['Klimaanlage70kW', '0'],
      ['EE24_NutzungHz', '0'],
      ['EE24_NutzungDHW', '0'],
      ['EE24_65ProzEERegel', '0'],
      ['EE24_65ProzEERegelPauschal', '0'],
      ['EE24_P71b', '0'],
      ['EE24_P71c', '0'],
      ['EE24_P71d', '0'],
      ['EE24_P71e', '0'],
      ['EE24_P71fg', '0'],
      ['EE24_P71h_WP', consumption.energietraeger === 'waermepumpe' ? '1' : '0'],
      ['EE24_P71h_sol', '0'],
      ['EE24_P71Abs5', '0'],
      ['EE24_65ProzEERegelNicht', '1'],
    ]),
    ...linesFrom('Nichtwohngebauede', [
      ['Sonderzone1', ''],
      ['Sonderzone2', ''],
      ['Sonderzone3', ''],
      ['Vergleichsgebaeude', ''],
      ['VglHeizenergie', '0'],
      ['VglStrom', '0'],
      ['AnzahlKategorien', '0'],
      ['ENFausHNF', '0'],
      ['ENFausNF', '0'],
      ['ENFausBGF', '0'],
      ['EingabeFlaeche', '0'],
      ['TypFlaechenberechnung', '-1'],
      ['VerschiedeneZeitraueme', '1'],
      ['StromFuerHeizung', isStrom ? '1' : '0'],
      ['StromFuerBeleuchtung', '1'],
      ['StromFuerWarmwasser', '0'],
      ['StromFuerLueftung', '0'],
      ['StromFuerKuehlung', '0'],
      ['StromFuerSonstiges', '1'],
      ['StromFuerSonstigesBez', ''],
      ['StromFuerAufzug', '0'],
      ['FeuchteAnlage', '0'],
    ]),
    ...linesFrom('Gebauede', [
      ['ZusatzAuftraggeber', customerName],
      ['ZusatzAuftragsnummer', body.orderNumber || ''],
      ['ZusatzObjektnummer', customer.customerNumber || ''],
      ['ZusatzSonstiges', [customer.email, customer.phone].filter(Boolean).join(' | ')],
      ['ZusatzNutzflaeche', area],
    ]),
    ...linesFrom('Druck', [
      ['MitEmpfehlungen', '1'],
      ['MitUnterlagen', '0'],
    ]),
    ...linesFrom('Modernisierungsempfehlungen', [
      ['Anzahl', '0'],
      ['EmpfehlungenMoeglich', '1'],
      ['WeiteresBlatt', '0'],
      ['GenauereEmpfehlungen', 'Dieter Spaderna, Schornsteinfegermeister|Ziegelanger 5, 96250 Ebensfeld'],
      ['Erlaeuterungen', ''],
    ]),
    ...linesFrom('Verbrauch3', [
      ['PLZ', plz],
      ['WarmwasserIndividuell', wwMode === 'separat' ? '1' : '0'],
      ['WarmwasserMitSolar', '0'],
      ['Systemanzahl', '1'],
      ['SystemVon0', periodBounds(periods[0]).from],
      ['SystemBis0', periodBounds(periods[periods.length - 1] || periods[0]).to],
      ['SystemBrennstoff0', fuel.brennstoff],
      ['SystemBrennstoffName0', fuel.name],
      ['SystemEinheit0', einheit],
      ['SystemEnergieJeEinheit0', kwhPer],
      ['SystemEnergieJeEinheitManuell0', '0'],
      ['SystemPrimFaktor0', fuel.prim],
      ['SystemPrimFaktorManuell0', '0'],
      ['SystemCO2Faktor0', fuel.co2],
      ['SystemCO2FaktorManuell0', '0'],
      ['SystemLagerdaten0', ''],
      ['SystemVerbrauchEKZ0', '0'],
      ['SystemWarmwassertyp0', warmwasserTyp(wwMode)],
      ['SystemWarmwasserprozent0', wwPercent],
      ['SystemWarmwassertemperatur0', '50'],
      ['SystemKuehlungstyp0', 'ktNichtEnthalten'],
      ['Periodenanzahl', String(n)],
      ...periodRows,
      ['Leerstandanzahl', String(leerstand.length)],
      ...leerstandRows,
      ['LeerstandLeichtbeheizt', '1'],
      ['Stromanzahl', String(n)],
      ...stromRows,
    ]),
    ...linesFrom('Verbrauch', [
      ['Nutzflaeche', '1'],
      ['NutzflaecheAusWohnflaeche', '1'],
      ['Wohnflaeche', area],
      ['KellerBeheizt', building.beheizterKeller === 'ja' ? '1' : '0'],
      ['Gekuehlt', '0'],
      ['FAnteilGekuehlt_WG', '0'],
    ]),
  ];

  return `${rows.join('\r\n')}\r\n`;
}
