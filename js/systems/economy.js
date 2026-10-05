/* Production, the Chaos/Stability model, clicking, prices and purchases.

   The central loop:
     Attention/s = Σ traffic output × global multipliers × Chaos bonus × Stability efficiency
     Money/s     = Attention/s × Yield, Yield = $0.50 × (1 + monetization %) × upgrades × Chaos bonus
     Chaos target = 100 × Pressure / (Pressure + Control)      (Pressure from content, Control from moderation)
     Tolerance    = 10 + 80 × Capacity / (Capacity + Load)      (Capacity from servers, Load from content)
     Chaos above Tolerance drains Stability; below it, Stability repairs. 0% Stability = Meltdown. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL, U = Z.util;

  function newCalc() {
    return {
      bOut: Object.create(null), rawAps: 0, aps: 0, yield: 0, yieldBonus: 0, mps: 0, clickAtt: 0,
      pressure: 0, control: 0, modControl: 0, target: 0, load: 0, capacity: 0, tolerance: 0,
      regen: 0, drain: 0, stabRate: 0, stabEff: 1, chaosAttMult: 1, chaosYieldMult: 1,
      modShare: 0, modMult: 1, globalAtt: 1, policy: Z.POLICY.normal, meltdown: false, trendId: null,
      buff: { att: 1, yield: 1, control: 1, chaosAdd: 0, noDrain: false, chaosLock: false, b: Object.create(null) },
    };
  }

  function aggregateBuffs(s, c) {
    const b = c.buff;
    b.att = 1; b.yield = 1; b.control = 1; b.chaosAdd = 0; b.noDrain = false; b.chaosLock = false;
    b.b = Object.create(null);
    for (const x of s.buffs) {
      if (x.att) b.att *= x.att;
      if (x.yield) b.yield *= x.yield;
      if (x.control) b.control *= x.control;
      if (x.chaosAdd) b.chaosAdd += x.chaosAdd;
      if (x.noDrain) b.noDrain = true;
      if (x.chaosLock) b.chaosLock = true;
      if (x.building) b.b[x.building] = (b.b[x.building] || 1) * x.bMult;
    }
  }

  function synergyMult(g, id) {
    let syn = 1;
    for (const sy of g.m.synergies) if (sy.id === id) syn += sy.v * (g.s.buildings[sy.src] || 0);
    return syn;
  }

  function toleranceFor(m, capacity, load) {
    return U.clamp(BAL.tolerance.min + m.tolerance + BAL.tolerance.span * capacity / (capacity + load), 0, BAL.tolerance.max);
  }

  /** Recompute every derived number into g.c. Cheap enough to run every tick. */
  function compute(g) {
    const s = g.s, m = g.m, c = g.c;
    aggregateBuffs(s, c);
    const policy = Z.POLICY[s.policy] || Z.POLICY.normal;
    c.policy = policy;
    c.meltdown = s.meltdown > 0;
    c.trendId = s.trend.time > 0 ? s.trend.id : null;
    const trendX = BAL.trends.mult + m.trendMult;

    let raw = 0, pressure = 0, modControl = 0, load = 0, cap = 0, yieldAdd = 0, regenAdd = 0;
    for (const b of Z.BUILDINGS) {
      const n = s.buildings[b.id] || 0;
      if (!n) { c.bOut[b.id] = 0; continue; }
      const mult = (m.bMult[b.id] || 1) * (c.buff.b[b.id] || 1);
      let out = 0;
      if (b.cat === 'traffic') {
        out = n * b.aps * mult * synergyMult(g, b.id) * (c.trendId === b.id ? trendX : 1);
        raw += out;
        load += n * b.load;
      } else if (b.cat === 'money') {
        out = n * b.pct * mult;
        yieldAdd += out;
      } else if (b.cat === 'infra') {
        out = n * b.cap * mult;
        cap += out;
        regenAdd += n * b.regen;
      } else {
        out = n * b.control * mult;
        modControl += out;
      }
      c.bOut[b.id] = out;
      if (b.cp) pressure += n * b.cp;
    }

    pressure *= m.pressureMult * policy.chaosMult;
    modControl *= m.controlMult * c.buff.control;
    c.pressure = pressure;
    c.modControl = modControl;
    c.control = BAL.chaos.baseControl + modControl;
    c.load = load;
    c.capacity = BAL.tolerance.baseCapacity + cap * m.capacityMult;
    c.tolerance = toleranceFor(m, c.capacity, load);

    let target = pressure > 0 ? 100 * pressure / (pressure + c.control) : 0;
    target = U.clamp(target + c.buff.chaosAdd, 0, 100);
    if (c.buff.chaosLock) target = Math.max(0, c.tolerance - 1);
    if (c.meltdown) target = 0;
    c.target = target;

    const chaos = s.res.chaos, stab = s.res.stability;
    c.chaosAttMult = 1 + chaos / 100 * m.chaosAtt;
    c.chaosYieldMult = 1 + chaos / 100 * m.chaosYield;
    c.stabEff = stab >= BAL.stability.knee ? 1
      : BAL.stability.floor + (1 - BAL.stability.floor) * stab / BAL.stability.knee;
    c.modShare = modControl > 0 ? modControl / (modControl + pressure) : 0;
    c.modMult = 1 - BAL.moderationPenalty * c.modShare * m.modPenalty;

    const down = c.meltdown ? BAL.meltdown.productionMult : 1;
    c.globalAtt = m.globalAtt * policy.attMult * c.chaosAttMult * c.stabEff * c.modMult * c.buff.att * down;
    c.rawAps = raw;
    c.aps = raw * c.globalAtt;
    c.yieldBonus = yieldAdd;
    c.yield = BAL.yieldBase * (1 + yieldAdd) * m.yieldMult * c.chaosYieldMult * c.buff.yield;
    c.mps = c.aps * c.yield;
    c.clickAtt = (BAL.click.base + m.clickFlat) * m.clickMult * c.globalAtt + m.clickAps * c.aps;

    const over = chaos - c.tolerance;
    c.drain = over > 0 && !c.buff.noDrain && !c.meltdown ? over * BAL.stability.drainPerPoint * m.drainMult : 0;
    c.regen = (BAL.stability.regenBase + regenAdd + m.stabilityBonus / 60) * m.regenMult * policy.regenMult
      + (over < 0 ? -over * BAL.stability.regenPerPoint : 0);
    c.stabRate = c.regen - c.drain;
  }

  /* ---------- Resource flow ---------- */

  function gain(g, att, money) {
    const s = g.s;
    if (att > 0) {
      s.res.attention += att; s.run.attention += att; s.stats.totalAttention += att;
      for (const b of s.buffs) if (b.viral) b.gained += att;
    }
    if (money > 0) { s.res.money += money; s.run.money += money; s.stats.totalMoney += money; }
    if (g.summary) { g.summary.att += att; g.summary.money += money; }
  }

  function startMeltdown(g) {
    const s = g.s;
    s.meltdown = BAL.meltdown.duration * g.m.meltdownMult;
    s.res.chaos = 0;
    s.res.stability = 0;
    s.stats.meltdowns++;
    s.run.meltdowns++;
    s.flags.serverWatch = 0;
    if (g.summary) g.summary.meltdowns++;
    g.notify('meltdown', { duration: s.meltdown });
  }

  function endMeltdown(g) {
    const s = g.s;
    s.meltdown = 0;
    s.res.stability = Math.min(BAL.stability.max, BAL.meltdown.stabilityAfter + g.m.meltdownStability);
    g.notify('recovered', {});
  }

  function tick(g, dt) {
    const s = g.s, c = g.c;
    const eff = g.efficiency;
    gain(g, c.aps * dt * eff, c.mps * dt * eff);

    const prev = s.res.chaos;
    const k = 1 - Math.exp(-BAL.chaos.approach * dt);
    s.res.chaos = U.clamp(prev + (c.target - prev) * k, 0, 100);
    if (s.res.chaos > prev) s.stats.totalChaos += s.res.chaos - prev;

    if (s.meltdown > 0) {
      s.meltdown -= dt;
      if (s.meltdown <= 0) endMeltdown(g);
    } else {
      s.res.stability = U.clamp(s.res.stability + c.stabRate * dt, 0, BAL.stability.max);
      if (s.res.stability <= 0) startMeltdown(g);
    }
  }

  /* ---------- Clicking ---------- */

  function click(g) {
    const s = g.s;
    s.run.clicks++;
    s.stats.totalClicks++;
    if (s.meltdown > 0) {
      s.meltdown = Math.max(0.05, s.meltdown - BAL.meltdown.rebootPerClick);
      return { reboot: true, att: 0, money: 0 };
    }
    const att = g.c.clickAtt;
    const money = att * g.c.yield;
    gain(g, att, money);
    return { reboot: false, att, money };
  }

  function autoClick(g, n) {
    const s = g.s;
    s.stats.autoClicks += n;
    if (s.meltdown > 0) {
      s.meltdown = Math.max(0.05, s.meltdown - BAL.meltdown.rebootPerClick * n * 0.25);
      return;
    }
    const att = g.c.clickAtt * n * g.efficiency;
    gain(g, att, att * g.c.yield);
  }

  /* ---------- Prices and purchases ---------- */

  function isAvailable(s, id) {
    const b = Z.B[id];
    return !!b && s.era >= b.era;
  }

  /** Total price of buying `qty` more of a building, starting at `owned`. */
  function price(g, id, owned, qty) {
    const b = Z.B[id], r = b.growth || BAL.costGrowth;
    return b.cost * Math.pow(r, owned) * (Math.pow(r, qty) - 1) / (r - 1) * g.m.costMult;
  }

  function maxAffordable(g, id) {
    const b = Z.B[id], r = b.growth || BAL.costGrowth, owned = g.s.buildings[id] || 0, money = g.s.res.money;
    const first = b.cost * Math.pow(r, owned) * g.m.costMult;
    if (money < first) return 0;
    let k = Math.floor(Math.log(money * (r - 1) / first + 1) / Math.log(r));
    while (k > 0 && price(g, id, owned, k) > money) k--;
    return k;
  }

  /** {qty, cost} for a buy-amount setting ('1', '10', '25', 'max'). */
  function quote(g, id, mode) {
    const owned = g.s.buildings[id] || 0;
    let qty = mode === 'max' ? Math.max(1, maxAffordable(g, id)) : (parseInt(mode, 10) || 1);
    return { qty, cost: price(g, id, owned, qty) };
  }

  function buyBuilding(g, id, mode) {
    const s = g.s;
    if (!isAvailable(s, id)) return null;
    const q = quote(g, id, mode || '1');
    if (s.res.money < q.cost) return null;
    s.res.money -= q.cost;
    s.buildings[id] = (s.buildings[id] || 0) + q.qty;
    s.seen[id] = true;
    s.stats.buildingsBought += q.qty;
    if (g.summary) g.summary.buys += q.qty;
    compute(g);
    return q;
  }

  function upgradeCost(g, u) { return u.cost * g.m.costMult; }

  /** Shown once its requirement is met and this era has earned at least 5% of its price. */
  function upgradeVisible(s, u) {
    return !s.upgrades[u.id] && s.era >= (u.era || 1) && s.run.money >= u.cost * 0.05 && u.req(s);
  }

  function buyUpgrade(g, id) {
    const s = g.s, u = Z.U[id];
    if (!u || !upgradeVisible(s, u)) return false;
    const cost = upgradeCost(g, u);
    if (s.res.money < cost) return false;
    s.res.money -= cost;
    s.upgrades[id] = true;
    for (const e of u.effects) {
      if (e.t === 'stabilityBonus' && s.meltdown <= 0) s.res.stability = Math.min(BAL.stability.max, s.res.stability + e.v);
    }
    s.run.upgrades++;
    s.stats.upgradesBought++;
    g.dirty = true;
    g.refresh();
    return true;
  }

  /** Marks buildings as discovered once the player has earned ~30% of their price. */
  function updateSeen(g) {
    const s = g.s;
    const chaosKnown = !!s.flags.reveal.chaos;
    for (const b of Z.BUILDINGS) {
      if (s.seen[b.id] || !isAvailable(s, b.id)) continue;
      if ((b.cat === 'infra' || b.cat === 'mod') && !chaosKnown) continue;
      if ((s.buildings[b.id] || 0) > 0 || b.cost <= 10 || s.run.money >= b.cost * 0.3) {
        s.seen[b.id] = true;
        if (b.cost > 5) g.notify('unlock', { building: b });
      }
    }
  }

  /** What buying `qty` of a building would change, for the shop card. */
  function preview(g, id, qty) {
    const b = Z.B[id], s = g.s, c = g.c, m = g.m;
    const mult = (m.bMult[id] || 1) * (c.buff.b[id] || 1);
    if (b.cat === 'traffic') {
      const unit = b.aps * mult * synergyMult(g, id) * (c.trendId === id ? BAL.trends.mult + m.trendMult : 1);
      const policy = c.policy;
      return {
        aps: unit * c.globalAtt * qty,
        mps: unit * c.globalAtt * qty * c.yield,
        pressure: b.cp * qty * m.pressureMult * policy.chaosMult,
        load: b.load * qty,
      };
    }
    if (b.cat === 'money') {
      const pct = b.pct * mult * qty;
      const dy = BAL.yieldBase * pct * m.yieldMult * c.chaosYieldMult * c.buff.yield;
      return { pct, yield: dy, mps: dy * c.aps };
    }
    if (b.cat === 'infra') {
      const cap = c.capacity + b.cap * mult * m.capacityMult * qty;
      return { tolerance: toleranceFor(m, cap, c.load), regen: b.regen * qty * m.regenMult };
    }
    const control = c.control + b.control * mult * m.controlMult * c.buff.control * qty;
    const target = c.pressure > 0 ? U.clamp(100 * c.pressure / (c.pressure + control) + c.buff.chaosAdd, 0, 100) : 0;
    return { target };
  }

  Z.econ = {
    newCalc, compute, tick, gain, click, autoClick, startMeltdown, endMeltdown,
    isAvailable, price, maxAffordable, quote, buyBuilding,
    upgradeCost, upgradeVisible, buyUpgrade, updateSeen, preview, synergyMult,
  };
})(window.ICHAOS = window.ICHAOS || {});
