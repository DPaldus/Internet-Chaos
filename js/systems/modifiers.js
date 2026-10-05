/* Folds upgrades, perks, achievements, Clout and era into one modifiers object.
   Recomputed only when something permanent changes (the game sets g.dirty). */
(function (Z) {
  'use strict';

  const BAL = Z.BAL;

  // Effect types grouped by how they combine.
  const MULT = ['clickMult', 'attMult', 'yieldMult', 'pressureMult', 'controlMult', 'capacityMult',
    'regenMult', 'drainMult', 'meltdownMult', 'modPenalty', 'goodEvents', 'badSeverity',
    'buffDuration', 'hotfixCooldown', 'costMult', 'crashGuard'];
  const ADD = ['attBonus', 'clickFlat', 'clickAps', 'chaosAtt', 'chaosYield', 'tolerance', 'hotfixPower',
    'autoClick', 'offlineCap', 'offlineEff', 'trendMult', 'meltdownStability', 'autobuySpeed', 'stabilityBonus'];
  const FLAG = ['autoHotfix', 'autobuy', 'riskManager', 'prAutopilot', 'scheduler'];

  function base() {
    const m = {
      bMult: Object.create(null), synergies: [],
      policies: { wholesome: true, safe: true, normal: true, edgy: true },
      actions: Object.create(null),
      startMoney: 0, startBuildings: {},
    };
    for (const k of MULT) m[k] = 1;
    for (const k of ADD) m[k] = 0;
    for (const k of FLAG) m[k] = false;
    m.chaosAtt = BAL.chaos.attPower;
    m.chaosYield = BAL.chaos.yieldPower;
    m.offlineCap = BAL.offline.capHours;
    m.offlineEff = BAL.offline.efficiency;
    return m;
  }

  /** Apply one effect `times` times (perk levels stack this way). */
  function applyEffect(m, e, times) {
    const n = times || 1;
    if (e.t === 'bMult') m.bMult[e.id] = (m.bMult[e.id] || 1) * Math.pow(e.x, n);
    else if (e.t === 'synergy') m.synergies.push({ id: e.id, src: e.src, v: e.v * n });
    else if (e.t === 'policy') m.policies[e.id] = true;
    else if (e.t === 'action') m.actions[e.id] = true;
    else if (MULT.indexOf(e.t) >= 0) m[e.t] *= Math.pow(e.x, n);
    else if (ADD.indexOf(e.t) >= 0) m[e.t] += e.v * n;
    else if (FLAG.indexOf(e.t) >= 0) m[e.t] = true;
  }

  function compute(s) {
    const m = base();
    for (const id in s.upgrades) {
      const u = Z.U[id];
      if (u && s.upgrades[id]) for (const e of u.effects) applyEffect(m, e, 1);
    }
    for (const p of Z.PERKS) {
      const lvl = s.perks[p.id] || 0;
      if (lvl <= 0) continue;
      if (p.effects) for (const e of p.effects) applyEffect(m, e, lvl);
      if (p.apply) p.apply(m, lvl);
    }
    m.achCount = Object.keys(s.achievements).length;
    m.achMult = 1 + BAL.achievementBonus * m.achCount;
    m.cloutMult = 1 + BAL.prestige.cloutBonus * s.cloutLifetime;
    m.eraMult = 1 + BAL.prestige.eraBonus * (s.era - 1);
    m.globalAtt = m.attMult * (1 + m.attBonus) * m.achMult * m.cloutMult * m.eraMult;
    m.offlineEff = Math.min(1, m.offlineEff);
    m.meltdownMult *= m.crashGuard;          // fewer blue screens also means shorter ones
    return m;
  }

  /** Human-readable text for an upgrade/perk effect. */
  function describe(e) {
    const f = Z.fmt;
    switch (e.t) {
      case 'bMult': {
        const b = Z.B[e.id];
        const what = { traffic: 'output', money: 'income', infra: 'capacity', mod: 'Control' }[b.cat];
        return b.plural + ' ' + what + ' ' + f.mult(e.x);
      }
      case 'synergy': return Z.B[e.id].plural + ' +' + Math.round(e.v * 100) + '% per ' + Z.B[e.src].name;
      case 'clickFlat': return 'Clicks +' + e.v + ' base Attention';
      case 'clickMult': return 'Click power ' + f.mult(e.x);
      case 'clickAps': return 'Clicks also add ' + Math.round(e.v * 100) + '% of Attention/s';
      case 'attMult': return 'All Attention ' + f.mult(e.x);
      case 'attBonus': return 'All Attention +' + Math.round(e.v * 100) + '%';
      case 'yieldMult': return 'Money per Attention ' + f.mult(e.x);
      case 'chaosAtt': return 'Chaos Attention bonus +' + Math.round(e.v * 100) + '% (at 100% Chaos)';
      case 'chaosYield': return 'Chaos Money bonus +' + Math.round(e.v * 100) + '% (at 100% Chaos)';
      case 'pressureMult': return 'Chaos pressure ' + f.mult(e.x);
      case 'controlMult': return 'Moderation Control ' + f.mult(e.x);
      case 'capacityMult': return 'Server capacity ' + f.mult(e.x);
      case 'regenMult': return 'Stability repair ' + f.mult(e.x);
      case 'drainMult': return 'Stability drain ' + f.mult(e.x);
      case 'meltdownMult': return 'Meltdown downtime ' + f.mult(e.x);
      case 'modPenalty': return e.x === 0 ? 'Moderation no longer reduces Attention' : 'Moderation penalty ' + f.mult(e.x);
      case 'goodEvents': return 'Good events ' + f.mult(e.x) + ' as likely';
      case 'badSeverity': return 'Bad events ' + Math.round((1 - e.x) * 100) + '% softer';
      case 'buffDuration': return 'Good event effects last ' + f.mult(e.x) + ' longer';
      case 'hotfixPower': return 'Hotfix +' + e.v + ' Stability';
      case 'hotfixCooldown': return 'Hotfix cooldown ' + f.mult(e.x);
      case 'policy': return 'Unlocks the ' + Z.POLICY[e.id].name + ' policy';
      case 'action': return 'Unlocks the ' + Z.ACT[e.id].name + ' action';
      case 'autoClick': return '+' + e.v + ' automatic clicks per second';
      case 'autoHotfix': return 'Automatic Hotfix below your threshold';
      case 'trendMult': return 'Trending multiplier +' + e.v;
      case 'tolerance': return 'Tolerance +' + e.v;
      case 'crashGuard': return 'Blue screens ' + Math.round((1 - e.x) * 100) + '% rarer and shorter';
      case 'stabilityBonus': return 'Stability +' + e.v + '% now, then +' + e.v + '% per minute';
      default: return '';
    }
  }

  Z.mods = { compute, applyEffect, describe };
})(window.ICHAOS = window.ICHAOS || {});
