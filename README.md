# Wild Yala Safari — cinematic 3D safari website

A premium, fully responsive website for **Wild Yala Safari**: a single-page site
(Home · About · Safari Packages · Gallery · Reviews · Contact) plus separate
**Booking** and **Login** pages, backed by a small Node.js server with **MongoDB**, a real **PayHere**
payment integration, server-side payment verification, customer confirmation e-mails and secure sign-in.
See **[Backend, payments & hosting](#backend-payments--hosting)** below.

## Run it

```bash
npm install
npm run dev          # website only (Vite dev server)  → http://localhost:5173
npm run dev:server   # API on :4000 — needs a .env (see below); Vite proxies /api to it
npm run build        # production build → dist/
npm start            # production: serves dist/ + the API from ONE server (needs .env)
npm test             # pricing tests + backend tests (API, payments, e-mail, auth, security)
```

No-Vite alternative (only needs esbuild): `npm run serve` builds to `dist/` and serves it.
`dist/` is plain static files — upload it to any host (Netlify, Vercel, cPanel, S3…).

## Where to edit things

| What | File |
| --- | --- |
| Contact details (email, **WhatsApp number**, phone) | `src/data/content.js` → `CONTACT` |
| **Facebook / Instagram / TikTok links** (menu icons stay greyed out until set) | `src/data/content.js` → `CONTACT.social` |
| **Ayubowan guide video** | add `public/media/ayubowan-guide.mp4` (optional `.webm`) — see below |
| Elephant video / posters | `src/data/content.js` → `MEDIA` |
| Sign-in service URLs | already set to the built-in backend (`.env.production` / `.env.development`) |
| All copy: hero chapters, about, wildlife, itineraries, gallery | `src/data/content.js` |
| Guest reviews (empty = honest "coming soon" placeholders) | `src/data/content.js` → `REVIEWS` |
| Prices, jeep capacity, group cap | `src/lib/pricing.js` → `SAFARI_PRICING`, `MAX_PER_JEEP`, `MAX_GROUP` |
| Exchange rates (indicative, mock) | `src/lib/currency.js` → `CURRENCIES` |
| Real 3D vehicle models (.glb) | put files in `public/models/`, set `url` in `src/three/VehicleStage.js` → `VEHICLE_MODELS` |
| Wildlife photos | add `image: './media/…'` to an animal in `WILDLIFE` |
| Payment gateway | `server/services/payhere.js` + `src/components/booking/PaymentModal.jsx` (see Backend section) |
| Colours, type, spacing | `src/styles/base.css` (`:root` tokens) |

## Pricing rules (centralised in `src/lib/pricing.js`)

- Jeep base price includes the jeep and the first adult; each extra adult and each child (6–11) adds its rate.
- Children 1–5 are always free but occupy a seat.
- Max 6 people per jeep; every additional jeep adds that vehicle's base price.
- `total = jeeps × base + (adults − 1) × extraAdult + children × extraChild`

## Architecture

- `src/main.jsx` single-page site · `src/booking.jsx` booking page · `src/login.jsx` login page
- Hero: progressive canvas image-sequence (120 desktop / 80 mobile WebP frames) scrubbed by scroll, with idle "breathing" loop, parallax camera, dust, letterbox and chapter typography.
- 3D: Three.js stage (`src/three/`), lazy-loaded on approach, procedural Hilux & Land Cruiser, drag/swipe/arrow keys limited to a 180° arc, drive-out/drive-in model switching, "drive towards camera" booking transition.
- Selection flows to the Booking page via URL (`?s=…`) + sessionStorage, and is recalculated on arrival (stored totals are never trusted).
- Accessibility: semantic landmarks, keyboard support (tabs, radio groups, listbox, calendar grid, modals with focus trap), visible focus, reduced-motion support.
- Performance: code-split Three.js chunk, lazy images, frame loading coarse-to-fine, effects paused off-screen, `html.low-power` mode drops blur/grain on weak devices.

## Update — October 2026

What changed (everything else is as before):

- **Menu:** numbers removed, normal-sized names, cleaner panel, WhatsApp / Facebook / Instagram / TikTok icons.
- **Header:** the curved notch behind the logo is now one smooth SVG shape at every screen size; logo and menu button aligned.
- **Explore the Wildlife of Yala:** carousel ~50% faster and smoother (frame-time capped, gentler easing).
- **3D jeeps:** rebuilt Toyota Hilux (single-cab safari conversion) and Land Cruiser 70-series models — real side profiles, grille, headlamps, bumpers, mirrors, flares, alloy / steel wheels. Used in Safari Packages and the Booking summary.
- **Ayubowan panel:** illustrated girl removed; silent looping video slot for your guide clip.
- **A World of Wild Encounters:** elephant video on the right (stacks under the text on phones).
- **Sizes:** oversized headings, buttons, cards and spacing scaled to normal proportions.
- **Login:** refreshed design; no fake sign-in — it calls your auth service once configured, otherwise explains that online sign-in isn't available yet.
- **Booking page:** CSS-only refinements (spacing, sizing, tablet layout). Its text, fields, buttons, links and logic are unchanged (verified by DOM comparison).

### Adding the Ayubowan video

1. Export your clip as **MP4 (H.264)**, no audio, ideally 1080×1350 (4:5) or 1080×1920. Keep the face and the
   palms-together gesture in the upper-middle of the frame.
2. Save it as `public/media/ayubowan-guide.mp4`. Optionally also `ayubowan-guide.webm` (VP9) for browsers without H.264.
3. If the face is cropped on phones, adjust `MEDIA.guidePosition` (e.g. `'50% 20%'`) in `src/data/content.js`.

Until the file exists, the panel shows the poster image (`MEDIA.guidePoster`).
Suggested compression: `ffmpeg -i input.mov -an -vf scale=1080:-2 -c:v libx264 -crf 22 -preset slow -movflags +faststart ayubowan-guide.mp4`

### Elephant video — permission

`public/media/elephant-walk.mp4/.webm` is trimmed from a TikTok clip by **@travelvoicelk** (their watermark is kept).
Get the creator's written permission before publishing it on the business website, or replace it with your own
footage using the same file names.

## Backend, payments & hosting

One Node.js process serves the built website (`dist/`) **and** the API (`/api/...`) from the same origin, so there is no
CORS to configure and no API URL to hard-code.

```
server/
  index.js            start-up: config check → MongoDB → HTTP server
  app.js              Express app: security headers (CSP), CORS, parsers, routes, static site
  config.js           all settings come from environment variables (see .env.example)
  models/             Booking, User (Mongoose)
  routes/             auth · bookings · payments · password-reset page
  services/           quote (server-side pricing) · payhere · paymentService · emailService · authService · bookingService
  emails/             booking-confirmation + password-reset e-mails (site colours)
  middleware/         validation, rate limits, origin check, sessions, error handling
  scripts/            create-user.js · retry-emails.js
  test/               backend tests (run with `npm test`)
```

### How a booking becomes confirmed

1. The customer fills in the Booking page and presses **Pay**. The browser sends only the *selection* (safari, jeep, passengers, currency, contact details).
2. The server **validates everything again and calculates the price itself** with the same `src/lib/pricing.js` the website uses (the browser's price is never trusted). It saves a **PENDING** booking in MongoDB with a unique booking ID (`WYS-XXXXXXXXXX`).
3. The customer is redirected to **PayHere's hosted payment page** and enters their card there (card details never touch this website or server).
4. PayHere calls `POST /api/payments/payhere/notify` (server to server). The server checks PayHere's **MD5 signature**, the merchant, the order, the **amount and currency**, and only then marks the booking **PAID / CONFIRMED** — with one atomic database update, so duplicate or simultaneous notifications can never create a second payment, confirmation or e-mail.
5. After that the server sends the **confirmation e-mail** (once). If the e-mail fails, the booking stays PAID/CONFIRMED, the failure is recorded on the booking (`email.status = FAILED`) and it can be re-sent with `npm run emails:retry` (or automatically when PayHere repeats its notification).
6. The customer's return to `booking.html?order=…` only *reads* the status from the server; it shows "Payment Received" only when the server says PAID. Failed and cancelled payments are shown as such and never confirm a booking or send an e-mail.

Booking statuses: `paymentStatus` = PENDING · PAID · FAILED · CANCELLED · CHARGEDBACK; `bookingStatus` = PENDING · CONFIRMED · CANCELLED.

### Configuration

Copy `.env.example` to `.env` (local) or set the same names as environment variables on your host. Never commit `.env`.
Required: `MONGODB_URI`, `JWT_SECRET`, `SITE_URL`. For payments: `PAYHERE_MODE`, `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`.
For e-mails: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`.
The server refuses to start in production without the required ones and prints warnings for missing payment / e-mail settings.

### Going live with PayHere

1. Create a PayHere merchant account, add and get your **domain approved** (live mode needs this), and note the **Merchant ID** and **Merchant Secret** for that domain.
2. Test first with `PAYHERE_MODE=sandbox` and your *sandbox* credentials. PayHere must be able to reach `SITE_URL/api/payments/payhere/notify` from the internet (when testing locally use a tunnel such as ngrok and set `SITE_URL` / `PAYHERE_NOTIFY_URL` to it).
3. Switch to `PAYHERE_MODE=live` with your live credentials.

### Sign-in

The Login page talks to `POST /api/auth/login` (httpOnly session cookie, bcrypt-hashed passwords, lock-out after repeated failures) and "Forgot password?" to `POST /api/auth/password-reset` (e-mails a one-time link to a small server-rendered "choose a new password" page).
There is no public sign-up form, so create accounts yourself:

```bash
npm run user:create -- you@example.com "A strong password 123" "Full Name"
```

### Hosting

Any host that runs Node.js 20+ (or Docker) works. With Docker: `docker build -t wild-yala-safari .` then `docker run -p 4000:4000 --env-file .env wild-yala-safari`.
Without Docker: `npm ci && npm run build && npm start` with the environment variables set. Put it behind HTTPS (the platforms above do this for you) and set `SITE_URL` to the https address. A MongoDB Atlas free/shared cluster is enough; allow your host's IP address in Atlas "Network Access".
Health check: `GET /api/health`.

### Notes

- **Exchange rate:** USD amounts use `src/lib/currency.js` (1 USD = 300 LKR, an indicative fixed rate). Change it there if you want a different rate; the server and the website always use the same value.
- **Elephant video:** `public/media/elephant-wild.*` — keep permission/credits for any third-party footage you publish.
- **Security:** see `server/app.js` (Content-Security-Policy, headers), `server/middleware/security.js` (rate limits, origin check). Behind a reverse proxy leave `TRUST_PROXY=1`; set `0` if the app is exposed directly.
