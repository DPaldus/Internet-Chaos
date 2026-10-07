/* Help: the "?" window (how to play + a glossary of every term) and the short
   first-launch tour that points at the main parts of the screen. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h } = ui;
  let game = null;

  /* ---------- The core loop, shown in both the tour and the help window ---------- */

  function loopStrip() {
    const steps = [['👆', 'Click'], ['👁', 'Attention'], ['💵', 'Money'], ['🛒', 'Buildings']];
    const items = [];
    steps.forEach(([icon, label], i) => {
      if (i) items.push(h('span', { class: 'loop-arrow', 'aria-hidden': 'true', text: '→' }));
      items.push(h('span', { class: 'loop-step' }, [h('span', { class: 'loop-icon', 'aria-hidden': 'true', text: icon }), label]));
    });
    items.push(h('span', { class: 'loop-arrow', 'aria-hidden': 'true', text: '↺' }));
    return h('div', { class: 'loop-strip', role: 'img', 'aria-label': 'Click for Attention, Attention earns Money, Money buys buildings, buildings make more Attention.' }, items);
  }

  /* ---------- Glossary ---------- */

  // [icon, term, explanation, reveal key or null]; terms with a key show "Later" until discovered.
  function terms() {
    const ach = Math.round(Z.BAL.achievementBonus * 100);
    return [
      { group: 'Basics', items: [
        ['👁', 'Attention', 'Your main score. Clicks and buildings make it, and it earns Money automatically.', null],
        ['💵', 'Money', 'Earned from Attention every second. Spend it in the Shop.', null],
        ['👆', 'Create Content', 'The big button on your website. Each click earns Attention. Most useful at the start.', null],
        ['🛒', 'Buildings', 'Shop items that keep producing on their own. Each one costs a little more than the last. Every Internet Era gives them new names.', null],
        ['🎯', 'Next Goals', 'Your next targets with progress bars. Follow them when you are not sure what to do.', null],
        ['📰', 'Live Feed', 'Everything that happens on your site. Click a Blog Post, Meme Page or Comment Section to read its comments.', null],
      ] },
      { group: 'Growing', items: [
        ['⬆️', 'Upgrades', 'One-time purchases with a permanent boost. Most unlock when you own 10, 25 or 50 of a building.', 'upgrades'],
        ['🗂️', 'Shop categories', 'Content makes Attention. Monetization makes each Attention worth more Money. Infrastructure and Moderation keep Chaos in check.', null],
        ['✖️', 'Buy amount', '×1, ×10, ×25 and Max above the building list buy several at once.', 'bulk'],
        ['🤝', 'Sponsors', 'Some upgrades and buildings bring sponsors. Their logos and ads appear on your website.', null],
        ['🏗️', 'Site level', 'Your site grows from Homepage to Empire as it earns Attention, and looks busier at every level.', null],
        ['🎰', 'Click combo', 'Click quickly and the combo grows: up to ×2 Attention per click at 100. It breaks after a second without a click.', null],
        ['💥', 'Viral clicks', 'Any click can go viral and count five times. A combo makes it a little likelier.', null],
        ['🎉', 'Milestones', 'Every 1K, 10K, 100K and so on of Attention in an era gets a little celebration.', null],
      ] },
      { group: 'Chaos and Stability', items: [
        ['🌀', 'Chaos', 'Messy content creates Chaos. Chaos multiplies Attention and Money, but too much of it is dangerous.', 'chaos'],
        ['📍', 'Chaos target', 'The marker on the Chaos bar. Chaos drifts toward it. Content pushes it up, Moderation pulls it down.', 'chaos'],
        ['📏', 'Tolerance', 'The TOL notch on the Chaos bar. Above it, Stability drains. Infrastructure moves the notch up.', 'chaos'],
        ['🛠️', 'Stability', 'How healthy your servers are. Below 60% production slows down. At 0% the site melts down.', 'stability'],
        ['🔥', 'Meltdown', 'The site goes offline for a while and Chaos resets. Click the big button to reboot faster.', 'stability'],
        ['🟢', 'Uptime', 'Every full minute without a meltdown adds +1% Attention, up to +25%, even while you are away. A meltdown starts it over.', 'stability'],
        ['📰', 'Editorial Policy', 'How wild your site may be. Wilder policies mean more Attention and more Chaos.', 'policy'],
        ['⚡', 'Actions', 'One-click abilities with cooldowns, like Hotfix, which repairs Stability.', 'actions'],
      ] },
      { group: 'Events', items: [
        ['📨', 'Events', 'Random things happen: viral posts, outages, drama. Some ask you to choose. No answer picks the safe option.', null],
        ['🔔', 'Floating notifications', 'Every few minutes a glowing bell floats across the screen for a few seconds. Click it for a surprise bonus.', null],
        ['#️⃣', 'Trending', 'Now and then one kind of building trends and produces several times more for a while.', null],
        ['🎲', 'Era mechanic', 'Every era has one thing of its own in your website window: flame wars, a friend network, trend alerts, a feed switch, AI claims, quarterly targets and bot swarms.', null],
      ] },
      { group: 'Long term', items: [
        ['🌐', 'Internet Eras', 'Start over in the next era of the internet. You lose buildings and Money but earn permanent Clout.', 'eras'],
        ['✦', 'Clout and Perks', 'Clout permanently boosts Attention. Spend it on Perks that survive every reset.', 'eras'],
        ['🎯', 'Era challenges', 'Three optional goals per era, in the Eras window. Each one you complete adds extra Clout when you start the next era.', 'eras'],
        ['🏁', 'Era records', 'Every finished era with its time and Clout, and your fastest run of each one. In the ☰ Menu.', 'eras'],
        ['🔁', 'Reboot the Internet', 'After the Post-Internet Era you can start the whole internet over in the Forum Era. You lose Clout and perks but earn Bandwidth. In the ☰ Menu.', 'eras'],
        ['📡', 'Bandwidth', 'Earned by rebooting the internet. Buys upgrades that survive every reboot. The further you get before rebooting, the more you earn.', 'eras'],
        ['🧪', 'Protocols', 'An optional handicap you can pick for the next internet. A harder internet pays more Bandwidth when you reboot it.', 'eras'],
        ['📅', 'Daily challenge', 'A new modifier and goal every day, the same for everyone. The goal pays Clout; days in a row build a streak.', 'daily'],
        ['🏆', 'Achievements', 'Milestones in the ☰ Menu. Each one adds +' + ach + '% Attention forever.', null],
        ['🤖', 'Automation', 'Upgrades that click, buy or repair for you. Switch them on and off in the Automation tab.', 'auto'],
        ['📈', 'Analytics', 'A chart of Attention and Chaos over the last two minutes.', 'analytics'],
        ['🎨', 'Style Shop', 'Themes for your website, unlocked by milestones. Pure looks, no effect on gameplay.', 'style'],
        ['🪟', 'Operating System', 'One-time upgrades for your website: ChaosOS 8 (Social Media Era), Mango OS (Viral Era), Prism OS (AI Era) and ChaosOS 95 (Post-Internet Era). Each brings permanent bonuses, a new look and new music. Its Style Shop themes unlock from scratch.', 'os'],
        ['📸', 'Share your website', 'Makes a picture of your website and its numbers to download or copy. In the ☰ Menu.', null],
        ['💤', 'Offline progress', 'Your site keeps earning, a bit slower, while the game is closed.', null],
        ['🎁', 'Welcome Back boost', 'Come back after 10 minutes or more away and your site gets ×2 Attention for a minute or more.', null],
      ] },
    ];
  }

  function shortcuts() {
    return h('section', { class: 'help-group' }, [
      h('h3', { text: 'Keyboard shortcuts' }),
      h('dl', { class: 'help-keys' }, ui.keys.SHORTCUTS.map(([key, what]) => h('div', { class: 'help-key' }, [
        h('dt', {}, [h('kbd', { text: key })]), h('dd', { text: what }),
      ]))),
    ]);
  }

  function open() {
    const rev = game.s.flags.reveal;
    const tour = h('button', { type: 'button', class: 'btn btn-primary', 'data-autofocus': true, text: '▶ Replay the tour' });
    tour.addEventListener('click', () => { ui.modal.close(); startTour(); });

    const groups = terms().map(gr => h('section', { class: 'help-group' }, [
      h('h3', { text: gr.group }),
      h('dl', { class: 'help-terms' }, gr.items.map(([icon, term, text, key]) => {
        const later = key && !rev[key];
        return h('div', { class: 'help-term' + (later ? ' is-later' : '') }, [
          h('dt', {}, [h('span', { class: 'help-icon', 'aria-hidden': 'true', text: icon }), term, later ? h('span', { class: 'help-later', text: 'Later' }) : null]),
          h('dd', { text }),
        ]);
      })),
    ]));

    const body = h('div', { class: 'help' }, [
      h('section', { class: 'help-intro' }, [
        h('h3', { text: 'How it works' }),
        loopStrip(),
        h('ol', { class: 'help-first' }, [
          h('li', { text: 'Click the big button until you have $5.' }),
          h('li', { text: 'Buy a ' + Z.B.blog.icon + ' ' + Z.B.blog.name + ' in the Shop. It earns Attention by itself.' }),
          h('li', { text: 'Keep buying buildings and follow Next Goals.' }),
          h('li', { text: 'New systems appear one at a time. Each comes with a short note.' }),
        ]),
        h('div', { class: 'btn-row' }, [tour]),
      ]),
      h('p', { class: 'help-legend' }, ['Terms marked ', h('span', { class: 'help-later', text: 'Later' }), ' belong to systems you have not unlocked yet.']),
    ].concat(groups, [shortcuts()]));

    ui.modal.open({ id: 'help', title: '❔ Help', body, wide: true, className: 'modal-help' });
  }

  /* ---------- First-launch tour ---------- */

  const STEPS = [
    { title: s => 'Welcome to ' + Z.siteName(s) + '!',
      text: 'You just launched a website. Nobody has seen it yet. This quick tour shows how to change that.',
      extra: loopStrip, next: 'Show me' },
    { target: () => $('create-btn'), title: 'Create content',
      text: 'Click the big button. Every click earns 👁 Attention, and Attention earns 💵 Money on its own.' },
    { target: () => $('hud'), title: 'Your numbers',
      text: 'Attention and Money live up here. The small line shows how much you earn every second.' },
    { target: () => document.querySelector('.panel-shop'), title: 'Spend Money in the Shop',
      get text() { return 'Buildings keep working when you stop clicking. Start with a ' + Z.B.blog.icon + ' ' + Z.B.blog.name + ' for $5, then keep buying.'; } },
    { target: () => $('panel-goals'), title: 'What next?',
      text: 'Next Goals always shows your next targets and how close you are.' },
    { target: () => $('pane-feed'), title: 'The Live Feed',
      text: 'Everything that happens on your site shows up here. Once you own pages, click them to read the comments.' },
    { target: () => $('btn-help'), title: 'Learn as you go',
      text: 'Chaos, Stability, Upgrades and more appear one at a time, each with a short note. Forgot a term? Press ? anytime.',
      next: 'Start playing' },
  ];

  let tour = null;

  function visible(node) {
    if (!node || node.hidden) return false;
    const r = node.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function startTour() {
    if (tour) endTour(false);
    const card = h('div', { class: 'tour-card', role: 'dialog', 'aria-modal': 'false', 'aria-live': 'polite' });
    const root = h('div', { class: 'tour' }, [h('div', { class: 'tour-shade' }), h('div', { class: 'tour-spot' }), card]);
    document.body.appendChild(root);
    tour = { root, card, shade: root.children[0], spot: root.children[1], index: 0, target: null, raf: 0 };
    tour.onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); endTour(true); }
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', tour.onKey);
    show(0);
    loop();
  }

  function go(dir) {
    if (!tour) return;
    let i = tour.index + dir;
    // Skip steps whose target is not on screen (for example, a collapsed layout).
    while (i > 0 && i < STEPS.length && STEPS[i].target && !visible(STEPS[i].target())) i += dir;
    if (i >= STEPS.length) { endTour(true); return; }
    show(Math.max(0, i));
  }

  function show(i) {
    const step = STEPS[i], s = game.s;
    tour.index = i;
    tour.target = step.target ? step.target() : null;
    const card = tour.card;
    card.textContent = '';
    const back = h('button', { type: 'button', class: 'btn', text: 'Back', hidden: i === 0 });
    const next = h('button', { type: 'button', class: 'btn btn-primary', text: step.next || 'Next' });
    const skip = h('button', { type: 'button', class: 'link-btn tour-skip', text: 'Skip tour' });
    back.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    skip.addEventListener('click', () => endTour(true));
    if (i === 0) card.appendChild(h('img', { class: 'tour-logo', src: 'assets/internet-chaos-logo-480.png', alt: 'Internet Chaos', width: '480', height: '270' }));
    card.append(
      h('div', { class: 'tour-count', text: (i + 1) + ' / ' + STEPS.length }),
      h('h3', { class: 'tour-title', text: typeof step.title === 'function' ? step.title(s) : step.title }),
      h('p', { class: 'tour-text', text: step.text }),
    );
    if (step.extra) card.appendChild(step.extra());
    card.appendChild(h('div', { class: 'tour-actions' }, [i < STEPS.length - 1 ? skip : h('span'), h('span', { class: 'tour-gap' }), back, next]));
    tour.root.classList.toggle('is-center', !tour.target);
    if (tour.target) tour.target.scrollIntoView({ block: 'center', behavior: s.settings.reduceMotion ? 'auto' : 'smooth' });
    next.focus({ preventScroll: true });
    place();
  }

  /** Follows the target every frame, so scrolling and resizing never misplace the tour. */
  function loop() {
    if (!tour) return;
    place();
    tour.raf = requestAnimationFrame(loop);
  }

  function place() {
    const t = tour, card = t.card, gap = 12;
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    if (!t.target) {
      card.style.left = Math.max(gap, (vw - cw) / 2) + 'px';
      card.style.top = Math.max(gap, (vh - ch) / 2) + 'px';
      return;
    }
    const r = t.target.getBoundingClientRect(), pad = 6;
    const spot = t.spot.style;
    spot.left = (r.left - pad) + 'px';
    spot.top = (r.top - pad) + 'px';
    spot.width = (r.width + pad * 2) + 'px';
    spot.height = (r.height + pad * 2) + 'px';
    const below = vh - r.bottom - pad, above = r.top - pad;
    let top;
    if (below >= ch + gap * 2) top = r.bottom + pad + gap;
    else if (above >= ch + gap * 2) top = r.top - pad - gap - ch;
    else top = vh - ch - gap;   // tall target: sit over its lower part
    const left = Math.min(Math.max(gap, r.left + r.width / 2 - cw / 2), vw - cw - gap);
    card.style.left = left + 'px';
    card.style.top = Math.max(gap, top) + 'px';
  }

  function endTour(done) {
    if (!tour) return;
    cancelAnimationFrame(tour.raf);
    document.removeEventListener('keydown', tour.onKey);
    tour.root.remove();
    tour = null;
    if (done && !game.s.flags.tutorial) {
      game.s.flags.tutorial = true;
      Z.save.write(game.s);
      ui.toast({ icon: '❔', title: 'Tour finished', text: 'Press ? in the top bar anytime for help.', kind: 'info' });
    }
  }

  /** Starts the tour for a brand-new game (not for imported or long-running saves). */
  function maybeTour() {
    const s = game.s;
    if (s.flags.tutorial || s.stats.totalAttention >= 100 || s.stats.eras > 0 || tour) return;
    setTimeout(startTour, 250);
  }

  function init(g) {
    game = g;
    $('btn-help').addEventListener('click', open);
  }

  ui.help = { init, open, startTour, maybeTour, endTour };
})(window.ICHAOS = window.ICHAOS || {});
