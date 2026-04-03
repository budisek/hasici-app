// Obrazovka nastavení — výběr oblasti a správa push notifikací

import { useState, useEffect } from 'react';
import { nactiNastaveni, ulozNastaveni, nactiOkresy, prihlasKNotifikacim } from '../services/api';

// Okresy Vysočiny s jejich ID
const OKRESY_VYSOCINY = [
  { id: null, nazev: 'Celá Vysočina' },
  { id: 3601, nazev: 'Havlíčkův Brod' },
  { id: 3707, nazev: 'Jihlava' },
  { id: 3304, nazev: 'Pelhřimov' },
  { id: 3710, nazev: 'Třebíč' },
  { id: 3714, nazev: 'Žďár nad Sázavou' },
];

export default function Settings() {
  const [nastaveni, setNastaveni] = useState(null);
  const [ukladani, setUkladani] = useState(false);
  const [notifStav, setNotifStav] = useState('');
  const [notifChyba, setNotifChyba] = useState('');
  const [testStav, setTestStav] = useState('');

  useEffect(() => {
    nactiNastaveni().then(setNastaveni).catch(() => {});
  }, []);

  async function uloz(zmeny) {
    const nove = { ...nastaveni, ...zmeny };
    setNastaveni(nove);
    setUkladani(true);
    try {
      await ulozNastaveni(nove);
    } finally {
      setUkladani(false);
    }
  }

  async function posliTestNotifikaci() {
    setTestStav('Odesílám…');
    try {
      const r = await fetch('/api/test-notification', { method: 'POST' });
      const d = await r.json();
      setTestStav(d.success ? '✅ Testovací notifikace odeslána!' : '❌ ' + d.error);
    } catch {
      setTestStav('❌ Nepodařilo se odeslat');
    }
    setTimeout(() => setTestStav(''), 4000);
  }

  async function prihlasNotifikace() {
    setNotifStav('');
    setNotifChyba('');
    try {
      await prihlasKNotifikacim();
      setNotifStav('✅ Notifikace jsou zapnuté! Teď přidej aplikaci na plochu iPhonu.');
    } catch (err) {
      setNotifChyba(err.message);
    }
  }

  if (!nastaveni) {
    return <div className="stav-zprava"><div>Načítám nastavení…</div></div>;
  }

  return (
    <div className="seznam" style={{ background: '#f5f5f5' }}>

      {/* Oblast zásahů */}
      <div style={{ padding: '20px 16px 8px', fontSize: 13, fontWeight: 600,
                    color: '#757575', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Oblast zásahů
      </div>

      <div className="nastaveni-sekce">
        {/* Kraj — pevně Vysočina */}
        <div className="nastaveni-radek">
          <label>Kraj</label>
          <span style={{ fontSize: 15, color: '#999' }}>Vysočina</span>
        </div>

        {/* Výběr okresu */}
        <div className="nastaveni-radek">
          <label>Okres</label>
          <select
            value={nastaveni.okresId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              const okres = OKRESY_VYSOCINY.find(o => String(o.id) === val);
              uloz({
                okresId: val === '' ? null : Number(val),
                okresNazev: okres?.nazev || null,
                obec: null, // při změně okresu vynulujeme obec
              });
            }}
          >
            {OKRESY_VYSOCINY.map((o) => (
              <option key={o.id ?? 'vse'} value={o.id ?? ''}>
                {o.nazev}
              </option>
            ))}
          </select>
        </div>

        {/* Filtr na obec */}
        <div className="nastaveni-radek">
          <label>Obec</label>
          <input
            type="text"
            placeholder={nastaveni.okresId ? 'Např. Jihlava' : 'Nejdříve vyber okres'}
            disabled={!nastaveni.okresId}
            value={nastaveni.obec ?? ''}
            onChange={(e) => uloz({ obec: e.target.value || null })}
          />
        </div>
      </div>

      {/* Popis aktuálního filtru */}
      <div style={{ padding: '4px 16px 16px', fontSize: 13, color: '#757575' }}>
        {ukladani ? '💾 Ukládám…' : (
          <>
            Hlídáš: <strong>
              {nastaveni.obec
                ? `${nastaveni.obec}, ${nastaveni.okresNazev || 'Vysočina'}`
                : nastaveni.okresNazev || 'celá Vysočina'}
            </strong>
          </>
        )}
      </div>

      {/* Push notifikace */}
      <div style={{ padding: '8px 16px 8px', fontSize: 13, fontWeight: 600,
                    color: '#757575', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Push notifikace
      </div>

      <div className="nastaveni-sekce">
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: 14, color: '#424242', marginBottom: 16, lineHeight: 1.5 }}>
            Notifikace fungují, pokud aplikaci přidáš na plochu iPhonu
            (tlačítko Sdílet → Přidat na plochu).
          </p>

          <button className="btn btn-cervena" onClick={prihlasNotifikace}>
            🔔 Zapnout notifikace na tomto zařízení
          </button>

          {notifStav && (
            <p style={{ marginTop: 12, fontSize: 14, color: '#2e7d32', lineHeight: 1.5 }}>
              {notifStav}
            </p>
          )}
          {notifChyba && (
            <p style={{ marginTop: 12, fontSize: 14, color: '#cc2200', lineHeight: 1.5 }}>
              ❌ {notifChyba}
            </p>
          )}

          <button
            className="btn btn-outline"
            style={{ marginTop: 10 }}
            onClick={posliTestNotifikaci}
          >
            🔔 Odeslat testovací notifikaci
          </button>
          {testStav && (
            <p style={{ marginTop: 8, fontSize: 14, color: '#424242' }}>{testStav}</p>
          )}
        </div>
      </div>

      {/* Informace o aplikaci */}
      <div style={{ padding: '16px', fontSize: 12, color: '#bdbdbd', textAlign: 'center' }}>
        Data: HZS Vysočina · Aktualizace každé 2 minuty
      </div>
    </div>
  );
}
