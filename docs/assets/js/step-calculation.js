/**
 * Schritt 4: Kennwerte anzeigen.
 */

import { calculateCertificate } from './calculation.js';
import { lookupClimateFactors } from './climate-factors.js';
import { getState, setCalculation } from './state.js';
import { formatDeNumber, qs } from './utils.js';

export async function runCalculation() {
  const { building, consumption } = getState();
  const lookups = await lookupClimateFactors(building.plz, consumption.periods);
  const climateFactors = lookups.map((item) => item.factor);
  const result = calculateCertificate({
    building,
    consumption,
    climateFactors,
  });
  result.climateLookups = lookups;
  setCalculation(result);
  return result;
}

export async function renderCalculation() {
  const root = qs('#calculation-root');
  root.innerHTML = '<p class="notice">Klimafaktoren werden vom DWD geladen…</p>';
  const result = await runCalculation();
  const rows = (result.climateLookups || [])
    .map((item, index) => {
      const label = result.yearly[index]?.label || `Periode ${index + 1}`;
      const src = item.source === 'dwd' ? 'DWD' : 'ohne Treffer, Faktor 1,00';
      return `<li>${label}: ${formatDeNumber(item.factor, 2)} (${src})</li>`;
    })
    .join('');
  root.innerHTML = `
    <p class="notice">
      Witterungsbereinigung mit den offiziellen Klimakorrekturfaktoren des DWD
      (GEG, PLZ-scharf, je 12-Monats-Fenster).
    </p>
    <ul class="field__hint">${rows}</ul>
    <div class="kpi-row" style="padding:1.5rem 0 0">
      <div class="kpi">
        <strong>${formatDeNumber(result.endEnergy, 0)}</strong>
        <span>Endenergie kWh/a</span>
      </div>
      <div class="kpi">
        <strong>${formatDeNumber(result.primaryEnergy, 0)}</strong>
        <span>Primärenergie kWh/a</span>
      </div>
      <div class="kpi">
        <strong>${formatDeNumber(result.co2, 0)}</strong>
        <span>CO₂ kg/a</span>
      </div>
      <div class="kpi">
        <strong>${result.efficiencyClass}</strong>
        <span>Klasse (Primärenergie)</span>
      </div>
    </div>
    <p class="field__hint" style="margin-top:1rem">
      Spezifisch: ${formatDeNumber(result.endSpecific, 1)} kWh/(m²·a) Endenergie,
      ${formatDeNumber(result.primarySpecific, 1)} kWh/(m²·a) Primärenergie
      (Faktor ${formatDeNumber(result.peFactor, 2)}).
    </p>
  `;
}
