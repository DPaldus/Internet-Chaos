/* The era mechanic box in the website window (rules: js/systems/eramech.js). */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden } = ui;
  let game = null, key = '', els = null;

  function build(view) {
    const root = $('panel-mech');
    root.textContent = '';
    const icon = h('span', { 'aria-hidden': 'true' });
    const title = h('span');
    const text = h('p', { class: 'mech-text' });
    const fill = h('span', { class: 'mech-fill' });
    const label = h('span', { class: 'mech-label' });
    const bar = h('div', { class: 'mech-bar', hidden: true }, [fill, label]);
    const btnRow = h('div', { class: 'mech-btns' });
    const buttons = (view.buttons || []).map(b => {
      const el = h('button', { type: 'button', class: 'btn mech-btn' + (b.primary ? ' btn-primary' : ''), text: b.label });
      el.addEventListener('click', () => {
        if (Z.mech.act(game, b.id)) {
          Z.audio.play(b.id === 'douse' ? 'click' : 'action');
          if (b.id === 'douse') ui.replay(el, 'bought');
          ui.requestRender(true);
        } else Z.audio.play('deny');
        renderNow();
      });
      btnRow.appendChild(el);
      return { b, el };
    });
    root.append(h('div', { class: 'section-head' }, [h('h2', {}, [icon, ' ', title])]), text, bar, btnRow);
    els = { root, icon, title, text, bar, fill, label, buttons };
  }

  function renderNow() {
    const g = game, view = Z.mech.view(g);
    const root = $('panel-mech');
    setHidden(root, !view);
    document.body.classList.toggle('ai-glitch', !!(view && view.glitch) && !g.s.settings.reduceMotion);
    if (!view) { key = ''; return; }
    const k = view.kind + '|' + view.title + '|' + (view.buttons || []).map(b => b.id).join(',');
    if (k !== key) { key = k; build(view); }
    root.classList.toggle('mech-alert', !!view.alert);
    root.dataset.mech = view.kind;
    setText(els.icon, view.icon);
    setText(els.title, view.title);
    setText(els.text, view.text);
    setHidden(els.bar, !view.bar);
    if (view.bar) {
      els.fill.style.width = (Math.max(0, Math.min(1, view.bar.value)) * 100).toFixed(1) + '%';
      els.bar.dataset.tone = view.bar.tone || '';
      setText(els.label, view.bar.label);
    }
    for (const x of els.buttons) {
      const b = (view.buttons || []).find(y => y.id === x.b.id) || x.b;
      x.el.disabled = !!b.disabled;
      x.el.classList.toggle('is-on', !!b.on);
      x.el.setAttribute('aria-pressed', b.on === undefined ? null : String(!!b.on));
      if (b.on === undefined) x.el.removeAttribute('aria-pressed');
    }
  }

  function init(g) {
    game = g;
    Z.bus.on('mech', ({ icon, title, text, kind, toast }) => {
      ui.feed.add(game, icon, title + (/[.!?…:]$/.test(title) ? ' ' : '. ') + text, kind === 'bad' ? 'bad' : kind === 'good' ? 'good' : 'info');
      if (toast) ui.toast({ icon, title, text, kind: kind === 'bad' ? 'bad' : kind === 'good' ? 'good' : 'info' });
      if (kind === 'good') Z.audio.play('good');
      else if (kind === 'bad') Z.audio.play('bad');
      else Z.audio.play('ding');
      renderNow();
    });
  }

  ui.mech = { init, render: renderNow };
})(window.ICHAOS = window.ICHAOS || {});
