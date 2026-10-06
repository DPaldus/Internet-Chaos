/* Sponsors: brands that appear on the player's website once a sponsorship upgrade or
   building is owned, so those purchases have something to show for them.
   Purely visual: the gameplay effect stays on the upgrade or building itself.

   Each sponsor: id, brand, icon, tagline (tooltip), ad (text for the site's ad slots),
   style (pill colors: [background, ink]) and active(s). */
(function (Z) {
  'use strict';

  const upg = id => s => !!s.upgrades[id];
  const own = id => s => (s.buildings[id] || 0) > 0;

  Z.SPONSORS = [
    { id: 'crumb', brand: 'CrumbTrack', icon: '🍪', active: upg('cookies'),
      style: ['linear-gradient(#ffe7b8, #f2b25c)', '#5a3208'],
      tagline: 'Official cookie partner. We use cookies. Cookies use you.',
      ad: '🍪 CrumbTrack: we already know you are going to click this.' },
    { id: 'volt', brand: 'BLU VOLT', icon: '⚡', active: upg('energy'),
      style: ['linear-gradient(#5cc8ff, #0b4fc4)', '#ffffff'],
      tagline: 'Official energy drink of {Name}. Tastes like the color blue.',
      ad: '⚡ BLU VOLT energy drink: tastes like the color blue. Now 40% bluer.' },
    { id: 'sauce', brand: 'Hot Take Sauce', icon: '🌶️', active: upg('hottake'),
      style: ['linear-gradient(#ff8a5c, #c4160b)', '#fff6e8'],
      tagline: 'Spicier than your comment section.',
      ad: '🌶️ HOT TAKE SAUCE: spicier than the comments. Not by much.' },
    { id: 'reelz', brand: 'Reelz+', icon: '▶️', active: upg('autoplay'),
      style: ['linear-gradient(#3b3b46, #0d0d12)', '#ff4d6d'],
      tagline: 'Autoplay partner. Your next video starts in 3… 2…',
      ad: '▶️ REELZ+: the video you didn\'t ask for starts in 3… 2…' },
    { id: 'snooze', brand: 'SnoozeCloud', icon: '🛏️', active: own('sponsor'),
      style: ['linear-gradient(#f4f0ff, #b9a6f2)', '#3b2780'],
      tagline: 'This website is brought to you by a mattress.',
      ad: '🛏️ SnoozeCloud mattresses: sleep through the next meltdown.' },
    { id: 'deal', brand: 'DealHoarder', icon: '🔗', active: upg('affiliate'),
      style: ['linear-gradient(#b8ffcf, #2fae5d)', '#0b3d1c'],
      tagline: 'Use code CHAOS for 0% off.',
      ad: '🔗 DealHoarder: use code CHAOS for 0% off everything.' },
  ];
  Z.SPONSOR = Z.util.byId(Z.SPONSORS);
})(window.ICHAOS = window.ICHAOS || {});
