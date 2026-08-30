/**
 * Energieträger und Einheitenumrechnung nach kWh.
 * Heizwerte sind branchenübliche Standardwerte für Verbrauchsausweise
 * und später über Klimafaktoren / regionale Heizwerte erweiterbar.
 */

export const ENERGY_CARRIERS = [
  {
    id: 'erdgas',
    label: 'Erdgas',
    units: [
      { id: 'kwh', label: 'kWh', toKwh: 1 },
      { id: 'm3', label: 'm³', toKwh: 10.0 },
    ],
  },
  {
    id: 'heizoel',
    label: 'Heizöl',
    units: [
      { id: 'liter', label: 'Liter', toKwh: 10.0 },
      { id: 'kwh', label: 'kWh', toKwh: 1 },
    ],
  },
  {
    id: 'fernwaerme',
    label: 'Fernwärme',
    units: [{ id: 'kwh', label: 'kWh', toKwh: 1 }],
  },
  {
    id: 'strom',
    label: 'Strom',
    units: [{ id: 'kwh', label: 'kWh', toKwh: 1 }],
  },
  {
    id: 'holz',
    label: 'Holz',
    units: [
      { id: 'rm', label: 'Raummeter', toKwh: 1500 },
      { id: 'kwh', label: 'kWh', toKwh: 1 },
    ],
  },
  {
    id: 'pellets',
    label: 'Pellets',
    units: [
      { id: 'kg', label: 'kg', toKwh: 4.8 },
      { id: 't', label: 'Tonnen', toKwh: 4800 },
      { id: 'kwh', label: 'kWh', toKwh: 1 },
    ],
  },
  {
    id: 'waermepumpe',
    label: 'Wärmepumpe',
    units: [{ id: 'kwh', label: 'kWh (Strom)', toKwh: 1 }],
  },
];

export function getCarrier(id) {
  return ENERGY_CARRIERS.find((item) => item.id === id) || null;
}

export function convertToKwh(value, carrierId, unitId) {
  const carrier = getCarrier(carrierId);
  if (!carrier) throw new Error('Unbekannter Energieträger');
  const unit = carrier.units.find((u) => u.id === unitId);
  if (!unit) throw new Error('Unbekannte Einheit');
  return Number(value) * unit.toKwh;
}
