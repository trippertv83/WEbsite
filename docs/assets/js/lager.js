/**
 * Verbrauchsermittlung für lagerfähige Brennstoffe (wie HS Verbrauchspass).
 * Verbrauch = Anfangsbestand + Zukäufe − Endbestand.
 */

export const STORABLE_CARRIERS = new Set(['heizoel', 'holz', 'pellets']);

export function isStorableCarrier(id) {
  return STORABLE_CARRIERS.has(id);
}

export function emptyLager() {
  const end = new Date();
  const start = new Date(end.getFullYear() - 3, end.getMonth(), end.getDate());
  return {
    anfangDatum: isoDate(start),
    anfangBestand: '',
    endeDatum: isoDate(end),
    endeBestand: '',
    zukaeufe: [
      { datum: '', menge: '' },
      { datum: '', menge: '' },
      { datum: '', menge: '' },
    ],
    tankform: 'rechteck',
    maxLager: '1000',
    breite: '100',
    tiefe: '100',
    hoehe: '100',
    durchmesser: '100',
    laenge: '100',
    fuellAnfang: '',
    fuellEnde: '',
  };
}

export function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIso(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function germanDate(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export function yearsBetween(from, to) {
  if (!from || !to) return 0;
  return (to.getTime() - from.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function num(value) {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function lagerConsumption(lager = {}) {
  const anfang = num(lager.anfangBestand);
  const ende = num(lager.endeBestand);
  const zukauf = (lager.zukaeufe || []).reduce((sum, row) => sum + num(row.menge), 0);
  return anfang + zukauf - ende;
}

export function tankVolumeLiters(lager = {}) {
  const form = lager.tankform || 'rechteck';
  if (form === 'rechteck') {
    return (num(lager.breite) * num(lager.tiefe) * num(lager.hoehe)) / 1000;
  }
  if (form === 'stehend') {
    const r = num(lager.durchmesser) / 2;
    return (Math.PI * r * r * num(lager.hoehe)) / 1000;
  }
  if (form === 'liegend') {
    const r = num(lager.durchmesser) / 2;
    return (Math.PI * r * r * num(lager.laenge)) / 1000;
  }
  const r = num(lager.durchmesser) / 2;
  return ((4 / 3) * Math.PI * r * r * r) / 1000;
}

export function fillVolumeLiters(lager = {}, fillCm) {
  const f = num(fillCm);
  if (f <= 0) return 0;
  const form = lager.tankform || 'rechteck';
  if (form === 'rechteck') {
    return (num(lager.breite) * num(lager.tiefe) * f) / 1000;
  }
  if (form === 'stehend') {
    const r = num(lager.durchmesser) / 2;
    return (Math.PI * r * r * f) / 1000;
  }
  if (form === 'liegend') {
    return horizontalCylinderLiters(num(lager.durchmesser), num(lager.laenge), f);
  }
  return sphericalCapLiters(num(lager.durchmesser), f);
}

function horizontalCylinderLiters(diameterCm, lengthCm, fillCm) {
  const r = diameterCm / 2;
  const h = Math.min(Math.max(fillCm, 0), diameterCm);
  if (h <= 0) return 0;
  if (h >= diameterCm) return (Math.PI * r * r * lengthCm) / 1000;
  const area =
    r * r * Math.acos((r - h) / r) - (r - h) * Math.sqrt(Math.max(0, 2 * r * h - h * h));
  return (area * lengthCm) / 1000;
}

function sphericalCapLiters(diameterCm, fillCm) {
  const r = diameterCm / 2;
  const h = Math.min(Math.max(fillCm, 0), diameterCm);
  return (Math.PI * h * h * (3 * r - h)) / 3 / 1000;
}

export function litersToStock(liters, carrierId, unitId) {
  if (unitId === 'liter' || unitId === 'kwh') return liters;
  if (unitId === 'kg' || carrierId === 'pellets') return liters * 0.65;
  if (unitId === 't') return (liters * 0.65) / 1000;
  if (unitId === 'rm') return liters / 1000;
  return liters;
}

export function unitLabel(unitId) {
  if (unitId === 'rm') return 'rm';
  if (unitId === 't') return 't';
  if (unitId === 'liter') return 'Liter';
  return 'kg';
}

export function encodeLagerHsv(lager = {}) {
  const parts = [
    `A=${germanDate(lager.anfangDatum)};${num(lager.anfangBestand)}`,
  ];
  (lager.zukaeufe || []).forEach((row) => {
    if (!row.datum && !num(row.menge)) return;
    parts.push(`Z=${germanDate(row.datum) || '-'};${num(row.menge)}`);
  });
  parts.push(`E=${germanDate(lager.endeDatum)};${num(lager.endeBestand)}`);
  parts.push(
    `T=${lager.tankform || 'rechteck'};${num(lager.breite)};${num(lager.tiefe)};${num(lager.hoehe)};${num(lager.durchmesser)};${num(lager.laenge)}`
  );
  return parts.join('|');
}

export function periodsFromLager(lager, totalConsumption) {
  const from = parseIso(lager.anfangDatum);
  const to = parseIso(lager.endeDatum);
  if (!from || !to || to <= from) return [];
  const slices = [];
  for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
    const start = year === from.getFullYear() ? from : new Date(year, 0, 1);
    const end = year === to.getFullYear() ? to : new Date(year, 11, 31);
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    slices.push({
      from: { year: start.getFullYear(), month: start.getMonth() + 1 },
      to: { year: end.getFullYear(), month: end.getMonth() + 1 },
      days,
    });
  }
  const allDays = slices.reduce((sum, s) => sum + s.days, 0) || 1;
  return slices.map((slice, index) => ({
    id: `lager-${index}`,
    from: slice.from,
    to: slice.to,
    label: `${String(slice.from.month).padStart(2, '0')}.${slice.from.year} – ${String(slice.to.month).padStart(2, '0')}.${slice.to.year}`,
    consumption: String(Math.round(((totalConsumption * slice.days) / allDays) * 100) / 100),
    vacancy: '0',
    warmWater: '',
  }));
}

export function lagerErrors(lager = {}) {
  const errors = {};
  const from = parseIso(lager.anfangDatum);
  const to = parseIso(lager.endeDatum);
  if (!from) errors.anfangDatum = 'Bitte das Datum des Anfangsbestands angeben.';
  if (!to) errors.endeDatum = 'Bitte das Datum des Endbestands angeben.';
  if (from && to && yearsBetween(from, to) < 3) {
    errors.endeDatum = 'Zwischen Anfangs- und Endbestand müssen mindestens drei Jahre liegen.';
  }
  if (num(lager.anfangBestand) < 0) errors.anfangBestand = 'Anfangsbestand prüfen.';
  if (num(lager.endeBestand) < 0) errors.endeBestand = 'Endbestand prüfen.';
  if (lagerConsumption(lager) <= 0) {
    errors.anfangBestand = 'Verbrauch muss größer 0 sein (Anfangsbestand + Zukäufe − Endbestand).';
  }
  return errors;
}
