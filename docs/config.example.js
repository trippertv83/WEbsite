/**
 * Öffentliche Frontend-Konfiguration.
 * 1. Diese Datei nach config.js kopieren (liegt im Projektroot, nicht ins Git).
 * 2. Nur IDs und URLs eintragen – niemals API-Schlüssel.
 *
 * Backend-Geheimnisse gehören ausschließlich in Wix Secrets Manager
 * (siehe backend/secrets.example.js und README.md).
 */
export const AppConfig = {
  /** Anzeigename im Formular und in E-Mails */
  brandName: 'Energieausweis Pro',

  /** Öffentliche Kontaktadresse (kein SMTP-Passwort) */
  supportEmail: 'service@example.com',

  /**
   * Wix Stores Produkt-ID des Verbrauchsausweises.
   * Im Wix Dashboard unter Store → Produkte nachschlagen.
   */
  wixProductId: '0786caad-15f2-40ac-bc15-9915ffd6d6d3',

  /**
   * Anzeigepreis in EUR, falls der Shop-Preis nicht geladen werden kann.
   * Muss mit dem Wix-Stores-Artikel übereinstimmen.
   */
  productPriceEuro: 59.99,

  /** Maximalgröße je PDF in Megabyte */
  maxFileSizeMb: 4,

  /** Pflicht: Heizkostenabrechnungen (eine Datei darf alle Jahre enthalten) */
  minHeatingBills: 1,

  /** Maximalgröße aller Uploads zusammen in Megabyte */
  maxTotalUploadMb: 12,

  /**
   * false = Wix-Warenkorb + Checkout.
   * true nur lokal, wenn kein Shop angebunden ist.
   */
  demoMode: false,

  /** Basis-URL der Wix-Site, sobald HTTP-Functions live sind */
  wixHttpFunctionsBaseUrl:
    'https://energieberater4.wixsite.com/dieterspaderna/_functions',
};

export default AppConfig;
