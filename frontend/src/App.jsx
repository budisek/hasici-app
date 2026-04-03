// Hlavní komponenta aplikace
// Spravuje navigaci (Mapa / Přehled / Nastavení) a načítání dat

import { useState, useEffect, useCallback } from 'react';
import Map from './components/Map';
import EventList from './components/EventList';
import EventDetail from './components/EventDetail';
import Settings from './components/Settings';
import { nactiUdalosti } from './services/api';

// Navigační ikony
const IkonaMapa = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);

const IkonaList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IkonaNastaveni = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const STAVY_AKTIVNI = new Set([210, 400, 410, 420, 430, 440, 500]);

export default function App() {
  const [stranka, setStranka] = useState('mapa'); // 'mapa' | 'prehled' | 'nastaveni'
  const [udalosti, setUdalosti] = useState([]);
  const [nacitani, setNacitani] = useState(true);
  const [vybrana, setVybrana] = useState(null);

  // Načteme události při startu a pak každé 2 minuty
  const obnovUdalosti = useCallback(async () => {
    try {
      const data = await nactiUdalosti();
      setUdalosti(data);
    } catch (err) {
      console.error('Chyba načítání:', err);
    } finally {
      setNacitani(false);
    }
  }, []);

  useEffect(() => {
    obnovUdalosti();
    const interval = setInterval(obnovUdalosti, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [obnovUdalosti]);

  // Otevření detailu z URL parametru (po kliknutí na notifikaci)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idZUrl = params.get('udalost');
    if (idZUrl && udalosti.length > 0) {
      const u = udalosti.find(u => String(u.id) === idZUrl);
      if (u) setVybrana(u);
    }
  }, [udalosti]);

  function vyberUdalost(u) {
    setVybrana(u);
    if (stranka === 'prehled') setStranka('mapa');
  }

  const pocetAktivnich = udalosti.filter(u => STAVY_AKTIVNI.has(u.stavId)).length;

  return (
    <>
      <div className="obsah">
        {/* Mapa */}
        {stranka === 'mapa' && (
          <div style={{ height: '100%', position: 'relative' }}>
            {nacitani ? (
              <div className="stav-zprava"><div className="ikona">🔄</div><div>Načítám mapu…</div></div>
            ) : (
              <Map udalosti={udalosti} vybrana={vybrana} onVybrat={setVybrana} />
            )}
            {vybrana && (
              <EventDetail udalost={vybrana} onZavrit={() => setVybrana(null)} />
            )}
          </div>
        )}

        {/* Přehled — seznam */}
        {stranka === 'prehled' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
              <h1>Přehled</h1>
              {pocetAktivnich > 0 && (
                <span className="pocet-odznak">{pocetAktivnich} aktivní</span>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <EventList
                udalosti={udalosti}
                nacitani={nacitani}
                vybrana={vybrana}
                onVybrat={vyberUdalost}
              />
            </div>
          </div>
        )}

        {/* Nastavení */}
        {stranka === 'nastaveni' && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
              <h1>Nastavení</h1>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Settings />
            </div>
          </div>
        )}
      </div>

      {/* Navigační lišta */}
      <nav className="nav-bar">
        <button className={`nav-item ${stranka === 'mapa' ? 'aktivni' : ''}`} onClick={() => setStranka('mapa')}>
          <IkonaMapa />
          Mapa
        </button>
        <button className={`nav-item ${stranka === 'prehled' ? 'aktivni' : ''}`} onClick={() => setStranka('prehled')}>
          <IkonaList />
          Přehled
          {pocetAktivnich > 0 && stranka !== 'prehled' && (
            <span style={{ position: 'absolute', top: 6, left: '62%',
                           background: '#cc2200', borderRadius: '50%',
                           width: 8, height: 8, display: 'block' }} />
          )}
        </button>
        <button className={`nav-item ${stranka === 'nastaveni' ? 'aktivni' : ''}`} onClick={() => setStranka('nastaveni')}>
          <IkonaNastaveni />
          Nastavení
        </button>
      </nav>
    </>
  );
}
