/* Keyboard shortcuts. They only fire when no window, choice or text field has focus, so
   typing a save code or a website name never triggers anything. The list is also shown
   in Help (js/ui/help.js reads SHORTCUTS). */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  let game = null;

  const SHORTCUTS = [
    ['Space', 'Create content (the big button)'],
    ['1 – 4', 'Shop tabs: Content, Monetization, Infrastructure, Moderation'],
    ['B', 'Buy the best-value building in the open tab'],
    ['U', 'Buy the cheapest upgrade you can afford'],
    ['E', 'Internet Eras'],
    ['S', 'Style Shop'],
    ['D', 'Daily challenge'],
    ['R', 'Era records'],
    ['H', 'Help'],
  ];

  function busy(e) {
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable], .dev-menu')) return true;
    if (ui.modal.isOpen()) return true;
    if (document.querySelector('.choice-window, .tour-card, .os-setup')) return true;
    return false;
  }

  function click(id) {
    const el = ui.$(id);
    if (el && !el.hidden) { el.click(); return true; }
    return false;
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || busy(e)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === ' ' || e.code === 'Space') {
      // A focused button already reacts to Space by itself.
      if (e.target && e.target.closest && e.target.closest('button, a')) return;
      e.preventDefault();
      if (!e.repeat) ui.$('create-btn').click();
      return;
    }
    if (e.repeat) return;
    if (k >= '1' && k <= '4') {
      const cat = Z.CATS[+k - 1];
      const tab = cat && document.querySelector('#shop-tabs .tab[data-cat="' + cat.id + '"]');
      if (tab && !tab.hidden) { ui.shop.selectTab(cat.id); e.preventDefault(); }
      return;
    }
    let done = false;
    if (k === 'b') done = ui.shop.buyBest() || true;
    else if (k === 'u') done = !!game.s.flags.reveal.upgrades && (ui.shop.buyCheapestUpgrade() || true);
    else if (k === 'e') done = click('btn-eras');
    else if (k === 's') done = click('btn-style');
    else if (k === 'd') done = click('btn-daily');
    else if (k === 'r') done = click('btn-records');
    else if (k === 'h' || k === '?') done = click('btn-help');
    if (done) e.preventDefault();
  }

  ui.keys = {
    SHORTCUTS,
    init(g) { game = g; document.addEventListener('keydown', onKey); },
  };
})(window.ICHAOS = window.ICHAOS || {});
