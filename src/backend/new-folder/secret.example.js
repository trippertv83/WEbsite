/**
 * NUR Dokumentation – diese Datei niemals mit echten Schlüsseln füllen
 * und niemals ins Frontend einbinden.
 *
 * In Wix: Dashboard → Developer Tools → Secrets Manager
 *
 * Empfohlene Secret-Namen:
 *   SEVDESK_API_TOKEN
 *   SEVDESK_USER_ID          (numerische User-ID des SevDesk-Accounts)
 *   SMTP wird in Wix nicht benötigt: E-Mails über wix-crm-backend / triggered emails
 *   ADMIN_NOTIFY_EMAIL
 *
 * Aus .jsw-Dateien:
 *   import { getSecret } from 'wix-secrets-backend';
 *   const token = await getSecret('SEVDESK_API_TOKEN');
 */
export const SecretNames = {
  sevdeskApiToken: 'SEVDESK_API_TOKEN',
  sevdeskUserId: 'SEVDESK_USER_ID',
  adminNotifyEmail: 'ADMIN_NOTIFY_EMAIL',
};

export default SecretNames;
