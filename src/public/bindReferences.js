/**
 * Füllt Referenzen auf der aktuellen Seite, falls die Elemente existieren.
 * Daten stehen in public/references.js – dort bearbeiten.
 */

import {
  aktiveReferenzen,
  referenzById,
  referenzenAlsText,
} from 'public/references';

function has(id) {
  try {
    const el = $w(id);
    return Boolean(el && el.length !== 0);
  } catch {
    return false;
  }
}

function setText(id, value) {
  if (!has(id) || value == null) return;
  try {
    $w(id).text = String(value);
  } catch {
    try {
      $w(id).html = `<p>${String(value).replace(/\n/g, '<br />')}</p>`;
    } catch {
      /* Element nimmt keinen Text */
    }
  }
}

function bindRepeater() {
  if (!has('#repeaterReferenzen')) return;
  const items = aktiveReferenzen().map((item, index) => ({
    _id: item.id || `ref-${index}`,
    ...item,
  }));
  $w('#repeaterReferenzen').data = items;
  $w('#repeaterReferenzen').onItemReady(($item, itemData) => {
    const set = (id, value) => {
      try {
        $item(id).text = String(value || '');
      } catch {
        /* Element fehlt im Repeater */
      }
    };
    set('#refTitel', itemData.titel);
    set('#refOrt', itemData.ort);
    set('#refJahr', itemData.jahr);
    set('#refText', itemData.text);
  });
}

export function bindReferences(pageId) {
  bindRepeater();
  setText('#textReferenzen', referenzenAlsText());

  const current = pageId ? referenzById(pageId) : null;
  if (!current) return;
  setText('#refTitel', current.titel);
  setText('#refOrt', current.ort);
  setText('#refJahr', current.jahr);
  setText('#refText', current.text);
}
