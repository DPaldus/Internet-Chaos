/* Style Shop: unlock and apply visual themes (backgrounds, colors, website styles,
   effects). Choices live in state.cosmetics, so they save with the game and survive
   restarts and era resets. Purely cosmetic: nothing here touches the economy. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText } = ui;
  const C = Z.COSMETICS;
  let game = null;
  let tab = 'bg';

  function cos() { return game.s.cosmetics; }

  function owned(item) { return !item.req || !!cos().unlocked[C.key(item.cat, item.id)]; }

  function progress(item) {
    if (!item.req) return 1;
    return Math.max(0, Math.min(1, item.req.have(game.s) / item.req.need));
  }

  function canUnlock(item) { return !owned(item) && progress(item) >= 1; }

  /** Puts the chosen look on <body>; css/cosmetics.css does the rest. */
  function apply() {
    if (!game) return;
    const c = cos();
    for (const cat of C.CATEGORIES) document.body.dataset[cat.id === 'site' ? 'siteStyle' : cat.id] = c[cat.id] || C.DEFAULTS[cat.id];
  }

  function choose(item) {
    if (!owned(item)) {
      if (!canUnlock(item)) return;
      cos().unlocked[C.key(item.cat, item.id)] = true;
      ui.toast({ icon: '🎨', title: 'Unlocked: ' + item.name, text: 'Applied to your website.', kind: 'achieve' });
      Z.audio.play('achievement');
    } else {
      Z.audio.play('buy');
    }
    cos()[item.cat] = item.id;
    apply();
    Z.save.write(game.s);
    renderDot();
  }

  /** The 🎨 button gets a dot when something new can be unlocked. */
  function renderDot() {
    let ready = false;
    for (const key in C.ITEM) if (canUnlock(C.ITEM[key])) { ready = true; break; }
    const dot = $('style-dot');
    if (dot && dot.hidden === ready) dot.hidden = !ready;
  }

  /* ---------- The shop window ---------- */

  let view = null;

  function open() {
    const root = h('div', { class: 'style-shop' });
    view = { root, cards: [] };
    const v = view;
    ui.modal.open({
      id: 'style', title: '🎨 Style Shop', body: root, wide: true, className: 'modal-style',
      onClose: () => { if (view === v) view = null; },
      refresh: refresh,
    });
    render();
  }

  function render() {
    const root = view.root;
    root.textContent = '';
    view.cards = [];
    const tabs = h('div', { class: 'style-tabs', role: 'tablist', 'aria-label': 'Style categories' }, C.CATEGORIES.map(cat => {
      const ready = cat.items.some(canUnlock);
      return h('button', {
        type: 'button', role: 'tab', class: 'style-tab' + (cat.id === tab ? ' is-on' : ''), 'aria-selected': cat.id === tab ? 'true' : 'false',
        onclick: () => { tab = cat.id; render(); },
      }, [h('span', { 'aria-hidden': 'true', text: cat.icon }), ' ' + cat.name, ready ? h('span', { class: 'style-new', text: 'NEW' }) : null]);
    }));
    const cat = C.CAT[tab];
    const grid = h('div', { class: 'style-grid' });
    for (const item of cat.items.map(i => C.ITEM[C.key(cat.id, i.id)])) grid.appendChild(card(item));
    root.append(
      h('p', { class: 'style-intro', text: 'Make ' + Z.siteName(game.s) + ' look the way you want. Themes unlock through milestones and never cost Money, so customizing never slows you down.' }),
      tabs,
      h('p', { class: 'style-blurb', text: cat.blurb }),
      grid,
    );
    refresh();
  }

  function card(item) {
    const status = h('div', { class: 'style-status' });
    const bar = h('span', { class: 'style-bar-fill' });
    const reqLine = h('div', { class: 'style-req' });
    const btn = h('button', { type: 'button', class: 'btn style-btn', onclick: () => { choose(item); refresh(); } });
    const node = h('div', { class: 'style-card' }, [
      h('div', { class: 'style-swatch style-swatch-' + item.cat, style: 'background:' + item.swatch, 'aria-hidden': 'true' }),
      h('div', { class: 'style-main' }, [
        h('div', { class: 'style-name', text: item.name }),
        h('div', { class: 'style-desc', text: item.desc }),
        reqLine,
        item.req ? h('div', { class: 'style-bar' }, [bar]) : null,
      ]),
      h('div', { class: 'style-side' }, [status, btn]),
    ]);
    view.cards.push({ item, node, status, bar, reqLine, btn });
    return node;
  }

  function refresh() {
    if (!view) return;
    const c = cos();
    for (const x of view.cards) {
      const item = x.item, has = owned(item), active = c[item.cat] === item.id, ready = canUnlock(item);
      x.node.classList.toggle('is-active', active);
      x.node.classList.toggle('is-locked', !has && !ready);
      x.node.classList.toggle('is-ready', ready);
      if (item.req) {
        const p = progress(item);
        x.bar.style.width = (p * 100).toFixed(1) + '%';
        const have = Math.min(item.req.have(game.s), item.req.need);
        setText(x.reqLine, (has ? '✓ ' : '🔒 ') + item.req.text + (has ? '' : ' · ' + Z.fmt.num(have) + ' / ' + Z.fmt.num(item.req.need)));
        x.bar.parentNode.hidden = has;
      } else {
        setText(x.reqLine, 'Included');
      }
      setText(x.status, active ? 'In use' : has ? 'Owned' : ready ? 'Ready!' : 'Locked');
      setText(x.btn, active ? '✓ Applied' : has ? 'Apply' : ready ? 'Unlock & apply' : 'Locked');
      x.btn.disabled = active || (!has && !ready);
      x.btn.classList.toggle('btn-primary', !active && (has || ready));
    }
  }

  function init(g) {
    game = g;
    apply();
    renderDot();
    setInterval(renderDot, 2000);
  }

  ui.styleShop = { init, open, apply };
})(window.ICHAOS = window.ICHAOS || {});
