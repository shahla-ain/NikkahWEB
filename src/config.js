/**
 * ============================================================
 *  NIKAH INVITATION — WEDDING CONFIGURATION FILE
 *  Edit all personal details here. No other files need editing.
 * ============================================================
 */
const weddingConfig = {
  // ── Couple ────────────────────────────────────────────────
  bride: {
    name: "Fatima",
    arabicName: "فاطمة",
    familyName: "Daughter of Ibrahim Al-Rashid"
  },
  groom: {
    name: "Omar",
    arabicName: "عمر",
    familyName: "Son of Abdullah Al-Hassan"
  },

  // ── Event Details ─────────────────────────────────────────
  events: [
    {
      id: "nikah",
      title: "Nikah Ceremony",
      arabicTitle: "عقد النكاح",
      date: "2025-08-15",          // ISO format YYYY-MM-DD
      time: "10:00 AM",
      venue: "Al-Noor Masjid",
      address: "123 Crescent Lane, London, E1 4AB",
      icon: "🕌"
    },
    {
      id: "walima",
      title: "Walima Reception",
      arabicTitle: "وليمة",
      date: "2025-08-16",
      time: "6:30 PM",
      venue: "Royal Grand Banquet Hall",
      address: "45 Garden Boulevard, London, SW1 8CD",
      icon: "🌙"
    }
  ],

  // ── Countdown Target (main ceremony date/time) ────────────
  countdownTo: "2025-08-15T10:00:00",

  // ── Messages & Quotes ──────────────────────────────────────
  heroTagline: "Together in Faith, Forever in Love",
  openingVerse: {
    arabic: "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا",
    translation: "And of His signs is that He created for you from yourselves mates that you may find tranquillity in them",
    reference: "— Quran 30:21"
  },
  footerQuote: {
    arabic: "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ",
    translation: "May Allah bless you both, and may He bless your union and bring you together in goodness."
  },

  // ── Gallery Images (paths relative to /public/gallery/) ───
  gallery: [
    { src: "gallery/photo1.jpg", caption: "Our Story Begins" },
    { src: "gallery/photo2.jpg", caption: "A Blessed Meeting" },
    { src: "gallery/photo3.jpg", caption: "Forever Together" },
    { src: "gallery/photo4.jpg", caption: "In His Blessing" },
    { src: "gallery/photo5.jpg", caption: "Our Journey" },
    { src: "gallery/photo6.jpg", caption: "Bound by Faith" }
  ],

  // ── Background Nasheed Audio ──────────────────────────────
  nasheed: {
    enabled: true,
    src: "audio/nasheed.mp3",
    title: "Ya Taiba - Background Nasheed"
  },

  // ── RSVP Settings ─────────────────────────────────────────
  rsvp: {
    deadline: "2025-08-01",
    maxGuests: 2,
    contactEmail: "rsvp@nikah-invite.com",
    whatsappNumber: "+447700900000"     // include country code, no spaces
  },

  // ── Site Meta ─────────────────────────────────────────────
  siteName: "Fatima & Omar | Nikah 2025",
  siteUrl: "https://fatima-omar-nikah.netlify.app",
  metaDescription: "Join us in celebrating the blessed union of Fatima & Omar. Nikah ceremony on 15 August 2025."
};

// Make available globally (plain JS) and as ES module
if (typeof module !== "undefined") module.exports = weddingConfig;
