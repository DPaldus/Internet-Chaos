/* Achievements and the Internet Era prestige system. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL;

  /* ---------- Achievements ---------- */

  function unlock(g, a) {
    const s = g.s;
    s.achievements[a.id] = Date.now();
    g.dirty = true;
    if (g.summary) g.summary.achievements.push(a.name);
    g.notify('achievement', { ach: a });
  }

  function checkAchievements(g) {
    const s = g.s;
    for (const a of Z.ACHIEVEMENTS) {
      if (s.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.check(g); } catch (err) { ok = false; }
      if (ok) unlock(g, a);
    }
  }

  /* ---------- Internet Eras ---------- */

  function requirement(s) {
    return BAL.prestige.requirement * Math.pow(BAL.prestige.requirementGrowth, s.era - 1) * Z.reboot.requirementMult(s);
  }

  /** Clout for starting the next era now, including this era's challenge bonus and Edge Cache. */
  function cloutGain(s) {
    const p = BAL.prestige;
    const base = p.cloutScale * Math.pow(Math.max(0, s.run.attention) / p.requirement, p.cloutExponent);
    return Math.floor(base * (1 + Z.meta.challengeBonus(s)) * Z.reboot.cloutMult(s));
  }

  function canPrestige(s) { return s.run.attention >= requirement(s); }

  /** Clear everything that belongs to one era, then apply the start-of-era perks. */
  function resetRun(g) {
    const s = g.s;
    s.res.attention = 0;
    s.res.money = 0;
    s.res.chaos = 0;
    s.res.stability = BAL.stability.max;
    s.run = Z.state.freshRun();
    s.buildings = {};
    s.upgrades = {};
    s.seen = {};
    s.buffs = [];
    s.cooldowns = {};
    s.meltdown = 0;
    s.events = { next: BAL.events.firstDelay, pending: null, forced: null };
    s.trend = { id: null, time: 0, next: BAL.trends.interval };
    s.accum = { autoClick: 0, autobuy: 0, risk: 0 };
    s.flags.lowChaosAt = -999;
    s.flags.serverWatch = 0;
    s.challenges.run = {};
    s.mech = {};
    Z.meta.snapshotRun(s);
    g.dirty = true;
    g.refresh();
    const m = g.m;
    if (!m.policies[s.policy]) s.policy = 'normal';
    s.res.money = m.startMoney;
    s.run.money = m.startMoney;   // counts as earned, so shop discovery matches the budget
    for (const id in m.startBuildings) {
      if (Z.B[id]) { s.buildings[id] = m.startBuildings[id]; s.seen[id] = true; }
    }
    g.refresh();
    Z.econ.updateSeen(g);
  }

  function prestige(g) {
    const s = g.s;
    if (!canPrestige(s)) return 0;
    Z.meta.sealEnd(g);
    const gain = cloutGain(s);
    Z.meta.recordEra(g, gain);
    s.clout += gain;
    s.cloutLifetime += gain;
    s.stats.cloutEarned += gain;
    s.stats.eras++;
    if (!s.stats.fastestEra || s.run.time < s.stats.fastestEra) s.stats.fastestEra = s.run.time;
    s.era++;
    resetRun(g);
    return gain;
  }

  function perkCost(p, level) { return Math.ceil(p.cost * Math.pow(p.growth, level)); }

  function perkUnlocked(s, p) { return !p.req || p.req(s); }

  function buyPerk(g, id) {
    const s = g.s, p = Z.PERK[id];
    if (!p || !perkUnlocked(s, p)) return false;
    const lvl = s.perks[id] || 0;
    if (lvl >= p.max) return false;
    const cost = perkCost(p, lvl);
    if (s.clout < cost) return false;
    s.clout -= cost;
    s.perks[id] = lvl + 1;
    const before = g.m;
    g.dirty = true;
    g.refresh();
    if (s.run.time < 120) applyStartBonuses(g, before);
    return true;
  }

  /** Start-of-era perks bought right after a reset apply immediately. */
  function applyStartBonuses(g, before) {
    const s = g.s, m = g.m;
    if (m.startMoney > before.startMoney) {
      s.res.money += m.startMoney - before.startMoney;
      s.run.money += m.startMoney - before.startMoney;
    }
    for (const id in m.startBuildings) {
      if (!Z.B[id]) continue;
      if ((s.buildings[id] || 0) < m.startBuildings[id]) s.buildings[id] = m.startBuildings[id];
      s.seen[id] = true;
    }
    g.refresh();
  }

  /** What the next era's permanent bonus will be after resetting now. */
  function previewBonus(s) {
    const gain = cloutGain(s);
    const now = (1 + BAL.prestige.cloutBonus * s.cloutLifetime) * (1 + BAL.prestige.eraBonus * (s.era - 1));
    const next = (1 + BAL.prestige.cloutBonus * (s.cloutLifetime + gain)) * (1 + BAL.prestige.eraBonus * s.era);
    return { gain, now, next };
  }

  Z.ach = { check: checkAchievements, unlock };
  Z.prestige = { requirement, cloutGain, canPrestige, prestige, resetRun, perkCost, perkUnlocked, buyPerk, previewBonus };
})(window.ICHAOS = window.ICHAOS || {});
