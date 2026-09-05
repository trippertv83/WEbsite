import { attachSignPad, stripDataUrl } from './sign-pad.js';
import { honorForUnits, objectLine, personLine, renderVertragHtml, renderVollmachtHtml } from './isfp-docs.js';
import { fillIsfpPdfs } from './isfp-pdf.js';

const MASSNAHMEN = [
  ['fenster', 'Austausch der Fenster'],
  ['keller', 'Dämmung der Kellerdecke / Boden gegen Erdreich'],
  ['aussenwand', 'Dämmung der Außenwand'],
  ['innenwaende', 'Dämmung Innenwände gegen Kaltbereich'],
  ['ogd', 'Dämmung der obersten Geschossdecke'],
  ['dachfenster', 'Austausch Dachfenster'],
  ['dach', 'Dämmung des Daches / Gauben'],
  ['waermepumpe', 'Wärmepumpe'],
];

function attr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function splitName(session) {
  const first = String(session.firstName || '').trim();
  const last = String(session.lastName || '').trim();
  if (first || last) return { first, last };
  const parts = String(session.name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts.at(-1) };
}

function val(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  if (el.type === 'checkbox') return el.checked ? 'ja' : '';
  return String(el.value || '').trim();
}

function radio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function checks(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((el) => el.value);
}

function nowStamp() {
  return new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

function bogenHtml(session) {
  const names = splitName(session);
  const street = session.strasse || '';
  const house = session.hausnummer || '';
  const plz = session.plz || '';
  const ort = session.ort || '';
  const massnahmen = MASSNAHMEN.map(
    ([key, label]) =>
      `<label class="check"><input type="checkbox" name="massnahme" value="${key}" /> ${label}</label>`
  ).join('');
  return `
    <p class="steps">Schritt 1 von 3 · Erfassungsbogen (Datenblatt Auftrag)</p>
    <fieldset>
      <legend>Antragsteller / Kontakt</legend>
      <div class="row">
        <div>
          <label for="anrede">Anrede</label>
          <select id="anrede" required>
            <option value="">Bitte wählen</option>
            <option>Frau</option>
            <option>Herr</option>
          </select>
        </div>
        <div>
          <label for="firma">Firma / Organisation <span class="hint">(optional)</span></label>
          <input id="firma" value="${attr(session.companyName)}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="firstName">Vorname</label>
          <input id="firstName" required value="${attr(names.first)}" />
        </div>
        <div>
          <label for="lastName">Nachname</label>
          <input id="lastName" required value="${attr(names.last)}" />
        </div>
      </div>
      <label class="check"><input type="checkbox" id="andererAntragsteller" /> anderer Antragsteller</label>
      <p class="hint">Die Wohnadresse muss mit dem Ausweisdokument / Personalausweis übereinstimmen.</p>
      <div class="row">
        <div>
          <label for="street">Straße</label>
          <input id="street" required value="${attr(street)}" />
        </div>
        <div>
          <label for="houseNo">Hausnr.</label>
          <input id="houseNo" required value="${attr(house)}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="plz">PLZ</label>
          <input id="plz" required value="${attr(plz)}" />
        </div>
        <div>
          <label for="ort">Ort</label>
          <input id="ort" required value="${attr(ort)}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="email">E-Mail</label>
          <input id="email" type="email" required value="${attr(session.email)}" />
        </div>
        <div>
          <label for="phone">Telefon</label>
          <input id="phone" required value="${attr(session.phone)}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="geburt">Geburtsdatum</label>
          <input id="geburt" placeholder="TT.MM.JJJJ" />
        </div>
        <div>
          <label for="steuerId">Steueridentifikationsnummer</label>
          <input id="steuerId" />
        </div>
      </div>
      <label for="iban">IBAN / Bankverbindung für Zuschuss</label>
      <input id="iban" autocomplete="off" />
    </fieldset>
    <fieldset>
      <legend>Vorhaben</legend>
      <label class="check"><input type="checkbox" name="vorhaben" value="privat" /> Privatperson</label>
      <label class="check"><input type="checkbox" name="vorhaben" value="weg" /> Wohnungseigentümergemeinschaft / WEG</label>
      <label class="check"><input type="checkbox" name="vorhaben" value="getrennt" /> getrenntes Vorhaben (Mehrfachauswahl möglich)</label>
    </fieldset>
    <fieldset>
      <legend>Geplante Maßnahmen</legend>
      ${massnahmen}
      <p class="hint">Wärmepumpe: Der Liefer- bzw. Leistungsvertrag muss die aufschiebende Bedingung enthalten. Beginnen Sie erst nach vorliegendem Förderbescheid.</p>
    </fieldset>
    <fieldset>
      <legend>Objekt</legend>
      <p class="hint">Objektanschrift für Vertrag und Antrag. Standard: Ihre Wohnadresse, bitte anpassen falls abweichend.</p>
      <div class="row">
        <div>
          <label for="objStreet">Straße</label>
          <input id="objStreet" required value="${attr(street)}" />
        </div>
        <div>
          <label for="objHouseNo">Hausnr.</label>
          <input id="objHouseNo" required value="${attr(house)}" />
        </div>
      </div>
      <div class="row">
        <div>
          <label for="objPlz">PLZ</label>
          <input id="objPlz" required value="${attr(plz)}" />
        </div>
        <div>
          <label for="objOrt">Ort</label>
          <input id="objOrt" required value="${attr(ort)}" />
        </div>
      </div>
      <p>Befinden sich unter dieser Objektadresse mehrere beheizbare Gebäude?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="mehrereGebaeude" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="mehrereGebaeude" value="ja" /> Ja</label>
      </div>
      <p class="hint">Wenn ja: bitte Bebauungsplan / Skizze / Kartenausschnitt mit Markierung hochladen.</p>
      <p>Sind Sie (als Antragsteller) Eigentümer des Gebäudes?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="eigentuemer" value="ja" required /> Ja</label>
        <label class="check"><input type="radio" name="eigentuemer" value="nein" /> Nein</label>
      </div>
      <p class="hint">Wenn nein: bitte schriftliche Zustimmung des Eigentümers hochladen.</p>
      <p>Sind Sie vorsteuerabzugsberechtigt?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="vorsteuer" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="vorsteuer" value="ja" /> Ja</label>
      </div>
      <div class="row">
        <div>
          <label for="baujahr">Baujahr des Gebäudes</label>
          <input id="baujahr" required />
        </div>
        <div>
          <label for="bauAntrag">Datum Bauantrag / Bauanzeige <span class="hint">(falls bekannt)</span></label>
          <input id="bauAntrag" />
        </div>
      </div>
      <p class="hint">Einzelmaßnahmen sind nur in Gebäuden förderfähig, die mindestens 5 Jahre alt sind.</p>
      <p>Baudenkmal oder besonders erhaltenswerte Bausubstanz?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="denkmal" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="denkmal" value="ja" /> Ja</label>
      </div>
      <p>Überwiegend Wohnen (mehr als 50 %)?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="wohnen" value="ja" required /> Ja</label>
        <label class="check"><input type="radio" name="wohnen" value="nein" /> Nein</label>
      </div>
      <div class="row">
        <div>
          <label for="wohnflaecheWE">Beheizte Wohnfläche je Wohnung (m²)</label>
          <input id="wohnflaecheWE" required inputmode="decimal" />
        </div>
        <div>
          <label for="anzahlWE">Anzahl der Wohneinheiten</label>
          <input id="anzahlWE" required inputmode="numeric" value="1" />
        </div>
      </div>
      <p>Wohneinheiten über mehrere Geschosse?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="weGeschosse" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="weGeschosse" value="ja" /> Ja</label>
      </div>
      <p>Wurden für die geplante Maßnahme bereits Förderungen beantragt?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="foerderungBeantragt" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="foerderungBeantragt" value="ja" /> Ja</label>
      </div>
      <label for="foerderungText">Falls ja: welche?</label>
      <input id="foerderungText" />
      <p>Haben Sie bereits einen iSFP vorliegen oder durchgeführt?</p>
      <div class="yesno">
        <label class="check"><input type="radio" name="isfpVorhanden" value="nein" required /> Nein</label>
        <label class="check"><input type="radio" name="isfpVorhanden" value="ja" /> Ja</label>
      </div>
      <label for="sanierungBisher">Bereits durchgeführte Sanierungsmaßnahmen</label>
      <textarea id="sanierungBisher"></textarea>
    </fieldset>
    <fieldset>
      <legend>Erklärungen</legend>
      <label class="check"><input type="checkbox" id="erklDoppelt" required /> Ich beantrage keine doppelte Förderung für dieselbe Maßnahme und verstehe, dass die Förderquote max. 60 % beträgt. Eine steuerliche Förderung nach § 35c EStG kann ausgeschlossen sein. Parallel kein KfW-Antrag auf dieselben Kosten.</label>
      <label class="check"><input type="checkbox" id="erklWahr" required /> Ich versichere, alle Angaben nach bestem Wissen und Gewissen gemacht zu haben. Falsche Angaben können eine Straftat darstellen.</label>
      <label class="check"><input type="checkbox" id="erklDaten" required /> Ich akzeptiere die Datenschutzhinweise und die Erläuterung zur Vollmacht (Anlage).</label>
    </fieldset>
    <label for="nachricht">Nachricht <span class="hint">(optional)</span></label>
    <textarea id="nachricht" placeholder="Kurz das Vorhaben beschreiben"></textarea>
    <div id="uploads"></div>
    <p class="hint">Nur PDF, max. 4 MB je Datei. Vertrag und Vollmacht unterschreiben Sie im nächsten Schritt auf dieser Seite.</p>
    <button type="submit" id="send">Erfassungsbogen senden</button>
    <p class="msg" id="msg"></p>
  `;
}

function collectBogen() {
  return {
    anrede: val('anrede'),
    firma: val('firma'),
    firstName: val('firstName'),
    lastName: val('lastName'),
    andererAntragsteller: val('andererAntragsteller'),
    street: val('street'),
    houseNo: val('houseNo'),
    plz: val('plz'),
    ort: val('ort'),
    email: val('email'),
    phone: val('phone'),
    geburt: val('geburt'),
    steuerId: val('steuerId'),
    iban: val('iban'),
    vorhaben: checks('vorhaben').join(', '),
    massnahmen: checks('massnahme').join(', '),
    objStreet: val('objStreet'),
    objHouseNo: val('objHouseNo'),
    objPlz: val('objPlz'),
    objOrt: val('objOrt'),
    mehrereGebaeude: radio('mehrereGebaeude'),
    eigentuemer: radio('eigentuemer'),
    vorsteuer: radio('vorsteuer'),
    baujahr: val('baujahr'),
    bauAntrag: val('bauAntrag'),
    denkmal: radio('denkmal'),
    wohnen: radio('wohnen'),
    wohnflaecheWE: val('wohnflaecheWE'),
    anzahlWE: val('anzahlWE'),
    weGeschosse: radio('weGeschosse'),
    foerderungBeantragt: radio('foerderungBeantragt'),
    foerderungText: val('foerderungText'),
    isfpVorhanden: radio('isfpVorhanden'),
    sanierungBisher: val('sanierungBisher'),
    nachricht: val('nachricht'),
  };
}

function signPanel(id, title) {
  return `
    <div class="sign-wrap">
      <p><b>${title}</b></p>
      <p class="hint">Bitte mit Finger oder Maus unterschreiben. Das ist eine einfache elektronische Signatur (kein qualifiziertes Zertifikat). Sie wirkt verbindlich für diesen Online-Abschluss.</p>
      <canvas id="${id}" width="640" height="180"></canvas>
      <button type="button" class="ghost" data-clear="${id}">Unterschrift löschen</button>
    </div>`;
}

export function startIsfpAnfrage({ session, service, form, doneEl, postJson, fileToBase64 }) {
  document.getElementById('titel').textContent = service.titel;
  document.getElementById('lead').textContent =
    'Bitte den Erfassungsbogen ausfüllen. Danach öffnen sich Vertrag und Vollmacht mit Ihren Daten zur elektronischen Unterschrift.';
  form.innerHTML = bogenHtml(session);
  const msg = document.getElementById('msg');
  document.getElementById('uploads').innerHTML = (service.uploads || [])
    .map(
      (item) =>
        `<label for="file-${item.key}">${item.label} <span class="hint">(Datei)</span></label>` +
        `<input id="file-${item.key}" type="file" accept="application/pdf,.pdf" data-key="${item.key}" data-label="${item.label}" />`
    )
    .join('');

  let payload = null;
  let files = [];
  let vertragPad = null;
  let vollmachtPad = null;

  async function uploadFiles() {
    const out = [];
    const inputs = [...document.querySelectorAll('#form input[type=file]')];
    for (const input of inputs) {
      const file = input.files && input.files[0];
      if (!file) continue;
      if (!/\.pdf$/i.test(file.name)) throw new Error(file.name + ': bitte nur PDF hochladen.');
      if (file.size > 4 * 1024 * 1024) throw new Error(file.name + ' ist größer als 4 MB.');
      const uploaded = await postJson('inquiryFile', {
        sessionToken: session.token,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        category: input.dataset.key,
        contentBase64: await fileToBase64(file),
      });
      out.push({
        name: file.name,
        label: input.dataset.label,
        url: uploaded.downloadUrl || uploaded.fileUrl,
      });
    }
    return out;
  }

  function showVertrag() {
    const honor = honorForUnits(payload.anzahlWE);
    form.innerHTML = `
      <p class="steps">Schritt 2 von 3 · Vertrag iSFP</p>
      <p class="hint">Personen- und Objektdaten aus dem Erfassungsbogen sind übernommen. Honorar laut Vertrag: ${honor.typ}, ${honor.gesamt} (Zuschuss ${honor.zuschuss}, Eigenanteil ${honor.eigen}). Die Unterschrift wird in das Original-PDF des Vertrags gesetzt.</p>
      <div id="vertrag-preview" class="doc-preview"></div>
      <label class="check"><input type="checkbox" id="widerrufVerzicht" /> Ich verlange ausdrücklich, dass mit der Leistung vor Ende der 14-tägigen Widerrufsfrist begonnen wird.</label>
      <label class="check"><input type="checkbox" id="acceptVertrag" required /> Ich habe den Vertrag gelesen und schließe ihn elektronisch ab.</label>
      ${signPanel('sign-vertrag', 'Unterschrift Auftraggeber')}
      <button type="button" id="to-vollmacht">Vertrag unterschreiben und zur Vollmacht</button>
      <p class="msg" id="msg"></p>`;
    const preview = document.getElementById('vertrag-preview');
    const refresh = () => {
      payload.widerrufVerzicht = document.getElementById('widerrufVerzicht').checked;
      preview.innerHTML = renderVertragHtml(payload, { at: nowStamp() });
    };
    refresh();
    document.getElementById('widerrufVerzicht').addEventListener('change', refresh);
    vertragPad = attachSignPad(document.getElementById('sign-vertrag'));
    form.querySelector('[data-clear="sign-vertrag"]').addEventListener('click', () => vertragPad.clear());
    document.getElementById('to-vollmacht').addEventListener('click', () => {
      const localMsg = document.getElementById('msg');
      if (!document.getElementById('acceptVertrag').checked) {
        localMsg.className = 'msg err';
        localMsg.textContent = 'Bitte den Vertrag bestätigen.';
        return;
      }
      if (vertragPad.isEmpty()) {
        localMsg.className = 'msg err';
        localMsg.textContent = 'Bitte unterschreiben.';
        return;
      }
      payload.widerrufVerzicht = document.getElementById('widerrufVerzicht').checked;
      payload.vertragSignAt = nowStamp();
      payload.vertragSignImage = vertragPad.toDataURL();
      showVollmacht();
    });
  }

  function showVollmacht() {
    form.innerHTML = `
      <p class="steps">Schritt 3 von 3 · Vollmacht BAFA (EBW)</p>
      <p class="hint">Vollmachtgeber = Ihre Personendaten. Bevollmächtigter = Ingenieurbüro Spaderna. Die Unterschrift wird in das originale BAFA-PDF übernommen.</p>
      <div id="vollmacht-preview" class="doc-preview">${renderVollmachtHtml(payload, { at: nowStamp() })}</div>
      <label class="check"><input type="checkbox" id="acceptVollmacht" required /> Ich erteile die Vollmacht elektronisch und stimme der Datenweitergabe an das BAFA zu.</label>
      ${signPanel('sign-vollmacht', 'Unterschrift Vollmachtgeber')}
      <button type="button" id="finish">Vollmacht unterschreiben und Auftrag absenden</button>
      <p class="msg" id="msg"></p>`;
    vollmachtPad = attachSignPad(document.getElementById('sign-vollmacht'));
    form.querySelector('[data-clear="sign-vollmacht"]').addEventListener('click', () => vollmachtPad.clear());
    document.getElementById('finish').addEventListener('click', submitAll);
  }

  async function submitAll() {
    const localMsg = document.getElementById('msg');
    const button = document.getElementById('finish');
    if (!document.getElementById('acceptVollmacht').checked) {
      localMsg.className = 'msg err';
      localMsg.textContent = 'Bitte die Vollmacht bestätigen.';
      return;
    }
    if (vollmachtPad.isEmpty()) {
      localMsg.className = 'msg err';
      localMsg.textContent = 'Bitte unterschreiben.';
      return;
    }
    payload.vollmachtSignAt = nowStamp();
    payload.vollmachtSignImage = vollmachtPad.toDataURL();
    button.disabled = true;
    localMsg.className = 'msg';
    localMsg.textContent = 'Vertrag und Vollmacht werden als PDF erzeugt …';
    try {
      const honor = honorForUnits(payload.anzahlWE);
      const pdfFiles = await fillIsfpPdfs(payload);
      for (const pdf of pdfFiles) {
        const uploaded = await postJson('inquiryFile', {
          sessionToken: session.token,
          name: pdf.name,
          mimeType: 'application/pdf',
          category: pdf.category,
          contentBase64: pdf.base64,
        });
        files.push({
          name: pdf.name,
          label: pdf.label,
          url: uploaded.downloadUrl || uploaded.fileUrl,
        });
      }
      localMsg.textContent = 'Wird gesendet …';
      const answers = { ...payload, objekt: objectLine(payload), honorTyp: honor.typ, honorGesamt: honor.gesamt };
      delete answers.vertragSignImage;
      delete answers.vollmachtSignImage;
      await postJson('serviceInquiry', {
        sessionToken: session.token,
        serviceId: service.id,
        titel: service.titel,
        preis: honor.gesamt,
        contact: {
          name: [payload.firstName, payload.lastName].filter(Boolean).join(' '),
          email: payload.email,
          phone: payload.phone,
          ort: [payload.plz, payload.ort].filter(Boolean).join(' '),
          adresse: personLine(payload),
        },
        answers,
        docsHtml: {
          vertrag: renderVertragHtml(payload, {
            at: payload.vertragSignAt,
            image: payload.vertragSignImage,
          }),
          vollmacht: renderVollmachtHtml(payload, {
            at: payload.vollmachtSignAt,
            image: payload.vollmachtSignImage,
          }),
        },
        signatures: {
          vertrag: stripDataUrl(payload.vertragSignImage),
          vollmacht: stripDataUrl(payload.vollmachtSignImage),
        },
        files,
      });
      form.classList.add('is-off');
      doneEl.classList.add('is-on');
      doneEl.innerHTML =
        '<p>Vielen Dank. Erfassungsbogen, unterschriebener Vertrag und Vollmacht wurden an uns gesendet. Wir melden uns.</p>';
    } catch (error) {
      localMsg.className = 'msg err';
      localMsg.textContent = error.message || 'Senden fehlgeschlagen.';
      button.disabled = false;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (payload) return;
    msg.className = 'msg';
    msg.textContent = 'Erfassungsbogen wird übernommen …';
    const button = document.getElementById('send');
    button.disabled = true;
    try {
      payload = collectBogen();
      files = await uploadFiles();
      showVertrag();
    } catch (error) {
      msg.className = 'msg err';
      msg.textContent = error.message || 'Bitte Angaben prüfen.';
      button.disabled = false;
    }
  });
}
