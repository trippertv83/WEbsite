const KEY = 'ea_customer_session';

export function saveSession(data) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      token: data.sessionToken || data.token,
      email: data.email || '',
      sevdeskCustomerId: data.sevdeskCustomerId || '',
      customerNumber: data.customerNumber || '',
      name: data.customerName || data.name || '',
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

export function safeNextPath() {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return '';
  try {
    const url = new URL(next, location.origin);
    if (url.origin !== location.origin) return '';
    if (!/anfrage\.html|index\.html|leistungen\.html/i.test(url.pathname)) return '';
    return url.pathname + url.search;
  } catch {
    return '';
  }
}
