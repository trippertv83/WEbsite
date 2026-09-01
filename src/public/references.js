/**
 * Referenzen – nur diese Datei bearbeiten.
 *
 * In Wix: Public & Backend → Public → references.js
 * Danach: Site veröffentlichen.
 *
 * Auf HOME eine HTML-Komponente einfügen, ID: #htmlReferenzen
 * Website-Adresse der Komponente:
 * https://trippertv83.github.io/WEbsite/referenzen.html
 * Höhe der Komponente: ca. 780 px
 *
 * Layout bleibt immer gleich. Hier nur Texte und Bild-Links ändern.
 *
 * Titelzeile:  [jahr in Blau]  kategorie  titel
 * kategorie: Neubau / Sanierung / Denkmal / Forschung / Öffentlich
 *
 * Bild: GitHub-Link (docs/referenzen/…) oder Wix-Media-URL.
 * aktiv: false blendet einen Eintrag aus.
 * Weiteren Eintrag: Block kopieren, id ändern (ref-4, …).
 */

export const REFERENZEN = [
  {
    id: 'ref-1',
    aktiv: true,
    jahr: '2018',
    kategorie: 'Forschung',
    titel: 'Bau von 4 Energiespeicherhäusern',
    untertitel: 'Auszeichnung mit dem Bayerischen Energiepreis 2022',
    baujahr: '2018',
    wohneinheiten: '4',
    kfw: 'KfW 40',
    heizung: 'Sole-Wasser-Wärmepumpe',
    warmwasser: 'Sole-Wasser-Wärmepumpe',
    lueftung: 'Dezentral mit Wärmepumpe',
    pv: 'Ja, mit Speicher',
    text: '',
    bild: 'https://trippertv83.github.io/WEbsite/referenzen/herzo.jpg',
  },
  {
    id: 'ref-2',
    aktiv: true,
    jahr: '2023',
    kategorie: 'Forschung',
    titel: 'FlexiPlus Wohnen Coburg',
    untertitel: 'Ausgezeichnet nachhaltig – mit dem QNG-Siegel',
    baujahr: '2023',
    wohneinheiten: '15',
    kfw: 'KfW 40 mit QNG',
    heizung: 'Fernwärme',
    warmwasser: 'Fernwärme',
    lueftung: 'Dezentral mit Wärmepumpe',
    pv: 'Ja',
    text: 'FlexiPlus ist Teil eines Pilotprojekts für das Qualitätssiegel Nachhaltiges Gebäude (QNG). Das Gebäude wurde nach der Effizienzhaus-Stufe NH 40 umgesetzt.',
    bild: 'https://trippertv83.github.io/WEbsite/referenzen/coburg.jpg',
  },
  {
    id: 'ref-3',
    aktiv: true,
    jahr: '2026',
    kategorie: 'Forschung',
    titel: 'Kleiner Wohnen@Land',
    untertitel: 'Unterstützt durch die Bundesstiftung Bauakademie',
    baujahr: '2026',
    wohneinheiten: '26',
    kfw: 'KfW 55 NiN',
    heizung: 'Luft-Wasser-Wärmepumpe',
    warmwasser: 'Booster-Wärmepumpe',
    lueftung: 'Dezentral mit Wärmepumpe',
    pv: 'Ja',
    text: 'Pilotprojekt „Innovationen im Gebäudebereich“ in Redwitz. Begleitforschung durch das BBSR zur wissenschaftlichen Auswertung der planerischen und baulichen Ansätze.',
    bild: 'https://trippertv83.github.io/WEbsite/referenzen/redwitz.jpg',
  },
];

export function aktiveReferenzen() {
  return REFERENZEN.filter((item) => item.aktiv !== false);
}
