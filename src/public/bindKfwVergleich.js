/**
 * KfW-Vergleichsrechner auf einer eigenen Wix-Seite.
 * HTML-Komponente: #htmlKfwVergleich
 * URL: https://trippertv83.github.io/WEbsite/kfw-vergleich.html
 */

const URL = 'https://trippertv83.github.io/WEbsite/kfw-vergleich.html?v=20260903h';

function exists(id) {
  try {
    const el = $w(id);
    return el && el.length !== 0 ? el : null;
  } catch {
    return null;
  }
}

export function bindKfwVergleich() {
  const box = exists('#htmlKfwVergleich') || exists('#htmlKfw');
  if (!box) return;
  try {
    const src = String(box.src || '');
    if (!/kfw-vergleich\.html\?v=20260903h/i.test(src)) box.src = URL;
  } catch {
    /* */
  }
  if (typeof box.onMessage === 'function') {
    box.onMessage((event) => {
      let data = event?.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          data = null;
        }
      }
      if (!data || data.type !== 'KFW_HEIGHT') return;
      const h = Number(data.height);
      if (h > 400 && typeof box.height === 'object') {
        try {
          box.height = h + 24;
        } catch {
          /* */
        }
      }
    });
  }
}
