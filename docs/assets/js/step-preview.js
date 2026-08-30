/**
 * Schritt 5: Grafische Vorschau.
 */

import { getState } from './state.js';
import { qs } from './utils.js';
import { renderEnergyPreview } from './energy-band.js';
import { runCalculation } from './step-calculation.js';

export function renderPreview() {
  const result = getState().calculation || runCalculation();
  renderEnergyPreview(qs('#preview-root'), result, getState().building);
}
