// Správa uživatelského nastavení oblasti
// Nastavení se ukládá do souboru settings.json na disku

const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Výchozí nastavení — celá Vysočina, žádný filtr
const VYCHOZI_NASTAVENI = {
  krajId: 108,
  krajNazev: 'Vysočina',
  okresId: null,
  okresNazev: null,
  obec: null,
};

function nactiNastaveni() {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    } catch {
      return { ...VYCHOZI_NASTAVENI };
    }
  }
  return { ...VYCHOZI_NASTAVENI };
}

function ulozNastaveni(nove) {
  const stare = nactiNastaveni();
  const aktualizovane = { ...stare, ...nove };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(aktualizovane, null, 2));
  return aktualizovane;
}

module.exports = { nactiNastaveni, ulozNastaveni };
