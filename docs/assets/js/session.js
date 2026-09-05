const KEY = 'ea_customer_session';

const ALLOWED_NEXT = /anfrage\.html|index\.html|leistungen\.html|kunde\.html/i;

export function saveSession(data) {
  const prev = loadSession() || {};
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...prev,
      token: data.sessionToken || data.token || prev.token,
      email: data.email || prev.email || '',
      sevdeskCustomerId: data.sevdeskCustomerId || prev.sevdeskCustomerId || '',
      customerNumber: data.customerNumber || prev.customerNumber || '',
      name: data.customerName || data.name || prev.name || '',
      phone: data.phone || prev.phone || '',
      strasse: data.strasse || prev.strasse || '',
      hausnummer: data.hausnummer || prev.hausnummer || '',
      plz: data.plz || prev.plz || '',
      ort: data.ort || prev.ort || '',
      customerType: data.customerType || prev.customerType || '',
      companyName: data.companyName || prev.companyName || '',
      firstName: data.firstName || prev.firstName || '',
      lastName: data.lastName || prev.lastName || '',
    })
  );
}

export function loadSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || !raw.token) return null;
    return raw;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function captureTarget(serviceId, cta) {
  if (cta === 'wizard') return 'index.html';
  return 'anfrage.html?id=' + encodeURIComponent(serviceId || '');
}

export function gateUrl(nextPath) {
  return 'kunde.html?next=' + encodeURIComponent(nextPath || 'index.html');
}

export function safeNextPath() {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return '';
  try {
    const url = new URL(next, location.origin);
    if (url.origin !== location.origin) return '';
    if (!ALLOWED_NEXT.test(url.pathname)) return '';
    return url.pathname + url.search;
  } catch {
    return '';
  }
}
