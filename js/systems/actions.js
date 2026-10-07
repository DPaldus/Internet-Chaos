/* Player actions (cooldown abilities) and automation (auto-click, auto-hotfix,
   auto-buyer, auto-policy, auto-actions). */
(function (Z) {
  'use strict';

  const BAL = Z.BAL;
  const POLICY_ORDER = Z.POLICIES.map(p => p.id);

  /* ---------- Actions ---------- */

  function cooldownOf(g, a) {
    return a.cooldown * (a.id === 'hotfix' ? g.m.hotfixCooldown : 1);
  }

  function isReady(g, id) { return !(g.s.cooldowns[id] > 0); }

  function canUse(g, id) {
    const a = Z.ACT[id];
    if (!a || !a.unlock(g) || !isReady(g, id)) return false;
    return g.s.meltdown <= 0 || id === 'hotfix';
  }

  function use(g, id, auto) {
    if (!canUse(g, id)) return false;
    const s = g.s, a = Z.ACT[id];
    if (id === 'hotfix' && s.meltdown > 0) {
      s.meltdown = Math.max(0.05, s.meltdown - BAL.meltdown.hotfixCut);
    } else {
      Z.effects.apply(g, a.effects);
    }
    s.cooldowns[id] = cooldownOf(g, a);
    s.stats.actions++;
    if (id === 'hotfix') s.stats.hotfixes++;
    if (id === 'stir') s.stats.stirs++;
    if (id === 'apology') s.flags.ev.apology = (s.flags.ev.apology || 0) + 1;
    s.flags.ev['act:' + id] = (s.flags.ev['act:' + id] || 0) + 1;
    g.notify('action', { action: a, auto: !!auto });
    return true;
  }

  function tickCooldowns(g, dt) {
    const cd = g.s.cooldowns;
    for (const id in cd) {
      cd[id] -= dt;
      if (cd[id] <= 0) delete cd[id];
    }
  }

  /* ---------- Policy ---------- */

  function allowedPolicies(g) { return POLICY_ORDER.filter(id => g.m.policies[id]); }

  function setPolicy(g, id) {
    if (!Z.POLICY[id] || !g.m.policies[id]) return false;
    g.s.policy = id;
    Z.econ.compute(g);
    return true;
  }

  /* Risk Manager: one step per check, aiming for Chaos just under Tolerance. */
  function adjustPolicy(g) {
    const s = g.s, c = g.c;
    const order = allowedPolicies(g);
    const i = order.indexOf(s.policy);
    if (i < 0) return;
    let next = i;
    if (s.res.stability < 50 || c.target > c.tolerance + 3) next = i - 1;
    else if (s.res.stability > 80 && c.target < c.tolerance - 12) next = i + 1;
    next = Math.max(0, Math.min(order.length - 1, next));
    if (next !== i) {
      s.policy = order[next];
      Z.econ.compute(g);
      g.notify('policyAuto', { policy: Z.POLICY[s.policy] });
    }
  }

  /* ---------- Auto-buyer ---------- */

  function autoBuyOnce(g) {
    const s = g.s, cats = s.auto.buyCats;
    let best = null, bestCost = Infinity, bestIsUpgrade = false;
    for (const b of Z.BUILDINGS) {
      if (!cats[b.cat] || !s.seen[b.id] || !Z.econ.isAvailable(s, b.id)) continue;
      const cost = Z.econ.price(g, b.id, s.buildings[b.id] || 0, 1);
      if (cost < bestCost) { best = b.id; bestCost = cost; bestIsUpgrade = false; }
    }
    if (cats.upgrades) {
      for (const u of Z.UPGRADES) {
        if (!Z.econ.upgradeVisible(s, u)) continue;
        const cost = Z.econ.upgradeCost(g, u);
        if (cost < bestCost) { best = u.id; bestCost = cost; bestIsUpgrade = true; }
      }
    }
    if (!best || bestCost > s.res.money) return false;
    return bestIsUpgrade ? Z.econ.buyUpgrade(g, best) : !!Z.econ.buyBuilding(g, best, '1');
  }

  /* ---------- Automation tick ---------- */

  function tickAuto(g, dt) {
    const s = g.s, m = g.m, a = s.auto, c = g.c;

    if (m.autoClick > 0 && a.clicker) {
      s.accum.autoClick += m.autoClick * dt;
      const n = Math.floor(s.accum.autoClick);
      if (n > 0) { s.accum.autoClick -= n; Z.econ.autoClick(g, n); }
    }

    if (m.autoHotfix && a.hotfix && (s.res.stability < a.hotfixAt || s.meltdown > 0) && canUse(g, 'hotfix')) {
      use(g, 'hotfix', true);
    }

    if (m.scheduler && a.scheduler && s.meltdown <= 0) {
      if (s.res.chaos < c.tolerance - 15 && s.res.stability > 60 && canUse(g, 'stir')) use(g, 'stir', true);
      else if (s.res.chaos > c.tolerance + 10 && s.res.stability < 35 && canUse(g, 'apology')) use(g, 'apology', true);
    }

    if (m.riskManager && a.policy) {
      s.accum.risk += dt;
      if (s.accum.risk >= 4) { s.accum.risk = 0; adjustPolicy(g); }
    }

    if (m.autobuy && a.buyer) {
      const interval = 2 / Math.pow(2, m.autobuySpeed);
      s.accum.autobuy += dt;
      let guard = 50;
      while (s.accum.autobuy >= interval && guard-- > 0) {
        s.accum.autobuy -= interval;
        if (!autoBuyOnce(g)) { s.accum.autobuy = 0; break; }
      }
    }
  }

  Z.actions = { canUse, use, isReady, cooldownOf, tickCooldowns, setPolicy, allowedPolicies, adjustPolicy };
  Z.auto = { tick: tickAuto, buyOnce: autoBuyOnce };
})(window.ICHAOS = window.ICHAOS || {});
