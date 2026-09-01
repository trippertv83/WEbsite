/**
 * Eine Karte, durch die Besucher blättern.
 * Inhalte kommen nur aus public/references.js.
 */

import { aktiveReferenzen } from 'public/references';

let index = 0;

function has(id) {
  try {
    const el = $w(id);
    return Boolean(el && el.length !== 0);
  } catch {
    return false;
  }
}

function setText(id, value) {
  if (!has(id)) return;
  try {
    $w(id).text = String(value || '');
  } catch {
    try {
      $w(id).html = `<p>${String(value || '').replace(/\n/g, '<br />')}</p>`;
    } catch {
      /* kein Text-Element */
    }
  }
}

function setImage(id, url) {
  if (!has(id)) return;
  const src = String(url || '').trim();
  try {
    if (!src) {
      $w(id).hide();
      return;
    }
    $w(id).src = src;
    $w(id).show();
  } catch {
    /* kein Bild-Element */
  }
}

function showCurrent() {
  const items = aktiveReferenzen();
  if (!items.length) return;
  const item = items[index];
  setText('#refTitel', item.titel);
  setText('#refOrt', item.ort);
  setText('#refJahr', item.jahr);
  setText('#refText', item.text);
  setText('#refZaehler', `${index + 1} / ${items.length}`);
  setImage('#refBild', item.bild);
}

function go(step) {
  const items = aktiveReferenzen();
  if (!items.length) return;
  index = (index + step + items.length) % items.length;
  showCurrent();
}

export function bindReferences() {
  const items = aktiveReferenzen();
  if (!items.length) return;
  index = 0;
  showCurrent();

  if (has('#btnRefPrev')) {
    $w('#btnRefPrev').onClick(() => go(-1));
  }
  if (has('#btnRefNext')) {
    $w('#btnRefNext').onClick(() => go(1));
  }
}
