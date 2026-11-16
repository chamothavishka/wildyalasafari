/**
 * Website content. Edit copy, contact details and media paths here.
 */

export const BRAND = {
  name: 'Wild Yala Safari',
  tagline: 'Explore the Wild',
  coords: '6.37° N · 81.52° E',
};

// Contact details — replace the placeholders with your real details.
// Leave `phone` / `whatsapp` empty to hide them; WhatsApp links fall back to
// WhatsApp's "choose a chat" screen when no number is set.
export const CONTACT = {
  email: 'info@wildyalasafari.com',
  whatsapp: '40774131751', // international format without "+" or spaces
  phone: '+40 774 131 751', // display format
  location: 'Wild Yala Safari, Ellagala, Tissamaharama 82619, Sri Lanka',
  // Company location on Google Maps (short link + coordinates used for the embedded map)
  mapUrl: 'https://maps.app.goo.gl/ZcMr5eEC11MMNrmQ7?g_st=aw',
  mapLat: 6.333527,
  mapLng: 81.241203,
  // Social accounts — paste your real profile URLs here. Empty = not linked yet
  // (the icon stays visible in the menu but is not clickable). Never invent URLs.
  social: {
    facebook: 'https://www.facebook.com/share/19PaBJvuTr/',
    instagram: 'https://instagram.com/wildyalasafari?xtok=MWJza2JsNXd0d3UwYQ%3D%3D',
    tiktok: '', // e.g. 'https://www.tiktok.com/@yourhandle'
  },
};

export function whatsappLink(text = '') {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return CONTACT.whatsapp ? `https://wa.me/${CONTACT.whatsapp}${q}` : `https://wa.me/${q}`;
}

/** Social links in display order. WhatsApp always works (it uses the number above, or WhatsApp's chat picker). */
export function socialLinks() {
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: whatsappLink('Hello Wild Yala Safari!') },
    { id: 'facebook', label: 'Facebook', href: CONTACT.social.facebook },
    { id: 'instagram', label: 'Instagram', href: CONTACT.social.instagram },
    { id: 'tiktok', label: 'TikTok', href: CONTACT.social.tiktok },
  ];
}

export function mailtoLink(subject = '', body = '') {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const q = params.toString().replace(/\+/g, '%20');
  return `mailto:${CONTACT.email}${q ? `?${q}` : ''}`;
}

export const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'packages', label: 'Safari Packages' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

/** Hero chapters — mapped onto the leopard frame sequence by scroll progress. */
export const HERO_CHAPTERS = [
  {
    id: 'intro',
    start: 0,
    end: 0.22,
    eyebrow: 'Yala National Park · Sri Lanka',
    kicker: 'Into the Wild Heart of Yala',
    title: 'Wild Yala Safari',
    body: 'Private 4x4 jeep safaris through Sri Lanka’s most celebrated wilderness, guided by experienced local trackers who know every trail, waterhole and leopard territory.',
    align: 'center',
  },
  {
    id: 'stalk',
    start: 0.22,
    end: 0.47,
    eyebrow: '01 — The Stalk',
    title: 'Every Track',
    accent: 'Tells a Story',
    body: 'Our guides read the landscape — fresh pugmarks, alarm calls and the stillness before a sighting — to bring you closer to the moment.',
    align: 'left',
  },
  {
    id: 'kingdom',
    start: 0.47,
    end: 0.72,
    eyebrow: '02 — The Kingdom',
    title: 'Home of the',
    accent: 'Sri Lankan Leopard',
    body: 'Yala is renowned for one of the highest leopard densities in the world, alongside elephants, sloth bears and more than two hundred species of birds.',
    align: 'right',
  },
  {
    id: 'encounter',
    start: 0.72,
    end: 1.01,
    eyebrow: '03 — The Encounter',
    title: 'Your Safari',
    accent: 'Begins Here',
    body: 'Morning, evening or a full day in the wild — choose the experience that suits you and reserve your private jeep in minutes.',
    align: 'right',
    cta: true,
  },
];

export const ABOUT = {
  lead: 'Wild Yala Safari offers private 4x4 jeep safaris through Yala National Park — Sri Lanka’s most celebrated wilderness and home of the elusive Sri Lankan leopard.',
  paragraphs: [
    'Every safari is led by experienced local guides who know the rhythms of the park — where elephants gather at the waterholes, where sloth bears forage at dusk and where a leopard may rest in the shade of a rocky outcrop.',
    'We keep groups small and private, so you can travel at your own pace, stop for every sighting and enjoy the wilderness in comfort. From early-morning departures to golden-hour drives, our focus is simple: a safe, respectful and unforgettable connection with Sri Lanka’s wildlife.',
  ],
  pillars: [
    { icon: 'shield', title: 'Safety First', text: 'Well-maintained 4x4 jeeps, careful driving and park-approved practices on every drive.' },
    { icon: 'compass', title: 'Expert Local Guides', text: 'Guides who grew up around Yala and track wildlife by sound, sign and season.' },
    { icon: 'seat', title: 'Private & Comfortable', text: 'Your own jeep and your own pace, with hotel pick-up and drop-off included.' },
    { icon: 'leaf', title: 'Respect for Nature', text: 'Quiet, responsible wildlife viewing that keeps the animals and their habitat first.' },
  ],
};

/** Headline numbers shown (and counted up) in the About section. Replace with your real figures. */
export const STATS = [
  { value: 5999, suffix: '+', label: 'Safaris Done' },
  { value: 98, suffix: '%', label: 'Happy Guests' },
  { value: 30, suffix: '+', label: 'Years Experience' },
];

export const WILDLIFE = [
  { name: 'Sri Lankan Leopard', type: 'Mammal', text: 'The island’s apex predator and the star of Yala’s rocky plains.', image: './media/wildlife/sri-lankan-leopard.jpg', focus: '50% 50%' },
  { name: 'Asian Elephant', type: 'Mammal', text: 'Family herds gather at the lagoons and waterholes.', image: './media/wildlife/asian-elephant.jpeg', focus: '55% 50%' },
  { name: 'Sloth Bear', type: 'Mammal', text: 'Shy foragers often seen near termite mounds and fruiting trees.', image: './media/wildlife/sloth-bear.jpeg', focus: '50% 50%' },
  { name: 'Spotted Deer', type: 'Mammal', text: 'Graceful herds grazing across the open grasslands.', image: './media/wildlife/spotted-deer.jpeg', focus: '50% 50%' },
  { name: 'Sambar Deer', type: 'Mammal', text: 'Sri Lanka’s largest deer, at home along the forest edges.', image: './media/wildlife/sambar-deer.avif', focus: '50% 100%' },
  { name: 'Wild Water Buffalo', type: 'Mammal', text: 'Wallowing in the lagoons through the heat of the day.', image: './media/wildlife/wild-water-buffalo.jpeg', focus: '50% 50%' },
  { name: 'Wild Boar', type: 'Mammal', text: 'Bold foragers rooting along the forest trails.', image: './media/wildlife/wild-boar.webp', focus: '50% 70%' },
  { name: 'Golden Jackal', type: 'Mammal', text: 'Resourceful hunters and scavengers of the open plains.', image: './media/wildlife/golden-jackal.jpeg', focus: '50% 25%' },
  { name: 'Grey Langur', type: 'Mammal', text: 'Leaf-eating monkeys watching quietly from the canopy.', image: './media/wildlife/grey-langur.jpeg', focus: '50% 40%' },
  { name: 'Toque Macaque', type: 'Mammal', text: 'Lively troops found only in Sri Lanka.', image: './media/wildlife/toque-macaque.webp', focus: '50% 30%' },
  { name: 'Mugger Crocodile', type: 'Reptile', text: 'Ancient hunters basking on the banks of Yala’s lagoons.', image: './media/wildlife/mugger-crocodile.jpeg', focus: '60% 50%' },
  { name: 'Water Monitor', type: 'Reptile', text: 'Large lizards patrolling the water’s edge.', image: './media/wildlife/water-monitor.jpg', focus: '50% 10%' },
  { name: 'Indian Peafowl', type: 'Bird', text: 'Brilliant peacocks displaying across the scrubland.', image: './media/wildlife/indian-peafowl.webp', focus: '50% 50%' },
  { name: 'Crested Serpent Eagle', type: 'Bird', text: 'A patient raptor perched high above the forest.', image: './media/wildlife/crested-serpent-eagle.jpeg', focus: '50% 15%' },
  { name: 'Grey-headed Fish Eagle', type: 'Bird', text: 'A skilled hunter of the park’s lakes and reservoirs.', image: './media/wildlife/grey-headed-fish-eagle.jpeg', focus: '50% 20%' },
  { name: 'White-bellied Sea Eagle', type: 'Bird', text: 'A majestic coastal raptor soaring over Yala’s shoreline.', image: './media/wildlife/white-bellied-sea-eagle.jpeg', focus: '50% 50%' },
];

export const PACKAGES = [
  {
    id: 'morning',
    name: 'Morning Safari',
    icon: 'sunrise',
    time: '4:45 AM – 11:30 AM',
    headline: 'Start Your Day in the Wild',
    description:
      'Begin your Yala adventure at sunrise, when the park is at its most peaceful and wildlife is at its most active. Our morning safari is the perfect opportunity to search for leopards, elephants, deer, birds and more in the golden light of early morning.',
    itinerary: [
      { time: '4:45 AM', title: 'Hotel Pick-up', text: 'Our friendly guide and safari jeep arrive at your hotel or meeting point.' },
      { time: '5:15 AM', title: 'Journey to Yala National Park', text: 'Travel comfortably towards the park entrance as the day begins.' },
      { time: '6:00 AM', title: 'Enter Yala National Park', text: 'Your wildlife journey begins. Explore Yala’s trails, grasslands, forests and waterholes with an experienced local guide.' },
      { time: '9:00 AM', title: 'Refreshment Break', text: 'Enjoy a short break in a scenic area, with time to relax and take in the surroundings.' },
      { time: '10:30 AM', title: 'Exit the Park', text: 'End your safari with unforgettable memories of Yala’s wilderness.' },
      { time: '11:30 AM', title: 'Return Transfer', text: 'We drop you back at your hotel or preferred location.' },
    ],
    note: 'Timings may vary slightly depending on your hotel location, park conditions, weather and wildlife activity.',
    inclusions: ['Park entry tickets', '4x4 Jeep', 'Water bottles', 'Face masks', 'Binoculars'],
    media: './media/pkg-morning.webp',
  },
  {
    id: 'evening',
    name: 'Evening Safari',
    icon: 'sunset',
    time: '1:30 PM – 6:30 PM',
    headline: 'Chase the Golden Hour in Yala',
    description:
      'As the afternoon softens, Yala comes alive once again. Our evening safari takes you deep into the park during one of the most beautiful times of day — perfect for wildlife sightings, photography and unforgettable sunset landscapes.',
    itinerary: [
      { time: '1:30 PM', title: 'Hotel Pick-up', text: 'Our guide and safari jeep collect you from your hotel or agreed meeting point.' },
      { time: '2:00 PM', title: 'Journey to Yala National Park', text: 'Travel comfortably to the park entrance and prepare for your afternoon adventure.' },
      { time: '2:30 PM', title: 'Enter Yala National Park', text: 'Begin your safari through Yala’s forests, open grasslands, lagoons and waterholes.' },
      { time: '4:45 PM', title: 'Golden-Hour Wildlife Viewing', text: 'Enjoy the final part of your safari in the soft evening light — an ideal time for scenic views and wildlife photography.' },
      { time: '5:30 PM', title: 'Exit the Park', text: 'Leave the park with lasting memories of Yala’s wild beauty.' },
      { time: '6:30 PM', title: 'Return Transfer', text: 'We drop you back at your hotel or preferred location.' },
    ],
    note: 'Timings may vary slightly depending on your hotel location, park entry times, weather conditions and wildlife activity.',
    inclusions: ['Park entry tickets', '4x4 Jeep', 'Water bottles', 'Face masks', 'Binoculars'],
    media: './media/pkg-evening.webp',
  },
  {
    id: 'fullday',
    name: 'Full Day Safari',
    icon: 'sun',
    time: '4:45 AM – 6:30 PM',
    headline: 'A Complete Day in the Wild',
    description:
      'Experience Yala at its fullest with a full-day private safari. From the first light of morning to the golden glow of evening, you will have more time to explore different areas of the park and increase your chances of remarkable wildlife sightings.',
    itinerary: [
      { time: '4:45 AM', title: 'Hotel Pick-up', text: 'Your private safari jeep and experienced local guide collect you from your hotel or agreed meeting point.' },
      { time: '6:00 AM', title: 'Morning Safari Begins', text: 'Enter Yala National Park and explore its forests, grasslands, lagoons and waterholes during the most active hours.' },
      { time: 'Around 8:30 AM', title: 'Picnic Breakfast', text: 'Enjoy breakfast in a scenic area of the park while staying close to the wild.' },
      { time: '6:00 – 11:00 AM', title: 'Morning Wildlife Experience', text: 'Search for leopards, elephants, sloth bears, deer, crocodiles, peacocks and a rich variety of birdlife.' },
      { time: '12:00 – 2:30 PM', title: 'Lunch Break', text: 'Take time to rest, refresh and prepare for the afternoon safari.' },
      { time: '2:30 – 5:30 PM', title: 'Evening Wildlife Experience', text: 'Explore new areas of the park and enjoy the beautiful golden-hour light — ideal for photography and memorable wildlife movement.' },
      { time: '6:30 PM', title: 'Return Transfer', text: 'We return you safely to your hotel or preferred location.' },
    ],
    note: 'Timings may vary based on hotel location, park entry times, weather, road conditions and wildlife activity.',
    inclusions: ['Park entry tickets', '4x4 Jeep', 'Breakfast', 'Lunch', 'Water bottles', 'Face masks', 'Binoculars', 'Snacks'],
    media: './media/pkg-fullday.webp',
  },
];

export const PACKAGE_MAP = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));

export const GALLERY = [
  { src: './media/moment-approach.webp', thumb: './media/moment-approach-sm.webp', title: 'The Approach', caption: 'Silent steps through the dry grass.', size: 'xl', pos: '50% 60%' },
  { src: './media/moment-roar.webp', thumb: './media/moment-roar-sm.webp', title: 'The Roar', caption: 'A warning that echoes through the forest.', size: 'md', pos: '50% 4%' },
  { src: './media/moment-chase.webp', thumb: './media/moment-chase-sm.webp', title: 'The Chase', caption: 'Out on the trail, wherever the wild leads.', size: 'md', pos: '50% 50%' },
  { src: './media/moment-eye.webp', thumb: './media/moment-eye-sm.webp', title: 'Eye of the Wild', caption: 'The quiet gaze of Yala’s apex predator.', size: 'tall', pos: '50% 82%' },
  { src: './media/moment-face.webp', thumb: './media/moment-face-sm.webp', title: 'Face to Face', caption: 'The moment every safari hopes for.', size: 'wide', pos: '50% 6%' },
  { src: './media/moment-golden.webp', thumb: './media/moment-golden-sm.webp', title: 'Golden Hour', caption: 'Soft evening light over the plains.', size: 'md', pos: '50% 12%' },
  { cta: true, size: 'md' },
];

/**
 * Guest reviews. Add genuine reviews here and they replace the placeholder
 * slots automatically, e.g.
 * { name: 'Jane D.', role: 'Wildlife Photographer', country: 'United Kingdom', rating: 5, safari: 'Morning Safari', date: 'March 2026', text: '…', photo: './media/reviews/jane.webp' }
 * `role` and `photo` are optional (no photo shows the first letter of the name). Only use a photo the guest
 * sent you and agreed to have shown; put the file in public/media/reviews/.
 */
export const REVIEWS = [];

export const CONTACT_COPY = {
  interests: ['Morning Safari', 'Evening Safari', 'Full Day Safari', 'Not sure yet'],
};

/**
 * Section videos (MP4 / H.264, silent). Put files in public/media/.
 * - guideVideo: your Ayubowan greeting clip. Until the file exists, the poster is shown.
 * - elephantVideo: a herd of elephants at the lagoon, fades in and out as it loops (A World of Wild Encounters).
 */
export const MEDIA = {
  // Each video can list several formats; the browser plays the first it supports.
  guideVideo: [
    { src: './media/ayubowan-guide.mp4', type: 'video/mp4' },
    { src: './media/ayubowan-guide.webm', type: 'video/webm' },
  ],
  guidePoster: './media/golden.webp',
  guidePosition: '50% 30%', // keep the face and greeting gesture in frame when cropped
  elephantVideo: [
    { src: './media/elephant-wild.mp4', type: 'video/mp4; codecs="avc1.640028"' },
    { src: './media/elephant-wild.webm', type: 'video/webm; codecs="vp9"' },
  ],
  elephantPoster: './media/elephant-wild-poster.webp',
  elephantPosition: '62% 50%',
};
