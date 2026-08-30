/**
 * Schritt 4: Kennwerte anzeigen.
 */

import { calculateCertificate } from './calculation.js';
import { getState, setCalculation } from './state.js';
import { formatDeNumber, qs } from './utils.js';

export function runCalculation() {
  const { building, consumption } = getState();
  const result = calculateCertificate({ building, consumption, climateFactor: 1 });
  setCalculation(result);
  return result;
}

export function renderCalculation() {
  const result = runCalculation();
  qs('#calculation-root').innerHTML = `
    <p class="notice">
      Klimafaktor aktuell 1,00 (ohne Witterungsbereinigung). Die Schnittstelle
      <code>applyClimateFactor</code> kann regionale Faktoren aufnehmen.
    </p>
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
