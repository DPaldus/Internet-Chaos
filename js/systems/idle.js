/* Streaks and rewards, for idle play and for active play. DOM-free, so the self-test and
   the balance simulator use the same rules as the game:

     Uptime        Every full minute the site stays up adds +1% Attention, up to +25%. A
                   meltdown starts the count again, and so does a new era. It keeps
                   counting while you are away, so a safe setup pays off overnight.
     Combo         Clicks in quick succession build a combo, worth up to ×2 click Attention.
     Viral clicks  Any click can go viral for ×5, a little likelier during a combo.
     Welcome Back  Coming back after 10+ minutes away starts a short ×2 Attention boost.
     Milestones    Every power of ten of Attention in an era gets a small celebration.

   Combos and viral clicks happen in the interface (js/ui/site.js) and are not saved;
   only their records are (stats.bestCombo, stats.crits). */
(function (Z) {
  'use strict';

  const BAL = Z.BAL, U = Z.util;

  Z.BUFFS.welcomeBack = { name: 'Welcome Back', icon: '🎁', kind: 'good', duration: 60, att: 2 };

  /* ---------- Uptime ---------- */

  function uptimeMinutes(s) { return Math.floor((s.run.uptime || 0) / 60); }

  /** The Uptime bonus as a fraction (0.12 = +12% Attention). */
  function uptimeBonus(s) {
    const I = BAL.idle;
    return Math.min(I.uptimeCap, uptimeMinutes(s) * I.uptimePerMinute);
  }

  function uptimeMult(s) { return 1 + uptimeBonus(s); }

  /** Seconds until the bonus is full (0 once it is). */
  function uptimeToCap(s) {
    const I = BAL.idle, full = Math.round(I.uptimeCap / I.uptimePerMinute) * 60;
    return Math.max(0, full - (s.run.uptime || 0));
  }

  /** Called every tick: the clock runs while the site is up. */
  function tick(g, dt) {
    const s = g.s;
    if (s.meltdown > 0) return;
    s.run.uptime += dt;
    if (s.run.uptime > s.stats.longestUptime) s.stats.longestUptime = s.run.uptime;
  }

  /* ---------- Combo and viral clicks ---------- */

  function newCombo() { return { n: 0, last: -1e9 }; }

  /** Registers a click at `now` (seconds) and returns the combo count. */
  function comboClick(combo, now) {
    if (now - combo.last > BAL.idle.comboGap) combo.n = 0;
    combo.n++;
    combo.last = now;
    return combo.n;
  }

  /** Whether the combo is still alive at `now`. */
  function comboAlive(combo, now) { return combo.n > 0 && now - combo.last <= BAL.idle.comboGap; }

  function comboMult(n) {
    const I = BAL.idle;
    return 1 + (I.comboMult - 1) * Math.min(n, I.comboMax) / I.comboMax;
  }

  function critChance(n) {
    const I = BAL.idle;
    return I.critBase + I.critPerCombo * Math.min(n, I.comboMax);
  }

  /* ---------- Welcome Back ---------- */

  /** After a long time away: a short Attention boost. Returns {mult, seconds} or null. */
  function welcomeBack(g, away) {
    const I = BAL.idle;
    if (!(away >= I.welcomeAfter)) return null;
    const seconds = U.clamp(I.welcomeBase + away / 3600 * I.welcomePerHour, I.welcomeBase, I.welcomeMax);
    Z.effects.apply(g, [{ buff: 'welcomeBack', duration: seconds }]);
    const ev = g.s.flags.ev;
    ev.welcome = (ev.welcome || 0) + 1;
    const buff = g.s.buffs.find(b => b.key === 'welcomeBack');
    return { mult: Z.BUFFS.welcomeBack.att, seconds: buff ? buff.duration : seconds };
  }

  /* ---------- Milestones ---------- */

  /** The power of ten reached (3 for 1K, 6 for 1M …), or 0 below 1K. */
  function milestone(attention) {
    return attention >= 1000 ? Math.floor(Math.log10(attention) + 1e-9) : 0;
  }

  Z.idle = {
    uptimeMinutes, uptimeBonus, uptimeMult, uptimeToCap, tick,
    newCombo, comboClick, comboAlive, comboMult, critChance,
    welcomeBack, milestone,
  };
})(window.ICHAOS = window.ICHAOS || {});
