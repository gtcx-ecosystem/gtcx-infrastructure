/**
 * @fileoverview USSD Menu Engine
 *
 * Functional state machine with localization.
 * Each menu is a function (session, input) → { text, nextMenu?, action?, end? }
 */

// ---------------------------------------------------------------------------
// Localization dictionaries
// ---------------------------------------------------------------------------

const DICTIONARIES = {
  en: {
    welcome: 'Welcome to GTCX\n1. Prices\n2. Trade\n3. Wallet\n4. History\n5. Help\n0. Exit',
    selectCountry: 'Select country:\n1. Zimbabwe\n2. Zambia\n3. Kenya\n4. Nigeria\n0. Back',
    selectAction: 'Select action:\n1. Sell commodity\n2. Buy commodity\n3. Check trade status\n0. Back',
    enterPin: 'Enter your 4-digit PIN:',
    invalidPin: 'Incorrect PIN. {attempts} attempts remaining.',
    lockedOut: 'Account locked. Try again in {minutes} minutes.',
    invalidSelection: 'Invalid selection. Please try again.',
    sessionExpired: 'Session timed out. Dial *384# to restart.',
    goodbye: 'Thank you for using GTCX. Goodbye!',
    priceResult: '{commodity} ({country}): ${price}/tonne. Trend: {trend}',
    tradeInitiated: 'Trade T-{tradeId} initiated. {quantity}t {commodity} @ ${price}. Confirm? 1=Yes 0=No',
    tradeConfirmed: 'Trade T-{tradeId} confirmed. SMS receipt sent.',
    tradeCancelled: 'Trade cancelled.',
    help: 'GTCX Help:\n1. Prices — check commodity prices\n2. Trade — buy or sell\n3. Wallet — check balance\n4. History — past trades\n0. Back',
    walletBalance: 'Wallet balance: ${balance}\n1. Deposit\n2. Withdraw\n0. Back',
    historyHeader: 'Recent trades:\n',
    backOption: '\n0. Back',
  },
  sn: {
    // Shona
    welcome: 'Mauya kuGTCX\n1. Mitemo yematengero\n2. Kushambadzira\n3. Wallet\n4. Nhoroondo\n5. Rubatsiro\n0. Buda',
    selectCountry: 'Sarudza nyika:\n1. Zimbabwe\n2. Zambia\n3. Kenya\n4. Nigeria\n0. Kumbira',
    enterPin: 'Ipinza PIN yenumber 4:',
    invalidPin: 'PIN isina kushanda. {attempts} miedzo yasara.',
    lockedOut: 'Akaunti yakasungwa. Edzazve mushure memaminitsi {minutes}.',
    invalidSelection: 'Sarudzo isina kushanda. Edzazve.',
    goodbye: 'Ndatenda nekushandisa GTCX. Sara mushe!',
  },
  nd: {
    // Ndebele
    welcome: 'Siyalemukela kuGTCX\n1. Intengo\n2. Ukuthengisa\n3. I-Wallet\n4. Umlando\n5. Usizo\n0. Phuma',
    selectCountry: 'Khetha izwe:\n1. Zimbabwe\n2. Zambia\n3. Kenya\n4. Nigeria\n0. Emuva',
    enterPin: 'Faka i-PIN yakho enamadijithi ayi-4:',
    invalidPin: 'I-PIN ayilunganga. {attempts} izinzwa ezisele.',
    lockedOut: 'I-akhawunti ivalelwe. Zama futhi emva kwemizuzu engu-{minutes}.',
    goodbye: 'Siyabonga ngokusebenzisa i-GTCX. Hamba kahle!',
  },
  sw: {
    // Swahili
    welcome: 'Karibu GTCX\n1. Bei\n2. Biashara\n3. Wallet\n4. Historia\n5. Usaidizi\n0. Toka',
    selectCountry: 'Chagua nchi:\n1. Zimbabwe\n2. Zambia\n3. Kenya\n4. Nigeria\n0. Rudi',
    enterPin: 'Weka PIN yako ya tarakimu 4:',
    invalidPin: 'PIN si sahihi. {attempts} majaribio yaliyobaki.',
    lockedOut: 'Akaunti imefungwa. Jaribu tena baada ya dakika {minutes}.',
    goodbye: 'Asante kwa kutumia GTCX. Kwaheri!',
  },
  zu: {
    // Zulu
    welcome: 'Siyakwamukela kuGTCX\n1. Amanani\n2. Ukuhweba\n3. I-Wallet\n4. Umlando\n5. Usizo\n0. Phuma',
    selectCountry: 'Khetha izwe:\n1. Zimbabwe\n2. Zambia\n3. Kenya\n4. Nigeria\n0. Emuva',
    enterPin: 'Faka i-PIN yakho enamadijithi ayi-4:',
    invalidPin: 'I-PIN ayilunganga. {attempts} izinzwa ezisele.',
    lockedOut: 'I-akhawunti ivalelwe. Zama futhi emva kwemizuzu engu-{minutes}.',
    goodbye: 'Siyabonga ngokusebenzisa i-GTCX. Hamba kahle!',
  },
  fr: {
    // French
    welcome: 'Bienvenue sur GTCX\n1. Prix\n2. Commerce\n3. Portefeuille\n4. Historique\n5. Aide\n0. Quitter',
    selectCountry: 'Choisissez le pays:\n1. Zimbabwe\n2. Zambie\n3. Kenya\n4. Nigeria\n0. Retour',
    enterPin: 'Entrez votre code PIN a 4 chiffres:',
    invalidPin: 'PIN incorrect. {attempts} tentatives restantes.',
    lockedOut: 'Compte verrouille. Reessayez dans {minutes} minutes.',
    goodbye: 'Merci d\'avoir utilise GTCX. Au revoir!',
  },
};

function t(key, lang, vars = {}) {
  const dict = DICTIONARIES[lang] ?? DICTIONARIES.en;
  let text = dict[key] ?? DICTIONARIES.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

// ---------------------------------------------------------------------------
// Country / language resolution
// ---------------------------------------------------------------------------

const COUNTRY_DEFAULT_LANG = {
  ZW: 'sn',
  ZM: 'en',
  KE: 'sw',
  NG: 'en',
};

export function resolveLanguage(session, mnoCountry) {
  const profileLang = session?.['preferred-lang'];
  if (profileLang && DICTIONARIES[profileLang]) return profileLang;
  const countryLang = COUNTRY_DEFAULT_LANG[mnoCountry];
  if (countryLang && DICTIONARIES[countryLang]) return countryLang;
  return 'en';
}

// ---------------------------------------------------------------------------
// Menu definitions
// ---------------------------------------------------------------------------

const MENUS = {
  root(session, input, lang) {
    if (input === '0') {
      return { text: t('goodbye', lang), end: true };
    }
    if (input === '1') return { text: t('selectCountry', lang), nextMenu: 'prices-country' };
    if (input === '2') return { text: t('enterPin', lang), nextMenu: 'trade-pin' };
    if (input === '3') return { text: t('enterPin', lang), nextMenu: 'wallet-pin' };
    if (input === '4') return { text: t('enterPin', lang), nextMenu: 'history-pin' };
    if (input === '5') return { text: t('help', lang), nextMenu: 'help' };
    return { text: t('invalidSelection', lang) + '\n' + t('welcome', lang), nextMenu: 'root' };
  },

  'prices-country'(session, input, lang) {
    if (input === '0') return { text: t('welcome', lang), nextMenu: 'root' };
    const countries = ['', 'ZW', 'ZM', 'KE', 'NG'];
    const country = countries[Number(input)];
    if (!country) {
      return { text: t('invalidSelection', lang) + '\n' + t('selectCountry', lang), nextMenu: 'prices-country' };
    }
    return { text: t('selectAction', lang), nextMenu: 'prices-action', action: { type: 'set-country', country } };
  },

  'prices-action'(session, input, lang) {
    if (input === '0') return { text: t('selectCountry', lang), nextMenu: 'prices-country' };
    const commodities = ['', 'maize', 'wheat', 'soy', 'gold'];
    const commodity = commodities[Number(input)];
    if (!commodity) {
      return { text: t('invalidSelection', lang) + '\n' + t('selectAction', lang), nextMenu: 'prices-action' };
    }
    const country = session?.['selected-country'] ?? 'ZW';
    const price = getMockPrice(country, commodity);
    return {
      text: t('priceResult', lang, { commodity: capitalize(commodity), country, price: price.value, trend: price.trend }) + '\n0. Back',
      nextMenu: 'prices-action-result',
    };
  },

  'prices-action-result'(session, input, lang) {
    if (input === '0') return { text: t('selectAction', lang), nextMenu: 'prices-action' };
    return { text: t('invalidSelection', lang), nextMenu: 'prices-action-result' };
  },

  'trade-pin'(session, input, lang) {
    return { text: t('selectAction', lang), nextMenu: 'trade-action' };
  },

  'trade-action'(session, input, lang) {
    if (input === '0') return { text: t('welcome', lang), nextMenu: 'root' };
    const actions = ['', 'sell', 'buy', 'status'];
    const action = actions[Number(input)];
    if (!action) {
      return { text: t('invalidSelection', lang) + '\n' + t('selectAction', lang), nextMenu: 'trade-action' };
    }
    if (action === 'status') {
      return { text: 'Trade T-1234: Pending confirmation.\n0. Back', nextMenu: 'trade-status' };
    }
    return { text: t('selectCountry', lang), nextMenu: 'trade-country', action: { type: 'set-trade-action', action } };
  },

  'trade-country'(session, input, lang) {
    if (input === '0') return { text: t('selectAction', lang), nextMenu: 'trade-action' };
    const countries = ['', 'ZW', 'ZM', 'KE', 'NG'];
    const country = countries[Number(input)];
    if (!country) {
      return { text: t('invalidSelection', lang) + '\n' + t('selectCountry', lang), nextMenu: 'trade-country' };
    }
    return { text: 'Enter quantity (tonnes):', nextMenu: 'trade-qty', action: { type: 'set-trade-country', country } };
  },

  'trade-qty'(session, input, lang) {
    const qty = Number(input);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { text: t('invalidSelection', lang) + '\nEnter quantity (tonnes):', nextMenu: 'trade-qty' };
    }
    const country = session?.['trade-country'] ?? 'ZW';
    const commodity = 'maize'; // simplified
    const price = getMockPrice(country, commodity).value;
    const tradeId = generateTradeId();
    return {
      text: t('tradeInitiated', lang, { tradeId, quantity: qty, commodity, price }),
      nextMenu: 'trade-confirm',
      action: { type: 'set-trade-id', tradeId },
    };
  },

  'trade-confirm'(session, input, lang) {
    const tradeId = session?.['trade-id'] ?? '0000';
    if (input === '1') {
      return { text: t('tradeConfirmed', lang, { tradeId }), nextMenu: 'root', action: { type: 'clear-trade' } };
    }
    if (input === '0') {
      return { text: t('tradeCancelled', lang), nextMenu: 'root', action: { type: 'clear-trade' } };
    }
    return { text: t('invalidSelection', lang), nextMenu: 'trade-confirm' };
  },

  'trade-status'(session, input, lang) {
    if (input === '0') return { text: t('selectAction', lang), nextMenu: 'trade-action' };
    return { text: t('invalidSelection', lang), nextMenu: 'trade-status' };
  },

  'wallet-pin'(session, input, lang) {
    return { text: t('walletBalance', lang, { balance: '1,245.00' }), nextMenu: 'wallet-menu' };
  },

  'wallet-menu'(session, input, lang) {
    if (input === '0') return { text: t('welcome', lang), nextMenu: 'root' };
    if (input === '1') return { text: 'Deposit via M-Pesa/EcoCash agent.\n0. Back', nextMenu: 'wallet-deposit' };
    if (input === '2') return { text: 'Withdraw to registered mobile money.\n0. Back', nextMenu: 'wallet-withdraw' };
    return { text: t('invalidSelection', lang) + '\n' + t('walletBalance', lang, { balance: '1,245.00' }), nextMenu: 'wallet-menu' };
  },

  'wallet-deposit'(session, input, lang) {
    if (input === '0') return { text: t('walletBalance', lang, { balance: '1,245.00' }), nextMenu: 'wallet-menu' };
    return { text: t('invalidSelection', lang), nextMenu: 'wallet-deposit' };
  },

  'wallet-withdraw'(session, input, lang) {
    if (input === '0') return { text: t('walletBalance', lang, { balance: '1,245.00' }), nextMenu: 'wallet-menu' };
    return { text: t('invalidSelection', lang), nextMenu: 'wallet-withdraw' };
  },

  'history-pin'(session, input, lang) {
    const trades = ['T-1234: 10t maize @ $285', 'T-1235: 5t wheat @ $310'];
    return { text: t('historyHeader', lang) + trades.join('\n') + '\n0. Back', nextMenu: 'history-list' };
  },

  'history-list'(session, input, lang) {
    if (input === '0') return { text: t('welcome', lang), nextMenu: 'root' };
    return { text: t('invalidSelection', lang), nextMenu: 'history-list' };
  },

  help(session, input, lang) {
    if (input === '0') return { text: t('welcome', lang), nextMenu: 'root' };
    return { text: t('invalidSelection', lang) + '\n' + t('help', lang), nextMenu: 'help' };
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getMockPrice(country, commodity) {
  const base = { maize: 285, wheat: 310, soy: 420, gold: 65000 }[commodity] ?? 0;
  const variance = (country.charCodeAt(0) % 10) - 5;
  const value = base + variance;
  const trend = variance >= 0 ? `+${variance}%` : `${variance}%`;
  return { value: String(value), trend };
}

function generateTradeId() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function routeMenu(session, currentMenu, input, lang) {
  const handler = MENUS[currentMenu] ?? MENUS.root;
  const result = handler(session, input, lang);

  // Apply action mutations to session
  if (result.action) {
    const mutations = { ...session };
    switch (result.action.type) {
      case 'set-country':
        mutations['selected-country'] = result.action.country;
        break;
      case 'set-trade-action':
        mutations['trade-action'] = result.action.action;
        break;
      case 'set-trade-country':
        mutations['trade-country'] = result.action.country;
        break;
      case 'set-trade-id':
        mutations['trade-id'] = result.action.tradeId;
        break;
      case 'clear-trade':
        delete mutations['trade-action'];
        delete mutations['trade-country'];
        delete mutations['trade-id'];
        break;
      default:
        break;
    }
    result.sessionMutations = mutations;
  }

  return result;
}

export { t, DICTIONARIES };
