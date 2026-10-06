/* Operating System Upgrade: the website moves to a newer OS for a one-time Money price.
   The OS survives every era and adds permanent bonuses (see Z.OSES in config.js).
   Installing one starts its own Style Shop catalogue, so cosmetic unlocks begin again;
   those unlocks are measured from the stats recorded at install time (`s.os.base`). */
(function (Z) {
  'use strict';

  function current(s) { return Z.OS[s.os.id] || Z.OSES[0]; }

  /** The next OS to install, or null when the website runs the newest one. */
  function next(s) {
    const i = Z.OSES.indexOf(current(s));
    return Z.OSES[i + 1] || null;
  }

  function available(s, os) { return !!os && s.era >= (os.era || 1); }

  function canInstall(s) {
    const n = next(s);
    return available(s, n) && s.res.money >= n.cost;
  }

  /** A lifetime statistic counted since the current OS was installed. */
  function since(s, key) {
    return Math.max(0, (s.stats[key] || 0) - (s.os.base[key] || 0));
  }

  function install(g) {
    const s = g.s, n = next(s);
    if (!canInstall(s)) return null;
    s.res.money -= n.cost;
    s.os = { id: n.id, installed: Date.now(), base: Object.assign({}, s.stats) };
    // The old OS keeps its themes; the new one starts with its free themes only.
    s.cosmetics = Object.assign({ unlocked: {} }, Z.COSMETICS.DEFAULTS[n.id]);
    g.dirty = true;
    g.refresh();
    g.notify('osInstalled', { os: n });
    return n;
  }

  Z.opsys = { current, next, available, canInstall, since, install };
})(window.ICHAOS = window.ICHAOS || {});
