/* DEV menu for testing: press F8 (or Ctrl+Shift+D) to open or close it. Skips eras, adds
   Money, Attention and Clout, installs operating systems, unlocks themes and fast-forwards
   time. It is a developer tool: tools/build.py leaves this file out of the player build
   unless it is run with --dev. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  let root = null, info = null, timer = 0, syncSelects = () => {};

  const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18, sx: 1e21, sp: 1e24, oc: 1e27, no: 1e30, dc: 1e33 };

  /** "25Qa", "1.5T", "3e16" or "1000" → a number (NaN when it makes no sense). */
  function parseAmount(text) {
    const m = String(text).trim().replace(/[$,\s]/g, '').match(/^([0-9.]+(?:e[+-]?\d+)?)([a-z]*)$/i);
    if (!m) return NaN;
    const mult = m[2] ? SUFFIX[m[2].toLowerCase()] : 1;
    return mult ? parseFloat(m[1]) * mult : NaN;
  }

  /* ---------- Actions ---------- */

  function g() { return Z.game; }

  /** After every change: recompute, redraw, save, and say what happened. */
  function done(text) {
    const game = g();
    game.dirty = true;
    game.refresh();
    Z.updateReveals(game);
    Z.econ.updateSeen(game);
    ui.requestRender(true);
    ui.os.render(game);
    Z.save.write(game.s);
    if (text) ui.toast({ icon: '🛠️', title: 'DEV', text, kind: 'info', duration: 2500 });
    refreshInfo();
  }

  function addMoney(x) {
    const s = g().s;
    s.res.money += x;
    s.run.money += x;
    s.stats.totalMoney += x;
  }

  function addAttention(x) {
    const s = g().s;
    s.res.attention += x;
    s.run.attention += x;
    s.stats.totalAttention += x;
  }

  function nextEra(quiet) {
    const game = g(), s = game.s;
    const need = Z.prestige.requirement(s);
    if (s.run.attention < need) addAttention(need - s.run.attention);
    const from = s.era;
    const got = Z.prestige.prestige(game);
    if (s.era === from) return false;
    ui.resetAll();
    if (!quiet) ui.feed.add(game, '🌐', 'DEV: skipped to the ' + Z.era(s.era).name + ' (+' + Z.fmt.int(got) + ' Clout).', 'era');
    return true;
  }

  /** Puts the website straight into era `n`, forwards or backwards, with a fresh start
      (no Clout is gained; Clout, perks, achievements and the OS stay). */
  function setEra(n) {
    const game = g(), s = game.s;
    s.era = n;
    s.stats.eras = Math.max(s.stats.eras, n - 1);
    Z.prestige.resetRun(game);
    ui.resetAll();
    ui.feed.add(game, '🌐', 'DEV: now in the ' + Z.era(n).name + '.', 'era');
    done('Now in the ' + Z.era(n).name + '.');
  }

  /** Switches to any operating system, newer or older, with that OS's free themes. */
  function setOS(id) {
    const game = g(), s = game.s, os = Z.OS[id];
    if (!os) return;
    s.os = { id, installed: Date.now(), base: id === Z.OSES[0].id ? {} : Object.assign({}, s.stats) };
    s.cosmetics = Object.assign({ unlocked: {} }, Z.COSMETICS.defaultsFor(id));
    s.flags.reveal.os = true;
    s.flags.osOffer = id;
    ui.os.sync();
    ui.site.refreshLook();
    done('Now running ' + os.name + ' ' + os.edition + '.');
  }

  function unlockThemes() {
    const s = g().s;
    for (const cat of Z.COSMETICS.setFor(s.os.id)) {
      for (const item of cat.items) if (item.req) s.cosmetics.unlocked[cat.id + ':' + item.id] = true;
    }
    s.flags.reveal.style = true;
    done('Every ' + Z.opsys.current(s).name + ' theme is unlocked.');
  }

  function addBuildings(n) {
    const s = g().s;
    for (const b of Z.BUILDINGS) {
      if (!Z.econ.isAvailable(s, b.id)) continue;
      s.buildings[b.id] = (s.buildings[b.id] || 0) + n;
      s.seen[b.id] = true;
      s.stats.buildingsBought += n;
    }
    done('+' + n + ' of every building.');
  }

  function freeUpgrades() {
    const s = g().s;
    let n = 0;
    for (const u of Z.UPGRADES) {
      if (s.upgrades[u.id] || s.era < (u.era || 1) || !u.req(s)) continue;
      s.upgrades[u.id] = true;
      s.run.upgrades++;
      s.stats.upgradesBought++;
      n++;
    }
    done(n + ' upgrades added for free.');
  }

  function revealAll() {
    const s = g().s;
    for (const k of Z.REVEAL_KEYS) s.flags.reveal[k] = true;
    done('Every part of the interface is visible.');
  }

  function unlockAchievements() {
    const game = g();
    let n = 0;
    for (const a of Z.ACHIEVEMENTS) if (!game.s.achievements[a.id]) { game.s.achievements[a.id] = Date.now(); n++; }
    done(n + ' achievements unlocked.');
  }

  function fastForward(seconds) {
    const game = g();
    const step = 1, steps = Math.round(seconds / step);
    for (let i = 0; i < steps; i++) game.tick(step);
    done('Skipped ' + Z.fmt.time(seconds) + ' of play.');
  }

  /* ---------- The panel ---------- */

  function btn(label, fn, title) {
    const b = ui.h('button', { type: 'button', class: 'dev-btn', text: label, title: title || label });
    b.addEventListener('click', () => { try { fn(); } catch (err) { console.error(err); ui.toast({ icon: '⚠️', title: 'DEV error', text: String(err.message || err), kind: 'bad' }); } });
    return b;
  }

  function group(title, items) {
    return ui.h('section', { class: 'dev-group' }, [ui.h('h4', { text: title }), ui.h('div', { class: 'dev-row' }, items)]);
  }

  function build() {
    const h = ui.h;
    const moneyInput = h('input', { class: 'dev-input', type: 'text', placeholder: 'e.g. 25Qa', 'aria-label': 'Money to set' });
    const setMoney = () => {
      const v = parseAmount(moneyInput.value);
      if (!(v >= 0)) return ui.toast({ icon: '⚠️', title: 'DEV', text: 'Type an amount like 1e15, 20Qa or 3.5T.', kind: 'bad' });
      const s = g().s, diff = v - s.res.money;
      if (diff > 0) addMoney(diff); else { s.res.money = v; }
      done('Money set to ' + Z.fmt.money(v) + '.');
    };
    moneyInput.addEventListener('keydown', e => { if (e.key === 'Enter') setMoney(); e.stopPropagation(); });

    const eraSelect = h('select', { class: 'dev-input', 'aria-label': 'Era to switch to' },
      Array.from({ length: 10 }, (_, i) => h('option', { value: String(i + 1), text: (i + 1) + ' · ' + Z.era(i + 1).name })));
    const osSelect = h('select', { class: 'dev-input', 'aria-label': 'Operating system to switch to' },
      Z.OSES.map(os => h('option', { value: os.id, text: os.icon + ' ' + os.name + ' ' + os.edition })));
    // Both lists open on the current value whenever the menu opens.
    syncSelects = () => { eraSelect.value = String(Math.min(g().s.era, 10)); osSelect.value = g().s.os.id; };

    const mps = () => Math.max(g().c.mps, 1);
    const aps = () => Math.max(g().c.aps, 1);

    info = h('p', { class: 'dev-info' });
    root = h('div', { class: 'dev-menu', role: 'dialog', 'aria-label': 'DEV menu', hidden: true }, [
      h('div', { class: 'dev-head' }, [
        h('b', { text: '🛠️ DEV menu' }),
        h('span', { class: 'dev-hint', text: 'F8 to close' }),
        btn('✕', toggle, 'Close'),
      ]),
      info,
      group('💵 Money', [
        btn('+1 min income', () => { addMoney(mps() * 60); done('+' + Z.fmt.money(mps() * 60)); }),
        btn('+1 h income', () => { addMoney(mps() * 3600); done('+' + Z.fmt.money(mps() * 3600)); }),
        btn('×10', () => { const v = Math.max(g().s.res.money, 1000) * 9; addMoney(v); done('Money ×10'); }),
        btn('×1000', () => { const v = Math.max(g().s.res.money, 1000) * 999; addMoney(v); done('Money ×1000'); }),
        h('span', { class: 'dev-inline' }, [moneyInput, btn('Set', setMoney, 'Set Money to the typed amount')]),
      ]),
      group('👁 Attention & Clout', [
        btn('+1 h Attention', () => { addAttention(aps() * 3600); done('+' + Z.fmt.num(aps() * 3600) + ' Attention'); }),
        btn('Reach era goal', () => {
          const s = g().s, need = Z.prestige.requirement(s);
          if (s.run.attention < need) addAttention(need - s.run.attention);
          done('The next era is ready in 🌐 Eras.');
        }),
        btn('+100 Clout', () => { const s = g().s; s.clout += 100; s.cloutLifetime += 100; s.stats.cloutEarned += 100; done('+100 Clout'); }),
        btn('+10K Clout', () => { const s = g().s; s.clout += 1e4; s.cloutLifetime += 1e4; s.stats.cloutEarned += 1e4; done('+10K Clout'); }),
      ]),
      group('🌐 Eras', [
        btn('Next era now', () => { nextEra(false); done('Welcome to the ' + Z.era(g().s.era).name + '.'); syncSelects(); }, 'Starts the next era the normal way, with Clout'),
        h('span', { class: 'dev-inline' }, [eraSelect, btn('Set era', () => setEra(parseInt(eraSelect.value, 10)), 'Switch to the chosen era (forwards or backwards), starting it fresh')]),
      ]),
      group('🔁 Reboot', [
        btn('Reboot now', () => {
          const game = g(), s = game.s;
          if (s.era < Z.reboot.FIRST_ERA) { s.era = Z.reboot.FIRST_ERA; Z.prestige.resetRun(game); }
          const need = Z.prestige.requirement(s);
          if (s.run.attention < need) addAttention(need - s.run.attention);
          const got = Z.reboot.reboot(game, 'standard');
          ui.resetAll();
          syncSelects();
          done('Internet v' + Z.reboot.version(s) + ', +' + got + ' Bandwidth.');
        }, 'Reboots the internet right away (jumps to the Post-Internet Era goal first if needed)'),
        btn('+10 Bandwidth', () => { const r = g().s.reboot; r.bandwidth += 10; r.lifetime += 10; done('+10 Bandwidth'); }),
        btn('+100 Bandwidth', () => { const r = g().s.reboot; r.bandwidth += 100; r.lifetime += 100; done('+100 Bandwidth'); }),
        btn('Clear reboots', () => {
          g().s.reboot = { count: 0, bandwidth: 0, lifetime: 0, upgrades: {}, protocol: 'standard', hard: 0 };
          done('Back to Internet v1 with no Bandwidth.');
        }, 'Removes reboots, Bandwidth and its upgrades (the era stays)'),
      ]),
      group('💻 Operating system', [
        h('span', { class: 'dev-inline' }, [osSelect, btn('Set OS', () => setOS(osSelect.value), 'Switch to the chosen operating system, newer or older')]),
      ]),
      group('🏗️ Shop', [
        btn('+10 of everything', () => addBuildings(10)),
        btn('+100 of everything', () => addBuildings(100)),
        btn('Free upgrades', freeUpgrades, 'Owns every upgrade that is available right now'),
      ]),
      group('🎨 Looks & unlocks', [
        btn('Unlock all themes', unlockThemes),
        btn('Reveal all UI', revealAll),
        btn('All achievements', unlockAchievements),
      ]),
      group('🎯 Era features', [
        btn('Trigger era mechanic', () => {
          const s = g().s;
          s.run.time = Math.max(s.run.time, 45);
          s.flags.reveal.chaos = s.flags.reveal.stability = true;
          s.mech.t = 0;
          if (s.mech.q) s.mech.q.time = 0.5;
          g().tick(0.5);
          done('Era mechanic: ' + Z.mech.kind(s) + '.');
        }, 'Starts this era’s mechanic right now (flame war, trend, AI claim, bots, quarter end)'),
        btn('Complete challenges', () => {
          const s = g().s;
          for (const c of Z.challengesFor(s.era)) { s.challenges.run[c.id] = true; if (!s.challenges.done[c.id]) s.challenges.done[c.id] = Date.now(); }
          done('All three challenges of this era are complete.');
        }),
        btn('New daily challenge', () => {
          const s = g().s, d = new Date(Date.now() + Math.floor(Math.random() * 3650) * 86400000);
          s.flags.reveal.daily = true;
          Z.meta.ensureDaily(s, Z.meta.dayKey(d));
          done('Daily challenge: ' + Z.DAILY_MOD[s.daily.mod].name + '.');
        }, 'Rolls a random daily challenge (as if it were another day)'),
        btn('Finish daily goal', () => {
          const s = g().s, goal = Z.DAILY_GOAL[s.daily.goal];
          if (goal) { s.daily.base = (s.stats[goal.stat] || 0) - goal.need; Z.meta.checkDaily(g()); }
          done('Daily goal checked.');
        }),
      ]),
      group('⏩ Time & site', [
        btn('+10 min', () => fastForward(600)),
        btn('+1 hour', () => fastForward(3600)),
        btn('Fix site', () => { const s = g().s; s.res.chaos = 0; s.res.stability = 100; s.meltdown = 0; done('Chaos 0%, Stability 100%.'); }),
        btn('Meltdown', () => { g().s.res.stability = 0; done('Stability set to 0%.'); }),
      ]),
    ]);
    document.body.appendChild(root);
  }

  function refreshInfo() {
    if (!info || root.hidden) return;
    const game = g(), s = game.s, f = Z.fmt;
    info.textContent = Z.era(s.era).name + ' · ' + f.money(s.res.money) + ' (' + f.money(game.c.mps) + '/s) · '
      + f.num(s.run.attention) + ' / ' + f.num(Z.prestige.requirement(s)) + ' Attention · ' + Z.fmt.int(s.clout) + ' Clout · '
      + Z.opsys.current(s).name + ' · v' + Z.reboot.version(s) + ' · ' + f.int(s.reboot.bandwidth) + ' Bandwidth';
  }

  function toggle() {
    if (!Z.game) return;
    if (!root) build();
    root.hidden = !root.hidden;
    clearInterval(timer);
    if (!root.hidden) { syncSelects(); refreshInfo(); timer = setInterval(refreshInfo, 500); }
  }

  document.addEventListener('keydown', e => {
    const combo = e.key === 'F8' || (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd'));
    if (combo) { e.preventDefault(); toggle(); }
    else if (e.key === 'Escape' && root && !root.hidden) toggle();
  });

  ui.dev = { toggle, parseAmount };
})(window.ICHAOS = window.ICHAOS || {});
