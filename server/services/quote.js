/**
 * Server-side price calculation. It imports the website's OWN pricing module, so the
 * server and the browser can never disagree about a price. Nothing the browser sends
 * about prices is trusted — only the selection (safari, jeep, passengers, currency).
 */
import { calculatePrice, MAX_GROUP, JEEPS } from '../../src/lib/pricing.js';
import { convertFromLKR, getCurrency } from '../../src/lib/currency.js';
import { PACKAGE_MAP } from '../../src/data/content.js';
import { badRequest } from '../utils/errors.js';

export const BILLING_CURRENCIES = ['USD', 'LKR'];

export function buildQuote({ safariId, jeepId, adults, children = 0, infants = 0, billingCurrency = 'USD' }) {
  const pkg = PACKAGE_MAP[safariId];
  if (!pkg) throw badRequest('Unknown safari type.', 'INVALID_SAFARI');
  if (!JEEPS[jeepId]) throw badRequest('Unknown jeep type.', 'INVALID_JEEP');
  if (!BILLING_CURRENCIES.includes(billingCurrency)) throw badRequest('Unsupported billing currency.', 'INVALID_CURRENCY');
  const total = adults + children + infants;
  if (total > MAX_GROUP) throw badRequest(`Groups of more than ${MAX_GROUP} guests must be arranged with our team.`, 'GROUP_TOO_LARGE');

  const price = calculatePrice({ safariId, jeepId, adults, children, infants });
  const currency = getCurrency(billingCurrency);
  const amount = convertFromLKR(price.totalLKR, billingCurrency);
  return {
    safari: { id: pkg.id, name: pkg.name, time: pkg.time },
    jeep: { id: jeepId, name: JEEPS[jeepId].name },
    jeeps: price.jeeps,
    adults: price.adults,
    children: price.children,
    infants: price.infants,
    totalPeople: price.totalPeople,
    pricing: {
      totalLKR: price.totalLKR,
      baseCost: price.baseCost,
      extraAdultCost: price.extraAdultCost,
      childCost: price.childCost,
    },
    billing: {
      currency: billingCurrency,
      amount,
      amountFixed: amount.toFixed(2),
      lkrPerUnit: currency.lkrPerUnit,
    },
  };
}
