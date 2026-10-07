/* Era records (🏁), era challenges (in the Eras window) and the daily challenge (📅).
   Rules: js/systems/meta.js and js/content/challenges.js. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden } = ui;
  let game = null;

  /* ---------- Era challenges (a section of the Eras window) ---------- */

  const MARK = { done: '✅', track: '🎯', failed: '❌', progress: '⏳' };

  /** The current era's challenges with live status. Returns {el, refresh}. */
  function challengeSection(g) {
    const s = g.s;
    const list = h('ul', { class: 'chal-list' });
    const total = h('span', { class: 'chal-total' });
    const rows = Z.challengesFor(s.era).map(c => {
      const mark = h('span', { class: 'chal-mark', 'aria-hidden': 'true' });
      const status = h('span', { class: 'chal-status' });
      const fill = h('span', { class: 'goal-fill' });
      const bar = h('div', { class: 'goal-bar' }, [fill]);
      const row = h('li', { class: 'chal' }, [
        h('span', { class: 'chal-icon', 'aria-hidden': 'true', text: c.icon }),
        h('div', { class: 'chal-main' }, [
          h('div', { class: 'chal-line' }, [h('b', { class: 'chal-name', text: c.name }), h('span', { class: 'chal-bonus', text: '+' + Math.round(Z.meta.challengeValue(s, c) * 100) + '% Clout' })]),
          h('span', { class: 'chal-desc', text: c.desc }),
          bar,
          h('div', { class: 'chal-line' }, [status, mark]),
        ]),
      ]);
      list.appendChild(row);
      return { c, row, mark, status, fill, bar };
    });
    const el = h('section', { class: 'chal-section' }, [
      h('div', { class: 'perk-head' }, [h('h3', { text: 'Era Challenges' }), total]),
      h('p', { class: 'perk-intro', text: 'Optional goals for this era. Each one adds extra Clout when you start the next era. Goals marked 🎯 count as long as you keep them up until the end.' }),
      list,
    ]);
    function refresh() {
      for (const r of rows) {
        const st = Z.meta.challengeState(s, r.c);
        setText(r.mark, MARK[st.status]);
        setText(r.status, st.status === 'track' ? 'On track · ' + st.text : st.status === 'failed' ? 'Missed · ' + st.text : st.text);
        r.row.className = 'chal chal-' + st.status;
        setHidden(r.bar, st.status !== 'progress');
        if (st.status === 'progress') r.fill.style.width = (st.have / st.need * 100).toFixed(1) + '%';
      }
      setText(total, '+' + Math.round(Z.meta.challengeBonus(s) * 100) + '% Clout bonus');
    }
    refresh();
    return { el, refresh };
  }

  /* ---------- Era records ---------- */

  function openRecords() {
    const s = game.s, f = Z.fmt;
    const best = Z.meta.bestTimes(s);
    const body = h('div', { class: 'records' });
    if (!s.history.length) {
      body.append(h('p', { class: 'modal-lead', text: 'No finished eras yet. Every era you complete is recorded here: how long it took, the Clout it earned and more.' }));
    } else {
      const totalTime = s.history.reduce((t, x) => t + x.time, 0);
      body.append(
        h('div', { class: 'rec-sum' }, [
          tile('🌐', 'Eras finished', f.int(s.history.length)),
          tile('⏱️', 'Fastest era', f.time(Math.min.apply(null, s.history.map(x => x.time)))),
          tile('✦', 'Clout from eras', f.int(s.history.reduce((t, x) => t + x.clout, 0))),
          tile('🕰️', 'Time in finished eras', f.time(totalTime)),
        ]),
        h('h3', { text: 'Personal bests' }),
        h('div', { class: 'rec-best' }, Object.keys(best).sort((a, b) => a - b).map(n => h('div', { class: 'rec-best-item' }, [
          h('b', { text: Z.era(+n).name }), h('span', { text: f.time(best[n].time) }),
        ]))),
        h('h3', { text: 'All finished eras' }),
      );
      const table = h('table', { class: 'rec-table' }, [
        h('thead', {}, [h('tr', {}, ['#', 'Internet', 'Era', 'Time', 'Clout', 'Attention', 'Meltdowns', 'Challenges', 'System', 'Date'].map(t => h('th', { text: t })))]),
        h('tbody', {}, s.history.slice().reverse().map((x, i) => h('tr', { class: best[x.era] === x ? 'rec-pb' : '' }, [
          h('td', { text: String(s.history.length - i) }),
          h('td', { text: 'v' + (x.v || 1) }),
          h('td', { text: Z.era(x.era).name }),
          h('td', { text: f.time(x.time) + (best[x.era] === x ? ' 🏅' : '') }),
          h('td', { text: '+' + f.int(x.clout) }),
          h('td', { text: f.num(x.attention) }),
          h('td', { text: f.int(x.meltdowns) }),
          h('td', { text: x.challenges + ' / 3' }),
          h('td', { text: (Z.OS[x.os] || Z.OSES[0]).icon + ' ' + (Z.OS[x.os] || Z.OSES[0]).name }),
          h('td', { text: x.at ? new Date(x.at).toLocaleDateString() : '—' }),
        ]))),
      ]);
      body.append(h('div', { class: 'rec-scroll' }, [table]));
    }
    const done = Object.keys(s.challenges.done).length;
    const fast = Z.reboot.fastestInternet(s);
    if (fast) body.append(h('p', { class: 'rec-foot', text: '🏎️ Fastest full internet (all seven eras): ' + f.time(fast.time) + ' on v' + fast.v + '.' }));
    body.append(h('p', { class: 'muted rec-foot', text: 'Era challenges completed: ' + done + ' of ' + Z.CHALLENGES.length + '. 🏅 marks your fastest run of each era.' }));
    ui.modal.open({ id: 'records', title: '🏁 Era Records', body, wide: true });
  }

  function tile(icon, label, value) {
    return h('div', { class: 'rec-tile' }, [h('span', { class: 'rec-tile-icon', 'aria-hidden': 'true', text: icon }), h('b', { text: value }), h('span', { text: label })]);
  }

  /* ---------- Daily challenge ---------- */

  function effectsText(mod) { return mod.effects.map(Z.mods.describe).join(', '); }

  function timeToMidnight() {
    const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return (next - now) / 1000;
  }

  function goalText(s) {
    const goal = Z.DAILY_GOAL[s.daily.goal];
    return goal ? goal.text.replace('{n}', Z.fmt.int(goal.need)) : '';
  }

  function openDaily() {
    const s = game.s, f = Z.fmt;
    if (!Z.meta.dailyActive(s)) return;
    const mod = Z.DAILY_MOD[s.daily.mod], goal = Z.DAILY_GOAL[s.daily.goal];
    const nums = h('span', { class: 'goal-nums' }), fill = h('span', { class: 'goal-fill' });
    const state = h('p', { class: 'daily-state' }), clock = h('p', { class: 'muted' });
    const body = h('div', { class: 'daily' }, [
      h('section', { class: 'daily-card' }, [
        h('span', { class: 'daily-icon', 'aria-hidden': 'true', text: mod.icon }),
        h('div', {}, [
          h('span', { class: 'daily-kicker', text: 'Today on the internet' }),
          h('b', { class: 'daily-name', text: mod.name }),
          h('span', { class: 'daily-desc', text: mod.desc }),
          h('span', { class: 'daily-effects', text: effectsText(mod) }),
        ]),
      ]),
      h('section', {}, [
        h('h3', { text: 'Daily goal' }),
        h('div', { class: 'goal' }, [
          h('div', { class: 'goal-line' }, [h('span', { class: 'goal-name' }, [h('span', { class: 'goal-icon', text: goal.icon }), h('span', { class: 'goal-title', text: goalText(s) })]), nums]),
          h('div', { class: 'goal-bar' }, [fill]),
        ]),
        state,
      ]),
      clock,
      h('p', { class: 'muted', text: 'Everyone gets the same daily challenge. A new one starts at midnight. Finishing goals on consecutive days builds a streak, and a longer streak (up to 7 days) pays more Clout.' }),
    ]);
    function refresh() {
      const p = Z.meta.dailyProgress(s);
      setText(nums, f.int(p.have) + ' / ' + f.int(p.need));
      fill.style.width = (p.have / p.need * 100).toFixed(1) + '%';
      fill.parentNode.parentNode.classList.toggle('ready', s.daily.done);
      setText(state, s.daily.done ? '✅ Done for today! Streak: ' + s.daily.streak + ' day' + (s.daily.streak === 1 ? '' : 's') + '.'
        : '🎁 Reward: +' + f.int(Z.meta.dailyReward(s)) + ' Clout' + (s.daily.streak ? ' · current streak ' + s.daily.streak : ''));
      setText(clock, 'Next daily challenge in ' + f.time(timeToMidnight()) + '.');
    }
    refresh();
    ui.modal.open({ id: 'daily', title: '📅 Daily Challenge', body, refresh });
  }

  /** For the goals list (js/ui/panels.js). */
  function dailyGoal(s) {
    if (!Z.meta.dailyActive(s) || s.daily.done) return null;
    const p = Z.meta.dailyProgress(s), goal = Z.DAILY_GOAL[s.daily.goal];
    return { icon: '📅', title: 'Daily: ' + goalText(s), nums: Z.fmt.int(p.have) + ' / ' + Z.fmt.int(p.need), p: p.have / p.need, daily: true, goalIcon: goal.icon };
  }

  /** For the active-effects strip. */
  function dailyChip(s) {
    if (!Z.meta.dailyActive(s)) return null;
    const mod = Z.DAILY_MOD[s.daily.mod];
    return { id: 'daily', icon: mod.icon, name: 'Today: ' + mod.name, kind: 'good', time: timeToMidnight(), duration: 86400, title: effectsText(mod), daily: true };
  }

  /* ---------- Loop and notifications ---------- */

  function render(g) {
    const s = g.s;
    if (Z.meta.ensureDaily(s, Z.meta.dayKey())) {
      g.dirty = true;
      if (s.flags.reveal.daily) {
        const mod = Z.DAILY_MOD[s.daily.mod];
        ui.toast({ icon: '📅', title: 'New daily challenge: ' + mod.name, text: effectsText(mod) + '. Goal: ' + goalText(s) + '.', kind: 'info', duration: 8000 });
      }
    }
    setHidden($('btn-daily'), !Z.meta.dailyActive(s));
    setHidden($('btn-records'), !s.flags.reveal.eras);
  }

  function init(g) {
    game = g;
    Z.bus.on('challenge', ({ c }) => {
      ui.toast({ icon: c.icon, title: 'Challenge complete: ' + c.name, text: '+' + Math.round(Z.meta.challengeValue(game.s, c) * 100) + '% Clout when you start the next era.', kind: 'achieve' });
      ui.feed.add(game, c.icon, 'Era challenge complete: ' + c.name + '. ' + c.desc, 'achieve');
      Z.audio.play('achievement');
    });
    Z.bus.on('dailyDone', ({ reward, streak }) => {
      ui.toast({ icon: '📅', title: 'Daily challenge done!', text: '+' + Z.fmt.int(reward) + ' Clout. Streak: ' + streak + ' day' + (streak === 1 ? '' : 's') + '.', kind: 'achieve', duration: 7000 });
      ui.feed.add(game, '📅', 'Daily challenge done: ' + goalText(game.s) + '. +' + Z.fmt.int(reward) + ' Clout.', 'achieve');
      Z.audio.play('bonus');
    });
    $('btn-records').addEventListener('click', openRecords);
    $('btn-daily').addEventListener('click', openDaily);
    render(g);
  }

  ui.meta = { init, render, challengeSection, openRecords, openDaily, dailyGoal, dailyChip };
})(window.ICHAOS = window.ICHAOS || {});
