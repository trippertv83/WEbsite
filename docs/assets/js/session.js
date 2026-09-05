const KEY = 'ea_customer_session';
const ALLOWED_NEXT = /anfrage\.html|index\.html|leistungen\.html|kunde\.html/i;
const GITHUB_FOLDER = '/WEbsite/';

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

export function pagesHome() {
  if (/\.github\.io$/i.test(location.hostname)) {
    return location.origin + GITHUB_FOLDER;
  }
  return location.origin + location.pathname.replace(/[^/]+$/, '');
}

function fileOnly(next) {
  let rel = String(next || '').trim();
  if (!rel) return '';
  try {
    if (/^https?:/i.test(rel)) {
      const abs = new URL(rel);
      rel = abs.pathname + abs.search;
    }
  } catch {
    return '';
  }
  rel = rel.replace(/^\/WEbsite\//i, '').replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return '';
  return rel;
}

export function pageUrl(fileAndQuery) {
  const rel = fileOnly(fileAndQuery);
  if (!rel) return pagesHome();
  return new URL(rel, pagesHome()).href;
}

export function captureTarget(serviceId, cta) {
  if (cta === 'wizard') return 'index.html';
  return 'anfrage.html?id=' + encodeURIComponent(serviceId || '');
}

export function gateUrl(nextPath) {
  return pageUrl('kunde.html?next=' + encodeURIComponent(fileOnly(nextPath) || 'index.html'));
}

export function safeNextPath() {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return '';
  try {
    const url = new URL(fileOnly(next), pagesHome());
    if (url.origin !== location.origin) return '';
    if (!ALLOWED_NEXT.test(url.pathname)) return '';
    return url.href;
  } catch {
    return '';
  }
}
