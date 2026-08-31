/**
 * Berechnung Verbrauchsausweis Wohngebäude.
 *
 * Architektur:
 * - Endenergie aus drei Perioden, Leerstandskorrektur
 * - applyClimateFactor() mit DWD-Klimafaktoren je Abrechnungsperiode
 * - Primärenergie- und CO2-Faktoren je Energieträger (GEG-orientiert)
 * - Effizienzklasse nach spezifischer Primärenergie
 *
 * Keine Netz- oder Secret-Zugriffe.
 */

import { convertToKwh, getCarrier } from './units.js';

/** Primärenergiefaktoren (orientiert an GEG, später konfigurierbar) */
export const PRIMARY_FACTORS = {
  erdgas: 1.1,
  heizoel: 1.1,
  fernwaerme: 0.7,
  strom: 1.8,
  holz: 0.2,
  pellets: 0.2,
  waermepumpe: 1.8,
};

/** kg CO2-Äquivalent je kWh Endenergie */
export const CO2_FACTORS = {
  erdgas: 0.202,
  heizoel: 0.266,
  fernwaerme: 0.2,
  strom: 0.38,
  holz: 0.027,
  pellets: 0.027,
  waermepumpe: 0.38,
};

/**
 * Klassengrenzen in kWh/(m²·a) Primärenergie.
 * Skala A+ … H analog zum Energieband.
 */
export const CLASS_BANDS = [
  { className: 'A+', min: 0, max: 30 },
  { className: 'A', min: 30, max: 50 },
  { className: 'B', min: 50, max: 75 },
  { className: 'C', min: 75, max: 100 },
  { className: 'D', min: 100, max: 130 },
  { className: 'E', min: 130, max: 160 },
  { className: 'F', min: 160, max: 200 },
  { className: 'G', min: 200, max: 250 },
  { className: 'H', min: 250, max: Infinity },
];

/** Standard-Warmwasserzuschlag kWh/(m²·a), wenn WW separat/unbekannt */
const DEFAULT_WW_SPECIFIC = 12.5;

export function applyClimateFactor(kwh, climateFactor = 1) {
  return kwh * climateFactor;
}

export function correctVacancy(kwh, vacancyPercent) {
  const v = Number(vacancyPercent) / 100;
  if (v >= 1) throw new Error('Leerstand muss unter 100 % liegen.');
  return kwh / (1 - v);
}

export function getEfficiencyClass(primarySpecific) {
  const band = CLASS_BANDS.find(
    (b) => primarySpecific >= b.min && primarySpecific < b.max
  );
  return band ? band.className : 'H';
}

/**
 * Position 0–100 auf dem Energieband (A+ links, H rechts).
 * A+…G linear 0–250 kWh, H ab 250 bis 400 gekappt.
 */
export function bandPositionPercent(primarySpecific) {
  const cap = 400;
  const value = Math.min(Math.max(primarySpecific, 0), cap);
  return (value / cap) * 100;
}

function warmWaterAddition(warmwasserMode, area, periods) {
  if (warmwasserMode === 'enthalten') return 0;
  if (warmwasserMode === 'pauschal') return 20 * area;
  const hasManual = periods.some((p) => Number(p.warmWater) > 0);
  if (hasManual) {
    const sum = periods.reduce((acc, p) => acc + Number(p.warmWater || 0), 0);
    return sum / periods.length;
  }
  return DEFAULT_WW_SPECIFIC * area;
}

export function calculateCertificate({
  building,
  consumption,
  climateFactor = 1,
  climateFactors,
}) {
  const area = Number(building.nutzflaeche) || Number(building.wohnflaeche);
  if (!area || area <= 0) throw new Error('Nutz- oder Wohnfläche fehlt.');
  const carrier = getCarrier(consumption.energietraeger);
  if (!carrier) throw new Error('Energieträger fehlt.');

  const yearly = consumption.periods.map((period, index) => {
    const raw = convertToKwh(
      Number(period.consumption),
      consumption.energietraeger,
      consumption.unit
    );
    const vacantCorrected = correctVacancy(raw, period.vacancy);
    const kf = Number(
      climateFactors?.[index] ?? period.climateFactor ?? climateFactor
    ) || 1;
    const climateCorrected = applyClimateFactor(vacantCorrected, kf);
    return {
      label: period.label,
      kwh: climateCorrected,
      climateFactor: kf,
    };
  });

  const avgEnd = yearly.reduce((acc, y) => acc + y.kwh, 0) / yearly.length;
  const ww = warmWaterAddition(building.warmwasser, area, consumption.periods);
  const endEnergy = avgEnd + ww;
  const peFactor = PRIMARY_FACTORS[consumption.energietraeger];
  const co2Factor = CO2_FACTORS[consumption.energietraeger];
  const primaryEnergy = endEnergy * peFactor;
  const co2 = endEnergy * co2Factor;
  const endSpecific = endEnergy / area;
  const primarySpecific = primaryEnergy / area;
  const co2Specific = co2 / area;
  const efficiencyClass = getEfficiencyClass(primarySpecific);

  return {
    area,
    carrierId: consumption.energietraeger,
    carrierLabel: carrier.label,
    unit: consumption.unit,
    climateFactor: climateFactors
      ? climateFactors.reduce((a, b) => a + Number(b), 0) / climateFactors.length
      : climateFactor,
    climateFactors: yearly.map((y) => y.climateFactor),
    yearly,
    warmWaterKwh: ww,
    endEnergy,
    primaryEnergy,
    co2,
    endSpecific,
    primarySpecific,
    co2Specific,
    efficiencyClass,
    peFactor,
    co2Factor,
    bandPercent: bandPositionPercent(primarySpecific),
  };
}
