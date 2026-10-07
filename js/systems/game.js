/* The game object: state + cached modifiers + derived numbers, and the tick that
   drives every system. The UI, the offline simulator and tools/balance-sim.html all
   use this same object, so there is exactly one set of rules. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL;

  function createGame(state) {
    const g = {
      s: state,
      m: null,
      c: Z.econ.newCalc(),
      dirty: true,
      offline: false,     // true while simulating time away
      silent: false,      // true in headless tools: no UI notifications
      efficiency: 1,      // production multiplier (offline efficiency)
      summary: null,      // collects totals during offline simulation
      secondTimer: 0,
      clock: 0,           // seconds this session has ticked (paces reveals)
      nextRevealAt: 0,
    };
    Z.skinBuildings(state.era);           // every era names the buildings its own way

    g.notify = function (type, data) {
      if (!g.silent && !g.offline) Z.bus.emit(type, data);
    };

    g.refresh = function () {
      Z.skinBuildings(g.s.era);             // returns at once unless the era changed
      if (g.dirty || !g.m) { g.m = Z.mods.compute(g.s); g.dirty = false; }
      Z.econ.compute(g);
    };

    g.tick = function (dt) {
      const s = g.s;
      g.refresh();
      Z.econ.tick(g, dt);
      Z.effects.tick(g, dt);
      Z.actions.tickCooldowns(g, dt);
      Z.events.tick(g, dt);
      Z.events.tickTrends(g, dt);
      Z.auto.tick(g, dt);
      Z.bonus.tick(g, dt);
      Z.mech.tick(g, dt);
      g.refresh();
      track(g, dt);
      g.clock += dt;
      g.secondTimer += dt;
      if (g.secondTimer >= 1) {
        g.secondTimer = 0;
        updateReveals(g);
        Z.econ.updateSeen(g);
        Z.meta.tick(g);
        Z.ach.check(g);
      }
    };

    return g;
  }

  function siteLevel(s) {
    const lv = BAL.siteLevels;
    let i = 0;
    while (i + 1 < lv.length && s.run.attention >= lv[i + 1]) i++;
    return i;
  }

  /* Progressive disclosure: each system is introduced the first time it matters. */
  const REVEALS = {
    chaos: g => g.c.pressure > 0 || g.s.res.chaos > 0.5,
    stability: g => !!g.s.flags.reveal.chaos && (g.s.res.chaos >= g.c.tolerance - 10 || g.s.res.stability < 100
      || Z.BUILDINGS.some(b => b.cat === 'infra' && (g.s.buildings[b.id] || 0) > 0)),
    // Policy is the answer to Stability trouble, so it follows Stability instead of racing it.
    policy: g => !!g.s.flags.reveal.stability && g.s.run.maxChaos >= 25,
    actions: g => Z.ACTIONS.some(a => a.unlock(g)),
    upgrades: g => g.s.run.upgrades > 0 || Z.UPGRADES.some(u => Z.econ.upgradeVisible(g.s, u)),
    eras: g => g.s.era > 1 || g.s.run.attention >= Z.prestige.requirement(g.s) * 0.001,
    auto: g => g.m.autoClick > 0 || g.m.autoHotfix || g.m.autobuy || g.m.riskManager || g.m.prAutopilot || g.m.scheduler,
    analytics: g => siteLevel(g.s) >= 3,
    clout: g => g.s.cloutLifetime > 0,
    bulk: g => Z.BUILDINGS.some(b => (g.s.buildings[b.id] || 0) >= 10) || g.s.cloutLifetime > 0,
    style: g => !!Z.COSMETICS && Z.COSMETICS.setFor(g.s.os.id).some(cat => cat.items.some(i => i.req && i.req.have(g.s) >= i.req.need)),
    os: g => g.s.os.id !== Z.OSES[0].id || Z.opsys.available(g.s, Z.opsys.next(g.s)),
    daily: g => !!g.s.daily.mod && (g.s.cloutLifetime > 0 || (!!g.s.flags.reveal.upgrades && g.s.run.time > 300)),
  };

  const REVEAL_GAP = 20;   // seconds between two newly introduced systems, so each gets noticed

  function updateReveals(g) {
    if (g.clock < g.nextRevealAt) return;
    const rev = g.s.flags.reveal;
    for (const key of Z.REVEAL_KEYS) {
      if (rev[key] || !REVEALS[key](g)) continue;
      rev[key] = true;
      g.notify('reveal', { key });
      if (!g.offline) { g.nextRevealAt = g.clock + REVEAL_GAP; return; }
    }
  }

  /** Records, rolling flags and per-era counters. */
  function track(g, dt) {
    const s = g.s, c = g.c, st = s.stats;
    s.run.time += dt;
    if (!g.offline) st.playTime += dt;
    const chaos = s.res.chaos;
    if (chaos > s.run.maxChaos) s.run.maxChaos = chaos;
    if (chaos > st.highestChaos) st.highestChaos = chaos;
    if (s.res.stability > st.highestStability) st.highestStability = s.res.stability;
    if (c.mps > st.bestMps) st.bestMps = c.mps;
    if (c.aps > st.bestAps) st.bestAps = c.aps;
    if (chaos < 10) s.flags.lowChaosAt = s.run.time;
    if (s.policy === 'unhinged') st.unhingedTime += dt;
    const run = s.run;
    if (s.policy === 'edgy' || s.policy === 'unhinged') run.wildTime += dt;
    if (s.policy === 'wholesome' || s.policy === 'safe') run.safeTime += dt;
    if (s.res.stability < run.minStab && s.meltdown <= 0) run.minStab = s.res.stability;
    if (s.meltdown > 0) run.minStab = 0;
    if (chaos <= c.tolerance && chaos >= c.tolerance - 3) run.edgeTime += dt;
    if (s.flags.serverWatch > 0) {
      s.flags.serverWatch -= dt;
      if (s.flags.serverWatch <= 0) { s.flags.serverWatch = 0; s.flags.serverSurvived = true; }
    }
  }

  /** Simulate time away. Production runs at reduced efficiency; Chaos, Stability,
      events and automation keep running, so a reckless setup can melt down while you sleep. */
  function simulateOffline(g, seconds) {
    const s = g.s;
    g.refresh();
    const cap = g.m.offlineCap * 3600;
    const simulated = Math.min(seconds, cap);
    const summary = {
      away: seconds, simulated, capped: seconds > cap, capHours: g.m.offlineCap, efficiency: g.m.offlineEff,
      att: 0, money: 0, chaos: 0, events: 0, meltdowns: 0, buys: 0, achievements: [],
      stabilityStart: s.res.stability, stabilityEnd: 0,
    };
    const chaosBefore = s.stats.totalChaos;
    const steps = Math.min(BAL.offline.maxSteps, Math.max(1, Math.ceil(simulated / BAL.offline.step)));
    const step = simulated / steps;

    g.offline = true;
    g.efficiency = g.m.offlineEff;
    g.summary = summary;
    try {
      for (let i = 0; i < steps; i++) g.tick(step);
    } finally {
      g.offline = false;
      g.efficiency = 1;
      g.summary = null;
    }
    summary.chaos = s.stats.totalChaos - chaosBefore;
    summary.stabilityEnd = s.res.stability;
    s.stats.offlineTime += seconds;
    if (seconds > s.stats.longestAway) s.stats.longestAway = seconds;
    Z.ach.check(g);
    g.refresh();
    return summary;
  }

  Z.createGame = createGame;
  Z.siteLevel = siteLevel;
  Z.updateReveals = updateReveals;
  Z.offline = { simulate: simulateOffline };
})(window.ICHAOS = window.ICHAOS || {});
