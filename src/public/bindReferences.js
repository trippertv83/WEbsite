/**
 * Referenzen-Slider auf der HOME-Seite.
 *
 * Im Wix-Editor auf HOME, unter der Überschrift „Referenzen“:
 * Einbettung → HTML-iframe, Höhe ca. 800 px.
 * Element-ID am besten: htmlReferenzen
 * Die Webadresse setzt dieser Code selbst.
 *
 * Texte und Bilder: public/references.js
 */

import { aktiveReferenzen } from 'public/references';

const REF_URL = 'https://trippertv83.github.io/WEbsite/referenzen.html?v=20260903i';
const SKIP_WIZARD = new Set(['wizardHtml', 'htmlComp1']);

function exists(id) {
  try {
    const el = $w(id);
    return el && el.length !== 0 ? el : null;
  } catch {
    return null;
  }
}

function idOf(el) {
  try {
    return String(el.id || '').replace(/^#/, '');
  } catch {
    return '';
  }
}

function srcOf(el) {
  try {
    return String(el.src || '');
  } catch {
    return '';
  }
}

function listHtmlBoxes() {
  const found = [];
  const named = ['#htmlReferenzen', '#htmlRefs', '#html2', '#html1'];
  named.forEach((id) => {
    const el = exists(id);
    if (el) found.push(el);
  });
  try {
    const all = $w('HtmlComponent');
    if (all && typeof all.forEach === 'function') {
      all.forEach((el) => found.push(el));
    } else if (all && all.length) {
      found.push(all);
    }
  } catch {
    /* keine HTML-Komponente */
  }
  const unique = [];
  found.forEach((el) => {
    if (!el) return;
    if (SKIP_WIZARD.has(idOf(el))) return;
    if (unique.indexOf(el) === -1) unique.push(el);
  });
  return unique;
}

function htmlBox() {
  const boxes = listHtmlBoxes();
  const already = boxes.find((el) => /referenzen\.html/i.test(srcOf(el)));
  if (already) return already;
  const named = boxes.find((el) => /htmlReferenzen|htmlRefs|html2/i.test(idOf(el)));
  if (named) return named;
  return boxes[0] || null;
}

function sendToHtml(box) {
  if (!box || typeof box.postMessage !== 'function') return;
  box.postMessage(
    JSON.stringify({
      type: 'REFERENZEN',
      items: aktiveReferenzen(),
    })
  );
}

function setSrc(box) {
  if (!box) return;
  const current = srcOf(box);
  if (/referenzen\.html\?v=20260903i/i.test(current)) return;
  try {
    box.src = REF_URL;
  } catch {
    /* URL nur im Editor setzbar */
  }
}

const ROWS = [
  ['baujahr', 'Baujahr'],
  ['wohneinheiten', 'Anzahl der Wohneinheiten'],
  ['kfw', 'KfW-Effizienzhaus'],
  ['heizung', 'Heizung'],
  ['warmwasser', 'Warmwasserversorgung'],
  ['lueftung', 'Lüftung'],
  ['pv', 'PV-Anlage'],
];

function setText(id, value) {
  const el = exists(id);
  if (!el) return;
  const text = value == null ? '' : String(value);
  try {
    if ('html' in el && id === '#refTitel') {
      el.html = text;
      return;
    }
  } catch {
    /* text */
  }
  try {
    el.text = text;
  } catch {
    try {
      el.html = text;
    } catch {
      /* fehlt */
    }
  }
}

function paintNative(item) {
  if (!item) return;
  const year = item.jahr || item.baujahr || '';
  const title = [item.kategorie, item.titel].filter(Boolean).join(' ');
  const bild = exists('#refBild') || exists('#imageReferenzen');
  if (bild && item.bild) {
    try {
      bild.src = item.bild;
    } catch {
      /* */
    }
  }
  setText(
    '#refTitel',
    '<span style="color:#1E5D8B">' + year + '</span> ' + title
  );
  setText('#refUntertitel', item.untertitel || '');
  setText('#refText', item.text || '');
  setText(
    '#refSpecs',
    ROWS.filter((row) => item[row[0]])
      .map((row) => row[1] + ': ' + item[row[0]])
      .join('\n')
  );
}

export function bindReferences() {
  const items = aktiveReferenzen();
  let index = 0;

  const box = htmlBox();
  setSrc(box);
  sendToHtml(box);
  if (box && typeof box.onMessage === 'function') {
    box.onMessage(() => sendToHtml(box));
  }
  setTimeout(() => sendToHtml(box), 500);
  setTimeout(() => sendToHtml(box), 1500);

  const show = () => {
    if (!items.length) return;
    paintNative(items[index]);
  };
  show();

  const prev = exists('#btnRefPrev') || exists('#refZurueck');
  const next = exists('#btnRefNext') || exists('#refWeiter');
  if (prev && typeof prev.onClick === 'function') {
    prev.onClick(() => {
      index = (index - 1 + items.length) % items.length;
      show();
    });
  }
  if (next && typeof next.onClick === 'function') {
    next.onClick(() => {
      index = (index + 1) % items.length;
      show();
    });
  }
}
