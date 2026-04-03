// Hlavní server aplikace
// Express HTTP server — obsluhuje API pro frontend a zprostředkovává data z API hasičů

const express = require('express');
const cors = require('cors');
const path = require('path');

const { nactiUdalosti, nactiAktivniUdalosti, nactiTechniku, nactiObrazky, nactiOkresy, nactiTypy, nactiPodtypy } = require('./hasiciApi');
const { vapidKeys, pridejSubscription } = require('./pushService');
const { spustHlidace, aktualizujNastaveni } = require('./eventWatcher');
const { nactiNastaveni, ulozNastaveni } = require('./settings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// V produkci servírujeme sestavený frontend ze složky ../frontend/dist
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ─── API ENDPOINTY ──────────────────────────────────────────────────────────

// Vrátí aktivní události (jen probíhající zásahy)
app.get('/api/udalosti/aktivni', async (req, res) => {
  try {
    const nastaveni = nactiNastaveni();
    const udalosti = await nactiAktivniUdalosti({
      krajId: nastaveni.krajId,
      okresId: nastaveni.okresId,
    });
    res.json(udalosti);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vrátí všechny dnešní události
app.get('/api/udalosti', async (req, res) => {
  try {
    const nastaveni = nactiNastaveni();
    const udalosti = await nactiUdalosti({
      krajId: nastaveni.krajId,
      okresId: nastaveni.okresId,
    });
    res.json(udalosti);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vrátí techniku (vozidla) pro konkrétní událost
app.get('/api/udalosti/:id/technika', async (req, res) => {
  try {
    const technika = await nactiTechniku(req.params.id);
    res.json(technika);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vrátí fotografie pro konkrétní událost
app.get('/api/udalosti/:id/obrazky', async (req, res) => {
  try {
    const obrazky = await nactiObrazky(req.params.id);
    res.json(obrazky);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Číselníky (typy událostí, okresy) — pro nastavení filtrů
app.get('/api/typy', async (req, res) => {
  try {
    res.json(await nactiTypy());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/podtypy', async (req, res) => {
  try {
    res.json(await nactiPodtypy());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/okresy', async (req, res) => {
  try {
    const krajId = req.query.krajId ? Number(req.query.krajId) : 108;
    res.json(await nactiOkresy(krajId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Nastavení oblasti
app.get('/api/settings', (req, res) => {
  res.json(nactiNastaveni());
});

app.post('/api/settings', (req, res) => {
  try {
    const aktualizovane = ulozNastaveni(req.body);
    // Synchronizujeme hlídač s novým nastavením
    aktualizujNastaveni(aktualizovane);
    res.json(aktualizovane);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Push notifikace — veřejný klíč pro subscription v prohlížeči
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Diagnostika — počet přihlášených zařízení a zdroj VAPID klíčů
app.get('/api/diagnostics', (req, res) => {
  const fs = require('fs');
  const subsFile = require('path').join(__dirname, 'subscriptions.json');
  const subs = fs.existsSync(subsFile)
    ? JSON.parse(fs.readFileSync(subsFile, 'utf8'))
    : [];
  res.json({
    subscriptions: subs.length,
    vapidSource: process.env.VAPID_PUBLIC_KEY ? 'env' : 'file/generated',
    publicKeyPrefix: vapidKeys.publicKey.slice(0, 12) + '...',
  });
});

// Test — odešle zkušební notifikaci na všechna přihlášená zařízení
app.post('/api/test-notification', async (req, res) => {
  const { posliNotifikaci } = require('./pushService');
  try {
    await posliNotifikaci({
      typNazev: 'TESTOVACÍ NOTIFIKACE',
      podtypNazev: 'Vše funguje!',
      obec: 'Hasičská aplikace',
      okres: { nazev: 'Vysočina' },
      id: 0,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Push notifikace — uložení subscription ze zařízení
app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Neplatná subscription' });
  }
  const prihlaseno = pridejSubscription(subscription);
  res.json({ success: true, nove: prihlaseno });
});

// Fallback pro React Router — vrátí index.html pro všechny neznámé cesty
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ─── START ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚒 Hasičský server běží na http://localhost:${PORT}`);
  console.log(`📡 API dostupné na http://localhost:${PORT}/api/\n`);
  spustHlidace();
});
