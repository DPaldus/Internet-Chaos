/* Era challenges and the daily challenge.

   Era challenges: three optional goals per Internet Era (eras past 7 reuse the
   Post-Internet set). Each completed challenge adds `bonus` (a share) to the Clout you
   get when you start the next era. `end` challenges are conditions for the whole era
   ("no meltdowns"): they count while still on track and are sealed when the era ends.
   The others complete the moment `have >= need`.

   Daily challenge: every calendar day picks one modifier (a bonus with a twist, the same
   for every player that day) and one goal with a Clout reward. */
(function (Z) {
  'use strict';

  // Counters "this era": lifetime statistics minus their value when the era started.
  const since = (s, key) => Math.max(0, (s.stats[key] || 0) - ((s.runBase && s.runBase.stats[key]) || 0));
  const sinceEv = (s, id) => Math.max(0, (s.flags.ev[id] || 0) - ((s.runBase && s.runBase.ev[id]) || 0));
  const minutes = sec => Math.round(sec / 60) + ' min';

  const C = (era, id, icon, name, desc, bonus, o) => Object.assign({ era, id, icon, name, desc, bonus }, o);
  // Reach the next era within `sec` seconds.
  const speed = sec => ({ end: true, ok: s => s.run.time <= sec, status: s => minutes(s.run.time) + ' / ' + minutes(sec) });
  const noMeltdown = { end: true, ok: s => s.run.meltdowns === 0, status: s => s.run.meltdowns ? s.run.meltdowns + ' meltdown' + (s.run.meltdowns > 1 ? 's' : '') : 'No meltdowns so far' };
  const count = (have, need) => ({ have, need });

  Z.CHALLENGES = [
    C(1, 'f-speed', '⏱️', 'Dial-up Speedrun', 'Reach the next era within 30 minutes.', 0.12, speed(1800)),
    C(1, 'f-calm', '🧘', 'Netiquette', 'Reach the next era without a single meltdown.', 0.08, noMeltdown),
    C(1, 'f-clicks', '👆', 'Hand-Coded HTML', 'Click the big button 1,000 times this era.', 0.08, count(s => s.run.clicks, 1000)),

    C(2, 's-events', '📰', 'Main Character', 'Experience 25 internet events this era.', 0.1, count(s => since(s, 'events'), 25)),
    C(2, 's-wholesome', '🐶', 'Wholesome Feed', 'Reach the next era without ever using the Edgy or Unhinged policy.', 0.15,
      { end: true, ok: s => s.run.wildTime < 1, status: s => s.run.wildTime < 1 ? 'Still wholesome' : 'Edgy content was posted' }),
    C(2, 's-speed', '⏱️', 'Overnight Success', 'Reach the next era within 20 minutes.', 0.12, speed(1200)),

    C(3, 'v-viral', '🔥', 'Viral Streak', 'Go viral 5 times this era.', 0.1, count(s => sinceEv(s, 'viral') + sinceEv(s, 'mech:trend'), 5)),
    C(3, 'v-leak', '📄', 'Serial Leaker', 'Use Fake Leak 4 times this era.', 0.1, count(s => sinceEv(s, 'act:leak'), 4)),
    C(3, 'v-stable', '🛡️', 'Never Below 50', 'Reach the next era without Stability ever dropping under 50%.', 0.15,
      { end: true, ok: s => s.run.minStab >= 50, status: s => 'Lowest Stability ' + Math.floor(s.run.minStab) + '%' }),

    C(4, 'a-tune', '🎛️', 'Perfectly Tuned', 'Use Algorithmic Tuning 5 times this era.', 0.1, count(s => sinceEv(s, 'act:tune'), 5)),
    C(4, 'a-edge', '🎯', 'Living on the Edge', 'Spend 5 minutes with Chaos just under Tolerance (within 3 points).', 0.12,
      count(s => Math.floor(s.run.edgeTime), 300)),
    C(4, 'a-farm', '📦', 'Content Farm', 'Own 300 Content buildings at the same time.', 0.1,
      count(s => Z.TRAFFIC.reduce((n, b) => n + (s.buildings[b.id] || 0), 0), 300)),

    C(5, 'i-hallucinate', '🌈', 'Hallucination Station', 'Use Hallucinate Content 3 times this era.', 0.1, count(s => sinceEv(s, 'act:hallucinate'), 3)),
    C(5, 'i-hands', '🤖', 'Hands Off the Keyboard', 'Reach the next era with fewer than 300 clicks of your own.', 0.15,
      { end: true, ok: s => s.run.clicks < 300, status: s => s.run.clicks + ' / 300 clicks used' }),
    C(5, 'i-facts', '🔍', 'Fact-Checker', 'Answer 6 AI claims this era (trust them or check them).', 0.1, count(s => sinceEv(s, 'mech:ai'), 6)),

    C(6, 'c-lobby', '💼', 'Regulatory Capture', 'Use Lobbying 3 times this era.', 0.1, count(s => sinceEv(s, 'act:lobby'), 3)),
    C(6, 'c-quarters', '📈', 'Beat the Street', 'Hit the shareholders’ growth target 4 times this era.', 0.12, count(s => sinceEv(s, 'mech:quarterWin'), 4)),
    C(6, 'c-safe', '🏢', 'Brand Safe', 'Spend 10 minutes on the Wholesome or Brand Safe policy this era.', 0.1, count(s => Math.floor(s.run.safeTime), 600)),

    C(7, 'p-speed', '🕳️', 'Into the Void', 'Reach the next era within 45 minutes.', 0.12, speed(2700)),
    C(7, 'p-chaos', '👻', 'Peak Chaos', 'Reach 95% Chaos this era.', 0.1, count(s => Math.floor(s.run.maxChaos), 95)),
    C(7, 'p-bots', '🤖', 'Bot Whisperer', 'Let 4 friendly bot swarms in this era.', 0.1, count(s => sinceEv(s, 'mech:botsGood'), 4)),
  ];
  Z.CHALLENGE = Z.util.byId(Z.CHALLENGES);
  /** The three challenges of an era (eras past 7 repeat the Post-Internet set). */
  Z.challengesFor = era => Z.CHALLENGES.filter(c => c.era === Math.min(era, 7));

  /* ---------- Daily challenge ---------- */

  Z.DAILY_MODS = [
    { id: 'chaosday', icon: '🌀', name: 'Chaos Day', desc: 'Everyone is arguing about everything.',
      effects: [{ t: 'pressureMult', x: 1.5 }, { t: 'attMult', x: 1.5 }] },
    { id: 'serverday', icon: '🖥️', name: 'Server Sale', desc: 'Hosting is cheap today. Advertisers are not.',
      effects: [{ t: 'capacityMult', x: 2 }, { t: 'yieldMult', x: 0.9 }] },
    { id: 'clickday', icon: '👆', name: 'Click Day', desc: 'Your fingers are worth more than your buildings.',
      effects: [{ t: 'clickMult', x: 5 }, { t: 'attMult', x: 0.9 }] },
    { id: 'adday', icon: '💸', name: 'Ad Bonanza', desc: 'Advertisers lost their minds. So did your users.',
      effects: [{ t: 'yieldMult', x: 1.5 }, { t: 'pressureMult', x: 1.25 }] },
    { id: 'detoxday', icon: '🧘', name: 'Digital Detox Day', desc: 'A calm internet, for once.',
      effects: [{ t: 'pressureMult', x: 0.6 }, { t: 'regenMult', x: 1.5 }, { t: 'attMult', x: 0.9 }] },
    { id: 'newsday', icon: '📰', name: 'Big News Day', desc: 'Something is always happening. Mostly good.',
      effects: [{ t: 'goodEvents', x: 2 }, { t: 'tolerance', v: -5 }] },
    { id: 'trendday', icon: '#️⃣', name: 'Trend Storm', desc: 'Trends last longer and hit harder.',
      effects: [{ t: 'trendMult', v: 3 }, { t: 'buffDuration', x: 1.5 }] },
    { id: 'saleday', icon: '🏷️', name: 'Black Friday', desc: 'Everything is 20% off. Ads pay a little less.',
      effects: [{ t: 'costMult', x: 0.8 }, { t: 'yieldMult', x: 0.85 }] },
    { id: 'botday', icon: '🤖', name: 'Bot Invasion', desc: 'Free clicks from very real users.',
      effects: [{ t: 'autoClick', v: 10 }, { t: 'controlMult', x: 0.8 }] },
  ];
  Z.DAILY_MOD = Z.util.byId(Z.DAILY_MODS);

  // `stat` counts from the moment the day's challenge started.
  Z.DAILY_GOALS = [
    { id: 'buy', icon: '🛒', text: 'Buy {n} buildings', stat: 'buildingsBought', need: 150 },
    { id: 'events', icon: '📰', text: 'Experience {n} internet events', stat: 'events', need: 12 },
    { id: 'actions', icon: '⚡', text: 'Use {n} Actions', stat: 'actions', need: 12 },
    { id: 'clicks', icon: '👆', text: 'Click {n} times', stat: 'totalClicks', need: 600 },
    { id: 'upgrades', icon: '⬆️', text: 'Buy {n} upgrades', stat: 'upgradesBought', need: 15 },
    { id: 'bonus', icon: '🔔', text: 'Catch {n} floating notifications', stat: 'bonuses', need: 2 },
    { id: 'hotfix', icon: '🩹', text: 'Push {n} Hotfixes', stat: 'hotfixes', need: 8 },
  ];
  Z.DAILY_GOAL = Z.util.byId(Z.DAILY_GOALS);

  Z.challengeHelpers = { since, sinceEv };
})(window.ICHAOS = window.ICHAOS || {});
