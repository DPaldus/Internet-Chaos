/* Meta progression around the Internet Eras: the record of finished eras, era challenges
   and the daily challenge. DOM-free, like every system. */
(function (Z) {
  'use strict';

  const HISTORY_MAX = 200;

  /* ---------- "This era" baseline ---------- */

  /** Remembers statistics at the start of an era, so challenges can count "this era". */
  function snapshotRun(s) {
    s.runBase = { stats: Object.assign({}, s.stats), ev: Object.assign({}, s.flags.ev) };
  }

  /* ---------- Era challenges ---------- */

  /** {status: 'done' | 'track' | 'failed' | 'progress', have, need, text} for one challenge now. */
  function challengeState(s, c) {
    const run = s.challenges.run;
    if (run[c.id]) return { status: 'done', text: 'Completed' };
    if (c.end) {
      const ok = c.ok(s);
      return { status: ok ? 'track' : 'failed', text: c.status(s) };
    }
    const have = Math.min(c.need, c.have(s));
    return { status: 'progress', have, need: c.need, text: Z.fmt.int(have) + ' / ' + Z.fmt.int(c.need) };
  }

  function complete(g, c) {
    const s = g.s;
    s.challenges.run[c.id] = true;
    if (!s.challenges.done[c.id]) s.challenges.done[c.id] = Date.now();
    g.notify('challenge', { c });
  }

  /** Live challenges complete the moment their goal is reached (checked once a second). */
  function checkChallenges(g) {
    const s = g.s;
    for (const c of Z.challengesFor(s.era)) {
      if (c.end || s.challenges.run[c.id]) continue;
      if (c.have(s) >= c.need) complete(g, c);
    }
  }

  /** Era-long challenges that are still on track count as done when the era ends. */
  function sealEnd(g) {
    const s = g.s;
    for (const c of Z.challengesFor(s.era)) if (c.end && !s.challenges.run[c.id] && c.ok(s)) complete(g, c);
  }

  /** Extra Clout share for the next era: completed challenges plus era-long ones still on track. */
  function challengeBonus(s) {
    let bonus = 0;
    for (const c of Z.challengesFor(s.era)) {
      if (s.challenges.run[c.id] || (c.end && c.ok(s))) bonus += c.bonus;
    }
    return bonus;
  }

  /* ---------- Era records ---------- */

  function recordEra(g, gain) {
    const s = g.s;
    s.history.push({
      era: s.era, time: s.run.time, clout: gain, attention: s.run.attention, money: s.run.money,
      meltdowns: s.run.meltdowns, clicks: s.run.clicks, upgrades: s.run.upgrades, os: s.os.id,
      challenges: Z.challengesFor(s.era).filter(c => s.challenges.run[c.id]).length, at: Date.now(),
    });
    if (s.history.length > HISTORY_MAX) s.history.splice(0, s.history.length - HISTORY_MAX);
  }

  /** The fastest finished run of each era number: { [era]: entry }. */
  function bestTimes(s) {
    const best = {};
    for (const h of s.history) if (!best[h.era] || h.time < best[h.era].time) best[h.era] = h;
    return best;
  }

  /* ---------- Daily challenge ---------- */

  function hash(text) {
    let x = 2166136261;
    for (let i = 0; i < text.length; i++) { x ^= text.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }

  /** Local calendar day as 'YYYY-MM-DD'. */
  function dayKey(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function previousDay(key) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(y, m - 1, d - 1));
  }

  /** Starts a new daily challenge when the calendar day changes. Returns true on a new day. */
  function ensureDaily(s, key) {
    const dl = s.daily;
    if (dl.date === key) return false;
    dl.date = key;
    dl.mod = Z.DAILY_MODS[hash(key + ':mod') % Z.DAILY_MODS.length].id;
    const goal = Z.DAILY_GOALS[hash(key + ':goal') % Z.DAILY_GOALS.length];
    dl.goal = goal.id;
    dl.base = s.stats[goal.stat] || 0;
    dl.done = false;
    if (dl.last && dl.last !== previousDay(key)) dl.streak = 0;
    return true;
  }

  function dailyActive(s) { return !!(s.flags.reveal.daily && s.daily.mod && Z.DAILY_MOD[s.daily.mod]); }

  function dailyProgress(s) {
    const goal = Z.DAILY_GOAL[s.daily.goal];
    if (!goal) return { have: 0, need: 1 };
    return { have: Math.min(goal.need, Math.max(0, (s.stats[goal.stat] || 0) - s.daily.base)), need: goal.need };
  }

  /** Clout for finishing today's goal: a little more with every day of the streak. */
  function dailyReward(s) {
    const streak = Math.min(7, (s.daily.last === previousDay(s.daily.date) ? s.daily.streak : 0) + 1);
    return Math.max(2, Math.round(s.cloutLifetime * 0.02 * (1 + 0.25 * (streak - 1))));
  }

  function checkDaily(g) {
    const s = g.s, dl = s.daily;
    if (dl.done || !dailyActive(s)) return;
    const p = dailyProgress(s);
    if (p.have < p.need) return;
    const reward = dailyReward(s);
    dl.streak = (dl.last === previousDay(dl.date) ? dl.streak : 0) + 1;
    dl.last = dl.date;
    dl.done = true;
    s.clout += reward;
    s.cloutLifetime += reward;
    s.stats.cloutEarned += reward;
    g.dirty = true;
    g.notify('dailyDone', { reward, streak: dl.streak });
  }

  /** Once a second from the game loop. */
  function tick(g) {
    checkChallenges(g);
    checkDaily(g);
  }

  Z.meta = {
    snapshotRun, challengeState, checkChallenges, sealEnd, challengeBonus,
    recordEra, bestTimes, dayKey, ensureDaily, dailyActive, dailyProgress, dailyReward, checkDaily, tick,
  };
})(window.ICHAOS = window.ICHAOS || {});
