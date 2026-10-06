/* Save safety for a game that lives in browser storage: a one-click backup file, a
   copyable save code, a gentle reminder after long play without a backup, and a request
   for persistent storage so the browser does not clear the save on its own. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, h } = ui;
  let game = null, nudge = null, shownThisSession = false;

  const REMIND_AFTER = 2 * 3600;   // seconds of play since the last backup
  const SNOOZE = 3600;             // "Later" waits this much more play time
  const MIN_PROGRESS = 1e6;        // no reminders for a brand-new game

  function markBackedUp() {
    const f = game.s.flags;
    f.exported = true;
    f.backupAt = game.s.stats.playTime;
    f.lastBackup = Date.now();
  }

  function filename() {
    const name = Z.siteSlug(game.s);
    return 'internet-chaos-' + name + '-' + new Date().toISOString().slice(0, 10) + '.txt';
  }

  /** Downloads the save as a small text file that Settings → Import can load again. */
  function download() {
    Z.save.write(game.s);
    const code = Z.save.exportString(game.s);
    try {
      const blob = new Blob([code], { type: 'text/plain' });
      const a = h('a', { href: URL.createObjectURL(blob), download: filename() });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      markBackedUp();
      Z.save.write(game.s);
      ui.toast({ icon: '💾', title: 'Backup downloaded', text: 'Keep the file somewhere safe. Load it in Settings → Import save.', kind: 'info' });
    } catch (err) {
      copy();
    }
  }

  /** Copies the save code; falls back to showing it in Settings when the clipboard is blocked. */
  function copy() {
    const code = Z.save.exportString(game.s);
    const done = () => {
      markBackedUp();
      Z.save.write(game.s);
      ui.toast({ icon: '📋', title: 'Save code copied', text: 'Paste it somewhere safe, like a note or an email to yourself.', kind: 'info' });
    };
    const fallback = () => {
      ui.modals.openSettings();
      const area = $('export-code');
      if (area) { area.value = code; area.select(); }
      ui.toast({ icon: '📋', title: 'Press Ctrl+C to copy', text: 'Your save code is selected in Settings.', kind: 'info' });
      markBackedUp();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, fallback);
    else fallback();
  }

  function sinceBackup() {
    const s = game.s;
    return s.stats.playTime - Math.max(s.flags.backupAt || 0, s.flags.backupSnooze || 0);
  }

  function hideNudge() {
    if (nudge) { nudge.remove(); nudge = null; }
  }

  function showNudge() {
    hideNudge();
    shownThisSession = true;
    const hours = Math.max(1, Math.floor(sinceBackup() / 3600));
    nudge = h('div', { class: 'save-nudge', role: 'status' }, [
      h('span', { class: 'save-nudge-icon', 'aria-hidden': 'true', text: '💾' }),
      h('div', { class: 'save-nudge-main' }, [
        h('b', { text: 'Back up your website?' }),
        h('span', { text: 'Your progress lives only in this browser. ' + hours + (hours === 1 ? ' hour' : ' hours') + ' of play since your last backup.' }),
        h('div', { class: 'save-nudge-actions' }, [
          h('button', { type: 'button', class: 'btn btn-primary', text: 'Download backup', onclick: () => { download(); hideNudge(); } }),
          h('button', { type: 'button', class: 'btn', text: 'Copy code', onclick: () => { copy(); hideNudge(); } }),
          h('button', { type: 'button', class: 'link-btn', text: 'Later', onclick: () => { game.s.flags.backupSnooze = game.s.stats.playTime + SNOOZE - REMIND_AFTER; hideNudge(); } }),
        ]),
      ]),
    ]);
    document.body.appendChild(nudge);
  }

  function check() {
    const s = game.s;
    if (shownThisSession || nudge || s.stats.totalAttention < MIN_PROGRESS) return;
    if (document.hidden || document.querySelector('.modal-backdrop, .tour')) return;
    if (sinceBackup() >= REMIND_AFTER) showNudge();
  }

  function init(g) {
    game = g;
    // Ask the browser to keep this site's storage; quietly ignored where unsupported.
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (err) { /* optional */ }
    setTimeout(() => { check(); setInterval(check, 30000); }, 60000);
  }

  /** Short text for Settings: when the last backup was made. */
  function lastText() {
    const t = game.s.flags.lastBackup;
    if (!t) return game.s.flags.exported ? 'Last backup: a save code was created earlier.' : 'No backup yet.';
    return 'Last backup: ' + new Date(t).toLocaleString() + '.';
  }

  ui.backup = { init, download, copy, lastText, markBackedUp, check };
})(window.ICHAOS = window.ICHAOS || {});
