/* Synthesized sound effects with the Web Audio API. No audio files.
   The context starts on the first user gesture, as browsers require. Effects and music
   share one soft limiter, so a click storm on top of a loud chord never clips.

   Clicks are tuned: each click plays the next note of the current music's scale, so a
   click combo climbs a melody in the song's key, and every operating system has its own
   click sound (a bubble, a wooden tap, a glass tick, a synth blip, a sound-card beep). */
(function (Z) {
  'use strict';

  let ctx = null, master = null, limiter = null, noise = null;
  let enabled = true, volume = 0.6;
  let lastClick = 0, voices = 0, buyStreak = 0, lastBuy = 0;
  const MAX_VOICES = 48;                 // busy moments drop clicks instead of stuttering

  /** The shared AudioContext (music uses it too, even with sound effects off). */
  function context() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (err) { return null; }
      limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -8;
      limiter.knee.value = 6;
      limiter.ratio.value = 5;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.18;
      limiter.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = volume * 0.5;
      master.connect(limiter);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  /** Where music and effects end up: the shared limiter. */
  function output() { return context() ? limiter : null; }

  function ensure() {
    return enabled ? context() : null;
  }

  function noiseBuffer(c) {
    if (!noise) {
      noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  function voice(node) {
    voices++;
    node.onended = () => { voices--; };
  }

  /** One enveloped oscillator note. */
  function tone(freq, dur, type, gain, delay, slideTo, pan) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    connect(c, g, pan);
    voice(osc);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function connect(c, node, pan) {
    if (pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      p.connect(master);
    } else node.connect(master);
  }

  /** A short burst of filtered noise: ticks, taps, whooshes and coin shimmer. */
  function hiss(type, freq, q, gain, dur, delay, pan) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g);
    connect(c, g, pan);
    voice(src);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.02);
  }

  /** A two-operator FM bell or glass tick. */
  function fm(freq, dur, ratio, index, gain, delay, pan) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const car = c.createOscillator();
    car.frequency.value = freq;
    const mod = c.createOscillator();
    mod.frequency.value = freq * ratio;
    const depth = c.createGain();
    depth.gain.setValueAtTime(freq * index, t0);
    depth.gain.exponentialRampToValueAtTime(freq * 0.01, t0 + dur);
    mod.connect(depth); depth.connect(car.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    car.connect(g);
    connect(c, g, pan);
    voice(car);
    car.start(t0); mod.start(t0);
    car.stop(t0 + dur + 0.02); mod.stop(t0 + dur + 0.02);
  }

  /** A synth blip through a closing low-pass filter. */
  function blip(freq, dur, type, gain, from, to, delay) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 4;
    lp.frequency.setValueAtTime(from, t0);
    lp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(lp); lp.connect(g);
    connect(c, g, 0);
    voice(osc);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** The pitch of click number `step` in a combo, in the key of the music. */
  function clickFreq(step) {
    if (Z.music && Z.music.noteFor) return Z.music.noteFor(step);
    const scale = [0, 2, 4, 7, 9];
    return 523.25 * Math.pow(2, (scale[step % 5] + 12 * Math.floor(step / 5)) / 12);
  }

  /* Each operating system clicks in its own way. f is the note, v the loudness. */
  const CLICKS = {
    aero(f, v) {                                             // a glassy bubble that pops upward
      tone(f, 0.09, 'sine', 0.13 * v, 0, f * 1.6);
      hiss('bandpass', 3200, 2, 0.025 * v, 0.03);
    },
    metro(f, v) {                                            // a soft wooden tap
      tone(f, 0.07, 'triangle', 0.15 * v);
      hiss('bandpass', 1700, 1.4, 0.05 * v, 0.035);
    },
    mango(f, v) {                                            // a tiny glass tick
      fm(f * 2, 0.16, 3.5, 1.2, 0.07 * v);
      hiss('highpass', 6500, 0.7, 0.03 * v, 0.025);
    },
    holo(f, v) {                                             // a synth blip
      blip(f, 0.1, 'sawtooth', 0.07 * v, 5200, 500);
      tone(f * 2, 0.05, 'sine', 0.03 * v);
    },
    retro(f, v) {                                            // a sound-card beep with a jump
      tone(f, 0.035, 'square', 0.05 * v);
      tone(f * 1.5, 0.04, 'square', 0.045 * v, 0.03);
    },
  };

  function osId() { return (Z.game && Z.game.s && Z.game.s.os && Z.game.s.os.id) || 'aero'; }

  const SOUNDS = {
    /** A click. `combo` climbs the scale; a critical click adds a sparkle and a thump. */
    click(combo, crit) {
      const now = performance.now();
      if (!crit && (now - lastClick < 30 || voices > MAX_VOICES)) return;
      lastClick = now;
      const n = combo || 0;
      const step = n <= 1 ? Math.floor(Math.random() * 3) : Math.min(n - 1, 11) - (n > 12 ? Math.floor(Math.random() * 3) : 0);
      const f = clickFreq(Math.max(0, step));
      (CLICKS[osId()] || CLICKS.aero)(f, n >= 25 ? 1.15 : 1);
      if (crit) {
        tone(f * 2, 0.18, 'triangle', 0.1, 0.02);
        tone(f * 3, 0.24, 'sine', 0.07, 0.07);
        tone(70, 0.22, 'sine', 0.22, 0, 40);
        hiss('highpass', 4000, 0.6, 0.06, 0.3, 0.02);
      }
    },
    /** Every 25 combo clicks: a quick three-note level-up. */
    combo(level) {
      const f = clickFreq(10 + Math.min(level, 4));
      [1, 1.25, 1.5, 2].forEach((m, i) => tone(f * m, 0.12, 'triangle', 0.08, i * 0.045));
      hiss('highpass', 5000, 0.5, 0.03, 0.25, 0.1);
    },
    /** Ka-ching. Quick purchases in a row climb in pitch; bigger orders ring fuller. */
    buy(qty) {
      const now = performance.now();
      buyStreak = now - lastBuy < 900 ? Math.min(buyStreak + 1, 8) : 0;
      lastBuy = now;
      const up = Math.pow(2, [0, 2, 4, 5, 7, 9, 11, 12, 14][buyStreak] / 12);
      tone(1046 * up, 0.06, 'square', 0.06);
      tone(1568 * up, 0.16, 'triangle', 0.12, 0.05);
      if (qty > 1) tone(2093 * up, 0.2, 'triangle', 0.07, 0.1);
      hiss('highpass', 7000, 0.8, 0.035, 0.12, 0.04, 0.2);
    },
    upgrade() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.14, i * 0.05));
      hiss('highpass', 6000, 0.6, 0.03, 0.3, 0.15);
    },
    deny() { tone(220, 0.1, 'triangle', 0.12, 0, 160); tone(165, 0.12, 'triangle', 0.08, 0.06, 130); },
    good() { tone(880, 0.12, 'sine', 0.16); tone(1320, 0.2, 'sine', 0.11, 0.08); fm(1760, 0.4, 3.5, 0.6, 0.03, 0.12); },
    bad() { tone(220, 0.25, 'sawtooth', 0.08, 0, 130); tone(110, 0.3, 'sine', 0.14, 0.02, 70); },
    viral() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.055, i * 0.055));
      hiss('highpass', 3000, 0.5, 0.05, 0.5, 0.25);
    },
    achievement() {
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.2, 'triangle', 0.15, i * 0.08));
      [1568, 2093].forEach((f, i) => fm(f, 0.8, 3.5, 0.8, 0.04, 0.34 + i * 0.08));
      duck(0.5, 1.2);
    },
    /** A visitor milestone: a bright fanfare with a glittery tail. */
    milestone() {
      [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.07));
      [1047, 1319, 1568].forEach(f => tone(f, 0.7, 'triangle', 0.07, 0.24));
      for (let i = 0; i < 6; i++) fm(2093 * Math.pow(2, i / 12 * 2), 0.3, 3.5, 0.6, 0.025, 0.3 + i * 0.05, i % 2 ? 0.4 : -0.4);
      duck(0.5, 1.4);
    },
    unlock() { tone(1175, 0.1, 'triangle', 0.09); tone(1568, 0.22, 'triangle', 0.08, 0.08); },
    meltdown() {
      tone(420, 1.1, 'sawtooth', 0.14, 0, 50);
      tone(300, 1.1, 'square', 0.05, 0.1, 40);
      hiss('lowpass', 900, 0.7, 0.12, 1.2);
      duck(0.25, 2.5);
    },
    recovered() {
      tone(392, 0.12, 'triangle', 0.14); tone(587, 0.18, 'triangle', 0.14, 0.1); tone(784, 0.3, 'triangle', 0.1, 0.2);
      hiss('bandpass', 2000, 0.4, 0.04, 0.6, 0, 0);
    },
    action() { tone(740, 0.08, 'sine', 0.16); tone(555, 0.1, 'sine', 0.12, 0.06); },
    ding() { tone(1568, 0.16, 'sine', 0.09); tone(2093, 0.22, 'sine', 0.07, 0.09); },
    bonus() {
      [1047, 1319, 1568, 2093, 2637].forEach((f, i) => tone(f, 0.14, 'triangle', 0.1, i * 0.045));
      hiss('highpass', 6000, 0.5, 0.04, 0.4, 0.15);
    },
    popup() { tone(1046, 0.07, 'square', 0.07); tone(1046, 0.07, 'square', 0.07, 0.1); },
    prestige() {
      [262, 330, 392, 523].forEach(f => tone(f, 1.4, 'triangle', 0.1));
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', 0.12, 0.3 + i * 0.12));
      duck(0.35, 2.4);
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

  /** Big moments push the music down for a moment so they can be heard. */
  function duck(depth, seconds) {
    if (Z.music && Z.music.duck) Z.music.duck(depth, seconds);
  }

  Z.audio = {
    /** play('buy', qty) · play('click', combo, crit) · play(name) */
    play(name, a, b) {
      if (!enabled || !SOUNDS[name]) return;
      try { SOUNDS[name](a, b); } catch (err) { /* audio is optional */ }
    },
    unlock() { ensure(); if (Z.music) Z.music.kick(); },
    context,
    output,
    setEnabled(on) { enabled = !!on; if (enabled) ensure(); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume * 0.5;
    },
    get enabled() { return enabled; },
  };
})(window.ICHAOS = window.ICHAOS || {});
