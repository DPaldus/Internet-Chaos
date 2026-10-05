/* Layout helpers for the simplified interface: the tab strip in the Community window
   (Live Feed · Analytics · Automation) and the ☰ menu popover in the top bar.
   Panels keep their ids, so the rest of the UI still shows and hides them as before:
   a pane whose [hidden] is set (not unlocked yet) simply has no tab. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $ } = ui;
  let active = 'pane-feed';
  let tabs = [];

  function panes() { return tabs.map(t => $(t.dataset.pane)); }

  /** Shows the active pane, hides the others, and offers tabs only for unlocked panes. */
  function syncTabs() {
    const strip = $('side-tabs');
    if (!strip) return;
    const list = panes();
    const current = $(active);
    if (!current || current.hidden) active = 'pane-feed';
    let visible = 0;
    tabs.forEach((tab, i) => {
      const pane = list[i];
      const unlocked = pane && !pane.hidden;
      if (unlocked) visible++;
      tab.hidden = !unlocked;
      const on = tab.dataset.pane === active;
      tab.classList.toggle('is-on', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      if (pane) pane.classList.toggle('is-off', !on);
    });
    strip.hidden = visible < 2;
  }

  function select(id) {
    active = id;
    syncTabs();
    ui.requestRender(true);
  }

  /* ---------- ☰ Menu popover ---------- */

  function setMenu(open) {
    const pop = $('menu-pop'), btn = $('btn-menu');
    if (!pop || !btn) return;
    pop.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('is-open', open);
  }

  function init() {
    tabs = Array.prototype.slice.call(document.querySelectorAll('#side-tabs .seg-tab'));
    tabs.forEach(tab => tab.addEventListener('click', () => select(tab.dataset.pane)));
    syncTabs();
    // Panels are revealed by other modules as the game unlocks them; keep the tabs in step.
    const watch = new MutationObserver(syncTabs);
    for (const pane of panes()) if (pane) watch.observe(pane, { attributes: true, attributeFilter: ['hidden'] });

    const btn = $('btn-menu'), pop = $('menu-pop');
    btn.addEventListener('click', e => { e.stopPropagation(); setMenu(pop.hidden); });
    // Any item closes the menu after its own handler has run (sound stays open to toggle again).
    pop.addEventListener('click', e => {
      const item = e.target.closest('.menu-item');
      if (item && item.id !== 'btn-sound') setTimeout(() => setMenu(false), 0);
    });
    document.addEventListener('click', e => { if (!pop.hidden && !e.target.closest('.menu-wrap')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { setMenu(false); btn.focus(); } });
  }

  ui.layout = { init, syncTabs, select, closeMenu() { setMenu(false); } };
})(window.ICHAOS = window.ICHAOS || {});
