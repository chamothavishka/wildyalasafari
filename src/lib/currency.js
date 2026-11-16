/**
 * Currency conversion for frontend display.
 * `lkrPerUnit` = how many Sri Lankan Rupees equal one unit of the currency.
 * These are indicative mock rates — replace with live rates if a backend is added.
 */
export const CURRENCIES = [
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰', lkrPerUnit: 1, decimals: 0 },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', lkrPerUnit: 300, decimals: 2 },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', lkrPerUnit: 325, decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', lkrPerUnit: 2.0, decimals: 0 },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', lkrPerUnit: 385, decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', lkrPerUnit: 195, decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', lkrPerUnit: 218, decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', lkrPerUnit: 340, decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', lkrPerUnit: 41.5, decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', lkrPerUnit: 3.55, decimals: 0 },
];

export const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code) {
  return CURRENCY_MAP[code] || CURRENCY_MAP.LKR;
}

/** Convert an LKR amount into the target currency, rounded to its display precision. */
export function convertFromLKR(amountLKR, code) {
  const c = getCurrency(code);
  const factor = 10 ** c.decimals;
  return Math.round((amountLKR / c.lkrPerUnit) * factor) / factor;
}

export function formatNumber(value, code) {
  const c = getCurrency(code);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
}

/** e.g. "LKR 45,000" or "USD 150.00" */
export function formatMoney(amountLKR, code = 'LKR') {
  return `${getCurrency(code).code} ${formatNumber(convertFromLKR(amountLKR, code), code)}`;
}

export function formatLKR(amount) {
  return `LKR ${amount.toLocaleString('en-US')}`;
}
