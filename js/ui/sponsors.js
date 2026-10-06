/* Sponsors on the website: a "Sponsored by" strip of brand badges, the BLU VOLT can next
   to the big button, and sponsor ads mixed into the site's ad slots. A new sponsor gets
   a short announcement; sponsors leave with their upgrades when a new era starts. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setHidden } = ui;
  let game = null, key = null;
  let known = null;   // sponsors already on the site, so only new ones are announced

  function activeList(s) { return Z.SPONSORS.filter(sp => sp.active(s)); }

  function render(g) {
    const list = activeList(g.s);
    const next = list.map(sp => sp.id).join(',');
    if (next === key) return;
    key = next;

    const fresh = known ? list.filter(sp => !known[sp.id]) : [];
    known = Object.create(null);
    for (const sp of list) known[sp.id] = true;

    const root = $('sponsor-list');
    root.textContent = '';
    for (const sp of list) {
      const pill = h('span', { class: 'sponsor-pill sponsor-' + sp.id, title: Z.siteText(g.s, sp.tagline) }, [
        h('span', { class: 'sponsor-icon', 'aria-hidden': 'true', text: sp.icon }),
        h('span', { class: 'sponsor-brand', text: sp.brand }),
      ]);
      pill.style.background = sp.style[0];
      pill.style.color = sp.style[1];
      if (fresh.indexOf(sp) >= 0) pill.classList.add('is-new');
      root.appendChild(pill);
    }
    setHidden($('sponsor-bar'), !list.length);
    setHidden($('sponsor-can'), !known.volt);

    for (const sp of fresh) {
      ui.toast({ icon: sp.icon, title: 'New sponsor: ' + sp.brand, text: 'Their logo is now on your website.', kind: 'good' });
      ui.feed.add(g, sp.icon, sp.brand + ' is now sponsoring ' + Z.siteName(g.s) + '. ' + Z.siteText(g.s, sp.tagline), 'good');
    }
  }

  /** Ads for the site's ad slots from the current sponsors. */
  function ads() { return game ? activeList(game.s).map(sp => sp.ad) : []; }

  function init(g) {
    game = g;
    render(g);
  }

  ui.sponsors = { init, render, ads, reset() { key = null; known = null; } };
})(window.ICHAOS = window.ICHAOS || {});
