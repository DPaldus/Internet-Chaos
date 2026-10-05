/* Desktop app bridge. Does nothing in a normal browser.
   Inside the Windows app (desktop/app.py, pywebview) it mirrors every save to a real
   file on disk, restores from that file if the WebView's storage was wiped, uses a
   native Save dialog for exports and toggles fullscreen with F11. */
(function (Z) {
  'use strict';

  let game = null, bootFresh = false, ready = false, started = false;

  function api() {
    return window.pywebview && window.pywebview.api ? window.pywebview.api : null;
  }

  function call(name) {
    const a = api();
    if (!a || typeof a[name] !== 'function') return Promise.resolve(null);
    const args = Array.prototype.slice.call(arguments, 1);
    try { return Promise.resolve(a[name].apply(a, args)).catch(() => null); } catch (err) { return Promise.resolve(null); }
  }

  /** Restore from the disk copy when local storage came up empty, then mirror once. */
  async function start() {
    if (started || !ready || !game) return;
    started = true;
    document.body.classList.add('is-desktop');
    if (bootFresh) {
      const text = await call('read_save');
      if (typeof text === 'string' && text) {
        try {
          const state = Z.save.sanitize(JSON.parse(text));
          const away = (Date.now() - state.lastSaved) / 1000;
          Z.ui.replaceState(state);
          if (away >= Z.BAL.offline.minSeconds) {
            const sum = Z.offline.simulate(game, away);
            if (away >= 60) Z.ui.modals.showOffline(sum);
          }
          Z.ui.toast({ icon: '💾', title: 'Save restored', text: 'Loaded your progress from the save file on disk.', kind: 'info' });
        } catch (err) {
          Z.ui.toast({ icon: '⚠️', title: 'Save file unreadable', text: 'The save file on disk is damaged, so a new game started.', kind: 'bad' });
        }
      }
    }
    Z.save.write(game.s);
  }

  window.addEventListener('pywebviewready', () => { ready = true; start(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'F11' && api()) { e.preventDefault(); call('toggle_fullscreen'); }
  });

  Z.desktop = {
    get active() { return ready && !!api(); },
    /** Called by main.js once the game exists. */
    init(g, fresh) { game = g; bootFresh = !!fresh; start(); },
    /** Called by save.js after every save. */
    mirror(json) { if (ready) call('write_save', json); },
    /** Native "Save as" for exported save codes. Resolves to the saved path or null. */
    exportFile(text, filename) { return call('export_save', text, filename); },
  };
})(window.ICHAOS = window.ICHAOS || {});
