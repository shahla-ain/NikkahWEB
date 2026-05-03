# 🌙 Nikah Invitation Website

A beautiful, secure, and fully customizable Islamic wedding (Nikah) invitation website with an admin control panel.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎨 Design | Elegant gold/dark-green Islamic theme, Arabic typography |
| 📱 Responsive | Mobile-first, works on all screen sizes |
| ⏳ Countdown | Animated flip-style countdown timer |
| 🖼️ Gallery | Lightbox gallery with lazy-loading |
| 📝 RSVP | Secure form with sanitized inputs |
| 🔐 Admin Panel | JWT-secured `/admin` dashboard |
| 🛡️ Security | XSS prevention, bcrypt passwords, rate limiting |
| 📤 Share | WhatsApp share + copy link button |
| 🎵 Nasheed | Optional background audio with mute toggle |
| ⚙️ Config | All personal details in one `config.js` file |

---

## 📁 Project Structure

```
nikah-invite/
├── src/
│   ├── index.html          ← Main invitation page
│   ├── config.js           ← ✏️  Edit all personal details here
│   ├── admin/
│   │   └── index.html      ← Admin control panel
│   ├── gallery/            ← Add your photos here
│   │   └── photo1.jpg  ...
│   └── audio/
│       └── nasheed.mp3     ← Add your nasheed here
├── api/
│   └── index.js            ← Serverless API (RSVP + auth)
├── netlify/
│   └── functions/
│       └── api.js          ← Netlify Functions wrapper
├── scripts/
│   └── generate-hash.js    ← Generate admin password hash
├── netlify.toml            ← Netlify config
├── vercel.json             ← Vercel config
├── package.json
├── .env.example            ← Copy to .env and fill values
└── .gitignore
```

---

## 🚀 Quick Start

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Customize wedding details

Open `src/config.js` and edit everything:

```js
bride: { name: "Fatima", arabicName: "فاطمة" },
groom: { name: "Omar",   arabicName: "عمر" },
events: [{ date: "2025-08-15", time: "10:00 AM", venue: "Al-Noor Masjid", ... }]
```

### Step 3 — Set up environment variables

```bash
cp .env.example .env
```

**Generate your admin password hash:**
```bash
node scripts/generate-hash.js
# Type your chosen password → copies a hash
# Paste the hash as ADMIN_PASS_HASH in .env
```

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# Paste output as JWT_SECRET in .env
```

Your `.env` should look like:
```env
ADMIN_USERNAME=admin
ADMIN_PASS_HASH=$2b$12$yourGeneratedHashHere...
JWT_SECRET=your64charRandomStringHere...
```

### Step 4 — Add your photos

Place photos in `src/gallery/` named `photo1.jpg`, `photo2.jpg`, etc.  
Update the `gallery` array in `config.js` with your file names and captions.

### Step 5 — Add nasheed (optional)

Place an MP3 file at `src/audio/nasheed.mp3`.  
Disable it by setting `nasheed.enabled: false` in `config.js`.

---

## 🌐 Deployment

### Deploy to Netlify

1. Push your code to GitHub (make sure `.env` is in `.gitignore` ✅)
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Build settings:
   - **Publish directory:** `src`
   - **Build command:** *(leave empty)*
4. Go to **Site settings → Environment variables** and add:
   - `ADMIN_USERNAME` → your username
   - `ADMIN_PASS_HASH` → the hash from step 3
   - `JWT_SECRET` → the 64-char string from step 3
5. Deploy! Your site will be live at `your-site.netlify.app`

### Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Framework preset: **Other**
4. Go to **Settings → Environment Variables** and add the same 3 variables
5. Deploy! Your site will be live at `your-site.vercel.app`

---

## 🔐 Security Overview

| Layer | Implementation |
|---|---|
| Password Storage | bcrypt (cost factor 12) — never stores plaintext |
| Authentication | JWT HS256, 8-hour expiry |
| Session Storage | sessionStorage (cleared on tab close) |
| Rate Limiting | 5 attempts per 15 min per IP |
| Input Sanitization | All user inputs stripped of `<>` and JS injection patterns |
| Headers | X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS |
| Admin Route | Separate `/admin` page, never linked from public site |
| Token Transmission | Bearer token in Authorization header (never in URL) |

---

## ⚙️ Admin Panel

Navigate to: `https://your-site.netlify.app/admin`

**Login** with your `ADMIN_USERNAME` and the plain password you hashed.

**Dashboard features:**
- 📊 RSVP statistics (total, attending, declined, guest count)
- 📋 Full RSVP responses table
- ✏️ Edit wedding details (names, dates, venues) without redeploying

---

## 🗄️ Database (Optional)

By default, RSVPs are stored in-memory (lost on cold start). For production:

1. Create a free database on [Supabase](https://supabase.com) or [Railway](https://railway.app)
2. Add `DATABASE_URL=postgresql://...` to your env vars
3. In `api/index.js`, replace the `db` object with a real PostgreSQL adapter:

```js
const { Client } = require('pg');
const db = {
  async insertRsvp(data) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const result = await client.query(
      'INSERT INTO rsvps (name, email, attendance, event, guests, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [data.name, data.email, data.attendance, data.event, data.guests, data.message]
    );
    await client.end();
    return result.rows[0];
  },
  async getAllRsvps() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const result = await client.query('SELECT * FROM rsvps ORDER BY created_at DESC');
    await client.end();
    return result.rows;
  }
};
```

---

## 🛠️ Customization Tips

- **Colors:** Edit CSS custom properties at the top of `src/index.html`
- **Fonts:** Change the Google Fonts import and `--font-*` variables
- **Events:** Add more events to the `events` array in `config.js`
- **Gallery:** Add/remove items from the `gallery` array
- **Quran verse:** Change `openingVerse` in `config.js`
- **Footer quote:** Change `footerQuote` in `config.js`

---

## 📄 License

MIT — free to use for personal Nikah celebrations. 💍

---

*Made with ❤️ and duaa for blessed unions.*
