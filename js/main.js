/* Boot, game loop, autosave, and the wiring from game notifications to the feed,
   toasts and sounds. */
(function (Z) {
  'use strict';

  const ui = Z.ui, BAL = Z.BAL;
  const TICK_MS = 100;
  const MAX_ONLINE_GAP = 120;     // longer gaps (sleep, frozen tab) are simulated as offline time
  let g = null, lastTick = 0, autosave = 0;
  let renderQueued = false, lastFrame = 0, slowTimer = 0, forceSlow = false;

  /* ---------- Rendering ---------- */

  function frame(now) {
    renderQueued = false;
    const dt = Math.min(1, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    ui.hud.render(g);
    ui.site.render(g, dt);
    ui.panels.renderFast(g, dt);
    slowTimer += dt;
    if (slowTimer >= 0.25 || forceSlow) {
      slowTimer = 0;
      forceSlow = false;
      ui.shop.render(g);
      ui.panels.renderSlow(g);
      ui.os.render(g);
      ui.modal.refresh();
    }
  }

  ui.requestRender = function (force) {
    if (force) forceSlow = true;
    if (!renderQueued) { renderQueued = true; requestAnimationFrame(frame); }
  };

  ui.resetAll = function () {
    ui.shop.reset();
    ui.panels.reset();
    ui.site.refreshLook();
    ui.sponsors.reset();
    ui.feed.renderAll(g);
    ui.requestRender(true);
  };

  ui.setSound = function (on) {
    g.s.settings.sound = !!on;
    Z.audio.setEnabled(on);
    if (!on) g.s.flags.muted = true;
    const btn = ui.$('btn-sound');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? 'Sound on' : 'Sound off';
    ui.$('sound-icon').textContent = on ? '🔊' : '🔇';
  };

  ui.setMusic = function (on) {
    g.s.settings.music = !!on;
    Z.music.setEnabled(on);
    const btn = ui.$('btn-music');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? 'Music on' : 'Music off';
    ui.$('music-icon').textContent = on ? '🎵' : '🔇';
  };

  function applySettings() {
    const set = g.s.settings;
    Z.fmt.setNotation(set.notation);
    Z.audio.setVolume(set.volume);
    ui.setSound(set.sound);
    Z.music.setVolume(set.musicVolume);
    ui.setMusic(set.music);
    document.body.classList.toggle('reduce-motion', !!set.reduceMotion);
  }

  /** Swap in a different state (import or reset) without reloading the page. */
  ui.replaceState = function (state) {
    for (const k of Object.keys(g.s)) delete g.s[k];
    Object.assign(g.s, state);
    g.dirty = true;
    g.refresh();
    Z.econ.updateSeen(g);
    applySettings();
    ui.modal.close();
    ui.resetAll();
    Z.save.write(g.s);
    ui.styleShop.apply();
    ui.os.sync();
    if (!g.s.siteName) ui.modals.openSiteName({ first: true, onDone: ui.help.maybeTour });
    else ui.help.maybeTour();
  };

  /* ---------- Loop ---------- */

  function step() {
    const now = Date.now();
    let dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!(dt > 0)) return;
    autosave += dt;
    if (dt > MAX_ONLINE_GAP) {
      const sum = Z.offline.simulate(g, dt);
      if (dt >= 300) ui.modals.showOffline(sum);
    } else {
      while (dt > 0) {
        const d = Math.min(dt, 0.25);
        g.tick(d);
        dt -= d;
      }
    }
    if (autosave >= BAL.autosaveSeconds) { autosave = 0; Z.save.write(g.s); }
    ui.requestRender();
  }

  /* ---------- Notifications → feed, toasts, sounds ---------- */

  const REVEAL_TIPS = {
    chaos: ['🌀', 'Chaos detected', 'Messy content creates Chaos. Chaos multiplies your Attention and Money. Watch the bar at the top.'],
    stability: ['🛠️', 'Stability matters now', 'If Chaos rises above the Tolerance notch, Stability drains. At 0% your site melts down. Servers raise the notch; moderators lower Chaos.'],
    policy: ['📰', 'Editorial Policy unlocked', 'Set how wild your site is allowed to be. Wilder means more Chaos, and more risk.'],
    actions: ['⚡', 'Actions unlocked', 'One-click abilities with cooldowns. Use them to steer Chaos and Stability.'],
    upgrades: ['⬆️', 'Upgrades available', 'One-time boosts. They appear as you grow.'],
    eras: ['🌐', 'Internet Eras', 'Reach the era goal to start a new Internet Era with permanent Clout. Open Eras to see it.'],
    auto: ['🤖', 'Automation online', 'Parts of your empire now run themselves. Configure them in the Automation panel.'],
    analytics: ['📈', 'Analytics dashboard', 'Your site is big enough to need charts nobody reads.'],
    bulk: ['✖️', 'Bulk buying', 'Buy ×10, ×25 or Max at once with the buttons above the shop list.'],
    style: ['🎨', 'Style Shop unlocked', 'You can now unlock themes for your website. Open 🎨 Style in the top bar.'],
    os: ['🪟', 'Operating System Upgrade available', 'A new operating system can be installed: a faster site, permanent bonuses and a brand-new look. Open 🪟 Update in the top bar.'],
  };

  function wire() {
    const bus = Z.bus, feed = (icon, text, kind) => ui.feed.add(g, icon, text, kind);

    bus.on('event', ({ def, text, effText }) => {
      feed(def.icon, text + ' (' + effText + ')', def.kind);
      ui.toast({ icon: def.icon, title: def.title, text: effText, kind: def.kind });
      Z.audio.play(def.id === 'viral' ? 'viral' : def.kind === 'bad' ? 'bad' : 'good');
    });
    bus.on('choice', ({ def }) => {
      ui.panels.showChoice(g);
      Z.audio.play('popup');
      ui.requestRender(true);
      if (def) feed(def.icon, def.title + ': waiting for your answer…', 'info');
    });
    bus.on('choiceResolved', ({ def, choice, effText, auto }) => {
      ui.panels.closeChoice();
      feed(def.icon, def.title + ': "' + choice.label + '"' + (auto ? ' (automatic)' : '') + '. ' + effText + '.', choice.stance === 'bold' ? 'bad' : 'good');
      if (!auto) Z.audio.play('action');
    });
    bus.on('viralEnd', ({ gained }) => feed('🔥', 'The viral post cooled down. It brought in ' + Z.fmt.int(gained) + ' Attention.', 'good'));
    bus.on('meltdown', ({ duration }) => {
      feed('🔥', 'MELTDOWN. Stability hit 0% and the site is down for ' + Math.ceil(duration) + 's. Everyone left. Chaos reset to 0.', 'bad');
      ui.toast({ icon: '🔥', title: 'Total meltdown', text: 'Click the main button to reboot faster.', kind: 'bad' });
      Z.audio.play('meltdown');
      document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
    });
    bus.on('recovered', () => {
      feed('✅', 'The site is back online. Your server survived. Barely.', 'good');
      Z.audio.play('recovered');
    });
    bus.on('achievement', ({ ach }) => {
      feed('🏆', 'Achievement unlocked: ' + ach.name + '. ' + ach.desc, 'achieve');
      ui.toast({ icon: ach.icon, title: 'Achievement: ' + ach.name, text: ach.desc + ' (+1% Attention)', kind: 'achieve' });
      Z.audio.play('achievement');
    });
    bus.on('unlock', ({ building }) => {
      feed(building.icon, 'New in the shop: ' + building.name + '. ' + building.flavor, 'info');
      ui.toast({ icon: building.icon, title: 'New: ' + building.name, text: Z.CAT[building.cat].name + ' · ' + building.flavor, kind: 'info' });
    });
    bus.on('trend', ({ building, mult }) => {
      feed('#️⃣', building.plural + ' are trending! Their output is ×' + mult + ' for a while.', 'good');
      Z.audio.play('good');
    });
    bus.on('action', ({ action, auto }) => {
      feed(action.icon, (auto ? 'Automation used ' : 'You used ') + action.name + '.', 'info');
    });
    bus.on('policyAuto', ({ policy }) => feed('🎚️', 'Risk Manager switched the Editorial Policy to ' + policy.name + '.', 'info'));
    bus.on('reveal', ({ key }) => {
      const tip = REVEAL_TIPS[key];
      if (!tip) return;
      ui.toast({ icon: tip[0], title: tip[1], text: tip[2], kind: 'info', duration: 8000 });
      feed(tip[0], tip[1] + '. ' + tip[2], 'info');
      ui.requestRender(true);
    });
  }

  function wireNav() {
    ui.$('era-chip').addEventListener('click', ui.modals.openEras);
    ui.$('btn-eras').addEventListener('click', ui.modals.openEras);
    ui.$('btn-ach').addEventListener('click', ui.modals.openAchievements);
    ui.$('btn-stats').addEventListener('click', ui.modals.openStats);
    ui.$('btn-settings').addEventListener('click', ui.modals.openSettings);
    ui.$('btn-style').addEventListener('click', () => ui.styleShop.open());
    ui.$('btn-os').addEventListener('click', () => ui.os.open());
    ui.$('btn-system').addEventListener('click', () => ui.os.open());
    ui.$('btn-sound').addEventListener('click', () => { ui.setSound(!g.s.settings.sound); if (g.s.settings.sound) Z.audio.play('buy'); });
    ui.$('btn-music').addEventListener('click', () => ui.setMusic(!g.s.settings.music));
  }

  function saveNow() { if (g) Z.save.write(g.s); }

  /* ---------- Boot ---------- */

  function start() {
    const loaded = Z.save.load();
    const state = loaded.state || Z.state.create(Date.now());
    g = Z.game = Z.createGame(state);
    g.refresh();
    Z.econ.updateSeen(g);

    let summary = null;
    if (loaded.state) {
      const away = (Date.now() - state.lastSaved) / 1000;
      if (away >= BAL.offline.minSeconds) summary = Z.offline.simulate(g, away);
    }

    ui.hud.init();
    ui.site.init(g);
    ui.shop.init(g);
    ui.panels.init(g);
    ui.modals.init(g);
    ui.chat.init(g);
    ui.layout.init();
    ui.styleShop.init(g);
    ui.os.init(g);
    ui.sponsors.init(g);
    ui.help.init(g);
    ui.bonus.init(g);
    ui.backup.init(g);
    wire();
    wireNav();
    applySettings();
    ui.feed.renderAll(g);

    if (!loaded.state) {
      ui.feed.add(g, '🖥️', 'You made a website. It is beautiful. Nobody has seen it yet.', 'info');
    }
    if (loaded.error) ui.toast({ icon: '⚠️', title: 'Save problem', text: loaded.error, kind: 'bad', duration: 9000 });
    const offline = summary && summary.away >= 60 ? () => ui.modals.showOffline(summary) : null;
    if (!g.s.siteName) ui.modals.openSiteName({ first: true, onDone: offline || ui.help.maybeTour });
    else if (offline) offline();
    else ui.help.maybeTour();

    lastTick = Date.now();
    lastFrame = performance.now();
    setInterval(step, TICK_MS);
    window.addEventListener('beforeunload', saveNow);
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); else step(); });

    try {
      const hot = window.claude && window.claude.hot;
      if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => { saveNow(); return { savedAt: Date.now() }; });
    } catch (err) { /* only present inside the artifact viewer */ }

    ui.requestRender(true);
  }

  function boot() {
    let hot = null;
    try { hot = window.claude && window.claude.hot; } catch (err) { hot = null; }
    if (hot && typeof hot.ready === 'function') hot.ready(start);
    else start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.ICHAOS = window.ICHAOS || {});
