// Komunikace s API hasičů Vysočina
// Dokumentovaná API endpointy: http://webohled.hasici-vysocina.cz/udalosti/api/

const { jtskToWgs84 } = require('./jtskConverter');

const BASE_URL = 'http://webohled.hasici-vysocina.cz/udalosti/api';

// ID stavů pro "otevřené" (aktivní) události
const AKTIVNI_STAVY = [210, 400, 410, 420, 430, 440, 500];
// ID stavů pro všechny události (aktivní + uzavřené)
const VSECHNY_STAVY = [210, 400, 410, 420, 430, 440, 500, 510, 520, 600, 610, 620, 700, 710, 750, 760, 780, 800];

// Popisky typů událostí
const TYPY_NAZVY = {
  3100: 'POŽÁR',
  3200: 'DOPRAVNÍ NEHODA',
  3400: 'ÚNIK NEBEZPEČNÝCH LÁTEK',
  3500: 'TECHNICKÁ POMOC',
  3550: 'ZÁCHRANA OSOB A ZVÍŘAT',
  3600: 'FORMÁLNĚ ZALOŽENÁ UDÁLOST',
  3700: 'JINÁ UDÁLOST',
  3800: 'PLANÝ POPLACH',
  3900: 'TECHNOLOGICKÝ TEST',
  5000: 'UDÁLOST NA OBJEKT',
};

// Cache pro podtypy — načteme jednou a uložíme v paměti (nemění se)
let podtypyMapPromise = null;

function getPodtypyMap() {
  if (!podtypyMapPromise) {
    podtypyMapPromise = apiFetch('podtypy')
      .then(data => {
        const map = {};
        data.forEach(p => { map[p.id] = p.nazev; });
        return map;
      })
      .catch(() => ({})); // při chybě vrátíme prázdnou mapu
  }
  return podtypyMapPromise;
}

/**
 * Provede GET požadavek na API hasičů
 */
async function apiFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path}`);
  // Přidáme všechny parametry do URL (stavIds se přidá vícekrát pro každou hodnotu)
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${url}`);
  }
  return response.json();
}

/**
 * Přidá GPS souřadnice a názvy typů k události
 */
function obohatiUdalost(udalost, podtypyMap = {}) {
  const coords = jtskToWgs84(udalost.gis1, udalost.gis2);
  return {
    ...udalost,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    typNazev: TYPY_NAZVY[udalost.typId] || 'NEZNÁMÝ TYP',
    podtypNazev: podtypyMap[udalost.podtypId] || null,
  };
}

/**
 * Načte seznam událostí pro daný den a oblast
 * @param {object} params - { krajId, okresId, casOd, casDo, stavIds, typId }
 */
async function nactiUdalosti(params = {}) {
  const dnes = new Date();
  dnes.setHours(0, 0, 0, 0);
  const zitra = new Date(dnes);
  zitra.setDate(zitra.getDate() + 1);

  const queryParams = {
    krajId: params.krajId || 108, // výchozí: Vysočina
    casOd: (params.casOd || dnes).toISOString().replace(/\.\d{3}Z$/, ''),
    casDo: (params.casDo || zitra).toISOString().replace(/\.\d{3}Z$/, ''),
    stavIds: params.stavIds || VSECHNY_STAVY,
  };

  if (params.okresId) queryParams.okresId = params.okresId;
  if (params.typId) queryParams.typId = params.typId;

  // Načteme události a podtypy paralelně
  const [data, podtypyMap] = await Promise.all([
    apiFetch('', queryParams),
    getPodtypyMap(),
  ]);
  return data.map(u => obohatiUdalost(u, podtypyMap));
}

/**
 * Načte aktivní (probíhající) události
 */
async function nactiAktivniUdalosti(params = {}) {
  return nactiUdalosti({ ...params, stavIds: AKTIVNI_STAVY });
}

/**
 * Načte techniku (vozidla a jednotky) pro konkrétní událost
 */
async function nactiTechniku(idUdalosti) {
  return apiFetch(`udalosti/${idUdalosti}/technika`);
}

/**
 * Načte fotografie pro konkrétní událost
 */
async function nactiObrazky(idUdalosti) {
  return apiFetch(`udalosti/${idUdalosti}/obrazky`);
}

/**
 * Načte seznam okresů (volitelně filtrovaný dle krajId)
 */
async function nactiOkresy(krajId) {
  const data = await apiFetch('okresy');
  if (krajId) {
    return data.filter(o => o.krajId === krajId);
  }
  return data;
}

/**
 * Načte seznam typů událostí
 */
async function nactiTypy() {
  return apiFetch('typy');
}

/**
 * Načte seznam podtypů událostí
 */
async function nactiPodtypy() {
  return apiFetch('podtypy');
}

module.exports = {
  nactiUdalosti,
  nactiAktivniUdalosti,
  nactiTechniku,
  nactiObrazky,
  nactiOkresy,
  nactiTypy,
  nactiPodtypy,
  AKTIVNI_STAVY,
  VSECHNY_STAVY,
};
