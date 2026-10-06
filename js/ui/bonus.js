/* The floating notification bonus (js/systems/bonus.js decides when and what):
   a glossy bell bubble drifts over the page for a few seconds; one click catches it. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h } = ui;
  let game = null, bubble = null, fadeTimer = 0;

  function remove(missed) {
    clearTimeout(fadeTimer);
    if (!bubble) return;
    const el = bubble;
    bubble = null;
    el.disabled = true;
    el.classList.add(missed ? 'is-gone' : 'is-caught');
    setTimeout(() => el.remove(), missed ? 500 : 650);
  }

  function spawn(life) {
    remove(true);
    const layer = $('bonus-layer');
    const vw = window.innerWidth, vh = window.innerHeight;
    const x = Math.round(vw * (0.12 + Math.random() * 0.66));
    const y = Math.round(vh * (0.22 + Math.random() * 0.5));
    const fresh = game.s.stats.bonuses < 3;
    const el = h('button', { type: 'button', class: 'bonus-bubble', 'aria-label': 'Catch the notification for a bonus' }, [
      h('span', { class: 'bonus-orb', 'aria-hidden': 'true' }, [h('span', { class: 'bonus-bell', text: '🔔' }), h('span', { class: 'bonus-badge', text: '1' })]),
      fresh ? h('span', { class: 'bonus-hint', text: 'Click me!' }) : null,
    ]);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--drift', (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 50) + 'px');
    el.style.setProperty('--life', life + 's');
    el.addEventListener('click', e => {
      e.stopPropagation();
      Z.audio.unlock();
      Z.bonus.claim(game);
    });
    layer.appendChild(el);
    bubble = el;
    fadeTimer = setTimeout(() => { if (bubble === el) el.classList.add('is-fading'); }, Math.max(0, life - 3) * 1000);
    Z.audio.play('ding');
  }

  function caught({ type, effText }) {
    if (bubble) {
      const r = bubble.getBoundingClientRect();
      const pop = h('span', { class: 'bonus-pop', text: type.icon + ' ' + type.title });
      pop.style.left = (r.left + r.width / 2) + 'px';
      pop.style.top = r.top + 'px';
      $('bonus-layer').appendChild(pop);
      pop.addEventListener('animationend', () => pop.remove());
      setTimeout(() => pop.remove(), 2000);
    }
    remove(false);
    Z.audio.play('bonus');
    ui.toast({ icon: type.icon, title: type.title, text: effText, kind: 'good' });
    ui.feed.add(game, '🔔', 'You caught a notification: ' + type.title + ' ' + effText + '.', 'good');
    ui.requestRender(true);
  }

  function init(g) {
    game = g;
    Z.bus.on('bonusSpawn', ({ life }) => spawn(life));
    Z.bus.on('bonusMissed', () => remove(true));
    Z.bus.on('bonusCaught', caught);
    // Hold new notifications while the player could not see or reach them.
    const hold = () => { g.bonusHold = document.hidden || !!document.querySelector('.modal-backdrop, .tour, .os-setup'); };
    setInterval(hold, 500);
    document.addEventListener('visibilitychange', hold);
  }

  ui.bonus = { init };
})(window.ICHAOS = window.ICHAOS || {});
