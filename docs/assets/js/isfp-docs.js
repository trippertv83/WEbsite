export const OFFICE = {
  anrede: 'Herr',
  firstName: 'Lukas',
  lastName: 'Spaderna',
  name: 'Lukas Spaderna',
  firma: 'Ingenieurbüro Spaderna',
  street: 'Ziegelanger 5',
  plz: '96250',
  ort: 'Oberbrunn',
  phone: '09573 2225410',
  email: 'Lukas@spaderna.Org',
};

export function honorForUnits(we) {
  const units = Number(we) || 1;
  if (units >= 3) {
    return { typ: 'Mehrfamilienhaus', gesamt: '2.500 €', zuschuss: '850 €', eigen: '1.650 €' };
  }
  return { typ: 'Ein- und Zweifamilienhaus', gesamt: '1.300 €', zuschuss: '650 €', eigen: '650 €' };
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function personLine(data) {
  return [
    [data.anrede, data.firstName, data.lastName].filter(Boolean).join(' '),
    [data.street, data.houseNo].filter(Boolean).join(' '),
    [data.plz, data.ort].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}

export function objectLine(data) {
  return [
    [data.objStreet, data.objHouseNo].filter(Boolean).join(' '),
    [data.objPlz, data.objOrt].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}

export function renderVertragHtml(data, sign) {
  const honor = honorForUnits(data.anzahlWE);
  const ag = personLine(data);
  const objekt = objectLine(data);
  const signedAt = sign?.at || '';
  const img = sign?.image ? `<img class="sign-img" alt="Unterschrift Auftraggeber" src="${sign.image}" />` : '';
  return `
    <article class="legal-doc">
      <h2>Energieberatervertrag für Wohngebäude</h2>
      <p>Zwischen</p>
      <p><b>${esc(ag)}</b><br>${esc(data.phone)} · ${esc(data.email)}</p>
      <p>– nachfolgend Auftraggeber genannt –</p>
      <p>und</p>
      <p><b>${esc(OFFICE.name)}</b>, ${esc(OFFICE.street)}, ${esc(OFFICE.plz)} ${esc(OFFICE.ort)}<br>
      (${esc(OFFICE.phone)}, ${esc(OFFICE.email)})</p>
      <p>– nachfolgend Auftragnehmer genannt –</p>
      <p>wird folgender Energieberatervertrag geschlossen.</p>
      <h3>1. Vertragsgegenstand</h3>
      <p>Vertragsgegenstand sind die Leistungen im Zuge der Energieberatung für die Immobilie / das Bauvorhaben an der Adresse:</p>
      <p><b>${esc(objekt) || '—'}</b></p>
      <p>1.1 Erstellung eines individuellen Sanierungsfahrplans (iSFP).</p>
      <h3>2. Leistungen des Auftragnehmers</h3>
      <ul>
        <li>Aufnahme von Gebäudedaten anhand vorhandener Unterlagen und einer Vor-Ort-Begehung (Sichtprüfung)</li>
        <li>Energiebilanz des Ist-Zustandes</li>
        <li>Berechnung und Beschreibung geeigneter energetischer Sanierungsmaßnahmen</li>
        <li>Erstellung des iSFP inkl. Vordimensionierung energetisch relevanter Bauteile</li>
        <li>Präsentation (telefonisch oder im Büro)</li>
      </ul>
      <h3>3. Pflichten des Auftraggebers</h3>
      <p>Unverzüglich, spätestens binnen 14 Werktagen nach Vertragsschluss, sind insbesondere zu übergeben: Planunterlagen (Grundrisse, Ansichten, Schnitte), Detailzeichnungen, Lageplan, Vollmacht/en, die letzten beiden Energierechnungen und das Schornsteinfegerprotokoll. Förderanträge sind dem Auftragnehmer schriftlich per E-Mail mitzuteilen.</p>
      <h3>4. Honorar</h3>
      <p>Für ${esc(honor.typ)} gilt:</p>
      <ul>
        <li>Vereinbartes Honorar: <b>${esc(honor.gesamt)}</b></li>
        <li>Bundeszuschuss nach Richtlinie: ${esc(honor.zuschuss)}</li>
        <li>Eigenanteil des Beratungsempfängers: <b>${esc(honor.eigen)}</b></li>
      </ul>
      <p>Der Auftraggeber entrichtet das Gesamthonorar an den Auftragnehmer; ein gewährter Zuschuss wird von der Förderstelle erstattet. Wird kein Zuschuss gewährt, bleibt das volle Honorar geschuldet.</p>
      <h3>Weitere Vertragsbestimmungen</h3>
      <p>Es gelten die Regelungen des Energieberatervertrags zu Nachträgen, Abnahme, Verjährung, Rechnungsstellung (auch elektronisch), Mängel und Haftung, Berufshaftpflicht (Vermögensschäden 300.000 EUR), Kündigung in Schriftform (§ 650h BGB), Datenverarbeitung, GIH-Schlichtung sowie zum Fördervorbehalt BAFA. Änderungen bedürfen der Schriftform. Eine Förderung ist nicht garantiert.</p>
      <h3>Widerrufsbelehrung</h3>
      <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Frist beginnt mit Vertragsschluss. Der Widerruf ist zu richten an: ${esc(OFFICE.firma)}, ${esc(OFFICE.street)}, ${esc(OFFICE.plz)} ${esc(OFFICE.ort)}, ${esc(OFFICE.phone)}, ${esc(OFFICE.email)}. Zur Fristwahrung reicht die rechtzeitige Absendung. Folgen des Widerrufs richten sich nach den gesetzlichen Vorschriften.</p>
      ${
        data.widerrufVerzicht
          ? `<p><b>Beginn vor Fristende:</b> Ich verlange ausdrücklich, dass mit der Leistung vor Ende der Widerrufsfrist begonnen wird. Mir ist bekannt, dass ich bei vollständiger Vertragserfüllung das Widerrufsrecht verliere.</p>`
          : '<p>Mit der Ausführung wird nicht vor Ablauf der Widerrufsfrist begonnen, sofern nicht ausdrücklich verlangt.</p>'
      }
      <div class="sign-block">
        <p>Ort, Datum: ${esc(data.ort || OFFICE.ort)}, ${esc(signedAt)}</p>
        <p>Auftraggeber</p>
        ${img}
        <p class="hint">Elektronische Signatur (einfache elektronische Signatur, eIDAS). Nachweis: Name, Zeitpunkt, Unterschriftsbild.</p>
        <p>Auftragnehmer: ${esc(OFFICE.name)}</p>
      </div>
    </article>`;
}

export function renderVollmachtHtml(data, sign) {
  const signedAt = sign?.at || '';
  const img = sign?.image ? `<img class="sign-img" alt="Unterschrift Vollmachtgeber" src="${sign.image}" />` : '';
  return `
    <article class="legal-doc">
      <p class="hint">BAFA · Energieberatung für Wohngebäude (EBW) · Vollmacht</p>
      <h2>Vollmacht</h2>
      <h3>1. Vollmachtgeber</h3>
      <p>
        Anrede: <b>${esc(data.anrede)}</b><br>
        Vorname: <b>${esc(data.firstName)}</b><br>
        Nachname: <b>${esc(data.lastName)}</b><br>
        Firma/Organisation: <b>${esc(data.firma || '—')}</b><br>
        Straße und Hausnummer: <b>${esc([data.street, data.houseNo].filter(Boolean).join(' '))}</b><br>
        Postleitzahl: <b>${esc(data.plz)}</b> · Ort: <b>${esc(data.ort)}</b>
      </p>
      <h3>2. Bevollmächtigte Person</h3>
      <p>
        Anrede: <b>${esc(OFFICE.anrede)}</b><br>
        Vorname: <b>${esc(OFFICE.firstName)}</b><br>
        Nachname: <b>${esc(OFFICE.lastName)}</b><br>
        Firmenname: <b>${esc(OFFICE.firma)}</b><br>
        Straße und Hausnummer: <b>${esc(OFFICE.street)}</b><br>
        Postleitzahl: <b>${esc(OFFICE.plz)}</b> · Ort: <b>${esc(OFFICE.ort)}</b><br>
        Telefon: ${esc(OFFICE.phone)} · E-Mail: ${esc(OFFICE.email)}
      </p>
      <p>Die bevollmächtigte Person ist berechtigt, im Namen des Antragstellers gegenüber dem Bundesamt für Wirtschaft und Ausfuhrkontrolle (BAFA), Frankfurter Straße 29-35, 65760 Eschborn, alle das Förderverfahren betreffenden Verfahrenshandlungen vorzunehmen. Das BAFA führt den Schriftverkehr mit der bevollmächtigten Person.</p>
      <h3>3. Datenschutzerklärung und Unterschrift</h3>
      <p>Ich bin als vollmachtgebende Person damit einverstanden, dass die bevollmächtigte Person verfahrensrelevante Daten an das BAFA weitergibt. Das BAFA darf im Rahmen der Antragsprüfung Daten vorlegen und Auskünfte einholen oder erteilen. Diese Vollmacht gilt mit dem Datum der Erteilung für die Dauer des Verfahrens oder erlischt mit der Bevollmächtigung einer anderen Person.</p>
      <div class="sign-block">
        <p>Datum: ${esc(signedAt)}</p>
        ${img}
        <p>Unterschrift des Vollmachtgebers</p>
        <p class="hint">Elektronische Signatur (einfache elektronische Signatur, eIDAS).</p>
      </div>
    </article>`;
}
