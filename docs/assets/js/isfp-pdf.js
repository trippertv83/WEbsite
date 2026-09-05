import { honorForUnits, objectLine, OFFICE, personLine } from './isfp-docs.js';

let pdfLibReady = null;

function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (pdfLibReady) return pdfLibReady;
  pdfLibReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../vendor/pdf-lib.min.js', import.meta.url).href;
    script.onload = () => resolve(window.PDFLib);
    script.onerror = () => reject(new Error('PDF-Bibliothek konnte nicht geladen werden.'));
    document.head.appendChild(script);
  });
  return pdfLibReady;
}

function winAnsi(text) {
  return String(text || '')
    .replace(/€/g, 'EUR')
    .replace(/–|—/g, '-')
    .normalize('NFC');
}

function pngBytes(dataUrl) {
  const raw = String(dataUrl || '');
  const b64 = raw.includes(',') ? raw.slice(raw.indexOf(',') + 1) : raw;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function u8ToBase64(u8) {
  let text = '';
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    text += String.fromCharCode.apply(null, u8.subarray(i, i + step));
  }
  return btoa(text);
}

async function loadTemplate(file) {
  const res = await fetch(new URL('../pdf/' + file, import.meta.url));
  if (!res.ok) throw new Error('PDF-Vorlage fehlt: ' + file);
  return new Uint8Array(await res.arrayBuffer());
}

function setText(form, name, value) {
  try {
    form.getTextField(name).setText(winAnsi(value));
  } catch {
    /* Feldname weicht ab */
  }
}

function textBy(form, PDFTextField, test) {
  return form.getFields().find((field) => field instanceof PDFTextField && test(field.getName()));
}

function todayIso() {
  return new Date().toLocaleDateString('de-DE');
}

async function fillVertrag(PDFLib, data) {
  const { PDFDocument, PDFCheckBox, StandardFonts, rgb } = PDFLib;
  const pdf = await PDFDocument.load(await loadTemplate('vertrag-isfp.pdf'));
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const date = data.vertragSignAt || todayIso();
  setText(form, 'Textfeld0', personLine(data));
  setText(form, 'Textfeld1', [data.phone, data.email].filter(Boolean).join(', '));
  setText(form, 'Textfeld2', objectLine(data));
  setText(form, 'Textfeld3', [data.ort || OFFICE.ort, date].filter(Boolean).join(', '));
  setText(form, 'Textfeld4', [OFFICE.ort, date].join(', '));
  if (data.widerrufVerzicht) {
    const box = form.getFields().find((field) => field instanceof PDFCheckBox);
    if (box) box.check();
  }
  form.getFields().forEach((field) => {
    if (typeof field.updateAppearances === 'function' && !(field instanceof PDFCheckBox)) {
      try {
        field.updateAppearances(font);
      } catch {
        /* */
      }
    }
  });
  try {
    form.flatten();
  } catch {
    /* Signaturfeld kann flatten blockieren */
  }
  if (Number(data.anzahlWE) < 3) {
    const page = pdf.getPages()[3];
    const white = rgb(1, 1, 1);
    page.drawRectangle({ x: 382, y: 668, width: 48, height: 20, color: white });
    page.drawRectangle({ x: 382, y: 630, width: 48, height: 20, color: white });
    page.drawText('1300', { x: 386, y: 674, size: 11, font, color: rgb(0, 0, 0) });
    page.drawText('650', { x: 390, y: 636, size: 11, font, color: rgb(0, 0, 0) });
  }
  if (data.vertragSignImage) {
    const png = await pdf.embedPng(pngBytes(data.vertragSignImage));
    const page = pdf.getPages()[6];
    page.drawImage(png, { x: 72, y: 194, width: 167, height: 48 });
  }
  return pdf.save();
}

async function fillVollmacht(PDFLib, data) {
  const { PDFDocument, PDFTextField, StandardFonts } = PDFLib;
  const pdf = await PDFDocument.load(await loadTemplate('vollmacht-isfp.pdf'));
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const street = [data.street, data.houseNo].filter(Boolean).join(' ');
  setText(form, 'Anrede', data.anrede);
  setText(form, 'Vorname', data.firstName);
  setText(form, 'Nachname', data.lastName);
  setText(form, 'Name der Organisation', data.firma);
  const streetField = textBy(
    form,
    PDFTextField,
    (name) => /Hausnummer/i.test(name) && !/_2/.test(name)
  );
  if (streetField) streetField.setText(winAnsi(street));
  const plzField = textBy(form, PDFTextField, (name) => /Postleitzahl/i.test(name) && !/_2/.test(name));
  if (plzField) plzField.setText(winAnsi(data.plz));
  const ortField = textBy(form, PDFTextField, (name) => /^Ort$/.test(name) || (name === 'Ort'));
  if (ortField) ortField.setText(winAnsi(data.ort));
  else {
    const orts = form.getFields().filter((field) => field instanceof PDFTextField && field.getName().replace(/_2$/, '') === 'Ort');
    if (orts[0] && orts[0].getName() === 'Ort') orts[0].setText(winAnsi(data.ort));
  }
  setText(form, 'Ort', data.ort);
  setText(form, 'Anrede_2', OFFICE.anrede);
  setText(form, 'Vorname_2', OFFICE.firstName);
  setText(form, 'Nachname_2', OFFICE.lastName);
  setText(form, 'FirmennameInstitutionsname', OFFICE.firma);
  const street2 = textBy(form, PDFTextField, (name) => /Hausnummer/i.test(name) && /_2/.test(name));
  if (street2) street2.setText(winAnsi(OFFICE.street));
  setText(form, 'Postleitzahl_2', OFFICE.plz);
  setText(form, 'Ort_2', 'Ebensfeld OT Oberbrunn');
  setText(form, 'Telefon optional', OFFICE.phone.replace(/\s/g, ''));
  setText(form, 'EMailAdresse optional', OFFICE.email);
  setText(form, 'Datum', data.vollmachtSignAt || todayIso());
  form.getFields().forEach((field) => {
    if (typeof field.updateAppearances === 'function') {
      try {
        field.updateAppearances(font);
      } catch {
        /* */
      }
    }
  });
  try {
    form.flatten();
  } catch {
    /* */
  }
  if (data.vollmachtSignImage) {
    const png = await pdf.embedPng(pngBytes(data.vollmachtSignImage));
    const page = pdf.getPages()[1];
    page.drawImage(png, { x: 220, y: 455, width: 220, height: 70 });
  }
  return pdf.save();
}

export async function fillIsfpPdfs(data) {
  const PDFLib = await loadPdfLib();
  const [vertrag, vollmacht] = await Promise.all([fillVertrag(PDFLib, data), fillVollmacht(PDFLib, data)]);
  return [
    {
      name: 'Vertrag-iSFP-unterschrieben.pdf',
      label: 'Vertrag iSFP (ausgefuellt, unterschrieben)',
      category: 'vertrag',
      base64: u8ToBase64(vertrag),
    },
    {
      name: 'Vollmacht-BAFA-unterschrieben.pdf',
      label: 'Vollmacht BAFA (ausgefuellt, unterschrieben)',
      category: 'vollmacht',
      base64: u8ToBase64(vollmacht),
    },
  ];
}
