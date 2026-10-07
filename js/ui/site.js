/* The player's website: the main button, click feedback (combos, viral clicks, floating
   numbers), Attention milestones, the site's look as it grows (construction banner →
   marquee → ad slots), the meltdown screen and contextual tips. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden, setStyle } = ui;
  let el = null, game = null;
  const clickTimes = [];
  let adIndex = 0, adTimer = 0, tipIndex = 0, tipTimer = 0, lastLevel = -1, lastEra = -1, lastName = null;
  const combo = Z.idle.newCombo();
  let comboShown = false, lastMilestone = -1, milestoneAt = 0, zoneRect = null;

  const PARTICLES = ['👀', '💬', '🔥', '❤️', '👍', '😂', '📈', '⭐', '💯', '🙃'];
  const CRIT_WORDS = ['VIRAL!', 'IT BLEW UP!', 'FRONT PAGE!', 'RATIO!', 'TRENDING!', 'BASED!', 'W POST!'];
  const MILESTONE_QUIPS = [
    'Somebody tell Mom.', 'The servers felt that.', 'Screenshot this.', 'Not bad for a website.',
    'The comment section is losing it.', 'Line goes up.', 'Engagement intensifies.', 'The internet noticed.',
  ];

  const ADS = [
    'HOT SINGLES IN YOUR AREA WANT TO READ YOUR BLOG',
    'CONGRATULATIONS! YOU ARE VISITOR #1,000,000 (AGAIN)',
    'DOCTORS HATE THIS ONE WEIRD WEBSITE',
    'DOWNLOAD MORE RAM — 100% LEGAL',
    'Local man makes $0.03 a day from home',
    '{Name} Premium: now with 40% more premium',
    'Your computer may be at risk of being a computer',
    'Learn the secret of the internet. (It is this ad.)',
    'Buy 1 banner, get 1 banner. Ad space sold separately.',
    'Click here to stop clicking here',
  ];

  const IDLE_TIPS = [
    'The notch on the Chaos bar is your Tolerance. Ride just under it for free growth.',
    'Monetization makes every point of Attention earn more Money.',
    'Servers raise Tolerance. Moderators lower Chaos. Both protect Stability.',
    'Chaos makes events happen more often, for better and for worse.',
    'Buy amount ×10 / ×25 / Max is above the shop list.',
    'Upgrades unlock as you own more of a building. Ten is a good first target.',
    'Low Stability slows production. Below 60% the site starts to wheeze.',
  ];

  function init(g) {
    game = g;
    el = {
      btn: $('create-btn'), label: $('create-label'), sub: $('create-sub'), zone: $('click-zone'),
      floaters: $('floaters'), counter: $('hit-counter'), url: $('site-url'), title: $('site-title'),
      level: $('site-level'), name: $('site-name'), tagline: $('site-tagline'), construction: $('site-construction'),
      marquee: $('site-marquee'), track: $('marquee-track'), adTop: $('ad-top'), adBottom: $('ad-bottom'),
      melt: $('meltdown-screen'), meltTime: $('melt-time'), tip: $('site-tip'), site: $('site'),
      logoSite: $('logo-site'), combo: $('combo'), comboN: $('combo-n'), comboX: $('combo-x'),
      comboTime: $('combo-time'), milestone: $('site-milestone'),
    };
    el.btn.addEventListener('click', onClick);
    el.name.title = 'Rename your website';
    el.name.classList.add('is-renamable');
    el.name.addEventListener('click', () => ui.modals.openSiteName());
    Z.bus.on('feedChanged', () => updateMarquee());
    // The click zone only moves when the page does: measure it then, not on every click.
    const forget = () => { zoneRect = null; };
    window.addEventListener('resize', forget);
    window.addEventListener('scroll', forget, { capture: true, passive: true });
    lastMilestone = Z.idle.milestone(g.s.run.attention);
    updateMarquee();
  }

  function onClick(e) {
    const g = game, s = g.s;
    const now = performance.now();
    while (clickTimes.length && now - clickTimes[0] > 1000) clickTimes.shift();
    if (clickTimes.length >= Z.BAL.click.maxPerSecond) return;
    clickTimes.push(now);
    if (clickTimes.length > s.flags.cpsPeak) s.flags.cpsPeak = clickTimes.length;

    Z.audio.unlock();
    g.refresh();
    const n = Z.idle.comboClick(combo, now / 1000);
    const melting = s.meltdown > 0;
    const crit = !melting && Math.random() < Z.idle.critChance(n);
    const res = Z.econ.click(g, Z.idle.comboMult(n) * (crit ? Z.BAL.idle.critMult : 1));
    if (n > s.stats.bestCombo) s.stats.bestCombo = n;
    if (crit) s.stats.crits++;
    Z.audio.play('click', n, crit);
    if (n % 25 === 0) Z.audio.play('combo', n / 25);

    if (!zoneRect || now - zoneRect.at > 2000) {
      const r = el.zone.getBoundingClientRect();
      zoneRect = { left: r.left, top: r.top, width: r.width, height: r.height, at: now };
    }
    let x = e.clientX - zoneRect.left, y = e.clientY - zoneRect.top;
    if (!e.clientX && !e.clientY) { x = zoneRect.width / 2; y = zoneRect.height / 2; }
    const text = res.reboot ? Z.i18n.tr('REBOOT −' + Z.BAL.meltdown.rebootPerClick + 's')
      : (crit ? CRIT_WORDS[Math.floor(Math.random() * CRIT_WORDS.length)] + ' ' : '') + '+' + Z.fmt.num(res.att, { dec: 1 });
    spawnFloater(x, y, text, crit, n);
    ui.animate(el.btn, [{ transform: 'translateY(5px) scale(.98)' }, { transform: 'none' }], { duration: 140, easing: 'ease-out' });
    renderCombo(now);
    ui.requestRender();
  }

  function spawnFloater(x, y, text, crit, n) {
    if (game.s.settings.reduceMotion) return;
    const box = el.floaters;
    while (box.children.length > 24) box.firstChild.remove();
    const heat = Math.min(1, (n || 0) / Z.BAL.idle.comboMax);
    const f = h('span', { class: 'floater' + (crit ? ' is-crit' : heat >= 0.5 ? ' is-hot' : ''), text });
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    if (heat > 0.1 && !crit) f.style.fontSize = (16 + heat * 8).toFixed(1) + 'px';
    f.addEventListener('animationend', () => f.remove());
    box.appendChild(f);
    for (let i = crit ? 4 : 1; i > 0; i--) {
      const p = h('span', { class: 'particle', text: crit ? (i % 2 ? '🔥' : '⭐') : PARTICLES[Math.floor(Math.random() * PARTICLES.length)] });
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', (Math.random() * (crit ? 220 : 120) - (crit ? 110 : 60)).toFixed(0) + 'px');
      p.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
      p.addEventListener('animationend', () => p.remove());
      box.appendChild(p);
    }
    if (crit) ui.animate(el.site, [{ transform: 'translate(0, 0)' }, { transform: 'translate(-3px, 2px)' }, { transform: 'translate(3px, -2px)' }, { transform: 'none' }], { duration: 220 });
  }

  /* ---------- Combo ---------- */

  /** The combo badge: count, multiplier and a bar that empties until the combo breaks. */
  function renderCombo(now) {
    const alive = Z.idle.comboAlive(combo, now / 1000) && combo.n >= 5;
    if (alive !== comboShown) {
      comboShown = alive;
      setHidden(el.combo, !alive);
      if (!alive) { el.combo.className = 'combo'; combo.n = Z.idle.comboAlive(combo, now / 1000) ? combo.n : 0; }
    }
    if (!alive) return;
    const n = combo.n, heat = Math.min(1, n / Z.BAL.idle.comboMax);
    setText(el.comboN, String(n));
    setText(el.comboX, '×' + Z.idle.comboMult(n).toFixed(2));
    setStyle(el.combo, '--heat', heat.toFixed(2));
    el.combo.classList.toggle('is-max', n >= Z.BAL.idle.comboMax);
    const left = 1 - (now / 1000 - combo.last) / Z.BAL.idle.comboGap;
    setStyle(el.comboTime, 'transform', 'scaleX(' + Math.max(0, left).toFixed(3) + ')');
  }

  /* ---------- Milestones ---------- */

  function checkMilestone(g) {
    const ms = Z.idle.milestone(g.s.run.attention);
    if (ms < lastMilestone) { lastMilestone = ms; return; }        // a new era started over
    if (ms <= lastMilestone) return;
    lastMilestone = ms;
    const now = performance.now();
    if (now - milestoneAt < 2500 || g.offline) return;
    milestoneAt = now;
    const label = Z.fmt.num(Math.pow(10, ms)).replace(/\.0+(?=[A-Za-z]|$)/, '') + ' Attention';
    const quip = MILESTONE_QUIPS[ms % MILESTONE_QUIPS.length];
    ui.feed.add(g, '🎉', label + ' this era! ' + quip, 'good');
    Z.audio.play('milestone');
    const box = el.milestone;
    box.textContent = '';
    box.append(h('span', { class: 'ms-burst', text: '🎉' }), h('b', { class: 'ms-num', text: label }), h('span', { class: 'ms-quip', text: quip }));
    box.hidden = false;
    ui.replay(box, 'is-on');
    clearTimeout(box._timer);
    box._timer = setTimeout(() => { box.hidden = true; box.classList.remove('is-on'); }, 2600);
  }

  function updateMarquee() {
    if (!el || el.marquee.hidden) return;
    const items = game.s.feed.slice(-6).reverse().map(x => x.icon + ' ' + x.text);
    const text = items.length ? items.join('   ★   ') : 'Welcome to the internet. Please enjoy your stay.';
    if (el.track._t !== text) {
      el.track._t = text;
      el.track.textContent = text;
      el.track.style.animationDuration = Math.max(18, text.length / 7) + 's';
    }
  }

  function pickTip(g) {
    const s = g.s, c = g.c, rev = s.flags.reveal;
    const owned = id => s.buildings[id] || 0;
    if (s.meltdown > 0) return '🔥 Meltdown! Click the big button to reboot faster. Next time keep Chaos under the Tolerance notch.';
    if (s.run.clicks < 5 && s.stats.totalClicks < 20) return '👆 Click the big button to create content. Content earns Attention, and Attention earns Money.';
    const B = Z.B;
    if (!owned('blog')) return s.res.money >= B.blog.cost
      ? '🛒 You can afford a ' + B.blog.name + '. Buy it in the shop. It makes Attention on its own.'
      : '💵 Earn $5 for your first ' + B.blog.name + '. It works while you don\'t.';
    if (s.events.pending) return '📨 Something happened! Answer the pop-up before it decides for you.';
    if (rev.stability && s.res.stability < 35) return '🚨 Stability is critical. Use Hotfix, buy Infrastructure or Moderation, or switch to a calmer Editorial Policy.';
    if (rev.chaos && s.res.chaos > c.tolerance + 1) return '⚠️ Chaos is above your Tolerance notch, so Stability is draining. Add servers (raise the notch) or moderators (lower Chaos).';
    if (rev.chaos && !rev.stability) return '🌀 Chaos multiplies Attention and Money. More Chaos means more growth, until it doesn\'t.';
    if (Z.prestige.canPrestige(s)) return '🌐 A new Internet Era is available. Open Eras to start over with permanent Clout.';
    if (!owned('meme') && s.seen.meme) return B.meme.icon + ' ' + B.meme.plural + ' make far more Attention than ' + B.blog.plural + '. They also add a little Chaos.';
    if (rev.upgrades && s.run.upgrades === 0) return '⬆️ Upgrades are one-time boosts. Keep an eye on the Upgrades panel.';
    return null;
  }

  function renderTip(g, dt) {
    let tip = pickTip(g);
    if (!tip) {
      tipTimer += dt;
      if (tipTimer > 14) { tipTimer = 0; tipIndex = (tipIndex + 1) % IDLE_TIPS.length; }
      tip = '💡 ' + IDLE_TIPS[tipIndex];
    }
    setText(el.tip, tip);
  }

  function renderLook(g) {
    const s = g.s, era = Z.era(s.era), level = Z.siteLevel(s);
    if (level === lastLevel && s.era === lastEra && s.siteName === lastName) return;
    lastLevel = level;
    lastEra = s.era;
    lastName = s.siteName;
    const site = Z.siteText(s, era.site);
    document.body.dataset.era = String(Math.min(s.era, Z.ERAS.length));
    document.body.dataset.level = String(level);
    setText(el.url, Z.siteText(s, era.url[level >= 2 ? 1 : 0]));
    setText(el.title, site);
    setText(el.name, site);
    setText(el.logoSite, Z.siteName(s));
    document.title = Z.siteName(s) + ' · Internet Chaos';
    setText(el.tagline, era.tagline);
    setText(el.level, Z.SITE_LEVELS[level]);
    setText(el.label, era.button);
    setHidden(el.construction, !(s.era === 1 && level === 0));
    setHidden(el.marquee, level < 1);
    setHidden(el.adTop, level < 2);
    setHidden(el.adBottom, level < 4);
    updateMarquee();
  }

  function renderAds(dt) {
    if (el.adTop.hidden) return;
    adTimer -= dt;
    if (adTimer > 0 && el.adTop._t) return;
    adTimer = 12;
    adIndex++;
    // Sponsors take every other rotation of the ad slots.
    const sp = ui.sponsors.ads(), half = adIndex >> 1;
    const top = sp.length && adIndex % 2 ? sp[half % sp.length] : ADS[adIndex % ADS.length];
    const bottom = sp.length > 1 && !(adIndex % 2) ? sp[(half + 1) % sp.length] : ADS[(adIndex + 5) % ADS.length];
    setText(el.adTop, Z.siteText(game.s, top));
    setText(el.adBottom, Z.siteText(game.s, bottom));
  }

  function render(g, dt) {
    const s = g.s, c = g.c, f = Z.fmt;
    renderLook(g);
    ui.sponsors.render(g);
    renderAds(dt);
    renderTip(g, dt);

    const melting = s.meltdown > 0;
    setHidden(el.melt, !melting);
    el.site.classList.toggle('is-down', melting);
    if (melting) {
      setText(el.meltTime, String(Math.ceil(s.meltdown)));
      setText(el.label, 'MASH TO REBOOT');
      setText(el.sub, '−' + Z.BAL.meltdown.rebootPerClick + 's downtime per click');
    } else {
      setText(el.label, Z.era(s.era).button);
      setText(el.sub, '+' + f.num(c.clickAtt, { dec: 1 }) + ' Attention · ' + f.money(c.clickAtt * c.yield));
    }
    renderCounter(g, 0);
    renderCombo(performance.now());
    checkMilestone(g);
  }

  /** The hit counter. `ahead` (seconds since the last tick) lets it roll smoothly every frame. */
  function renderCounter(g, ahead) {
    const visitors = Math.floor(g.s.run.attention + g.c.aps * ahead);
    setText(el.counter, visitors < 1e7 ? String(visitors).padStart(7, '0') : Z.fmt.int(visitors));
  }

  ui.site = { init, render, renderCounter, renderCombo, refreshLook() { lastLevel = -1; } };
})(window.ICHAOS = window.ICHAOS || {});
