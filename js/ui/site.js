/* The player's website: the main button, click feedback, the site's look as it grows
   (construction banner → marquee → ad slots), the meltdown screen and contextual tips. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden } = ui;
  let el = null, game = null;
  const clickTimes = [];
  let adIndex = 0, adTimer = 0, tipIndex = 0, tipTimer = 0, lastLevel = -1, lastEra = -1, lastName = null;

  const PARTICLES = ['👀', '💬', '🔥', '❤️', '👍', '😂', '📈', '⭐', '💯', '🙃'];

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
      logoSite: $('logo-site'),
    };
    el.btn.addEventListener('click', onClick);
    el.name.title = 'Rename your website';
    el.name.classList.add('is-renamable');
    el.name.addEventListener('click', () => ui.modals.openSiteName());
    Z.bus.on('feedChanged', () => updateMarquee());
    updateMarquee();
  }

  function onClick(e) {
    const g = game;
    const now = performance.now();
    while (clickTimes.length && now - clickTimes[0] > 1000) clickTimes.shift();
    if (clickTimes.length >= Z.BAL.click.maxPerSecond) return;
    clickTimes.push(now);
    if (clickTimes.length > g.s.flags.cpsPeak) g.s.flags.cpsPeak = clickTimes.length;

    Z.audio.unlock();
    g.refresh();
    const res = Z.econ.click(g);
    Z.audio.play('click');

    const rect = el.zone.getBoundingClientRect();
    let x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (!e.clientX && !e.clientY) { x = rect.width / 2; y = rect.height / 2; }
    spawnFloater(x, y, res.reboot ? 'REBOOT −' + Z.BAL.meltdown.rebootPerClick + 's' : '+' + Z.fmt.num(res.att, { dec: 1 }));
    el.btn.classList.remove('pressed');
    void el.btn.offsetWidth;
    el.btn.classList.add('pressed');
    ui.requestRender();
  }

  function spawnFloater(x, y, text) {
    if (game.s.settings.reduceMotion) return;
    const box = el.floaters;
    while (box.children.length > 24) box.firstChild.remove();
    const f = h('span', { class: 'floater', text });
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    const p = h('span', { class: 'particle', text: PARTICLES[Math.floor(Math.random() * PARTICLES.length)] });
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
    f.addEventListener('animationend', () => f.remove());
    p.addEventListener('animationend', () => p.remove());
    box.appendChild(f);
    box.appendChild(p);
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
    if (!owned('blog')) return s.res.money >= Z.B.blog.cost
      ? '🛒 You can afford a Blog Post. Buy it in the shop. It makes Attention on its own.'
      : '💵 Earn $5 for your first Blog Post. It works while you don\'t.';
    if (s.events.pending) return '📨 Something happened! Answer the pop-up before it decides for you.';
    if (rev.stability && s.res.stability < 35) return '🚨 Stability is critical. Use Hotfix, buy Infrastructure or Moderation, or switch to a calmer Editorial Policy.';
    if (rev.chaos && s.res.chaos > c.tolerance + 1) return '⚠️ Chaos is above your Tolerance notch, so Stability is draining. Add servers (raise the notch) or moderators (lower Chaos).';
    if (rev.chaos && !rev.stability) return '🌀 Chaos multiplies Attention and Money. More Chaos means more growth, until it doesn\'t.';
    if (Z.prestige.canPrestige(s)) return '🌐 A new Internet Era is available. Open Eras to start over with permanent Clout.';
    if (!owned('meme') && s.seen.meme) return '🖼️ Meme Pages make far more Attention than Blog Posts. They also add a little Chaos.';
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
    adIndex = (adIndex + 1) % ADS.length;
    setText(el.adTop, Z.siteText(game.s, ADS[adIndex]));
    setText(el.adBottom, Z.siteText(game.s, ADS[(adIndex + 5) % ADS.length]));
  }

  function render(g, dt) {
    const s = g.s, c = g.c, f = Z.fmt;
    renderLook(g);
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
    const visitors = Math.floor(s.run.attention);
    setText(el.counter, visitors < 1e7 ? String(visitors).padStart(7, '0') : f.int(visitors));
  }

  ui.site = { init, render, refreshLook() { lastLevel = -1; } };
})(window.ICHAOS = window.ICHAOS || {});
