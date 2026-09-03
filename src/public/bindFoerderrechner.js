/**
 * Förderrechner auf einer eigenen Wix-Seite.
 * HTML-Komponente: #htmlFoerderrechner
 * URL: https://trippertv83.github.io/WEbsite/foerderrechner.html
 * Höhe im Editor zuerst ca. 1600 px, passt sich per postMessage an.
 */

const URL = 'https://trippertv83.github.io/WEbsite/foerderrechner.html';

function exists(id) {
  try {
    const el = $w(id);
    return el && el.length !== 0 ? el : null;
  } catch {
    return null;
  }
}

export function bindFoerderrechner() {
  const box = exists('#htmlFoerderrechner') || exists('#htmlFoerder');
  if (!box) return;
  try {
    const src = String(box.src || '');
    if (!/foerderrechner\.html/i.test(src)) box.src = URL;
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
      if (!data || data.type !== 'FOERDER_HEIGHT') return;
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
