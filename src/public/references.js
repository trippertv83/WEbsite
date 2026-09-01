/**
 * Referenzen – hier kannst du selbst Texte, Orte und Jahre eintragen.
 *
 * Datei in Wix: Public & Backend → Public → references.js
 * Nach dem Speichern: Site veröffentlichen.
 *
 * Optional im Editor (IDs genau so benennen):
 * - Repeater: #repeaterReferenzen
 *   darin: #refTitel, #refOrt, #refJahr, #refText
 * - oder ein Textfeld: #textReferenzen (zeigt alle Einträge untereinander)
 * - Projektseiten: #refTitel, #refOrt, #refJahr, #refText
 *
 * Einträge mit aktiv: false werden nicht angezeigt.
 */

export const REFERENZEN = [
  {
    id: 'project-2',
    aktiv: true,
    titel: 'Referenz 1 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2024',
    text: 'Kurze Beschreibung: Was wurde gemacht (z. B. Verbrauchsausweis, Energieträger, Besonderheiten).',
  },
  {
    id: 'project-3',
    aktiv: true,
    titel: 'Referenz 2 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2025',
    text: 'Kurze Beschreibung der zweiten Referenz.',
  },
  {
    id: 'project-4',
    aktiv: true,
    titel: 'Referenz 3 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2025',
    text: 'Kurze Beschreibung der dritten Referenz.',
  },
];

export function aktiveReferenzen() {
  return REFERENZEN.filter((item) => item.aktiv !== false);
}

export function referenzById(id) {
  return aktiveReferenzen().find((item) => item.id === id) || null;
}

export function referenzenAlsText() {
  return aktiveReferenzen()
    .map((item) => {
      const kopf = [item.titel, item.ort, item.jahr].filter(Boolean).join(' · ');
      return `${kopf}\n${item.text || ''}`.trim();
    })
    .join('\n\n');
}
