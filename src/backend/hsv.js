/**
 * HS Verbrauchspass 5.2.11 – exakt das Schlüssel-Layout der Desktop-Software.
 * Kundendaten werden nur in vorhandene Felder geschrieben, keine Extra-Keys.
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

/** Leere Projektdatei aus HS Verbrauchspass 5.2.11 – Reihenfolge und Keys unverändert. */
export const HSV_TEMPLATE = `[Version]
Programmversion=HS Verbrauchspass 5.2.11
[Energieausweis]
EnEVAusgabe=GEG2024
IstNichtwohngebaeude=0
DatenerfassungDurchEigentuemer=0
MitZusatzInfos=0
AusstellerZeile1=Dieter Spaderna
AusstellerZeile2=Schornsteinfegermeister
AusstellerZeile3=Ziegelanger 5
AusstellerZeile4=96250 Ebensfeld
Anlass=
Ausstellungsdatum=30.12.1899
FirmenlogoAktiviert=0
FirmenlogoPfad=
ZusatzlogoAktiviert=0
ZusatzlogoPfad=
UnterschriftAktiviert=0
UnterschriftPfad=
UnterschriftTransparent=0
UnterschriftFarbe=16777215
UnterschriftToleranz=1
[DIBt]
Registriernummer=
XML_Senden=xsUnbekannt
[Gebaeude]
Gebaeudetyp=
PLZ=96250
Ort=Ebenfeld
Strasse=gasmoasn
Gebaeudeteil=
Bundesland=- Bundesland auswählen -
ErneuerbareEnergien=
ErneuerbareEnergienA=
Lueftung=
BaujahrGeb=
BaujahrAnlage=
BaujahrKlimaanlage=
AnzahlWohnungen=
Nutzflaeche=
WestentlTraeger=
WestentlTraegerHeizung=
WestentlTraegerWasser=
WestentlTraegerAuto=1
Foto=
FotoDrehung=0
FotoRelativ=
KlimaanlageAnzahl=0
KlimaanlageFaelligkeit=28.08.2026
Klimaanlage12kWohne=0
Klimaanlage12kWmit=0
Klimaanlage70kW=0
EE24_NutzungHz=0
EE24_NutzungDHW=0
EE24_65ProzEERegel=0
EE24_65ProzEERegelPauschal=0
EE24_P71b=0
EE24_P71c=0
EE24_P71d=0
EE24_P71e=0
EE24_P71fg=0
EE24_P71h_WP=0
EE24_P71h_sol=0
EE24_P71Abs5=0
EE24_65ProzEERegelNicht=1
[Nichtwohngebauede]
Sonderzone1=
Sonderzone2=
Sonderzone3=
Vergleichsgebaeude=
VglHeizenergie=0
VglStrom=0
AnzahlKategorien=0
ENFausHNF=0
ENFausNF=0
ENFausBGF=0
EingabeFlaeche=0
TypFlaechenberechnung=-1
VerschiedeneZeitraueme=1
StromFuerHeizung=0
StromFuerBeleuchtung=1
StromFuerWarmwasser=0
StromFuerLueftung=0
StromFuerKuehlung=0
StromFuerSonstiges=1
StromFuerSonstigesBez=
StromFuerAufzug=0
FeuchteAnlage=0
[Gebauede]
ZusatzAuftraggeber=
ZusatzAuftragsnummer=
ZusatzObjektnummer=
ZusatzSonstiges=
ZusatzNutzflaeche=
[Druck]
MitEmpfehlungen=1
MitUnterlagen=0
[Modernisierungsempfehlungen]
Anzahl=0
EmpfehlungenMoeglich=1
WeiteresBlatt=0
GenauereEmpfehlungen=Dieter Spaderna, Schornsteinfegermeister|Ziegelanger 5, 96250 Ebensfeld
Erlaeuterungen=
[Verbrauch3]
PLZ=0
WarmwasserIndividuell=0
WarmwasserMitSolar=0
Systemanzahl=1
SystemVon0=30.12.1899
SystemBis0=30.12.1899
SystemBrennstoff0=Heizöl EL
SystemBrennstoffName0=Heizöl
SystemEinheit0=Liter
SystemEnergieJeEinheit0=10,08
SystemEnergieJeEinheitManuell0=0
SystemPrimFaktor0=1,1
SystemPrimFaktorManuell0=0
SystemCO2Faktor0=0,31
SystemCO2FaktorManuell0=0
SystemLagerdaten0=
SystemVerbrauchEKZ0=0
SystemWarmwassertyp0=wwMesswertkWh
SystemWarmwasserprozent0=0,18
SystemWarmwassertemperatur0=50
SystemKuehlungstyp0=ktNichtEnthalten
Periodenanzahl=3
PeriodeVon0=01.01.2023
PeriodeBis0=31.12.2023
PeriodeVerbrauchMenge0=0
PeriodeVerbrauchHZ0=0
PeriodeVerbrauchWW0=0
PeriodeVerbrauchWWPro0=0
PeriodeVerbrauchWWKubik0=0
PeriodeVerbrauchKE0=0
PeriodeVerbrauchKF0=0
PeriodeVerbrauchHZEKZ0=0
PeriodeVerbrauchWWEKZ0=0
PeriodeVerbrauchEKZ0=0
PeriodeSystem0=0
PeriodeVon1=01.01.2024
PeriodeBis1=31.12.2024
PeriodeVerbrauchMenge1=0
PeriodeVerbrauchHZ1=0
PeriodeVerbrauchWW1=0
PeriodeVerbrauchWWPro1=0
PeriodeVerbrauchWWKubik1=0
PeriodeVerbrauchKE1=0
PeriodeVerbrauchKF1=0
PeriodeVerbrauchHZEKZ1=0
PeriodeVerbrauchWWEKZ1=0
PeriodeVerbrauchEKZ1=0
PeriodeSystem1=0
PeriodeVon2=01.01.2025
PeriodeBis2=31.12.2025
PeriodeVerbrauchMenge2=0
PeriodeVerbrauchHZ2=0
PeriodeVerbrauchWW2=0
PeriodeVerbrauchWWPro2=0
PeriodeVerbrauchWWKubik2=0
PeriodeVerbrauchKE2=0
PeriodeVerbrauchKF2=0
PeriodeVerbrauchHZEKZ2=0
PeriodeVerbrauchWWEKZ2=0
PeriodeVerbrauchEKZ2=0
PeriodeSystem2=0
Leerstandanzahl=0
LeerstandLeichtbeheizt=1
Stromanzahl=3
StromVon0=01.01.2023
StromBis0=31.12.2023
StromkWh0=0
StromKE0=0
StromEKZ0=0
StromVon1=01.01.2024
StromBis1=31.12.2024
StromkWh1=0
StromKE1=0
StromEKZ1=0
StromVon2=01.01.2025
StromBis2=31.12.2025
StromkWh2=0
StromKE2=0
StromEKZ2=0
[Verbrauch]
Nutzflaeche=1
NutzflaecheAusWohnflaeche=0
Wohnflaeche=0
KellerBeheizt=0
Gekuehlt=0
FAnteilGekuehlt_WG=0`;

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

function iniValue(value) {
  return String(value ?? '').replace(/[\r\n]/g, ' ').trim();
}

function parseTemplate(text) {
  return text.split(/\r?\n/).map((line) => {
    if (!line || line.startsWith('[')) return { raw: line };
    const eq = line.indexOf('=');
    if (eq < 0) return { raw: line };
    return { key: line.slice(0, eq), value: line.slice(eq + 1) };
  });
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

export function hsvFileName(body) {
  const order = String(body.orderNumber || 'auftrag').replace(/[^\w.-]/g, '_');
  const plz = String(body.building?.plz || body.customer?.plz || '').replace(/\D/g, '');
  return `${order}${plz ? `_${plz}` : ''}.hsv`;
}

export function hsvTemplateKeys() {
  return parseTemplate(HSV_TEMPLATE)
    .filter((row) => row.key)
    .map((row) => row.key);
}

export function buildHsvContent(body) {
  const building = {
    ...(body.building || {}),
  };
  const customer = body.customer || {};
  if (!String(building.strasse || '').trim()) building.strasse = customer.strasse || '';
  if (!String(building.hausnummer || '').trim()) building.hausnummer = customer.hausnummer || '';
  if (!String(building.plz || '').trim()) building.plz = customer.plz || '';
  if (!String(building.ort || '').trim()) building.ort = customer.ort || '';
  const consumption = body.consumption || {};
  const fuel = FUELS[consumption.energietraeger] || FUELS.heizoel;
  const unit = consumption.unit || 'liter';
  const periods = sortedPeriods(consumption);
  const plz = building.plz || customer.plz || '';
  const street = `${building.strasse || ''} ${building.hausnummer || ''}`.trim();
  const area =
    building.wohnflaeche === '' || building.wohnflaeche == null
      ? ''
      : deNum(building.wohnflaeche, 0);
  const customerName =
    customer.name ||
    [customer.firstName, customer.lastName].filter(Boolean).join(' ') ||
    customer.companyName ||
    '';
  const isStrom =
    consumption.energietraeger === 'strom' || consumption.energietraeger === 'waermepumpe';

  const bySection = {
    Gebaeude: {
      PLZ: plz,
      Ort: building.ort || customer.ort || '',
      Strasse: street,
      Bundesland: bundeslandFromPlz(plz),
      BaujahrGeb: building.baujahr || '',
      BaujahrAnlage: building.baujahrHeizung || '',
      AnzahlWohnungen: building.gebaeudetyp === 'efh' ? '1' : '',
      Nutzflaeche: area,
      WestentlTraeger: fuel.name,
      WestentlTraegerHeizung: fuel.name,
      EE24_P71h_WP: consumption.energietraeger === 'waermepumpe' ? '1' : '0',
    },
    Nichtwohngebauede: {
      StromFuerHeizung: isStrom ? '1' : '0',
    },
    Gebauede: {
      ZusatzAuftraggeber: customerName,
      ZusatzAuftragsnummer: body.orderNumber || '',
      ZusatzObjektnummer: customer.customerNumber || '',
      ZusatzSonstiges: [customer.email, customer.phone].filter(Boolean).join(' | '),
      ZusatzNutzflaeche: area,
    },
    Verbrauch3: {
      WarmwasserIndividuell: building.warmwasser === 'separat' ? '1' : '0',
      SystemBrennstoff0: fuel.brennstoff,
      SystemBrennstoffName0: fuel.name,
      SystemEinheit0: fuel.einheit[unit] || fuel.einheit.kwh || 'Liter',
      SystemEnergieJeEinheit0: fuel.kwhPer[unit] || fuel.kwhPer.kwh || '1',
      SystemPrimFaktor0: fuel.prim,
      SystemCO2Faktor0: fuel.co2,
    },
    Verbrauch: {
      Wohnflaeche: area || '0',
      KellerBeheizt: building.beheizterKeller === 'ja' ? '1' : '0',
    },
  };

  if (periods.length) {
    bySection.Verbrauch3.SystemVon0 = periods[0].bounds.from;
    bySection.Verbrauch3.SystemBis0 = periods[periods.length - 1].bounds.to;
  }

  for (let i = 0; i < 3; i += 1) {
    const item = periods[i];
    if (!item) continue;
    const menge =
      item.p.consumption === '' || item.p.consumption == null
        ? '0'
        : deNum(item.p.consumption, 0);
    const ww = item.p.warmWater ? deNum(item.p.warmWater, 0) : '0';
    const kf = climateOf(body, i);
    bySection.Verbrauch3[`PeriodeVon${i}`] = item.bounds.from;
    bySection.Verbrauch3[`PeriodeBis${i}`] = item.bounds.to;
    bySection.Verbrauch3[`PeriodeVerbrauchMenge${i}`] = menge;
    bySection.Verbrauch3[`PeriodeVerbrauchWW${i}`] =
      building.warmwasser === 'separat' ? ww : '0';
    bySection.Verbrauch3[`PeriodeVerbrauchKF${i}`] = kf ? deNum(kf, 3) : '0';
    bySection.Verbrauch3[`StromVon${i}`] = item.bounds.from;
    bySection.Verbrauch3[`StromBis${i}`] = item.bounds.to;
    bySection.Verbrauch3[`StromkWh${i}`] = isStrom ? menge : '0';
  }

  let section = '';
  const lines = parseTemplate(HSV_TEMPLATE).map((row) => {
    if (row.raw && row.raw.startsWith('[')) {
      section = row.raw.slice(1, -1);
      return row.raw;
    }
    if (!row.key) return row.raw;
    const overlay = bySection[section];
    const next =
      overlay && Object.prototype.hasOwnProperty.call(overlay, row.key)
        ? overlay[row.key]
        : row.value;
    return `${row.key}=${iniValue(next)}`;
  });

  return `${lines.join('\r\n')}\r\n`;
}
