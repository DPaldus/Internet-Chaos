/* CSS audit for css/game.css (developer tool, not loaded by the game).
   Load it into the running game page (http, not file://) and call:
     await CSS_AUDIT.capture()          snapshot ~50 game states (every era, modals, themes, both OS skins…)
     await CSS_AUDIT.frames([1500, 520]) render each snapshot in hidden iframes at those widths
     await CSS_AUDIT.findDead()         declarations whose removal changes no computed style anywhere
     await CSS_AUDIT.compare(hrefA, hrefB) every element's computed style under two stylesheets
   Snapshots are static copies of the DOM, so the audit sees exactly what players see. */
(function () {
  'use strict';

  const Z = window.ICHAOS;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // Yields to the browser without timer throttling (hidden tabs slow setTimeout down).
  const yieldNow = () => new Promise(r => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });
  const A = window.CSS_AUDIT = { states: [], frameList: [] };

  /* ---------- 1. Game states ---------- */

  function renderAll() {
    const g = Z.game, ui = Z.ui;
    g.refresh();
    ui.hud.render(g);
    ui.site.render(g, 0.1);
    ui.panels.renderFast(g, 0.1);
    ui.shop.render(g);
    ui.panels.renderSlow(g);
    ui.modal.refresh();
    ui.layout.syncTabs();
  }

  function snap(name, html) {
    const body = (html || document.body.outerHTML).replace(/<script[\s\S]*?<\/script>/g, '');
    A.states.push({ name, body });
  }

  /** The same snapshot with different <body> attributes. */
  function variant(name, base, attrs, cls) {
    const st = A.states.find(x => x.name === base);
    let body = st.body.replace(/^<body([^>]*)>/, (all, a) => {
      let out = a;
      for (const k in attrs) {
        const re = new RegExp('\\s' + k + '="[^"]*"');
        out = re.test(out) ? out.replace(re, ' ' + k + '="' + attrs[k] + '"') : out + ' ' + k + '="' + attrs[k] + '"';
      }
      if (cls !== undefined) out = /\sclass="/.test(out) ? out.replace(/\sclass="[^"]*"/, ' class="' + cls + '"') : out + ' class="' + cls + '"';
      return '<body' + out + '>';
    });
    A.states.push({ name, body });
  }

  A.capture = async function () {
    const g = Z.game, ui = Z.ui;
    A.states = [];
    // Freeze the live game so nothing changes between steps.
    g.tick = function () {};
    ui.requestRender = function () {};
    const fresh = Z.state.create(Date.now());
    fresh.siteName = 'Audit Site';
    fresh.flags.tutorial = true;
    ui.replaceState(fresh);
    ui.modal.close();
    renderAll();
    snap('fresh');

    ui.help.startTour(); await wait(50); snap('tour-center');
    document.querySelector('.tour-card .btn-primary').click(); await wait(50); snap('tour-target');
    ui.help.endTour(false);

    // A busy mid-game screen: everything revealed and something happening everywhere.
    const s = g.s;
    for (const k of Z.REVEAL_KEYS) s.flags.reveal[k] = true;
    for (const b of Z.BUILDINGS) if (b.era === 1) { s.buildings[b.id] = 12; s.seen[b.id] = true; }
    for (const id of ['cookies', 'energy', 'hottake', 'autoplay', 'affiliate', 'intern', 'sre', 'brakes', 'keyboard']) s.upgrades[id] = true;
    s.run.attention = s.stats.totalAttention = 2e8;
    s.res.money = 1e12; s.run.money = 1e12;
    s.res.chaos = 70; s.res.stability = 25; s.run.maxChaos = 90;
    s.stats.totalClicks = 3000; s.stats.highestChaos = 90;
    s.cloutLifetime = 5; s.clout = 5;
    for (const a of Z.ACHIEVEMENTS.slice(0, 12)) s.achievements[a.id] = Date.now();
    s.cosmetics.unlocked['bg:hills'] = true;
    g.dirty = true; g.refresh();
    Z.effects.addBuff(g, 'viral'); Z.effects.addBuff(g, 'cringe'); Z.effects.addBuff(g, 'notifFrenzy');
    s.cooldowns.hotfix = 20;
    s.events.forced = 'advertiser'; Z.events.fire(g); ui.panels.showChoice(g);
    for (let i = 0; i < 12; i++) ui.feed.add(g, '📰', 'Audit feed line ' + i, ['info', 'good', 'bad', 'achieve', 'era'][i % 5]);
    for (const kind of ['info', 'good', 'bad', 'achieve', 'era']) ui.toast({ icon: '•', title: 'Toast ' + kind, text: 'text', kind, duration: 600000 });
    g.bonus.live = null; g.bonus.next = 0; g.bonusHold = false;
    Z.bonus.tick(g, 0.1);
    ui.sponsors.reset();
    renderAll();
    document.getElementById('upg-toggle').click(); renderAll();
    ui.backup.check && (s.stats.playTime = 9000, s.flags.backupAt = 0);
    document.querySelector('.save-nudge') || (ui.backup.check && ui.backup.check());
    document.getElementById('btn-menu').click();
    snap('mid');
    document.getElementById('btn-menu').click();
    ui.layout.select('panel-analytics'); renderAll(); snap('mid-analytics');
    ui.layout.select('panel-auto'); renderAll(); snap('mid-auto');
    ui.layout.select('pane-feed');
    for (const tab of ['money', 'infra', 'mod']) { ui.shop.selectTab(tab); renderAll(); snap('shop-' + tab); }
    ui.shop.selectTab('traffic');

    s.meltdown = 20; renderAll(); snap('meltdown'); s.meltdown = 0;
    s.res.stability = 55; renderAll(); snap('mid-warn');

    // Dialogs
    const modal = async (name, open) => { open(); await wait(80); renderAll(); snap(name); ui.modal.close(); };
    await modal('m-eras', ui.modals.openEras);
    await modal('m-ach', ui.modals.openAchievements);
    await modal('m-stats', ui.modals.openStats);
    await modal('m-settings', ui.modals.openSettings);
    await modal('m-help', ui.help.open);
    await modal('m-name', () => ui.modals.openSiteName({ first: true }));
    await modal('m-rename', () => ui.modals.openSiteName());
    await modal('m-offline', () => ui.modals.showOffline({ away: 4000, simulated: 4000, capped: false, capHours: 8, efficiency: 0.6, att: 1e6, money: 2e5, chaos: 300, events: 4, meltdowns: 1, buys: 3, achievements: ['Clicker'], stabilityStart: 80, stabilityEnd: 40 }));
    ui.confirm({ title: 'Audit?', text: 'Confirm box', confirmLabel: 'Yes', danger: true }); await wait(50); snap('m-confirm'); ui.modal.close();
    for (const cat of ['bg', 'color', 'site', 'fx']) {
      ui.styleShop.open(); await wait(50);
      const tab = [...document.querySelectorAll('.style-tab')].find(t => t.textContent.toLowerCase().includes({ bg: 'background', color: 'color', site: 'website', fx: 'effect' }[cat]));
      if (tab) tab.click();
      await wait(50); snap('m-style-' + cat); ui.modal.close();
    }
    for (const [page, chaos] of [['blog', 5], ['meme', 50], ['comments', 95]]) {
      s.res.chaos = chaos;
      ui.chat.open(page); await wait(400);
      const reply = document.querySelector('.cp-reply, [data-reply], .cmt-reply');
      if (reply && page === 'comments') reply.click();
      await wait(50); snap('chat-' + page); ui.modal.close();
    }

    // Body-attribute variants of the busy screen
    for (let e = 2; e <= 7; e++) variant('era-' + e, 'mid', { 'data-era': String(e) });
    variant('level-5', 'mid', { 'data-level': '5' });
    variant('level-0', 'mid', { 'data-level': '0' });
    const C = Z.COSMETICS;
    const ids = cat => C.CAT[cat].items.map(i => i.id);
    for (let i = 0; i < 6; i++) {
      variant('cos-' + i, 'mid', { 'data-bg': ids('bg')[i], 'data-color': ids('color')[i], 'data-site-style': ids('site')[i], 'data-fx': ids('fx')[i] });
    }
    variant('cos-era5', 'mid', { 'data-era': '5', 'data-site-style': 'retro', 'data-bg': 'aurora' });
    // ChaosOS 8 Metro: the same busy screen in the Metro skin with each of its themes.
    const metro = cat => C.setFor('metro').find(c => c.id === cat).items.map(i => i.id);
    for (let i = 0; i < 6; i++) {
      variant('metro-' + i, 'mid', { 'data-os': 'metro', 'data-era': String(2 + i), 'data-bg': metro('bg')[i], 'data-color': metro('color')[i], 'data-site-style': metro('site')[i], 'data-fx': metro('fx')[i] });
    }
    variant('reduce-motion', 'mid', {}, 'reduce-motion');
    variant('shake', 'mid', {}, 'shake era-flash');
    return A.states.map(x => x.name);
  };

  /* ---------- 2. Frames ---------- */

  const FREEZE = '<style id="audit-freeze">*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}</style>';

  function frameHTML(body, href) {
    const fonts = [...document.querySelectorAll('link[rel=stylesheet]')].filter(l => !l.href.startsWith(location.origin)).map(l => l.outerHTML).join('');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="' + location.origin + '/">' + fonts
      + '<link id="audit-css" class="audit-css" rel="stylesheet" href="' + href + '">' + FREEZE + '</head>' + body + '</html>';
  }

  A.frames = async function (widths, href) {
    for (const f of A.frameList) f.el.remove();
    A.frameList = [];
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(host);
    const jobs = [];
    for (const st of A.states) {
      const list = st.name === 'mid' ? widths.concat([375]) : widths;
      for (const w of list) {
        const el = document.createElement('iframe');
        el.style.cssText = 'width:' + w + 'px;height:900px;border:0';
        host.appendChild(el);
        const f = { el, name: st.name + '@' + w, w };
        A.frameList.push(f);
        jobs.push(new Promise(res => {
          el.onload = () => res();
          el.srcdoc = frameHTML(st.body, href || 'css/game.css');
        }));
      }
    }
    await Promise.all(jobs);
    for (const f of A.frameList) {
      f.doc = f.el.contentDocument; f.win = f.el.contentWindow;
      await f.doc.fonts.ready;
      f.doc.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (err) { /* ignore */ } });
    }
    await wait(300);
    return A.frameList.length;
  };

  /* ---------- 3. Source parser (rules + declarations with offsets) ---------- */

  function parse(src) {
    let i = 0;
    const n = src.length, rules = [], keyframes = [];
    const skipComment = () => { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; };
    const skipString = () => { const q = src[i]; i++; while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; } i++; };
    const ws = () => { while (i < n) { if (src.startsWith('/*', i)) skipComment(); else if (/\s/.test(src[i])) i++; else break; } };
    function until(stops) {
      const start = i; let paren = 0;
      while (i < n) {
        const c = src[i];
        if (src.startsWith('/*', i)) { skipComment(); continue; }
        if (c === '"' || c === "'") { skipString(); continue; }
        if (c === '(') paren++;
        else if (c === ')') paren--;
        else if (!paren && stops.indexOf(c) >= 0) break;
        i++;
      }
      return src.slice(start, i);
    }
    function skipBlock() { let depth = 1; while (i < n && depth) { if (src.startsWith('/*', i)) { skipComment(); continue; } const c = src[i]; if (c === '"' || c === "'") { skipString(); continue; } if (c === '{') depth++; else if (c === '}') depth--; i++; } }
    function decls(rule) {
      while (true) {
        ws();
        if (i >= n) return;
        if (src[i] === '}') { i++; return; }
        const start = i;
        const prop = until(':;}').trim();
        if (src[i] !== ':') { if (src[i] === ';') i++; continue; }
        i++;
        const value = until(';}');
        if (src[i] === ';') i++;
        rule.decls.push({ prop: prop.toLowerCase(), value: value.trim(), start, end: i });
      }
    }
    function block(media) {
      while (true) {
        ws();
        if (i >= n) return;
        if (src[i] === '}') { i++; return; }
        const start = i;
        const prelude = until('{;}').trim();
        if (src[i] === ';') { i++; continue; }
        if (src[i] === '}') { i++; return; }
        i++;
        if (/^@(media|supports|container)/.test(prelude)) block(media.concat([prelude]));
        else if (/^@(-webkit-)?keyframes/.test(prelude)) { const kstart = start; skipBlock(); keyframes.push({ name: prelude.split(/\s+/)[1], start: kstart, end: i }); }
        else if (prelude[0] === '@') skipBlock();
        else { const r = { sel: prelude, start, media, decls: [] }; decls(r); r.end = i; rules.push(r); }
      }
    }
    block([]);
    return { rules, keyframes };
  }
  A.parse = parse;

  /* ---------- 4. Matching CSSOM rules to source rules ---------- */

  const norm = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/["']/g, '').replace(/(^|[^:]):(before|after|placeholder)\b/g, '$1::$2').replace(/\s+/g, '').toLowerCase();

  function flatRules(sheet) {
    const out = [];
    const walk = list => { for (const r of list) { if (r.type === 1) out.push(r); else if (r.cssRules && (r.type === 4 || r.type === 12 || (r.constructor && /Container|Supports|Media/.test(r.constructor.name)))) walk(r.cssRules); } };
    walk(sheet.cssRules);
    return out;
  }

  function align(srcRules, cssom) {
    const pairs = [];
    let a = 0, b = 0, skipped = [];
    while (a < srcRules.length && b < cssom.length) {
      if (norm(srcRules[a].sel) === norm(cssom[b].selectorText)) { pairs.push([a, b]); a++; b++; continue; }
      let found = -1;
      for (let k = 1; k <= 6 && a + k < srcRules.length; k++) if (norm(srcRules[a + k].sel) === norm(cssom[b].selectorText)) { found = a + k; break; }
      if (found >= 0) { for (let k = a; k < found; k++) skipped.push(srcRules[k].sel); a = found; }
      else b++;
    }
    for (; a < srcRules.length; a++) skipped.push(srcRules[a].sel);
    return { pairs, skipped };
  }

  /* ---------- 5. Dead declaration search ---------- */

  const DYNAMIC = /:(hover|active|focus|focus-visible|focus-within|visited|target|checked|indeterminate|placeholder-shown|invalid|valid|autofill|-webkit-autofill)\b|::(selection|placeholder|marker|backdrop|-webkit-|-moz-|cue|file-selector-button)|:-webkit-|:-moz-/;

  function splitSelectors(sel) {
    const out = []; let depth = 0, cur = '';
    for (const c of sel) { if (c === '(' || c === '[') depth++; if (c === ')' || c === ']') depth--; if (c === ',' && !depth) { out.push(cur.trim()); cur = ''; } else cur += c; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function targets(f, sel) {
    const found = [];
    for (const part of splitSelectors(sel)) {
      const m = part.match(/::?(before|after)\s*$/);
      const pseudo = m ? '::' + m[1] : null;
      const base = m ? part.slice(0, m.index) || '*' : part;
      let els;
      try { els = f.doc.querySelectorAll(base); } catch (err) { return null; }
      for (const el of els) found.push([el, pseudo]);
    }
    return found;
  }

  /* Computed values (computedStyleMap) need no layout, so each probe stays fast, and they
     are stricter than resolved pixel values: equal computed styles mean an equal page. */
  function styleString(f, el, pseudo) {
    if (!pseudo && el.computedStyleMap) {
      let out = '';
      for (const [p, v] of el.computedStyleMap()) out += p + ':' + v.join(',') + ';';
      return out;
    }
    const cs = f.win.getComputedStyle(el, pseudo);
    if (pseudo) { const c = cs.getPropertyValue('content'); if (c === 'none' || c === 'normal') return pseudo + ':none'; }
    let out = '';
    for (let k = 0; k < cs.length; k++) out += cs[k] + ':' + cs.getPropertyValue(cs[k]) + ';';
    return out;
  }

  function mediaOK(f, media) {
    for (const m of media) {
      if (m.startsWith('@media')) { if (!f.win.matchMedia(m.slice(6).trim()).matches) return false; }
      else return null;   // @supports / @container: not evaluated here, keep the rule
    }
    return true;
  }

  A.findDead = async function (href) {
    href = href || 'css/game.css';
    const src = await (await fetch(href, { cache: 'reload' })).text();
    const { rules } = parse(src);
    const perFrame = A.frameList.map(f => flatRules(f.doc.getElementById('audit-css').sheet));
    const { pairs, skipped } = align(rules, perFrame[0]);
    const dead = [], untested = [], unmatchedRules = [];
    let tested = 0;
    for (const [ri, ci] of pairs) {
      const r = rules[ri];
      // Kept untested: dynamic states, media blocks (only two widths are sampled, and the
      // test browser may prefer reduced motion), and anything reduced-motion rules touch.
      if (DYNAMIC.test(r.sel) || r.media.length || /marquee-track/.test(r.sel)) { untested.push(r.sel); continue; }
      const live = [];
      let unknownMedia = false;
      A.frameList.forEach((f, fi) => {
        const ok = mediaOK(f, r.media);
        if (ok === null) { unknownMedia = true; return; }
        if (!ok) return;
        const t = targets(f, r.sel);
        if (t && t.length) live.push({ f, rule: perFrame[fi][ci], t });
      });
      if (unknownMedia) { untested.push(r.sel); continue; }
      if (!live.length) { unmatchedRules.push({ sel: r.sel, media: r.media.join(' ') }); continue; }
      const props = r.decls.map(d => d.prop);
      // Skip repeated properties and shorthand/longhand pairs in the same rule: CSSOM merges them.
      const tangled = p => props.filter(q => q === p || q.startsWith(p + '-') || p.startsWith(q + '-')).length > 1;
      for (const d of r.decls) {
        if (tangled(d.prop) || (d.prop[0] === '-' && d.prop[1] !== '-') || /^(animation|transition)/.test(d.prop)) continue;
        let used = false;
        for (const x of live) {
          const { f, rule, t } = x;
          if (!x.base) x.base = t.map(([el, p]) => styleString(f, el, p));   // the untouched look, measured once
          const text = rule.style.cssText;
          rule.style.removeProperty(d.prop);
          const after = t.map(([el, p]) => styleString(f, el, p));
          rule.style.cssText = text;   // exact restore, declaration order included
          if (x.base.some((v, k) => v !== after[k])) { used = true; break; }
        }
        tested++;
        if (!used) {
          // Keep it removed in every frame, so later tests account for it: two rules that
          // each look redundant can't both go, and this finds a set that can go together.
          perFrame.forEach(list => list[ci].style.removeProperty(d.prop));
          dead.push({ sel: r.sel, prop: d.prop, value: d.value, start: d.start, end: d.end });
        }
      }
      A.progress = 'rule ' + ri + '/' + rules.length + ', dead ' + dead.length;
      await yieldNow();
    }
    A.lastDead = dead;
    return { tested, dead: dead.length, untested: untested.length, unmatched: unmatchedRules.length, skipped, unmatchedRules };
  };

  /* ---------- 6. Before/after comparison of every element ---------- */

  /** Frame by frame: load stylesheet(s) A, record every element, load B, compare. */
  A.compare = async function (hrefA, hrefB) {
    const swap = (f, hrefs) => {
      hrefs = [].concat(hrefs);
      const old = [...f.doc.querySelectorAll('link.audit-css')];
      const anchor = old[old.length - 1];
      const loads = hrefs.slice().reverse().map(href => new Promise(res => {
        const next = f.doc.createElement('link');
        next.rel = 'stylesheet'; next.href = href; next.className = 'audit-css';
        next.onload = res; next.onerror = res;
        anchor.after(next);
      }));
      return Promise.all(loads).then(() => {
        old.forEach(l => l.remove());
        f.doc.getAnimations().forEach(a => { try { a.pause(); a.currentTime = 0; } catch (err) { /* ignore */ } });
      });
    };
    const record = f => [...f.doc.querySelectorAll('*')].filter(el => !el.closest('head'))
      .map(el => styleString(f, el, null) + '|' + styleString(f, el, '::before') + '|' + styleString(f, el, '::after'));
    const diffs = [];
    let count = 0, elements = 0, done = 0;
    for (const f of A.frameList) {
      await swap(f, hrefA);
      const a = record(f);
      await swap(f, hrefB);
      const b = record(f);
      const els = [...f.doc.querySelectorAll('*')].filter(el => !el.closest('head'));
      elements += a.length;
      let shown = 0;
      for (let k = 0; k < a.length; k++) {
        if (a[k] === b[k]) continue;
        count++;
        if (shown++ < 2 && diffs.length < 30) {
          const pa = a[k].split(/[;|]/), pb = b[k].split(/[;|]/);
          const changed = pa.filter((p, j) => p !== pb[j]).slice(0, 3).concat(['→']).concat(pb.filter((p, j) => p !== pa[j]).slice(0, 3));
          diffs.push(f.name + ' ' + els[k].tagName.toLowerCase() + '.' + String(els[k].className).slice(0, 40) + ' ' + changed.join(' '));
        }
      }
      A.progress = 'compared ' + (++done) + '/' + A.frameList.length + ', differing elements ' + count;
      await yieldNow();
    }
    return { frames: A.frameList.length, elements, diffCount: count, diffs };
  };
})();
