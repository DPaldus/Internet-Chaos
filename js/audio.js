/* Tiny synthesized sound effects with the Web Audio API. No audio files.
   The context starts on the first user gesture, as browsers require. */
(function (Z) {
  'use strict';

  let ctx = null, master = null;
  let enabled = true, volume = 0.6;
  let lastClick = 0;

  /** The shared AudioContext (music uses it too, even with sound effects off). */
  function context() {
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

  function ensure() {
    return enabled ? context() : null;
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
    ding() { tone(1568, 0.16, 'sine', 0.09); tone(2093, 0.22, 'sine', 0.07, 0.09); },
    bonus() { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.14, 'triangle', 0.11, i * 0.045)); },
    popup() { tone(1046, 0.07, 'square', 0.08); tone(1046, 0.07, 'square', 0.08, 0.1); },
    prestige() {
      [262, 330, 392, 523].forEach(f => tone(f, 1.4, 'triangle', 0.1));
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.12, 0.3 + i * 0.12));
    },
    // The new operating system boots: a clean rising chime over a soft chord.
    startup() {
      [262, 392, 494, 587].forEach(f => tone(f, 2.2, 'sine', 0.07, 0.05));
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.5, 'sine', 0.1, 0.12 + i * 0.11));
    },
    // Prism OS boots: a rising shimmer that opens into a wide, airy chord.
    holoStart() {
      tone(220, 1.6, 'sine', 0.06, 0, 880);
      [440, 554.4, 659.3, 830.6, 987.8].forEach((f, i) => tone(f, 2.4 - i * 0.2, 'sine', 0.05, 0.5 + i * 0.07));
      [1760, 2217, 2637].forEach((f, i) => tone(f, 1.2, 'triangle', 0.025, 0.8 + i * 0.09));
    },
    // ChaosOS 95 boots: a bright four-note fanfare from a cheap sound card.
    retroStart() {
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, i === 3 ? 0.9 : 0.16, 'square', 0.05, i * 0.13));
      [261.6, 329.6, 392].forEach(f => tone(f, 1.2, 'triangle', 0.06, 0.4));
    },
    // Mango OS boots: one big, warm major chord that rings out, with a glassy shimmer on top.
    chime() {
      [92.5, 185, 277.2, 370, 466.2, 554.4].forEach((f, i) => tone(f, 3.2 - i * 0.2, i < 2 ? 'sine' : 'triangle', 0.075, i * 0.008));
      [1480, 1865, 2217].forEach((f, i) => tone(f, 1.4, 'sine', 0.03, 0.06 + i * 0.05));
    },
  };

  Z.audio = {
    play(name) {
      if (!enabled || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (err) { /* audio is optional */ }
    },
    unlock() { ensure(); if (Z.music) Z.music.kick(); },
    context,
    setEnabled(on) { enabled = !!on; if (enabled) ensure(); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume * 0.5;
    },
    get enabled() { return enabled; },
  };
})(window.ICHAOS = window.ICHAOS || {});
