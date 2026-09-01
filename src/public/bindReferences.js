/**
 * Eine Karte, durch die Besucher blättern.
 * Inhalte kommen nur aus public/references.js.
 * HTML-Komponente auf HOME: #htmlReferenzen
 * (URL: https://trippertv83.github.io/WEbsite/referenzen.html)
 */

import { aktiveReferenzen } from 'public/references';

function htmlBox() {
  const ids = ['#htmlReferenzen', '#htmlRefs', '#html2'];
  for (const id of ids) {
    try {
      const el = $w(id);
      if (el && el.length !== 0) return el;
    } catch {
      /* fehlt */
    }
  }
  return null;
}

function sendToHtml() {
  const box = htmlBox();
  if (!box || typeof box.postMessage !== 'function') return;
  const payload = JSON.stringify({
    type: 'REFERENZEN',
    items: aktiveReferenzen(),
  });
  box.postMessage(payload);
}

export function bindReferences() {
  sendToHtml();
  const box = htmlBox();
  if (box && typeof box.onMessage === 'function') {
    box.onMessage(() => sendToHtml());
  }
  setTimeout(sendToHtml, 400);
  setTimeout(sendToHtml, 1200);
}
