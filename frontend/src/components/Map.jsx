// Mapa s vyznačenými událostmi
// Používá Leaflet + OpenStreetMap (zdarma)

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

const STRED_VYSOCINY = [49.4, 15.6]; // geografický střed kraje Vysočina

// Barvy markerů podle typu události
const TYP_BARVY = {
  3100: '#cc2200', // požár — červená
  3200: '#e65100', // dopravní nehoda — oranžová
  3400: '#6a1b9a', // únik látek — fialová
  3500: '#1565c0', // technická pomoc — modrá
  3550: '#2e7d32', // záchrana osob — zelená
  3700: '#607d8b', // jiná — šedá
  3800: '#f57f17', // planý poplach — žlutá
};

const STAVY_AKTIVNI = new Set([210, 400, 410, 420, 430, 440, 500]);

// Komponenta, která přesunutí mapy na vybranou událost
function PosunNaUdalost({ udalost }) {
  const mapa = useMap();
  useEffect(() => {
    if (udalost?.lat && udalost?.lng) {
      mapa.flyTo([udalost.lat, udalost.lng], 14, { duration: 0.8 });
    }
  }, [udalost?.id]);
  return null;
}

export default function Map({ udalosti, vybrana, onVybrat }) {
  const udalostiSKoord = (udalosti || []).filter(u => u.lat && u.lng);

  return (
    <MapContainer
      center={STRED_VYSOCINY}
      zoom={9}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      {/* OpenStreetMap podkladová mapa */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />

      {/* Přesun při výběru události */}
      <PosunNaUdalost udalost={vybrana} />

      {/* Markery událostí */}
      {udalostiSKoord.map((u) => {
        const jeAktivni = STAVY_AKTIVNI.has(u.stavId);
        const jeVybrana = vybrana?.id === u.id;
        const barva = TYP_BARVY[u.typId] || '#607d8b';

        return (
          <CircleMarker
            key={u.id}
            center={[u.lat, u.lng]}
            radius={jeVybrana ? 14 : jeAktivni ? 10 : 7}
            pathOptions={{
              fillColor: barva,
              fillOpacity: jeAktivni ? 0.9 : 0.5,
              color: jeVybrana ? '#ffffff' : barva,
              weight: jeVybrana ? 3 : jeAktivni ? 2 : 1,
            }}
            eventHandlers={{ click: () => onVybrat(u) }}
          >
            <Popup>
              <strong>{u.typNazev}</strong><br />
              {u.obec}{u.ulice ? `, ${u.ulice}` : ''}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
