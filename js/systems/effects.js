/* Applies event/action effects, manages timed buffs and describes effects in plain words. */
(function (Z) {
  'use strict';

  const BAL = Z.BAL, U = Z.util;

  /** Instant gains are measured in "seconds of production"; early on, clicks set the floor. */
  function secondsOf(g, seconds) {
    return Math.max(g.c.aps, g.c.clickAtt * 2) * seconds;
  }

  /** A buff instance. Only time, duration, the Attention multiplier and the viral
      tally vary per instance; everything else comes from the definition. */
  function buildBuff(key, def, v) {
    return {
      key, time: v.time, duration: v.duration,
      att: v.att || 0,
      yield: def.yield || 0,
      control: def.control || 0,
      click: def.click || 0,
      chaosAdd: def.chaosAdd || 0,
      building: def.building || null,
      bMult: def.bMult || 0,
      noDrain: !!def.noDrain,
      chaosLock: !!def.chaosLock,
      viral: !!def.viral,
      gained: v.gained || 0,
    };
  }

  function addBuff(g, key, opts) {
    const def = Z.BUFFS[key];
    if (!def) return null;
    const o = opts || {};
    const s = g.s;
    const scale = def.kind === 'bad' ? g.m.badSeverity : g.m.buffDuration;
    const duration = (U.val(o.duration, g) || def.duration) * scale;
    const buff = buildBuff(key, def, { time: duration, duration, att: U.val(o.mag, g) || def.att || 0 });
    const i = s.buffs.findIndex(b => b.key === key);
    if (i >= 0) s.buffs.splice(i, 1);
    if (s.buffs.length >= 12) s.buffs.shift();
    s.buffs.push(buff);
    return buff;
  }

  function apply(g, effects) {
    const s = g.s;
    const list = U.val(effects, g) || [];
    Z.econ.compute(g);
    for (const e of list) {
      if (e.buff) { addBuff(g, e.buff, e); continue; }
      if (e.chaos !== undefined) s.res.chaos = U.clamp(s.res.chaos + e.chaos, 0, 100);
      if (e.stability !== undefined && s.meltdown <= 0) {
        const v = e.stability < 0 ? e.stability * g.m.badSeverity : e.stability;
        s.res.stability = U.clamp(s.res.stability + v, 0, BAL.stability.max);
        if (s.res.stability <= 0) Z.econ.startMeltdown(g);
      }
      if (e.att !== undefined) {
        const a = secondsOf(g, e.att);
        Z.econ.gain(g, a, a * g.c.yield);
      }
      if (e.money !== undefined) Z.econ.gain(g, 0, secondsOf(g, e.money) * g.c.yield);
      if (e.loseMoney !== undefined) {
        const loss = Math.min(s.res.money * e.loseMoney, g.c.mps * e.cap) * g.m.badSeverity;
        s.res.money = Math.max(0, s.res.money - loss);
      }
    }
    Z.econ.compute(g);
  }

  /** Counts down buffs; reports finished viral posts. */
  function tick(g, dt) {
    const s = g.s;
    for (let i = s.buffs.length - 1; i >= 0; i--) {
      const b = s.buffs[i];
      b.time -= dt;
      if (b.time > 0) continue;
      s.buffs.splice(i, 1);
      if (b.viral) {
        if (b.gained > s.stats.largestViral) s.stats.largestViral = b.gained;
        g.notify('viralEnd', { gained: b.gained });
        if (s.era >= 3 && Z.rng.next(s) < BAL.viralChainChance) {
          s.events.forced = 'viral';
          s.events.next = Math.min(s.events.next, 4);
        }
      }
    }
  }

  /* ---------- Descriptions ---------- */

  function sign(n) { return (n >= 0 ? '+' : '−') + Math.abs(Math.round(n)); }

  function describeBuff(g, e) {
    const def = Z.BUFFS[e.buff];
    const scale = def.kind === 'bad' ? g.m.badSeverity : g.m.buffDuration;
    const dur = Math.round((U.val(e.duration, g) || def.duration) * scale);
    const parts = [];
    const att = U.val(e.mag, g) || def.att;
    if (att) parts.push('Attention ' + Z.fmt.mult(att));
    if (def.yield) parts.push('Money per Attention ' + Z.fmt.mult(def.yield));
    if (def.control) parts.push('Moderation ' + Z.fmt.mult(def.control));
    if (def.click) parts.push('Click power ' + Z.fmt.mult(def.click));
    if (def.building) parts.push(Z.B[def.building].plural + ' ' + Z.fmt.mult(def.bMult));
    if (def.chaosAdd) parts.push('Chaos target ' + sign(def.chaosAdd));
    if (def.noDrain) parts.push('no Stability drain');
    if (def.chaosLock) parts.push('Chaos pinned under Tolerance');
    return parts.join(', ') + ' for ' + dur + 's';
  }

  function describe(g, effects) {
    const list = U.val(effects, g) || [];
    const out = [];
    for (const e of list) {
      if (e.buff) { out.push(describeBuff(g, e)); continue; }
      if (e.chaos !== undefined) out.push('Chaos ' + sign(e.chaos));
      if (e.stability !== undefined) {
        out.push('Stability ' + sign(e.stability < 0 ? e.stability * g.m.badSeverity : e.stability));
      }
      if (e.att !== undefined) out.push('+' + Z.fmt.num(secondsOf(g, e.att)) + ' Attention');
      if (e.money !== undefined) out.push('+' + Z.fmt.money(secondsOf(g, e.money) * g.c.yield));
      if (e.loseMoney !== undefined) out.push('lose up to ' + Math.round(e.loseMoney * 100 * g.m.badSeverity) + '% of Money');
    }
    return out.join(' · ');
  }

  Z.effects = { addBuff, addBuffFromSave: buildBuff, apply, tick, describe, secondsOf };
})(window.ICHAOS = window.ICHAOS || {});
