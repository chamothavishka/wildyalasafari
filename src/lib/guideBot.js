/**
 * The Yala Concierge — the on-site assistant behind "Meet Your Guide".
 *
 * Frontend only: it answers from the website's own data (packages, prices, jeeps, itineraries, payment and
 * booking steps, contact details) and from the Yala knowledge base, and hands anything else over to the team
 * on WhatsApp / email. It can calculate a live quote from plain English ("2 adults and a child, evening
 * safari, Land Cruiser") using the same pricing engine as the booking page. It never invents facts: anything
 * the website does not state (refund policy, opening hours, guide languages…) is passed to the team.
 *
 * answer(input, ctx) → { text, cards?, actions?, followUps?, ctx }
 *   cards: rich blocks rendered by the chat UI — 'packages' | 'quote' | 'steps' | 'facts' | 'timeline' | 'contact'
 */
import { PACKAGES, PACKAGE_MAP, CONTACT, WILDLIFE, ABOUT, STATS, BRAND, whatsappLink, mailtoLink, socialLinks } from '../data/content.js';
import { SAFARI_PRICING, MAX_PER_JEEP, MAX_GROUP, JEEPS, calculatePrice, startingPrice } from './pricing.js';
import { formatLKR, formatMoney } from './currency.js';
import { bookingUrl } from './bookingState.js';
import {
  ANIMAL_FACTS, BIRDS_TEXT, BLOCKS_TEXT, BEST_TIME_TEXT, ABOUT_YALA_TEXT, GETTING_THERE_TEXT, WHAT_TO_BRING_TEXT,
  RULES_TEXT, SAFETY_TEXT, NEARBY_TEXT, LEOPARD_TIPS_TEXT, TOP_FAQ_TEXT,
} from './yalaKnowledge.js';

export const GREETING = {
  text: 'Ayubowan! I’m your Yala Concierge. Ask me anything about our safaris, prices and booking — or about Yala itself. I can even work out an exact price for your group.',
};

/** The four doors on the welcome screen. */
export const WELCOME_TILES = [
  { icon: 'ticket', label: 'Packages & prices', sub: 'Three private safaris', query: 'What safari packages do you have and how much are they?' },
  { icon: 'users', label: 'Plan my group', sub: 'Get an exact price', query: 'How much for 2 adults and 1 child on the morning safari?' },
  { icon: 'paw', label: 'Wildlife & seasons', sub: 'What you may see', query: 'What animals can I see in Yala?' },
  { icon: 'calendar', label: 'How to book', sub: 'Simple, in minutes', query: 'How do I book a safari?' },
];

export const SUGGESTIONS = ['How many packages do you have?', 'Price for 4 people', 'What’s included?', 'Best time to visit', 'How do I pay?', 'Contact the team'];

export const initialContext = () => ({ safari: null, jeep: null, adults: null, children: null, infants: null, currency: null, last: null });

/* ------------------------------------------------------------------ helpers */

const link = (label, href, external = false) => ({ label, href, external });
const plain = (text, extra = {}) => ({ text, ...extra });
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const SAFARI_ICON = Object.fromEntries(PACKAGES.map((p) => [p.id, p.icon]));
const jeepName = (id) => JEEPS[id].name;

function normalise(input) {
  let q = String(input || '').toLowerCase().replace(/[’']/g, '');
  q = q.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g, (w) => String(NUMBER_WORDS[w]));
  return q.replace(/[^a-z0-9$£€\s.\-/+]/g, ' ').replace(/\s+/g, ' ').trim();
}
const test = (q, re) => re.test(q);

const CURRENCY_ALIASES = [
  [/\b(usd|dollars?|us dollars?|\$)\b|\$/, 'USD'], [/\b(eur|euros?)\b|€/, 'EUR'], [/\b(gbp|pounds?|sterling)\b|£/, 'GBP'], [/\b(aud|aussie)\b/, 'AUD'],
  [/\b(cad)\b/, 'CAD'], [/\b(chf|swiss francs?)\b/, 'CHF'], [/\b(jpy|yen)\b/, 'JPY'], [/\b(cny|yuan|rmb)\b/, 'CNY'], [/\b(inr|indian rupees?)\b/, 'INR'],
  [/\b(lkr|rupees?|rs)\b/, 'LKR'],
];

/** Pull the safari, jeep, party size and currency out of a free-text message. */
function parseEntities(raw) {
  const q = raw.replace(/good (morning|evening|afternoon)/g, ' ');
  const e = {};
  if (test(q, /\b(full ?day|whole day|all day)\b/)) e.safari = 'fullday';
  else if (test(q, /\b(morning|sunrise|dawn|early)\b/)) e.safari = 'morning';
  else if (test(q, /\b(evening|afternoon|sunset|golden hour)\b/)) e.safari = 'evening';
  if (test(q, /\bhilux\b|\bpick ?up truck\b/)) e.jeep = 'hilux';
  else if (test(q, /\bland ?cruiser\b|\bcruiser\b/)) e.jeep = 'cruiser';

  const n = (re) => {
    const m = q.match(re);
    return m ? parseInt(m[1], 10) : null;
  };
  let adults = n(/(\d+)\s*(?:adults?|grown ?ups?)\b/);
  const kids = n(/(\d+)\s*(?:children|child|kids?|boys?|girls?|teens?)\b/);
  const infants = n(/(\d+)\s*(?:infants?|babies|baby|toddlers?|under ?5s?)\b/);
  let people = n(/(\d+)\s*(?:people|persons?|pax|guests?|travell?ers|tourists|of us|members|friends|passengers|ppl)\b/) ?? n(/\b(?:family|group|party|team|couple) of (\d+)\b/);
  if (people === null && test(q, /\b(couple|two of us)\b/)) people = 2;
  if (people === null && adults === null && test(q, /\b(solo|alone|just me|only me|myself|single traveller)\b/)) adults = 1;
  if (adults === null && people !== null) adults = Math.max(1, people - (kids || 0) - (infants || 0));
  if (adults !== null || kids !== null || infants !== null) {
    e.party = { adults: adults ?? 1, children: kids ?? 0, infants: infants ?? 0 };
    if (adults === null && people === null && (kids !== null || infants !== null)) e.party.adults = 1;
    e.partyAssumed = people !== null && n(/(\d+)\s*(?:adults?)\b/) === null;
  }
  for (const [re, code] of CURRENCY_ALIASES) {
    if (re.test(q)) {
      e.currency = code;
      break;
    }
  }
  return e;
}

const partyText = (p) =>
  [`${p.adults} ${p.adults === 1 ? 'adult' : 'adults'}`, p.children ? `${p.children} ${p.children === 1 ? 'child' : 'children'} (6–11)` : null, p.infants ? `${p.infants} ${p.infants === 1 ? 'child' : 'children'} (1–5, free)` : null]
    .filter(Boolean)
    .join(' · ');

const altCurrency = (e, ctx) => {
  const c = e.currency || ctx.currency;
  return c && c !== 'LKR' ? c : 'USD';
};

/* ------------------------------------------------------------------ price & package replies */

function packagesCard(alt) {
  return {
    kind: 'packages',
    items: PACKAGES.map((p) => ({
      id: p.id,
      name: p.name,
      icon: p.icon,
      time: p.time,
      headline: p.headline,
      from: formatLKR(startingPrice(p.id)),
      fromAlt: `≈ ${formatMoney(startingPrice(p.id), alt)}`,
    })),
  };
}

function packagesReply(ctx, e, intro) {
  const alt = altCurrency(e, ctx);
  return plain(intro || 'We offer three private 4x4 jeep safaris in Yala National Park, each with an experienced local guide and hotel pick-up and drop-off. Prices are per jeep and start from:', {
    cards: [packagesCard(alt)],
    actions: [link('Open the price builder', '#packages')],
    followUps: ['Price for 4 people', 'What’s included?', 'Which safari is best?'],
    topic: 'packages',
  });
}

function overviewPriceReply(ctx, e) {
  const alt = altCurrency(e, ctx);
  const rows = [];
  PACKAGES.forEach((p) => {
    Object.keys(JEEPS).forEach((j) => {
      const r = SAFARI_PRICING[p.id][j];
      rows.push({ label: p.name, sub: jeepName(j), value: formatLKR(r.base), alt: `≈ ${formatMoney(r.base, alt)}` });
    });
  });
  const m = SAFARI_PRICING.morning.hilux;
  const f = SAFARI_PRICING.fullday.hilux;
  return plain('Here is how our pricing works. The jeep price covers the jeep and the first adult; extra guests add a small amount each. Children aged 1–5 are always free.', {
    cards: [
      { kind: 'quote', title: 'Price per jeep (includes first adult)', rows, lines: null, total: null, note: null },
      {
        kind: 'facts',
        title: 'Extra guests',
        items: [
          { k: 'Each extra adult · Morning / Evening', v: formatLKR(m.extraAdult) },
          { k: 'Each child 6–11 · Morning / Evening', v: formatLKR(m.extraChild) },
          { k: 'Each extra adult · Full Day', v: formatLKR(f.extraAdult) },
          { k: 'Each child 6–11 · Full Day', v: formatLKR(f.extraChild) },
          { k: 'Children 1–5', v: 'Free' },
        ],
      },
    ],
    actions: [link('Open the price builder', '#packages')],
    followUps: ['Price for 2 adults and 2 children', 'Price for a family of 5', 'Hilux or Land Cruiser?'],
    topic: 'prices',
  });
}

/** Compute and present a quote for the safari(s) / jeep(s) / party asked about. */
function quoteReply(e, ctx) {
  const party = e.party || (ctx.adults !== null ? { adults: ctx.adults, children: ctx.children || 0, infants: ctx.infants || 0 } : null);
  const safaris = e.safari ? [e.safari] : ctx.safari && (e.party || e.jeep) ? [ctx.safari] : PACKAGES.map((p) => p.id);
  const jeeps = e.jeep ? [e.jeep] : ctx.jeep && (e.party || e.safari) && !e.jeep && ctx.last === 'quote' ? [ctx.jeep] : Object.keys(JEEPS);
  const alt = altCurrency(e, ctx);

  if (!party) {
    if (!e.safari && !e.jeep) return overviewPriceReply(ctx, e);
    // a safari / jeep was named but no group size: show the single-adult price plus the extras
    const rows = [];
    safaris.forEach((s) =>
      jeeps.forEach((j) => {
        const r = SAFARI_PRICING[s][j];
        rows.push({ label: PACKAGE_MAP[s].name, sub: `${jeepName(j)} · 1 jeep, 1 adult`, value: formatLKR(r.base), alt: `≈ ${formatMoney(r.base, alt)}` });
      }),
    );
    const r0 = SAFARI_PRICING[safaris[0]][jeeps[0]];
    return plain(`${safaris.length === 1 ? PACKAGE_MAP[safaris[0]].name : 'These safaris'} start with the jeep and the first adult. Each extra adult adds ${formatLKR(r0.extraAdult)} and each child aged 6–11 adds ${formatLKR(r0.extraChild)}; children 1–5 are free. Tell me your group size and I’ll work out the exact total.`, {
      cards: [{ kind: 'quote', title: 'Starting prices', rows, lines: null, total: null, note: null }],
      followUps: ['2 adults and 1 child', '4 adults', 'A family of 6'],
      ctxPatch: { safari: safaris.length === 1 ? safaris[0] : ctx.safari, jeep: jeeps.length === 1 ? jeeps[0] : ctx.jeep, last: 'quote' },
      topic: 'quote',
    });
  }

  const total = party.adults + party.children + party.infants;
  if (total > MAX_GROUP) {
    return plain(`For groups larger than ${MAX_GROUP} guests we arrange everything personally. Please message our team with your dates and group size.`, {
      actions: [link('Chat on WhatsApp', whatsappLink(`Hello Wild Yala Safari! We are a group of ${total}.`), true), link('Email us', mailtoLink('Group safari enquiry'))],
      topic: 'contact',
    });
  }

  const rows = [];
  let single = null;
  safaris.forEach((s) =>
    jeeps.forEach((j) => {
      const price = calculatePrice({ safariId: s, jeepId: j, ...party });
      rows.push({ label: PACKAGE_MAP[s].name, sub: `${jeepName(j)} · ${price.jeeps} ${price.jeeps === 1 ? 'jeep' : 'jeeps'}`, value: formatLKR(price.totalLKR), alt: `≈ ${formatMoney(price.totalLKR, alt)}` });
      single = price;
    }),
  );

  const one = rows.length === 1 ? single : null;
  const lines = one
    ? [
        { label: `${one.jeeps} × ${jeepName(one.jeepId)} (includes first adult)`, value: formatLKR(one.baseCost) },
        one.extraAdults ? { label: `${one.extraAdults} extra ${one.extraAdults === 1 ? 'adult' : 'adults'} × ${formatLKR(one.rates.extraAdult)}`, value: formatLKR(one.extraAdultCost) } : null,
        one.children ? { label: `${one.children} ${one.children === 1 ? 'child' : 'children'} (6–11) × ${formatLKR(one.rates.extraChild)}`, value: formatLKR(one.childCost) } : null,
        one.infants ? { label: `${one.infants} ${one.infants === 1 ? 'child' : 'children'} (1–5)`, value: 'Free' } : null,
      ].filter(Boolean)
    : null;

  const note = [
    one && one.jeeps > 1 ? `${total} guests need ${one.jeeps} jeeps (up to ${MAX_PER_JEEP} per jeep).` : null,
    e.partyAssumed && party.adults > 1 ? 'I counted everyone as an adult — tell me if some are children aged 6–11 and I’ll adjust.' : null,
    'Park entry tickets, water, face masks and binoculars are included.',
  ]
    .filter(Boolean)
    .join(' ');

  const actions = [];
  if (one) actions.push(link('Book this safari', bookingUrl({ safariId: one.safariId, jeepId: one.jeepId, adults: party.adults, children: party.children, infants: party.infants, currency: 'LKR', billingCurrency: 'USD' })));
  actions.push(link('Open the price builder', '#packages'));

  return plain(`Here’s your price for ${partyText(party)}${safaris.length === 1 ? ` on the ${PACKAGE_MAP[safaris[0]].name}` : ''}:`, {
    cards: [
      {
        kind: 'quote',
        title: one ? `${PACKAGE_MAP[one.safariId].name} · ${jeepName(one.jeepId)}` : 'Your group',
        subtitle: partyText(party),
        rows: one ? null : rows,
        lines,
        total: one ? { value: formatLKR(one.totalLKR), alt: `≈ ${formatMoney(one.totalLKR, alt)}` } : null,
        note,
      },
    ],
    actions,
    followUps: one ? [`Same with the ${one.jeepId === 'hilux' ? 'Land Cruiser' : 'Toyota Hilux'}`, `Same for the ${one.safariId === 'morning' ? 'evening' : 'morning'} safari`, 'How do I pay?'] : ['Which jeep should I choose?', 'How do I book?', 'What’s included?'],
    ctxPatch: { ...party, safari: safaris.length === 1 ? safaris[0] : ctx.safari, jeep: jeeps.length === 1 ? jeeps[0] : ctx.jeep, currency: e.currency || ctx.currency, last: 'quote' },
    topic: 'quote',
  });
}

function jeepReply() {
  const m = SAFARI_PRICING.morning;
  const f = SAFARI_PRICING.fullday;
  return plain(`We have two private 4x4 jeep categories. Both carry up to ${MAX_PER_JEEP} guests, and both include your guide, hotel pick-up and drop-off.`, {
    cards: [
      {
        kind: 'facts',
        title: 'Our jeeps',
        items: [
          { k: jeepName('hilux'), v: 'Open-top 4x4 safari pickup' },
          { k: `${jeepName('hilux')} from`, v: `${formatLKR(m.hilux.base)} (Morning / Evening) · ${formatLKR(f.hilux.base)} (Full Day)` },
          { k: jeepName('cruiser'), v: 'Classic 4x4 safari cruiser' },
          { k: `${jeepName('cruiser')} from`, v: `${formatLKR(m.cruiser.base)} (Morning / Evening) · ${formatLKR(f.cruiser.base)} (Full Day)` },
        ],
      },
    ],
    actions: [link('See the jeeps in 3D', '#packages')],
    followUps: ['Price for 4 people in the Land Cruiser', 'Price for 4 people in the Hilux', 'How do I book?'],
    topic: 'jeeps',
  });
}

function groupReply() {
  return plain(`Here is how groups work:\n• Each jeep carries up to ${MAX_PER_JEEP} guests.\n• Bigger groups automatically get extra jeeps at the same rate (up to ${MAX_GROUP} guests online).\n• Children aged 1–5 travel free but still take a seat.\n• Children aged 6–11 pay the child rate; everyone else is counted as an adult.\n• For more than ${MAX_GROUP} guests, please contact us and we’ll arrange it personally.`, {
    actions: [link('Open the price builder', '#packages')],
    followUps: ['Price for a family of 8', 'Price for 2 adults and 2 children', 'Contact the team'],
    topic: 'group',
  });
}

function includedReply(e) {
  const pkg = e.safari ? PACKAGE_MAP[e.safari] : null;
  if (pkg) {
    return plain(`${pkg.name} includes: ${pkg.inclusions.join(', ')}. Hotel pick-up and drop-off with your private guide are part of every safari.`, {
      followUps: ['Show the itinerary', `Price for 2 adults on the ${pkg.name}`, 'How do I book?'],
      topic: 'included',
    });
  }
  const base = PACKAGES[0].inclusions;
  const full = PACKAGE_MAP.fullday;
  const extra = full.inclusions.filter((i) => !base.includes(i));
  return plain(`Every safari includes ${base.join(', ').toLowerCase()}, plus hotel pick-up and drop-off with an experienced local guide.\n\nThe Full Day Safari adds ${extra.join(', ').toLowerCase()} — a picnic breakfast in the park and a lunch break.`, {
    cards: [
      {
        kind: 'facts',
        title: 'What’s included',
        items: PACKAGES.map((p) => ({ k: p.name, v: p.inclusions.join(' · ') })),
      },
    ],
    followUps: ['Show the itinerary', 'Price for 4 people', 'How do I book?'],
    topic: 'included',
  });
}

function itineraryReply(e) {
  if (e.safari) {
    const pkg = PACKAGE_MAP[e.safari];
    return plain(`${pkg.name} · ${pkg.time}\n${pkg.description}`, {
      cards: [{ kind: 'timeline', title: 'Your day', items: pkg.itinerary.map((i) => ({ time: i.time, title: i.title })) }],
      actions: [link(`See the ${pkg.name}`, '#packages')],
      followUps: [`Price for 2 adults on the ${pkg.name}`, 'What’s included?', 'How do I book?'],
      note: pkg.note,
      topic: 'itinerary',
    });
  }
  return plain('We run three safaris. Pick one and I’ll show you the full day plan:', {
    cards: [
      {
        kind: 'facts',
        title: 'Timings',
        items: PACKAGES.map((p) => ({ k: p.name, v: p.time })),
      },
    ],
    followUps: ['Show the morning itinerary', 'Show the evening itinerary', 'Show the full day itinerary'],
    topic: 'itinerary',
  });
}

function recommendReply() {
  return plain('A quick guide to choosing:\n• Morning Safari — the park at sunrise, cool and peaceful, when wildlife is at its most active. A classic for leopards.\n• Evening Safari — golden-hour light, ideal for photography and sunset landscapes.\n• Full Day Safari — the whole day, more of the park and more chances for remarkable sightings, with breakfast and lunch included.\n\nSightings are never guaranteed, but more time in the park improves your odds.', {
    cards: [packagesCard('USD')],
    followUps: ['Price for 2 adults', 'Show the full day itinerary', 'How do I book?'],
    topic: 'recommend',
  });
}

/* ------------------------------------------------------------------ booking, payment, contact */

function bookReply() {
  return plain('Booking takes a few minutes:', {
    cards: [
      {
        kind: 'steps',
        items: [
          { n: 1, title: 'Choose your safari & jeep', text: 'In Safari Packages, pick Morning, Evening or Full Day and a jeep.' },
          { n: 2, title: 'Set your group', text: 'Add adults and children to see your instant price.' },
          { n: 3, title: 'Enter your details', text: 'On the booking page add your name, email, safari date and pickup location.' },
          { n: 4, title: 'Pay securely', text: 'Pay by card in USD or LKR, or enquire first. Our team then confirms with you on WhatsApp or email.' },
        ],
      },
    ],
    actions: [link('Choose a safari', '#packages'), link('Open the booking page', './booking.html')],
    followUps: ['What details do you need?', 'How do I pay?', 'Price for 4 people'],
    topic: 'booking',
  });
}

function formReply() {
  return plain('The booking form asks for:\n• Full name *\n• Email address *\n• Safari date *\n• Pickup location — your hotel or address *\n• WhatsApp / phone number (optional)\n• Arrival date in Sri Lanka (optional)\n• Special requests (optional)\n\n* required. Your safari, jeep and group size carry over from the package you chose.', {
    actions: [link('Open the booking page', './booking.html')],
    followUps: ['How do I pay?', 'How do I book?'],
    topic: 'booking',
  });
}

function paymentReply(q) {
  if (test(q, /\b(refund|cancel|cancellation|money back|reschedule|change my date|postpone)\b/)) {
    return plain('Our website doesn’t publish a cancellation or refund policy, so I don’t want to guess. Please ask our team — they’ll confirm the terms for your booking.', {
      actions: [link('Ask on WhatsApp', whatsappLink('Hello Wild Yala Safari! I have a question about cancellation / changing my booking.'), true), link('Email us', mailtoLink('Booking change enquiry'))],
      topic: 'contact',
    });
  }
  return plain('Payment is simple and secure:\n• Pay by credit or debit card — international payments are welcome.\n• Choose your billing currency: USD or LKR.\n• Checkout is SSL-secured and encrypted.\n• Full payment is required to confirm your safari, and our team contacts you on WhatsApp or email to confirm and share any payment details.\n\nIf you have any problem with payment, tap “Enquiry Now” on the booking page or message us.', {
    actions: [link('Open the booking page', './booking.html'), link('Ask on WhatsApp', whatsappLink('Hello Wild Yala Safari! I have a question about payment.'), true)],
    followUps: ['How do I book?', 'Price for 4 people', 'Contact the team'],
    topic: 'payment',
  });
}

function contactCard() {
  const rows = [];
  if (CONTACT.phone) rows.push({ icon: 'whatsapp', label: 'WhatsApp / Phone', value: CONTACT.phone, href: whatsappLink('Hello Wild Yala Safari!'), external: true });
  rows.push({ icon: 'mail', label: 'Email', value: CONTACT.email, href: mailtoLink('Safari enquiry') });
  rows.push({ icon: 'pin', label: 'Location', value: CONTACT.location, href: CONTACT.mapUrl, external: true });
  return { kind: 'contact', rows };
}

function contactReply(q) {
  if (test(q, /\b(opening|open|office|working|business) hours\b|\bwhen are you open\b|\bwhat time do you (open|close)\b/)) {
    return plain('Opening hours aren’t listed on our website, but the team replies on WhatsApp and email — message us any time and we’ll get back to you as soon as possible.', { cards: [contactCard()], topic: 'contact' });
  }
  const socials = socialLinks().filter((s) => s.href && s.id !== 'whatsapp');
  const wantsSocial = test(q, /\b(social|facebook|instagram|tiktok|follow)\b/);
  return plain(wantsSocial ? 'You can find us here:' : 'Our team is happy to help you personally:', {
    cards: [contactCard()],
    actions: [
      link('Chat on WhatsApp', whatsappLink('Hello Wild Yala Safari!'), true),
      ...(wantsSocial ? socials.map((s) => link(s.label, s.href, true)) : [link('Open in Google Maps', CONTACT.mapUrl, true)]),
    ],
    followUps: ['How do I book?', 'Price for 4 people'],
    topic: 'contact',
  });
}

function aboutReply() {
  const stat = STATS.map((s) => ({ k: s.label, v: `${s.value.toLocaleString('en-US')}${s.suffix}` }));
  return plain(`${ABOUT.lead}\n\n${ABOUT.paragraphs[1]}`, {
    cards: [
      { kind: 'facts', title: `${BRAND.name} in numbers`, items: stat },
      { kind: 'facts', title: 'Why guests choose us', items: ABOUT.pillars.map((p) => ({ k: p.title, v: p.text })) },
    ],
    followUps: ['What safari packages do you have?', 'What’s included?', 'Contact the team'],
    topic: 'about',
  });
}

function statsReply() {
  return plain(`${BRAND.name} has completed more than ${STATS[0].value.toLocaleString('en-US')} safaris, with ${STATS[1].value}% happy guests and over ${STATS[2].value} years of experience in Yala.`, {
    cards: [{ kind: 'facts', title: 'In numbers', items: STATS.map((s) => ({ k: s.label, v: `${s.value.toLocaleString('en-US')}${s.suffix}` })) }],
    followUps: ['Tell me about the company', 'What safari packages do you have?'],
    topic: 'about',
  });
}

function pickupReply() {
  return plain('Hotel pick-up and drop-off are included with every safari. Your guide and jeep collect you from your hotel or an agreed meeting point:', {
    cards: [{ kind: 'facts', title: 'Pick-up times', items: PACKAGES.map((p) => ({ k: p.name, v: p.itinerary[0].time })) }],
    note: 'Times can vary slightly with your hotel location, park conditions and weather — enter your hotel when booking and we’ll confirm the exact time.',
    followUps: ['How do I get to Yala?', 'How do I book?'],
    topic: 'pickup',
  });
}

function siteReply(q) {
  if (test(q, /\b(login|log in|sign in|signin|account|register|password)\b/)) {
    return plain('Use “Login” in the top menu to sign in and manage your safari bookings. If you forget your password, choose “Forgot password?” on the login page and we’ll email you a reset link.', { actions: [link('Open the login page', './login.html')], topic: 'site' });
  }
  if (test(q, /\b(review|reviews|testimonial|rating|feedback)\b/)) {
    return plain('Guest reviews appear in the Reviews section of the website. Our guests rate us highly — 98% happy guests across more than 5,999 safaris.', { actions: [link('Go to Reviews', '#reviews')], topic: 'site' });
  }
  return plain('The Gallery shows moments from the life of a Yala leopard, and the About section has our wildlife guide and the animals of Yala. Safari Packages is where you build and price your safari.', {
    actions: [link('Open the gallery', '#gallery'), link('Safari Packages', '#packages')],
    topic: 'site',
  });
}

/* ------------------------------------------------------------------ Yala knowledge (kept) */

function animalReply(q) {
  const hit = WILDLIFE.find((w) => {
    const facts = ANIMAL_FACTS[w.name];
    return q.includes(w.name.toLowerCase()) || (facts && facts.keys.some((k) => q.includes(k)));
  });
  if (!hit) return null;
  const facts = ANIMAL_FACTS[hit.name];
  if (!facts) return null;
  return plain(`${hit.name}\n${facts.text}`, { actions: [link('See the wildlife', '#about')], followUps: ['What animals can I see?', 'Tips to spot a leopard', 'Best time to visit'], topic: 'wildlife' });
}

function animalsListReply() {
  const groups = { Mammal: [], Reptile: [], Bird: [] };
  WILDLIFE.forEach((w) => groups[w.type] && groups[w.type].push(w.name));
  return plain(
    `Yala is famous for one of the highest leopard densities in the world — and shelters much more:\n• Mammals: ${groups.Mammal.join(', ')}\n• Reptiles: ${groups.Reptile.join(', ')}\n• Birds: ${groups.Bird.join(', ')}\n\nAsk me about any of them. Sightings are never guaranteed — every drive is a real wildlife encounter.`,
    { actions: [link('See the wildlife', '#about')], followUps: ['Tell me about leopards', 'Tell me about elephants', 'Tips to spot a leopard'], topic: 'wildlife' },
  );
}

function yalaReply(q) {
  const t = (text, extra = {}) => plain(text, { topic: 'yala', ...extra });
  const team = { actions: [link('Ask the team', whatsappLink('Hello Wild Yala Safari! I have a question about Yala.'), true)] };
  if (test(q, /\b(block|blocks|zone|zones|ruhuna|palatupana)\b/)) return t(BLOCKS_TEXT, { actions: [link('View safari packages', '#packages')] });
  if (test(q, /\b(best time|when to visit|when should|when is the best|which month|what month|season|closed|closure|monsoon|weather|climate|rainy|dry season|peak season)\b/)) return t(BEST_TIME_TEXT, { ...team, followUps: ['Morning or evening safari?', 'Price for 4 people'] });
  if (test(q, /spot a leopard|leopard tips|tips to|see a leopard|see leopards|find a leopard|find leopard|chance of|guarantee|sighting chance/)) return t(LEOPARD_TIPS_TEXT, { followUps: ['Tell me about leopards', 'Which safari is best?'] });
  if (test(q, /\b(bird|birds|birding|birdwatching|peacock)\b/)) return animalReply(q) || t(BIRDS_TEXT);
  const animal = animalReply(q);
  if (animal) return animal;
  if (test(q, /\b(animals|wildlife|species|fauna|mammals?|reptiles?)\b|what (can|will) i see/)) return animalsListReply();
  if (test(q, /what to (bring|wear|pack)|what should i (wear|bring|pack)|clothes|clothing|packing|sunscreen/)) return t(WHAT_TO_BRING_TEXT);
  if (test(q, /\b(rules?|etiquette|drone|not allowed|get out of the jeep|feed)\b|do and dont/)) return t(RULES_TEXT);
  if (test(q, /\b(safe|safety|danger|dangerous|risk)\b/)) return t(SAFETY_TEXT, team);
  if (test(q, /\b(nearby|attractions?|temple|things to do|kataragama|tissa|bundala|extra day)\b/)) return t(NEARBY_TEXT, team);
  if (test(q, /how (do i|to|can i) get (to|there)|getting there|how far|distance|from colombo|from galle|from ella|from the airport|travel to yala|route to/)) return t(GETTING_THERE_TEXT, team);
  if (test(q, /about yala|what is yala|where is yala|where is the park|tell me about yala|yala national park|yala park|history of|why yala|size of/)) return t(ABOUT_YALA_TEXT, { actions: [link('View safari packages', '#packages')] });
  return null;
}

/* ------------------------------------------------------------------ small talk & fallback */

export function fallbackReply() {
  return plain('I’m not certain about that one — and I’d rather not guess. Our team will be glad to help you personally:', {
    cards: [contactCard()],
    actions: [link('Chat on WhatsApp', whatsappLink('Hello Wild Yala Safari! I have a question.'), true), link('Email us', mailtoLink('Safari enquiry'))],
    followUps: ['What safari packages do you have?', 'How do I book?', 'What’s included?'],
    topic: 'fallback',
  });
}

const helpReply = () => plain(`${TOP_FAQ_TEXT}\n\nI can also calculate an exact price — try “price for 3 adults and 2 children on the evening safari”.`, { followUps: SUGGESTIONS.slice(0, 4), topic: 'help' });

/* ------------------------------------------------------------------ router */

/**
 * @param {string} input
 * @param {object} ctx conversation memory (see initialContext)
 */
export function answer(input, ctx = initialContext()) {
  const q = normalise(input);
  if (!q) return { ...fallbackReply(), ctx };
  const e = parseEntities(q);
  const short = q.length < 32;

  const finish = (reply) => {
    const patch = reply.ctxPatch || {};
    const next = { ...ctx, ...patch };
    if (e.safari && !patch.safari) next.safari = e.safari;
    if (e.jeep && !patch.jeep) next.jeep = e.jeep;
    if (e.currency) next.currency = e.currency;
    if (!patch.last) next.last = reply.topic || null;
    const { ctxPatch, ...clean } = reply;
    return { ...clean, ctx: next };
  };

  // --- social
  if (short && test(q, /^(hi|hii+|hello|helo|hey|heya|yo|hola|namaste|ayubowan|ayubovan|good (morning|evening|afternoon|day))\b/)) {
    return finish(plain('Ayubowan! May you live long. How can I help you plan your Yala safari?', { followUps: ['What packages do you have?', 'Price for 4 people', 'How do I book?'], topic: 'greet' }));
  }
  if (short && test(q, /\b(thanks|thank you|thx|cheers|appreciate)\b/)) return finish(plain('You’re most welcome! Is there anything else I can help you with?', { followUps: ['How do I book?', 'Contact the team'], topic: 'thanks' }));
  if (short && test(q, /\b(bye|goodbye|see you|good night|cya)\b/)) return finish(plain('Safe travels and see you in Yala! 🐆', { topic: 'bye' }));
  if (short && test(q, /\b(love you|i love|awesome|amazing|great bot|good bot|nice bot|wonderful|brilliant)\b/)) return finish(plain('That means a lot — thank you! Let’s get you out in the wild. What would you like to know?', { followUps: ['What packages do you have?', 'Price for 4 people'], topic: 'thanks' }));
  if (test(q, /\b(who are you|your name|what are you|are you (a |an )?(bot|ai|robot|human|real|person)|who am i (talking|speaking|chatting))\b/)) {
    return finish(plain('I’m the Yala Concierge, the Wild Yala Safari website assistant. I answer from our own safari details and prices — and I’ll pass you to the team for anything I can’t confirm.', { followUps: ['What can you help with?', 'What packages do you have?'], topic: 'about-bot' }));
  }
  if (short && test(q, /^(help|menu|options|what can you (do|help|answer)|what do you know)\b|what can you help/)) return finish(helpReply());

  // --- the company in numbers
  if (test(q, /(safaris|tours|guests|trips) (have you|did you|you have) (done|completed|run|hosted)|safaris done|happy guests|years of experience|how long have you|how experienced|how old is/)) return finish(statsReply());

  // --- park tickets are included (not a separate price)
  if (test(q, /(park|entry|entrance|ticket|tickets|permit).*(price|cost|fee|how much|extra|separate|pay)|(price|cost|fee|how much).*(park|entry|entrance|ticket)/)) {
    return finish(plain('Park entry tickets are already included in every safari price — there’s nothing extra to pay at the gate. Your price also covers the 4x4 jeep, your guide, water, face masks and binoculars.', { followUps: ['What’s included?', 'Price for 4 people'], topic: 'included' }));
  }

  // --- counts
  if (test(q, /how many (safari |tour )?(packages?|packs?|tours?|safaris|options|types|kinds|experiences|trips)|number of (packages?|safaris|tours)|(packages?|tours|safaris) (do you|are there|you have|available)|(packages?|tours|safaris).*(here|have).*(how much|price|cost)/) && !e.party) {
    return finish(packagesReply(ctx, e, 'We have 3 safari packages — Morning, Evening and Full Day. All are private 4x4 jeep safaris with an experienced local guide and hotel pick-up and drop-off. Prices are per jeep and start from:'));
  }
  if (test(q, /how many (jeeps|vehicles|cars|jeep types|types of jeeps?|types of vehicles)/)) return finish(jeepReply());
  if (test(q, /how many (people|persons|guests|passengers|seats|children|kids|adults)|capacity|maximum (group|people|guests)|max (group|people|guests)|group size|\bseats\b|per jeep/) && !test(q, /\b(price|cost|how much|total)\b/)) return finish(groupReply());

  // --- recommendations
  if (test(q, /which (safari|package|tour|one)|(best|better) (safari|package|tour)|recommend|suggest|morning or evening|difference between|compare|what should i (choose|pick|book)|most popular/)) return finish(recommendReply());

  // --- prices & quotes
  const priceWords = /\b(price|prices|pricing|cost|costs|how much|rate|rates|fee|fees|charge|charges|expensive|cheap|cheapest|budget|afford|quote|total|tariff|lkr|usd|dollars?|rupees?|euros?|pounds?)\b|\bper (person|adult|child|jeep|head)\b|\bpay for\b|\$|£|€/;
  if (test(q, priceWords) || (e.party && test(q, /\b(safari|jeep|tour|trip|book|hilux|cruiser)\b/))) return finish(quoteReply(e, ctx));

  // --- follow-ups on a quote ("same with the Land Cruiser", "and for the evening?", "4 adults")
  if (ctx.last === 'quote' && (e.safari || e.jeep || e.party) && q.length < 70 && test(q, /\b(same|again|also|and|what about|how about|instead|with|for the|on the|for|in the)\b|^\d/)) return finish(quoteReply(e, ctx));

  // --- "book this" right after a quote: hand over a ready-made booking link
  if (ctx.last === 'quote' && ctx.safari && ctx.jeep && ctx.adults !== null && test(q, /\bbook\b/) && test(q, /\b(this|it|that|now|one)\b/)) {
    const sel = { safariId: ctx.safari, jeepId: ctx.jeep, adults: ctx.adults, children: ctx.children || 0, infants: ctx.infants || 0, currency: 'LKR', billingCurrency: 'USD' };
    return finish(plain('Wonderful choice! This opens the booking page with your safari, jeep and group already filled in — you just add your details and date.', {
      actions: [link('Book this safari', bookingUrl(sel))],
      followUps: ['How do I pay?', 'What details do you need?'],
      topic: 'booking',
    }));
  }

  // --- Yala itself (animals, blocks, best time, what to bring…)
  const yala = yalaReply(q);
  if (yala) return finish(yala);

  // --- products & policies
  if (test(q, /\b(hilux|land ?cruiser|cruiser|jeep|jeeps|vehicle|vehicles|4x4|open top|comfortable|comfort)\b/)) return finish(jeepReply());
  if (test(q, /\b(child|children|kid|kids|infant|baby|babies|toddler|age|group|capacity|seat|seats|family)\b/)) return finish(groupReply());
  if (test(q, /\b(include|included|inclusion|inclusions|what do i get|whats in|covered|meal|meals|lunch|breakfast|snack|snacks|food|drink|drinks|water|binocular|binoculars|ticket|tickets|mask|masks|equipment)\b/)) return finish(includedReply(e));
  if (test(q, /\b(pick ?up|drop ?off|transfer|collect|hotel|transport)\b/)) return finish(pickupReply());
  if (test(q, /\b(itinerary|schedule|timetable|timing|timings|duration|how long|what time|start time|what happens|programme|program|plan for the day|show the)\b/) || (e.safari && test(q, /\b(tell me|about|details|info|information|show|see)\b/))) return finish(itineraryReply(e));

  if (test(q, /\b(what details|which details|what information|what info|required fields|booking form|what do you need|what do i need to (enter|provide|give))\b/)) return finish(formReply());
  if (test(q, /\b(payment|payments|pay|paying|credit|debit|visa|mastercard|master card|amex|card|cards|secure|ssl|encrypt|encrypted|billing|deposit|advance|refund|refunds|cancel|cancellation|paypal|bank|cash|installment)\b/)) return finish(paymentReply(q));
  if (test(q, /\b(book|booking|bookings|reserve|reservation|availability|available|how do i get|how can i get|process|sign up)\b/)) return finish(bookReply());
  if (test(q, /\b(contact|whatsapp|phone|call|number|email|mail|address|location|where are you|where is your|office|map|directions|social|facebook|instagram|tiktok|reach|speak to|talk to|human|agent|team|support|hours)\b/)) return finish(contactReply(q));
  if (test(q, /\b(language|languages|english|sinhala|german|french|russian|spanish|chinese|hindi)\b/)) {
    return finish(plain('Our website doesn’t list the guides’ languages, so I can’t promise a specific one. Our team can confirm which languages are available for your date — just ask.', {
      actions: [link('Ask on WhatsApp', whatsappLink('Hello Wild Yala Safari! Which languages do your guides speak?'), true)],
      topic: 'contact',
    }));
  }
  if (test(q, /\b(about|company|who runs|who owns|who is|history|story|team|guides?|experience|why choose|why you|trust|license|licensed|insured|insurance)\b/)) return finish(aboutReply());
  if (test(q, /\b(login|log in|sign in|signin|account|register|password|gallery|photos?|videos?|review|reviews|website|page|section)\b/)) return finish(siteReply(q));

  // --- follow-ups that only carry details ("and for the evening?", "with the Land Cruiser", "4 adults")
  if (e.safari || e.jeep || e.party) {
    if (ctx.last === 'quote' || ctx.last === 'prices' || ctx.last === 'packages') return finish(quoteReply(e, ctx));
    if (e.safari) return finish(itineraryReply(e));
    if (e.jeep) return finish(jeepReply());
  }
  if (test(q, /\b(leopard|elephant|bear|bird|crocodile|deer|sighting|see)\b/)) return finish(animalsListReply());
  if (test(q, /\b(package|packages|safari|safaris|tour|tours|offer|offers|options|services)\b/)) return finish(packagesReply(ctx, e));
  if (test(q, /^(yes|yeah|yep|ok|okay|sure|please|go on|continue)\b/) && ctx.last) return finish(ctx.last === 'quote' ? bookReply() : packagesReply(ctx, e));

  return finish(fallbackReply());
}

