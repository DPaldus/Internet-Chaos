/* Live Feed pages: the Blog Post, Meme Page and Comment Section as living corners of the
   player's website. People keep commenting in the background, and the Chaos meter decides
   how they behave: civil at low Chaos, heated in the middle, unhinged at the top.
   Cosmetic only. Nothing here touches the economy or the save, so it uses Math.random. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText } = ui;
  const C = Z.CHAT;

  const MAX_MSGS = 90;
  const TICK_MS = 250;
  const TOPIC_SECONDS = 300;                       // pages move on to a new post every ~5 minutes
  const BASE_INTERVAL = { blog: 6.5, meme: 5, comments: 4 };
  const VIEW_SHARE = { blog: 0.6, meme: 0.9, comments: 1.1 };
  const TIERS = ['low', 'mid', 'high'];
  const ARGUERS = { troll: 3, wrong: 3, drama: 2, defensive: 2, pedant: 2, story: 1.5, serious: 1.2 };

  let game = null;
  const pages = Object.create(null);
  let view = null;     // the open page view
  const tiles = Object.create(null);

  /* ---------- Small helpers ---------- */

  const rand = Math.random;
  const pick = list => list[Math.floor(rand() * list.length)];
  const between = (a, b) => a + Math.floor(rand() * (b - a + 1));

  function weighted(pairs) {
    let total = 0;
    for (const p of pairs) total += p[1];
    let r = rand() * total;
    for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  }

  function chaos() { return game ? game.s.res.chaos : 0; }

  /** Low Chaos is mostly civil with the odd weird comment; high Chaos is mostly unhinged.
      What the admin just said nudges it for a while: "calm down" cools the page, insults
      and shouting heat it up. */
  function tierFor(ch, p) {
    const pg = p || (view && view.p);
    if (pg && pg.nudge && Date.now() < pg.nudge.until) ch = Math.max(0, Math.min(100, ch + pg.nudge.by));
    return weighted([
      ['low', Math.max(0.04, 1 - ch / 45)],
      ['mid', Math.max(ch < 15 ? 0.03 : 0.06, 1 - Math.abs(ch - 52) / 38)],
      ['high', Math.max(0, (ch - 42) / 38)],
    ]);
  }

  function mood(ch) {
    if (ch < 20) return { icon: '😊', name: 'Civil', key: 'civil' };
    if (ch < 40) return { icon: '🙂', name: 'Lively', key: 'lively' };
    if (ch < 60) return { icon: '😤', name: 'Heated', key: 'heated' };
    if (ch < 80) return { icon: '🤬', name: 'Feral', key: 'feral' };
    return { icon: '🔥', name: 'Unhinged', key: 'unhinged' };
  }

  function parseLine(line) {
    const i = line.indexOf('|');
    return { pers: line.slice(0, i), text: line.slice(i + 1) };
  }

  function hue(name) {
    let x = 0;
    for (let i = 0; i < name.length; i++) x = (x * 31 + name.charCodeAt(i)) >>> 0;
    return x % 360;
  }

  function ago(t) {
    const s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 5) return 'now';
    if (s < 60) return s + 's';
    if (s < 3600) return Math.floor(s / 60) + 'm';
    return Math.floor(s / 3600) + 'h';
  }

  /* ---------- Page state ---------- */

  function topicOf(p) { return p.def.topics[p.topic]; }

  function makePage(def) {
    const topic = nextTopic(null, def);
    return {
      def, topic, topicAge: rand() * topicSeconds(def) * 0.5, shown: [topic],
      msgs: [], seq: 0, next: 0.5 + rand() * 2, threads: [], played: Object.create(null), cast: Object.create(null),
      recent: [], total: 0, viewers: 0, stamps: [], latest: null, typing: [], said: null, nudge: null, lastSaid: '',
    };
  }

  function topicSeconds(def) { return def.topicSeconds || TOPIC_SECONDS; }

  /** The next post: a random one this era allows, and not one shown lately. */
  function nextTopic(p, def) {
    def = def || p.def;
    const era = game ? Math.min(game.s.era, Z.ERAS.length) : 1;
    const ok = [];
    def.topics.forEach((t, i) => { if (!t.eras || t.eras.indexOf(era) >= 0) ok.push(i); });
    const shown = p ? p.shown : [];
    const unseen = ok.filter(i => shown.indexOf(i) < 0);
    const list = unseen.length ? unseen : ok.filter(i => !p || i !== p.topic);
    return list.length ? pick(list) : 0;
  }

  function resetTopic(p, index) {
    p.topic = index;
    p.shown.push(index);
    if (p.shown.length > Math.max(2, Math.floor(p.def.topics.length * 0.6))) p.shown.shift();
    p.topicAge = 0;
    p.msgs = [];
    p.threads = [];
    p.recent = [];
    p.stamps = [];
    p.cast = Object.create(null);
    p.total = between(4, 30) + Math.round(Math.sqrt(owned(p)) * 6);
    backfill(p, 7);
  }

  function owned(p) { return (game && game.s.buildings[p.def.id]) || 0; }

  /** A page never opens empty: write a few comments that "already happened". */
  function backfill(p, count) {
    const now = Date.now();
    for (let i = 0; i < count; i++) generate(p, true);
    let t = now - between(5, 20) * 1000;
    for (let i = p.msgs.length - 1; i >= 0; i--) {
      p.msgs[i].t = t;
      t -= between(9, 45) * 1000;
    }
  }

  /* ---------- Who says it ---------- */

  function userFor(p, pers, avoid) {
    if (pers === 'mod') return pick(C.MODS);
    if (pers === 'spam') return pick(C.SPAMMERS);
    const taken = u => u === avoid || (avoid && avoid.indexOf && avoid.indexOf(u) >= 0);
    const same = Object.keys(p.cast).filter(u => p.cast[u] === pers && !taken(u));
    if (same.length && rand() < 0.5) return pick(same);
    const fits = (C.AFFINITY[pers] || []).filter(u => !p.cast[u] && !taken(u));
    let name = fits.length && rand() < 0.6 ? pick(fits) : null;
    for (let i = 0; !name && i < 20; i++) {
      const u = pick(C.USERS);
      if (!p.cast[u] && !taken(u)) name = u;
    }
    if (!name) { do { name = pick(C.USERS); } while (taken(name)); }
    p.cast[name] = pers;
    return name;
  }

  function otherUser(p, not) {
    const list = p.msgs.slice(-12).map(m => m.user).filter(u => u !== not);
    return list.length ? pick(list) : pick(C.USERS);
  }

  function fill(p, text, ctx) {
    return text.replace(/\{(@|\w+)\}/g, (all, k) => {
      if (k === 'site') return Z.siteName(game.s);
      if (k === 'me') return Z.siteName(game.s);
      if (ctx && ctx.said) {
        const said = ctx.said;
        if (k === 'echo') return said.echo;
        if (k === 'ECHO') return said.echo.toUpperCase();
        if (k === 'word') return said.word;
        if (k === 'Word') return said.word.charAt(0).toUpperCase() + said.word.slice(1);
        if (k === 'WORD') return said.word.toUpperCase();
        if (k === 'num') return said.num || String(between(2, 99));
      }
      if (k === '@') return ctx && ctx.to ? '@' + ctx.to : 'everyone';
      if (k === 'u') return '@' + otherUser(p, ctx && ctx.user);
      if (k === 'n') return String(between(2, 99));
      if (k === 'N') return between(120, 9800).toLocaleString('en-US');
      if (k === 'trend') {
        const b = game.s.trend && game.s.trend.id ? Z.B[game.s.trend.id] : null;
        return b ? b.plural : 'Blog Posts';
      }
      if (k === 'before') return (ctx && ctx.before) || 'the old name';
      return all;
    });
  }

  /** At high Chaos people edit, shout and double-post. */
  function mutate(text, pers, ch) {
    if (ch < 60) return text;
    const r = (ch - 60) / 40;
    if ((pers === 'drama' || pers === 'defensive') && text.length < 110 && rand() < 0.3 * r) text = text.toUpperCase();
    if (rand() < 0.14 * r) text += '\n' + pick(C.EDITS);
    return text;
  }

  /* ---------- Posting ---------- */

  function initialVotes(tier) {
    if (tier === 'low') return between(1, 24);
    if (tier === 'mid') return between(-6, 45);
    return between(-45, 140);
  }

  function post(p, o) {
    const parent = o.parent || null;
    const msg = {
      id: ++p.seq, user: o.user, pers: o.pers, text: o.text, kind: o.kind || 'user', t: Date.now(),
      votes: o.votes !== undefined ? o.votes : initialVotes(o.tier || 'low'), myVote: 0,
      parentId: parent ? parent.id : null, parentUser: parent ? parent.user : null,
      parentText: parent ? parent.text.split('\n')[0].slice(0, 200) : null, removed: false,
      op: o.op || false, bot: !!o.bot, hot: chaos() >= 80,
    };
    p.msgs.push(msg);
    while (p.msgs.length > MAX_MSGS) p.msgs.shift();
    p.total++;
    p.stamps.push(msg.t);
    p.latest = msg;
    if (!o.quiet) {
      if (view && view.p === p) appendMsg(msg);
      updateTile(p);
    }
    return msg;
  }

  function remember(p, text) {
    p.recent.push(text);
    if (p.recent.length > 40) p.recent.shift();
  }

  /** A line nobody said lately; if all were said, the one said longest ago. */
  function fresh(p, list) {
    const unsaid = list.filter(line => p.recent.indexOf(line) < 0);
    if (unsaid.length) return pick(unsaid);
    let best = list[0], bestAt = Infinity;
    for (const line of list) {
      const at = p.recent.lastIndexOf(line);
      if (at < bestAt) { best = line; bestAt = at; }
    }
    return best;
  }

  /** Say one content line ('pers|text'). */
  function say(p, line, ctx) {
    ctx = ctx || {};
    const ch = chaos();
    const { pers, text } = parseLine(line);
    remember(p, line);
    const user = ctx.user || userFor(p, pers, ctx.parent ? ctx.parent.user : null);
    const tier = ctx.tier || tierFor(ch, p);
    let body = fill(p, text, { to: ctx.parent ? ctx.parent.user : null, user, before: ctx.before, said: ctx.said });
    if (!ctx.noMutate) body = mutate(body, pers, ch);
    const msg = post(p, { user, pers, text: body, parent: ctx.parent, tier, kind: pers === 'mod' ? 'mod' : pers === 'spam' ? 'spam' : 'user', bot: ctx.bot, quiet: ctx.quiet });
    if (!ctx.quiet) aftermath(p, msg, ch);
    return msg;
  }

  /** Double posts and moderator removals at high Chaos. */
  function aftermath(p, msg, ch) {
    if (msg.kind !== 'user' || ch < 65) return;
    if (rand() < (ch - 65) / 450) setTimeout(() => post(p, { user: msg.user, pers: msg.pers, text: msg.text, tier: 'high', kind: 'dup' }), between(400, 1400));
    if (rand() < (ch - 65) / 300) {
      const mods = ['volunteer', 'automod', 'tns', 'oversight', 'aimod'].some(id => (game.s.buildings[id] || 0) > 0);
      setTimeout(() => removeMsg(p, msg, mods), between(2500, 7000));
    }
  }

  function removeMsg(p, msg, byMod) {
    if (msg.removed) return;
    msg.removed = true;
    msg.text = byMod ? '[removed by moderator]' : pick(['[deleted]', '[deleted by user. we all saw it]', '[comment deleted out of shame]']);
    if (view && view.p === p) {
      const node = view.nodes[msg.id];
      if (node) { node.classList.add('is-removed'); setText(node.querySelector('.cm-text'), msg.text); }
    }
    if (p.latest === msg) updateTile(p);
  }

  /* ---------- Conversations ---------- */

  function threadPool(p, tier) {
    const all = topicOf(p).threads.concat(p.def.threads);
    const rank = TIERS.indexOf(tier);
    const ok = all.filter(t => {
      const r = TIERS.indexOf(t.tier);
      return rank === 0 ? r === 0 : rank === 1 ? r <= 1 : r >= 1;
    });
    let unplayed = ok.filter(t => !p.played[all.indexOf(t)]);
    if (!unplayed.length) { p.played = Object.create(null); unplayed = ok; }
    return { all, list: unplayed };
  }

  function startThread(p, tier) {
    const { all, list } = threadPool(p, tier);
    if (!list.length) return false;
    const def = pick(list);
    p.played[all.indexOf(def)] = true;
    p.threads.push({ def, i: 0, users: {}, msgs: [] });
    return advanceThread(p, p.threads[p.threads.length - 1]);
  }

  function advanceThread(p, th) {
    const step = th.def.steps[th.i];
    const m = /^([A-Z])(?:>(\d+))?\|([\s\S]*)$/.exec(step);
    th.i++;
    if (th.i >= th.def.steps.length) p.threads.splice(p.threads.indexOf(th), 1);
    if (!m) return false;
    const letter = m[1], pers = th.def.cast[letter];
    if (!th.users[letter]) {
      const others = Object.keys(th.users).map(k => th.users[k]);
      th.users[letter] = userFor(p, pers, others);
    }
    const parent = m[2] !== undefined ? th.msgs[Number(m[2])] : null;
    const msg = say(p, pers + '|' + m[3], { user: th.users[letter], parent, tier: th.def.tier, noMutate: true });
    th.msgs.push(msg);
    return true;
  }

  /** Someone answers a recent comment, in character. */
  function reply(p, tier) {
    const pool = p.msgs.slice(-14).filter(m => m.kind === 'user' && !m.removed);
    if (!pool.length) return false;
    const target = weighted(pool.map((m, i) => [m, (ARGUERS[m.pers] || 1) * (1 + i / 6)]));
    const ch = chaos();
    const reacts = (C.REACTS[target.pers] || C.REACTS.reg).slice();
    if (ch > 55) reacts.push(['troll', ch / 40], ['drama', ch / 50]);
    if (ch > 45 && hasMods()) reacts.push(['mod', 0.4]);
    const pers = weighted(reacts);
    const lines = C.REPLIES[pers];
    if (!lines) return false;
    const list = lines[tier] || lines.mid || lines.low;
    const user = userFor(p, pers, target.user);
    say(p, fresh(p, list.map(x => pers + '|' + x)), { parent: target, user, tier });
    return true;
  }

  function hasMods() {
    return ['volunteer', 'automod', 'tns', 'oversight', 'aimod'].some(id => (game.s.buildings[id] || 0) > 0);
  }

  /** One new comment on a page. `quiet` writes history without touching the DOM. */
  function generate(p, quiet) {
    const g = game, ch = chaos(), tier = tierFor(ch, p);
    const ctxQuiet = quiet ? { quiet: true } : {};

    if (!quiet && p.threads.length && rand() < 0.72) return advanceThread(p, pick(p.threads));

    // For a couple of minutes, people keep bringing up what the admin said.
    if (!quiet && p.said && Date.now() < p.said.until && rand() < 0.09) {
      return say(p, fresh(p, C.PLAYER.AFTER), { said: p.said, noMutate: true });
    }
    if (!quiet) {
      for (const sit of C.SITUATIONS) {
        if (rand() < sit.chance && sit.when(g)) return say(p, fresh(p, sit.lines), { bot: sit.bot });
      }
    }
    if (ch > 72 && rand() < (ch - 72) / 140) {
      return say(p, fresh(p, C.SPAM.map(x => 'spam|' + x)), Object.assign({ tier: 'high', noMutate: true }, ctxQuiet));
    }
    if (!quiet && ch > 45 && hasMods() && rand() < 0.05) {
      return say(p, 'mod|' + pick(ch > 75 ? C.MOD_LINES.high : C.MOD_LINES.mid), { noMutate: true });
    }
    const maxThreads = ch > 70 ? 3 : ch > 35 ? 2 : 1;
    if (!quiet && p.threads.length < maxThreads && rand() < 0.14 + ch / 350 && startThread(p, tier)) return true;
    if (p.msgs.length > 2 && rand() < (quiet ? 0.2 : 0.2 + ch / 280)) {
      if (replyQuiet(p, tier, quiet)) return true;
    }
    const topic = topicOf(p);
    const topicUnsaid = topic[tier].filter(line => p.recent.indexOf(line) < 0);
    const list = topicUnsaid.length && rand() < 0.5 ? topicUnsaid : topic[tier].concat(p.def[tier]);
    return say(p, fresh(p, list), Object.assign({ tier }, ctxQuiet));
  }

  function replyQuiet(p, tier, quiet) {
    if (!quiet) return reply(p, tier);
    const target = pick(p.msgs.filter(m => m.kind === 'user'));
    if (!target) return false;
    const pers = weighted(C.REACTS[target.pers] || C.REACTS.reg);
    const lines = C.REPLIES[pers];
    if (!lines) return false;
    say(p, fresh(p, (lines[tier] || lines.low).map(x => pers + '|' + x)), { parent: target, tier, quiet: true });
    return true;
  }

  function interval(p) {
    const ch = chaos();
    let t = BASE_INTERVAL[p.def.id] * (1 - 0.82 * ch / 100);
    if (!owned(p)) t *= 2;
    if (game.s.meltdown > 0) t *= 0.6;
    return t * (0.55 + rand() * 0.9);
  }

  /* ---------- Reacting to the game ---------- */

  function react(key, ctx) {
    const r = C.REACTIONS[key];
    if (!r) return;
    const targets = r.page === '*' ? C.PAGES.map(d => pages[d.id]) : [pages[r.page]];
    for (const p of targets) {
      if (!p) continue;
      const count = r.burst || 1;
      const lines = r.lines.slice().sort(() => rand() - 0.5).slice(0, count);
      lines.forEach((line, i) => setTimeout(() => say(p, line, Object.assign({ noMutate: true }, ctx)), 600 + i * between(700, 1600) + rand() * 1500));
    }
  }

  /* ---------- Engine ---------- */

  function tick() {
    if (!game) return;
    const dt = TICK_MS / 1000;
    const now = Date.now();
    for (const def of C.PAGES) {
      const p = pages[def.id];
      p.topicAge += dt;
      if (p.topicAge > topicSeconds(def) && !(view && view.p === p)) {
        resetTopic(p, nextTopic(p));
        updateTile(p);
        continue;
      }
      p.next -= dt;
      if (p.next <= 0) {
        if (!(p.hush > Date.now())) generate(p, false);     // quiet while the admin gets answers
        p.next = interval(p);
      }
      while (p.stamps.length && now - p.stamps[0] > 60000) p.stamps.shift();
      const target = viewerTarget(p);
      p.viewers += (target - p.viewers) * 0.08;
      driftVotes(p);
    }
  }

  function viewerTarget(p) {
    const aps = (game.c && game.c.aps) || 0;
    const base = 2 + Math.pow(owned(p), 0.8) * 3 + Math.pow(Math.max(0, aps), 0.42) * VIEW_SHARE[p.def.id];
    const meltdown = game.s.meltdown > 0 ? 0.3 : 1;
    return base * (1 + chaos() / 120) * meltdown * (0.94 + rand() * 0.12);
  }

  function driftVotes(p) {
    const ch = chaos();
    const n = p.msgs.length;
    if (!n || rand() > 0.5) return;
    const m = p.msgs[n - 1 - Math.floor(Math.pow(rand(), 2) * Math.min(n, 20))];
    if (!m || m.removed) return;
    const swing = ch > 70 ? between(-6, 7) : ch > 40 ? between(-2, 4) : between(0, 2);
    m.votes += m.kind === 'player' ? (m.drift || 0) * between(0, 3) : swing;
    if (view && view.p === p) {
      const node = view.nodes[m.id];
      if (node) setText(node._votes || (node._votes = node.querySelector('.cm-votes')), String(m.votes + m.myVote));
    }
  }

  /* ---------- Live Feed tiles ---------- */

  function buildTiles() {
    const box = $('feed-pages');
    if (!box) return;
    box.textContent = '';
    for (const def of C.PAGES) {
      const snippet = h('span', { class: 'fp-snippet', 'data-no-i18n': true });
      const stats = h('span', { class: 'fp-stats' });
      const node = h('button', { type: 'button', class: 'fp-tile fp-' + def.id, title: 'Open the ' + def.name }, [
        h('span', { class: 'fp-icon', 'aria-hidden': 'true', text: def.icon }),
        h('span', { class: 'fp-main' }, [
          h('span', { class: 'fp-name' }, [def.name, h('span', { class: 'fp-live', 'aria-hidden': 'true', text: '●' })]),
          stats, snippet,
        ]),
      ]);
      node.addEventListener('click', () => open(def.id));
      box.appendChild(node);
      tiles[def.id] = { node, snippet, stats };
    }
    for (const def of C.PAGES) updateTile(pages[def.id]);
  }

  function updateTile(p) {
    const t = tiles[p.def.id];
    if (!t) return;
    const m = p.latest;
    setText(t.snippet, m ? m.user + ': ' + m.text.split('\n')[0] : p.def.blurb);
    renderTileStats(p);
    ui.replay(t.node, 'ping');
  }

  function renderTileStats(p) {
    const t = tiles[p.def.id];
    if (!t) return;
    setText(t.stats, '💬 ' + Z.fmt.int(p.total) + ' · 👀 ' + Z.fmt.int(Math.max(1, Math.round(p.viewers))) + ' here');
  }

  /* ---------- Page view ---------- */

  function open(id) {
    const p = pages[id] || pages.blog;
    const root = h('div', { class: 'cpage' });
    const v = { p, root, nodes: Object.create(null), unseen: 0, replyTo: null };
    // Opening a modal closes the previous one first, so only clear `view` if it is still ours.
    v.dialog = ui.modal.open({
      id: 'chat', title: p.def.name, body: root, wide: true, className: 'modal-chat',
      onClose: () => { if (view === v) view = null; },
      refresh: refreshView,
    });
    view = v;
    renderView();
    Z.audio.play('popup');
  }

  function switchTo(id) {
    if (!view) return open(id);
    view.p = pages[id];
    view.nodes = Object.create(null);
    view.unseen = 0;
    view.replyTo = null;
    renderView();
  }

  function renderView() {
    const p = view.p, def = p.def, s = game.s;
    const root = view.root;
    root.textContent = '';
    root.dataset.page = def.id;
    const title = view.dialog && view.dialog.querySelector('.modal-title');
    if (title) title.textContent = Z.siteName(s) + ' · ' + def.name;

    const tabs = h('div', { class: 'cp-tabs', role: 'tablist', 'aria-label': 'Pages' }, C.PAGES.map(d => h('button', {
      type: 'button', role: 'tab', class: 'cp-tab' + (d.id === def.id ? ' is-on' : ''), 'aria-selected': d.id === def.id ? 'true' : 'false',
      onclick: () => switchTo(d.id),
    }, [h('span', { 'aria-hidden': 'true', text: d.icon }), ' ' + d.name])));

    const topic = topicOf(p);
    view.viewers = h('span', { class: 'cp-viewers' });
    view.mood = h('span', { class: 'cp-mood' });
    const addr = h('div', { class: 'cp-addr' }, [
      h('span', { class: 'cp-url', text: '🔒 ' + Z.siteSlug(s) + '.' + ['web', 'social', 'lol', 'io', 'ai', 'corp', 'void'][Math.min(s.era, 7) - 1] + '/' + def.path + '/' + topic.slug }),
      h('span', { class: 'cp-presence' }, [view.viewers, view.mood]),
    ]);

    view.count = h('span', { class: 'cp-count' });
    view.rate = h('span', { class: 'cp-rate' });
    const nextBtn = h('button', { type: 'button', class: 'link-btn', text: 'Next post ›', onclick: () => { resetTopic(p, nextTopic(p)); updateTile(p); renderView(); } });
    const meta = h('div', { class: 'cp-meta' }, [view.count, view.rate, nextBtn]);

    view.stream = h('ol', { class: 'cp-stream', 'aria-live': 'polite', 'aria-label': 'Comments', 'data-no-i18n': true });
    view.typing = h('div', { class: 'cp-typing', hidden: true });
    view.jump = h('button', { type: 'button', class: 'cp-jump', hidden: true, onclick: () => { scrollBottom(); view.unseen = 0; setJump(); } });

    view.replyNote = h('div', { class: 'cp-replying', hidden: true });
    view.input = h('input', { type: 'text', class: 'cp-input', maxlength: '200', autocomplete: 'off', 'aria-label': 'Write a comment',
      placeholder: 'Comment as ' + Z.siteName(s) + ' (admin)…' });
    const form = h('form', { class: 'cp-compose' }, [view.input, h('button', { type: 'submit', class: 'btn btn-primary', text: 'Post' })]);
    form.addEventListener('submit', e => { e.preventDefault(); playerPost(); });

    view.scroller = h('div', { class: 'cp-scroll' }, [renderContent(p, topic), meta, view.stream, view.typing, view.jump]);
    view.scroller.addEventListener('scroll', () => {
      if (view && view.unseen && nearBottom()) { view.unseen = 0; setJump(); }
    });
    root.append(tabs, addr, view.scroller, view.replyNote, form);
    for (const m of p.msgs) view.stream.appendChild(renderMsg(m, false));
    refreshView();
    renderTyping(p);
    requestAnimationFrame(scrollBottom);
  }

  function renderContent(p, topic) {
    const s = game.s, def = p.def, site = Z.siteName(s);
    if (def.id === 'blog') {
      return h('article', { class: 'cp-post cp-article', 'data-no-i18n': true }, [
        h('div', { class: 'cp-kicker', text: site + ' · Blog' }),
        h('h3', { class: 'cp-title', text: topic.title }),
        h('div', { class: 'cp-byline', text: 'by the ' + site + ' editorial team · ' + topic.read + ' min read' }),
        h('p', { class: 'cp-body', text: topic.body }),
      ]);
    }
    if (def.id === 'meme') {
      return h('figure', { class: 'cp-post cp-meme', 'data-no-i18n': true }, [
        renderMeme(topic),
        h('figcaption', { class: 'cp-byline', text: 'posted by ' + Z.siteSlug(s) + '_official · "' + topic.title + '" · 🔁 ' + Z.fmt.int(400 + p.total * 37) + ' reposts' }),
      ]);
    }
    return h('div', { class: 'cp-post cp-thread', 'data-no-i18n': true }, [
      h('div', { class: 'cp-kicker', text: site + ' Forum · posted by ' + topic.op }),
      h('h3', { class: 'cp-title', text: topic.title }),
      h('p', { class: 'cp-body', text: topic.body }),
    ]);
  }

  /** Draws a meme from emoji and text, in its format (js/content/memes.js). The words are
      part of the picture, so they stay in English like the rest of the jokes. */
  function renderMeme(t) {
    const kind = t.kind || 'classic', at = (x, y) => 'left:' + x + '%;top:' + y + '%';
    let art;
    if (kind === 'drake' || kind === 'brain' || kind === 'panik' || kind === 'gru') {
      art = h('div', { class: 'meme-art meme-rows meme-' + kind }, t.rows.map(r => h('div', { class: 'mr' }, [
        h('span', { class: 'mr-pic', 'aria-hidden': 'true' }, [r[0], kind === 'panik' ? h('b', { class: 'mr-tag', text: r[1] }) : null]),
        h('span', { class: 'mr-txt', text: kind === 'panik' ? r[2] : r[1] }),
      ])));
    } else if (kind === 'scene') {
      const sc = t.scene, parts = [];
      for (const it of sc.items) {
        if (it.sign) parts.push(h('span', { class: 'ms-sign', style: at(it.x, it.y), text: it.sign }));
        else parts.push(h('span', { class: 'ms-e' + (it.flip ? ' is-flip' : ''), 'aria-hidden': 'true', style: at(it.x, it.y) + ';--s:' + it.s, text: it.e }));
        if (it.label) parts.push(h('span', { class: 'ms-label', style: at(it.lx, it.ly) + (it.w ? ';max-width:' + it.w + '%' : ''), text: it.label }));
      }
      art = h('div', { class: 'meme-art meme-scene', style: '--meme-bg:' + sc.bg }, [
        sc.top ? h('span', { class: 'meme-top ms-top', text: sc.top }) : null,
        ...parts,
        sc.bottom ? h('span', { class: 'meme-bottom ms-bottom', text: sc.bottom }) : null,
      ]);
    } else if (kind === 'buttons') {
      art = h('div', { class: 'meme-art meme-buttons' }, [
        h('div', { class: 'mb-btns' }, t.buttons.map(b => h('span', { class: 'mb-btn', text: b }))),
        h('div', { class: 'mb-who', 'aria-hidden': 'true' }, [t.who, h('span', { class: 'mb-sweat', text: '💦' })]),
        h('span', { class: 'meme-bottom', text: t.caption }),
      ]);
    } else if (kind === 'trade') {
      art = h('div', { class: 'meme-art meme-trade' }, [
        h('div', { class: 'mt-head', text: 'TRADE OFFER' }),
        h('div', { class: 'mt-body' }, [
          h('div', { class: 'mt-col' }, [h('b', { text: 'i receive:' }), h('span', { text: t.give })]),
          h('span', { class: 'mt-hand', 'aria-hidden': 'true', text: '🤝' }),
          h('div', { class: 'mt-col' }, [h('b', { text: 'you receive:' }), h('span', { text: t.get })]),
        ]),
      ]);
    } else if (kind === 'nobody') {
      art = h('div', { class: 'meme-art meme-nobody' }, [
        h('p', { text: 'Nobody:' }), h('p', { text: 'Absolutely nobody:' }), h('p', { text: t.who + ':' }),
        h('div', { class: 'mn-punch' }, [h('span', { class: 'mn-emoji', 'aria-hidden': 'true', text: t.emoji }), h('b', { text: t.punch })]),
      ]);
    } else if (kind === 'tweet') {
      art = h('div', { class: 'meme-art meme-tweet' }, [
        h('div', { class: 'mw-head' }, [
          h('span', { class: 'mw-ava', 'aria-hidden': 'true', text: t.avatar }),
          h('span', { class: 'mw-who' }, [h('b', { text: t.name + ' ✓' }), h('span', { text: t.handle })]),
        ]),
        h('p', { class: 'mw-text', text: t.text }),
        h('div', { class: 'mw-foot', text: '💬 ' + t.replies + '   🔁 ' + t.reposts + '   ❤️ ' + t.likes }),
      ]);
    } else if (kind === 'texts') {
      art = h('div', { class: 'meme-art meme-texts' }, [
        h('div', { class: 'mx-head', text: t.with }),
        ...t.bubbles.map(([who, text]) => h('span', { class: 'mx-bubble mx-' + who, text })),
      ]);
    } else {
      art = h('div', { class: 'meme', style: '--meme-bg:' + t.bg }, [
        h('span', { class: 'meme-top', text: t.top }),
        h('span', { class: 'meme-pic', 'aria-hidden': 'true' }, [t.hat ? h('span', { class: 'meme-hat', text: t.hat }) : null, t.emoji]),
        h('span', { class: 'meme-bottom', text: t.bottom }),
      ]);
    }
    art.setAttribute('data-no-i18n', '');
    return art;
  }

  function badge(text, cls) { return h('span', { class: 'cm-badge ' + cls, text }); }

  function renderMsg(m, isNew) {
    const isPlayer = m.kind === 'player';
    const head = h('div', { class: 'cm-head' }, [
      h('b', { class: 'cm-user', text: m.user }),
      isPlayer ? badge('ADMIN', 'b-admin') : null,
      m.kind === 'mod' ? badge('MOD', 'b-mod') : null,
      m.bot ? badge('BOT?', 'b-bot') : null,
      m.kind === 'spam' ? badge('SPAM', 'b-spam') : null,
      m.kind === 'dup' ? badge('double post', 'b-dup') : null,
      h('span', { class: 'cm-time', text: ago(m.t) }),
    ]);
    const votes = h('span', { class: 'cm-votes', text: String(m.votes + m.myVote) });
    const up = h('button', { type: 'button', class: 'cm-vote', 'aria-label': 'Upvote', text: '▲' });
    const down = h('button', { type: 'button', class: 'cm-vote', 'aria-label': 'Downvote', text: '▼' });
    const vote = dir => {
      m.myVote = m.myVote === dir ? 0 : dir;
      up.classList.toggle('is-on', m.myVote === 1);
      down.classList.toggle('is-on', m.myVote === -1);
      setText(votes, String(m.votes + m.myVote));
    };
    up.addEventListener('click', () => vote(1));
    down.addEventListener('click', () => vote(-1));
    const replyBtn = h('button', { type: 'button', class: 'cm-reply', text: 'Reply', onclick: () => setReply(m) });
    const node = h('li', { class: 'cm cm-' + m.kind + (m.removed ? ' is-removed' : '') + (m.hot ? ' is-hot' : '') + (isNew ? ' is-new' : ''), 'data-id': String(m.id) }, [
      h('span', { class: 'cm-ava', 'aria-hidden': 'true', style: '--hue:' + hue(m.user), text: isPlayer ? '★' : m.kind === 'mod' ? '🛡' : m.user.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?' }),
      h('div', { class: 'cm-main' }, [
        head,
        m.parentUser ? h('div', { class: 'cm-quote', text: '↪ @' + m.parentUser + ': ' + m.parentText }) : null,
        h('div', { class: 'cm-text', text: m.text }),
        h('div', { class: 'cm-foot' }, [up, votes, down, replyBtn]),
      ]),
    ]);
    view.nodes[m.id] = node;
    return node;
  }

  function nearBottom() {
    const box = view && view.scroller;
    if (!box) return true;
    return box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  function scrollBottom() {
    if (!view) return;
    view.scroller.scrollTop = view.scroller.scrollHeight;
  }

  function setJump() {
    if (!view) return;
    view.jump.hidden = view.unseen <= 0;
    setText(view.jump, '↓ ' + view.unseen + ' new comment' + (view.unseen === 1 ? '' : 's'));
  }

  function appendMsg(m) {
    const stick = nearBottom();
    view.stream.appendChild(renderMsg(m, true));
    while (view.stream.children.length > MAX_MSGS) {
      const first = view.stream.firstChild;
      delete view.nodes[first.dataset.id];
      first.remove();
    }
    if (stick) scrollBottom();
    else { view.unseen++; setJump(); }
    if (m.hot && !game.s.settings.reduceMotion && chaos() >= 85) {
      ui.replay(view.root, 'jolt');
    }
  }

  function refreshView() {
    if (!view) return;
    const p = view.p, ch = chaos(), md = mood(ch);
    setText(view.viewers, '● ' + Z.fmt.int(Math.max(1, Math.round(p.viewers))) + ' here now');
    setText(view.mood, md.icon + ' ' + md.name + ' · Chaos ' + Math.round(ch) + '%');
    view.mood.className = 'cp-mood mood-' + md.key;
    view.root.dataset.mood = md.key;
    setText(view.count, Z.fmt.int(p.total) + ' comments');
    setText(view.rate, p.stamps.length + ' in the last minute');
    for (const m of p.msgs) {
      const node = view.nodes[m.id];
      if (node) setText(node._time || (node._time = node.querySelector('.cm-time')), ago(m.t));
    }
  }

  /* ---------- The player joins in ---------- */

  function setReply(m) {
    if (!view) return;
    view.replyTo = m;
    view.replyNote.textContent = '';
    view.replyNote.append('Replying to @' + m.user + ' ', h('button', { type: 'button', class: 'link-btn', text: 'Cancel', onclick: () => { view.replyTo = null; view.replyNote.hidden = true; } }));
    view.replyNote.hidden = false;
    view.input.focus();
  }

  /* Which kind of comment leads the replies, most telling first. */
  const PRIORITY = ['repeat', 'link', 'ban', 'czech', 'insult', 'calm', 'meme', 'caps', 'yesno', 'question', 'topic', 'hype', 'thanks',
    'sorry', 'praise', 'greet', 'bye', 'announce', 'money', 'chaos', 'laugh', 'agree', 'disagree', 'opinion', 'emoji', 'long',
    'short', 'number', 'mention'];
  const NUDGE = { calm: -25, praise: -10, thanks: -10, sorry: -15, insult: 20, ban: 15, caps: 20, meme: 10 };

  /** Reads the admin's comment: what kind it is, a short quote, its most telling word. */
  function analyze(p, text) {
    const pl = C.PLAYER, lower = text.toLowerCase();
    const letters = text.replace(/[^A-Za-zÀ-ž]/g, '');
    const words = lower.match(/[a-zà-ž][a-zà-ž']*/g) || [];
    const said = { text, intents: [], echo: '', word: '', num: null, mentions: [] };
    const add = id => { if (said.intents.indexOf(id) < 0) said.intents.push(id); };
    if (p.lastSaid && p.lastSaid === lower) add('repeat');
    for (const [id, re] of pl.INTENTS) {
      if (id === 'question') {
        if (/\?\s*$/.test(text) || /^(what|why|how|who|when|where|which|is|are|do|does|did|can|could|should|would|will|am|was|were|has|have|proč|proc|jak|kdo|kdy|kde)\b/i.test(lower)) add('question');
      } else if (re && re.test(text)) add(id);
    }
    if (said.intents.indexOf('question') >= 0 && /^(is|are|do|does|did|can|could|should|would|will|am|was|were|has|have)\b/.test(lower)) add('yesno');
    if (letters.length >= 6 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.7) add('caps');
    if (pl.CZECH.test(text)) add('czech');
    if (!letters.length && /\p{Extended_Pictographic}/u.test(text)) add('emoji');
    if (text.length >= 120) add('long');
    else if (words.length <= 1 && text.length <= 6) add('short');
    const num = /\d[\d,.]*/.exec(text);
    if (num) { said.num = num[0].replace(/[.,]$/, ''); add('number'); }
    for (const tag of text.match(/@[\w.-]+/g) || []) {
      const name = tag.slice(1).toLowerCase();
      const m = p.msgs.slice().reverse().find(x => x.kind === 'user' && x.user.toLowerCase() === name);
      if (m && said.mentions.indexOf(m) < 0) said.mentions.push(m);
    }
    if (said.mentions.length) add('mention');
    const tw = topicWords(topicOf(p));
    if (words.some(w => tw.indexOf(w.replace(/s$/, '')) >= 0)) add('topic');
    said.intents.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
    said.word = keyword(words) || (words.length ? words[words.length - 1] : text.slice(0, 20));
    said.echo = echoOf(text, said.word);
    said.mood = C.PLAYER.MOOD[said.intents[0]] || 'any';
    return said;
  }

  /** Words that tie a comment to the post it is under (cereal, umbrellas, the wifi cat…). */
  function topicWords(topic) {
    if (!topic._words) {
      const text = [topic.title, topic.slug, topic.top, topic.bottom].concat(topic.keys || []).join(' ').toLowerCase();
      topic._words = (text.match(/[a-z]{4,}/g) || []).filter(w => C.PLAYER.STOP.indexOf(w) < 0).map(w => w.replace(/s$/, ''));
    }
    return topic._words;
  }

  /** The most telling word: the longest one that is not filler. */
  function keyword(words) {
    let best = '';
    for (const w of words) {
      const clean = w.replace(/^'+|'+$/g, '');
      if (clean.length < 3 || C.PLAYER.STOP.indexOf(clean) >= 0) continue;
      if (clean.length >= best.length) best = clean;
    }
    return best;
  }

  /** A short quote of the comment: all of it if short, else the part around the key word. */
  function echoOf(text, word) {
    const trim = s => s.replace(/[\s.!?…,;:]+$/, '');
    const t = trim(text);
    if (t.length <= 50) return t;
    const parts = t.split(/(?<=[.!?;,])\s+/);
    let c = trim(parts.find(x => word && x.toLowerCase().indexOf(word) >= 0) || parts[0]);
    if (c.length <= 50) return c;
    const ws = c.split(' ');
    let i = ws.findIndex(w => word && w.toLowerCase().indexOf(word) >= 0);
    if (i < 0) i = 0;
    const from = Math.max(0, i - 3);
    return (from > 0 ? '…' : '') + ws.slice(from, from + 7).join(' ') + (from + 7 < ws.length ? '…' : '');
  }

  /** A real mistake in the comment for the pedant to correct, if there is one. */
  function pedantryFor(said) {
    if (said.intents.indexOf('czech') >= 0) return null;
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    for (const [re, line] of C.PLAYER.PEDANTRY) {
      const m = re.exec(said.text);
      if (m) return 'pedant|' + line.replace(/\{1\}/g, m[1] ? cap(m[1]) : '');
    }
    if (said.text.length > 18 && rand() < 0.3) {
      for (const [re, line] of C.PLAYER.STYLE_NITS) if (re.test(said.text)) return 'pedant|' + line;
    }
    return null;
  }

  function linesFor(id, tier, p) {
    if (id === 'topic') { const t = topicOf(p); return t[tier] || t.mid; }   // opinions on the post itself
    const L = C.PLAYER.LINES[id];
    if (!L) return null;
    return Array.isArray(L) ? L : (L[tier] || L.mid || L.low);
  }

  /** Who answers the admin, and with what: the person addressed first, then one reply per
      kind of comment (the pedant chiming in with a real correction), then quotes. */
  function planReplies(p, said, parent) {
    const ch = chaos(), tier = tierFor(ch, p), out = [];
    const strong = said.intents.some(i => i === 'insult' || i === 'ban' || i === 'caps' || i === 'meme' || i === 'czech');
    const want = (ch > 70 ? between(2, 4) : ch > 35 ? between(2, 3) : between(1, 2)) + (strong ? 1 : 0);
    const direct = [];
    if (parent && parent.kind === 'user') direct.push(parent);
    for (const m of said.mentions) if (direct.indexOf(m) < 0) direct.push(m);
    for (const m of direct.slice(0, 2)) {
      const bp = C.PLAYER.BY_PERS[m.pers] || C.PLAYER.BY_PERS.reg;
      const cls = said.intents.indexOf('question') >= 0 ? 'q' : said.mood;
      out.push({ line: m.pers + '|' + pick(bp[cls] || bp.any), user: m.user, to: m });
    }
    const total = want + out.length;
    const nit = rand() < 0.75 ? pedantryFor(said) : null;
    for (const id of said.intents) {
      if (out.length >= total) break;
      const list = linesFor(id, tier, p);
      if (!list) continue;
      const line = fresh(p, list);
      remember(p, line);
      out.push({ line });
    }
    if (nit) out.splice(Math.min(out.length, direct.length + 1), 0, { line: nit });
    while (out.length < total) {
      const line = fresh(p, linesFor('generic', tier));
      remember(p, line);
      out.push({ line });
    }
    return { tier, replies: out.slice(0, total + (nit ? 1 : 0)) };
  }

  /** "So-and-so is typing…" under the comments while replies are on their way. */
  function typing(p, user, from, until) {
    setTimeout(() => { p.typing.push(user); renderTyping(p); }, from);
    setTimeout(() => { const i = p.typing.indexOf(user); if (i >= 0) p.typing.splice(i, 1); renderTyping(p); }, until);
  }

  function renderTyping(p) {
    if (!view || view.p !== p || !view.typing) return;
    const list = p.typing;
    view.typing.hidden = !list.length;
    setText(view.typing, list.length === 1 ? list[0] + ' is typing…'
      : list.length === 2 ? list[0] + ' and ' + list[1] + ' are typing…'
        : list.length ? list[0] + ' and ' + (list.length - 1) + ' others are typing…' : '');
  }

  function playerPost() {
    if (!view) return;
    const text = view.input.value.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!text) { view.input.focus(); return; }
    const p = view.p;
    const parent = view.replyTo;
    view.input.value = '';
    view.replyTo = null;
    view.replyNote.hidden = true;
    const me = Z.siteName(game.s);
    const said = analyze(p, text);
    p.lastSaid = text.toLowerCase();
    const small = ['greet', 'bye', 'thanks', 'short', 'emoji', 'laugh', 'agree', 'disagree', 'repeat'].indexOf(said.intents[0]) >= 0;
    if (!small) p.said = { echo: said.echo, word: said.word, num: said.num, until: Date.now() + 150000 };
    const by = said.intents.reduce((sum, id) => sum + (NUDGE[id] || 0), 0);
    if (by) p.nudge = { by: Math.max(-30, Math.min(30, by)), until: Date.now() + 60000 };
    const msg = post(p, { user: me, pers: 'player', text, parent, kind: 'player', votes: 1 });
    // Kind words get upvoted; harsh ones get downvoted, unless the crowd is out for drama.
    msg.drift = said.mood === 'pos' ? 1 : said.mood === 'neg' ? (chaos() > 55 ? 1 : -1) : (rand() < 0.7 ? 1 : -1);
    scrollBottom();
    Z.audio.play('buy');

    const plan = planReplies(p, said, parent);
    const chosen = [me];
    let at = 900 + rand() * 900;
    for (const r of plan.replies) {
      const { pers, text: body } = parseLine(r.line);
      const user = r.user || userFor(p, pers, chosen);
      chosen.push(user);
      const when = at;
      typing(p, user, Math.max(0, when - between(1300, 2600)), when);
      setTimeout(() => say(p, r.line, { parent: msg, user, tier: plan.tier, said, noMutate: !!r.user }), when);
      at += between(900, 2000) + Math.min(2200, body.length * 15);
    }
    p.hush = Date.now() + at;            // the rest of the page mostly waits for the answers
    // Sometimes the thread takes off without the admin.
    if (rand() < 0.35 + chaos() / 200) setTimeout(() => reply(p, tierFor(chaos(), p)), at + between(1200, 3000));
  }

  /* ---------- Boot ---------- */

  function init(g) {
    game = g;
    for (const def of C.PAGES) {
      const p = pages[def.id] = makePage(def);
      p.total = between(12, 60);
      backfill(p, 8);
      p.viewers = viewerTarget(p);
    }
    buildTiles();
    setInterval(tick, TICK_MS);
    setInterval(() => { for (const def of C.PAGES) renderTileStats(pages[def.id]); }, 1000);

    const bus = Z.bus;
    bus.on('event', ({ def }) => react('event:' + def.id));
    bus.on('action', ({ action }) => react('action:' + action.id));
    bus.on('recovered', () => react('recovered'));
    bus.on('meltdown', () => { for (const d of C.PAGES) pages[d.id].next = Math.min(pages[d.id].next, 0.6); });
    bus.on('siteRenamed', ({ before }) => { if (before) react('renamed', { before }); });
  }

  /** Which page a feed entry is about, if any. */
  function pageForText(text) {
    const has = (re, id) => re.test(text) || text.indexOf(Z.B[id].name) >= 0;
    if (has(/Blog Post/, 'blog')) return 'blog';
    if (has(/Meme Page/, 'meme')) return 'meme';
    if (has(/comment section/i, 'comments')) return 'comments';
    return null;
  }

  /** Opens a page on one particular post (the DEV menu uses it to flip through the memes). */
  function showTopic(id, index) {
    const p = pages[id];
    if (!p || !p.def.topics[index]) return;
    resetTopic(p, index);
    updateTile(p);
    if (view && view.p === p) renderView(); else open(id);
  }

  ui.chat = { init, open, showTopic, pageForText, isOpen: () => !!view, topicCount: id => (pages[id] ? pages[id].def.topics.length : 0) };
})(window.ICHAOS = window.ICHAOS || {});
