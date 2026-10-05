/* Random internet events, choice events and Trending Topics. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL, U = Z.util;

  function nextInterval(g) {
    const s = g.s;
    const r = Z.rng.range(s, BAL.events.minInterval, BAL.events.maxInterval);
    return r * (1 - BAL.events.chaosSpeedup * s.res.chaos / 100);
  }

  function fillText(s, template) {
    return template.replace(/\{(\w+)\}/g, (all, key) => {
      if (key === 'site') return Z.siteName(s);
      const pool = Z.TEXT[key];
      return pool ? Z.rng.pick(s, pool) : all;
    });
  }

  function textFor(g, def) {
    const s = g.s;
    if (def.calmText && s.res.stability > 60) return def.calmText;
    const t = Array.isArray(def.text) ? Z.rng.pick(s, def.text) : def.text;
    return fillText(s, t);
  }

  /* Crash-type events: the "blue screens" that Change Phone Number guards against. */
  const CRASH_EVENTS = { server: true, ddos: true, outage: true };

  function weight(g, def) {
    const s = g.s;
    let w = U.val(def.weight, g) || 0;
    if (w <= 0) return 0;
    if (def.kind === 'good') w *= (0.6 + s.res.chaos / 100) * g.m.goodEvents;
    else w *= 0.3 + (1 - s.res.stability / 100) * 1.5 + s.res.chaos / 250;
    if (CRASH_EVENTS[def.id]) w *= g.m.crashGuard;
    return w;
  }

  function eligible(g, def) {
    const s = g.s;
    if (def.era && s.era < def.era) return false;
    if (def.choices && s.events.pending) return false;
    return !def.req || def.req(s);
  }

  function pick(g) {
    const s = g.s;
    if (s.events.forced) {
      const forced = Z.EV[s.events.forced];
      s.events.forced = null;
      if (forced) return forced;
    }
    let total = 0;
    const pool = [];
    for (const def of Z.EVENTS) {
      if (!eligible(g, def)) continue;
      const w = weight(g, def);
      if (w > 0) { pool.push([def, w]); total += w; }
    }
    if (!pool.length) return null;
    let r = Z.rng.next(s) * total;
    for (const [def, w] of pool) { r -= w; if (r <= 0) return def; }
    return pool[pool.length - 1][0];
  }

  function record(g, def) {
    const s = g.s;
    s.stats.events++;
    s.flags.ev[def.id] = (s.flags.ev[def.id] || 0) + 1;
    if (g.summary) g.summary.events++;
    if (def.id === 'server') s.flags.serverWatch = 60;
  }

  function fire(g) {
    const def = pick(g);
    if (!def) return;
    const s = g.s;
    record(g, def);
    const text = textFor(g, def);
    if (def.choices) {
      const autopilot = g.m.prAutopilot && s.auto.prOn;
      if (g.offline || g.silent || autopilot) {
        const stance = autopilot ? s.auto.pr : 'safe';
        const idx = Math.max(0, def.choices.findIndex(ch => ch.stance === stance));
        resolveWith(g, def, text, idx, false, true);
      } else {
        s.events.pending = { id: def.id, time: BAL.events.choiceTimeout, text };
        g.notify('choice', { def, text });
      }
      return;
    }
    const effText = Z.effects.describe(g, def.effects);
    Z.effects.apply(g, def.effects);
    g.notify('event', { def, text, effText });
  }

  function resolveWith(g, def, text, idx, manual, auto) {
    const s = g.s;
    const choice = def.choices[idx] || def.choices[0];
    const effText = Z.effects.describe(g, choice.effects);
    Z.effects.apply(g, choice.effects);
    if (manual) s.stats.choices++;
    g.notify('choiceResolved', { def, text, choice, effText, auto: !!auto, manual: !!manual });
  }

  /** Answer the pending choice event. index null = default (the safe option). */
  function resolve(g, index, manual) {
    const s = g.s, p = s.events.pending;
    if (!p) return;
    s.events.pending = null;
    const def = Z.EV[p.id];
    if (!def || !def.choices) return;
    let idx = index;
    if (idx === null || idx === undefined) idx = Math.max(0, def.choices.findIndex(ch => ch.stance === 'safe'));
    resolveWith(g, def, p.text, idx, manual, !manual);
  }

  function tick(g, dt) {
    const s = g.s, ev = s.events;
    if (ev.pending) {
      ev.pending.time -= dt;
      if (ev.pending.time <= 0 || g.offline) resolve(g, null, false);
    }
    if (s.run.attention < BAL.events.quietUntil) return;
    ev.next -= dt;
    if (ev.next <= 0) {
      fire(g);
      ev.next = Math.max(ev.next, 0) + nextInterval(g);
    }
  }

  /* Trending Topics (Social Media Era and later): one owned content building trends at a time. */
  function tickTrends(g, dt) {
    const s = g.s, t = s.trend;
    if (s.era < 2) return;
    if (t.time > 0) {
      t.time -= dt;
      if (t.time <= 0) { t.time = 0; t.id = null; }
      return;
    }
    t.next -= dt;
    if (t.next > 0) return;
    t.next = BAL.trends.interval;
    const owned = Z.TRAFFIC.filter(b => (s.buildings[b.id] || 0) > 0);
    if (!owned.length) return;
    t.id = Z.rng.pick(s, owned).id;
    t.time = BAL.trends.duration * g.m.buffDuration;
    s.flags.ev.trend = (s.flags.ev.trend || 0) + 1;
    g.notify('trend', { building: Z.B[t.id], mult: BAL.trends.mult + g.m.trendMult });
  }

  Z.events = { tick, tickTrends, fire, resolve, nextInterval };
})(window.ICHAOS = window.ICHAOS || {});
