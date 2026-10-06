/* Notification bonus: every few minutes a glowing notification floats across the screen
   for a few seconds. Catching it (one click) pays out a small surprise. Missing it costs
   nothing. Timing lives here (DOM-free, seeded) so the balance simulator can model it;
   js/ui/bonus.js draws the bubble. It never runs during offline progress. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL, U = Z.util;

  // Timed effects that only the bonus hands out.
  Z.BUFFS.notifFrenzy = { name: 'Notification Frenzy', icon: '🔔', kind: 'good', duration: 25, att: 3 };
  Z.BUFFS.clickStorm = { name: 'Click Storm', icon: '👆', kind: 'good', duration: 12, click: 6 };

  const TYPES = [
    { id: 'frenzy', icon: '🔥', title: 'Notification frenzy!', weight: () => 40,
      effects: [{ buff: 'notifFrenzy' }] },
    { id: 'deal', icon: '💸', title: 'Surprise brand deal!', weight: () => 35,
      effects: [{ money: 60 }] },
    { id: 'storm', icon: '👆', title: 'Click storm!', weight: g => (g.s.run.time < 900 ? 30 : 12),
      effects: [{ buff: 'clickStorm' }] },
    { id: 'detox', icon: '🧘', title: 'Digital detox',
      weight: g => (g.s.flags.reveal.stability && (g.s.res.stability < 70 || g.s.res.chaos > g.c.tolerance) ? 45 : 0),
      effects: [{ chaos: -15 }, { stability: 20 }] },
  ];
  const TYPE = U.byId(TYPES);

  function schedule(g, first) {
    const b = BAL.bonus;
    g.bonus.next = first ? b.firstDelay : Z.rng.range(g.s, b.minInterval, b.maxInterval);
  }

  function pickType(g) {
    let total = 0;
    const pool = [];
    for (const t of TYPES) {
      const w = t.weight(g);
      if (w > 0) { pool.push([t, w]); total += w; }
    }
    let r = Z.rng.next(g.s) * total;
    for (const [t, w] of pool) { r -= w; if (r <= 0) return t; }
    return pool[pool.length - 1][0];
  }

  /** `g.bonusHold` (set by the UI) pauses spawning while the player cannot see it. */
  function tick(g, dt) {
    if (g.offline) return;
    if (!g.bonus) { g.bonus = { next: 0, live: null }; schedule(g, true); }
    const b = g.bonus, s = g.s;
    if (b.live) {
      b.live.time -= dt;
      if (b.live.time <= 0) { b.live = null; schedule(g); g.notify('bonusMissed', {}); }
      return;
    }
    if (g.bonusHold || s.meltdown > 0 || s.run.attention < BAL.bonus.minAttention) return;
    b.next -= dt;
    if (b.next > 0) return;
    const type = pickType(g);
    b.live = { type: type.id, time: BAL.bonus.lifetime };
    g.notify('bonusSpawn', { type, life: BAL.bonus.lifetime });
  }

  /** Catch the live bonus. Returns the payout description, or null if nothing was live. */
  function claim(g) {
    const b = g.bonus;
    if (!b || !b.live) return null;
    const type = TYPE[b.live.type];
    b.live = null;
    schedule(g);
    g.refresh();
    const effText = Z.effects.describe(g, type.effects);
    Z.effects.apply(g, type.effects);
    g.s.stats.bonuses++;
    g.notify('bonusCaught', { type, effText });
    return { type, effText };
  }

  Z.bonus = { tick, claim, TYPES };
})(window.ICHAOS = window.ICHAOS || {});
