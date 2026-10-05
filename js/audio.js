/* Tiny synthesized sound effects with the Web Audio API. No audio files.
   The context starts on the first user gesture, as browsers require. */
(function (Z) {
  'use strict';

  let ctx = null, master = null;
  let enabled = true, volume = 0.6;
  let lastClick = 0;

  function ensure() {
    if (!enabled) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (err) { return null; }
      master = ctx.createGain();
      master.gain.value = volume * 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  /** One enveloped oscillator note. */
  function tone(freq, dur, type, gain, delay, slideTo) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const SOUNDS = {
    click() {
      const now = performance.now();
      if (now - lastClick < 35) return;
      lastClick = now;
      tone(480 + Math.random() * 160, 0.05, 'square', 0.06);
    },
    buy() { tone(660, 0.06, 'triangle', 0.18); tone(990, 0.08, 'triangle', 0.14, 0.05); },
    upgrade() { [523, 659, 784].forEach((f, i) => tone(f, 0.09, 'triangle', 0.16, i * 0.05)); },
    deny() { tone(180, 0.08, 'square', 0.08); },
    good() { tone(880, 0.12, 'sine', 0.18); tone(1320, 0.18, 'sine', 0.12, 0.08); },
    bad() { tone(220, 0.22, 'sawtooth', 0.1, 0, 140); },
    viral() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, 'square', 0.07, i * 0.06)); },
    achievement() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.16, i * 0.08)); },
    meltdown() { tone(420, 1.1, 'sawtooth', 0.16, 0, 50); tone(300, 1.1, 'square', 0.06, 0.1, 40); },
    recovered() { tone(392, 0.12, 'triangle', 0.15); tone(587, 0.18, 'triangle', 0.15, 0.1); },
    action() { tone(740, 0.08, 'sine', 0.16); tone(555, 0.1, 'sine', 0.12, 0.06); },
    popup() { tone(1046, 0.07, 'square', 0.08); tone(1046, 0.07, 'square', 0.08, 0.1); },
    prestige() {
      [262, 330, 392, 523].forEach(f => tone(f, 1.4, 'triangle', 0.1));
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.12, 0.3 + i * 0.12));
    },
  };

  Z.audio = {
    play(name) {
      if (!enabled || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (err) { /* audio is optional */ }
    },
    unlock() { ensure(); },
    setEnabled(on) { enabled = !!on; if (enabled) ensure(); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume * 0.5;
    },
    get enabled() { return enabled; },
  };
})(window.ICHAOS = window.ICHAOS || {});
