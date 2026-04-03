// Správa push notifikací
// Používá Web Push API (VAPID) pro zasílání notifikací do prohlížeče/iPhone

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, 'vapid-keys.json');
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');

// Načteme nebo vygenerujeme VAPID klíče
// Priorita: proměnné prostředí (Railway) → soubor na disku → vygenerovat nové
function initVapidKeys() {
  let keys;

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    // Produkce (Railway) — klíče jsou v proměnných prostředí
    keys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
    console.log('🔑 VAPID klíče načteny z proměnných prostředí');
  } else if (fs.existsSync(KEYS_FILE)) {
    // Lokální vývoj — klíče jsou v souboru
    keys = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    console.log('🔑 VAPID klíče načteny ze souboru');
  } else {
    // První spuštění — vygenerujeme a uložíme
    keys = webpush.generateVAPIDKeys();
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    console.log('✅ Vygenerovány nové VAPID klíče (ulož je do Railway proměnných prostředí!)');
  }

  webpush.setVapidDetails('mailto:hasici-app@localhost', keys.publicKey, keys.privateKey);
  return keys;
}

// Načteme uložené subscriptions (přihlášené přístroje)
function nactiSubscriptions() {
  if (fs.existsSync(SUBS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

// Uložíme subscriptions na disk
function ulozSubscriptions(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

// Přidáme novou subscription (z prohlížeče/iPhone)
function pridejSubscription(subscription) {
  const subs = nactiSubscriptions();
  // Zabráníme duplicitám podle endpoint URL
  const existuje = subs.some(s => s.endpoint === subscription.endpoint);
  if (!existuje) {
    subs.push(subscription);
    ulozSubscriptions(subs);
    console.log('📱 Nové zařízení přihlášeno k notifikacím');
  }
  return !existuje;
}

// Odebereme neplatnou subscription
function odeberSubscription(endpoint) {
  const subs = nactiSubscriptions();
  const filtered = subs.filter(s => s.endpoint !== endpoint);
  ulozSubscriptions(filtered);
}

/**
 * Odešle push notifikaci o nové události na všechna přihlášená zařízení
 * @param {object} udalost - data události z API
 */
async function posliNotifikaci(udalost) {
  const subs = nactiSubscriptions();
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: udalost.typNazev || 'Nová událost',
    body: [
      udalost.podtypNazev,
      udalost.obec,
      udalost.okres?.nazev,
    ].filter(Boolean).join(' • '),
    tag: `udalost-${udalost.id}`,  // zabrání duplicitním notifikacím
    data: { udalostId: udalost.id },
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription vypršela nebo je neplatná — odebereme ji
        console.log('🗑️ Odebírám neplatnou subscription:', sub.endpoint.slice(-20));
        odeberSubscription(sub.endpoint);
      } else {
        console.error('Chyba při odesílání notifikace:', err.message);
      }
    }
  }
}

const vapidKeys = initVapidKeys();

module.exports = {
  vapidKeys,
  pridejSubscription,
  posliNotifikaci,
};
