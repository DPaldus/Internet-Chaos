/* Style Shop items: purely visual themes for the interface and the player's website.
   Nothing here touches the economy. Items unlock through lifetime milestones (stats that
   survive era resets), so customizing never costs progress.

   Every operating system (Z.OSES) has its own catalogue. ChaosOS 7 Aero is the first;
   ChaosOS 8 Metro and Mango OS start from scratch, and their milestones count from the
   moment they were installed (Z.opsys.since).

   Each item: id, name, desc, swatch (CSS background for the preview tile) and
   req: null (free) or { text, have(s), need }. Ids are unique per category across all
   catalogues. The CSS lives in css/game.css (Aero in section 5, Metro in sections 8-9,
   Mango OS in sections 10-11),
   keyed by body[data-bg|data-color|data-site-style|data-fx="<id>"]. */
(function (Z) {
  'use strict';

  const st = (key) => s => s.stats[key] || 0;
  const achievements = s => Object.keys(s.achievements).length;
  const R = (text, have, need) => ({ text, have, need });
  // A milestone on a newer OS: counts only what happened after that upgrade.
  const onOS = id => (key, scale) => s => s.os && s.os.id === id ? Z.opsys.since(s, key) / (scale || 1) : 0;
  const on8 = onOS('metro');
  const onMango = onOS('mango');

  const AERO = [
    {
      id: 'bg', name: 'Backgrounds', icon: '🏞️', blurb: 'The world behind the glass.',
      items: [
        { id: 'sky', name: 'Clear Sky', desc: 'Blue sky, soft clouds, a green hill. The classic.', req: null,
          swatch: 'radial-gradient(ellipse 60% 30% at 85% 10%, #fffbe0, transparent 70%), radial-gradient(ellipse 90% 35% at 30% 110%, #4cbc3e 0 50%, transparent 70%), linear-gradient(#1f7fd0, #a9def8 60%, #5bc1e8)' },
        { id: 'hills', name: 'Rolling Hills', desc: 'A deep blue sky over one impossibly green hill.',
          req: R('Click 1,000 times in total', st('totalClicks'), 1000),
          swatch: 'radial-gradient(ellipse 120% 55% at 30% 118%, #6fd14a 0 52%, #3f9a28 60%, transparent 61%), radial-gradient(ellipse 30% 10% at 70% 25%, #fff, transparent 70%), linear-gradient(#1557c9, #5aa8f0 55%, #d6eefc)' },
        { id: 'ocean', name: 'Deep Lagoon', desc: 'Sunbeams falling through clear turquoise water.',
          req: R('Earn 100M Attention in total', st('totalAttention'), 1e8),
          swatch: 'conic-gradient(from 160deg at 50% -20%, transparent 0deg, rgba(255,255,255,.3) 8deg, transparent 16deg, rgba(255,255,255,.2) 26deg, transparent 34deg), linear-gradient(#7fe3f0, #1b9bc2 35%, #0b5f8f 70%, #062f55)' },
        { id: 'sunset', name: 'Sunset Bloom', desc: 'A warm evening glow in pink, peach and violet.',
          req: R('Unlock 15 achievements', achievements, 15),
          swatch: 'radial-gradient(circle at 50% 66%, #fff4c2 0 8%, rgba(255,200,120,.6) 16%, transparent 40%), linear-gradient(#2b1d5c, #8a3a8f 32%, #f06a6a 55%, #ffb35c 66%, #c45a8a 80%, #4a2466)' },
        { id: 'aurora', name: 'Aurora Night', desc: 'Northern lights over a quiet, starry night.',
          req: R('Reach the Social Media Era', st('eras'), 1),
          swatch: 'radial-gradient(ellipse 80% 20% at 40% 35%, rgba(80,255,170,.65), transparent 70%), radial-gradient(ellipse 60% 16% at 70% 25%, rgba(170,110,255,.55), transparent 70%), linear-gradient(#030b26, #0b1f4a 60%, #123a5c)' },
        { id: 'frost', name: 'Crystal Frost', desc: 'Bright, icy and pale, like a frozen window.',
          req: R('Buy 200 buildings in total', st('buildingsBought'), 200),
          swatch: 'radial-gradient(circle at 30% 30%, #fff 0 12%, transparent 40%), linear-gradient(135deg, #e6f7ff, #b5e6fb 45%, #ffffff 60%, #a9dcf2)' },
      ],
    },
    {
      id: 'color', name: 'Colors', icon: '🎨', blurb: 'The tint of the glass, buttons and title bars.',
      items: [
        { id: 'aqua', name: 'Aqua Blue', desc: 'Glossy sky blue. Where it all started.', req: null,
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#45b3f5, #0d63c4)' },
        { id: 'mint', name: 'Mint Glass', desc: 'Fresh green and teal, like a cold soda.',
          req: R('Buy 75 buildings in total', st('buildingsBought'), 75),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#4fe0b0, #0f8a64)' },
        { id: 'orchid', name: 'Orchid', desc: 'Violet glass with a magenta glow.',
          req: R('Reach 75% Chaos', st('highestChaos'), 75),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#c58cff, #6a2bc4)' },
        { id: 'amber', name: 'Sunlit Amber', desc: 'Honey and orange, warm as afternoon light.',
          req: R('Earn $10M in total', st('totalMoney'), 1e7),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.1) 48%, transparent 52%), linear-gradient(#ffc04d, #d9700b)' },
        { id: 'graphite', name: 'Graphite Ultimate', desc: 'Black smoked glass with silver edges.',
          req: R('Survive a meltdown', st('meltdowns'), 1),
          swatch: 'linear-gradient(rgba(255,255,255,.4), rgba(255,255,255,.06) 48%, transparent 52%), linear-gradient(#5a616c, #0c0e12)' },
        { id: 'rose', name: 'Bubblegum', desc: 'Pink candy gloss. Unapologetically shiny.',
          req: R('Unlock 25 achievements', achievements, 25),
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
          req: R('Buy 20 upgrades in total', st('upgradesBought'), 20),
          swatch: 'linear-gradient(#ffffff 0 55%, #eaf6d9 55%), radial-gradient(circle at 70% 30%, #ff9a2e 0 18%, transparent 20%)' },
        { id: 'retro', name: 'GeoCities ’98', desc: 'Comic Sans, Times New Roman and pure enthusiasm.',
          req: R('Click 2,500 times in total', st('totalClicks'), 2500),
          swatch: 'repeating-linear-gradient(45deg, #fffff4 0 8px, #fff6c8 8px 16px)' },
        { id: 'midnight', name: 'Midnight Glass', desc: 'A dark site with neon-cyan glow.',
          req: R('Play for 60 minutes', s => (s.stats.playTime || 0) / 60, 60),
          swatch: 'radial-gradient(circle at 50% 30%, rgba(111,211,255,.5), transparent 55%), linear-gradient(#0d1b2e, #050b14)' },
        { id: 'news', name: 'Daily Newsprint', desc: 'Serious serif headlines for unserious news.',
          req: R('Experience 30 internet events', st('events'), 30),
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
          req: R('Earn 1M Attention in total', st('totalAttention'), 1e6),
          swatch: 'radial-gradient(circle at 25% 75%, transparent 0 7px, #fff 8px, transparent 10px), radial-gradient(circle at 60% 45%, transparent 0 10px, #fff 11px, transparent 13px), radial-gradient(circle at 80% 15%, transparent 0 4px, #fff 5px, transparent 7px), linear-gradient(#1b9bc2, #7fe3f0)' },
        { id: 'sparkle', name: 'Sparkles', desc: 'Tiny glints that twinkle across the screen.',
          req: R('Unlock 10 achievements', achievements, 10),
          swatch: 'radial-gradient(circle at 20% 30%, #fff 0 2px, transparent 4px), radial-gradient(circle at 70% 60%, #fff 0 2px, transparent 4px), radial-gradient(circle at 45% 80%, #fff 0 1.5px, transparent 3px), linear-gradient(#2a5bd0, #8fd2f5)' },
        { id: 'rays', name: 'Light Rays', desc: 'Slowly turning sunbeams from the corner of the sky.',
          req: R('Use 15 Actions', st('actions'), 15),
          swatch: 'repeating-conic-gradient(from 0deg at 0 0, rgba(255,255,255,.55) 0 5deg, transparent 5deg 14deg), linear-gradient(#3f9ae0, #b9e6fa)' },
        { id: 'flare', name: 'Lens Flare', desc: 'Glowing orbs trailing from the sun.',
          req: R('Earn 1T Attention in total', st('totalAttention'), 1e12),
          swatch: 'radial-gradient(circle at 80% 20%, #fff 0 8%, transparent 20%), radial-gradient(circle at 55% 45%, rgba(140,255,200,.7) 0 7%, transparent 9%), radial-gradient(circle at 35% 65%, rgba(255,170,240,.6) 0 10%, transparent 12%), linear-gradient(#1f7fd0, #a9def8)' },
      ],
    },
  ];

  /* ChaosOS 8 Metro: flat color, square tiles, light type. */
  const tile = c => 'linear-gradient(135deg, ' + c + ' 0 62%, rgba(0, 0, 0, .18) 62%), linear-gradient(' + c + ', ' + c + ')';
  const METRO = [
    {
      id: 'bg', name: 'Backgrounds', icon: '🏞️', blurb: 'The Start screen behind your tiles.',
      items: [
        { id: 'light', name: 'Blue Light', desc: 'Deep blue with soft beams of light. The ChaosOS 8 classic.', req: null,
          swatch: 'repeating-conic-gradient(from 205deg at 22% 125%, rgba(255,255,255,.16) 0 4deg, transparent 4deg 12deg), linear-gradient(160deg, #0b2f7c, #1561d6 55%, #0a3a94)' },
        { id: 'royal', name: 'Royal Purple', desc: 'The famous purple Start screen, with big quiet circles.',
          req: R('Reach the next Internet Era on ChaosOS 8', on8('eras'), 1),
          swatch: 'radial-gradient(circle at 78% 28%, rgba(255,255,255,.12) 0 24%, transparent 25%), radial-gradient(circle at 18% 86%, rgba(255,255,255,.08) 0 34%, transparent 35%), linear-gradient(#3d1c74, #261052)' },
        { id: 'emerald', name: 'Emerald Grid', desc: 'Green as a fresh install, with a faint tile grid.',
          req: R('Earn 1Qa Attention on ChaosOS 8', on8('totalAttention'), 1e15),
          swatch: 'linear-gradient(rgba(255,255,255,.13) 2px, transparent 2px) 0 0 / 18px 18px, linear-gradient(90deg, rgba(255,255,255,.13) 2px, transparent 2px) 0 0 / 18px 18px, linear-gradient(#11893f, #0a5a2a)' },
        { id: 'carbon', name: 'Carbon Lines', desc: 'Dark graphite with fine diagonal pinstripes.',
          req: R('Survive a meltdown on ChaosOS 8', on8('meltdowns'), 1),
          swatch: 'repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 2px, transparent 2px 9px), linear-gradient(#2c3038, #15171b)' },
        { id: 'ribbon', name: 'Sunset Ribbon', desc: 'Orange and magenta ribbons on deep red.',
          req: R('Reach 2 more Internet Eras on ChaosOS 8', on8('eras'), 2),
          swatch: 'radial-gradient(130% 60% at 0% 104%, #ff8a00 0 42%, transparent 43%), radial-gradient(120% 70% at 104% 0%, #e91e63 0 36%, transparent 37%), linear-gradient(135deg, #7a0f3a, #b3123e)' },
        { id: 'teal', name: 'Teal Waves', desc: 'Calm flat waves rolling in from the bottom.',
          req: R('Earn 1Qi Attention on ChaosOS 8', on8('totalAttention'), 1e18),
          swatch: 'radial-gradient(140% 50% at 30% 136%, #19e0cb 0 50%, transparent 51%), radial-gradient(140% 50% at 70% 122%, #00b5aa 0 46%, transparent 47%), linear-gradient(#00566e, #00808f)' },
      ],
    },
    {
      id: 'color', name: 'Colors', icon: '🎨', blurb: 'The accent color of buttons, tabs and highlights.',
      items: [
        { id: 'cobalt', name: 'Cobalt', desc: 'Strong, clean blue. Where ChaosOS 8 starts.', req: null, swatch: tile('#1f6fd8') },
        { id: 'lime', name: 'Lime', desc: 'A bright, cheerful green.',
          req: R('Click 300 times on ChaosOS 8', on8('totalClicks'), 300), swatch: tile('#7fb51f') },
        { id: 'orange', name: 'Orange', desc: 'Loud, warm and impossible to miss.',
          req: R('Buy 40 upgrades on ChaosOS 8', on8('upgradesBought'), 40), swatch: tile('#f26b0f') },
        { id: 'magenta', name: 'Magenta', desc: 'Hot pink with a lot of confidence.',
          req: R('Buy 500 buildings on ChaosOS 8', on8('buildingsBought'), 500), swatch: tile('#d6006f') },
        { id: 'crimson', name: 'Crimson', desc: 'Deep red, for serious internet business.',
          req: R('Earn $1Qi on ChaosOS 8', on8('totalMoney'), 1e18), swatch: tile('#c8102e') },
        { id: 'violet', name: 'Violet', desc: 'Electric purple, straight from a phone ad.',
          req: R('Play for 2 hours on ChaosOS 8', on8('playTime', 60), 120), swatch: tile('#8a2be2') },
      ],
    },
    {
      id: 'site', name: 'Website Styles', icon: '🖥️', blurb: 'How your own website looks to visitors.',
      items: [
        { id: 'modern', name: 'Modern UI', desc: 'A white page with a big photo header and light, clean type.', req: null,
          swatch: 'linear-gradient(180deg, transparent 0 56%, #ffffff 56%), radial-gradient(ellipse 90% 32% at 50% 60%, #5fbf3a 0 60%, transparent 61%), linear-gradient(#3f97ec, #c3e5ff)' },
        { id: 'follow', name: 'Follows the Era', desc: 'Your site changes style with every Internet Era.', req: null,
          swatch: 'linear-gradient(135deg, #ffffff 0 25%, #f5f6f8 25% 50%, #231036 50% 75%, #0b0f14 75%)' },
        { id: 'dark', name: 'Dark Theme', desc: 'Black page, white type, one accent line.',
          req: R('Play for 30 minutes on ChaosOS 8', on8('playTime', 60), 30),
          swatch: 'linear-gradient(90deg, #1f6fd8 0 100%) 50% 66% / 60% 4px no-repeat, linear-gradient(#101010, #1d1d1d)' },
        { id: 'livetiles', name: 'Live Tiles', desc: 'Your homepage turns into a wall of colorful tiles.',
          req: R('Use 20 Actions on ChaosOS 8', on8('actions'), 20),
          swatch: 'conic-gradient(#1f6fd8 0 25%, #e51400 0 50%, #7fb51f 0 75%, #f26b0f 0) 0 0 / 50% 50%' },
        { id: 'headline', name: 'Headline News', desc: 'A bold red news app header over clean columns.',
          req: R('Experience 40 internet events on ChaosOS 8', on8('events'), 40),
          swatch: 'linear-gradient(180deg, #c8102e 0 42%, transparent 42%), repeating-linear-gradient(180deg, #ffffff 0 6px, #e4e4e4 6px 7px)' },
        { id: 'panorama', name: 'Panorama', desc: 'A huge, thin title that runs off the edge of the page.',
          req: R('Click 2,000 times on ChaosOS 8', on8('totalClicks'), 2000),
          swatch: 'linear-gradient(transparent 0 26%, rgba(20, 60, 120, .2) 26% 54%, transparent 54%), linear-gradient(120deg, #e3ebf5, #ffffff)' },
      ],
    },
    {
      id: 'fx', name: 'Effects', icon: '✨', blurb: 'Motion behind the tiles.',
      items: [
        { id: 'drift', name: 'Drifting Tiles', desc: 'A few see-through squares slowly floating by.', req: null,
          swatch: 'linear-gradient(rgba(255,255,255,.35), rgba(255,255,255,.35)) 22% 28% / 12px 12px no-repeat, linear-gradient(rgba(255,255,255,.22), rgba(255,255,255,.22)) 72% 58% / 18px 18px no-repeat, linear-gradient(rgba(255,255,255,.3), rgba(255,255,255,.3)) 42% 82% / 8px 8px no-repeat, linear-gradient(#0d3f9e, #1a63d0)' },
        { id: 'still', name: 'Still', desc: 'No effects. Just the background.', req: null,
          swatch: 'linear-gradient(#0f4bb0, #1a63d0)' },
        { id: 'dots', name: 'Loading Dots', desc: 'Five little dots racing across the top of the screen.',
          req: R('Catch 3 floating notifications on ChaosOS 8', on8('bonuses'), 3),
          swatch: 'radial-gradient(circle, #fff 0 2.5px, transparent 3px) 26% 50% / 10px 10px no-repeat, radial-gradient(circle, #fff 0 2.5px, transparent 3px) 38% 50% / 10px 10px no-repeat, radial-gradient(circle, #fff 0 2.5px, transparent 3px) 50% 50% / 10px 10px no-repeat, radial-gradient(circle, #fff 0 2.5px, transparent 3px) 62% 50% / 10px 10px no-repeat, radial-gradient(circle, #fff 0 2.5px, transparent 3px) 74% 50% / 10px 10px no-repeat, linear-gradient(#0d3f9e, #1a63d0)' },
        { id: 'pixels', name: 'Pixel Rain', desc: 'Tiny square pixels falling like snow.',
          req: R('Click 1,000 times on ChaosOS 8', on8('totalClicks'), 1000),
          swatch: 'linear-gradient(#fff, #fff) 20% 18% / 4px 4px no-repeat, linear-gradient(#fff, #fff) 64% 34% / 3px 3px no-repeat, linear-gradient(#fff, #fff) 38% 62% / 4px 4px no-repeat, linear-gradient(#fff, #fff) 80% 78% / 3px 3px no-repeat, linear-gradient(#fff, #fff) 14% 84% / 3px 3px no-repeat, linear-gradient(#0d3f9e, #1a63d0)' },
        { id: 'beams', name: 'Light Sweep', desc: 'Wide beams of light slowly sweeping the sky.',
          req: R('Earn 100 Clout on ChaosOS 8', on8('cloutEarned'), 100),
          swatch: 'repeating-conic-gradient(from 200deg at 20% 120%, rgba(255,255,255,.24) 0 5deg, transparent 5deg 14deg), linear-gradient(#0b2f7c, #1561d6)' },
        { id: 'glow', name: 'Accent Glow', desc: 'A soft glow in your accent color, breathing at the bottom.',
          req: R('Catch 10 floating notifications on ChaosOS 8', on8('bonuses'), 10),
          swatch: 'radial-gradient(ellipse 80% 42% at 50% 100%, rgba(80, 170, 255, .85), transparent 70%), linear-gradient(#0a2a6e, #0d3f9e)' },
      ],
    },
  ];

  /* Mango OS: liquid glass, soft light and colorful wallpapers. */
  const glass = c => 'radial-gradient(circle at 50% 50%, ' + c + ' 0 30%, transparent 31%), radial-gradient(circle at 42% 40%, rgba(255,255,255,.9) 0 6%, transparent 13%), linear-gradient(135deg, rgba(255,255,255,.85), rgba(225,232,245,.7))';
  const MANGO = [
    {
      id: 'bg', name: 'Wallpapers', icon: '🏞️', blurb: 'The desktop behind the glass.',
      items: [
        { id: 'dawn', name: 'Mango Dawn', desc: 'Deep blue waves flowing into a warm mango glow. The Mango OS classic.', req: null,
          swatch: 'radial-gradient(ellipse 70% 40% at 78% 60%, #ffc48a, rgba(255,140,80,.6) 35%, transparent 70%), radial-gradient(ellipse 90% 30% at 30% 80%, rgba(90,160,255,.8), transparent 70%), linear-gradient(120deg, #0b2a6f, #1f5fd0 45%, #f39a5c 75%, #7a2d6e)' },
        { id: 'bloom', name: 'Bloom', desc: 'Soft petals of pink and violet light opening up.',
          req: R('Reach the next Internet Era on Mango OS', onMango('eras'), 1),
          swatch: 'radial-gradient(ellipse 40% 60% at 30% 70%, #ff8fc8, transparent 70%), radial-gradient(ellipse 45% 55% at 70% 40%, #a77bff, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 90%, #ffb36b, transparent 70%), linear-gradient(#2a124d, #4b1f7a)' },
        { id: 'lagoon', name: 'Glass Lagoon', desc: 'Clear turquoise water folding over itself.',
          req: R('Click 500 times on Mango OS', onMango('totalClicks'), 500),
          swatch: 'radial-gradient(ellipse 100% 40% at 20% 30%, rgba(160,255,240,.8), transparent 60%), radial-gradient(ellipse 90% 45% at 80% 75%, rgba(0,190,200,.9), transparent 65%), linear-gradient(160deg, #04435e, #0a8fa8 55%, #43d9c9)' },
        { id: 'dusk', name: 'Desert Dusk', desc: 'Purple dunes under an orange evening sky.',
          req: R('Survive a meltdown on Mango OS', onMango('meltdowns'), 1),
          swatch: 'radial-gradient(130% 50% at 20% 112%, #4a1f63 0 50%, transparent 51%), radial-gradient(130% 50% at 85% 118%, #7a2f6c 0 52%, transparent 53%), linear-gradient(#ff9a52, #e05a62 55%, #6a2a78)' },
        { id: 'peaks', name: 'Big Peaks', desc: 'Blue mountains with first light on the snow.',
          req: R('Reach 2 more Internet Eras on Mango OS', onMango('eras'), 2),
          swatch: 'linear-gradient(135deg, transparent 0 48%, #26406e 48% 100%) 0 100% / 60% 60% no-repeat, linear-gradient(225deg, transparent 0 46%, #1b2f55 46% 100%) 100% 100% / 70% 70% no-repeat, linear-gradient(#ffb58a, #8fb6f0 50%, #4a74c4)' },
        { id: 'nebula', name: 'Space Black', desc: 'A dark desktop with one glowing ribbon of color.',
          req: R('Play for 2 hours on Mango OS', onMango('playTime', 60), 120),
          swatch: 'radial-gradient(ellipse 90% 18% at 50% 55%, rgba(170,110,255,.9), transparent 70%), radial-gradient(ellipse 60% 12% at 60% 48%, rgba(255,120,190,.7), transparent 70%), linear-gradient(#05060c, #141428)' },
      ],
    },
    {
      id: 'color', name: 'Accent Colors', icon: '🎨', blurb: 'The tint of buttons, switches and highlights.',
      items: [
        { id: 'blue', name: 'Mango Blue', desc: 'Clear, bright blue. Where Mango OS starts.', req: null, swatch: glass('#0a84ff') },
        { id: 'mango', name: 'Mango', desc: 'Ripe orange, sweet and loud.',
          req: R('Click 300 times on Mango OS', onMango('totalClicks'), 300), swatch: glass('#ff9f0a') },
        { id: 'pink', name: 'Pink', desc: 'Candy pink glass.',
          req: R('Buy 40 upgrades on Mango OS', onMango('upgradesBought'), 40), swatch: glass('#ff375f') },
        { id: 'indigo', name: 'Indigo', desc: 'Deep blue-violet, calm and serious.',
          req: R('Buy 500 buildings on Mango OS', onMango('buildingsBought'), 500), swatch: glass('#5e5ce6') },
        { id: 'green', name: 'Green', desc: 'Fresh green, like a fully charged battery.',
          req: R('Use 30 Actions on Mango OS', onMango('actions'), 30), swatch: glass('#30d158') },
        { id: 'slate', name: 'Graphite', desc: 'Quiet grey for people who mean business.',
          req: R('Experience 50 internet events on Mango OS', onMango('events'), 50), swatch: glass('#8e8e93') },
      ],
    },
    {
      id: 'site', name: 'Website Styles', icon: '🖥️', blurb: 'How your own website looks to visitors.',
      items: [
        { id: 'glass', name: 'Liquid Glass', desc: 'A sunset photo header with your name on frosted glass.', req: null,
          swatch: 'linear-gradient(180deg, transparent 0 58%, rgba(255,255,255,.85) 58%), radial-gradient(ellipse 60% 30% at 40% 60%, #1d2a3f 0 50%, transparent 52%), linear-gradient(#2c5fc7, #f4a26b 55%, #7b5ea8)' },
        { id: 'byera', name: 'Follows the Era', desc: 'Your site changes style with every Internet Era.', req: null,
          swatch: 'linear-gradient(135deg, #ffffff 0 25%, #f5f6f8 25% 50%, #231036 50% 75%, #0b0f14 75%)' },
        { id: 'notes', name: 'Notes', desc: 'Your homepage on a yellow notepad.',
          req: R('Play for 30 minutes on Mango OS', onMango('playTime', 60), 30),
          swatch: 'linear-gradient(#f7c843 0 22%, transparent 22%), repeating-linear-gradient(#fffdf2 0 9px, #ece3c2 9px 10px)' },
        { id: 'widgets', name: 'Widgets', desc: 'A home screen of round, colorful widgets.',
          req: R('Use 20 Actions on Mango OS', onMango('actions'), 20),
          swatch: 'radial-gradient(circle at 28% 30%, #ff9f0a 0 16%, transparent 17%), radial-gradient(circle at 72% 30%, #0a84ff 0 16%, transparent 17%), radial-gradient(circle at 28% 72%, #30d158 0 16%, transparent 17%), radial-gradient(circle at 72% 72%, #ff375f 0 16%, transparent 17%), linear-gradient(#eef2fb, #dfe6f5)' },
        { id: 'keynote', name: 'Keynote', desc: 'A black stage and one huge, glowing title.',
          req: R('Experience 40 internet events on Mango OS', onMango('events'), 40),
          swatch: 'linear-gradient(90deg, #ff9f0a, #ff375f, #bf5af2) 50% 50% / 70% 16% no-repeat, linear-gradient(#000, #111)' },
        { id: 'spatial', name: 'Spatial', desc: 'Floating glass windows in a softly lit room.',
          req: R('Click 2,000 times on Mango OS', onMango('totalClicks'), 2000),
          swatch: 'linear-gradient(rgba(255,255,255,.55), rgba(255,255,255,.3)) 50% 40% / 66% 40% no-repeat, linear-gradient(rgba(255,255,255,.4), rgba(255,255,255,.2)) 50% 82% / 40% 18% no-repeat, linear-gradient(#b9a58c, #6e6152)' },
      ],
    },
    {
      id: 'fx', name: 'Effects', icon: '✨', blurb: 'Light floating behind the glass.',
      items: [
        { id: 'flow', name: 'Flowing Light', desc: 'Soft colored light slowly drifting across the wallpaper.', req: null,
          swatch: 'radial-gradient(circle at 30% 40%, rgba(120,180,255,.9), transparent 45%), radial-gradient(circle at 70% 65%, rgba(255,170,110,.85), transparent 45%), linear-gradient(#1a3f9a, #3d6fd6)' },
        { id: 'quiet', name: 'Quiet', desc: 'No effects. Just the wallpaper.', req: null,
          swatch: 'linear-gradient(120deg, #1a3f9a, #f39a5c)' },
        { id: 'bokeh', name: 'Bokeh', desc: 'Out-of-focus city lights floating by.',
          req: R('Catch 3 floating notifications on Mango OS', onMango('bonuses'), 3),
          swatch: 'radial-gradient(circle at 25% 35%, rgba(255,220,160,.8) 0 9%, transparent 12%), radial-gradient(circle at 65% 60%, rgba(255,255,255,.6) 0 13%, transparent 16%), radial-gradient(circle at 80% 25%, rgba(160,200,255,.7) 0 7%, transparent 10%), linear-gradient(#141a3a, #2c3d7a)' },
        { id: 'shimmer', name: 'Glass Shimmer', desc: 'A slow streak of light gliding over every pane.',
          req: R('Click 1,000 times on Mango OS', onMango('totalClicks'), 1000),
          swatch: 'linear-gradient(115deg, transparent 0 40%, rgba(255,255,255,.75) 50%, transparent 60%), linear-gradient(#3d6fd6, #9cc0f5)' },
        { id: 'halo', name: 'Assistant Glow', desc: 'A rainbow glow breathing around the edges of the screen.',
          req: R('Earn 100 Clout on Mango OS', onMango('cloutEarned'), 100),
          swatch: 'radial-gradient(ellipse at center, #10162e 0 52%, transparent 72%), conic-gradient(#ff9f0a, #ff375f, #bf5af2, #0a84ff, #30d158, #ff9f0a)' },
        { id: 'blobs', name: 'Lava Light', desc: 'Big blobs of color melting into each other.',
          req: R('Catch 10 floating notifications on Mango OS', onMango('bonuses'), 10),
          swatch: 'radial-gradient(circle at 30% 30%, #ff375f 0 22%, transparent 40%), radial-gradient(circle at 70% 70%, #0a84ff 0 24%, transparent 42%), radial-gradient(circle at 70% 25%, #ff9f0a 0 14%, transparent 30%), linear-gradient(#2a1b5a, #1a2d6e)' },
      ],
    },
  ];

  /* Prism OS: holograms floating in deep space. */
  const onHolo = onOS('holo');
  const neon = (a, b) => 'radial-gradient(circle at 50% 50%, rgba(255,255,255,.9) 0 8%, transparent 9%), conic-gradient(from 200deg, ' + a + ', ' + b + ', ' + a + ')';
  const HOLO = [
    {
      id: 'bg', name: 'Backgrounds', icon: '🌌', blurb: 'The space your holograms float in.',
      items: [
        { id: 'prism', name: 'Prism Nebula', desc: 'Deep violet space with iridescent streaks of light. The Prism OS classic.', req: null,
          swatch: 'linear-gradient(120deg, transparent 30%, rgba(120,220,255,.6) 45%, rgba(255,120,220,.5) 55%, transparent 70%), linear-gradient(#120a3a, #3b1c8c 60%, #0d4c8c)' },
        { id: 'datastream', name: 'Data Stream', desc: 'Columns of glowing data falling through the dark.',
          req: R('Click 500 times on Prism OS', onHolo('totalClicks'), 500),
          swatch: 'repeating-linear-gradient(90deg, rgba(94,231,255,.5) 0 2px, transparent 2px 12px), linear-gradient(#020b1c, #062a4a)' },
        { id: 'deepfield', name: 'Deep Field', desc: 'A quiet field of distant galaxies.',
          req: R('Reach the next Internet Era on Prism OS', onHolo('eras'), 1),
          swatch: 'radial-gradient(circle at 30% 40%, #fff 0 1.5px, transparent 2px), radial-gradient(circle at 70% 25%, #ffd 0 1px, transparent 2px), radial-gradient(ellipse 30% 20% at 60% 65%, rgba(160,120,255,.6), transparent 70%), linear-gradient(#030312, #0b0b26)' },
        { id: 'iris', name: 'Iridescent', desc: 'Pearl and oil-slick colors, shifting like a soap film.',
          req: R('Play for 1 hour on Prism OS', onHolo('playTime', 60), 60),
          swatch: 'conic-gradient(from 90deg at 40% 60%, #8ef, #c8f, #fac, #fe9, #9fd, #8ef)' },
      ],
    },
    {
      id: 'color', name: 'Neon Colors', icon: '🎨', blurb: 'The glow of buttons, edges and highlights.',
      items: [
        { id: 'cyan', name: 'Neon Cyan', desc: 'Cool cyan light. Where Prism OS starts.', req: null, swatch: neon('#5ee7ff', '#7b5cff') },
        { id: 'neonpink', name: 'Hot Pink', desc: 'Pink light, loud on purpose.',
          req: R('Buy 30 upgrades on Prism OS', onHolo('upgradesBought'), 30), swatch: neon('#ff5ec8', '#a24dff') },
        { id: 'ultraviolet', name: 'Ultraviolet', desc: 'Deep violet that glows like a blacklight.',
          req: R('Use 15 Actions on Prism OS', onHolo('actions'), 15), swatch: neon('#a45bff', '#4b2bd8') },
        { id: 'gold', name: 'Solar Gold', desc: 'Warm gold light, like a sunrise in orbit.',
          req: R('Earn 1,000 Clout on Prism OS', onHolo('cloutEarned'), 1000), swatch: neon('#ffd25e', '#ff8a3d') },
      ],
    },
    {
      id: 'site', name: 'Website Styles', icon: '🖥️', blurb: 'How your own website looks to visitors.',
      items: [
        { id: 'holo', name: 'Hologram', desc: 'Your site as a glowing projection with scan lines.', req: null,
          swatch: 'repeating-linear-gradient(rgba(94,231,255,.25) 0 1px, transparent 1px 5px), linear-gradient(rgba(94,231,255,.15), rgba(162,77,255,.3)), linear-gradient(#0b0730, #1a0f50)' },
        { id: 'eraholo', name: 'Follows the Era', desc: 'Your site changes style with every Internet Era.', req: null,
          swatch: 'linear-gradient(135deg, #ffffff 0 25%, #f5f6f8 25% 50%, #231036 50% 75%, #0b0f14 75%)' },
        { id: 'neural', name: 'Neural Net', desc: 'Glowing nodes and connections behind your name.',
          req: R('Experience 25 internet events on Prism OS', onHolo('events'), 25),
          swatch: 'radial-gradient(circle at 25% 30%, #5ee7ff 0 4px, transparent 5px), radial-gradient(circle at 70% 60%, #ff5ec8 0 4px, transparent 5px), radial-gradient(circle at 40% 80%, #a45bff 0 4px, transparent 5px), linear-gradient(#070720, #14143c)' },
        { id: 'chrome', name: 'Chrome Future', desc: 'Polished liquid chrome, very 2077.',
          req: R('Buy 300 buildings on Prism OS', onHolo('buildingsBought'), 300),
          swatch: 'linear-gradient(180deg, #f4f7ff 0%, #9aa6c2 45%, #2a3352 50%, #c9d2ea 70%, #ffffff 100%)' },
      ],
    },
    {
      id: 'fx', name: 'Effects', icon: '✨', blurb: 'Light floating in the projection.',
      items: [
        { id: 'rings', name: 'Holo Rings', desc: 'Slowly turning rings of light.', req: null,
          swatch: 'radial-gradient(circle, transparent 0 30%, rgba(94,231,255,.8) 31% 33%, transparent 34% 52%, rgba(255,94,200,.6) 53% 55%, transparent 56%), linear-gradient(#120a3a, #2a1670)' },
        { id: 'off', name: 'Quiet', desc: 'No effects. Just space.', req: null, swatch: 'linear-gradient(#120a3a, #2a1670)' },
        { id: 'particles', name: 'Particle Field', desc: 'Glowing particles drifting up through the projection.',
          req: R('Catch 2 floating notifications on Prism OS', onHolo('bonuses'), 2),
          swatch: 'radial-gradient(circle at 20% 70%, #5ee7ff 0 2px, transparent 3px), radial-gradient(circle at 60% 40%, #ff5ec8 0 2px, transparent 3px), radial-gradient(circle at 80% 80%, #fff 0 1.5px, transparent 2.5px), linear-gradient(#120a3a, #2a1670)' },
        { id: 'scan', name: 'Scan Beam', desc: 'A bright scan line sweeping the screen now and then.',
          req: R('Click 1,500 times on Prism OS', onHolo('totalClicks'), 1500),
          swatch: 'linear-gradient(transparent 45%, rgba(94,231,255,.9) 50%, transparent 55%), linear-gradient(#120a3a, #2a1670)' },
      ],
    },
  ];

  /* ChaosOS 95: grey windows on a teal desktop, seen through a CRT. */
  const onRetro = onOS('retro');
  const bevel = c => 'linear-gradient(135deg, #ffffff 0 12%, transparent 12%), linear-gradient(315deg, #404040 0 12%, transparent 12%), linear-gradient(' + c + ', ' + c + ')';
  const RETRO = [
    {
      id: 'bg', name: 'Wallpapers', icon: '🖼️', blurb: 'The desktop behind the windows.',
      items: [
        { id: 'desktop', name: 'Classic Teal', desc: 'The one and only teal desktop.', req: null, swatch: 'linear-gradient(#008080, #008080)' },
        { id: 'clouds', name: 'Cloud Nine', desc: 'Fluffy clouds in a very blue sky.',
          req: R('Click 500 times on ChaosOS 95', onRetro('totalClicks'), 500),
          swatch: 'radial-gradient(ellipse 30% 18% at 30% 40%, #fff, transparent 70%), radial-gradient(ellipse 26% 14% at 70% 65%, #fff, transparent 70%), linear-gradient(#1f5fd0, #5a9ae8)' },
        { id: 'bricks', name: 'Red Bricks', desc: 'A brick wall. Tiled. Lovingly.',
          req: R('Buy 30 upgrades on ChaosOS 95', onRetro('upgradesBought'), 30),
          swatch: 'linear-gradient(#c0c0c0 2px, transparent 2px) 0 0 / 24px 12px, linear-gradient(90deg, #c0c0c0 2px, transparent 2px) 0 0 / 24px 24px, linear-gradient(90deg, #c0c0c0 2px, transparent 2px) 12px 12px / 24px 24px, linear-gradient(#8b2a1a, #8b2a1a)' },
        { id: 'starfield', name: 'Starfield', desc: 'Black space and white stars, like the screensaver.',
          req: R('Play for 1 hour on ChaosOS 95', onRetro('playTime', 60), 60),
          swatch: 'radial-gradient(circle at 20% 30%, #fff 0 1px, transparent 2px), radial-gradient(circle at 70% 60%, #fff 0 1.5px, transparent 2px), radial-gradient(circle at 45% 80%, #fff 0 1px, transparent 2px), linear-gradient(#000, #000)' },
      ],
    },
    {
      id: 'color', name: 'Window Colors', icon: '🎨', blurb: 'The color of title bars and selections.',
      items: [
        { id: 'navy', name: 'Navy', desc: 'Navy title bars. Standard issue.', req: null, swatch: bevel('#000080') },
        { id: 'plum', name: 'Plum', desc: 'A purple scheme for the bold.',
          req: R('Use 15 Actions on ChaosOS 95', onRetro('actions'), 15), swatch: bevel('#800080') },
        { id: 'olive', name: 'Olive', desc: 'Olive green, like an old army laptop.',
          req: R('Experience 25 internet events on ChaosOS 95', onRetro('events'), 25), swatch: bevel('#808000') },
        { id: 'maroon', name: 'Maroon', desc: 'Dark red, very serious business.',
          req: R('Buy 300 buildings on ChaosOS 95', onRetro('buildingsBought'), 300), swatch: bevel('#800000') },
      ],
    },
    {
      id: 'site', name: 'Website Styles', icon: '🖥️', blurb: 'How your own website looks to visitors.',
      items: [
        { id: 'web1', name: 'Web 1.0', desc: 'Grey background, blue links, Times New Roman.', req: null,
          swatch: 'linear-gradient(#c0c0c0 0 30%, transparent 30%), repeating-linear-gradient(#ffffff 0 6px, #e8e8e8 6px 7px)' },
        { id: 'eranet', name: 'Follows the Era', desc: 'Your site changes style with every Internet Era.', req: null,
          swatch: 'linear-gradient(135deg, #ffffff 0 25%, #f5f6f8 25% 50%, #231036 50% 75%, #0b0f14 75%)' },
        { id: 'terminal', name: 'Terminal', desc: 'Green text on a black screen. Blinking cursor included.',
          req: R('Catch 2 floating notifications on ChaosOS 95', onRetro('bonuses'), 2),
          swatch: 'repeating-linear-gradient(transparent 0 6px, rgba(57,255,106,.5) 6px 7px), linear-gradient(#000, #000)' },
        { id: 'construction', name: 'Under Construction', desc: 'Yellow and black stripes and a digging man GIF energy.',
          req: R('Click 1,500 times on ChaosOS 95', onRetro('totalClicks'), 1500),
          swatch: 'repeating-linear-gradient(45deg, #ffd400 0 8px, #111 8px 16px)' },
      ],
    },
    {
      id: 'fx', name: 'Effects', icon: '✨', blurb: 'What the monitor does.',
      items: [
        { id: 'scanlines', name: 'CRT Scanlines', desc: 'Fine scanlines and a soft glow, like a real monitor.', req: null,
          swatch: 'repeating-linear-gradient(rgba(0,0,0,.35) 0 1px, transparent 1px 3px), linear-gradient(#008080, #00a0a0)' },
        { id: 'clear', name: 'Flat Panel', desc: 'No CRT effect. Crisp and clean.', req: null, swatch: 'linear-gradient(#008080, #008080)' },
        { id: 'warp', name: 'Warp Speed', desc: 'Stars rushing past, straight from a screensaver.',
          req: R('Reach the next Internet Era on ChaosOS 95', onRetro('eras'), 1),
          swatch: 'radial-gradient(circle at 50% 50%, transparent 0 10%, #fff 11% 12%, transparent 13%), radial-gradient(circle at 30% 30%, #fff 0 1px, transparent 2px), radial-gradient(circle at 75% 70%, #fff 0 1.5px, transparent 2px), linear-gradient(#000, #000)' },
        { id: 'glitch', name: 'Bad Signal', desc: 'The picture rolls and tears now and then.',
          req: R('Survive a meltdown on ChaosOS 95', onRetro('meltdowns'), 1),
          swatch: 'linear-gradient(transparent 40%, rgba(255,0,80,.6) 40% 44%, transparent 44% 60%, rgba(0,255,220,.6) 60% 63%, transparent 63%), linear-gradient(#008080, #004040)' },
      ],
    },
  ];

  const SETS = { aero: AERO, metro: METRO, mango: MANGO, holo: HOLO, retro: RETRO };
  const DEFAULTS = {
    aero: { bg: 'sky', color: 'aqua', site: 'era', fx: 'bubbles' },
    metro: { bg: 'light', color: 'cobalt', site: 'modern', fx: 'drift' },
    mango: { bg: 'dawn', color: 'blue', site: 'glass', fx: 'flow' },
    holo: { bg: 'prism', color: 'cyan', site: 'holo', fx: 'rings' },
    retro: { bg: 'desktop', color: 'navy', site: 'web1', fx: 'scanlines' },
  };

  const ITEM = Object.create(null);
  for (const os in SETS) {
    for (const cat of SETS[os]) {
      for (const item of cat.items) ITEM[cat.id + ':' + item.id] = Object.assign({ cat: cat.id, os }, item);
    }
  }

  /** The catalogue for an OS id; unknown ids get the first one. */
  function setFor(osId) { return SETS[osId] || AERO; }

  Z.COSMETICS = {
    SETS,
    CATEGORIES: AERO,              // the ChaosOS 7 catalogue (tools use it as the default)
    CAT: Z.util.byId(AERO),
    ITEM,
    DEFAULTS,
    setFor,
    defaultsFor: osId => DEFAULTS[osId] || DEFAULTS.aero,
    key: (cat, id) => cat + ':' + id,
  };
})(window.ICHAOS = window.ICHAOS || {});
