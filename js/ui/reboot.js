/* The 🔁 Reboot the Internet window, its card in the Eras window and the reboot screen.
   Rules: js/systems/reboot.js, content: js/content/reboot.js. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden } = ui;
  let game = null;
  let nextProtocol = 'standard';

  const KEEP = ['Bandwidth and its upgrades', 'Your operating system and Style Shop themes (each system’s bonuses return in its era)', 'Achievements', 'Era records and completed challenges',
    'Your daily streak, statistics and settings'];
  const LOSE = ['Your Internet Era (back to the Forum Era)', 'Clout and its permanent Attention bonus', 'Clout perks', 'Everything an era resets'];

  function effectsText(p) { return p.effects.length ? p.effects.map(Z.mods.describe).join(', ') : 'No changes'; }

  /** Why rebooting is not possible yet, or '' when it is. */
  function lockedReason(s) {
    if (s.era < Z.reboot.FIRST_ERA) return 'Reach the goal of the ' + Z.era(Z.reboot.FIRST_ERA).name + ' to reboot the internet. You are in the ' + Z.era(s.era).name + '.';
    if (!Z.prestige.canPrestige(s)) return 'Reach this era’s goal first: ' + Z.fmt.int(s.run.attention) + ' / ' + Z.fmt.int(Z.prestige.requirement(s)) + ' Attention.';
    return '';
  }

  /* ---------- The window ---------- */

  function open() {
    const g = game, s = g.s, f = Z.fmt;
    if (!Z.reboot.visible(s)) return;
    if (!Z.PROTOCOL[nextProtocol]) nextProtocol = 'standard';
    const refs = { ups: [], protos: [] };

    refs.version = h('b', { class: 'reboot-version' });
    refs.summary = h('span', { class: 'reboot-summary' });
    const hero = h('section', { class: 'reboot-hero' }, [
      h('span', { class: 'reboot-hero-icon', 'aria-hidden': 'true', text: '🔁' }),
      h('div', {}, [refs.version, refs.summary]),
    ]);

    refs.status = h('p', { class: 'reboot-status' });
    refs.current = h('p', { class: 'reboot-current' });
    refs.go = h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': true, text: '🔁 Reboot the Internet' });
    refs.go.addEventListener('click', confirmReboot);

    const protoGrid = h('div', { class: 'perk-grid proto-grid', role: 'radiogroup', 'aria-label': 'Protocol for the next internet' });
    for (const p of Z.PROTOCOLS) {
      const btn = h('button', { type: 'button', class: 'perk proto', role: 'radio' }, [
        h('span', { class: 'perk-icon', 'aria-hidden': 'true', text: p.icon }),
        h('span', { class: 'perk-main' }, [
          h('span', { class: 'perk-name', text: p.name }),
          h('span', { class: 'perk-desc', text: p.desc }),
          h('span', { class: 'perk-level', text: effectsText(p) }),
        ]),
        h('span', { class: 'perk-cost proto-reward', text: p.reward > 1 ? '📡 ×' + p.reward : '📡 ×1' }),
      ]);
      btn.addEventListener('click', () => { nextProtocol = p.id; Z.audio.play('click'); refresh(); });
      protoGrid.appendChild(btn);
      refs.protos.push({ p, btn });
    }

    const box = h('section', { class: 'prestige-box reboot-box' }, [
      refs.status,
      refs.current,
      h('div', { class: 'reboot-cols' }, [
        h('div', {}, [h('h4', { text: '✅ You keep' }), h('ul', {}, KEEP.map(t => h('li', { text: t })))]),
        h('div', {}, [h('h4', { text: '♻️ You lose' }), h('ul', {}, LOSE.map(t => h('li', { text: t })))]),
      ]),
      h('h4', { text: 'Protocol for the next internet' }),
      h('p', { class: 'perk-intro', text: 'Optional. A harder internet pays more Bandwidth when you reboot it.' }),
      protoGrid,
      refs.go,
    ]);

    refs.balance = h('span', { class: 'clout-balance bw-balance' });
    const grid = h('div', { class: 'perk-grid' });
    for (const u of Z.REBOOT_UPGRADES) {
      const lvl = h('span', { class: 'perk-level' });
      const cost = h('span', { class: 'perk-cost' });
      const btn = h('button', { type: 'button', class: 'perk bw-upgrade' }, [
        h('span', { class: 'perk-icon', 'aria-hidden': 'true', text: u.icon }),
        h('span', { class: 'perk-main' }, [h('span', { class: 'perk-name', text: u.name }), lvl, h('span', { class: 'perk-desc', text: u.desc })]),
        cost,
      ]);
      btn.addEventListener('click', () => {
        if (Z.reboot.buy(game, u.id)) {
          Z.audio.play('upgrade');
          ui.panels.resetAutomation();
          ui.requestRender(true);
          Z.save.write(game.s);
          refresh();
        } else Z.audio.play('deny');
      });
      grid.appendChild(btn);
      refs.ups.push({ u, btn, lvl, cost });
    }
    const shop = h('section', { class: 'perk-section' }, [
      h('div', { class: 'perk-head' }, [h('h3', { text: 'Bandwidth Upgrades' }), refs.balance]),
      h('p', { class: 'perk-intro', text: 'Permanent upgrades that survive every reboot, so every new internet goes faster than the last.' }),
      grid,
    ]);

    refs.best = h('p', { class: 'muted reboot-best' });
    const body = h('div', { class: 'reboot' }, [hero, box, shop, refs.best]);

    function refresh() {
      const r = s.reboot, can = Z.reboot.canReboot(s), cur = Z.reboot.protocol(s);
      setText(refs.version, 'Internet v' + Z.reboot.version(s));
      setText(refs.summary, r.count ? r.count + ' reboot' + (r.count === 1 ? '' : 's') + ' so far · 📡 ' + f.int(r.lifetime) + ' Bandwidth earned in total'
        : 'The first internet. Finish it to reboot into v2.');
      setText(refs.status, can ? 'Rebooting now earns 📡 ' + f.int(Z.reboot.gain(s)) + ' Bandwidth and starts Internet v' + (Z.reboot.version(s) + 1) + ' in the Forum Era.'
        : lockedReason(s));
      refs.status.classList.toggle('ready', can);
      setText(refs.current, cur.id === 'standard' ? '' : 'This internet runs on ' + cur.icon + ' ' + cur.name + ' (' + effectsText(cur) + '). Rebooting from it pays Bandwidth ×' + cur.reward + '.');
      setHidden(refs.current, cur.id === 'standard');
      refs.go.disabled = !can;
      for (const x of refs.protos) {
        const on = x.p.id === nextProtocol;
        x.btn.classList.toggle('on', on);
        x.btn.setAttribute('aria-checked', on ? 'true' : 'false');
      }
      setText(refs.balance, '📡 ' + f.int(r.bandwidth) + ' Bandwidth to spend');
      for (const x of refs.ups) {
        const level = Z.reboot.level(s, x.u.id), maxed = level >= x.u.max, price = Z.reboot.upgradeCost(x.u, level);
        setText(x.lvl, x.u.max === 1 ? (level ? 'Owned' : 'Not owned') : 'Level ' + level + ' / ' + x.u.max);
        setText(x.cost, maxed ? 'MAX' : '📡 ' + f.int(price));
        x.btn.classList.toggle('can', !maxed && r.bandwidth >= price);
        x.btn.classList.toggle('maxed', maxed);
        x.btn.disabled = maxed;
      }
      const best = Z.reboot.fastestInternet(s);
      setText(refs.best, best ? '🏎️ Fastest full internet (all seven eras): ' + f.time(best.time) + ' on v' + best.v + '.' : 'Finish all seven eras of one internet to set a record for the fastest internet.');
    }

    refresh();
    ui.modal.open({ id: 'reboot', title: '🔁 Reboot the Internet', body, wide: true, refresh });
  }

  async function confirmReboot() {
    const g = game, s = g.s;
    if (!Z.reboot.canReboot(s)) return;
    const gain = Z.reboot.gain(s), proto = Z.PROTOCOL[nextProtocol] || Z.PROTOCOLS[0];
    const v = Z.reboot.version(s) + 1;
    const ok = await ui.confirm({
      title: 'Reboot the internet?',
      text: 'You go back to the Forum Era on Internet v' + v + (proto.id === 'standard' ? '' : ' (' + proto.name + ')') + ' with 📡 ' + Z.fmt.int(gain)
        + ' Bandwidth. Clout, lifetime Clout and Clout perks reset. Your Bandwidth upgrades, operating system, achievements and records stay.',
      confirmLabel: '🔁 Reboot',
    });
    if (!ok) { open(); return; }
    const got = Z.reboot.reboot(g, proto.id);
    nextProtocol = 'standard';
    Z.audio.play('prestige');
    ui.resetAll();
    bootScreen(v);
    ui.feed.add(g, '🔁', 'Internet v' + v + ' is online. You brought 📡 ' + Z.fmt.int(got) + ' Bandwidth with you.', 'era');
    ui.toast({ icon: '🔁', title: 'Internet v' + v + ' is online', text: '+' + Z.fmt.int(got) + ' Bandwidth. Spend it on upgrades in 🔁 Reboot.', kind: 'era', duration: 8000 });
    Z.save.write(g.s);
  }

  /* ---------- The reboot screen ---------- */

  function bootScreen(v) {
    const quiet = game.s.settings.reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const lines = ['INTERNET CHAOS BIOS v' + v + '.0', 'Checking memory… 640K should be enough for anybody', 'Deleting the old internet… OK',
      'Keeping your Bandwidth upgrades… OK', 'Starting the Forum Era…'];
    const screen = h('div', { class: 'reboot-screen' + (quiet ? ' quiet' : ''), 'aria-hidden': 'true' },
      lines.map((t, i) => h('p', { style: '--i:' + i, text: t })));
    document.body.appendChild(screen);
    setTimeout(() => screen.classList.add('out'), quiet ? 600 : 2400);
    setTimeout(() => screen.remove(), quiet ? 1000 : 2900);
  }

  /* ---------- Card in the Eras window ---------- */

  function erasCard(g) {
    const s = g.s;
    const text = h('span', { class: 'reboot-card-text' });
    const btn = h('button', { type: 'button', class: 'btn', text: '🔁 Open Reboot' });
    btn.addEventListener('click', open);
    const el = h('section', { class: 'reboot-card' }, [h('span', { class: 'reboot-card-icon', 'aria-hidden': 'true', text: '🔁' }), text, btn]);
    function refresh() {
      setHidden(el, !Z.reboot.visible(s));
      if (Z.reboot.canReboot(s)) setText(text, 'You can reboot the internet now for 📡 ' + Z.fmt.int(Z.reboot.gain(s)) + ' Bandwidth, or keep going for more.');
      else if (s.era < Z.reboot.FIRST_ERA) setText(text, 'After the ' + Z.era(Z.reboot.FIRST_ERA).name + ' you can reboot the whole internet for Bandwidth: permanent upgrades that survive everything.');
      else setText(text, 'Reach this era’s goal to reboot the internet. 📡 ' + Z.fmt.int(s.reboot.bandwidth) + ' Bandwidth to spend.');
      el.classList.toggle('ready', Z.reboot.canReboot(s));
    }
    refresh();
    return { el, refresh };
  }

  /* ---------- Loop ---------- */

  function render(g) {
    const s = g.s, btn = $('btn-reboot');
    setHidden(btn, !Z.reboot.visible(s));
    btn.classList.toggle('ready', Z.reboot.canReboot(s));
  }

  /** For the active-effects strip: the protocol this internet runs on. */
  function protocolChip(s) {
    const p = Z.reboot.protocol(s);
    if (p.id === 'standard') return null;
    return { id: 'protocol', icon: p.icon, name: 'Protocol: ' + p.name, kind: 'bad', title: effectsText(p), protocol: true };
  }

  function init(g) {
    game = g;
    $('btn-reboot').addEventListener('click', open);
    render(g);
  }

  ui.reboot = { init, open, render, erasCard, protocolChip };
})(window.ICHAOS = window.ICHAOS || {});
