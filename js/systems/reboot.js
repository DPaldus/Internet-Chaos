/* Reboot the Internet (content: js/content/reboot.js). DOM-free, like every system.

   Rebooting is possible once the era goal is reached in the Post-Internet Era or any later
   era. It records the final era, pays Bandwidth and starts over in the Forum Era on the next
   internet version.
     Lost:  the era, Clout, lifetime Clout (its permanent bonus) and Clout perks.
     Kept:  Bandwidth upgrades, operating system and Style Shop themes, achievements, era
            records, completed challenges, the daily streak, statistics and settings.
   Bandwidth = 10 × √(lifetime Clout incl. this era's ÷ 2M) × protocol reward × Wayback
   Machine. A full first internet is worth about 10; going further pays more, with
   diminishing returns. */
(function (Z) {
  'use strict';

  const FIRST_ERA = 7;              // the Post-Internet Era
  const SCALE = 10, BASE = 2e6;

  function level(s, id) { return s.reboot.upgrades[id] || 0; }
  function upgradeCost(u, lvl) { return Math.ceil(u.cost * Math.pow(u.growth, lvl)); }
  function protocol(s) { return Z.PROTOCOL[s.reboot.protocol] || Z.PROTOCOLS[0]; }
  /** The internet version the player is on: v1 before the first reboot. */
  function version(s) { return s.reboot.count + 1; }

  /** Shown in the interface from the Corporate Internet Era on (as a preview) or after a reboot. */
  function visible(s) { return s.era >= FIRST_ERA - 1 || s.reboot.count > 0 || s.reboot.bandwidth > 0; }
  function canReboot(s) { return s.era >= FIRST_ERA && Z.prestige.canPrestige(s); }

  /** Bandwidth for rebooting now (0 while it is not possible yet). */
  function gain(s) {
    if (!canReboot(s)) return 0;
    const clout = s.cloutLifetime + Z.prestige.cloutGain(s);
    return Math.floor(SCALE * Math.sqrt(clout / BASE) * protocol(s).reward * (1 + 0.25 * level(s, 'wayback')));
  }

  /* ---------- Bonuses read by the other rules ---------- */

  function requirementMult(s) { return Math.pow(0.75, level(s, 'standards')); }
  function cloutMult(s) { return Math.pow(1.25, level(s, 'cache')); }
  function challengeMult(s) { return 1 + 0.5 * level(s, 'memory'); }
  function startClout(s) { const l = level(s, 'founder'); return l ? 25 * Math.pow(4, l - 1) : 0; }

  /** Upgrade and protocol effects, for js/systems/modifiers.js. */
  function applyMods(m, s, applyEffect) {
    for (const u of Z.REBOOT_UPGRADES) {
      const l = level(s, u.id);
      if (!l) continue;
      if (u.effects) for (const e of u.effects) applyEffect(m, e, l);
      if (u.apply) u.apply(m, l);
    }
    for (const e of protocol(s).effects) applyEffect(m, e, 1);
  }

  /* ---------- Actions ---------- */

  function buy(g, id) {
    const s = g.s, u = Z.REBOOT_UPGRADE[id];
    if (!u) return false;
    const lvl = level(s, id);
    if (lvl >= u.max) return false;
    const price = upgradeCost(u, lvl);
    if (s.reboot.bandwidth < price) return false;
    s.reboot.bandwidth -= price;
    s.reboot.upgrades[id] = lvl + 1;
    // Veteran Founder bought right after a reboot pays out at once.
    if (id === 'founder' && s.era === 1 && s.run.time < 120) {
      const extra = startClout(s) - (lvl ? 25 * Math.pow(4, lvl - 1) : 0);
      s.clout += extra;
      s.cloutLifetime += extra;
    }
    g.dirty = true;
    g.refresh();
    return true;
  }

  /** Reboots into the next internet on `nextProtocol`. Returns the Bandwidth gained (0 if not possible). */
  function reboot(g, nextProtocol) {
    const s = g.s;
    if (!canReboot(s)) return 0;
    const got = gain(s);
    const from = protocol(s);
    Z.meta.sealEnd(g);
    Z.meta.recordEra(g, Z.prestige.cloutGain(s));    // the last era counts as finished
    if (!s.stats.fastestEra || s.run.time < s.stats.fastestEra) s.stats.fastestEra = s.run.time;
    s.stats.eras++;
    const r = s.reboot;
    r.count++;
    r.bandwidth += got;
    r.lifetime += got;
    if (from.id !== 'standard') r.hard++;
    r.protocol = Z.PROTOCOL[nextProtocol] ? nextProtocol : 'standard';
    s.era = 1;
    s.perks = {};
    s.clout = s.cloutLifetime = startClout(s);
    Z.prestige.resetRun(g);
    g.notify('reboot', { got, version: version(s), protocol: r.protocol });
    return got;
  }

  /* ---------- Records ---------- */

  /** Finished internets (all seven eras on one version): [{v, time, eras}], oldest first. */
  function internets(s) {
    const by = {};
    for (const x of s.history) {
      const v = x.v || 1;
      (by[v] = by[v] || { v, time: 0, eras: {} });
      if (x.era <= FIRST_ERA && !by[v].eras[x.era]) { by[v].eras[x.era] = true; by[v].time += x.time; }
    }
    return Object.keys(by).map(k => by[k]).filter(x => Object.keys(x.eras).length === FIRST_ERA)
      .map(x => ({ v: x.v, time: x.time })).sort((a, b) => a.v - b.v);
  }

  function fastestInternet(s) {
    const all = internets(s);
    return all.length ? all.reduce((a, b) => (b.time < a.time ? b : a)) : null;
  }

  Z.reboot = {
    FIRST_ERA, level, upgradeCost, protocol, version, visible, canReboot, gain,
    requirementMult, cloutMult, challengeMult, startClout, applyMods, buy, reboot, internets, fastestInternet,
  };
})(window.ICHAOS = window.ICHAOS || {});
