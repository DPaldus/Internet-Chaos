/* Balance values, editorial policies and Internet Eras.
   Everything a designer would want to tweak lives in this file or in js/content/. */
(function (Z) {
  'use strict';

  Z.VERSION = 1;
  Z.SAVE_KEY = 'internet-chaos:save';
  Z.BACKUP_KEY = 'internet-chaos:backup';
  Z.CORRUPT_KEY = 'internet-chaos:corrupt';

  /* Times are seconds. Chaos, Stability and Tolerance are percentages. */
  Z.BAL = {
    costGrowth: 1.15,                  // price multiplier per building owned
    moneyCostGrowth: 1.3,             // monetization gets pricier faster: its value scales with income
    click: { base: 1, maxPerSecond: 25 },
    yieldBase: 0.5,                    // $ earned per point of Attention before upgrades

    chaos: {
      baseControl: 10,                 // free Control: keeps the first Chaos sources gentle
      approach: 0.15,                  // share of the gap to the target closed per second
      attPower: 1.0,                   // +100% Attention at 100% Chaos
      yieldPower: 0.5,                 // +50% Money per Attention at 100% Chaos
    },
    tolerance: { min: 10, span: 80, baseCapacity: 15, max: 98 },
    stability: {
      max: 100,
      regenBase: 0.2,                  // %/s always repaired
      regenPerPoint: 0.03,             // extra %/s per point Chaos sits below Tolerance
      drainPerPoint: 0.04,             // %/s lost per point Chaos sits above Tolerance
      knee: 60,                        // full efficiency at or above this Stability
      floor: 0.4,                      // production efficiency at 0% Stability
    },
    meltdown: { duration: 30, productionMult: 0.1, stabilityAfter: 60, rebootPerClick: 0.4, hotfixCut: 10 },
    moderationPenalty: 0.1,            // max Attention lost when Moderation fully dominates Chaos

    events: { firstDelay: 60, minInterval: 45, maxInterval: 100, chaosSpeedup: 0.4, choiceTimeout: 30, quietUntil: 30 },
    trends: { interval: 150, duration: 90, mult: 3 },
    viralChainChance: 0.3,
    bonus: { firstDelay: 75, minInterval: 150, maxInterval: 330, lifetime: 12, minAttention: 30 },   // catchable notification

    offline: { minSeconds: 30, capHours: 8, efficiency: 0.6, step: 10, maxSteps: 5000 },

    prestige: {
      requirement: 1e10,               // Attention needed this era to reach the next era (era 1)
      requirementGrowth: 150,          // each later era needs this much more (tuned so eras get longer, not shorter)
      cloutScale: 10,                  // Clout = scale × (eraAttention / requirement)^exponent
      cloutExponent: 0.4,
      cloutBonus: 0.015,               // +1.5% Attention per Clout ever earned
      eraBonus: 0.25,                  // +25% Attention per era reached
    },
    achievementBonus: 0.01,            // +1% Attention per achievement
    siteLevels: [0, 300, 2e4, 1.5e6, 1e8, 1e10],
    autosaveSeconds: 15,
    feedLimit: 40,
  };

  Z.POLICIES = [
    { id: 'wholesome', name: 'Wholesome', chaosMult: 0.25, attMult: 0.9, regenMult: 1.5,
      blurb: 'Cat pictures and gentle encouragement.' },
    { id: 'safe', name: 'Brand Safe', chaosMult: 0.6, attMult: 1, regenMult: 1.15,
      blurb: 'Nothing an advertiser could screenshot.' },
    { id: 'normal', name: 'Normal Internet', chaosMult: 1, attMult: 1, regenMult: 1,
      blurb: 'Reasonable people, unreasonable comments.' },
    { id: 'edgy', name: 'Edgy', chaosMult: 1.7, attMult: 1.05, regenMult: 1,
      blurb: 'Hot takes served slightly too hot.' },
    { id: 'unhinged', name: 'Unhinged', chaosMult: 3, attMult: 1.15, regenMult: 0.75,
      blurb: 'The editorial team is a raccoon with admin rights.' },
  ];
  Z.POLICY = Z.util.byId(Z.POLICIES);

  Z.ERAS = [
    { n: 1, id: 'forum', name: 'Forum Era', button: 'CREATE CONTENT',
      url: ['http://freehost.web/~{slug}/index.htm', 'http://www.{slug}-forum.net/index.php'],
      site: '{Name} Forum', tagline: 'Best viewed in 800×600. Sign the guestbook!',
      unlocks: 'The basics: content, chaos, servers and moderators.' },
    { n: 2, id: 'social', name: 'Social Media Era', button: 'POST A STATUS',
      url: ['https://{slug}.social/home', 'https://{slug}.social/feed'],
      site: '{Name} Social', tagline: 'Connecting people who should not be connected.',
      unlocks: 'Trending Topics, Influencer Houses, Data Brokers, Cloud Regions and Oversight Boards.' },
    { n: 3, id: 'viral', name: 'Viral Era', button: 'MAKE IT VIRAL',
      url: ['https://{slug}.lol/', 'https://{slug}.lol/trending'],
      site: '{NAME}.LOL', tagline: 'If it moves, it trends. If it trends, it moves.',
      unlocks: 'The Fake Leak action, viral chain reactions, Viral Challenge Studios and Engagement Tokens.' },
    { n: 4, id: 'algorithm', name: 'Algorithm Era', button: 'FEED THE ALGORITHM',
      url: ['https://feed.{slug}.io/for-you', 'https://feed.{slug}.io/for-you?optimized=1'],
      site: '{name}/feed', tagline: 'You did not choose this content. It chose you.',
      unlocks: 'The Algorithmic Tuning action and Recommendation Algorithms.' },
    { n: 5, id: 'ai', name: 'AI Era', button: 'PROMPT THE MACHINE',
      url: ['https://{slug}.ai/generate', 'https://{slug}.ai/generate?quality=low'],
      site: '{Name} AI', tagline: 'Every word on this page was written by nobody.',
      unlocks: 'The Hallucinate action, AI Slop Generators, AI Moderators and Orbital Servers.' },
    { n: 6, id: 'corporate', name: 'Corporate Internet Era', button: 'SYNERGIZE',
      url: ['https://{slug}.corp/dashboard', 'https://{slug}.corp/investors'],
      site: '{Name} Holdings™', tagline: 'Delivering shareholder value through user friction.',
      unlocks: 'The Lobbying action, Internet Monopolies and Subscription Bundles.' },
    { n: 7, id: 'post', name: 'Post-Internet Era', button: 'POST INTO THE VOID',
      url: ['{slug}://void/', '{slug}://void/echo'],
      site: '{NAME}//VOID', tagline: 'The internet ended. The engagement did not.',
      unlocks: 'The Dead Internet. After this, eras repeat with ever larger numbers.' },
  ];

  /* Operating systems the player's website runs on. The first is where everyone starts;
     each later one is a one-time purchase that survives every era. Installing one brings a
     new interface skin, new music and its own Style Shop themes (the old themes stay behind).
     `cost` is Money, paid from the current era. */
  Z.OSES = [
    { id: 'aero', name: 'ChaosOS 7', edition: 'Aero', icon: '🫧', look: 'Glossy glass, blue skies and bubbles.', effects: [] },
    { id: 'metro', name: 'ChaosOS 8', edition: 'Metro', icon: '🪟', cost: 1e13,
      era: 2,                          // available from this Internet Era on
      look: 'Flat tiles, bold colors and big clean type.',
      pitch: 'Faster, flatter and fully tiled. Your website will never look back.',
      // Tuned with tools/sim.js: bought mid Social Media Era, it makes the rest of the game
      // about 15% faster while later eras still get longer than earlier ones.
      effects: [
        { t: 'attMult', x: 1.3 },
        { t: 'yieldMult', x: 1.2 },
        { t: 'clickMult', x: 2 },
        { t: 'meltdownMult', x: 0.5 },
        { t: 'regenMult', x: 1.25 },
        { t: 'offlineEff', v: 0.1 },
      ],
      // One headline per effect above, in the same order.
      features: [
        ['⚡', 'Faster everything'], ['🧱', 'Live Tiles sell ads'], ['👆', 'Touch-first design'],
        ['🔁', 'Fast Startup'], ['🧰', 'Leaner kernel'], ['🌙', 'Connected Standby'],
      ],
      newLook: 'A brand-new look: flat Metro tiles, bold colors and big, clean type.',
      newMusic: 'New lo-fi music made for ChaosOS 8.',
      feed: 'Everything is faster, flatter and tiled.',
      setup: ['Hi.', 'We’re upgrading {site} to {os}.', 'Removing every gradient…', 'Hiding the Start button where nobody will find it…',
        'Packing your {prev} themes into a box…', 'Almost there. Don’t turn off your website.', 'Let’s go.'],
    },
    { id: 'mango', name: 'Mango OS', edition: 'Liquid Glass', icon: '🥭', cost: 2e16,
      era: 3,
      look: 'Liquid glass, soft light and colorful wallpapers.',
      pitch: 'Everything is made of glass now. Even the money.',
      // Tuned with tools/sim.js: bought about 8 minutes into the Viral Era, it makes the
      // eras after it about 15% faster, on top of ChaosOS 8.
      effects: [
        { t: 'attMult', x: 1.15 },
        { t: 'yieldMult', x: 1.15 },
        { t: 'capacityMult', x: 1.25 },
        { t: 'buffDuration', x: 1.3 },
        { t: 'hotfixCooldown', x: 0.75 },
        { t: 'offlineCap', v: 2 },
      ],
      features: [
        ['🚀', 'Mango Silicon'], ['💳', 'Mango Pay'], ['☁️', 'Mango Cloud'],
        ['🔔', 'Live Activities'], ['🛠️', 'Background updates'], ['🔋', 'All-day battery'],
      ],
      newLook: 'A brand-new look: translucent liquid glass, rounded windows and bright wallpapers.',
      newMusic: 'New music made for Mango OS: airy, glassy and a little bit keynote.',
      feed: 'Every window is liquid glass now.',
      setup: ['hello', 'Moving {site} to {os}…', 'Pouring liquid glass over every window…', 'Rounding every corner. Twice…',
        'Packing your {prev} themes into a box…', 'Almost there. Keep your website plugged in.', 'Welcome to {os}.'],
    },
  ];
  Z.OS = Z.util.byId(Z.OSES);

  /* The player's website name. Era titles and URLs above use {Name}, {NAME}, {name} and {slug}. */
  Z.SITE_NAME_MAX = 32;
  Z.DEFAULT_SITE_NAME = 'My Website';
  Z.LEGACY_SAVE_KEYS = ['zuha-internet-chaos:save', 'zuha-internet-chaos:backup'];

  /** Cleans a typed site name: single spaces, no control characters, length-capped. */
  Z.cleanSiteName = function (text) {
    return String(text == null ? '' : text).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, Z.SITE_NAME_MAX);
  };

  Z.siteName = function (s) {
    return (s && s.siteName) || Z.DEFAULT_SITE_NAME;
  };

  /** URL-safe form of the name: "Zoe's Café!" -> "zoes-cafe". */
  Z.siteSlug = function (s) {
    const slug = Z.siteName(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
    return slug || 'mysite';
  };

  /** Fills {Name}/{NAME}/{name}/{slug} in an era template with the player's site name. */
  Z.siteText = function (s, template) {
    const name = Z.siteName(s);
    return String(template)
      .replace(/\{Name\}/g, name)
      .replace(/\{NAME\}/g, name.toUpperCase())
      .replace(/\{name\}/g, name.toLowerCase())
      .replace(/\{slug\}/g, Z.siteSlug(s))
      .replace(/\b(\w+)([ -])\1\b/gi, '$1');   // "Goose Forum Forum" -> "Goose Forum"
  };

  Z.SITE_LEVELS = ['Homepage', 'Hobby Site', 'Community', 'Network', 'Platform', 'Empire'];

  /* Interface sections that appear as the player discovers each system. */
  Z.REVEAL_KEYS = ['chaos', 'stability', 'policy', 'actions', 'upgrades', 'eras', 'auto', 'analytics', 'clout', 'bulk', 'style', 'os'];

  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  /** Era info for any era number; eras past 7 reuse the Post-Internet theme. */
  Z.era = function (n) {
    const base = Z.ERAS[Math.min(n, Z.ERAS.length) - 1];
    if (n <= Z.ERAS.length) return base;
    const k = n - Z.ERAS.length + 1;
    return Object.assign({}, base, {
      n,
      name: 'Post-Internet Era ' + (ROMAN[k] || k),
      unlocks: 'Bigger numbers. The same void. Era bonus keeps growing.',
    });
  };
})(window.ICHAOS = window.ICHAOS || {});
