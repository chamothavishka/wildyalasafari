/**
 * General knowledge about Yala National Park for the guide assistant — information that is
 * NOT on the website itself. Kept deliberately cautious: well-known facts only, with
 * wording like "usually" / "typically" where things change, and a pointer to the team for
 * anything that depends on the day (park rules, closures, exact sightings).
 */

/** Short, safe facts for each animal on the site (names match WILDLIFE in content.js). */
export const ANIMAL_FACTS = {
  'Sri Lankan Leopard': {
    keys: ['leopard', 'cheetah', 'panther'],
    text: 'The Sri Lankan leopard is a subspecies found only in Sri Lanka and is the island’s apex predator. Yala is famous for one of the highest leopard densities in the world. Leopards are solitary and often rest in the shade of rocks and trees, so patience and a good tracker make the difference. Morning and late afternoon give the best chances, but a sighting can never be guaranteed.',
  },
  'Asian Elephant': {
    keys: ['elephant'],
    text: 'Yala is home to the Sri Lankan elephant, the largest of the Asian elephant subspecies. You usually meet family herds near lagoons and waterholes, especially in the dry season when they gather to drink and bathe. Always keep a safe distance — your guide will position the jeep carefully.',
  },
  'Sloth Bear': {
    keys: ['sloth bear', 'sloth', 'bear'],
    text: 'The Sri Lankan sloth bear is a shy, shaggy-coated bear that feeds mainly on termites, ants and fruit — look near termite mounds and fruiting trees. Sightings are less common than leopards or elephants, so it is a real bonus when it happens.',
  },
  'Spotted Deer': {
    keys: ['spotted deer', 'axis', 'chital', 'deer'],
    text: 'Spotted deer (chital) graze in large herds across the open grasslands. They are an important prey species for leopards, and their alarm calls often tell the guides that a predator is nearby.',
  },
  'Sambar Deer': {
    keys: ['sambar'],
    text: 'The sambar is Sri Lanka’s largest deer, a darker, heavier animal than the spotted deer. It prefers forest edges and thicker cover and is more solitary or found in small groups.',
  },
  'Wild Water Buffalo': {
    keys: ['buffalo'],
    text: 'Wild water buffalo wallow in the lagoons and shallow pools to cool down through the heat of the day. They are large and powerful, so they are watched from the jeep at a respectful distance.',
  },
  'Wild Boar': {
    keys: ['boar', 'pig'],
    text: 'Wild boar root along the forest trails and around the edges of waterholes, often in family groups. They are common and easy to spot, especially in the cooler hours.',
  },
  'Golden Jackal': {
    keys: ['jackal'],
    text: 'The golden jackal is a clever hunter and scavenger of the open plains. Look for them at dawn and dusk, often in pairs.',
  },
  'Grey Langur': {
    keys: ['langur'],
    text: 'Grey langurs are leaf-eating monkeys that watch quietly from the canopy. Their loud alarm calls can reveal that a leopard is moving through the area.',
  },
  'Toque Macaque': {
    keys: ['macaque', 'toque', 'monkey'],
    text: 'The toque macaque is a lively monkey found only in Sri Lanka, recognisable by its whorl of hair on the head. You will see troops around the trees and tracks.',
  },
  'Mugger Crocodile': {
    keys: ['crocodile', 'mugger', 'croc'],
    text: 'Mugger crocodiles bask on the banks of Yala’s lagoons and waterholes, often motionless for hours. They are best seen from the jeep — never from the water’s edge.',
  },
  'Water Monitor': {
    keys: ['monitor', 'lizard'],
    text: 'Water monitors are large lizards often seen patrolling the water’s edge, swimming across lagoons or hunting along the banks.',
  },
  'Indian Peafowl': {
    keys: ['peacock', 'peafowl', 'peahen'],
    text: 'Indian peafowl are easy to spot across the scrubland, especially when males display their fanned tails. Early mornings are a good time.',
  },
  'Crested Serpent Eagle': {
    keys: ['serpent eagle'],
    text: 'The crested serpent eagle is a patient raptor, often perched high above the forest while it watches for snakes and lizards.',
  },
  'Grey-headed Fish Eagle': {
    keys: ['fish eagle', 'grey-headed', 'grey headed'],
    text: 'The grey-headed fish eagle hunts fish around the park’s lakes and reservoirs, usually watching from a high perch near the water.',
  },
  'White-bellied Sea Eagle': {
    keys: ['sea eagle', 'white-bellied', 'white bellied'],
    text: 'The white-bellied sea eagle is a majestic coastal raptor that soars along Yala’s shoreline and over lagoons.',
  },
};

export const BIRDS_TEXT =
  'Yala is an excellent birding destination, with more than 200 species recorded. Highlights include Indian peafowl, the crested serpent eagle, grey-headed fish eagle, white-bellied sea eagle, painted storks and other waterbirds around the lagoons, plus colourful kingfishers, bee-eaters and the Sri Lanka junglefowl (the national bird). Bring binoculars — we provide them on every safari.';

export const BLOCKS_TEXT =
  'Yala National Park is divided into numbered blocks. Block 1 (the Palatupana side) is the most visited and is famous for leopard sightings, with a mix of scrub, rocky outcrops, lagoons and open plains. The other blocks are quieter, with drier forest and a more remote feel. Which areas can be visited, and the route taken, depends on the park rules, the season and the conditions on the day — your guide will choose the best trails for wildlife.';

export const BEST_TIME_TEXT =
  'Yala can be visited all year, but the dry season (roughly February to July) is usually best for wildlife, because animals gather around the remaining waterholes and the vegetation is thinner. Early mornings and late afternoons are the most active hours and the lightest for photography. The park usually closes for a few weeks in the driest period (around September to mid-October) for maintenance and to give wildlife a rest — the exact dates change every year, so please ask our team before planning.';

export const ABOUT_YALA_TEXT =
  'Yala National Park lies in the south-east of Sri Lanka, across the Southern and Uva provinces, close to the coast. It is one of the island’s most visited and best-known parks, with a mosaic of dry monsoon forest, scrub, grassy plains, rocky outcrops, freshwater lagoons and a stretch of coastline. It is especially famous for its leopards, and also shelters elephants, sloth bears, crocodiles and a great variety of birds.';

export const GETTING_THERE_TEXT =
  'Yala is in the south-east of Sri Lanka. Most guests stay around Tissamaharama, Kirinda or the Yala/Kataragama area, or travel from the south coast (Galle, Mirissa, Tangalle) and the hill country. We offer hotel pick-up and drop-off, so tell our team where you are staying and we will confirm the timing and the journey.';

export const WHAT_TO_BRING_TEXT =
  'What to bring:\n• Light, neutral-coloured clothing (greens, browns, khaki) — avoid bright colours\n• A hat, sunglasses and sunscreen\n• A light jacket or scarf for the early-morning drive\n• Camera with a zoom lens, and spare battery\n• Insect repellent\n• Any personal medication\n\nWe provide park tickets, water, face masks and binoculars on every safari.';

export const RULES_TEXT =
  'Park etiquette for a safe, respectful safari:\n• Stay seated in the jeep — never get out in the park\n• Keep your voice low and never feed or call to animals\n• Do not litter; carry everything out\n• Keep a safe distance from elephants and other animals\n• Follow your guide’s instructions at all times\n• No drones in the park';

export const SAFETY_TEXT =
  'Safety is our first priority. Our guides are experienced, vehicles are well maintained and the jeeps keep a respectful distance from animals. Guests must stay in the vehicle at all times. If you are travelling with children or have any health needs, let our team know when you book and we will help you prepare.';

export const NEARBY_TEXT =
  'Places worth adding to your trip near Yala:\n• Sithulpawwa and Magul Maha Viharaya — ancient Buddhist temples\n• Kirinda Temple and the coast\n• Tissa Wewa lake (good for birds and sunsets)\n• Bundala National Park for waterbirds and flamingos (in season)\n• Kataragama — the sacred pilgrimage town\nAsk our team if you would like help planning an extra day.';

export const LEOPARD_TIPS_TEXT =
  'Tips for spotting leopards:\n• Go early (first light) or late afternoon\n• Listen for alarm calls from deer, langurs and peafowl — your guide will read them\n• Look on rocks, in shady trees and along dry riverbeds\n• Stay quiet and patient — leopards often rest for hours\n• Remember: wild animals are never guaranteed, but Yala gives you one of the best chances in the world';

export const TOP_FAQ_TEXT =
  'I can tell you about Yala’s animals (leopards, elephants, bears, birds…), the park’s blocks, the best time to visit, what to bring, park rules, getting there and nearby places. Just ask — for example “tell me about sloth bears” or “which block is best?”.';
