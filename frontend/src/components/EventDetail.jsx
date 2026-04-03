// Panel s detailem vybrané události — vyjede zdola jako drawer

import { useState, useEffect } from 'react';
import { nactiTechniku, nactiObrazky } from '../services/api';

// Mapování typId na emoji ikonu a barvu
const TYP_IKONY = {
  3100: { ikona: '🔥', barva: '#ffebee', text: '#cc2200' },
  3200: { ikona: '🚗', barva: '#fff3e0', text: '#e65100' },
  3400: { ikona: '☣️', barva: '#f3e5f5', text: '#6a1b9a' },
  3500: { ikona: '🔧', barva: '#e3f2fd', text: '#1565c0' },
  3550: { ikona: '🚑', barva: '#e8f5e9', text: '#2e7d32' },
  3700: { ikona: 'ℹ️', barva: '#f5f5f5', text: '#607d8b' },
  3800: { ikona: '🔔', barva: '#fff8e1', text: '#f57f17' },
};

const STAVY_AKTIVNI = new Set([210, 400, 410, 420, 430, 440, 500]);

function formatujCas(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('cs-CZ', {
    day: 'numeric', month: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function EventDetail({ udalost, onZavrit }) {
  const [technika, setTechnika] = useState(null);
  const [obrazky, setObrazky] = useState([]);
  const [podtypy, setPodtypy] = useState({});

  useEffect(() => {
    if (!udalost) return;
    setTechnika(null);
    setObrazky([]);

    nactiTechniku(udalost.id)
      .then(setTechnika)
      .catch(() => setTechnika([]));

    nactiObrazky(udalost.id)
      .then(setObrazky)
      .catch(() => setObrazky([]));
  }, [udalost?.id]);

  if (!udalost) return null;

  const styl = TYP_IKONY[udalost.typId] || TYP_IKONY[3700];
  const jeAktivni = STAVY_AKTIVNI.has(udalost.stavId);
  const adresa = [udalost.ulice, udalost.castObce !== udalost.obec && udalost.castObce]
    .filter(Boolean).join(', ');

  return (
    <>
      {/* Poloprůhledné pozadí — kliknutím zavřeme */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 499 }}
        onClick={onZavrit}
      />

      <div className="detail-panel">
        <div className="detail-tah" />

        {/* Záhlaví */}
        <div className="detail-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="udalost-ikona" style={{ background: styl.barva }}>
              {styl.ikona}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: styl.text }}>
                {udalost.typNazev}
              </div>
              {udalost.podtypNazev && (
                <div style={{ fontSize: 13, color: '#757575' }}>{udalost.podtypNazev}</div>
              )}
            </div>
            <button
              onClick={onZavrit}
              style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%',
                       width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
          <span className={`stav-odznak ${jeAktivni ? 'stav-aktivni' : 'stav-uzavrena'}`}>
            {jeAktivni ? '● Probíhá' : '✓ Ukončeno'}
          </span>
        </div>

        {/* Místo zásahu */}
        <div className="detail-sekce">
          <h3>Místo zásahu</h3>
          {adresa && (
            <div className="detail-radek">
              <span className="stitek">Adresa</span>
              <span>{adresa}</span>
            </div>
          )}
          <div className="detail-radek">
            <span className="stitek">Obec</span>
            <span>{udalost.obec}</span>
          </div>
          <div className="detail-radek">
            <span className="stitek">Okres</span>
            <span>{udalost.okres?.nazev}</span>
          </div>
          {udalost.ORP && (
            <div className="detail-radek">
              <span className="stitek">ORP</span>
              <span>{udalost.ORP}</span>
            </div>
          )}
          {udalost.silnice && (
            <div className="detail-radek">
              <span className="stitek">Silnice</span>
              <span>{udalost.silnice}</span>
            </div>
          )}
        </div>

        {/* Čas */}
        <div className="detail-sekce">
          <h3>Čas</h3>
          <div className="detail-radek">
            <span className="stitek">Ohlášení</span>
            <span>{formatujCas(udalost.casOhlaseni)}</span>
          </div>
          {udalost.casVzniku && (
            <div className="detail-radek">
              <span className="stitek">Vznik</span>
              <span>{formatujCas(udalost.casVzniku)}</span>
            </div>
          )}
        </div>

        {/* Popis pro média */}
        {udalost.poznamkaProMedia && (
          <div className="detail-sekce">
            <h3>Popis</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5 }}>{udalost.poznamkaProMedia}</p>
          </div>
        )}

        {/* Technika */}
        {technika === null ? (
          <div className="detail-sekce" style={{ color: '#999', fontSize: 13 }}>
            Načítám techniku…
          </div>
        ) : technika.length > 0 ? (
          <div className="detail-sekce">
            <h3>Vyslaná technika ({technika.length})</h3>
            {technika.map((t, i) => (
              <div key={i} className="technika-polozka">
                <div className="jednotka">{t.jednotka}</div>
                <div className="typ-vozidla">{t.typ} · {t.casOhlaseni}</div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Fotografie */}
        {obrazky.length > 0 && (
          <div className="detail-sekce">
            <h3>Fotografie</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {obrazky.map((o, i) => (
                <img
                  key={i}
                  src={o.url}
                  alt="Foto z místa"
                  style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '4/3' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Spodní odsazení pro bezpečnou zónu iPhonu */}
        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </div>
    </>
  );
}
