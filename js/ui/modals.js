/* Dialogs: Internet Eras (prestige + perks), Achievements, Statistics, Settings & saves,
   and the welcome-back summary. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { h, setText } = ui;
  let game = null;

  /* ---------- Internet Eras ---------- */

  function openEras() {
    const g = game, s = g.s, f = Z.fmt;
    const refs = { perks: [] };

    const timeline = h('ol', { class: 'era-line' });
    const nodes = [];
    for (let n = 1; n <= Z.ERAS.length; n++) nodes.push(n);
    if (s.era >= Z.ERAS.length) {
      if (nodes.indexOf(s.era) < 0) nodes.push(s.era);
      nodes.push(s.era + 1);
    }
    for (const n of nodes) {
      const e = Z.era(n);
      const state = n < s.era ? 'done' : n === s.era ? 'now' : 'next';
      timeline.appendChild(h('li', { class: 'era-node era-' + state }, [
        h('span', { class: 'era-num', text: String(n) }),
        h('span', { class: 'era-name', text: e.name }),
      ]));
    }

    const next = Z.era(s.era + 1);
    refs.progressFill = h('span', { class: 'goal-fill' });
    refs.progressNums = h('span', { class: 'goal-nums' });
    refs.gain = h('b');
    refs.bonus = h('span');
    refs.go = h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': true, text: 'Enter the ' + next.name });
    refs.go.addEventListener('click', confirmPrestige);

    const prestigeBox = h('section', { class: 'prestige-box' }, [
      h('p', { class: 'era-current' }, ['You are in the ', h('b', { text: Z.era(s.era).name }), '. ', Z.era(s.era).tagline]),
      h('div', { class: 'goal' }, [
        h('div', { class: 'goal-line' }, [h('span', { class: 'goal-title', text: 'Attention this era' }), refs.progressNums]),
        h('div', { class: 'goal-bar' }, [refs.progressFill]),
      ]),
      h('p', { class: 'prestige-gain' }, ['Starting the ', h('b', { text: next.name }), ' now earns ', refs.gain, ' Clout. ', refs.bonus]),
      h('p', { class: 'prestige-unlocks' }, [h('b', { text: 'New in the ' + next.name + ': ' }), next.unlocks]),
      h('p', { class: 'prestige-note', text: 'Resetting clears Attention, Money, buildings and upgrades. You keep Clout, perks, achievements, statistics, settings and your operating system. Each Clout you ever earn adds +' + Z.fmt.num(Z.BAL.prestige.cloutBonus * 100, { dec: 1 }) + '% Attention forever.' }),
      refs.go,
    ]);

    refs.clout = h('span', { class: 'clout-balance' });
    const perkGrid = h('div', { class: 'perk-grid' });
    for (const p of Z.PERKS) {
      const lvl = h('span', { class: 'perk-level' });
      const cost = h('span', { class: 'perk-cost' });
      const btn = h('button', { type: 'button', class: 'perk' }, [
        h('span', { class: 'perk-icon', 'aria-hidden': 'true', text: p.icon }),
        h('span', { class: 'perk-main' }, [
          h('span', { class: 'perk-name', text: p.name }), lvl,
          h('span', { class: 'perk-desc', text: p.desc }),
        ]),
        cost,
      ]);
      btn.addEventListener('click', () => {
        if (Z.prestige.buyPerk(game, p.id)) {
          Z.audio.play('upgrade');
          ui.panels.resetAutomation();
          ui.requestRender(true);
          refresh();
        } else Z.audio.play('deny');
      });
      perkGrid.appendChild(btn);
      refs.perks.push({ p, btn, lvl, cost });
    }

    const challenges = ui.meta.challengeSection(g);
    const rebootCard = ui.reboot.erasCard(g);
    const records = h('button', { type: 'button', class: 'btn', text: '🏁 Era records', onclick: () => ui.meta.openRecords() });
    const body = h('div', { class: 'eras' }, [
      timeline,
      prestigeBox,
      rebootCard.el,
      challenges.el,
      h('div', { class: 'btn-row' }, [records]),
      h('section', { class: 'perk-section' }, [
        h('div', { class: 'perk-head' }, [h('h3', { text: 'Clout Perks' }), refs.clout]),
        h('p', { class: 'perk-intro', text: 'Spend Clout on permanent upgrades. Perks survive every reset.' }),
        perkGrid,
      ]),
    ]);

    function refresh() {
      challenges.refresh();
      rebootCard.refresh();
      const req = Z.prestige.requirement(s);
      const pv = Z.prestige.previewBonus(s);
      const can = Z.prestige.canPrestige(s);
      setText(refs.progressNums, f.int(s.run.attention) + ' / ' + f.int(req));
      refs.progressFill.style.width = (Math.min(1, s.run.attention <= 1 ? 0 : Math.log(s.run.attention) / Math.log(req)) * 100).toFixed(1) + '%';
      const chal = Z.meta.challengeBonus(s);
      setText(refs.gain, can ? '+' + f.int(pv.gain) + (chal ? ' (challenges +' + Math.round(chal * 100) + '%)' : '') : '+0 (needs ' + f.int(req) + ')');
      setText(refs.bonus, 'Permanent Attention bonus: ' + f.mult(pv.now) + ' → ' + f.mult(can ? pv.next : pv.now) + '.');
      refs.go.disabled = !can;
      setText(refs.clout, '✦ ' + f.int(s.clout) + ' Clout to spend');
      for (const x of refs.perks) {
        const level = s.perks[x.p.id] || 0;
        const maxed = level >= x.p.max;
        const unlocked = Z.prestige.perkUnlocked(s, x.p);
        const price = Z.prestige.perkCost(x.p, level);
        x.btn.hidden = !unlocked;
        setText(x.lvl, x.p.max === 1 ? (level ? 'Owned' : 'Not owned') : 'Level ' + level + ' / ' + x.p.max);
        setText(x.cost, maxed ? 'MAX' : '✦ ' + f.int(price));
        x.btn.classList.toggle('can', !maxed && s.clout >= price);
        x.btn.classList.toggle('maxed', maxed);
        x.btn.disabled = maxed;
      }
    }

    refresh();
    ui.modal.open({ id: 'eras', title: 'Internet Eras', body, wide: true, refresh });
  }

  async function confirmPrestige() {
    const g = game, s = g.s;
    if (!Z.prestige.canPrestige(s)) return;
    const gain = Z.prestige.cloutGain(s);
    const next = Z.era(s.era + 1);
    const ok = await ui.confirm({
      title: 'Start the ' + next.name + '?',
      text: 'Your current empire will be archived. You gain ' + Z.fmt.int(gain) + ' Clout and start over with permanent bonuses. Attention, Money, buildings and upgrades reset.',
      confirmLabel: 'Start the ' + next.name,
    });
    if (!ok) { openEras(); return; }
    const got = Z.prestige.prestige(g);
    Z.audio.play('prestige');
    ui.resetAll();
    ui.replay(document.body, 'era-flash');
    ui.feed.add(g, '🌐', 'Welcome to the ' + next.name + '. You brought ' + Z.fmt.int(got) + ' Clout with you.', 'era');
    ui.toast({ icon: '🌐', title: next.name, text: '+' + Z.fmt.int(got) + ' Clout. ' + next.unlocks, kind: 'era', duration: 7000 });
    Z.save.write(g.s);
    openEras();
  }

  /* ---------- Achievements ---------- */

  function openAchievements() {
    const g = game, s = g.s;
    const count = g.m.achCount;
    const grid = h('div', { class: 'ach-grid' });
    for (const a of Z.ACHIEVEMENTS) {
      const got = !!s.achievements[a.id];
      const secret = a.hidden && !got;
      grid.appendChild(h('div', { class: 'ach' + (got ? ' got' : '') }, [
        h('span', { class: 'ach-icon', 'aria-hidden': 'true', text: secret ? '❔' : a.icon }),
        h('span', { class: 'ach-main' }, [
          h('span', { class: 'ach-name', text: secret ? 'Secret achievement' : a.name }),
          h('span', { class: 'ach-desc', text: secret ? 'Keep playing. Or stop playing. One of those.' : a.desc }),
          got ? h('span', { class: 'ach-date', text: 'Unlocked ' + new Date(s.achievements[a.id]).toLocaleDateString() }) : null,
        ]),
      ]));
    }
    const body = h('div', {}, [
      h('p', { class: 'modal-lead', text: count + ' of ' + Z.ACHIEVEMENTS.length + ' unlocked. Each one permanently adds +' + Math.round(Z.BAL.achievementBonus * 100) + '% Attention (now +' + Math.round(count * Z.BAL.achievementBonus * 100) + '%).' }),
      grid,
    ]);
    ui.modal.open({ id: 'ach', title: 'Achievements', body, wide: true });
  }

  /* ---------- Statistics ---------- */

  function openStats() {
    const g = game, s = g.s, f = Z.fmt;
    const rows = [];
    const table = (title, defs) => h('section', { class: 'stat-section' }, [
      h('h3', { text: title }),
      h('dl', { class: 'stat-table' }, defs.map(([label, fn]) => {
        const dd = h('dd');
        rows.push({ dd, fn });
        return h('div', { class: 'stat-row' }, [h('dt', { text: label }), dd]);
      })),
    ]);
    const st = () => s.stats;
    const body = h('div', { class: 'stats-cols' }, [
      table('This era', [
        ['Era', () => Z.era(s.era).name],
        ['Time in this era', () => f.time(s.run.time)],
        ['Attention this era', () => f.int(s.run.attention)],
        ['Money this era', () => f.money(s.run.money)],
        ['Clicks this era', () => f.int(s.run.clicks)],
        ['Highest Chaos this era', () => s.run.maxChaos.toFixed(1) + '%'],
        ['Meltdowns this era', () => f.int(s.run.meltdowns)],
        ['Uptime', () => f.time(s.run.uptime) + ' (+' + Math.round(Z.idle.uptimeBonus(s) * 100) + '% Attention)'],
        ['Upgrades this era', () => f.int(s.run.upgrades)],
        ['Attention/s now', () => f.rate(g.c.aps)],
        ['Money/s now', () => f.money(g.c.mps)],
      ]),
      table('All time', [
        ['Total Attention', () => f.int(st().totalAttention)],
        ['Total Money', () => f.money(st().totalMoney)],
        ['Total clicks', () => f.int(st().totalClicks) + ' (+' + f.int(st().autoClicks) + ' automatic)'],
        ['Best click combo', () => f.int(st().bestCombo)],
        ['Viral clicks', () => f.int(st().crits)],
        ['Longest uptime', () => f.time(st().longestUptime)],
        ['Total Chaos created', () => f.num(st().totalChaos) + ' pts'],
        ['Highest Chaos', () => st().highestChaos.toFixed(1) + '%'],
        ['Highest Stability', () => st().highestStability.toFixed(1) + '%'],
        ['Best Money/s', () => f.money(st().bestMps)],
        ['Best Attention/s', () => f.rate(st().bestAps)],
        ['Largest viral post', () => f.int(st().largestViral) + ' Attention'],
        ['Events', () => f.int(st().events) + ' (' + f.int(st().choices) + ' answered by you)'],
        ['Meltdowns', () => f.int(st().meltdowns)],
        ['Internet Eras completed', () => f.int(st().eras)],
        ['Fastest era', () => st().fastestEra ? f.time(st().fastestEra) : '—'],
        ['Era challenges completed', () => Object.keys(s.challenges.done).length + ' / ' + Z.CHALLENGES.length],
        ['Daily challenge streak', () => s.daily.streak + ' day' + (s.daily.streak === 1 ? '' : 's')],
        ['Internet version', () => 'v' + Z.reboot.version(s) + ' (' + f.int(s.reboot.count) + ' reboot' + (s.reboot.count === 1 ? '' : 's') + ')'],
        ['Bandwidth earned', () => '📡 ' + f.int(s.reboot.lifetime)],
        ['Fastest full internet', () => { const b = Z.reboot.fastestInternet(s); return b ? f.time(b.time) + ' (v' + b.v + ')' : '—'; }],
        ['Clout earned', () => f.int(st().cloutEarned)],
        ['Buildings bought', () => f.int(st().buildingsBought)],
        ['Upgrades bought', () => f.int(st().upgradesBought)],
        ['Actions used', () => f.int(st().actions)],
        ['Play time', () => f.time(st().playTime)],
        ['Time away (offline)', () => f.time(st().offlineTime)],
        ['Achievements', () => g.m.achCount + ' / ' + Z.ACHIEVEMENTS.length],
        ['Operating system', () => { const os = Z.opsys.current(s); return os.name + ' ' + os.edition; }],
      ]),
    ]);
    body.appendChild(h('div', { class: 'btn-row stats-links' }, [
      h('button', { type: 'button', class: 'btn', text: '🏁 Era records', onclick: () => ui.meta.openRecords() }),
      h('button', { type: 'button', class: 'btn', text: '📸 Share your website', onclick: () => ui.share.open() }),
    ]));
    const refresh = () => { for (const r of rows) setText(r.dd, r.fn()); };
    refresh();
    ui.modal.open({ id: 'stats', title: 'Statistics', body, wide: true, refresh });
  }

  /* ---------- Settings and saves ---------- */

  function inFrame() {
    try { return window.self !== window.top; } catch (err) { return true; }
  }

  function openSettings() {
    const g = game, s = g.s;
    const set = s.settings;

    const sound = h('input', { type: 'checkbox', id: 'set-sound', class: 'switch' });
    sound.checked = set.sound;
    sound.addEventListener('change', () => ui.setSound(sound.checked));
    const vol = h('input', { type: 'range', id: 'set-volume', min: '0', max: '1', step: '0.05', 'aria-label': 'Volume' });
    vol.value = String(set.volume);
    vol.addEventListener('input', () => { set.volume = Number(vol.value); Z.audio.setVolume(set.volume); });
    vol.addEventListener('change', () => Z.audio.play('buy'));

    const music = h('input', { type: 'checkbox', id: 'set-music', class: 'switch' });
    music.checked = set.music;
    music.addEventListener('change', () => ui.setMusic(music.checked));
    const musicVol = h('input', { type: 'range', id: 'set-music-volume', min: '0', max: '1', step: '0.05', 'aria-label': 'Music volume' });
    musicVol.value = String(set.musicVolume);
    musicVol.addEventListener('input', () => { set.musicVolume = Number(musicVol.value); Z.music.setVolume(set.musicVolume); });

    const notation = h('select', { id: 'set-notation' }, [
      h('option', { value: 'short', text: 'Short (1.23M, 4.56B)' }),
      h('option', { value: 'sci', text: 'Scientific (1.23e6)' }),
    ]);
    notation.value = set.notation;
    notation.addEventListener('change', () => { set.notation = notation.value === 'sci' ? 'sci' : 'short'; Z.fmt.setNotation(set.notation); ui.requestRender(true); });

    const language = h('select', { id: 'set-lang' }, Object.keys(Z.i18n.LANGS).map(k => h('option', { value: k, text: Z.i18n.LANGS[k] })));
    language.value = Z.i18n.lang;
    language.addEventListener('change', () => { Z.i18n.setLang(language.value); Z.save.write(s); location.reload(); });

    const motion = h('input', { type: 'checkbox', id: 'set-motion', class: 'switch' });
    motion.checked = set.reduceMotion;
    motion.addEventListener('change', () => { set.reduceMotion = motion.checked; document.body.classList.toggle('reduce-motion', motion.checked); });

    const savedAt = h('span', { class: 'muted' });
    const backupNote = h('span', { class: 'muted backup-note' });
    const saveNow = h('button', { type: 'button', class: 'btn', text: 'Save now' });
    saveNow.addEventListener('click', () => {
      if (Z.save.write(s)) { ui.toast({ icon: '💾', title: 'Game saved', kind: 'info', duration: 2000 }); refresh(); }
      else ui.toast({ icon: '⚠️', title: 'Could not save', text: 'This browser is blocking local storage. Export your save code to keep progress.', kind: 'bad' });
    });

    const exportArea = h('textarea', { id: 'export-code', class: 'code-area', readonly: true, rows: '4', 'aria-label': 'Save code', placeholder: 'Press "Create save code" to generate it.' });
    const exportBtn = h('button', { type: 'button', class: 'btn btn-primary', text: 'Create save code' });
    const copyBtn = h('button', { type: 'button', class: 'btn', text: 'Copy', disabled: true });
    const dlBtn = h('button', { type: 'button', class: 'btn', text: 'Save as file…', disabled: true, hidden: inFrame() });
    exportBtn.addEventListener('click', () => {
      exportArea.value = Z.save.exportString(s);
      ui.backup.markBackedUp();
      copyBtn.disabled = false;
      dlBtn.disabled = false;
      exportArea.select();
    });
    copyBtn.addEventListener('click', () => {
      const done = () => ui.toast({ icon: '📋', title: 'Save code copied', kind: 'info', duration: 2000 });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(exportArea.value).then(done, () => { exportArea.select(); ui.toast({ icon: '📋', title: 'Press Ctrl+C to copy', text: 'The code is selected.', kind: 'info' }); });
      } else { exportArea.select(); ui.toast({ icon: '📋', title: 'Press Ctrl+C to copy', text: 'The code is selected.', kind: 'info' }); }
    });
    dlBtn.addEventListener('click', () => {
      const filename = 'internet-chaos-save-' + new Date().toISOString().slice(0, 10) + '.txt';
      const blob = new Blob([exportArea.value], { type: 'text/plain' });
      const a = h('a', { href: URL.createObjectURL(blob), download: filename });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });

    const importArea = h('textarea', { id: 'import-code', class: 'code-area', rows: '4', 'aria-label': 'Paste a save code', placeholder: 'Paste a save code that starts with ICHAOS1.' });
    const fileInput = h('input', { type: 'file', id: 'import-file', accept: '.txt,.json,text/plain,application/json' });
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (file.size > 2000000) { ui.toast({ icon: '⚠️', title: 'File too large', text: 'Save files are small text files.', kind: 'bad' }); return; }
      const reader = new FileReader();
      reader.onload = () => { importArea.value = String(reader.result || ''); };
      reader.readAsText(file);
    });
    const importMsg = h('p', { class: 'form-msg', role: 'alert' });
    const importBtn = h('button', { type: 'button', class: 'btn btn-primary', text: 'Import save' });
    importBtn.addEventListener('click', async () => {
      let state;
      try { state = Z.save.importString(importArea.value); } catch (err) { importMsg.textContent = err.message; return; }
      const ok = await ui.confirm({ title: 'Replace your current game?', text: 'The imported save (' + Z.era(state.era).name + ', ' + Z.fmt.int(state.stats.totalAttention) + ' total Attention) will replace your current progress.', confirmLabel: 'Import' });
      if (!ok) { openSettings(); return; }
      ui.replaceState(state);
      ui.toast({ icon: '📥', title: 'Save imported', kind: 'info' });
    });

    const resetBtn = h('button', { type: 'button', class: 'btn btn-danger', text: 'Delete save and start over' });
    resetBtn.addEventListener('click', async () => {
      const ok = await ui.confirm({ title: 'Delete everything?', text: 'This permanently deletes your empire, Clout, perks, achievements and statistics. Export a save code first if you might want it back.', confirmLabel: 'Delete my save', danger: true });
      if (!ok) { openSettings(); return; }
      Z.save.wipe();
      const fresh = Z.state.create(Date.now());
      fresh.settings = Object.assign({}, s.settings);
      fresh.siteName = s.siteName;
      ui.replaceState(fresh);
      ui.toast({ icon: '🧹', title: 'Fresh start', text: 'One useless website. Again.', kind: 'info' });
    });

    const row = (label, control, note) => h('div', { class: 'set-row' }, [
      h('label', { class: 'set-label', for: control.id || null, text: label }), control, note ? h('span', { class: 'set-note', text: note }) : null,
    ]);

    const renameBtn = h('button', { type: 'button', class: 'btn', text: 'Rename…', onclick: () => openSiteName({ onDone: null }) });
    const body = h('div', { class: 'settings' }, [
      h('section', {}, [
        h('h3', { text: 'Your website' }),
        h('div', { class: 'set-row' }, [h('b', { class: 'set-site-name', text: Z.siteName(s) }), renameBtn]),
      ]),
      h('section', {}, [
        h('h3', { text: 'Preferences' }),
        row('Sound effects', sound),
        row('Volume', vol),
        row('Music', music, 'Calm ambient music, made live in your browser.'),
        row('Music volume', musicVol),
        row('Number format', notation),
        row('Reduce motion', motion, 'Turns off floating numbers and shaking.'),
        row('Language', language, 'Changing the language reloads the page.'),
      ]),
      h('section', {}, [
        h('h3', { text: 'Saving' }),
        h('p', { class: 'muted', text: 'The game saves itself every ' + Z.BAL.autosaveSeconds + ' seconds and when you leave. '
          + 'Saves live in this browser only, so export a save code to move your game or keep a backup.' }),
        h('div', { class: 'btn-row' }, [saveNow, savedAt]),
        h('div', { class: 'btn-row backup-row' }, [
          h('button', { type: 'button', class: 'btn btn-primary', text: '💾 Download backup', onclick: () => { ui.backup.download(); refresh(); } }),
          h('button', { type: 'button', class: 'btn', text: '📋 Copy save code', onclick: () => ui.backup.copy() }),
          backupNote,
        ]),
      ]),
      h('section', {}, [
        h('h3', { text: 'Export save' }),
        exportArea,
        h('div', { class: 'btn-row' }, [exportBtn, copyBtn, dlBtn]),
      ]),
      h('section', {}, [
        h('h3', { text: 'Import save' }),
        importArea,
        h('div', { class: 'btn-row' }, [h('label', { class: 'btn file-btn', for: 'import-file' }, ['Load from file…', fileInput]), importBtn]),
        importMsg,
      ]),
      h('section', { class: 'danger-zone' }, [
        h('h3', { text: 'Danger zone' }),
        resetBtn,
      ]),
      aboutDeveloper(),
    ]);

    function refresh() { setText(savedAt, 'Last saved ' + Z.fmt.clock(s.lastSaved)); setText(backupNote, ui.backup.lastText()); }
    refresh();
    ui.modal.open({ id: 'settings', title: 'Settings & saves', body, refresh });
  }

  function aboutDeveloper() {
    return h('section', { class: 'about-dev' }, [
      h('h3', { text: 'About the Developer' }),
      h('img', { class: 'about-banner', src: 'assets/dplds-banner.webp', alt: 'DPLDS', width: '760', height: '349', loading: 'lazy' }),
      h('div', { class: 'about-row' }, [
        h('img', { class: 'about-logo', src: 'assets/dplds-logo.webp', alt: '', width: '256', height: '256', loading: 'lazy' }),
        h('div', { class: 'about-id' }, [
          h('b', { class: 'about-name', text: 'DPLDS' }),
          h('span', { class: 'about-sub', text: 'One-man indie studio · Czech Republic' }),
        ]),
      ]),
      h('p', { class: 'about-text', text: 'I’m an indie game developer from the Czech Republic, creating small games and experimental projects. '
        + 'I mainly focus on browser games, simple but addictive mechanics, and retro or nostalgic visual styles. '
        + 'I like mixing humor, internet culture, and old school game aesthetics with modern ideas. '
        + 'I create everything as a one man studio under the name DPLDS.' }),
      h('div', { class: 'about-game' }, [
        h('img', { class: 'about-game-logo', src: 'assets/internet-chaos-logo-480.png', alt: 'Internet Chaos', width: '480', height: '270', loading: 'lazy' }),
        h('p', { class: 'about-credit', text: 'Internet Chaos is a DPLDS game. Thanks for playing!' }),
      ]),
    ]);
  }

  /* ---------- Website name ---------- */

  const NAME_IDEAS = [
    'Bad Takes Daily', 'The Daily Scroll', 'Goose Forum', 'Nobody Asked', 'Dial-Up Diaries', 'Loud Opinions Club',
    'Spicy Pixels', 'Totally Real News', 'Hamster Wheel', 'Comment Zone', 'Byte Me', 'Pixel Swamp',
    'Unfiltered Toast', 'The Group Chat', 'Cursed Café', 'Hot Soup Weekly',
  ];

  /** Name (or rename) the player's website. `o.first` is the first-launch version; `o.onDone` runs after closing. */
  function openSiteName(o) {
    o = o || {};
    const g = game, s = g.s;
    const current = s.siteName || '';
    const input = h('input', {
      type: 'text', id: 'site-name-input', class: 'name-input', maxlength: String(Z.SITE_NAME_MAX), autocomplete: 'off',
      spellcheck: 'false', placeholder: 'e.g. ' + NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)], 'data-autofocus': true,
    });
    input.value = current;
    const preview = h('div', { class: 'name-preview' });
    const msg = h('p', { class: 'form-msg', role: 'alert' });
    const updatePreview = () => {
      const tmp = { siteName: Z.cleanSiteName(input.value) };
      const era = Z.era(s.era);
      preview.textContent = '';
      preview.appendChild(h('span', { class: 'name-preview-url', text: Z.siteText(tmp, era.url[0]) }));
      preview.appendChild(h('b', { class: 'name-preview-title', text: Z.siteText(tmp, era.site) }));
    };
    input.addEventListener('input', () => { msg.textContent = ''; updatePreview(); });
    const dice = h('button', { type: 'button', class: 'btn', text: '🎲 Suggest' });
    dice.addEventListener('click', () => {
      let pick = input.value;
      while (pick === input.value) pick = NAME_IDEAS[Math.floor(Math.random() * NAME_IDEAS.length)];
      input.value = pick;
      updatePreview();
      input.focus();
    });
    const save = () => {
      const name = Z.cleanSiteName(input.value);
      if (!name) { msg.textContent = 'Your website needs a name. Even a bad one.'; input.focus(); return; }
      const changed = name !== s.siteName;
      s.siteName = name;
      Z.save.write(s);
      ui.site.refreshLook();
      ui.requestRender(true);
      ui.modal.close();
      if (changed && !o.first && current) ui.feed.add(g, '🪧', 'The website is now called ' + name + '. Half the users are still calling it ' + current + '.', 'info');
      else if (changed) ui.feed.add(g, '🪧', 'Welcome to ' + name + '. Population: you.', 'info');
      Z.bus.emit('siteRenamed', { name, before: current });
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    const body = h('div', { class: 'name-dialog' }, [
      h('p', { text: o.first
        ? 'Every internet empire starts with a name. Pick one for your website. It shows up on your site, in the comments and everywhere people talk about you.'
        : 'Rename your website. The comment section will have opinions about it.' }),
      h('label', { class: 'set-label', for: 'site-name-input', text: 'Website name' }),
      h('div', { class: 'name-row' }, [input, dice]),
      preview,
      msg,
      h('button', { type: 'button', class: 'btn btn-primary btn-big', text: o.first ? 'Launch my website' : 'Save name', onclick: save }),
    ]);
    updatePreview();
    ui.modal.open({
      id: 'site-name', title: o.first ? 'Name your website' : 'Rename your website', body,
      onClose: () => {
        if (o.onDone) setTimeout(o.onDone, 0);
      },
    });
  }

  /* ---------- Welcome back ---------- */

  /** Counts a number up from 0 for the welcome-back tiles (instantly with reduced motion). */
  function countUp(el, value, format) {
    const reduce = game.s.settings.reduceMotion || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce || !(value > 0)) { el.textContent = format(value); return; }
    const start = performance.now(), dur = 1400;
    const step = now => {
      const t = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(value * eased);
      if (t < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function showOffline(sum) {
    const f = Z.fmt;
    const tiles = [
      ['👁', 'Attention', sum.att, v => '+' + f.num(v), 'att'],
      ['💵', 'Money', sum.money, v => '+' + f.money(v), 'money'],
      ['📰', 'Events', sum.events, v => f.int(v), 'events'],
      ['🔥', 'Meltdowns', sum.meltdowns, v => f.int(v), sum.meltdowns ? 'bad' : 'calm'],
    ];
    const tileEls = tiles.map(([icon, label, value, format, tone]) => {
      const num = h('b', { class: 'off-num', text: format(0) });
      countUp(num, value, format);
      return h('div', { class: 'off-tile off-' + tone }, [h('span', { class: 'off-icon', 'aria-hidden': 'true', text: icon }), num, h('span', { class: 'off-label', text: label })]);
    });
    const lines = [
      ['Chaos created', f.num(sum.chaos) + ' pts'],
      ['Stability', sum.stabilityStart.toFixed(0) + '% → ' + sum.stabilityEnd.toFixed(0) + '%'],
    ];
    if (sum.buys > 0) lines.push(['Bought by the Auto-Buyer', f.int(sum.buys) + ' buildings']);
    const quip = sum.meltdowns > 0
      ? 'Your site melted down ' + sum.meltdowns + ' time' + (sum.meltdowns > 1 ? 's' : '') + ' while you were gone. The servers would like to talk.'
      : sum.events > 3 ? 'The internet kept happening without you. Some of it was even about you.'
        : 'Your site survived without you. Honestly, it seems a little offended.';
    const body = h('div', { class: 'offline' }, [
      h('p', { class: 'offline-lead' }, ['You were away for ', h('b', { text: f.time(sum.away) }), '. Here is what happened.']),
      h('div', { class: 'off-tiles' }, tileEls),
      h('dl', { class: 'stat-table' }, lines.map(([k, v]) => h('div', { class: 'stat-row' }, [h('dt', { text: k }), h('dd', { text: v })]))),
      sum.achievements.length ? h('p', { class: 'offline-ach', text: '🏆 Unlocked: ' + sum.achievements.join(', ') }) : null,
      sum.boost ? h('p', { class: 'offline-boost', text: '🎁 Welcome back! ×' + sum.boost.mult + ' Attention for ' + f.time(sum.boost.seconds) + '. Make it count.' }) : null,
      h('p', { class: 'offline-quip', text: quip }),
      h('p', { class: 'muted', text: 'Offline progress runs at ' + Math.round(sum.efficiency * 100) + '% efficiency for up to ' + sum.capHours + ' hours' + (sum.capped ? ' (you hit the cap; the Night Shift perk raises it)' : '') + '. Chaos, Stability and events keep running while you are away.' }),
      h('button', { type: 'button', class: 'btn btn-primary btn-big', 'data-autofocus': true, text: 'Back to work', onclick: () => ui.modal.close() }),
    ]);
    ui.modal.open({ id: 'offline', title: '👋 While you were away…', body });
    if (sum.boost) {
      ui.feed.add(game, '🎁', 'Welcome back! ×' + sum.boost.mult + ' Attention for ' + f.time(sum.boost.seconds) + '.', 'good');
      Z.audio.play('bonus');
    }
  }

  ui.modals = {
    init(g) { game = g; },
    openEras, openAchievements, openStats, openSettings, showOffline, openSiteName,
  };
})(window.ICHAOS = window.ICHAOS || {});
