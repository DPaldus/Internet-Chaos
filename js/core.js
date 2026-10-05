/* Internet Chaos — namespace, small utilities, seeded RNG and event bus.
   Every script attaches to window.ICHAOS so the game runs from file:// without a server. */
(function (Z) {
  'use strict';

  const util = {
    clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },

    /** Finite number clamped to [lo, hi]; anything else becomes `fallback`. */
    num(v, fallback, lo, hi) {
      if (typeof v !== 'number' || !isFinite(v)) return fallback;
      if (lo !== undefined && v < lo) return lo;
      if (hi !== undefined && v > hi) return hi;
      return v;
    },
    int(v, fallback, lo, hi) { return Math.floor(util.num(v, fallback, lo, hi)); },
    bool(v, fallback) { return typeof v === 'boolean' ? v : fallback; },
    str(v, fallback, maxLen) { return typeof v === 'string' ? v.slice(0, maxLen || 200) : fallback; },
    obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; },
    /** Resolve a content value that may be a function of the game. */
    val(v, g) { return typeof v === 'function' ? v(g) : v; },
    byId(list) {
      const map = Object.create(null);
      for (const item of list) map[item.id] = item;
      return map;
    },
  };

  /* mulberry32: tiny deterministic PRNG. The seed lives in the save, so offline
     simulation and event rolls replay identically from the same state. */
  const rng = {
    next(s) {
      let t = (s.seed = (s.seed + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(s, a, b) { return a + (b - a) * rng.next(s); },
    pick(s, list) { return list[Math.floor(rng.next(s) * list.length) % list.length]; },
  };

  const handlers = Object.create(null);
  const bus = {
    on(name, fn) { (handlers[name] || (handlers[name] = [])).push(fn); },
    emit(name, data) {
      const list = handlers[name];
      if (!list) return;
      for (const fn of list) {
        try { fn(data); } catch (err) { console.error('[ichaos] handler for "' + name + '" failed', err); }
      }
    },
  };

  Z.util = util;
  Z.rng = rng;
  Z.bus = bus;
})(window.ICHAOS = window.ICHAOS || {});
