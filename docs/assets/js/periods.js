/**
 * Abrechnungsperioden: Startmonat + Startjahr → drei aufeinanderfolgende Zeiträume.
 */

export const MONTHS_DE = [
  { value: 1, label: 'Januar', short: 'Jan' },
  { value: 2, label: 'Februar', short: 'Feb' },
  { value: 3, label: 'März', short: 'Mrz' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'Mai', short: 'Mai' },
  { value: 6, label: 'Juni', short: 'Jun' },
  { value: 7, label: 'Juli', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'Oktober', short: 'Okt' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'Dezember', short: 'Dez' },
];

export function periodOptionLabel(startMonth) {
  const start = MONTHS_DE.find((m) => m.value === startMonth);
  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const end = MONTHS_DE.find((m) => m.value === endMonth);
  if (startMonth === 1) return 'Jan–Dez';
  return `${start.short}–${end.short}`;
}

function addMonths(year, month, delta) {
  const index = year * 12 + (month - 1) + delta;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return { year: y, month: m };
}

export function formatPeriodLabel(from, to) {
  const fromM = MONTHS_DE.find((m) => m.value === from.month).short;
  const toM = MONTHS_DE.find((m) => m.value === to.month).short;
  return `${fromM} ${from.year} – ${toM} ${to.year}`;
}

/**
 * Erzeugt drei Perioden: startYear ist das erste (älteste) Abrechnungsjahr.
 * Anzeige jüngste Periode zuerst (wie auf dem Ausweis üblich).
 */
export function buildThreePeriods(startYear, startMonth) {
  const periods = [];
  for (let i = 2; i >= 0; i -= 1) {
    const from = addMonths(startYear, startMonth, 12 * i);
    const to = addMonths(from.year, from.month, 11);
    periods.push({
      id: `p${i}`,
      from,
      to,
      label: formatPeriodLabel(from, to),
      consumption: '',
      vacancy: '0',
      warmWater: '',
    });
  }
  return periods;
}

export function allPeriodOptions() {
  return MONTHS_DE.map((m) => ({
    value: m.value,
    label: periodOptionLabel(m.value),
  }));
}
