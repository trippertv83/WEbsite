/**
 * Referenzen – nur diese Datei bearbeiten.
 *
 * In Wix: Public & Backend → Public → references.js
 * Danach: Site veröffentlichen.
 *
 * Auf HOME eine HTML-Komponente einfügen, ID: #htmlReferenzen
 * Website-Adresse der Komponente:
 * https://trippertv83.github.io/WEbsite/referenzen.html
 *
 * Texte und Bild-URLs nur hier ändern, dann Site veröffentlichen.
 *
 * Layout bleibt immer gleich. Hier nur Bild-Link und Texte ändern.
 * Bild: in Wix hochladen, Bild anklicken → „Link kopieren“ / Media-URL hier einfügen.
 * Weitere Referenzen: Block unten kopieren und id ändern (ref-4, ref-5, …).
 * aktiv: false blendet einen Eintrag aus.
 */

export const REFERENZEN = [
  {
    id: 'ref-1',
    aktiv: true,
    titel: 'Referenz 1 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2024',
    text: 'Kurze Beschreibung: Was wurde gemacht (z. B. Verbrauchsausweis, Energieträger, Besonderheiten).',
    bild: '',
  },
  {
    id: 'ref-2',
    aktiv: true,
    titel: 'Referenz 2 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2025',
    text: 'Kurze Beschreibung der zweiten Referenz.',
    bild: '',
  },
  {
    id: 'ref-3',
    aktiv: true,
    titel: 'Referenz 3 – Titel hier eintragen',
    ort: 'Ort / Gebäudeart',
    jahr: '2025',
    text: 'Kurze Beschreibung der dritten Referenz.',
    bild: '',
  },
];

export function aktiveReferenzen() {
  return REFERENZEN.filter((item) => item.aktiv !== false);
}
