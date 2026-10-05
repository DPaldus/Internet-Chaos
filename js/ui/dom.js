/* DOM helpers shared by the UI modules: element builder, cached text updates,
   toasts, modal dialogs, in-page confirmation and the live feed.
   Text from saves or content is always inserted with textContent, never as HTML. */
(function (Z) {
  'use strict';

  const ui = Z.ui = Z.ui || {};
  const $ = id => document.getElementById(id);

  /** h('div', {class: 'x', text: 'hi', onclick: fn}, [children]) */
  function h(tag, props, children) {
    const el = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
        else if (k === 'hidden') el.hidden = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    if (children) {
      for (const c of [].concat(children)) {
        if (c === null || c === undefined || c === false) continue;
        el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return el;
  }

  /** Only touch the DOM when the text actually changes. */
  function setText(el, text) {
    if (el && el._t !== text) { el._t = text; el.textContent = text; }
  }
  function setHidden(el, hidden) {
    if (el && el.hidden !== !!hidden) el.hidden = !!hidden;
  }
  function setStyle(el, prop, value) {
    if (!el) return;
    el._s = el._s || {};
    if (el._s[prop] !== value) { el._s[prop] = value; el.style.setProperty(prop, value); }
  }

  /* ---------- Icons ---------- */

  /* Hand-drawn icons for content whose emoji would not say the right thing. Trusted constants only. */
  const SVG_ICONS = {
    bsod: { feed: '🖥️', svg: '<svg viewBox="0 0 32 32" width="1em" height="1em" aria-hidden="true">'
      + '<rect x="1.5" y="3.5" width="29" height="20" rx="2.5" fill="#262a35"/>'
      + '<rect x="3.5" y="5.5" width="25" height="16" rx="1" fill="#1463d6"/>'
      + '<text x="6" y="14.2" font-size="8.5" font-weight="700" font-family="Segoe UI,Arial,sans-serif" fill="#fff">:(</text>'
      + '<rect x="6" y="16.3" width="15" height="1.4" rx=".7" fill="#cfe0ff"/>'
      + '<rect x="6" y="18.6" width="10" height="1.2" rx=".6" fill="#cfe0ff"/>'
      + '<rect x="22" y="15.6" width="4" height="4" fill="#fff"/><rect x="23" y="16.6" width="2" height="2" fill="#1463d6"/>'
      + '<path d="M13 23.5h6l1 4h-8z" fill="#4a5060"/><rect x="8.5" y="27" width="15" height="2.5" rx="1.2" fill="#262a35"/></svg>' },
  };

  /** An icon element: an emoji, or "svg:<name>" for one of the drawn icons above. */
  function icon(name, className) {
    const el = h('span', { class: className || 'icon', 'aria-hidden': 'true' });
    const key = typeof name === 'string' && name.indexOf('svg:') === 0 ? name.slice(4) : null;
    if (key && SVG_ICONS[key]) { el.innerHTML = SVG_ICONS[key].svg; el.classList.add('svg-icon'); }
    else el.textContent = name || '';
    return el;
  }

  /** Feed entries store plain text, so drawn icons fall back to an emoji there. */
  function feedIcon(name) {
    const key = typeof name === 'string' && name.indexOf('svg:') === 0 ? name.slice(4) : null;
    return key ? (SVG_ICONS[key] ? SVG_ICONS[key].feed : '•') : name;
  }

  /* ---------- Toasts ---------- */

  function toast(o) {
    const root = $('toasts');
    if (!root) return;
    const el = h('div', { class: 'toast toast-' + (o.kind || 'info'), role: 'status' }, [
      h('span', { class: 'toast-icon', 'aria-hidden': 'true', text: o.icon || '•' }),
      h('div', { class: 'toast-body' }, [
        h('div', { class: 'toast-title', text: o.title || '' }),
        o.text ? h('div', { class: 'toast-text', text: o.text }) : null,
      ]),
    ]);
    el.addEventListener('click', () => el.remove());
    root.appendChild(el);
    while (root.children.length > 4) root.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, o.duration || 4500);
  }

  /* ---------- Modal ---------- */

  let modalState = null;

  function closeModal() {
    if (!modalState) return;
    const st = modalState;
    modalState = null;
    st.root.remove();
    document.removeEventListener('keydown', st.onKey);
    if (st.onClose) st.onClose();
    if (st.lastFocus && st.lastFocus.focus) st.lastFocus.focus();
  }

  function openModal(o) {
    closeModal();
    const host = $('modal-root');
    const closeBtn = h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', text: '✕', onclick: closeModal });
    const dialog = h('div', { class: 'modal' + (o.wide ? ' modal-wide' : '') + (o.className ? ' ' + o.className : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title }, [
      h('div', { class: 'modal-head' }, [h('h2', { class: 'modal-title', text: o.title }), closeBtn]),
      h('div', { class: 'modal-body' }, [o.body]),
    ]);
    const backdrop = h('div', { class: 'modal-backdrop' }, [dialog]);
    backdrop.addEventListener('mousedown', e => { if (e.target === backdrop) closeModal(); });
    const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } };
    document.addEventListener('keydown', onKey);
    host.appendChild(backdrop);
    modalState = { root: backdrop, onKey, onClose: o.onClose, lastFocus: document.activeElement, refresh: o.refresh || null, id: o.id || null };
    const focusTarget = dialog.querySelector('[data-autofocus]') || closeBtn;
    focusTarget.focus();
    return dialog;
  }

  function modalOpen(id) { return !!modalState && (!id || modalState.id === id); }

  /** Re-render the open modal's live parts (called a few times per second). */
  function refreshModal() {
    if (modalState && modalState.refresh) modalState.refresh();
  }

  /** In-page confirmation (browser confirm() is not available everywhere). */
  function confirmBox(o) {
    return new Promise(resolve => {
      let answered = false;
      const done = v => { if (answered) return; answered = true; closeModal(); resolve(v); };
      const body = h('div', { class: 'confirm' }, [
        h('p', { class: 'confirm-text', text: o.text }),
        h('div', { class: 'confirm-actions' }, [
          h('button', { type: 'button', class: 'btn', text: o.cancelLabel || 'Cancel', onclick: () => done(false) }),
          h('button', { type: 'button', class: 'btn ' + (o.danger ? 'btn-danger' : 'btn-primary'), 'data-autofocus': true, text: o.confirmLabel || 'Confirm', onclick: () => done(true) }),
        ]),
      ]);
      openModal({ title: o.title, body, onClose: () => { if (!answered) { answered = true; resolve(false); } } });
    });
  }

  /* ---------- Live feed ---------- */

  function renderFeedItem(entry, fresh) {
    const page = ui.chat ? ui.chat.pageForText(entry.text) : null;
    const item = h('li', { class: 'feed-item feed-' + entry.kind + (fresh ? ' fresh' : '') + (page ? ' feed-link' : '') }, [
      h('span', { class: 'feed-time', text: Z.fmt.clock(entry.t) }),
      h('span', { class: 'feed-icon', 'aria-hidden': 'true', text: entry.icon }),
      h('span', { class: 'feed-text', text: entry.text }),
    ]);
    if (page) {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.title = 'Open the page and see what people are saying';
      const go = () => ui.chat.open(page);
      item.addEventListener('click', go);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    }
    return item;
  }

  function feedAdd(g, icon, text, kind) {
    const entry = { t: Date.now(), icon: icon || '•', text: String(text).slice(0, 240), kind: kind || 'info' };
    const feed = g.s.feed;
    feed.push(entry);
    while (feed.length > Z.BAL.feedLimit) feed.shift();
    const list = $('feed');
    if (list) {
      list.insertBefore(renderFeedItem(entry, true), list.firstChild);
      while (list.children.length > Z.BAL.feedLimit) list.lastChild.remove();
    }
    Z.bus.emit('feedChanged', entry);
  }

  function feedRenderAll(g) {
    const list = $('feed');
    if (!list) return;
    list.textContent = '';
    for (let i = g.s.feed.length - 1; i >= 0; i--) list.appendChild(renderFeedItem(g.s.feed[i], false));
  }

  Object.assign(ui, {
    $, h, setText, setHidden, setStyle, toast, icon, feedIcon,
    modal: { open: openModal, close: closeModal, isOpen: modalOpen, refresh: refreshModal },
    confirm: confirmBox,
    feed: { add: feedAdd, renderAll: feedRenderAll },
  });
})(window.ICHAOS = window.ICHAOS || {});
