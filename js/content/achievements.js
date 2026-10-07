/* Achievements. Each unlocked achievement grants +1% Attention permanently.
   `hidden` ones show as ??? until unlocked. */
(function (Z) {
  'use strict';

  const own = (s, id) => s.buildings[id] || 0;
  const ev = (s, id) => s.flags.ev[id] || 0;
  // `desc` may be a function, for texts that name buildings (their names change with the era).
  const A = (id, icon, name, desc, check, hidden) => ({
    id, icon, name, check, hidden: !!hidden,
    get desc() { return typeof desc === 'function' ? desc() : desc; },
  });
  const ownText = (n, id) => () => 'Own ' + n + ' ' + Z.B[id].plural + '.';

  Z.ACHIEVEMENTS = [
    // Reach
    A('hello', '👋', 'Hello, World', 'Create your first piece of content.', g => g.s.stats.totalClicks >= 1),
    A('mom', '👩', 'Mom Is Proud', 'Reach 100 total Attention.', g => g.s.stats.totalAttention >= 100),
    A('local', '🏘️', 'Locally Famous', 'Reach 10K total Attention.', g => g.s.stats.totalAttention >= 1e4),
    A('million', '👁️', 'First Million Attention', 'Reach 1M total Attention.', g => g.s.stats.totalAttention >= 1e6),
    A('billion', '🌍', 'A Billion Eyeballs', 'Reach 1B total Attention.', g => g.s.stats.totalAttention >= 1e9),
    A('trillion', '🪐', 'Trillion-Scroll Empire', 'Reach 1T total Attention.', g => g.s.stats.totalAttention >= 1e12),
    A('quadrillion', '🌌', 'Attention Singularity', 'Reach 1Qa total Attention.', g => g.s.stats.totalAttention >= 1e15),

    // Money
    A('pocket', '🪙', 'Pocket Money', 'Earn $1,000 in total.', g => g.s.stats.totalMoney >= 1e3),
    A('admillion', '💰', 'Ad Millionaire', 'Earn $1M in total.', g => g.s.stats.totalMoney >= 1e6),
    A('sellout', '🤑', 'Sellout', 'Earn $1B in total.', g => g.s.stats.totalMoney >= 1e9),
    A('monetized', '🏦', 'Monetized Everything', 'Earn $1T in total.', g => g.s.stats.totalMoney >= 1e12),
    A('hoard', '🐉', 'Dragon Hoard', 'Hold $10M unspent at once.', g => g.s.res.money >= 1e7),
    A('passive', '📈', 'Passive Income', 'Earn $1K per second.', g => g.c.mps >= 1e3),
    A('megaincome', '🚀', 'Line Goes Up', 'Earn $1B per second.', g => g.c.mps >= 1e9),

    // Clicking
    A('clicker', '🖱️', 'Clicker', 'Click 100 times.', g => g.s.stats.totalClicks >= 100),
    A('carpal', '🤕', 'Carpal Tunnel Speedrun', 'Click 1,000 times.', g => g.s.stats.totalClicks >= 1000),
    A('steelthumb', '🦾', 'Thumb of Steel', 'Click 10,000 times.', g => g.s.stats.totalClicks >= 1e4),
    A('rage', '😡', 'Rage Clicking', 'Click 12 times within one second.', g => g.s.flags.cpsPeak >= 12),

    // Chaos and stability
    A('maxchaos', '🌀', 'Maximum Chaos', 'Push Chaos to 99% or higher.', g => g.s.res.chaos >= 99),
    A('zerostab', '🕳️', 'Zero Stability', 'Let Stability hit 0%.', g => g.s.stats.meltdowns >= 1),
    A('survivor', '🧯', 'Survived a Server Failure', 'Have a server explode and avoid a meltdown for the next 60 seconds.', g => g.s.flags.serverSurvived),
    A('meltdowns', '🔁', 'Turn It Off and On Again', 'Suffer 5 meltdowns.', g => g.s.stats.meltdowns >= 5),
    A('zen', '🧘', 'Zen Garden', 'Earn $1K/s while Chaos is below 5%.', g => g.c.mps >= 1e3 && g.s.res.chaos < 5),
    A('tightrope', '🎪', 'Tightrope Walker', 'Hold Chaos at 75% or more while Stability is at 90% or more.', g => g.s.res.chaos >= 75 && g.s.res.stability >= 90),
    A('storm', '⛈️', 'Calm Before the Storm', 'Go from under 10% Chaos to over 90% within 30 seconds.', g => g.s.res.chaos > 90 && g.s.run.time - g.s.flags.lowChaosAt <= 30),
    A('wholesome', '🌸', 'Wholesome Empire', 'Earn $1K/s on the Wholesome policy.', g => g.s.policy === 'wholesome' && g.c.mps >= 1e3),
    A('unhinged', '🦝', 'Unhinged', 'Spend 5 minutes in total on the Unhinged policy.', g => g.s.stats.unhingedTime >= 300),

    // Events
    A('firstviral', '🔥', 'First Viral Post', 'Have a post go viral.', g => ev(g.s, 'viral') >= 1),
    A('brokeinternet', '💥', 'Broke the Internet', 'Earn 1B Attention from a single viral post.', g => g.s.stats.largestViral >= 1e9),
    A('hotdog', '🌭', 'Hot Dog Is a Sandwich', 'Witness a completely meaningless argument.', g => ev(g.s, 'argument') >= 1),
    A('cancelled', '🚫', 'Cancelled (Temporarily)', 'Get cancelled for something you posted years ago.', g => ev(g.s, 'cancelled') >= 1, true),
    A('decisions', '🤔', 'Decision Fatigue', 'Answer 25 choice events yourself.', g => g.s.stats.choices >= 25),
    A('maincharacter', '🎬', 'Main Character', 'Experience 100 events.', g => g.s.stats.events >= 100),
    A('trending', '#️⃣', 'For You Page', 'Have one of your buildings trend.', g => ev(g.s, 'trend') >= 1),
    A('gotmail', '🔔', 'You’ve Got Mail', 'Catch a floating notification.', g => g.s.stats.bonuses >= 1),
    A('notifninja', '🥷', 'Notification Ninja', 'Catch 10 floating notifications.', g => g.s.stats.bonuses >= 10),
    A('inboxzero', '📭', 'Inbox Zero', 'Catch 50 floating notifications.', g => g.s.stats.bonuses >= 50),

    // Actions
    A('stirrer', '🥄', 'Pot Stirrer', 'Stir the Pot 10 times.', g => g.s.stats.stirs >= 10),
    A('feature', '🐛', 'It\'s a Feature', 'Push 25 Hotfixes.', g => g.s.stats.hotfixes >= 25),
    A('sorry', '😔', 'We Hear You', 'Post an Apology Video.', g => ev(g.s, 'apology') >= 1),

    // Buildings and upgrades
    A('contentmill', '📝', 'Content Mill', ownText(100, 'blog'), g => own(g.s, 'blog') >= 100),
    A('botornot', '🤖', 'Bot or Not', ownText(100, 'bots'), g => own(g.s, 'bots') >= 100),
    A('adblind', '📢', 'Ad Blindness', ownText(50, 'adbanner'), g => own(g.s, 'adbanner') >= 50),
    A('powertrip', '🧹', 'Power Tripping', ownText(25, 'volunteer'), g => own(g.s, 'volunteer') >= 25),
    A('serverfarm', '🗄️', 'Server Farm', ownText(50, 'rack'), g => own(g.s, 'rack') >= 50),
    A('everything', '🛒', 'Bought Everything', 'Own at least one of every building available in your era.',
      g => Z.BUILDINGS.every(b => b.era > g.s.era || own(g.s, b.id) > 0)),
    A('featurecreep', '🧩', 'Feature Creep', 'Buy 25 upgrades in a single era.', g => g.s.run.upgrades >= 25),
    A('bloatware', '🎈', 'Bloatware', 'Buy 75 upgrades in a single era.', g => g.s.run.upgrades >= 75),

    // Eras
    A('era1', '🌐', 'First Internet Era', 'Move on to a new Internet Era.', g => g.s.stats.eras >= 1),
    A('era4', '🧮', 'Feed the Algorithm', 'Reach the Algorithm Era.', g => g.s.era >= 4),
    A('era7', '💀', 'Post-Internet', 'Reach the Post-Internet Era.', g => g.s.era >= 7),
    A('speedrun', '⏱️', 'Speedrunner', 'Finish an era in under 30 minutes.', g => g.s.stats.fastestEra > 0 && g.s.stats.fastestEra < 1800),
    A('clout100', '💫', 'Influencer of Influencers', 'Earn 100 Clout in total.', g => g.s.cloutLifetime >= 100),
    A('os8', '🪟', 'Where Did the Start Button Go?', 'Upgrade your website to ChaosOS 8.', g => Z.OSES.indexOf(Z.opsys.current(g.s)) >= 1),
    A('flat', '🟦', 'Flat Is the New Glossy', 'Unlock every ChaosOS 8 theme in the Style Shop.',
      g => g.s.os.id === 'metro' && Z.COSMETICS.setFor('metro').every(c => c.items.every(i => !i.req || g.s.cosmetics.unlocked[c.id + ':' + i.id]))),
    A('challenger', '🎯', 'Challenger', 'Complete 5 era challenges.', g => Object.keys(g.s.challenges.done).length >= 5),
    A('overachiever', '🏅', 'Overachiever', 'Complete every era challenge.', g => Z.CHALLENGES.every(c => g.s.challenges.done[c.id])),
    A('daily', '📅', 'Daily Grind', 'Finish a daily challenge.', g => !!g.s.daily.last),
    A('streak7', '🔥', 'Seven Days Online', 'Finish daily challenges seven days in a row.', g => g.s.daily.streak >= 7),
    A('holo', '💠', 'Hologram Me', 'Upgrade your website to Prism OS.', g => Z.OSES.indexOf(Z.opsys.current(g.s)) >= 3),
    A('holoall', '🌌', 'Floating Point', 'Unlock every Prism OS theme in the Style Shop.',
      g => g.s.os.id === 'holo' && Z.COSMETICS.setFor('holo').every(c => c.items.every(i => !i.req || g.s.cosmetics.unlocked[c.id + ':' + i.id]))),
    A('retro', '📺', 'Back to 1995', 'Upgrade your website to ChaosOS 95.', g => Z.OSES.indexOf(Z.opsys.current(g.s)) >= 4),
    A('retroall', '💾', 'Fully Defragmented', 'Unlock every ChaosOS 95 theme in the Style Shop.',
      g => g.s.os.id === 'retro' && Z.COSMETICS.setFor('retro').every(c => c.items.every(i => !i.req || g.s.cosmetics.unlocked[c.id + ':' + i.id]))),
    A('mango', '🥭', 'Liquid Assets', 'Upgrade your website to Mango OS.', g => Z.OSES.indexOf(Z.opsys.current(g.s)) >= 2),
    A('glassy', '🫧', 'Every Corner Rounded', 'Unlock every Mango OS theme in the Style Shop.',
      g => g.s.os.id === 'mango' && Z.COSMETICS.setFor('mango').every(c => c.items.every(i => !i.req || g.s.cosmetics.unlocked[c.id + ':' + i.id]))),

    // Time and meta
    A('nightshift', '🌙', 'Night Shift', 'Play for 1 hour.', g => g.s.stats.playTime >= 3600),
    A('touchgrass', '🌱', 'Touch Grass (Later)', 'Play for 10 hours.', g => g.s.stats.playTime >= 36000),
    A('lunch', '🥪', 'Back From Lunch', 'Return after at least 1 hour away.', g => g.s.stats.longestAway >= 3600),
    A('away24', '🛌', 'Return After 24 Hours', 'Return after at least 24 hours away.', g => g.s.stats.longestAway >= 86400),
    A('ctrls', '💾', 'Ctrl+S', 'Export your save.', g => !!g.s.flags.exported, true),
    A('quiet', '🔇', 'Peace and Quiet', 'Turn the sound off.', g => !!g.s.flags.muted, true),
  ];
  Z.ACH = Z.util.byId(Z.ACHIEVEMENTS);
})(window.ICHAOS = window.ICHAOS || {});
