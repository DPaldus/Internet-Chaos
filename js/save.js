/* Saving, loading, export/import. Stored and imported data is treated as untrusted:
   it is parsed with JSON.parse only, and every field is copied into a fresh default
   state through type and range checks. Unknown keys are dropped. */
(function (Z) {
  'use strict';

  const U = Z.util;
  const EXPORT_PREFIX = 'ICHAOS1.';
  const LEGACY_PREFIXES = ['ZUHA1.'];   // codes exported before the rename still import
  const MAX_IMPORT_CHARS = 2000000;
  const BIG = 1e300;

  function storage() {
    try { return window.localStorage; } catch (err) { return null; }
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('The save is not a game state object.');
    const now = Date.now();
    const d = Z.state.create(now);
    const n = U.num, i = U.int, b = U.bool, o = U.obj;

    d.seed = i(raw.seed, d.seed, 0, 4294967295) >>> 0;
    d.created = n(raw.created, now, 0, now);
    d.lastSaved = n(raw.lastSaved, now, 0, Number.MAX_SAFE_INTEGER);
    d.siteName = Z.cleanSiteName(U.str(raw.siteName, '', 200));
    d.era = i(raw.era, 1, 1, 999);
    d.cloutLifetime = n(raw.cloutLifetime, 0, 0, BIG);
    d.clout = Math.min(n(raw.clout, 0, 0, BIG), d.cloutLifetime);

    const perks = o(raw.perks);
    for (const p of Z.PERKS) {
      const lvl = i(perks[p.id], 0, 0, p.max);
      if (lvl > 0) d.perks[p.id] = lvl;
    }

    const res = o(raw.res);
    d.res.attention = n(res.attention, 0, 0, BIG);
    d.res.money = n(res.money, 0, 0, BIG);
    d.res.chaos = n(res.chaos, 0, 0, 100);
    d.res.stability = n(res.stability, 100, 0, Z.BAL.stability.max);

    const run = o(raw.run);
    for (const k of Z.state.RUN_KEYS) d.run[k] = n(run[k], d.run[k], 0, BIG);
    d.run.feedMode = i(d.run.feedMode, 1, 0, 2);
    d.run.connections = i(d.run.connections, 0, 0, Z.mech.MAX_FRIENDS);
    d.run.minStab = Math.min(d.run.minStab, 100);

    const bld = o(raw.buildings), seen = o(raw.seen);
    for (const x of Z.BUILDINGS) {
      const count = i(bld[x.id], 0, 0, 1e6);
      if (count > 0) d.buildings[x.id] = count;
      if (seen[x.id] === true) d.seen[x.id] = true;
    }

    const upg = o(raw.upgrades);
    for (const u of Z.UPGRADES) if (upg[u.id] === true) d.upgrades[u.id] = true;

    d.policy = typeof raw.policy === 'string' && Z.POLICY[raw.policy] ? raw.policy : 'normal';

    if (Array.isArray(raw.buffs)) {
      for (const x of raw.buffs.slice(0, 12)) {
        const bx = o(x), def = Z.BUFFS[bx.key];
        if (!def || typeof bx.key !== 'string') continue;
        const buff = Z.effects.addBuffFromSave(bx.key, def, {
          time: n(bx.time, 0, 0, 3600),
          duration: n(bx.duration, def.duration, 1, 3600),
          att: n(bx.att, def.att || 0, 0, 50),
          gained: n(bx.gained, 0, 0, BIG),
        });
        if (buff.time > 0) d.buffs.push(buff);
      }
    }

    const cds = o(raw.cooldowns);
    for (const a of Z.ACTIONS) {
      const v = n(cds[a.id], 0, 0, 3600);
      if (v > 0) d.cooldowns[a.id] = v;
    }

    d.meltdown = n(raw.meltdown, 0, 0, 600);

    const evs = o(raw.events);
    d.events.next = n(evs.next, Z.BAL.events.firstDelay, 0, 600);
    d.events.forced = typeof evs.forced === 'string' && Z.EV[evs.forced] ? evs.forced : null;
    const pend = o(evs.pending);
    if (typeof pend.id === 'string' && Z.EV[pend.id] && Z.EV[pend.id].choices) {
      d.events.pending = { id: pend.id, time: n(pend.time, 10, 0, 60), text: U.str(pend.text, Z.EV[pend.id].title, 300) };
    }

    const tr = o(raw.trend);
    const trendOk = typeof tr.id === 'string' && Z.B[tr.id] && Z.B[tr.id].cat === 'traffic';
    d.trend.id = trendOk ? tr.id : null;
    d.trend.time = trendOk ? n(tr.time, 0, 0, 600) : 0;
    d.trend.next = n(tr.next, Z.BAL.trends.interval, 0, 1000);

    const au = o(raw.auto), cats = o(au.buyCats);
    d.auto.clicker = b(au.clicker, true);
    d.auto.hotfix = b(au.hotfix, true);
    d.auto.hotfixAt = n(au.hotfixAt, 40, 5, 95);
    d.auto.buyer = b(au.buyer, false);
    for (const k of Object.keys(d.auto.buyCats)) d.auto.buyCats[k] = b(cats[k], d.auto.buyCats[k]);
    d.auto.policy = b(au.policy, false);
    d.auto.prOn = b(au.prOn, false);
    d.auto.pr = au.pr === 'bold' ? 'bold' : 'safe';
    d.auto.scheduler = b(au.scheduler, false);

    const acc = o(raw.accum);
    for (const k of Object.keys(d.accum)) d.accum[k] = n(acc[k], 0, 0, 100);

    const ach = o(raw.achievements);
    for (const a of Z.ACHIEVEMENTS) {
      const t = n(ach[a.id], 0, 0, Number.MAX_SAFE_INTEGER);
      if (t > 0) d.achievements[a.id] = t;
    }

    const st = o(raw.stats);
    for (const k of Z.state.STAT_KEYS) d.stats[k] = n(st[k], d.stats[k], 0, BIG);

    const fl = o(raw.flags), rev = o(fl.reveal), evc = o(fl.ev);
    for (const k of Z.REVEAL_KEYS) if (rev[k] === true) d.flags.reveal[k] = true;
    // Event counts, action counts (act:<id>) and era-mechanic counters (mech:…, mechIntro:…).
    for (const k in evc) {
      if (!/^(act:|mech:|mechIntro:)?[A-Za-z0-9_-]{1,32}$/.test(k)) continue;
      const v = i(evc[k], 0, 0, 1e9);
      if (v > 0) d.flags.ev[k] = v;
    }
    d.flags.lowChaosAt = n(fl.lowChaosAt, -999, -999, BIG);
    d.flags.serverWatch = n(fl.serverWatch, 0, 0, 60);
    d.flags.serverSurvived = b(fl.serverSurvived, false);
    d.flags.cpsPeak = n(fl.cpsPeak, 0, 0, 1000);
    d.flags.exported = b(fl.exported, false);
    d.flags.muted = b(fl.muted, false);
    d.flags.tutorial = b(fl.tutorial, false);
    d.flags.lastBackup = n(fl.lastBackup, 0, 0, Number.MAX_SAFE_INTEGER);
    d.flags.backupAt = n(fl.backupAt, 0, 0, BIG);
    d.flags.backupSnooze = n(fl.backupSnooze, 0, 0, BIG);
    d.flags.osOffer = typeof fl.osOffer === 'string' && Z.OS[fl.osOffer] ? fl.osOffer : '';

    const se = o(raw.settings);
    d.settings.sound = b(se.sound, true);
    d.settings.volume = n(se.volume, 0.6, 0, 1);
    d.settings.music = b(se.music, true);
    d.settings.musicVolume = n(se.musicVolume, 0.5, 0, 1);
    d.settings.notation = se.notation === 'sci' ? 'sci' : 'short';
    d.settings.reduceMotion = b(se.reduceMotion, false);
    d.settings.buyQty = ['1', '10', '25', 'max'].indexOf(se.buyQty) >= 0 ? se.buyQty : '1';

    const os = o(raw.os), osBase = o(os.base);
    d.os.id = typeof os.id === 'string' && Z.OS[os.id] ? os.id : Z.OSES[0].id;
    d.os.installed = n(os.installed, 0, 0, Number.MAX_SAFE_INTEGER);
    if (d.os.id !== Z.OSES[0].id) {
      for (const k of Z.state.STAT_KEYS) d.os.base[k] = Math.min(n(osBase[k], 0, 0, BIG), d.stats[k]);
    }

    // Only the current OS's themes count; choices fall back to that OS's free defaults.
    const cos = o(raw.cosmetics), owned = o(cos.unlocked);
    Object.assign(d.cosmetics, Z.COSMETICS.defaultsFor(d.os.id));
    for (const key in Z.COSMETICS.ITEM) {
      const item = Z.COSMETICS.ITEM[key];
      if (item.os === d.os.id && item.req && owned[key] === true) d.cosmetics.unlocked[key] = true;
    }
    for (const cat of Z.COSMETICS.setFor(d.os.id)) {
      const item = typeof cos[cat.id] === 'string' ? Z.COSMETICS.ITEM[cat.id + ':' + cos[cat.id]] : null;
      if (item && item.os === d.os.id && (!item.req || d.cosmetics.unlocked[cat.id + ':' + item.id])) d.cosmetics[cat.id] = item.id;
    }

    // Finished eras.
    if (Array.isArray(raw.history)) {
      for (const x of raw.history.slice(-200)) {
        const hx = o(x);
        d.history.push({
          era: i(hx.era, 1, 1, 999), time: n(hx.time, 0, 0, BIG), clout: n(hx.clout, 0, 0, BIG),
          attention: n(hx.attention, 0, 0, BIG), money: n(hx.money, 0, 0, BIG), meltdowns: i(hx.meltdowns, 0, 0, 1e6),
          clicks: i(hx.clicks, 0, 0, 1e12), upgrades: i(hx.upgrades, 0, 0, 1e6),
          os: typeof hx.os === 'string' && Z.OS[hx.os] ? hx.os : Z.OSES[0].id,
          challenges: i(hx.challenges, 0, 0, 3), at: n(hx.at, 0, 0, Number.MAX_SAFE_INTEGER),
          v: i(hx.v, 1, 1, 1e6),
        });
      }
    }

    // Reboot the Internet.
    const rbt = o(raw.reboot), rbtUp = o(rbt.upgrades);
    d.reboot.count = i(rbt.count, 0, 0, 1e6);
    d.reboot.bandwidth = n(rbt.bandwidth, 0, 0, BIG);
    d.reboot.lifetime = Math.max(n(rbt.lifetime, 0, 0, BIG), d.reboot.bandwidth);
    for (const u of Z.REBOOT_UPGRADES) {
      const lvl = i(rbtUp[u.id], 0, 0, u.max);
      if (lvl > 0) d.reboot.upgrades[u.id] = lvl;
    }
    d.reboot.protocol = typeof rbt.protocol === 'string' && Z.PROTOCOL[rbt.protocol] ? rbt.protocol : 'standard';
    d.reboot.hard = i(rbt.hard, 0, 0, d.reboot.count);

    // Era challenges.
    const ch = o(raw.challenges), chDone = o(ch.done), chRun = o(ch.run);
    for (const c of Z.CHALLENGES) {
      const t = n(chDone[c.id], 0, 0, Number.MAX_SAFE_INTEGER);
      if (t > 0) d.challenges.done[c.id] = t;
      if (chRun[c.id] === true && c.era === Math.min(d.era, 7)) d.challenges.run[c.id] = true;
    }

    // Statistics when this era started. Older saves have none: count "this era" from now.
    const rb = o(raw.runBase);
    if (raw.runBase && typeof raw.runBase === 'object') {
      const rbs = o(rb.stats), rbe = o(rb.ev);
      for (const k of Z.state.STAT_KEYS) d.runBase.stats[k] = Math.min(n(rbs[k], 0, 0, BIG), d.stats[k]);
      for (const k in d.flags.ev) d.runBase.ev[k] = Math.min(i(rbe[k], 0, 0, 1e9), d.flags.ev[k]);
    } else {
      Z.meta.snapshotRun(d);
    }

    // Daily challenge.
    const dl = o(raw.daily), dayOk = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (dayOk(dl.date) && Z.DAILY_MOD[dl.mod] && Z.DAILY_GOAL[dl.goal]) {
      d.daily.date = dl.date;
      d.daily.mod = dl.mod;
      d.daily.goal = dl.goal;
      d.daily.base = Math.min(n(dl.base, 0, 0, BIG), d.stats[Z.DAILY_GOAL[dl.goal].stat] || 0);
      d.daily.done = b(dl.done, false);
    }
    d.daily.streak = i(dl.streak, 0, 0, 100000);
    d.daily.last = dayOk(dl.last) ? dl.last : '';

    // The era mechanic carries on where it was. The flame war's bonus only lasts while it burns.
    d.mech = Z.mech.fromSave(raw.mech, d);
    if (!(d.mech.active && d.mech.active.kind === 'flame')) d.buffs = d.buffs.filter(x => x.key !== 'flameWar');

    if (Array.isArray(raw.feed)) {
      const kinds = ['good', 'bad', 'info', 'achieve', 'era'];
      for (const x of raw.feed.slice(-20)) {
        const fx = o(x);
        const text = U.str(fx.text, '', 240);
        if (!text) continue;
        d.feed.push({
          t: n(fx.t, now, 0, Number.MAX_SAFE_INTEGER),
          icon: U.str(fx.icon, '•', 8),
          text,
          kind: kinds.indexOf(fx.kind) >= 0 ? fx.kind : 'info',
        });
      }
    }
    return d;
  }

  function serialize(s) {
    return JSON.stringify(s);
  }

  function write(s) {
    s.lastSaved = Date.now();
    const json = serialize(s);
    const st = storage();
    if (!st) return false;
    try {
      st.setItem(Z.SAVE_KEY, json);
      return true;
    } catch (err) {
      return false;
    }
  }

  /** Saves made before the rename used other storage keys: carry the first readable one over. */
  function migrateLegacy(st) {
    for (const key of Z.LEGACY_SAVE_KEYS) {
      let raw = null;
      try { raw = st.getItem(key); } catch (err) { raw = null; }
      if (!raw) continue;
      try { JSON.parse(raw); } catch (err) { continue; }
      try { st.setItem(Z.SAVE_KEY, raw); } catch (err) { /* keep playing from memory */ }
      return raw;
    }
    return null;
  }

  /** Returns {state, error, fresh}. Falls back to the backup copy if the main save is broken. */
  function load() {
    const st = storage();
    if (!st) return { state: null, error: null, fresh: true };
    let raw = null;
    try { raw = st.getItem(Z.SAVE_KEY); } catch (err) { raw = null; }
    if (!raw) raw = migrateLegacy(st);
    if (!raw) return { state: null, error: null, fresh: true };
    try {
      const state = sanitize(JSON.parse(raw));
      try { st.setItem(Z.BACKUP_KEY, raw); } catch (err) { /* storage full: keep playing */ }
      return { state, error: null, fresh: false };
    } catch (err) {
      try { st.setItem(Z.CORRUPT_KEY, raw); } catch (e2) { /* ignore */ }
      let backup = null;
      try { backup = st.getItem(Z.BACKUP_KEY); } catch (e3) { backup = null; }
      if (backup) {
        try {
          return { state: sanitize(JSON.parse(backup)), error: 'Your save was damaged, so the last backup was restored.', fresh: false };
        } catch (e4) { /* fall through */ }
      }
      return { state: null, error: 'Your save could not be read, so a new game started. The damaged data was kept separately.', fresh: true };
    }
  }

  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
    return btoa(bin);
  }

  function decodeBase64(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new TextDecoder().decode(bytes);
  }

  function exportString(s) {
    s.lastSaved = Date.now();
    return EXPORT_PREFIX + encodeBase64(serialize(s));
  }

  /** Throws an Error with a readable message when the text is not a valid save. */
  function importString(text) {
    if (typeof text !== 'string') throw new Error('Paste a save code first.');
    const t = text.trim();
    if (!t) throw new Error('Paste a save code first.');
    if (t.length > MAX_IMPORT_CHARS) throw new Error('That save code is too large to be an Internet Chaos save.');
    let json;
    if (t.charAt(0) === '{') json = t;
    else {
      const prefix = [EXPORT_PREFIX].concat(LEGACY_PREFIXES).find(p => t.indexOf(p) === 0);
      if (!prefix) throw new Error('That is not an Internet Chaos save code. Codes start with "' + EXPORT_PREFIX + '".');
      try { json = decodeBase64(t.slice(prefix.length).replace(/\s+/g, '')); } catch (err) {
        throw new Error('The save code is damaged. Copy the whole code and try again.');
      }
    }
    let parsed;
    try { parsed = JSON.parse(json); } catch (err) {
      throw new Error('The save code is damaged. Copy the whole code and try again.');
    }
    return sanitize(parsed);
  }

  function wipe() {
    const st = storage();
    if (!st) return;
    try { st.removeItem(Z.SAVE_KEY); st.removeItem(Z.BACKUP_KEY); for (const k of Z.LEGACY_SAVE_KEYS) st.removeItem(k); } catch (err) { /* ignore */ }
  }

  Z.save = { sanitize, write, load, exportString, importString, wipe };
})(window.ICHAOS = window.ICHAOS || {});
