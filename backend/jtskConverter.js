// Převod souřadnic z českého systému S-JTSK na GPS (WGS84)
// API hasičů vrací gis1 a gis2 jako kladná čísla, ale skutečné S-JTSK souřadnice jsou záporné
// Originální aplikace je neguje: createPoint(-gis1, -gis2)

const proj4 = require('proj4');

// Definice souřadnicového systému S-JTSK (EPSG:5514, Krovak East North)
proj4.defs(
  'EPSG:5514',
  '+proj=krovak +lat_0=49.5 +lon_0=24.8333333333333 ' +
  '+alpha=30.2881397527778 +k=0.9999 +x_0=0 +y_0=0 ' +
  '+ellps=bessel +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56 ' +
  '+units=m +no_defs'
);

/**
 * Převede souřadnice z S-JTSK (gis1, gis2 z API hasičů) na GPS (lat, lng)
 * @param {string|number} gis1 - Y souřadnice v S-JTSK (uložená jako kladné číslo)
 * @param {string|number} gis2 - X souřadnice v S-JTSK (uložená jako kladné číslo)
 * @returns {{ lat: number, lng: number } | null}
 */
function jtskToWgs84(gis1, gis2) {
  if (!gis1 || !gis2) return null;
  try {
    // Negujeme hodnoty — API ukládá kladné, proj4 potřebuje záporné S-JTSK souřadnice
    const y = -Number(gis1); // Y (easting, osa západ-východ)
    const x = -Number(gis2); // X (northing, osa sever-jih)

    // proj4 vrací [zeměpisná délka, zeměpisná šířka]
    const [lng, lat] = proj4('EPSG:5514', 'WGS84', [y, x]);
    return { lat, lng };
  } catch (err) {
    console.error('Chyba při převodu souřadnic:', err.message);
    return null;
  }
}

module.exports = { jtskToWgs84 };
