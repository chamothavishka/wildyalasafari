/**
 * Centralised safari pricing configuration and calculation.
 *
 * All prices are in LKR (the base currency). Every package card, the booking
 * summary and the payment section read from this single source of truth.
 *
 * Rules
 * - The jeep base price covers the jeep and the first adult.
 * - Each additional adult and each child aged 6–11 adds the listed amount.
 * - Children aged 1–5 are always free (but they still occupy a seat).
 * - A jeep carries a maximum of 6 people. Larger groups automatically get
 *   additional jeeps; each additional jeep adds that vehicle's base price.
 */

export const MAX_PER_JEEP = 6;
export const MAX_GROUP = 30; // larger groups are handled by enquiry

export const JEEPS = {
  hilux: {
    id: 'hilux',
    name: 'Toyota Hilux',
    tagline: 'Open-top 4x4 safari pickup',
  },
  cruiser: {
    id: 'cruiser',
    name: 'Land Cruiser',
    tagline: 'Classic 4x4 safari cruiser',
  },
};

export const SAFARI_PRICING = {
  morning: {
    hilux: { base: 32000, extraAdult: 13000, extraChild: 7500 },
    cruiser: { base: 37000, extraAdult: 13000, extraChild: 7500 },
  },
  evening: {
    hilux: { base: 32000, extraAdult: 13000, extraChild: 7500 },
    cruiser: { base: 37000, extraAdult: 13000, extraChild: 7500 },
  },
  fullday: {
    hilux: { base: 52000, extraAdult: 17000, extraChild: 10000 },
    cruiser: { base: 62000, extraAdult: 17000, extraChild: 10000 },
  },
};

export function getRates(safariId, jeepId) {
  const safari = SAFARI_PRICING[safariId];
  if (!safari) throw new Error(`Unknown safari type: ${safariId}`);
  const rates = safari[jeepId];
  if (!rates) throw new Error(`Unknown jeep category: ${jeepId}`);
  return rates;
}

export function jeepsRequired(totalPeople) {
  return Math.max(1, Math.ceil(totalPeople / MAX_PER_JEEP));
}

/** Clamp passenger counts to valid ranges (at least one adult, group cap). */
export function normalisePassengers({ adults = 1, children = 0, infants = 0 } = {}) {
  const a = Math.max(1, Math.floor(adults) || 1);
  const c = Math.max(0, Math.floor(children) || 0);
  const i = Math.max(0, Math.floor(infants) || 0);
  return { adults: a, children: c, infants: i };
}

/**
 * Calculate the full price breakdown in LKR.
 * @returns {{
 *   safariId: string, jeepId: string, adults: number, children: number, infants: number,
 *   totalPeople: number, jeeps: number, rates: object,
 *   baseCost: number, extraAdults: number, extraAdultCost: number,
 *   childCost: number, totalLKR: number
 * }}
 */
export function calculatePrice({ safariId, jeepId, adults, children, infants }) {
  const p = normalisePassengers({ adults, children, infants });
  const rates = getRates(safariId, jeepId);
  const totalPeople = p.adults + p.children + p.infants;
  const jeeps = jeepsRequired(totalPeople);
  const baseCost = jeeps * rates.base;
  const extraAdults = Math.max(0, p.adults - 1);
  const extraAdultCost = extraAdults * rates.extraAdult;
  const childCost = p.children * rates.extraChild;
  return {
    safariId,
    jeepId,
    ...p,
    totalPeople,
    jeeps,
    rates,
    baseCost,
    extraAdults,
    extraAdultCost,
    childCost,
    totalLKR: baseCost + extraAdultCost + childCost,
  };
}

/** Lowest possible price for a package (used for "From LKR …" labels). */
export function startingPrice(safariId) {
  return Math.min(...Object.values(SAFARI_PRICING[safariId]).map((r) => r.base));
}
