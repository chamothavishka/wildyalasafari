# Hosting Guide — Wild Yala Safari

මේ file එකේ ඔයාගේ site එක **internet එකට live කරන්න** ඕන කරන සියලුම steps තියෙනවා.
Recommended setup:

| Part | Service | Cost |
| --- | --- | --- |
| Website + API (Node server) | **Render** | Free (sleep වෙනවා) / $7 per month (always on) |
| Database | **MongoDB Atlas** (M0 free cluster) | Free |
| Domain | ඔයාගේ domain එක (`wildyalasafari.com`) | ~$10–12 / year |
| Payments | **PayHere** | Per transaction |
| E-mail | **Brevo** (free 300/day) හෝ Gmail app password | Free |

> ඇයි Render? Node.js 20+ direct support, GitHub එකෙන් auto-deploy, free HTTPS + custom domain,
> Singapore region (Sri Lanka එකට ළඟ), සහ MongoDB Atlas එකට connect වෙන්න network access configure කරන්න ලේසි.

---

## 0. දැනට තත්ත්වය

- ✅ Website production build එක හදලා test කරලා තියෙනවා (`npm run build` → `dist/`).
- ✅ Server එක (API + website) එකම process එකෙන් run වෙනවා → CORS ප්‍රශ්න නෑ.
- ❌ **MongoDB password එක වැරදියි.** `.env` එකේ තියෙන password එකෙන් Atlas එකට login වෙන්න බෑ
  (`bad auth : Authentication failed`). මේක හදන්නේ නැතුව site එක live කරලා වැඩක් නෑ — bookings save වෙන්නේ නෑ.

---

## 1. MongoDB Atlas (database)

### 1.1 Database user එකේ password එක හදන්න

1. https://cloud.mongodb.com → ඔයාගේ project එකට යන්න.
2. වම් පැත්තේ **Security → Database Access**.
3. `chamothavishka_db_user` user එක ළඟ **Edit** → **Edit Password** → අලුත් strong password එකක් දෙන්න.
   (අකුරු + ඉලක්කම් + `@ # $ %` වගේ symbols; `:` `/` `?` `&` `#` `%` `@` වගේ ඒවා URL එකට දාන්න බෑ — නැත්නම් encode කරන්න වෙනවා.)
4. **Update User**.
5. `.env` එකේ `MONGODB_URI` එකේ password එක replace කරන්න:
   `mongodb+srv://chamothavishka_db_user:NEW_PASSWORD@cluster0.im7p7lq.mongodb.net/wild-yala-safari?retryWrites=true&w=majority`

### 1.2 Network Access

1. **Security → Network Access → Add IP Address**.
2. Hosting server එකට ඕනෑම IP එකකින් connect වෙන්න පුළුවන් වෙන්න **Allow access from anywhere → `0.0.0.0/0`** දෙන්න.
   (Render free tier එකේ fixed IP නෑ, ඒ නිසා මේක අවශ්‍යයි. Password එක හොඳට තියාගන්න.)

### 1.3 Test

```bash
npm run check
```

මේකෙන් config, database connection, e-mail login ඔක්කොම check කරනවා. `All checks passed` ආවොත් හරි.

---

## 2. Code එක GitHub එකට දාන්න

Render එකට deploy කරන්න code එක GitHub එකේ තියෙන්න ඕන. Repo එක දැනටමත් clean කරලා තියෙනවා
(raw `Pictures/`, `Videos/`, `3dframes/` folders deploy එකට යන්නේ නෑ — ඒවා `.gitignore` එකේ).

1. https://github.com → **New repository** → නම `wild-yala-safari` → **Private** → Create.
2. ඔයාගේ computer එකේ project folder එකේ (`wild-yala-safari\`) මේ commands run කරන්න:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wild-yala-safari.git
git push -u origin main
```

> GitHub password වෙනුවට **Personal Access Token** එකක් ඉල්ලයි. GitHub → Settings → Developer settings →
> Personal access tokens → Tokens (classic) → Generate (scope: `repo`).

---

## 3. Render එකේ deploy කරන්න

1. https://render.com → **Sign up with GitHub**.
2. **New → Blueprint** → ඔයාගේ `wild-yala-safari` repo එක select කරන්න.
   (`render.yaml` file එක එකේ තියෙන නිසා Render settings ඔක්කොම auto fill වෙනවා.)
3. **Apply** කරන්න. ඊට පස්සේ service එකේ **Environment** tab එකට ගිහින් මේ values දෙන්න:

| Key | Value |
| --- | --- |
| `SITE_URL` | `https://wildyalasafari.com` (හෝ Render එකේ දෙන `https://xxxx.onrender.com` — පස්සේ domain එකට මාරු කරන්න) |
| `MONGODB_URI` | ඔයාගේ Atlas connection string එක |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` එකෙන් හදාගත්ත random string එක |
| `PAYHERE_MODE` | `sandbox` (test) → පස්සේ `live` |
| `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` | PayHere account එකෙන් |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_SECURE` / `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` | SMTP details |
| `CORS_ORIGINS` | `https://wildyalasafari.com,https://www.wildyalasafari.com` |

4. **Manual Deploy → Deploy latest commit**. Build එක (2–4 min) ඉවර වුණාම site එක live.
5. Check: `https://YOUR-SERVICE.onrender.com/api/health` → `{"status":"ok","database":"up",...}`

> **Free plan:** site එකට 15 min කිසිම visitor නැති වුණාම sleep වෙනවා. ඊළඟ visit එකේදී
> load වෙන්න තත්පර 30–60ක් ගන්නවා. Business site එකකට **Starter ($7/month)** ගන්න එක හොඳයි.

---

## 4. Domain එක (custom domain)

1. Render → service එක → **Settings → Custom Domains → Add Custom Domain** → `wildyalasafari.com`, ඊට පස්සේ `www.wildyalasafari.com`.
2. Render එකේ දෙන DNS records ඔයාගේ domain provider (Namecheap / GoDaddy / Hostinger / Cloudflare) එකේ **DNS** එකට දාන්න:

| Type | Name | Value |
| --- | --- | --- |
| `A` | `@` | Render එකේ දෙන IP එක (උදා: `216.24.57.1`) |
| `CNAME` | `www` | `YOUR-SERVICE.onrender.com` |

3. DNS propagate වෙන්න 5–30 min. Render එකෙන් **free HTTPS certificate** එක automatic.
4. `SITE_URL` එක `https://wildyalasafari.com` (trailing slash නැතුව) කියලා update කරන්න.

> SSL/HTTPS අනිවාර්යයි — PayHere notify URL එකට සහ secure cookies වලට.

---

## 5. PayHere live කරන්න

1. PayHere merchant account එකේ **Domains & Credentials** එකට `wildyalasafari.com` add කරලා approve කරගන්න.
2. Live **Merchant ID** + **Merchant Secret** එක Render එකේ `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` වලට දාන්න.
3. `PAYHERE_MODE=live` කරන්න.
4. Notify URL එක automatic: `https://wildyalasafari.com/api/payments/payhere/notify`

---

## 6. E-mail (confirmation emails)

- **Brevo** (recommended): https://brevo.com → free 300 emails/day. SMTP key එකක් ගන්න.
  `EMAIL_HOST=smtp-relay.brevo.com`, `EMAIL_PORT=587`, `EMAIL_SECURE=false`, `EMAIL_USER=...`, `EMAIL_PASSWORD=...`
- `EMAIL_FROM=Wild Yala Safari <bookings@wildyalasafari.com>` (domain verify කරන්න ඕන).
- Test: `npm run check -- --send-test your@email.com`

---

## 7. Login account එකක් හදන්න

Public sign-up නෑ — admin account එක ඔයාම හදන්න ඕන. **ඔයාගේ computer එකෙන්** (`.env` එකේ production
`MONGODB_URI` එක තියාගෙන):

```bash
npm run user:create -- you@example.com "StrongPass123!" "Your Name"
```

---

## 8. Final checklist

- [ ] `npm run build` success
- [ ] `npm run check` → All checks passed (database + e-mail)
- [ ] `/api/health` → `status: ok`, `database: up`
- [ ] Domain එකට HTTPS එකෙන් open වෙනවා
- [ ] Booking එකක් කරලා PayHere sandbox එකෙන් test payment එකක්
- [ ] Booking එක MongoDB Atlas එකේ `bookings` collection එකේ පේනවා
- [ ] Confirmation e-mail එක ආවා
- [ ] Login page එකෙන් admin account එකට sign in වෙන්න පුළුවන්

---

## වෙනත් hosting options

| Service | Pros | Cons |
| --- | --- | --- |
| **Render** (recommended) | Easiest, free tier, GitHub deploy, Singapore | Free tier sleep වෙනවා |
| **Railway** | Very easy, fast | $5/month credit only, no real free tier |
| **Fly.io** | Scales to zero, global | Credit card ඕන, configuration ටිකක් අමාරු |
| **Hostinger VPS** | ලංකාවට support, fixed monthly | nginx/SSL/Node ඔයාම manage කරන්න ඕන |
| **Vercel / Netlify** | Static site එකට හොඳ | ❌ Express server + MongoDB API එක run කරන්න බෑ (serverless rewrite ඕන) |
