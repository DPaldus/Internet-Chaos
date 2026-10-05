/* Style Shop items: purely visual themes for the interface and the player's website.
   Nothing here touches the economy. Items unlock through lifetime milestones (stats that
   survive era resets), so customizing never costs progress.

   Each item: id, name, desc, swatch (CSS background for the preview tile) and
   req: null (free) or { text, have(s), need }. The CSS lives in css/cosmetics.css,
   keyed by body[data-bg|data-color|data-site|data-fx="<id>"]. */
(function (Z) {
  'use strict';

  const st = (key) => s => s.stats[key] || 0;
  const achievements = s => Object.keys(s.achievements).length;
  const R = (text, have, need) => ({ text, have, need });

  const CATEGORIES = [
    {
      id: 'bg', name: 'Backgrounds', icon: '🏞️', blurb: 'The world behind the glass.',
      items: [
        { id: 'sky', name: 'Clear Sky', desc: 'Blue sky, soft clouds, a green hill. The classic.', req: null,
          swatch: 'radial-gradient(ellipse 60% 30% at 85% 10%, #fffbe0, transparent 70%), radial-gradient(ellipse 90% 35% at 30% 110%, #4cbc3e 0 50%, transparent 70%), linear-gradient(#1f7fd0, #a9def8 60%, #5bc1e8)' },
        { id: 'hills', name: 'Rolling Hills', desc: 'A deep blue sky over one impossibly green hill.',
          req: R('Click 300 times in total', st('totalClicks'), 300),
          swatch: 'radial-gradient(ellipse 120% 55% at 30% 118%, #6fd14a 0 52%, #3f9a28 60%, transparent 61%), radial-gradient(ellipse 30% 10% at 70% 25%, #fff, transparent 70%), linear-gradient(#1557c9, #5aa8f0 55%, #d6eefc)' },
        { id: 'ocean', name: 'Deep Lagoon', desc: 'Sunbeams falling through clear turquoise water.',
          req: R('Earn 1M Attention in total', st('totalAttention'), 1e6),
          swatch: 'conic-gradient(from 160deg at 50% -20%, transparent 0deg, rgba(255,255,255,.3) 8deg, transparent 16deg, rgba(255,255,255,.2) 26deg, transparent 34deg), linear-gradient(#7fe3f0, #1b9bc2 35%, #0b5f8f 70%, #062f55)' },
        { id: 'sunset', name: 'Sunset Bloom', desc: 'A warm evening glow in pink, peach and violet.',
          req: R('Unlock 8 achievements', achievements, 8),
          swatch: 'radial-gradient(circle at 50% 66%, #fff4c2 0 8%, rgba(255,200,120,.6) 16%, transparent 40%), linear-gradient(#2b1d5c, #8a3a8f 32%, #f06a6a 55%, #ffb35c 66%, #c45a8a 80%, #4a2466)' },
        { id: 'aurora', name: 'Aurora Night', desc: 'Northern lights over a quiet, starry night.',
          req: R('Reach the Social Media Era', st('eras'), 1),
          swatch: 'radial-gradient(ellipse 80% 20% at 40% 35%, rgba(80,255,170,.65), transparent 70%), radial-gradient(ellipse 60% 16% at 70% 25%, rgba(170,110,255,.55), transparent 70%), linear-gradient(#030b26, #0b1f4a 60%, #123a5c)' },
        { id: 'frost', name: 'Crystal Frost', desc: 'Bright, icy and pale, like a frozen window.',
          req: R('Buy 100 buildings in total', st('buildingsBought'), 100),
          swatch: 'radial-gradient(circle at 30% 30%, #fff 0 12%, transparent 40%), linear-gradient(135deg, #e6f7ff, #b5e6fb 45%, #ffffff 60%, #a9dcf2)' },
      ],
    },
    {
      id: 'color', name: 'Colors', icon: '🎨', blurb: 'The tint of the glass, buttons and title bars.',
      items: [
        { id: 'aqua', name: 'Aqua Blue', desc: 'Glossy sky blue. Where it all started.', req: null,
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#45b3f5, #0d63c4)' },
        { id: 'mint', name: 'Mint Glass', desc: 'Fresh green and teal, like a cold soda.',
          req: R('Buy 25 buildings in total', st('buildingsBought'), 25),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#4fe0b0, #0f8a64)' },
        { id: 'orchid', name: 'Orchid', desc: 'Violet glass with a magenta glow.',
          req: R('Reach 75% Chaos', st('highestChaos'), 75),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#c58cff, #6a2bc4)' },
        { id: 'amber', name: 'Sunlit Amber', desc: 'Honey and orange, warm as afternoon light.',
          req: R('Earn $100K in total', st('totalMoney'), 1e5),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#ffc04d, #d9700b)' },
        { id: 'graphite', name: 'Graphite Ultimate', desc: 'Black smoked glass with silver edges.',
          req: R('Survive a meltdown', st('meltdowns'), 1),
          swatch: 'linear-gradient(rgba(255,255,255,.4), rgba(255,255,255,.06) 48%, transparent 52%), linear-gradient(#5a616c, #0c0e12)' },
        { id: 'rose', name: 'Bubblegum', desc: 'Pink candy gloss. Unapologetically shiny.',
          req: R('Unlock 15 achievements', achievements, 15),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#ff8cc8, #d12f86)' },
      ],
    },
    {
      id: 'site', name: 'Website Styles', icon: '🖥️', blurb: 'How your own website looks to visitors.',
      items: [
        { id: 'era', name: 'Follows the Era', desc: 'Your site changes style with every Internet Era.', req: null,
          swatch: 'linear-gradient(135deg, #fffff4 0 25%, #f5f6f8 25% 50%, #231036 50% 75%, #0b0f14 75%)' },
        { id: 'aero', name: 'Aero Clean', desc: 'White, airy and blue, whatever the era.', req: null,
          swatch: 'linear-gradient(#ffffff, #e2f1fd)' },
        { id: 'web2', name: 'Web 2.0 Beta', desc: 'Huge rounded type, gradients and a permanent beta badge.',
          req: R('Buy 10 upgrades in total', st('upgradesBought'), 10),
          swatch: 'linear-gradient(#ffffff 0 55%, #eaf6d9 55%), radial-gradient(circle at 70% 30%, #ff9a2e 0 18%, transparent 20%)' },
        { id: 'retro', name: 'GeoCities ’98', desc: 'Comic Sans, Times New Roman and pure enthusiasm.',
          req: R('Click 1,000 times in total', st('totalClicks'), 1000),
          swatch: 'repeating-linear-gradient(45deg, #fffff4 0 8px, #fff6c8 8px 16px)' },
        { id: 'midnight', name: 'Midnight Glass', desc: 'A dark site with neon-cyan glow.',
          req: R('Play for 60 minutes', s => (s.stats.playTime || 0) / 60, 60),
          swatch: 'radial-gradient(circle at 50% 30%, rgba(111,211,255,.5), transparent 55%), linear-gradient(#0d1b2e, #050b14)' },
        { id: 'news', name: 'Daily Newsprint', desc: 'Serious serif headlines for unserious news.',
          req: R('Experience 20 internet events', st('events'), 20),
          swatch: 'repeating-linear-gradient(#f4efe1 0 6px, #e4dcc6 6px 7px)' },
      ],
    },
    {
      id: 'fx', name: 'Effects', icon: '✨', blurb: 'Extra light and motion floating over the background.',
      items: [
        { id: 'bubbles', name: 'Glass Bubbles', desc: 'A few still bubbles and soft light streaks.', req: null,
          swatch: 'radial-gradient(circle at 30% 60%, transparent 0 9px, rgba(255,255,255,.9) 10px, transparent 12px), radial-gradient(circle at 70% 35%, transparent 0 6px, rgba(255,255,255,.9) 7px, transparent 9px), linear-gradient(#3f9ae0, #8fd2f5)' },
        { id: 'calm', name: 'Calm', desc: 'No effects. Just the background.', req: null,
          swatch: 'linear-gradient(#5aa8e6, #9fd8f5)' },
        { id: 'float', name: 'Rising Bubbles', desc: 'Bubbles drifting slowly upward.',
          req: R('Earn 100K Attention in total', st('totalAttention'), 1e5),
          swatch: 'radial-gradient(circle at 25% 75%, transparent 0 7px, #fff 8px, transparent 10px), radial-gradient(circle at 60% 45%, transparent 0 10px, #fff 11px, transparent 13px), radial-gradient(circle at 80% 15%, transparent 0 4px, #fff 5px, transparent 7px), linear-gradient(#1b9bc2, #7fe3f0)' },
        { id: 'sparkle', name: 'Sparkles', desc: 'Tiny glints that twinkle across the screen.',
          req: R('Unlock 4 achievements', achievements, 4),
          swatch: 'radial-gradient(circle at 20% 30%, #fff 0 2px, transparent 4px), radial-gradient(circle at 70% 60%, #fff 0 2px, transparent 4px), radial-gradient(circle at 45% 80%, #fff 0 1.5px, transparent 3px), linear-gradient(#2a5bd0, #8fd2f5)' },
        { id: 'rays', name: 'Light Rays', desc: 'Slowly turning sunbeams from the corner of the sky.',
          req: R('Use 15 Actions', st('actions'), 15),
          swatch: 'repeating-conic-gradient(from 0deg at 0 0, rgba(255,255,255,.55) 0 5deg, transparent 5deg 14deg), linear-gradient(#3f9ae0, #b9e6fa)' },
        { id: 'flare', name: 'Lens Flare', desc: 'Glowing orbs trailing from the sun.',
          req: R('Earn 100M Attention in total', st('totalAttention'), 1e8),
          swatch: 'radial-gradient(circle at 80% 20%, #fff 0 8%, transparent 20%), radial-gradient(circle at 55% 45%, rgba(140,255,200,.7) 0 7%, transparent 9%), radial-gradient(circle at 35% 65%, rgba(255,170,240,.6) 0 10%, transparent 12%), linear-gradient(#1f7fd0, #a9def8)' },
      ],
    },
  ];

  const ITEM = Object.create(null);
  for (const cat of CATEGORIES) for (const item of cat.items) ITEM[cat.id + ':' + item.id] = Object.assign({ cat: cat.id }, item);

  Z.COSMETICS = {
    CATEGORIES,
    CAT: Z.util.byId(CATEGORIES),
    ITEM,
    DEFAULTS: { bg: 'sky', color: 'aqua', site: 'era', fx: 'bubbles' },
    key: (cat, id) => cat + ':' + id,
  };
})(window.ICHAOS = window.ICHAOS || {});
