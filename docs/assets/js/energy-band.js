/**
 * Grafisches Energieband A+ bis H mit animiertem Pfeil.
 */

import { formatDeNumber } from './utils.js';
import { CLASS_BANDS } from './calculation.js';

export function renderEnergyPreview(root, result, building) {
  const address = `${building.strasse} ${building.hausnummer}, ${building.plz} ${building.ort}`;
  root.innerHTML = `
    <article class="certificate" aria-label="Vorschau Verbrauchsausweis">
      <header class="certificate__top">
        <div>
          <h2 style="margin:0 0 0.35rem">Verbrauchsausweis Wohngebäude</h2>
          <p class="certificate__meta">${address}</p>
          <p class="certificate__meta">Wohnfläche ${formatDeNumber(result.area, 1)} m² · ${result.carrierLabel}</p>
        </div>
        <div class="certificate__seal" aria-hidden="true">${result.efficiencyClass}</div>
      </header>
      <div class="band-wrap">
        <p class="field__hint">Energieband Primärenergie in kWh/(m²·a)</p>
        <div class="band">
          <div class="band__arrow" id="energy-arrow">
            <div class="band__arrow-mark">${result.efficiencyClass}</div>
          </div>
          <div class="band__scale" aria-hidden="true">
            ${CLASS_BANDS.map(() => '<span></span>').join('')}
          </div>
          <div class="band__labels">
            ${CLASS_BANDS.map((b) => `<span>${b.className}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="kpi-row">
        <div class="kpi">
          <strong>${formatDeNumber(result.endSpecific, 1)}</strong>
          <span>Endenergie kWh/(m²·a)</span>
        </div>
        <div class="kpi">
          <strong>${formatDeNumber(result.primarySpecific, 1)}</strong>
          <span>Primärenergie kWh/(m²·a)</span>
        </div>
        <div class="kpi">
          <strong>${formatDeNumber(result.co2Specific, 1)}</strong>
          <span>CO₂ kg/(m²·a)</span>
        </div>
        <div class="kpi">
          <strong>${result.efficiencyClass}</strong>
          <span>Effizienzklasse</span>
        </div>
      </div>
    </article>
  `;

  requestAnimationFrame(() => {
    const arrow = root.querySelector('#energy-arrow');
    if (arrow) arrow.style.left = `${result.bandPercent}%`;
  });
}
