// Seznam dnešních událostí — scrollovatelný, kliknutím otevře detail

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
  if (!iso) return '';
  const d = new Date(iso);
  const nyni = new Date();
  const diff = nyni - d;
  const minuty = Math.floor(diff / 60000);

  if (minuty < 1) return 'před chvílí';
  if (minuty < 60) return `před ${minuty} min`;
  const hodiny = Math.floor(minuty / 60);
  if (hodiny < 24) return `před ${hodiny} h`;
  return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function EventList({ udalosti, nacitani, vybrana, onVybrat }) {
  if (nacitani) {
    return (
      <div className="stav-zprava">
        <div className="ikona">🔄</div>
        <div>Načítám události…</div>
      </div>
    );
  }

  if (!udalosti || udalosti.length === 0) {
    return (
      <div className="stav-zprava">
        <div className="ikona">✅</div>
        <div style={{ fontWeight: 600 }}>Žádné události dnes</div>
        <div>V nastavené oblasti nejsou žádné dnešní zásahy.</div>
      </div>
    );
  }

  // Seřadíme — aktivní napřed, pak podle času
  const serazene = [...udalosti].sort((a, b) => {
    const aAktivni = STAVY_AKTIVNI.has(a.stavId) ? 0 : 1;
    const bAktivni = STAVY_AKTIVNI.has(b.stavId) ? 0 : 1;
    if (aAktivni !== bAktivni) return aAktivni - bAktivni;
    return new Date(b.casOhlaseni) - new Date(a.casOhlaseni);
  });

  return (
    <div className="seznam">
      {serazene.map((u) => {
        const styl = TYP_IKONY[u.typId] || TYP_IKONY[3700];
        const jeAktivni = STAVY_AKTIVNI.has(u.stavId);
        const jeVybrana = vybrana?.id === u.id;

        return (
          <div
            key={u.id}
            className="udalost-karta"
            style={jeVybrana ? { background: '#fff5f5', borderLeft: '3px solid #cc2200' } : {}}
            onClick={() => onVybrat(u)}
          >
            <div
              className="udalost-ikona"
              style={{ background: styl.barva }}
            >
              {styl.ikona}
            </div>

            <div className="udalost-info">
              <div className="udalost-typ" style={{ color: styl.text }}>
                {u.typNazev}
                {jeAktivni && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: '#e8f5e9',
                                  color: '#2e7d32', padding: '1px 5px', borderRadius: 8 }}>
                    PROBÍHÁ
                  </span>
                )}
              </div>
              {u.podtypNazev && (
                <div className="udalost-podtyp">{u.podtypNazev}</div>
              )}
              <div className="udalost-lokace">
                📍 {u.obec}{u.ulice ? `, ${u.ulice}` : ''} · {u.okres?.nazev}
              </div>
            </div>

            <div className="udalost-cas">
              {formatujCas(u.casOhlaseni)}
            </div>
          </div>
        );
      })}
      <div style={{ height: 16 }} />
    </div>
  );
}
