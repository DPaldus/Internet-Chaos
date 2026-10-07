/* Operating System Upgrade, on screen: the update window, the full-screen install
   sequence (Windows 8 first-run screens for ChaosOS 8, a "hello" welcome for Mango OS),
   the Update button, the navigation rail of the newer systems and the Mango OS menu bar.
   The rules live in js/systems/os.js, the texts in Z.OSES (config.js). */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden } = ui;
  let game = null;
  let installing = false;

  function reducedMotion() {
    return !!game.s.settings.reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function logProgress(v, target) {
    if (v <= 1) return 0;
    return Math.min(1, Math.log(v) / Math.log(target));
  }

  /* ---------- The update window ---------- */

  /** A tiny drawing of each OS: glossy glass for Aero, flat tiles for Metro, liquid glass for Mango. */
  function shot(os) {
    return h('div', { class: 'os-shot os-shot-' + os.id, 'aria-hidden': 'true' }, [h('i'), h('i'), h('i'), h('i'), h('i'), h('i')]);
  }

  function card(os, label) {
    return h('div', { class: 'os-card os-card-' + os.id }, [
      shot(os),
      h('div', { class: 'os-card-main' }, [
        h('span', { class: 'os-card-label', text: label }),
        h('b', { class: 'os-card-name', text: os.name + ' ' + os.edition }),
        h('span', { class: 'os-card-look', text: os.look }),
      ]),
    ]);
  }

  function features(os) {
    return h('ul', { class: 'os-feats' }, os.effects.map((e, i) => h('li', { class: 'os-feat' }, [
      h('span', { class: 'os-feat-icon', 'aria-hidden': 'true', text: os.features[i][0] }),
      h('span', { class: 'os-feat-main' }, [h('b', { text: os.features[i][1] }), h('span', { text: Z.mods.describe(e) })]),
    ])));
  }

  function themeCount(osId) {
    let total = 0, locked = 0, owned = 0;
    for (const cat of Z.COSMETICS.setFor(osId)) {
      for (const item of cat.items) {
        total++;
        if (item.req) { locked++; if (game.s.cosmetics.unlocked[cat.id + ':' + item.id]) owned++; }
      }
    }
    return { total, locked, owned };
  }

  function open() {
    if (installing) return;
    const s = game.s, f = Z.fmt;
    const cur = Z.opsys.current(s), next = Z.opsys.next(s);
    const body = h('div', { class: 'os-window' });
    let refresh = null;

    if (next) {
      const themes = themeCount(next.id);
      const eraMark = h('span', { class: 'os-req-mark', 'aria-hidden': 'true' });
      const eraRow = h('li', { class: 'os-req-row' }, [eraMark, 'Reach the ' + Z.era(next.era).name]);
      const nums = h('span', { class: 'goal-nums' });
      const fill = h('span', { class: 'goal-fill' });
      const moneyRow = h('li', { class: 'os-req-row os-req-money' }, [
        h('span', { class: 'os-req-mark', 'aria-hidden': 'true', text: '💵' }),
        h('div', { class: 'goal' }, [
          h('div', { class: 'goal-line' }, [h('span', { class: 'goal-name', text: 'Money' }), nums]),
          h('div', { class: 'goal-bar' }, [fill]),
        ]),
      ]);
      const go = h('button', { type: 'button', class: 'btn btn-primary btn-big os-go', 'data-autofocus': true, onclick: confirmInstall });
      const change = (icon, text) => h('li', {}, [h('span', { class: 'os-change-icon', 'aria-hidden': 'true', text: icon }), h('span', { text })]);

      body.append(
        h('div', { class: 'os-compare' }, [card(cur, 'Your website runs'), h('span', { class: 'os-arrow', 'aria-hidden': 'true', text: '→' }), card(next, 'Upgrade available')]),
        h('p', { class: 'os-pitch', text: next.pitch }),
        h('section', { class: 'os-section' }, [
          h('h3', { text: 'What you get' }),
          h('p', { class: 'os-note', text: 'Permanent bonuses, on top of the ones you already have. ' + next.name + ' stays installed through every Internet Era.' }),
          features(next),
        ]),
        h('section', { class: 'os-section' }, [
          h('h3', { text: 'What changes' }),
          h('ul', { class: 'os-changes' }, [
            change('🎨', next.newLook),
            change('🎵', next.newMusic),
            change('🔄', 'A fresh Style Shop. Your ' + cur.edition + ' themes stay behind with ' + cur.name + '. '
              + next.name + ' has ' + themes.total + ' themes of its own: ' + (themes.total - themes.locked) + ' free, ' + themes.locked + ' to unlock through new milestones.'),
            change('✅', 'Everything else stays: buildings, upgrades, Clout, perks, achievements and statistics.'),
          ]),
        ]),
        h('section', { class: 'os-section os-req' }, [h('h3', { text: 'Requirements' }), h('ul', { class: 'os-req-list' }, [eraRow, moneyRow])]),
        go,
      );

      refresh = () => {
        const eraOk = Z.opsys.available(s, next), can = Z.opsys.canInstall(s);
        setText(eraMark, eraOk ? '✅' : '🔒');
        eraRow.classList.toggle('is-done', eraOk);
        moneyRow.classList.toggle('is-done', s.res.money >= next.cost);
        setText(nums, f.money(s.res.money) + ' / ' + f.money(next.cost));
        fill.style.width = (s.res.money >= next.cost ? 100 : logProgress(s.res.money, next.cost) * 100).toFixed(1) + '%';
        moneyRow.querySelector('.goal').classList.toggle('ready', s.res.money >= next.cost);
        go.disabled = !can;
        setText(go, can ? 'Install ' + next.name + ' · ' + f.money(next.cost)
          : !eraOk ? 'Available in the ' + Z.era(next.era).name
            : 'Save up ' + f.money(next.cost - s.res.money) + ' more');
      };
    } else {
      const styleLine = h('p', { class: 'os-note' });
      body.append(
        card(cur, 'Your website runs'),
        h('p', { class: 'os-uptodate', text: '✅ You’re up to date. ' + cur.name + ' was installed on ' + new Date(s.os.installed || Date.now()).toLocaleDateString() + '.' }),
        h('section', { class: 'os-section' }, [h('h3', { text: 'Active bonuses' }), h('p', { class: 'os-note', text: 'Permanent, through every Internet Era. Every system you installed keeps its bonuses.' })]
          .concat(Z.OSES.slice(1, Z.OSES.indexOf(cur) + 1).reverse().map(os => h('div', { class: 'os-stack' }, [h('b', { class: 'os-stack-name', text: os.icon + ' ' + os.name + ' ' + os.edition }), features(os)])))),
        h('section', { class: 'os-section' }, [h('h3', { text: 'Style Shop' }), styleLine,
          h('button', { type: 'button', class: 'btn', text: '🎨 Open the Style Shop', onclick: () => ui.styleShop.open() })]),
      );
      refresh = () => {
        const t = themeCount(cur.id);
        setText(styleLine, t.owned + ' of ' + t.locked + ' ' + cur.name + ' themes unlocked' + (t.owned >= t.locked ? '. You have them all!' : '. Milestones on ' + cur.name + ' unlock the rest.'));
      };
    }

    refresh();
    ui.modal.open({ id: 'os', title: next ? (next.icon + ' Operating System Upgrade') : (cur.icon + ' System'), body, wide: true, className: 'modal-os', refresh });
  }

  async function confirmInstall() {
    const s = game.s, f = Z.fmt;
    const cur = Z.opsys.current(s), next = Z.opsys.next(s);
    if (!Z.opsys.canInstall(s)) return;
    const ok = await ui.confirm({
      title: 'Install ' + next.name + '?',
      text: 'This costs ' + f.money(next.cost) + '. Your website gets faster and its new bonuses last forever. '
        + 'Your ' + cur.edition + ' themes stay behind: the Style Shop starts over with ' + next.name + ' themes.',
      confirmLabel: 'Install now',
    });
    if (!ok) { open(); return; }
    const os = Z.opsys.install(game);
    if (!os) { open(); return; }
    Z.save.write(game.s);
    setup(os, cur);
  }

  /* ---------- The install screen ---------- */

  function setup(os, prev) {
    installing = true;
    ui.layout.closeMenu();
    ui.holdToasts(true);
    Z.music.hold(true, 1.5);
    const reduce = reducedMotion();
    const line = h('p', { class: 'os-setup-line' });
    const small = h('p', { class: 'os-setup-small' });
    const fill = h('i');
    const root = h('div', { class: 'os-setup os-setup-' + os.id, role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Installing ' + os.name, tabindex: '-1' }, [
      h('div', { class: 'os-setup-inner' }, [
        h('span', { class: 'os-setup-logo', 'aria-hidden': 'true', text: os.icon }),
        line,
        h('div', { class: 'os-ring', 'aria-hidden': 'true' }, [h('i'), h('i'), h('i'), h('i'), h('i')]),
        h('div', { class: 'os-progress', 'aria-hidden': 'true' }, [fill]),
        small,
      ]),
      h('p', { class: 'os-setup-skip', text: 'Click to skip' }),
    ]);
    document.body.appendChild(root);
    root.focus();

    const lines = os.setup.map(t => t.replace('{site}', Z.siteName(game.s)).replace('{os}', os.name).replace('{prev}', prev.edition));
    const STEP = 1400, total = STEP * (lines.length - 1) + 900, began = Date.now();
    let shown = -1, done = false;

    const show = k => {
      if (k === shown) return;
      shown = k;
      line.classList.remove('is-in');
      void line.offsetWidth;
      line.textContent = lines[k];
      line.classList.toggle('is-first', k === 0);
      line.classList.add('is-in');
    };
    const progress = () => {
      const pct = done ? 100 : Math.min(99, Math.floor((Date.now() - began) / total * 100));
      small.textContent = 'Installing ' + os.name + ' · ' + pct + '%';
      fill.style.width = pct + '%';
    };
    show(0);
    progress();
    const ticker = setInterval(() => {
      progress();
      const k = Math.min(lines.length - 1, Math.floor((Date.now() - began) / STEP));
      show(k);
      if (Date.now() - began >= total) finish();
    }, 100);

    const skip = () => {
      if (done || Date.now() - began < 1200) return;
      show(lines.length - 1);
      setTimeout(finish, 700);
    };
    root.addEventListener('click', skip);
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); skip(); }
    });

    function finish() {
      if (done) return;
      done = true;
      clearInterval(ticker);
      progress();
      sync();
      ui.site.refreshLook();
      ui.requestRender(true);
      Z.audio.play({ mango: 'chime', holo: 'holoStart', retro: 'retroStart' }[os.id] || 'startup');
      Z.music.hold(false);
      root.classList.add('is-done');
      ui.feed.add(game, os.icon, 'Your website now runs ' + os.name + ' ' + os.edition + '. ' + os.feed + ' The '
        + prev.edition + ' themes are in a box in the attic.', 'era');
      setTimeout(() => {
        root.remove();
        installing = false;
        ui.holdToasts(false);
        ui.toast({ icon: os.icon, title: 'Welcome to ' + os.name + ' ' + os.edition,
          text: os.effects.slice(0, 3).map(Z.mods.describe).join(', ') + ' and more. New themes are waiting in the Style Shop.', kind: 'era', duration: 8000 });
        Z.save.write(game.s);
      }, reduce ? 60 : 900);
    }
  }

  /* ---------- Navigation rail (ChaosOS 8 and later) ---------- */

  let railItems = [];

  function buildRail() {
    const rail = $('metro-rail');
    if (!rail || railItems.length) return;
    const add = (id, icon, label, onclick) => {
      const name = h('span', { class: 'rail-label', text: label });
      const btn = h('button', { type: 'button', class: 'rail-item', 'data-id': id, title: label }, [h('span', { class: 'rail-icon', 'aria-hidden': 'true', text: icon }), name]);
      btn.addEventListener('click', onclick);
      rail.appendChild(btn);
      railItems.push({ id, btn, name });
    };
    const jump = sel => {
      const el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    add('site', '🏠', 'Website', () => jump('.col-site'));
    for (const cat of Z.CATS) add('cat:' + cat.id, cat.icon, cat.name, () => { ui.shop.selectTab(cat.id); jump('.col-shop'); });
    add('eras', '🌐', 'Eras', () => ui.modals.openEras());
    add('style', '🎨', 'Style', () => ui.styleShop.open());
    add('stats', '📊', 'Statistics', () => ui.modals.openStats());
    add('settings', '⚙️', 'Settings', () => ui.modals.openSettings());
  }

  function renderRail(s) {
    const rail = $('metro-rail');
    if (!rail) return;
    const on = s.os.id !== Z.OSES[0].id;
    setHidden(rail, !on);
    if (!on) return;
    const shopTab = ui.shop.current();
    for (const it of railItems) {
      let hidden = false, on = false;
      if (it.id.indexOf('cat:') === 0) {
        const cat = it.id.slice(4);
        const tab = document.querySelector('#shop-tabs .tab[data-cat="' + cat + '"]');
        hidden = !!tab && tab.hidden;
        on = shopTab === cat;
      } else if (it.id === 'eras') hidden = !s.flags.reveal.eras;
      else if (it.id === 'style') hidden = !s.flags.reveal.style;
      setHidden(it.btn, hidden);
      it.btn.classList.toggle('is-on', on);
    }
  }

  /* ---------- Mango OS menu bar ---------- */

  let clockText = '';

  function buildMenuBar() {
    // Each menu name opens the window it would hold in a real menu bar.
    const click = id => () => { const b = $(id); if (b) b.click(); };
    const items = [
      ['mb-file', click('btn-settings')], ['mb-edit', click('btn-style')], ['mb-view', click('btn-stats')],
      ['mb-window', click('btn-eras')], ['mb-help', click('btn-help')], ['mb-os', () => open()],
    ];
    for (const [id, fn] of items) { const b = $(id); if (b) b.addEventListener('click', fn); }
  }

  function renderMenuBar(s) {
    const bar = $('mango-bar');
    if (!bar) return;
    const on = s.os.id === 'mango';
    setHidden(bar, !on);
    if (!on) return;
    setHidden($('mb-edit'), !s.flags.reveal.style);
    setHidden($('mb-window'), !s.flags.reveal.eras);
    const now = new Date();
    const text = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' '
      + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (text !== clockText) { clockText = text; setText($('mb-clock'), text); }
  }

  /* ---------- ChaosOS 95 taskbar and Start menu ---------- */

  let tbClock = '';

  function buildTaskbar() {
    const bar = $('retro-taskbar');
    if (!bar) return;
    const start = $('tb-start'), menu = $('tb-menu');
    const items = [
      ['🌐', 'Internet Eras', 'btn-eras'], ['🎨', 'Style Shop', 'btn-style'], ['📅', 'Daily Challenge', 'btn-daily'],
      ['🏆', 'Achievements', 'btn-ach'], ['📊', 'Statistics', 'btn-stats'], ['🏁', 'Era Records', 'btn-records'],
      ['📸', 'Share Website', 'btn-share'], ['⚙️', 'Settings', 'btn-settings'], ['❔', 'Help', 'btn-help'], ['📺', 'System', 'btn-system'],
    ];
    const setOpen = on => { setHidden(menu, !on); start.setAttribute('aria-expanded', on ? 'true' : 'false'); start.classList.toggle('is-down', on); };
    for (const [icon, label, target] of items) {
      const b = h('button', { type: 'button', class: 'tb-item', 'data-target': target }, [h('span', { class: 'tb-item-icon', 'aria-hidden': 'true', text: icon }), label]);
      b.addEventListener('click', () => { setOpen(false); const t = $(target); if (t) t.click(); });
      menu.appendChild(b);
    }
    start.addEventListener('click', e => { e.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setOpen(false); });
    $('tb-task').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));
    $('tb-sound').addEventListener('click', () => ui.setSound(!game.s.settings.sound));
  }

  function renderTaskbar(s) {
    const bar = $('retro-taskbar');
    if (!bar) return;
    const on = s.os.id === 'retro';
    setHidden(bar, !on);
    document.body.classList.toggle('has-taskbar', on);
    if (!on) return;
    for (const b of $('tb-menu').querySelectorAll('.tb-item')) {
      const t = $(b.dataset.target);
      setHidden(b, !t || t.hidden);
    }
    setText($('tb-sound'), s.settings.sound ? '🔊' : '🔇');
    const text = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (text !== tbClock) { tbClock = text; setText($('tb-clock'), text); }
  }

  /* ---------- A newer OS becomes available ---------- */

  /** The first offer comes with the 'os' reveal tip (main.js); later ones get their own toast. */
  function announce(s) {
    const next = Z.opsys.next(s);
    if (!next || !s.flags.reveal.os || !Z.opsys.available(s, next) || s.flags.osOffer === next.id) return;
    const first = !s.flags.osOffer && next === Z.OSES[1];
    s.flags.osOffer = next.id;
    if (first || installing) return;
    ui.toast({ icon: next.icon, title: next.name + ' is available', text: next.pitch + ' Open ' + next.icon + ' Update in the top bar.', kind: 'era', duration: 9000 });
  }

  /* ---------- Entry points ---------- */

  /** Brings the skin, the music and the rail in line with the installed OS. */
  function sync() {
    ui.styleShop.osChanged();
    Z.music.setStyle(game.s.os.id);
    render(game);
  }

  function render(g) {
    const s = g.s, next = Z.opsys.next(s), rev = !!s.flags.reveal.os;
    announce(s);
    setHidden($('btn-os'), !rev || !Z.opsys.available(s, next));
    if (next) setText($('os-icon'), next.icon);
    setText($('system-icon'), Z.opsys.current(s).icon);
    setHidden($('os-dot'), !Z.opsys.canInstall(s));
    setHidden($('btn-system'), !rev);
    setText($('os-name'), Z.opsys.current(s).name);
    renderRail(s);
    renderMenuBar(s);
    renderTaskbar(s);
  }

  function init(g) {
    game = g;
    buildRail();
    buildMenuBar();
    buildTaskbar();
    Z.music.setStyle(g.s.os.id);
    render(g);
  }

  ui.os = { init, open, render, sync, get installing() { return installing; } };
})(window.ICHAOS = window.ICHAOS || {});
