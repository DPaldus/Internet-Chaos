/* The shop: category tabs, building cards with live previews, and the upgrade grid. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden, setStyle } = ui;
  let game = null;
  let tab = 'traffic';
  let showAllUpgrades = false;
  let upgradeKey = '';
  const cards = Object.create(null);
  const tabEls = Object.create(null);
  let teasers = Object.create(null);
  const upgCards = [];

  function init(g) {
    game = g;
    const tabsRoot = $('shop-tabs');
    for (const cat of Z.CATS) {
      const btn = h('button', { type: 'button', class: 'tab', role: 'tab', 'data-cat': cat.id, 'aria-selected': 'false' }, [
        h('span', { class: 'tab-icon', 'aria-hidden': 'true', text: cat.icon }),
        h('span', { class: 'tab-name', text: cat.name }),
        h('span', { class: 'tab-dot', 'aria-hidden': 'true' }),
      ]);
      btn.addEventListener('click', () => selectTab(cat.id));
      tabsRoot.appendChild(btn);
      tabEls[cat.id] = btn;
    }

    const list = $('building-list');
    for (const b of Z.BUILDINGS) {
      const c = {
        root: h('button', { type: 'button', class: 'bcard', 'data-id': b.id, hidden: true }),
        icon: h('span', { class: 'bcard-icon', 'aria-hidden': 'true', text: b.icon }),
        name: h('span', { class: 'bcard-name', text: b.name }),
        badge: h('span', { class: 'bcard-badge', hidden: true, text: '#TRENDING' }),
        role: h('span', { class: 'bcard-role' }),
        preview: h('span', { class: 'bcard-preview' }),
        flavor: h('span', { class: 'bcard-flavor', text: b.flavor }),
        count: h('span', { class: 'bcard-count', text: '0' }),
        cost: h('span', { class: 'bcard-cost' }),
        qty: h('span', { class: 'bcard-qty' }),
        fill: h('span', { class: 'bcard-fill', 'aria-hidden': 'true' }),
      };
      c.root.append(
        c.fill, c.icon,
        h('span', { class: 'bcard-main' }, [h('span', { class: 'bcard-title' }, [c.name, c.badge]), c.role, c.preview, c.flavor]),
        h('span', { class: 'bcard-side' }, [c.count, c.cost, c.qty]),
      );
      c.root.addEventListener('click', () => buy(b.id, c.root));
      list.appendChild(c.root);
      cards[b.id] = c;
    }
    for (const cat of Z.CATS) {
      const t = h('div', { class: 'bcard bcard-locked', hidden: true }, [
        h('span', { class: 'bcard-icon', 'aria-hidden': 'true', text: '❔' }),
        h('span', { class: 'bcard-main' }, [h('span', { class: 'bcard-name', text: '???' }), h('span', { class: 'bcard-role teaser-text' })]),
      ]);
      list.appendChild(t);
      teasers[cat.id] = { root: t, text: t.querySelector('.teaser-text') };
    }

    $('buy-qty').addEventListener('click', e => {
      const q = e.target.closest('button');
      if (!q) return;
      game.s.settings.buyQty = q.dataset.qty;
      render(game, true);
    });
    $('upg-toggle').addEventListener('click', () => { showAllUpgrades = !showAllUpgrades; upgradeKey = ''; render(game, true); });
    selectTab('traffic');
  }

  function selectTab(id) {
    tab = id;
    for (const k in tabEls) {
      tabEls[k].classList.toggle('active', k === id);
      tabEls[k].setAttribute('aria-selected', k === id ? 'true' : 'false');
    }
    if (game) render(game, true);
  }

  function buy(id, node) {
    const g = game;
    g.refresh();
    const res = Z.econ.buyBuilding(g, id, g.s.settings.buyQty);
    if (res) {
      Z.audio.play('buy');
      node.classList.remove('bought'); void node.offsetWidth; node.classList.add('bought');
    } else {
      Z.audio.play('deny');
      node.classList.remove('denied'); void node.offsetWidth; node.classList.add('denied');
    }
    ui.requestRender(true);
  }

  function buyUpgrade(id, node) {
    const g = game;
    if (Z.econ.buyUpgrade(g, id)) {
      Z.audio.play('upgrade');
      const u = Z.U[id];
      ui.feed.add(g, ui.feedIcon(u.icon), 'Upgrade bought: ' + u.name + '. ' + u.effects.map(Z.mods.describe).join(', ') + '.', 'info');
      upgradeKey = '';
    } else {
      Z.audio.play('deny');
      node.classList.remove('denied'); void node.offsetWidth; node.classList.add('denied');
    }
    ui.requestRender(true);
  }

  /* ---------- Text helpers ---------- */

  function roleText(g, b) {
    const f = Z.fmt, m = g.m, c = g.c;
    const mult = (m.bMult[b.id] || 1) * (c.buff.b[b.id] || 1);
    if (b.cat === 'traffic') {
      const unit = b.aps * mult * Z.econ.synergyMult(g, b.id);
      // Chaos and server load mean nothing to a new player, so they appear once Chaos does.
      if (!g.s.flags.reveal.chaos) return f.rate(unit) + ' Attention/s each';
      const chaos = b.cp ? ' · Chaos +' + f.num(b.cp, { dec: 1 }) : ' · no Chaos';
      return f.rate(unit) + ' base Attention/s each' + chaos + ' · Load +' + b.load;
    }
    if (b.cat === 'money') return '+' + f.num(b.pct * mult * 100, { dec: 1 }) + '% Money per Attention each' + (b.cp && g.s.flags.reveal.chaos ? ' · Chaos +' + f.num(b.cp, { dec: 1 }) : '');
    if (b.cat === 'infra') return '+' + f.num(b.cap * mult * m.capacityMult) + ' capacity · repairs ' + f.num(b.regen * m.regenMult, { dec: 2 }) + '%/s each';
    return '+' + f.num(b.control * mult * m.controlMult) + ' Control each';
  }

  function previewText(g, b, qty) {
    const f = Z.fmt, c = g.c;
    const p = Z.econ.preview(g, b.id, qty);
    const owned = g.s.buildings[b.id] || 0;
    if (b.cat === 'traffic') {
      const share = c.rawAps > 0 && owned ? ' · ' + Math.round(c.bOut[b.id] / c.rawAps * 100) + '% of your Attention' : '';
      return 'Buy: +' + f.rate(p.aps) + ' Attention/s (+' + f.money(p.mps) + '/s)' + share;
    }
    if (b.cat === 'money') return 'Buy: +' + f.money(p.mps) + '/s at your current traffic';
    if (b.cat === 'infra') return 'Buy: Tolerance ' + c.tolerance.toFixed(1) + '% → ' + p.tolerance.toFixed(1) + '%';
    return 'Buy: Chaos target ' + c.target.toFixed(1) + '% → ' + p.target.toFixed(1) + '%';
  }

  function summaryText(g) {
    const f = Z.fmt, c = g.c;
    switch (tab) {
      case 'traffic': return 'Content makes ' + f.rate(c.rawAps) + ' base Attention/s → ×' + f.num(c.globalAtt, { dec: 2 }) + ' multipliers = ' + f.rate(c.aps) + '/s. Chaos pressure ' + f.num(c.pressure) + ' · Server load ' + f.num(c.load) + '.';
      case 'money': return 'Each Attention earns ' + f.money(c.yield) + ' (base $0.50, monetization +' + f.num(c.yieldBonus * 100) + '%, Chaos ' + f.mult(c.chaosYieldMult) + ').';
      case 'infra': return 'Capacity ' + f.num(c.capacity) + ' vs load ' + f.num(c.load) + ' → Tolerance ' + c.tolerance.toFixed(1) + '%. Stability repair ' + f.num(c.regen, { dec: 2 }) + '%/s.';
      default: return 'Control ' + f.num(c.control) + ' vs Chaos pressure ' + f.num(c.pressure) + ' → Chaos target ' + c.target.toFixed(1) + '%.' + (c.modShare > 0 && g.m.modPenalty > 0 ? ' Moderation costs ' + ((1 - c.modMult) * 100).toFixed(1) + '% Attention.' : '');
    }
  }

  /* ---------- Rendering ---------- */

  function renderBuildings(g) {
    const s = g.s, f = Z.fmt, qtyMode = s.settings.buyQty;
    const anyVisible = Object.create(null), anyAffordable = Object.create(null);

    for (const b of Z.BUILDINGS) {
      const c = cards[b.id];
      const visible = !!s.seen[b.id] && Z.econ.isAvailable(s, b.id);
      if (visible) anyVisible[b.cat] = true;
      const q = visible ? Z.econ.quote(g, b.id, qtyMode) : null;
      const can = visible && s.res.money >= q.cost;
      if (can) anyAffordable[b.cat] = true;
      const show = visible && b.cat === tab;
      setHidden(c.root, !show);
      if (!show) continue;
      setText(c.count, f.int(s.buildings[b.id] || 0));
      setText(c.cost, f.money(q.cost));
      setText(c.qty, q.qty > 1 || qtyMode !== '1' ? '×' + q.qty : '');
      setText(c.role, roleText(g, b));
      setText(c.preview, previewText(g, b, q.qty));
      c.root.classList.toggle('can', can);
      c.root.setAttribute('aria-label', 'Buy ' + q.qty + ' ' + (q.qty === 1 ? b.name : b.plural) + ' for ' + f.money(q.cost));
      setStyle(c.fill, 'width', (can ? 100 : Math.min(100, s.res.money / q.cost * 100)).toFixed(1) + '%');
      const trending = g.c.trendId === b.id;
      setHidden(c.badge, !trending);
      c.root.classList.toggle('trending', trending);
    }

    // Teaser for the next undiscovered building in this tab, or the next era's building.
    for (const cat of Z.CATS) {
      const t = teasers[cat.id];
      let text = null;
      if (cat.id === tab) {
        const next = Z.BUILDINGS.find(b => b.cat === cat.id && !s.seen[b.id] && Z.econ.isAvailable(s, b.id));
        if (next) {
          text = (cat.id === 'infra' || cat.id === 'mod') && !s.flags.reveal.chaos
            ? 'Unlocks once your site starts generating Chaos.'
            : 'Earn ' + f.money(next.cost * 0.3) + ' this era to discover it (' + f.money(s.run.money) + ' so far).';
        } else {
          const later = Z.BUILDINGS.find(b => b.cat === cat.id && b.era > s.era);
          if (later) text = later.icon + ' ' + later.name + ' arrives in the ' + Z.era(later.era).name + '.';
        }
      }
      setHidden(t.root, !text);
      if (text) setText(t.text, text);
    }

    let tabCount = 0;
    for (const cat of Z.CATS) {
      const shown = !!anyVisible[cat.id] || cat.id === 'traffic';
      if (shown) tabCount++;
      setHidden(tabEls[cat.id], !shown);
      tabEls[cat.id].classList.toggle('has-affordable', !!anyAffordable[cat.id] && cat.id !== tab);
    }
    if (!anyVisible[tab] && tab !== 'traffic') selectTab('traffic');

    // Progressive disclosure: tabs once there is a second category, bulk buying once
    // it saves clicks, and the numbers summary once Chaos makes it relevant.
    const bulk = !!s.flags.reveal.bulk;
    setHidden($('shop-tabs'), tabCount < 2);
    setHidden($('buy-qty'), !bulk);
    setHidden(document.querySelector('.shop-head'), tabCount < 2 && !bulk);
    setHidden($('shop-summary'), !s.flags.reveal.chaos);
    for (const btn of $('buy-qty').children) btn.classList.toggle('active', btn.dataset.qty === qtyMode);
    if (s.flags.reveal.chaos) setText($('shop-summary'), summaryText(g));
  }

  function renderUpgrades(g) {
    const s = g.s, f = Z.fmt;
    const visible = Z.UPGRADES.filter(u => Z.econ.upgradeVisible(s, u))
      .sort((a, b) => a.cost - b.cost);
    setHidden($('panel-upgrades'), !s.flags.reveal.upgrades);
    setText($('upg-count'), String(visible.length));
    const limit = showAllUpgrades ? visible.length : 6;
    const shown = visible.slice(0, limit);
    const key = shown.map(u => u.id).join(',');
    const toggle = $('upg-toggle');
    setHidden(toggle, visible.length <= 6);
    setText(toggle, showAllUpgrades ? 'Show fewer' : 'Show all ' + visible.length);

    const grid = $('upgrade-grid');
    if (key !== upgradeKey) {
      upgradeKey = key;
      grid.textContent = '';
      upgCards.length = 0;
      if (!shown.length) {
        grid.appendChild(h('p', { class: 'empty-note', text: 'No upgrades available yet. Own 10 of a building to unlock its first upgrade.' }));
      }
      for (const u of shown) {
        const cost = h('span', { class: 'ucard-cost' });
        const node = h('button', { type: 'button', class: 'ucard', title: u.flavor }, [
          ui.icon(u.icon, 'ucard-icon'),
          h('span', { class: 'ucard-main' }, [
            h('span', { class: 'ucard-name', text: u.name }),
            h('span', { class: 'ucard-effect', text: u.effects.map(Z.mods.describe).join(' · ') }),
            h('span', { class: 'ucard-flavor', text: u.flavor }),
          ]),
          cost,
        ]);
        node.addEventListener('click', () => buyUpgrade(u.id, node));
        grid.appendChild(node);
        upgCards.push({ u, node, cost });
      }
    }
    for (const x of upgCards) {
      const price = Z.econ.upgradeCost(g, x.u);
      setText(x.cost, f.money(price));
      x.node.classList.toggle('can', s.res.money >= price);
    }
  }

  function render(g) {
    renderBuildings(g);
    renderUpgrades(g);
  }

  ui.shop = { init, render, selectTab, current() { return tab; }, reset() { upgradeKey = ''; } };
})(window.ICHAOS = window.ICHAOS || {});
