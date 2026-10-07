/* Languages. The game is written in English; other languages translate what is on the
   screen. A MutationObserver watches the page and translates every text node and the
   title / aria-label / placeholder attributes as the interface writes them, using the
   active language's dictionary (js/lang/*.js):
     exact    { 'English text': 'translation' } for whole strings
     patterns [[/^regex$/, replacement], …] for strings with numbers or names in them
   Strings that match neither are tried in pieces (split at " · ", ", " and between
   sentences), so composed texts translate when their parts are known. Anything unknown
   simply stays in English. The choice is stored in this browser (Settings → Language)
   and applied on the next page load. */
(function (Z) {
  'use strict';

  const KEY = 'internet-chaos:lang';
  const LANGS = { en: 'English', cs: 'Čeština' };
  let lang = 'en';
  try { lang = LANGS[localStorage.getItem(KEY)] ? localStorage.getItem(KEY) : 'en'; } catch (err) { lang = 'en'; }

  const cache = new Map();
  const EMOJI_PREFIX = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[\u{1F3FB}-\u{1F3FF}️‍✦✓✔✕×▶◀▲▼↻⟳☰])+\s*)(.+)$/u;
  const SKIP = 'script, style, textarea, input, select, [data-no-i18n], .dev-menu';

  function dict() { return Z.LANG && Z.LANG[lang]; }

  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const SENTENCE_BREAK = /[.!?…] [A-Z#"“]/;

  /** The dictionary's own answer for a whole string (exact or pattern), or null. */
  function whole(text) {
    const d = dict();
    if (has(d.exact, text)) return d.exact[text];
    // "Title." at the end of a sentence: the title without its full stop is enough.
    if (/[.!]$/.test(text) && has(d.exact, text.slice(0, -1))) return d.exact[text.slice(0, -1)] + text.slice(-1);
    for (const [re, rep, multi] of d.patterns) {
      const m = re.exec(text);
      if (!m) continue;
      // A pattern for one sentence must not swallow the next one ("Title. Text…").
      if (!multi && m.slice(1).some(c => c && SENTENCE_BREAK.test(c))) continue;
      return typeof rep === 'function' ? rep.apply(null, m) : text.replace(re, rep);
    }
    return null;
  }

  function core(text) {
    const w = whole(text);
    if (w !== null) return w;
    // An emoji in front: translate the rest.
    const em = EMOJI_PREFIX.exec(text);
    if (em) { const rest = tr(em[2]); if (rest !== em[2]) return em[1] + rest; }
    // Composed strings: translate the pieces. Sentences first, then " · " and " — " lists;
    // a comma list only when every piece is known, so nothing ends up half translated.
    const sentences = text.split(/(?<=[.!?…)])\s+(?=[A-Z0-9#"“(🎯])/);
    if (sentences.length > 1) {
      // Take the longest run of sentences the dictionary knows as one piece, then go on.
      const out = [];
      let changed = false;
      for (let i = 0; i < sentences.length;) {
        let j = sentences.length;
        for (; j > i + 1; j--) {
          const t = whole(sentences.slice(i, j).join(' '));
          if (t !== null) { out.push(t); changed = true; break; }
        }
        if (j === i + 1) { const one = tr(sentences[i]); if (one !== sentences[i]) changed = true; out.push(one); }
        i = j;
      }
      if (changed) return out.join(' ');
    }
    for (const sep of [' · ', ' — ', ', ']) {
      if (text.indexOf(sep) < 0) continue;
      const parts = text.split(sep), out = parts.map(tr);
      const changed = out.filter((p, i) => p !== parts[i]).length;
      if (sep === ', ' ? changed === parts.length : changed > 0) return out.join(sep);
    }
    return text;
  }

  /** Translates one string into the active language (the string itself if unknown). */
  function tr(text) {
    if (lang === 'en' || typeof text !== 'string' || !dict()) return text;
    const trimmed = text.trim();
    if (!trimmed || !/[A-Za-z]{2}/.test(trimmed)) return text;
    let out = cache.get(trimmed);
    if (out === undefined) {
      out = core(trimmed);
      if (cache.size > 6000) cache.clear();
      cache.set(trimmed, out);
    }
    if (out === trimmed) return text;
    const lead = text.slice(0, text.indexOf(trimmed.charAt(0)));
    const trail = text.slice(text.lastIndexOf(trimmed.charAt(trimmed.length - 1)) + 1);
    return lead + out + trail;
  }

  /* ---------- The page ---------- */

  const ATTRS = ['title', 'aria-label', 'placeholder'];

  function translateText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const v = node.nodeValue, t = tr(v);
    if (t !== v) node.nodeValue = t;
  }

  function translateAttrs(el) {
    if (el.closest('[data-no-i18n], .dev-menu')) return;      // a text field's placeholder still translates
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v) { const t = tr(v); if (t !== v) el.setAttribute(a, t); }
    }
  }

  function translateTree(root) {
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    translateAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n = walker.nextNode();
    while (n) {
      if (n.nodeType === 3) translateText(n); else translateAttrs(n);
      n = walker.nextNode();
    }
  }

  let observer = null;
  function onMutations(list) {
    observer.disconnect();
    try {
      for (const m of list) {
        if (m.type === 'childList') for (const n of m.addedNodes) translateTree(n);
        else if (m.type === 'characterData') translateText(m.target);
        else if (m.type === 'attributes' && m.target.nodeType === 1) translateAttrs(m.target);
      }
    } finally { observe(); }
  }
  function observe() {
    observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function start() {
    if (lang === 'en' || !dict()) return;
    document.documentElement.lang = lang;
    translateTree(document.body);
    observer = new MutationObserver(onMutations);
    observe();
  }

  function setLang(next) {
    try { localStorage.setItem(KEY, LANGS[next] ? next : 'en'); } catch (err) { /* stays as is */ }
  }

  Z.i18n = { tr, start, setLang, get lang() { return lang; }, LANGS };
})(window.ICHAOS = window.ICHAOS || {});
