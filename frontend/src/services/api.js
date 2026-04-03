// Komunikace frontendu s naším backendem

const BASE = '/api';

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Chyba ${res.status}: ${path}`);
  return res.json();
}

// Události
export const nactiUdalosti = () => apiFetch('/udalosti');
export const nactiAktivniUdalosti = () => apiFetch('/udalosti/aktivni');
export const nactiTechniku = (id) => apiFetch(`/udalosti/${id}/technika`);
export const nactiObrazky = (id) => apiFetch(`/udalosti/${id}/obrazky`);

// Číselníky
export const nactiOkresy = () => apiFetch('/okresy?krajId=108');
export const nactiTypy = () => apiFetch('/typy');

// Nastavení
export const nactiNastaveni = () => apiFetch('/settings');
export const ulozNastaveni = (data) =>
  fetch(`${BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => r.json());

// Push notifikace
export const nactiVapidKey = () =>
  apiFetch('/vapid-public-key').then((d) => d.publicKey);

export const ulozSubscription = (subscription) =>
  fetch(`${BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  }).then((r) => r.json());

/**
 * Přihlásí toto zařízení k push notifikacím
 * Vrací true pokud bylo úspěšné, false nebo chybovou zprávu jinak
 */
export async function prihlasKNotifikacim() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Váš prohlížeč nepodporuje push notifikace.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notifikace nebyly povoleny.');
  }

  const registration = await navigator.serviceWorker.ready;
  const vapidPublicKey = await nactiVapidKey();

  // Převedeme VAPID klíč z base64 na Uint8Array
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  await ulozSubscription(subscription);
  return true;
}

// Pomocná funkce pro převod VAPID klíče
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
