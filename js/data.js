/* ============================================================
   GHAZIA CREATIVES — Shared Data
   Plain globals (no modules). Load BEFORE main.js and order.js.
   ============================================================ */

// PKR — Category wise Pricing (1, 2, 3 Events)
const PRICING = {
  standard: { 1: 1499, 2: 2999, 3: 4999 },
  premium:  { 1: 2499, 2: 4999, 3: 7499 }
};

// ============================================================
// DESIGNS DATA — category: "standard" ya "premium"
// ============================================================
const designs = [
  {
    id: "enchanted-rapunzel",
    name: "Rapunzel's Lantern", 
    badge: "Fairy Tale",
    dynamic: true,
    maxPlan: 3,
    desc: "A fairy-tale forest invite with glowing lanterns and golden script. Includes bridesmaids, groomsmen, full event program, venue details with Google Maps, dress code, countdown timer and RSVP — all in one beautiful page. Perfect for those who want a dreamy Wedding Invite.",
    vibe: "Rapunzel Themed · Candlelit",
    category: "standard", 
    image: "images/design-1.webp",
    liveUrl: "t/enchanted-rapunzel/index.html?demo=1"
  },
  {
    id: "enchanted-garden",
    name: "Enchanted Garden",
    badge: "Enchanted Garden",
    dynamic: true,
    maxPlan: 3,
    desc: "A fresh garden-themed invite starts with a beautiful quranic verse. A full program section — event timings, venue details and RSVP. Guests can see a live countdown and scratch to reveal the wedding date. Elegant and easy to share with everyone.",
    vibe: "Botanical · Golden Hour",
    category: "standard", 
    image: "images/design-2.webp",
    liveUrl: "t/enchanted-garden/index.html?demo=1"
  },
  {
    id: "royal-nikah",
    name: "Emerald Vows Nikah", 
    badge: "Royal",
    dynamic: true,
    maxPlan: 3,
    desc: "A traditional emerald and gold invite with Quranic verse and English translation. Guests tap to open, scratch the card to reveal the date, and see both Nikah and Walima timings with Google Maps links. Includes photo gallery, countdown and RSVP form.",
    vibe: "Emerald · Traditional · Sacred",
    category: "standard", 
    image: "images/design-3.webp",
    liveUrl: "t/royal-nikah/index.html?demo=1"
  },
  {
    id: "bunny",
    name: "Blushing Bunny", 
    badge: "Interactive",
    dynamic: true,
    maxPlan: 3,
    desc: "Bunny Wecomes Your guests. A soft pink invite with little cute bunny animations. Guests tap to open, see the full program, venue details with Google Maps, countdown timer and RSVP form. Works beautifully on every screen.",
    vibe: "Pink · Floral · Cute",
    category: "premium", 
    image: "images/design-4.webp",
    liveUrl: "t/bunny/index.html?demo=1"
  },
  {
    id: "royal-blush",
    name: "Royal Blush",
    badge: "Soft & Floral",
    dynamic: true,
    maxPlan: 3,
    desc: "A blush-pink envelope invite with a gold wax seal — guests tap to open. Works beautifully on every screen. Starts with beautiful pink envelope opening and a video background. Includes full program, venue details, countdown timer and RSVP form.",
    vibe: "Blush · Interactive · Minimal",
    category: "premium", 
    image: "images/design-5.webp",
    liveUrl: "t/royal-blush/index.html?demo=1"
  },
  {
    id: "shaadi-festivities",
    name: "Shaadi Festivities",
    badge: "Premium",
    category: "premium", 
    dynamic: true,
    maxPlan: 3,
    desc: "One invite for your entire wedding week. Five beautiful pages — Mehendi, Qawali Night, Nikkah / Barat and Walima — each with its own theme, event date, venue details and Add to Google Calendar button.",
    vibe: "4 Events · 5 Pages · English / Urdu",
    delivery: "within few minutes",
    image: "images/design-6.webp",
    liveUrl: "t/shaadi-festivities/index.html?demo=1"
  },
  {
    id: "fairytale",
    name: "Fairytale",
    badge: "Fairy Tale",
    dynamic: true,
    maxPlan: 3,
    desc: "A dreamy fairytale invitation with enchanting visuals and magical details. Includes full event program, venue details, countdown timer and RSVP form.",
    vibe: "Romantic · Fairytale",
    category: "premium", 
    image: "images/design-7.webp",
    liveUrl: "t/fairytale/index.html?demo=1"
  },
  {
    id: "green-magic",
    name: "Emerald Magic", 
    badge: "Botanical",
    dynamic: true,
    maxPlan: 3,
    desc: "A beautiful botanical themed invitation with lush green aesthetics. Includes full event program, venue details, countdown timer and RSVP form.",
    vibe: "Green · Nature · Elegant",
    category: "standard", 
    image: "images/design-8.webp",
    liveUrl: "t/green-magic/index.html?demo=1"
  }
];