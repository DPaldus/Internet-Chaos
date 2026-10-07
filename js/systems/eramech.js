/* One signature mechanic per Internet Era, shown in the website window:
     1 Forum          Flame wars: a fire bar grows; douse it by clicking before it burns Stability.
     2 Social Media   Friend network: send friend requests, every connection adds Attention.
     3 Viral          Trend alerts: jump on a trend before its countdown runs out.
     4 Algorithm      Feed mode: trade Attention against Stability with one switch.
     5 AI             Hallucinations: your AI makes a claim; trust it or fact-check it.
     6 Corporate      Quarterly targets: shareholders want average Money/s to grow every quarter.
     7 Post-Internet  Bot swarms: let them in (friend or foe?) or keep them out.
   Eras past 7 keep the bot swarms. Missing a prompt never costs much, so idle play is
   safe; paying attention pays off. State lives in s.mech (fresh every era, kept in saves
   through fromSave) and in a few s.run counters (connections, feedMode). DOM-free;
   js/ui/eramech.js draws it. */
(function (Z) {
  'use strict';

  const U = Z.util;
  const KINDS = ['flame', 'friends', 'trend', 'feed', 'claim', 'quarter', 'bots'];
  const TAGS = ['#DanceBreak', '#GooseChallenge', '#SilentScream', '#SpoonOnNose', '#ReverseUnboxing',
    '#WalkLikeAPigeon', '#OneWordReview', '#SideEyeFriday', '#TinyHatTuesday', '#ExplainItBadly'];
  const CLAIMS = ['Attention will triple in the next 20 seconds.', 'A billion new users signed up overnight.',
    'Advertisers will pay three times more today.', 'Your website just won an award nobody has heard of.',
    'The algorithm has chosen you. Specifically you.', 'Every comment today will be positive.'];
  const MAX_FRIENDS = 20, FRIEND_BONUS = 0.015, FRIEND_COOLDOWN = 12;
  const QUARTER = 180, QUARTER_GROWTH = 1.2;

  function kind(s) { return KINDS[Math.min(s.era, 7) - 1]; }
  function rand(s, a, b) { return Z.rng.range(s, a, b); }
  function count(s, id) { s.flags.ev[id] = (s.flags.ev[id] || 0) + 1; }

  function removeBuff(s, key) {
    const i = s.buffs.findIndex(b => b.key === key);
    if (i >= 0) s.buffs.splice(i, 1);
  }

  /** First time a mechanic shows up, say how it works; afterwards keep it short. */
  function announce(g, k, icon, title, text, tone) {
    const s = g.s, first = !s.flags.ev['mechIntro:' + k];
    if (first) s.flags.ev['mechIntro:' + k] = 1;
    g.notify('mech', { icon, title, text, kind: tone || 'info', toast: first || tone === 'bad' });
  }

  /* ---------- Modifiers (applied in js/systems/modifiers.js) ---------- */

  function modEffects(s) {
    const k = kind(s);
    if (k === 'friends' && s.run.connections > 0) return [{ t: 'attMult', x: 1 + FRIEND_BONUS * s.run.connections }];
    if (k === 'feed') {
      if (s.run.feedMode === 0) return [{ t: 'attMult', x: 0.85 }, { t: 'regenMult', x: 1.6 }, { t: 'pressureMult', x: 0.8 }];
      if (s.run.feedMode === 2) return [{ t: 'attMult', x: 1.35 }, { t: 'pressureMult', x: 1.4 }, { t: 'drainMult', x: 1.3 }];
    }
    return [];
  }

  /* ---------- Tick ---------- */

  function started(g) {
    const s = g.s;
    return !!s.flags.reveal.chaos && s.run.time > 40;
  }

  /** A quarter measures the average Money/s from its start (s.run.money is money earned this era). */
  function newQuarter(g, target) { return { time: QUARTER, target, from: g.s.run.money }; }
  function quarterAverage(s) {
    const q = s.mech.q, spent = QUARTER - q.time;
    return spent > 0 ? Math.max(0, s.run.money - q.from) / spent : 0;
  }

  function tick(g, dt) {
    const s = g.s, m = s.mech, k = kind(s);
    if (m.cd > 0) m.cd = Math.max(0, m.cd - dt);
    if (!started(g)) return;
    // Nobody can answer a prompt while away: alerts wait, and the quarter starts over on return.
    if (g.offline) { m.q = null; return; }
    const a = m.active;

    if (k === 'flame') {
      if (a) {
        a.fire += dt * (1.6 + s.res.chaos / 50);
        if (a.fire >= 100) loseFlame(g);
        return;
      }
      if (!s.flags.reveal.stability || s.meltdown > 0) return;
      m.t = (m.t === undefined ? rand(s, 60, 120) : m.t) - dt;
      if (m.t > 0) return;
      m.active = { kind: 'flame', fire: 30 };
      Z.effects.addBuff(g, 'flameWar', { duration: 600 });
      announce(g, 'flame', '🔥', 'A flame war broke out!', 'Douse it before it burns your Stability. While it burns, Attention is ×1.3 and Chaos runs hotter.', 'bad');
      return;
    }

    if (k === 'trend' || k === 'claim' || k === 'bots') {
      if (a) {
        a.time -= dt;
        if (a.time <= 0) expire(g);
        return;
      }
      if (s.meltdown > 0) return;
      m.t = (m.t === undefined ? rand(s, 30, 60) : m.t) - dt;
      if (m.t > 0) return;
      if (k === 'trend') {
        m.active = { kind: 'trend', tag: Z.rng.pick(s, TAGS), time: 20, total: 20 };
        announce(g, 'trend', '🌊', 'Trend alert: ' + m.active.tag, 'Jump on it within 20 seconds for a big Attention wave.', 'good');
      } else if (k === 'claim') {
        m.active = { kind: 'claim', text: Z.rng.pick(s, CLAIMS), real: Z.rng.next(s) < 0.6, time: 15, total: 15 };
        announce(g, 'claim', '🌈', 'Your AI made a claim', '"' + m.active.text + '" Trust it (60% true) or fact-check it.', 'info');
      } else {
        const friendly = Z.rng.next(s) < 0.6;
        m.active = { kind: 'bots', friendly, scan: Math.round(Math.min(95, Math.max(5, (friendly ? 70 : 40) + rand(s, -20, 20)))), time: 20, total: 20 };
        announce(g, 'bots', '🤖', 'A bot swarm wants in', 'Let them in (they might help, or not) or keep them out.', 'info');
      }
      m.t = rand(s, 70, 130);
      return;
    }

    if (k === 'quarter') {
      if (!m.q) {
        m.q = newQuarter(g, Math.max(1, g.c.mps) * QUARTER_GROWTH);
        announce(g, 'quarter', '📈', 'A new quarter started', 'Shareholders want an average of ' + Z.fmt.money(m.q.target) + '/s this quarter.', 'info');
        return;
      }
      m.q.time -= dt;
      if (m.q.time > 0) return;
      // Judged on the quarter's average, so one lucky or unlucky moment does not decide it.
      const average = quarterAverage(s);
      const won = average >= m.q.target;
      if (won) {
        count(s, 'mech:quarterWin');
        Z.effects.addBuff(g, 'stockSurge');
        announce(g, 'quarterEnd', '📈', 'Quarterly target hit!', 'The stock is surging: Money per Attention ×1.5 for a minute.', 'good');
      } else {
        Z.effects.apply(g, [{ stability: -10 }, { chaos: 10 }]);
        announce(g, 'quarterEnd', '📉', 'Quarterly target missed', 'Shareholders panicked. Stability −10, Chaos +10.', 'bad');
      }
      m.q = newQuarter(g, Math.max(1, average) * QUARTER_GROWTH);
    }
  }

  function loseFlame(g) {
    const s = g.s;
    s.mech.active = null;
    removeBuff(s, 'flameWar');
    Z.effects.apply(g, [{ stability: -12 }]);
    s.mech.t = rand(s, 130, 220);
    announce(g, 'flameEnd', '🔥', 'The flame war burned out', 'It took some Stability with it (−12).', 'bad');
  }

  function expire(g) {
    const s = g.s, a = s.mech.active;
    s.mech.active = null;
    if (a.kind === 'trend') announce(g, 'trendMiss', '🌊', 'The trend passed', a.tag + ' is already cringe.', 'info');
    else if (a.kind === 'bots') announce(g, 'botsGone', '🤖', 'The bot swarm moved on', 'Nobody let them in. They seemed disappointed.', 'info');
    else announce(g, 'claimGone', '🌈', 'The claim faded', 'Nobody checked it. Nobody trusted it. Very healthy.', 'info');
  }

  /* ---------- Player actions ---------- */

  function act(g, id) {
    const s = g.s, m = s.mech, a = m.active, k = kind(s);
    if (id === 'douse' && a && a.kind === 'flame') {
      a.fire -= 9;
      if (a.fire > 0) return true;
      m.active = null;
      removeBuff(s, 'flameWar');
      count(s, 'mech:flameWin');
      Z.effects.apply(g, [{ att: 40 }]);
      m.t = rand(s, 130, 220);
      announce(g, 'flameWin', '🧯', 'Flame war extinguished', 'Everyone calmed down and stayed to read. +40 seconds of Attention.', 'good');
      return true;
    }
    if (id === 'connect' && k === 'friends') {
      if (m.cd > 0 || s.run.connections >= MAX_FRIENDS) return false;
      s.run.connections++;
      m.cd = FRIEND_COOLDOWN;
      count(s, 'mech:friend');
      g.dirty = true;
      if (s.run.connections === MAX_FRIENDS) announce(g, 'friendsMax', '🤝', 'Your network is complete', 'Twenty connections: Attention +' + Math.round(MAX_FRIENDS * FRIEND_BONUS * 100) + '%.', 'good');
      return true;
    }
    if (id.indexOf('feed') === 0 && k === 'feed') {
      const mode = U.clamp(parseInt(id.slice(4), 10) || 0, 0, 2);
      if (s.run.feedMode === mode) return false;
      s.run.feedMode = mode;
      g.dirty = true;
      return true;
    }
    if (id === 'ride' && a && a.kind === 'trend') {
      m.active = null;
      count(s, 'mech:trend');
      Z.effects.addBuff(g, 'trendWave');
      Z.effects.apply(g, [{ chaos: 8 }]);
      announce(g, 'trendWin', '🌊', 'You rode ' + a.tag, 'Attention ×2.5 for 30 seconds.', 'good');
      return true;
    }
    if ((id === 'trust' || id === 'check') && a && a.kind === 'claim') {
      m.active = null;
      count(s, 'mech:ai');
      if (id === 'check') {
        Z.effects.apply(g, [{ att: 15 }]);
        announce(g, 'claimCheck', '🔍', a.real ? 'Fact-check: it was true' : 'Fact-check: it was made up',
          'Checking facts is good for business. +15 seconds of Attention.', 'good');
      } else if (a.real) {
        Z.effects.addBuff(g, 'aiHype');
        announce(g, 'claimTrue', '🌈', 'It was true!', 'AI hype: Attention ×3 for 20 seconds.', 'good');
      } else {
        Z.effects.apply(g, [{ stability: -12 }, { chaos: 15 }]);
        announce(g, 'claimFalse', '🌈', 'It was a hallucination', 'Users noticed. Stability −12, Chaos +15.', 'bad');
      }
      return true;
    }
    if ((id === 'letin' || id === 'keepout') && a && a.kind === 'bots') {
      m.active = null;
      if (id === 'keepout') {
        Z.effects.addBuff(g, 'botWall');
        announce(g, 'botsOut', '🧱', 'Bots kept out', 'Your firewall holds: Moderation ×1.3 for 30 seconds.', 'info');
      } else if (a.friendly) {
        count(s, 'mech:botsGood');
        Z.effects.addBuff(g, 'botHelp');
        Z.effects.apply(g, [{ money: 40 }]);
        announce(g, 'botsGood', '🤖', 'The bots were friendly', 'They brought gifts: Attention ×1.5 for 30 seconds and 40 seconds of Money.', 'good');
      } else {
        Z.effects.apply(g, [{ loseMoney: 0.1, cap: 60 }, { chaos: 20 }]);
        announce(g, 'botsBad', '🤖', 'The bots were hostile', 'They raided the treasury and started fights. Chaos +20.', 'bad');
      }
      return true;
    }
    return false;
  }

  /* ---------- What the website window shows ---------- */

  function view(g) {
    const s = g.s, m = s.mech, a = m.active, k = kind(s), f = Z.fmt;
    if (!started(g)) return null;
    if (k === 'flame') {
      if (!s.flags.reveal.stability) return null;
      if (!a) return { kind: k, icon: '🔥', title: 'Flame Wars', text: 'The forum is calm. For now. Flame wars break out from time to time.' };
      return { kind: k, icon: '🔥', title: 'Flame war!', alert: true, text: 'Users are fighting about everything. Douse it before it reaches 100%.',
        bar: { value: a.fire / 100, label: Math.floor(a.fire) + '% on fire', tone: 'bad' },
        buttons: [{ id: 'douse', label: '🧯 Douse', primary: true }] };
    }
    if (k === 'friends') {
      const n = s.run.connections;
      return { kind: k, icon: '🤝', title: 'Friend Network', text: n + ' / ' + MAX_FRIENDS + ' connections · Attention +' + Math.round(n * FRIEND_BONUS * 100) + '%',
        bar: { value: n / MAX_FRIENDS, label: m.cd > 0 ? 'Next request in ' + Math.ceil(m.cd) + 's' : (n >= MAX_FRIENDS ? 'Network complete' : 'Ready'), tone: 'good' },
        buttons: [{ id: 'connect', label: '➕ Send friend requests', primary: true, disabled: m.cd > 0 || n >= MAX_FRIENDS }] };
    }
    if (k === 'trend') {
      if (!a) return { kind: k, icon: '🌊', title: 'Trend Alerts', text: 'Watch for trends. Jump on one fast and it carries you.' };
      return { kind: k, icon: '🌊', title: 'Trending now: ' + a.tag, alert: true, text: 'Jump on it before it is old news.',
        bar: { value: a.time / a.total, label: Math.ceil(a.time) + 's left', tone: 'good' },
        buttons: [{ id: 'ride', label: '🏄 Jump on it!', primary: true }] };
    }
    if (k === 'feed') {
      const mode = s.run.feedMode;
      const texts = ['Calm feed: Attention ×0.85, Stability repair ×1.6, Chaos pressure ×0.8.', 'Balanced feed: no changes.',
        'Max engagement: Attention ×1.35, Chaos pressure ×1.4, Stability drain ×1.3.'];
      return { kind: k, icon: '🎚️', title: 'Feed Mode', text: texts[mode],
        buttons: [{ id: 'feed0', label: '🧘 Calm', on: mode === 0 }, { id: 'feed1', label: '⚖️ Balanced', on: mode === 1 }, { id: 'feed2', label: '🚀 Max engagement', on: mode === 2 }] };
    }
    if (k === 'claim') {
      if (!a) return { kind: k, icon: '🌈', title: 'AI Claims', text: 'Your AI likes to announce things. Some of them are true.' };
      return { kind: k, icon: '🌈', title: 'Your AI claims:', alert: true, glitch: true, text: '"' + a.text + '"',
        bar: { value: a.time / a.total, label: Math.ceil(a.time) + 's to decide', tone: 'warn' },
        buttons: [{ id: 'trust', label: '✨ Trust it', primary: true }, { id: 'check', label: '🔍 Fact-check' }] };
    }
    if (k === 'quarter') {
      if (!m.q) return { kind: k, icon: '📈', title: 'Quarterly Targets', text: 'The first quarter starts soon.' };
      const average = quarterAverage(s), p = Math.min(1, average / m.q.target);
      return { kind: k, icon: '📈', title: 'Quarterly Target', text: 'Average ' + f.money(m.q.target) + '/s this quarter (so far ' + f.money(average) + '/s).',
        bar: { value: p, label: Math.ceil(m.q.time) + 's left in the quarter', tone: p >= 1 ? 'good' : 'warn' } };
    }
    if (!a) return { kind: k, icon: '🤖', title: 'Bot Swarms', text: 'Bots wander the dead internet. Some of them want to help.' };
    return { kind: k, icon: '🤖', title: 'A bot swarm wants in', alert: true, text: 'Scan: ' + a.scan + '% chance they are friendly.',
      bar: { value: a.time / a.total, label: Math.ceil(a.time) + 's to decide', tone: 'warn' },
      buttons: [{ id: 'letin', label: '🚪 Let them in', primary: true }, { id: 'keepout', label: '🧱 Keep them out' }] };
  }

  /* ---------- Saves ---------- */

  /** s.mech from a save (untrusted), checked like every saved value. `s` is the loaded
      state with its era already set. A flame war, trend, claim, swarm or quarter that was
      running carries on after loading, so reloading the page neither clears it nor keeps
      its bonus without the risk. */
  function fromSave(raw, s) {
    const n = U.num, src = U.obj(raw), a = U.obj(src.active), q = U.obj(src.q), k = kind(s), m = {};
    if (src.t !== undefined) m.t = n(src.t, 60, 0, 600);
    if (src.cd !== undefined) m.cd = n(src.cd, 0, 0, FRIEND_COOLDOWN);
    if (a.kind === k) {
      if (k === 'flame') m.active = { kind: k, fire: n(a.fire, 30, 0, 99) };
      if (k === 'trend' && TAGS.indexOf(a.tag) >= 0) m.active = { kind: k, tag: a.tag, time: n(a.time, 0, 0, 20), total: 20 };
      if (k === 'claim' && CLAIMS.indexOf(a.text) >= 0) m.active = { kind: k, text: a.text, real: a.real === true, time: n(a.time, 0, 0, 15), total: 15 };
      if (k === 'bots') m.active = { kind: k, friendly: a.friendly === true, scan: Math.round(n(a.scan, 50, 5, 95)), time: n(a.time, 0, 0, 20), total: 20 };
    }
    if (k === 'quarter' && src.q) {
      m.q = { time: n(q.time, QUARTER, 0, QUARTER), target: n(q.target, 1, 0, 1e300), from: Math.min(n(q.from, s.run.money, 0, 1e300), s.run.money) };
    }
    return m;
  }

  Z.mech = { tick, act, view, modEffects, kind, fromSave, MAX_FRIENDS };
})(window.ICHAOS = window.ICHAOS || {});
