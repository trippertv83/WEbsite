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
  wixProductId: '00000000-0000-0000-0000-000000000000',

  /** Maximalgröße je PDF in Megabyte */
  maxFileSizeMb: 10,

  /** Pflicht: Heizkostenabrechnungen */
  minHeatingBills: 3,

  /** Maximalgröße aller Uploads zusammen in Megabyte */
  maxTotalUploadMb: 40,

  /** Demo-Modus: Bestellung ohne Wix (nur lokale Entwicklung) */
  demoMode: true,

  /** Basis-URL der Wix-Site, sobald HTTP-Functions live sind */
  wixHttpFunctionsBaseUrl:
    'https://energieberater4.wixsite.com/dieterspaderna/_functions',
};

export default AppConfig;
