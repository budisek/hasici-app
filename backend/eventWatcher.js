// Hlídač nových událostí
// Každé 2 minuty zkontroluje API hasičů a pošle notifikaci, pokud přibyla nová událost v nastavené oblasti

const { nactiAktivniUdalosti } = require('./hasiciApi');
const { posliNotifikaci } = require('./pushService');

// ID událostí, které jsme při posledním dotazu viděli
let znameIdUdalosti = new Set();
let posledniKontrolaOk = true;

// Nastavení oblasti (synchronizované s settings.js)
let aktualniNastaveni = {
  krajId: 108,     // Vysočina
  okresId: null,   // všechny okresy
  obec: null,      // všechny obce
};

/**
 * Aktualizuje nastavení oblasti při změně v settings.js
 */
function aktualizujNastaveni(nove) {
  aktualniNastaveni = { ...aktualniNastaveni, ...nove };
}

/**
 * Zkontroluje, zda událost spadá do nastavené oblasti
 * (filtrování na obec probíhá na naší straně, API filtruje jen po okresy)
 */
function jeVNastaveneOblasti(udalost) {
  if (aktualniNastaveni.obec) {
    const hledanaObec = aktualniNastaveni.obec.toLowerCase().trim();
    const obecUdalosti = (udalost.obec || '').toLowerCase().trim();
    const castObce = (udalost.castObce || '').toLowerCase().trim();
    return obecUdalosti.includes(hledanaObec) || castObce.includes(hledanaObec);
  }
  return true; // Pokud obec není nastavena, bereme vše (okres/kraj filtruje API)
}

/**
 * Jedna kontrola nových událostí
 */
async function zkontrolujUdalosti() {
  try {
    const params = {
      krajId: aktualniNastaveni.krajId,
      okresId: aktualniNastaveni.okresId || undefined,
    };

    const udalosti = await nactiAktivniUdalosti(params);
    const novaIds = new Set(udalosti.map(u => u.id));

    // Nové události = ty, které v minulé kontrole nebyly
    const noveUdalosti = udalosti.filter(u =>
      !znameIdUdalosti.has(u.id) && jeVNastaveneOblasti(u)
    );

    if (noveUdalosti.length > 0) {
      console.log(`🚒 ${noveUdalosti.length} nová událost(í) v oblasti:`,
        noveUdalosti.map(u => `${u.typNazev} - ${u.obec}`).join(', ')
      );
      for (const udalost of noveUdalosti) {
        await posliNotifikaci(udalost);
      }
    }

    znameIdUdalosti = novaIds;

    if (!posledniKontrolaOk) {
      console.log('✅ Kontrola obnovena po chybě');
      posledniKontrolaOk = true;
    }
  } catch (err) {
    if (posledniKontrolaOk) {
      console.error('❌ Chyba při kontrole událostí:', err.message);
      posledniKontrolaOk = false;
    }
  }
}

/**
 * Spustí opakovanou kontrolu každé 2 minuty
 */
function spustHlidace() {
  console.log('👀 Hlídač událostí spuštěn (interval: 2 minuty)');

  // Okamžitá první kontrola pro naplnění znameIdUdalosti (bez notifikací)
  nactiAktivniUdalosti({ krajId: aktualniNastaveni.krajId })
    .then(udalosti => {
      znameIdUdalosti = new Set(udalosti.map(u => u.id));
      console.log(`📋 Inicializováno: ${znameIdUdalosti.size} aktivních událostí`);
    })
    .catch(err => console.error('Chyba při inicializaci hlídače:', err.message));

  // Opakovaná kontrola každé 2 minuty
  setInterval(zkontrolujUdalosti, 2 * 60 * 1000);
}

module.exports = { spustHlidace, aktualizujNastaveni };
