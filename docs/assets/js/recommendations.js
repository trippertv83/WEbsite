/**
 * Modernisierungsempfehlungen wie in HS Verbrauchspass (lukas.hsv).
 */

export const RECOMMENDATION_OPTIONS = [
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

export function selectedRecommendations(ids = []) {
  const set = new Set(ids);
  return RECOMMENDATION_OPTIONS.filter((item) => set.has(item.id));
}
