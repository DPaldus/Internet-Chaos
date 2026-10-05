/* Side panels: Editorial Policy, Actions, active effects, goals, automation,
   analytics sparkline and the choice-event pop-up window. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h, setText, setHidden, setStyle } = ui;
  let game = null;

  /* ---------- Editorial Policy ---------- */

  const policyBtns = Object.create(null);

  function initPolicy() {
    const track = $('policy-track');
    for (const p of Z.POLICIES) {
      const btn = h('button', { type: 'button', class: 'policy-btn', role: 'radio', 'aria-checked': 'false', 'data-id': p.id }, [
        h('span', { class: 'policy-name', text: p.name }),
        h('span', { class: 'policy-mult', text: 'Chaos ×' + p.chaosMult }),
      ]);
      btn.addEventListener('click', () => {
        const g = game;
        if (!g.m.policies[p.id]) {
          Z.audio.play('deny');
          ui.toast({ icon: '🔒', title: p.name + ' is locked', text: 'Buy the "Remove the Brakes" upgrade (appears once Chaos reaches 70%) or the "Born Unhinged" perk.', kind: 'info' });
          return;
        }
        if (Z.actions.setPolicy(g, p.id)) {
          Z.audio.play('action');
          ui.feed.add(g, '📰', 'Editorial policy changed to ' + p.name + '. ' + p.blurb, 'info');
          ui.requestRender(true);
        }
      });
      track.appendChild(btn);
      policyBtns[p.id] = btn;
    }
  }

  function renderPolicy(g) {
    const s = g.s, f = Z.fmt;
    setHidden($('panel-policy'), !s.flags.reveal.policy);
    if (!s.flags.reveal.policy) return;
    for (const p of Z.POLICIES) {
      const btn = policyBtns[p.id];
      const active = s.policy === p.id;
      btn.classList.toggle('active', active);
      btn.classList.toggle('locked', !g.m.policies[p.id]);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
      setText(btn.firstChild, (g.m.policies[p.id] ? '' : '🔒 ') + p.name);
    }
    const p = g.c.policy;
    setText($('policy-note'), 'Chaos ×' + p.chaosMult + ' · Attention ×' + p.attMult);
    const extra = p.regenMult !== 1 ? ' Stability repair ' + f.mult(p.regenMult) + '.' : '';
    setText($('policy-desc'), p.blurb + ' Pressure multiplier ×' + p.chaosMult + ', Attention ×' + p.attMult + '.' + extra);
  }

  /* ---------- Actions ---------- */

  let actionKey = '';
  const actionEls = [];

  function renderActions(g) {
    const s = g.s;
    const unlocked = Z.ACTIONS.filter(a => a.unlock(g));
    setHidden($('panel-actions'), !unlocked.length);
    const key = unlocked.map(a => a.id).join(',');
    const root = $('actions');
    if (key !== actionKey) {
      actionKey = key;
      root.textContent = '';
      actionEls.length = 0;
      for (const a of unlocked) {
        const eff = h('span', { class: 'action-eff' });
        const cd = h('span', { class: 'action-cd' });
        const btn = h('button', { type: 'button', class: 'action', title: a.desc }, [
          h('span', { class: 'action-icon', 'aria-hidden': 'true', text: a.icon }),
          h('span', { class: 'action-main' }, [h('span', { class: 'action-name', text: a.name }), eff]),
          cd,
        ]);
        btn.addEventListener('click', () => {
          if (Z.actions.use(game, a.id, false)) { Z.audio.play('action'); ui.requestRender(true); }
          else Z.audio.play('deny');
        });
        root.appendChild(btn);
        actionEls.push({ a, btn, eff, cd });
      }
    }
    for (const x of actionEls) {
      const left = s.cooldowns[x.a.id] || 0;
      const total = Z.actions.cooldownOf(g, x.a);
      const usable = Z.actions.canUse(g, x.a.id);
      x.btn.disabled = !usable;
      x.btn.classList.toggle('cooling', left > 0);
      setStyle(x.btn, '--cd', (left > 0 ? left / total * 100 : 0).toFixed(1) + '%');
      setText(x.cd, left > 0 ? Math.ceil(left) + 's' : 'Ready');
      const effText = x.a.id === 'hotfix' && s.meltdown > 0
        ? 'Cuts ' + Z.BAL.meltdown.hotfixCut + 's of downtime'
        : Z.effects.describe(g, x.a.effects);
      setText(x.eff, effText);
    }
  }

  /* ---------- Active effects ---------- */

  let effectsKey = '';
  const effectEls = [];

  function renderEffects(g) {
    const s = g.s, f = Z.fmt;
    const items = s.buffs.map(b => {
      const def = Z.BUFFS[b.key];
      return { id: b.key, icon: def.icon, name: def.name, kind: def.kind, time: b.time, duration: b.duration, mag: b.att };
    });
    if (g.c.trendId) {
      const b = Z.B[g.c.trendId];
      items.push({ id: 'trend', icon: '#️⃣', name: 'Trending: ' + b.plural + ' ×' + (Z.BAL.trends.mult + g.m.trendMult), kind: 'good', time: s.trend.time, duration: Z.BAL.trends.duration * g.m.buffDuration });
    }
    if (s.meltdown > 0) items.unshift({ id: 'meltdown', icon: '🔥', name: 'MELTDOWN · output ×' + Z.BAL.meltdown.productionMult, kind: 'bad', time: s.meltdown, duration: Z.BAL.meltdown.duration * g.m.meltdownMult });
    const root = $('effects');
    const key = items.map(x => x.id).join(',');
    if (key !== effectsKey) {
      effectsKey = key;
      root.textContent = '';
      effectEls.length = 0;
      for (const it of items) {
        const label = h('span', { class: 'chip-name' });
        const time = h('span', { class: 'chip-time' });
        const chip = h('span', { class: 'chip chip-' + it.kind }, [h('span', { 'aria-hidden': 'true', text: it.icon }), label, time]);
        root.appendChild(chip);
        effectEls.push({ chip, label, time });
      }
    }
    items.forEach((it, i) => {
      const e = effectEls[i];
      if (!e) return;
      const name = it.mag && it.id === 'viral' ? it.name + ' ' + f.mult(it.mag) : it.name;
      setText(e.label, name);
      setText(e.time, Math.ceil(it.time) + 's');
      setStyle(e.chip, '--left', (it.time / it.duration * 100).toFixed(1) + '%');
    });
    setHidden(root, !items.length);
  }

  /* ---------- Goals ---------- */

  const goalRows = [];

  function initGoals() {
    const root = $('goals');
    for (let i = 0; i < 4; i++) {
      const title = h('span', { class: 'goal-title' });
      const nums = h('span', { class: 'goal-nums' });
      const fill = h('span', { class: 'goal-fill' });
      const row = h('div', { class: 'goal', hidden: true }, [
        h('div', { class: 'goal-line' }, [title, nums]),
        h('div', { class: 'goal-bar' }, [fill]),
      ]);
      root.appendChild(row);
      goalRows.push({ row, title, nums, fill });
    }
  }

  function logProgress(v, target) {
    if (v <= 1) return 0;
    return Math.min(1, Math.log(v) / Math.log(target));
  }

  function computeGoals(g) {
    const s = g.s, f = Z.fmt, goals = [];
    const next = Z.BUILDINGS.find(b => !s.seen[b.id] && Z.econ.isAvailable(s, b.id)
      && !((b.cat === 'infra' || b.cat === 'mod') && !s.flags.reveal.chaos));
    if (next) {
      const need = next.cost * 0.3;
      goals.push({ title: '❔ Discover new ' + Z.CAT[next.cat].name.toLowerCase(), nums: f.money(s.run.money) + ' / ' + f.money(need), p: s.run.money / need });
    }

    let bestTier = null;
    for (const u of Z.UPGRADES) {
      if (!u.building || s.upgrades[u.id] || s.era < (u.era || 1)) continue;
      const owned = s.buildings[u.building] || 0;
      if (!owned || owned >= u.tier) continue;
      const p = owned / u.tier;
      if (!bestTier || p > bestTier.p) bestTier = { u, owned, p };
    }
    if (bestTier) {
      const b = Z.B[bestTier.u.building];
      goals.push({ title: b.icon + ' Own ' + bestTier.u.tier + ' ' + b.plural + ' for an upgrade', nums: bestTier.owned + ' / ' + bestTier.u.tier, p: bestTier.p });
    }

    const lvl = Z.siteLevel(s), levels = Z.BAL.siteLevels;
    if (lvl + 1 < levels.length) {
      goals.push({ title: '🏗️ Grow into a ' + Z.SITE_LEVELS[lvl + 1], nums: f.int(s.run.attention) + ' / ' + f.int(levels[lvl + 1]), p: s.run.attention / levels[lvl + 1] });
    }

    if (s.flags.reveal.eras) {
      const req = Z.prestige.requirement(s);
      const ready = s.run.attention >= req;
      goals.push({ title: ready ? '🌐 New Internet Era ready!' : '🌐 Next Internet Era', nums: f.int(s.run.attention) + ' / ' + f.int(req), p: ready ? 1 : logProgress(s.run.attention, req), ready });
    }
    return goals.slice(0, 4);
  }

  function renderGoals(g) {
    const goals = computeGoals(g);
    goalRows.forEach((r, i) => {
      const goal = goals[i];
      setHidden(r.row, !goal);
      if (!goal) return;
      setText(r.title, goal.title);
      setText(r.nums, goal.nums);
      setStyle(r.fill, 'width', (Math.min(1, Math.max(0, goal.p)) * 100).toFixed(1) + '%');
      r.row.classList.toggle('ready', !!goal.ready);
    });
  }

  /* ---------- Automation ---------- */

  let autoKey = '';

  function toggleRow(label, desc, checked, onChange, extra) {
    const id = 'auto-' + label.replace(/\W+/g, '-').toLowerCase();
    const input = h('input', { type: 'checkbox', id, class: 'switch' });
    input.checked = checked;
    input.addEventListener('change', () => { onChange(input.checked); ui.requestRender(true); });
    return h('div', { class: 'auto-row' }, [
      h('label', { class: 'auto-head', for: id }, [input, h('span', { class: 'auto-name', text: label })]),
      h('p', { class: 'auto-desc', text: desc }),
      extra || null,
    ]);
  }

  function renderAutomation(g) {
    const s = g.s, m = g.m, a = s.auto;
    const key = [m.autoClick > 0, m.autoHotfix, m.autobuy, m.riskManager, m.prAutopilot, m.scheduler, m.autoClick].join('|');
    setHidden($('panel-auto'), !s.flags.reveal.auto);
    if (key === autoKey) return;
    autoKey = key;
    const root = $('auto-list');
    root.textContent = '';

    if (m.autoClick > 0) {
      root.appendChild(toggleRow('Auto-clicker', Z.fmt.num(m.autoClick) + ' clicks per second, at full click power.', a.clicker, v => { a.clicker = v; }));
    }
    if (m.autoHotfix) {
      const range = h('input', { type: 'range', min: '10', max: '90', step: '5', id: 'auto-hotfix-at', 'aria-label': 'Hotfix threshold' });
      range.value = String(a.hotfixAt);
      const val = h('span', { class: 'auto-val', text: a.hotfixAt + '%' });
      range.addEventListener('input', () => { a.hotfixAt = Number(range.value); val.textContent = a.hotfixAt + '%'; });
      root.appendChild(toggleRow('Auto-Hotfix', 'Pushes a Hotfix when Stability falls below the threshold.', a.hotfix, v => { a.hotfix = v; },
        h('div', { class: 'auto-extra' }, [h('span', { text: 'Threshold' }), range, val])));
    }
    if (m.autobuy) {
      const box = h('div', { class: 'auto-extra auto-cats' });
      const labels = { traffic: 'Content', money: 'Monetization', infra: 'Infrastructure', mod: 'Moderation', upgrades: 'Upgrades' };
      for (const k of Object.keys(labels)) {
        const id = 'autobuy-' + k;
        const cb = h('input', { type: 'checkbox', id });
        cb.checked = !!a.buyCats[k];
        cb.addEventListener('change', () => { a.buyCats[k] = cb.checked; });
        box.appendChild(h('label', { class: 'mini-check', for: id }, [cb, h('span', { text: labels[k] })]));
      }
      const speed = (2 / Math.pow(2, m.autobuySpeed)).toFixed(2).replace(/\.?0+$/, '');
      root.appendChild(toggleRow('Auto-Buyer', 'Buys the cheapest item in the ticked categories every ' + speed + 's.', a.buyer, v => { a.buyer = v; }, box));
    }
    if (m.riskManager) {
      root.appendChild(toggleRow('Auto-Policy', 'Every few seconds, nudges the Editorial Policy to keep Chaos just under Tolerance.', a.policy, v => { a.policy = v; }));
    }
    if (m.prAutopilot) {
      const sel = h('select', { id: 'auto-pr-stance', 'aria-label': 'Autopilot stance' }, [
        h('option', { value: 'safe', text: 'Safe answers' }), h('option', { value: 'bold', text: 'Bold answers' }),
      ]);
      sel.value = a.pr;
      sel.addEventListener('change', () => { a.pr = sel.value === 'bold' ? 'bold' : 'safe'; });
      root.appendChild(toggleRow('PR Autopilot', 'Answers choice events instantly with your chosen stance.', a.prOn, v => { a.prOn = v; },
        h('div', { class: 'auto-extra' }, [sel])));
    }
    if (m.scheduler) {
      root.appendChild(toggleRow('Auto-Actions', 'Stirs the Pot when Chaos is low and posts Apology Videos in emergencies.', a.scheduler, v => { a.scheduler = v; }));
    }
  }

  /* ---------- Analytics sparkline ---------- */

  const samples = [];
  let sampleTimer = 0, colors = null, colorEra = -1;

  function readColors() {
    const cs = getComputedStyle(document.body);
    const v = n => cs.getPropertyValue(n).trim();
    colors = { att: v('--att'), chaos: v('--chaos'), tol: v('--warn'), grid: v('--line'), ink: v('--muted') };
  }

  function sample(g, dt) {
    sampleTimer += dt;
    if (sampleTimer < 1) return;
    sampleTimer = 0;
    samples.push({ aps: g.c.aps, chaos: g.s.res.chaos, tol: g.c.tolerance });
    if (samples.length > 120) samples.shift();
  }

  function renderSpark(g) {
    const show = !!g.s.flags.reveal.analytics;
    setHidden($('panel-analytics'), !show);
    if (!show) return;
    if (colorEra !== g.s.era || !colors) { colorEra = g.s.era; readColors(); }
    const cv = $('spark'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, pad = 6;
    ctx.clearRect(0, 0, W, H);
    if (samples.length < 2) {
      ctx.fillStyle = colors.ink;
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Collecting data…', W / 2, H / 2 + 7);
      return;
    }
    ctx.strokeStyle = colors.grid; ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) { const y = Math.round(H * i / 4) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const n = samples.length, xs = i => pad + (W - 2 * pad) * i / 119;
    const logs = samples.map(p => Math.log10(Math.max(1, p.aps)));
    let lo = Math.min.apply(null, logs), hi = Math.max.apply(null, logs);
    if (hi - lo < 0.5) { lo -= 0.25; hi += 0.25; }
    const yAtt = v => H - pad - (H - 2 * pad) * (v - lo) / (hi - lo);
    const yPct = v => H - pad - (H - 2 * pad) * v / 100;
    const offset = 120 - n;

    ctx.beginPath();
    samples.forEach((p, i) => { const x = xs(i + offset), y = yAtt(logs[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineTo(xs(offset + n - 1), H); ctx.lineTo(xs(offset), H); ctx.closePath();
    ctx.globalAlpha = 0.18; ctx.fillStyle = colors.att; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath();
    samples.forEach((p, i) => { const x = xs(i + offset), y = yAtt(logs[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = colors.att; ctx.lineWidth = 2.5; ctx.stroke();

    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    samples.forEach((p, i) => { const x = xs(i + offset), y = yPct(p.tol); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = colors.tol; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    samples.forEach((p, i) => { const x = xs(i + offset), y = yPct(p.chaos); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = colors.chaos; ctx.lineWidth = 2; ctx.stroke();

    const last = samples[n - 1];
    ctx.fillStyle = colors.att;
    ctx.beginPath(); ctx.arc(xs(119), yAtt(logs[n - 1]), 4, 0, Math.PI * 2); ctx.fill();
    setText($('analytics-note'), Z.fmt.rate(last.aps) + '/s now');
  }

  /* ---------- Choice pop-up ---------- */

  let choiceEl = null;

  function showChoice(g) {
    closeChoice();
    const p = g.s.events.pending;
    if (!p) return;
    const def = Z.EV[p.id];
    const timer = h('span', { class: 'choice-timer-fill' });
    const buttons = def.choices.map((ch, i) => h('button', { type: 'button', class: 'choice-btn choice-' + ch.stance, 'data-autofocus': i === 0 ? true : null }, [
      h('span', { class: 'choice-label', text: ch.label }),
      h('span', { class: 'choice-eff', text: Z.effects.describe(g, ch.effects) }),
      h('span', { class: 'choice-stance', text: ch.stance === 'bold' ? 'BOLD' : 'SAFE' }),
    ]));
    buttons.forEach((b, i) => b.addEventListener('click', () => { Z.events.resolve(game, i, true); ui.requestRender(true); }));
    const ignore = h('button', { type: 'button', class: 'choice-x', title: 'Ignore (picks the safe option)', 'aria-label': 'Ignore and pick the safe option', text: '✕' });
    ignore.addEventListener('click', () => { Z.events.resolve(game, null, false); ui.requestRender(true); });
    choiceEl = h('div', { class: 'choice-window', role: 'alertdialog', 'aria-label': def.title }, [
      h('div', { class: 'choice-bar' }, [
        h('span', { class: 'choice-icon', 'aria-hidden': 'true', text: def.icon }),
        h('span', { class: 'choice-title', text: def.title }),
        ignore,
      ]),
      h('div', { class: 'choice-body' }, [
        h('p', { class: 'choice-text', text: p.text }),
        h('div', { class: 'choice-actions' }, buttons),
        h('div', { class: 'choice-timer' }, [timer]),
        h('p', { class: 'choice-hint', text: 'No answer picks the SAFE option.' }),
      ]),
    ]);
    choiceEl._timer = timer;
    $('choice-root').appendChild(choiceEl);
  }

  function closeChoice() {
    if (choiceEl) { choiceEl.remove(); choiceEl = null; }
  }

  function renderChoice(g) {
    const p = g.s.events.pending;
    if (!p) { closeChoice(); return; }
    if (!choiceEl) showChoice(g);
    if (choiceEl) setStyle(choiceEl._timer, 'width', (p.time / Z.BAL.events.choiceTimeout * 100).toFixed(1) + '%');
  }

  /* ---------- Entry points ---------- */

  function init(g) {
    game = g;
    initPolicy();
    initGoals();
  }

  function renderFast(g, dt) {
    sample(g, dt);
    renderEffects(g);
    renderActions(g);
    renderChoice(g);
  }

  function renderSlow(g) {
    renderPolicy(g);
    renderGoals(g);
    renderAutomation(g);
    renderSpark(g);
  }

  function reset() {
    actionKey = ''; effectsKey = ''; autoKey = '';
    samples.length = 0;
    closeChoice();
  }

  ui.panels = { init, renderFast, renderSlow, showChoice, closeChoice, reset, resetAutomation() { autoKey = ''; } };
})(window.ICHAOS = window.ICHAOS || {});
