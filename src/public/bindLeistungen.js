/**
 * Leistungen auf HOME.
 * HTML-Komponente: #htmlLeistungen
 * URL: https://trippertv83.github.io/WEbsite/leistungen.html
 */

import { SERVICES } from 'public/services';

const URL = 'https://trippertv83.github.io/WEbsite/leistungen.html?v=20260905d';

function exists(id) {
  try {
    const el = $w(id);
    return el && el.length !== 0 ? el : null;
  } catch {
    return null;
  }
}

function htmlBox() {
  const named = exists('#htmlLeistungen') || exists('#htmlServices');
  if (named) return named;
  return null;
}

export function bindLeistungen() {
  const box = htmlBox();
  if (!box) return;
  try {
    box.src = URL;
  } catch {
    /* */
  }
  const send = () => {
    if (typeof box.postMessage === 'function') {
      box.postMessage(JSON.stringify({ type: 'LEISTUNGEN', items: SERVICES }));
    }
  };
  send();
  if (typeof box.onMessage === 'function') box.onMessage(send);
  setTimeout(send, 500);
  setTimeout(send, 1500);
}
