/**
 * HS Verbrauchspass – Layout wie lukas.hsv (5.2.16).
 * Nur vorhandene Schlüssel, Werte aus dem Erfassungsbogen.
 */

const RECOMMENDATION_OPTIONS = [
  {
    id: 'waerme-wp',
    bauteil: 'Wärmeerzeugung',
    beschreibung: 'Erneuerung der Heizungsanlage - Einbau einer Wärmepumpe',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'hydraulisch',
    bauteil: 'Heizungsanlage',
    beschreibung: 'Durchführung eines hydraulischen Abgleiches',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'solar-ww',
    bauteil: 'Warmwasser-Bereitung',
    beschreibung: 'Einbau einer solaren Brauchwarmwasserbereitung / PV Anlage',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'fenster',
    bauteil: 'Fenster',
    beschreibung: 'Erneuerung der Fenster',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'dach',
    bauteil: 'Dach',
    beschreibung: 'Dämmung der obersten Geschossdecke / des Daches',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'kellerdecke',
    bauteil: 'Kellerdecke',
    beschreibung: 'Dämmung der Kellerdecke',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'fassade',
    bauteil: 'Außenwand',
    beschreibung: 'Fassadendämmung',
    modernisierung: 0,
    einzelmassnahme: 1,
  },
  {
    id: 'allgemein',
    bauteil: 'Allgemein',
    beschreibung:
      'Weitere Maßnahmen sind denkbar, diese sollten im Rahmen einer Energieberatung untersucht werden. Die staatlichen Förderungen sind sehr gut.',
    modernisierung: 1,
    einzelmassnahme: 1,
  },
];

function selectedRecommendations(ids = []) {
  const set = new Set(ids);
  return RECOMMENDATION_OPTIONS.filter((item) => set.has(item.id));
}

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
    brennstoff: 'Erdgas E',
    name: 'Erdgas E',
    einheit: { m3: 'm³', kwh: 'kWh Brennwert' },
    kwhPer: { m3: '10,00', kwh: '0,900900900900901' },
    prim: '1,1',
    co2: '0,24',
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
    name: 'Stückholz',
    einheit: { rm: 'rm', kwh: 'kWh' },
    kwhPer: { rm: '2326', kwh: '1' },
    prim: '0,2',
    co2: '0,02',
  },
  pellets: {
    brennstoff: 'Holzpellets',
    name: 'Holzpellets',
    einheit: { kg: 'kg', t: 't', kwh: 'kWh' },
    kwhPer: { kg: '4,80', t: '4800', kwh: '1' },
    prim: '0,2',
    co2: '0,02',
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

function deNum(value, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (digits === 0 && Number.isInteger(n)) return String(n);
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

function todayGerman(now = new Date()) {
  return germanDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function periodBounds(period) {
  if (!period) return { from: '30.12.1899', to: '30.12.1899', sort: 0 };
  const fy = Number(period.fromYear ?? period.from?.year ?? period.from?.Year);
  const fm = Number(period.fromMonth ?? period.from?.month ?? period.from?.Month);
  const ty = Number(period.toYear ?? period.to?.year ?? period.to?.Year);
  const tm = Number(period.toMonth ?? period.to?.month ?? period.to?.Month);
  if (fy && fm) {
    const endY = ty || fy;
    const endM = tm || fm;
    return {
      from: germanDate(fy, fm, 1),
      to: germanDate(endY, endM, lastDayOfMonth(endY, endM)),
      sort: fy * 100 + fm,
    };
  }
  const from = period.from;
  const to = period.to;
  if (from && typeof from === 'object' && from.year) {
    const y = Number(from.year);
    const m = Number(from.month);
    const y2 = Number(to?.year || y);
    const m2 = Number(to?.month || m);
    return {
      from: germanDate(y, m, 1),
      to: germanDate(y2, m2, lastDayOfMonth(y2, m2)),
      sort: y * 100 + m,
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
      sort: Number(iso[1]) * 100 + Number(iso[2]),
    };
  }
  const label = String(period.label || '');
  const years = label.match(/(\d{4})/g);
  if (years && years.length) {
    const y = Number(years[0]);
    const y2 = Number(years[years.length - 1] || years[0]);
    return {
      from: germanDate(y, 1, 1),
      to: germanDate(y2, 12, 31),
      sort: y * 100 + 1,
    };
  }
  return {
    from: fromStr || '30.12.1899',
    to: String(to || fromStr || '30.12.1899'),
    sort: 0,
  };
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
  return 'Bayern';
}

export function orderBodyFromRecord(record = {}) {
  const calc = record.calculation || {};
  const snap = calc.orderSnapshot || record.orderSnapshot || {};
  return {
    orderNumber: record.orderNumber || snap.orderNumber || '',
    customer: record.customer || snap.customer || {
      name: record.customerName || '',
      email: record.customerEmail || '',
    },
    building: record.building || snap.building || {},
    consumption: record.consumption || snap.consumption || {},
    calculation: calc,
  };
}

function iniValue(value) {
  return String(value ?? '').replace(/[\r\n]/g, ' ').trim();
}

function kv(key, value) {
  return `${key}=${iniValue(value)}`;
}

function sortedPeriods(consumption = {}) {
  const list = Array.isArray(consumption.periods) ? [...consumption.periods] : [];
  return list
    .map((p) => ({ p, bounds: periodBounds(p) }))
    .sort((a, b) => a.bounds.sort - b.bounds.sort);
}

function climateOf(body, index) {
  const calc = body.calculation || {};
  const n = Number(
    calc.climateFactors?.[index] ?? calc.yearly?.[index]?.climateFactor ?? 0
  );
  return Number.isFinite(n) ? n : 0;
}

function gebaeudetypHsv(id) {
  if (id === 'mfh' || id === 'Mehrfamilienhaus') return 'Mehrfamilienhaus';
  if (id === 'zfh' || id === 'Zweifamilienhaus') return 'Zweifamilienhaus';
  return 'Einfamilienhaus';
}

function warmwasserTyp(mode) {
  if (mode === 'separat') return 'wwMesswertkWh';
  if (mode === 'enthalten') return 'wwEnthalten';
  return 'wwPauschal20kWhNF';
}

function nutzflaecheOf(building) {
  const n = Number(building.nutzflaeche);
  if (Number.isFinite(n) && n > 0) return n;
  const w = Number(building.wohnflaeche);
  if (Number.isFinite(w) && w > 0) return Math.round(w * 1.2 * 10) / 10;
  return 0;
}

export function hsvFileName(body) {
  const order = String(body.orderNumber || 'auftrag').replace(/[^\w.-]/g, '_');
  const plz = String(body.building?.plz || body.customer?.plz || '').replace(/\D/g, '');
  return `${order}${plz ? `_${plz}` : ''}.hsv`;
}

export function buildHsvContent(body, now = new Date()) {
  const customer = body.customer || {};
  const building = {
    ...(body.building || {}),
  };
  if (!String(building.strasse || '').trim()) building.strasse = customer.strasse || '';
  if (!String(building.hausnummer || '').trim()) {
    building.hausnummer = customer.hausnummer || '';
  }
  if (!String(building.plz || '').trim()) building.plz = customer.plz || '';
  if (!String(building.ort || '').trim()) building.ort = customer.ort || '';

  const consumption = body.consumption || {};
  const calc = body.calculation || {};
  const fuel = FUELS[consumption.energietraeger] || FUELS.erdgas;
  const unit = consumption.unit || (consumption.energietraeger === 'erdgas' ? 'kwh' : 'liter');
  const periods = sortedPeriods(consumption);
  const plz = building.plz || '';
  const street = `${building.strasse || ''} ${building.hausnummer || ''}`.trim();
  const areaN = nutzflaecheOf(building);
  const areaW = Number(building.wohnflaeche) || 0;
  const today = todayGerman(now);
  const isStrom =
    consumption.energietraeger === 'strom' || consumption.energietraeger === 'waermepumpe';
  const isHolz = consumption.energietraeger === 'holz' || consumption.energietraeger === 'pellets';
  const recs = selectedRecommendations(building.recommendations || body.recommendations || []);
  const nPeriods = Math.max(periods.length, 1);
  const customerName =
    customer.name ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.companyName ||
    '';

  const lines = [
    '[Version]',
    kv('Programmversion', 'HS Verbrauchspass 5.2.16'),
    '[Energieausweis]',
    kv('EnEVAusgabe', 'GEG2024'),
    kv('IstNichtwohngebaeude', '0'),
    kv('DatenerfassungDurchEigentuemer', '1'),
    kv('MitZusatzInfos', building.mitZusatzInfos ? '1' : '0'),
    kv('AusstellerZeile1', 'Dieter Spaderna'),
    kv('AusstellerZeile2', 'Energieberater ( HWK ) Schornsteinfegermeister'),
    kv('AusstellerZeile3', 'Ziegelanger 5'),
    kv('AusstellerZeile4', '96250 Ebensfeld'),
    kv('Anlass', building.anlass || 'Vermietung / Verkauf'),
    kv('Ausstellungsdatum', today),
    kv('FirmenlogoAktiviert', '0'),
    kv('FirmenlogoPfad', ''),
    kv('ZusatzlogoAktiviert', '0'),
    kv('ZusatzlogoPfad', ''),
    kv('UnterschriftAktiviert', '0'),
    kv('UnterschriftPfad', ''),
    kv('UnterschriftTransparent', '0'),
    kv('UnterschriftFarbe', '16777215'),
    kv('UnterschriftToleranz', '1'),
    '[DIBt]',
    kv('Registriernummer', ''),
    kv('XML_Senden', 'xsUnbekannt'),
    '[Gebaeude]',
    kv('Gebaeudetyp', gebaeudetypHsv(building.gebaeudetyp)),
    kv('PLZ', plz),
    kv('Ort', building.ort || ''),
    kv('Strasse', street),
    kv('Gebaeudeteil', building.gebaeudeteil || 'Ganzes Gebäude'),
    kv('Bundesland', bundeslandFromPlz(plz)),
    kv('ErneuerbareEnergien', building.erneuerbareEnergien || (isHolz ? 'Heizung' : '')),
    kv('ErneuerbareEnergienA', building.erneuerbareEnergienA || (isHolz ? 'Holz' : '')),
    kv('Lueftung', building.lueftung || 'Fensterlüftung'),
    kv('BaujahrGeb', building.baujahr || ''),
    kv('BaujahrAnlage', building.baujahrHeizung || ''),
    kv('BaujahrKlimaanlage', ''),
    kv(
      'AnzahlWohnungen',
      building.anzahlWohnungen || (gebaeudetypHsv(building.gebaeudetyp) === 'Einfamilienhaus' ? '1' : '')
    ),
    kv('Nutzflaeche', ''),
    kv('WestentlTraeger', ''),
    kv('WestentlTraegerHeizung', fuel.name),
    kv('WestentlTraegerWasser', fuel.name),
    kv('WestentlTraegerAuto', '1'),
    kv('Foto', ''),
    kv('FotoDrehung', '0'),
    kv('FotoRelativ', ''),
    kv('KlimaanlageAnzahl', '0'),
    kv('KlimaanlageFaelligkeit', today),
    kv('Klimaanlage12kWohne', '0'),
    kv('Klimaanlage12kWmit', '0'),
    kv('Klimaanlage70kW', '0'),
    kv('EE24_NutzungHz', '0'),
    kv('EE24_NutzungDHW', '0'),
    kv('EE24_65ProzEERegel', '0'),
    kv('EE24_65ProzEERegelPauschal', '0'),
    kv('EE24_P71b', '0'),
    kv('EE24_P71c', '0'),
    kv('EE24_P71d', '0'),
    kv('EE24_P71e', '0'),
    kv('EE24_P71fg', '0'),
    kv('EE24_P71h_WP', consumption.energietraeger === 'waermepumpe' ? '1' : '0'),
    kv('EE24_P71h_sol', building.warmwasserSolar ? '1' : '0'),
    kv('EE24_P71Abs5', '0'),
    kv('EE24_65ProzEERegelNicht', '1'),
    '[Nichtwohngebauede]',
    kv('Sonderzone1', ''),
    kv('Sonderzone2', ''),
    kv('Sonderzone3', ''),
    kv('Vergleichsgebaeude', ''),
    kv('VglHeizenergie', '0'),
    kv('VglStrom', '0'),
    kv('AnzahlKategorien', '0'),
    kv('ENFausHNF', '0'),
    kv('ENFausNF', '0'),
    kv('ENFausBGF', '0'),
    kv('EingabeFlaeche', '0'),
    kv('TypFlaechenberechnung', '-1'),
    kv('VerschiedeneZeitraueme', '1'),
    kv('StromFuerHeizung', isStrom ? '1' : '0'),
    kv('StromFuerBeleuchtung', '1'),
    kv('StromFuerWarmwasser', '0'),
    kv('StromFuerLueftung', '0'),
    kv('StromFuerKuehlung', '0'),
    kv('StromFuerSonstiges', '1'),
    kv('StromFuerSonstigesBez', ''),
    kv('StromFuerAufzug', '0'),
    kv('FeuchteAnlage', '0'),
    '[Gebauede]',
    kv('ZusatzAuftraggeber', customerName),
    kv('ZusatzAuftragsnummer', body.orderNumber || ''),
    kv('ZusatzObjektnummer', customer.customerNumber || ''),
    kv('ZusatzSonstiges', [customer.email, customer.phone].filter(Boolean).join(' | ')),
    kv('ZusatzNutzflaeche', areaN ? deNum(areaN, 1) : ''),
    '[Druck]',
    kv('MitEmpfehlungen', recs.length ? '1' : '1'),
    kv('MitUnterlagen', '0'),
    '[Modernisierungsempfehlungen]',
    kv('Anzahl', String(recs.length)),
  ];

  recs.forEach((rec, i) => {
    const n = i + 1;
    lines.push(
      kv(`Bauteil${n}`, rec.bauteil),
      kv(`Beschreibung${n}`, rec.beschreibung),
      kv(`Variante1${n}`, '0'),
      kv(`Variante2${n}`, '0'),
      kv(`Modernisierung${n}`, rec.modernisierung),
      kv(`Einzelmassnahme${n}`, rec.einzelmassnahme),
      kv(`Zeit${n}`, '0'),
      kv(`Kosten${n}`, '0')
    );
  });

  lines.push(
    kv('EmpfehlungenMoeglich', '1'),
    kv('WeiteresBlatt', '0'),
    kv(
      'GenauereEmpfehlungen',
      'Dieter Spaderna, Energieberater ( HWK ) Schornsteinfegermeister|Ziegelanger 5, 96250 Ebensfeld'
    ),
    kv('Erlaeuterungen', ''),
    '[Verbrauch3]',
    kv('PLZ', plz || '0'),
    kv('WarmwasserIndividuell', building.warmwasser === 'pauschal' || !building.warmwasser ? '1' : '0'),
    kv('WarmwasserMitSolar', building.warmwasserSolar ? '1' : '0'),
    kv('Systemanzahl', '1'),
    kv('SystemVon0', periods[0] ? periods[0].bounds.from : '30.12.1899'),
    kv('SystemBis0', periods.length ? periods[periods.length - 1].bounds.to : '30.12.1899'),
    kv('SystemBrennstoff0', fuel.brennstoff),
    kv('SystemBrennstoffName0', fuel.name),
    kv('SystemEinheit0', fuel.einheit[unit] || fuel.einheit.kwh || 'kWh Brennwert'),
    kv('SystemEnergieJeEinheit0', fuel.kwhPer[unit] || fuel.kwhPer.kwh || '1'),
    kv('SystemEnergieJeEinheitManuell0', '0'),
    kv('SystemPrimFaktor0', fuel.prim),
    kv('SystemPrimFaktorManuell0', '0'),
    kv('SystemCO2Faktor0', fuel.co2),
    kv('SystemCO2FaktorManuell0', '0'),
    kv('SystemLagerdaten0', ''),
    kv('SystemVerbrauchEKZ0', '0'),
    kv('SystemWarmwassertyp0', warmwasserTyp(building.warmwasser)),
    kv('SystemWarmwasserprozent0', '0,18'),
    kv('SystemWarmwassertemperatur0', '50'),
    kv('SystemKuehlungstyp0', building.gekuehlt === 'ja' ? 'ktEnthalten' : 'ktNichtEnthalten'),
    kv('Periodenanzahl', String(nPeriods))
  );

  for (let i = 0; i < nPeriods; i += 1) {
    const item = periods[i];
    const bounds = item ? item.bounds : { from: '30.12.1899', to: '30.12.1899' };
    const menge =
      !item || item.p.consumption === '' || item.p.consumption == null
        ? '0'
        : deNum(item.p.consumption, 0);
    const ww = item?.p.warmWater ? deNum(item.p.warmWater, 0) : '0';
    const kf = climateOf(body, i);
    const wwPauschal = areaN ? deNum(20 * areaN, 0) : '0';
    lines.push(
      kv(`PeriodeVon${i}`, bounds.from),
      kv(`PeriodeBis${i}`, bounds.to),
      kv(`PeriodeVerbrauchMenge${i}`, menge),
      kv(`PeriodeVerbrauchHZ${i}`, '0'),
      kv(
        `PeriodeVerbrauchWW${i}`,
        building.warmwasser === 'separat' ? ww : building.warmwasser === 'pauschal' || !building.warmwasser ? wwPauschal : '0'
      ),
      kv(`PeriodeVerbrauchWWPro${i}`, '0'),
      kv(`PeriodeVerbrauchWWKubik${i}`, '0'),
      kv(`PeriodeVerbrauchKE${i}`, '0'),
      kv(`PeriodeVerbrauchKF${i}`, kf ? deNum(kf, 4) : '0'),
      kv(`PeriodeVerbrauchHZEKZ${i}`, '0'),
      kv(`PeriodeVerbrauchWWEKZ${i}`, '0'),
      kv(`PeriodeVerbrauchEKZ${i}`, '0'),
      kv(`PeriodeSystem${i}`, '0')
    );
  }

  lines.push(kv('Leerstandanzahl', '0'), kv('LeerstandLeichtbeheizt', '1'), kv('Stromanzahl', String(Math.max(nPeriods, 3))));

  const stromCount = Math.max(nPeriods, 3);
  for (let i = 0; i < stromCount; i += 1) {
    const item = periods[i];
    const y = 2021 + i;
    const bounds = item ? item.bounds : { from: germanDate(y, 1, 1), to: germanDate(y, 12, 31) };
    const kwh = isStrom && item && item.p.consumption != null && item.p.consumption !== '' ? deNum(item.p.consumption, 0) : '0';
    lines.push(
      kv(`StromVon${i}`, bounds.from),
      kv(`StromBis${i}`, bounds.to),
      kv(`StromkWh${i}`, kwh),
      kv(`StromKE${i}`, '0'),
      kv(`StromEKZ${i}`, '0')
    );
  }

  lines.push(
    '[Verbrauch]',
    kv('Nutzflaeche', areaN ? deNum(areaN, 1) : '0'),
    kv('NutzflaecheAusWohnflaeche', '1'),
    kv('Wohnflaeche', areaW ? deNum(areaW, 0) : '0'),
    kv('KellerBeheizt', building.beheizterKeller === 'ja' ? '1' : '0'),
    kv('Gekuehlt', building.gekuehlt === 'ja' ? '1' : '0'),
    kv('FAnteilGekuehlt_WG', '0'),
    '[Ergebnisse]',
    kv('Endenergieverbrauch', calc.endSpecific != null ? deNum(calc.endSpecific, 4) : '0'),
    kv('Primaerenergieverbrauch', calc.primarySpecific != null ? deNum(calc.primarySpecific, 4) : '0'),
    kv('Energieverbrauchsklasse', calc.efficiencyClass || '')
  );

  return `${lines.join('\r\n')}\r\n`;
}
