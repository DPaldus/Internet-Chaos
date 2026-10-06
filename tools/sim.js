/* Scripted player for balance testing. Plays like an attentive human:
   clicks a lot early, buys the best-value items, keeps Chaos near Tolerance,
   uses actions, and moves to the next era when it is clearly worth it. */
(function (Z) {
  'use strict';

  const f = Z.fmt;
  const PERK_PRIORITY = ['brand', 'muscle', 'legacy', 'seed', 'chaostheory', 'growth', 'pr', 'institutional',
    'veterans', 'redundancy', 'risk', 'clickfarm', 'insurance', 'luck', 'scheduler', 'growth2', 'unhinged', 'nightshift'];

  function cpsAt(t) { return t < 300 ? 6 : t < 1200 ? 3 : 1; }

  function bestTrafficOrMoney(g) {
    const s = g.s, c = g.c;
    let best = null, bestScore = Infinity;
    for (const b of Z.BUILDINGS) {
      if ((b.cat !== 'traffic' && b.cat !== 'money') || !s.seen[b.id] || !Z.econ.isAvailable(s, b.id)) continue;
      const p = Z.econ.preview(g, b.id, 1);
      const dm = Math.max(p.mps, 1e-12);
      const cost = Z.econ.price(g, b.id, s.buildings[b.id] || 0, 1);
      const income = Math.max(c.mps, c.clickAtt * c.yield * cpsAt(s.run.time), 1e-9);
      const score = Math.max(0, cost - s.res.money) / income + cost / dm;
      if (score < bestScore) { bestScore = score; best = { id: b.id, cost }; }
    }
    return best;
  }

  function bestStabilityFix(g) {
    const s = g.s, c = g.c;
    let best = null, bestScore = -1;
    for (const b of Z.BUILDINGS) {
      if ((b.cat !== 'infra' && b.cat !== 'mod') || !s.seen[b.id] || !Z.econ.isAvailable(s, b.id)) continue;
      const cost = Z.econ.price(g, b.id, s.buildings[b.id] || 0, 1);
      const p = Z.econ.preview(g, b.id, 1);
      const gain = b.cat === 'infra' ? p.tolerance - c.tolerance : c.target - p.target;
      const score = gain / cost;
      if (score > bestScore) { bestScore = score; best = { id: b.id, cost }; }
    }
    return best;
  }

  function botDecide(g) {
    const s = g.s, c = g.c;
    if (s.res.stability < 50) Z.actions.use(g, 'hotfix');
    if (s.res.chaos < c.tolerance - 15 && s.res.stability > 70) Z.actions.use(g, 'stir');
    if (s.res.chaos > c.tolerance + 8 && s.res.stability < 40) Z.actions.use(g, 'apology');
    Z.actions.use(g, 'leak'); Z.actions.use(g, 'hallucinate');
    if (s.res.chaos > c.tolerance) Z.actions.use(g, 'lobby');
    if (Math.floor(s.run.time) % 5 === 0) Z.actions.adjustPolicy(g);

    // Operating System Upgrade: install it when affordable, and save up for it when it is
    // less than two minutes of income away.
    const os = Z.opsys.next(s);
    if (Z.opsys.available(s, os)) {
      if (Z.opsys.canInstall(s)) Z.opsys.install(g);
      else if (os.cost < c.mps * 120) return;
    }

    for (let guard = 0; guard < 40; guard++) {
      let bought = false;
      // upgrades: cheapest affordable first
      let cheapest = null;
      for (const u of Z.UPGRADES) {
        if (!Z.econ.upgradeVisible(s, u)) continue;
        const cost = Z.econ.upgradeCost(g, u);
        if (!cheapest || cost < cheapest.cost) cheapest = { id: u.id, cost };
      }
      if (cheapest && cheapest.cost <= s.res.money) { Z.econ.buyUpgrade(g, cheapest.id); bought = true; continue; }

      if (c.target > c.tolerance - 3 || s.res.stability < 70) {
        const fix = bestStabilityFix(g);
        if (fix && fix.cost <= s.res.money * 0.8) { Z.econ.buyBuilding(g, fix.id, '1'); bought = true; continue; }
      }
      const pick = bestTrafficOrMoney(g);
      if (pick && pick.cost <= s.res.money) { Z.econ.buyBuilding(g, pick.id, '1'); bought = true; }
      if (!bought) break;
    }
  }

  /** The floating notification: a player notices and catches it with probability `p`. */
  function catchBonus(g, p) {
    const live = g.bonus && g.bonus.live;
    if (!live || live.decided) return;
    live.decided = true;
    if (Z.rng.next(g.s) < p) Z.bonus.claim(g);
  }

  function buyPerks(g) {
    for (let guard = 0; guard < 200; guard++) {
      let bought = false;
      for (const id of PERK_PRIORITY) {
        if (Z.prestige.buyPerk(g, id)) { bought = true; break; }
      }
      if (!bought) break;
    }
    const a = g.s.auto;
    a.buyer = false; a.prOn = true; a.pr = 'bold'; a.policy = false; a.scheduler = false;
  }

  function run(opts) {
    const s = Z.state.create(0);
    s.seed = opts.seed >>> 0;
    const g = Z.createGame(s);
    g.silent = true;
    const lines = [];
    const out = (str) => lines.push(str);
    const dt = 0.5;
    let t = 0, clickAcc = 0, nextDecision = 0, eraStart = 0, reqReachedAt = null;
    let firsts = {}, eraLog = [], osSeen = s.os.id, osAt = null;
    const tStr = x => f.time(x).padStart(8);

    out('t(total)  era  event');
    while (t < opts.hours * 3600 && s.era <= opts.maxEras && !(opts.stopAt && t >= opts.stopAt)) {
      clickAcc += cpsAt(s.run.time) * dt;
      while (clickAcc >= 1) { Z.econ.click(g); clickAcc -= 1; }
      g.tick(dt);
      t += dt;
      catchBonus(g, opts.catchRate === undefined ? 0.8 : opts.catchRate);

      if (t >= nextDecision) { nextDecision = t + 1; botDecide(g); }
      if (s.os.id !== osSeen) {
        osSeen = s.os.id;
        osAt = t;
        out(tStr(t) + '  ' + s.era + '    OS UPGRADE → ' + Z.opsys.current(s).name + ' (era time ' + f.time(s.run.time) + ', $/s ' + f.num(g.c.mps) + ')');
      }
      // Style Shop themes of the installed OS (after an upgrade), as they become unlockable.
      if (osAt !== null && Math.floor(t) !== Math.floor(t - dt)) {
        for (const cat of Z.COSMETICS.setFor(s.os.id)) {
          for (const item of cat.items) {
            const key = cat.id + ':' + item.id;
            if (!item.req || firsts['cos:' + key] || item.req.have(s) < item.req.need) continue;
            firsts['cos:' + key] = true;
            out(tStr(t) + '  ' + s.era + '    theme ready: ' + key + ' (' + f.time(t - osAt) + ' after the upgrade)');
          }
        }
      }
      if (Math.floor(t / 300) !== Math.floor((t - dt) / 300)) {
        out(tStr(t) + '  ' + s.era + '    · A ' + f.num(s.run.attention) + '  A/s ' + f.num(g.c.aps) + '  $/s ' + f.num(g.c.mps)
          + '  yield ' + f.num(g.c.yield, { dec: 2 }) + '  chaos ' + s.res.chaos.toFixed(0) + '/' + g.c.tolerance.toFixed(0)
          + '  stab ' + s.res.stability.toFixed(0) + '  upg ' + s.run.upgrades + '  ' + s.policy);
      }

      for (const b of Z.BUILDINGS) {
        const key = s.era + ':' + b.id;
        if (!firsts[key] && (s.buildings[b.id] || 0) > 0) {
          firsts[key] = true;
          out(tStr(t) + '  ' + s.era + '    first ' + b.name + '  (era time ' + f.time(s.run.time) + ', A/s ' + f.num(g.c.aps) + ', $/s ' + f.num(g.c.mps) + ', chaos ' + s.res.chaos.toFixed(0) + '/' + g.c.tolerance.toFixed(0) + ', stab ' + s.res.stability.toFixed(0) + ')');
        }
      }
      if (s.run.meltdowns > (firsts['md' + s.era] || 0)) {
        firsts['md' + s.era] = s.run.meltdowns;
        if (s.run.meltdowns <= 3) out(tStr(t) + '  ' + s.era + '    MELTDOWN #' + s.run.meltdowns);
      }

      if (Z.prestige.canPrestige(s)) {
        if (reqReachedAt === null) {
          reqReachedAt = s.run.time;
          out(tStr(t) + '  ' + s.era + '    era requirement reached (gain ' + Z.prestige.cloutGain(s) + ' clout)');
        }
        const gain = Z.prestige.cloutGain(s);
        const waited = s.run.time - reqReachedAt;
        if (gain >= Math.max(10, s.cloutLifetime) || waited > Math.max(300, reqReachedAt * 0.3)) {
          eraLog.push({ era: s.era, time: s.run.time, gain, upgrades: s.run.upgrades, meltdowns: s.run.meltdowns, events: s.stats.events });
          out(tStr(t) + '  ' + s.era + '    >>> PRESTIGE +' + gain + ' clout after ' + f.time(s.run.time) + ' (upgrades ' + s.run.upgrades + ', meltdowns ' + s.run.meltdowns + ')');
          Z.prestige.prestige(g);
          buyPerks(g);
          eraStart = t; reqReachedAt = null;
          const perks = Object.keys(s.perks).map(k => k + ':' + s.perks[k]).join(' ');
          out('          perks: ' + perks + ' | clout left ' + s.clout + ' | lifetime ' + s.cloutLifetime);
        }
      }
    }
    out('');
    out('End at ' + f.time(t) + ' — era ' + s.era + ', era time ' + f.time(s.run.time) + ', era attention ' + f.num(s.run.attention) + ' / requirement ' + f.num(Z.prestige.requirement(s)));
    out('A/s ' + f.num(g.c.aps) + '  $/s ' + f.num(g.c.mps) + '  yield ' + f.num(g.c.yield) + '  chaos ' + s.res.chaos.toFixed(1) + '  tol ' + g.c.tolerance.toFixed(1) + '  stab ' + s.res.stability.toFixed(1));
    out('Total meltdowns ' + s.stats.meltdowns + ', events ' + s.stats.events + ', achievements ' + Object.keys(s.achievements).length + '/' + Z.ACHIEVEMENTS.length);
    out('Buildings: ' + Z.BUILDINGS.filter(b => s.buildings[b.id]).map(b => b.id + ' ' + s.buildings[b.id]).join(', '));
    out('');
    out('Eras: ' + eraLog.map(e => 'E' + e.era + ' ' + f.time(e.time) + ' (+' + e.gain + ')').join(' | '));
    if (opts.returnGame) return { text: lines.join('\n'), g };
    return lines.join('\n');
  }

  /* ---------- Pacing report: what a player meets, and when, in the first hour(s) ---------- */

  const PROFILES = {
    attentive: { cps: cpsAt, every: 1, catch: 0.9 },                  // clicks a lot, checks the shop every second
    casual: { cps: t => (t < 600 ? 3 : 1.5), every: 8, catch: 0.6 },  // clicks moderately, buys every few seconds
    idle: { cps: t => (t < 300 ? 2 : 0.3), every: 30, catch: 0.2 },   // mostly lets the game run
  };

  function runPacing(opts) {
    const prof = PROFILES[opts.profile] || PROFILES.casual;
    const s = Z.state.create(0);
    s.seed = opts.seed >>> 0;
    const g = Z.createGame(s);
    g.silent = true;
    const dt = 0.5, end = (opts.minutes || 60) * 60;
    const log = [], novel = [0];
    const seen = Object.create(null);
    const mark = (t, kind, text) => { log.push([t, kind, text]); novel.push(t); };
    let t = 0, clickAcc = 0, nextDecision = 0, lastLevel = 0, lastUpg = 0;
    while (t < end) {
      clickAcc += prof.cps(s.run.time) * dt;
      while (clickAcc >= 1) { Z.econ.click(g); clickAcc -= 1; }
      g.tick(dt);
      t += dt;
      catchBonus(g, prof.catch);
      if (t >= nextDecision) { nextDecision = t + prof.every; botDecide(g); }

      for (const b of Z.BUILDINGS) {
        if (!seen['b' + b.id] && (s.buildings[b.id] || 0) > 0) { seen['b' + b.id] = 1; mark(t, 'building', b.name); }
      }
      if (s.run.upgrades > lastUpg) {
        for (const id in s.upgrades) if (!seen['u' + id]) { seen['u' + id] = 1; mark(t, 'upgrade', Z.U[id].name); }
        lastUpg = s.run.upgrades;
      }
      for (const k of Z.REVEAL_KEYS) if (!seen['r' + k] && s.flags.reveal[k]) { seen['r' + k] = 1; mark(t, 'reveal', k); }
      for (const id in s.achievements) if (!seen['a' + id]) { seen['a' + id] = 1; mark(t, 'achievement', id); }
      const lvl = Z.siteLevel(s);
      if (lvl > lastLevel) { lastLevel = lvl; mark(t, 'site', Z.SITE_LEVELS[lvl]); }
      if (Z.COSMETICS) {
        for (const key in Z.COSMETICS.ITEM) {
          const r = Z.COSMETICS.ITEM[key].req;
          if (r && !seen['c' + key] && r.have(s) >= r.need) { seen['c' + key] = 1; mark(t, 'style', key); }
        }
      }
      if (Z.SPONSORS) for (const sp of Z.SPONSORS) if (!seen['s' + sp.id] && sp.active(s)) { seen['s' + sp.id] = 1; mark(t, 'sponsor', sp.brand); }
      if (s.stats.meltdowns && !seen.melt) { seen.melt = 1; mark(t, 'meltdown', 'first meltdown'); }
      if (!seen['os' + s.os.id] && s.os.id !== Z.OSES[0].id) { seen['os' + s.os.id] = 1; mark(t, 'os', 'installed ' + Z.opsys.current(s).name); }
      if (!seen.era && Z.prestige.canPrestige(s)) { seen.era = 1; mark(t, 'era', 'next Internet Era available'); }
      if (Z.bonus && s.stats.bonuses && !seen['bonus' + s.stats.bonuses] && s.stats.bonuses <= 3) { seen['bonus' + s.stats.bonuses] = 1; mark(t, 'bonus', 'caught #' + s.stats.bonuses); }
    }
    novel.push(end);
    const gaps = [];
    for (let i = 1; i < novel.length; i++) if (novel[i] - novel[i - 1] >= 120) gaps.push([novel[i - 1], novel[i] - novel[i - 1]]);
    return { log, gaps, g, end };
  }

  function pacingText(opts) {
    const r = runPacing(opts), s = r.g.s;
    const tm = x => f.time(x).padStart(7);
    const lines = ['Pacing · ' + (opts.profile || 'casual') + ' player · ' + (opts.minutes || 60) + ' min · seed ' + opts.seed, ''];
    for (const [t, kind, text] of r.log) if (kind !== 'achievement') lines.push(tm(t) + '  ' + kind.padEnd(9) + ' ' + text);
    lines.push('');
    const ach = r.log.filter(x => x[1] === 'achievement');
    lines.push('Achievements: ' + [5, 10, 20, 30, 60, 120].filter(m => m * 60 <= r.end).map(m => m + 'm ' + ach.filter(x => x[0] <= m * 60).length).join(' · '));
    lines.push('Quiet stretches (2+ min with nothing new): ' + (r.gaps.length ? r.gaps.map(([at, len]) => 'at ' + f.time(at) + ' for ' + f.time(len)).join(', ') : 'none'));
    lines.push('End: A ' + f.num(s.run.attention) + '  A/s ' + f.num(r.g.c.aps) + '  $/s ' + f.num(r.g.c.mps) + '  upgrades ' + s.run.upgrades + '  events ' + s.stats.events + '  meltdowns ' + s.stats.meltdowns);
    return lines.join('\n');
  }

  window.ICHAOS_SIM = { run, runPacing, pacingText };

  const btn = document.getElementById('run');
  if (btn) {
    btn.addEventListener('click', () => {
      const outEl = document.getElementById('out');
      outEl.textContent = 'Running…';
      setTimeout(() => {
        const started = performance.now();
        try {
          const text = run({
            hours: parseFloat(document.getElementById('hours').value) || 6,
            seed: parseInt(document.getElementById('seed').value, 10) || 1,
            maxEras: parseInt(document.getElementById('eras').value, 10) || 6,
          });
          outEl.textContent = text + '\n\n(simulated in ' + Math.round(performance.now() - started) + ' ms)';
        } catch (err) {
          outEl.textContent = 'Simulation failed: ' + err.stack;
        }
      }, 30);
    });
  }
})(window.ICHAOS);
