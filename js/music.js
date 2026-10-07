/* Background music, made live with the Web Audio API (no audio files). There is one
   style per operating system:
     aero  · ChaosOS 7: a calm, generative Frutiger Aero ambience. Warm pad chords in D
             major, glassy bell arpeggios through an echo, a soft bass, the odd water drop
             and now and then a short airy melody.
     metro · ChaosOS 8: a mellow lo-fi beat. Electric piano chords in C major with tape
             wobble, a round bass, soft swung drums, vinyl crackle and a sparse pluck melody.
     mango · Mango OS: bright, airy keynote-style electronica. Wide pads in E major that
             breathe with the beat, a glassy FM arpeggio, a round sub bass, finger snaps,
             a shaker and now and then a soft gliding lead.
     holo  · Prism OS: dreamy synthwave in A minor. Wide pads through a slowly sweeping
             filter, a saw arpeggio, pulsing bass, a roomy snare and a gliding lead.
     retro · ChaosOS 95: sound-card chiptune in C major. Square-wave arpeggios, a triangle
             bass, a little looping lead melody and noise drums.
   All share one reverb and one echo. Randomness keeps them from looping audibly. Music
   starts on the first click or key press (browsers require a gesture) and pauses while
   the tab is hidden. */
(function (Z) {
  'use strict';

  const LOOKAHEAD = 0.3;               // seconds scheduled ahead of the audio clock
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const pick = list => list[Math.floor(Math.random() * list.length)];

  let ctx = null, bus = null, warm = null, dry = null, verbIn = null, echoIn = null, noise = null;
  let enabled = true, volume = 0.5, playing = false, gestured = false, held = false, timer = 0, restartTimer = 0;
  let step = 0, nextTime = 0;
  let style = null;

  /* ---------- Shared graph ---------- */

  function impulse(c, seconds) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  function build() {
    ctx = Z.audio.context();
    if (!ctx || bus) return !!ctx;
    bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(ctx.destination);

    warm = ctx.createBiquadFilter();             // takes the edge off everything
    warm.type = 'lowpass';
    warm.frequency.value = 6500;
    warm.connect(bus);

    dry = ctx.createGain();
    dry.gain.value = 0.75;
    dry.connect(warm);

    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, 3.2);
    const verbOut = ctx.createGain();
    verbOut.gain.value = 0.55;
    verb.connect(verbOut);
    verbOut.connect(warm);
    verbIn = verb;

    // Dotted-eighth echo with a darkening feedback loop (its time follows the tempo).
    const delay = ctx.createDelay(2);
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2600;
    delay.connect(tone);
    tone.connect(fb);
    fb.connect(delay);
    const echoOut = ctx.createGain();
    echoOut.gain.value = 0.32;
    tone.connect(echoOut);
    echoOut.connect(dry);
    echoOut.connect(verb);
    echoIn = delay;

    // Two seconds of white noise for drums and crackle.
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  /** Routes a voice to the dry mix, the reverb and (optionally) the echo. */
  function route(node, rev, echo, pan) {
    let out = node;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      out = p;
    }
    out.connect(dry);
    const r = ctx.createGain(); r.gain.value = rev; out.connect(r); r.connect(verbIn);
    if (echo) { const e = ctx.createGain(); e.gain.value = echo; out.connect(e); e.connect(echoIn); }
  }

  /** A short burst of the shared noise through one filter. */
  function noiseHit(t, type, freq, q, peak, decay, rev, pan) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(peak, t + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(f); f.connect(env);
    route(env, rev, 0, pan);
    src.start(t, Math.random() * 1.5);
    src.stop(t + decay + 0.05);
  }

  /* ======================================================================
     ChaosOS 7 · Aero ambience
     ====================================================================== */

  const AERO = (function () {
    const BPM = 76;
    const EIGHTH = 60 / BPM / 2;
    const STEPS_PER_CHORD = 16;          // two bars of eighths

    // Diatonic to D major, so every bell note fits every chord.
    const CHORDS = {
      D: { root: 50, pad: [57, 61, 64, 66], bells: [69, 73, 74, 76, 78, 81] },    // Dmaj9
      Bm: { root: 47, pad: [57, 61, 62, 66], bells: [69, 71, 73, 74, 78] },       // Bm9
      G: { root: 43, pad: [57, 59, 62, 66], bells: [67, 69, 71, 74, 78] },        // Gmaj9
      A: { root: 45, pad: [59, 61, 64, 66], bells: [69, 71, 73, 76, 78] },        // A6/9
      Em: { root: 40, pad: [55, 59, 62, 66], bells: [67, 71, 74, 76, 78] },       // Em9
      Fm: { root: 42, pad: [57, 61, 64, 68], bells: [69, 73, 76, 78, 80] },       // F#m7(add11)
    };
    const PROGRESSIONS = [['D', 'Bm', 'G', 'A'], ['G', 'A', 'Fm', 'Bm'], ['D', 'Em', 'G', 'A'], ['Bm', 'G', 'D', 'A']];
    const MELODY = [74, 76, 78, 81, 83, 86];          // D major pentatonic, high and airy
    const DENSITY = [0.22, 0.42, 0.58, 0.34];          // bell density per 8-bar section

    let prog = PROGRESSIONS[0], chord = CHORDS.D, lastBell = 0, nextDrop = 0;

    function pad(notes, t, dur) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(700, t);
      lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(900, t + dur + 3);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.05, t + 2.4);
      env.gain.setValueAtTime(0.05, t + dur - 0.2);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 3);
      lp.connect(env);
      route(env, 0.7, 0, 0);
      for (const n of notes) {
        for (const [type, cents] of [['sine', -5], ['triangle', 6]]) {
          const o = ctx.createOscillator();
          o.type = type;
          o.frequency.value = mtof(n);
          o.detune.value = cents;
          const g = ctx.createGain();
          g.gain.value = type === 'sine' ? 0.5 : 0.22;
          o.connect(g); g.connect(lp);
          o.start(t); o.stop(t + dur + 3.2);
        }
      }
    }

    function bass(n, t) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = mtof(n);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.06);
      env.gain.exponentialRampToValueAtTime(0.0001, t + EIGHTH * 7);
      o.connect(env);
      route(env, 0.15, 0, 0);
      o.start(t); o.stop(t + EIGHTH * 7 + 0.1);
    }

    /** A soft FM bell: glassy attack, long shimmering tail. */
    function bell(n, t, vel) {
      const f = mtof(n);
      const car = ctx.createOscillator();
      car.frequency.value = f;
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 3.5;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(f * 1.4, t);
      depth.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.2);
      mod.connect(depth);
      depth.connect(car.frequency);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.055 * vel, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      car.connect(env);
      route(env, 0.5, 0.6, Math.random() * 1.2 - 0.6);
      car.start(t); mod.start(t);
      car.stop(t + 2.3); mod.stop(t + 2.3);
    }

    /** A short airy note for the occasional melody. */
    function glass(n, t, len) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(n);
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vibAmt = ctx.createGain();
      vibAmt.gain.setValueAtTime(0, t);
      vibAmt.gain.linearRampToValueAtTime(mtof(n) * 0.006, t + len * 0.6);
      vib.connect(vibAmt); vibAmt.connect(o.frequency);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.03, t + 0.12);
      env.gain.setValueAtTime(0.03, t + len * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.6);
      o.connect(env);
      route(env, 0.8, 0.3, 0.2);
      o.start(t); vib.start(t);
      o.stop(t + len + 0.7); vib.stop(t + len + 0.7);
    }

    /** The "bloop" of a water drop. */
    function drop(t) {
      const o = ctx.createOscillator();
      const f = 900 + Math.random() * 900;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.09);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.03, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(env);
      route(env, 0.9, 0.4, Math.random() * 1.6 - 0.8);
      o.start(t); o.stop(t + 0.3);
    }

    function schedule(i, t) {
      const pos = i % STEPS_PER_CHORD;
      const chordNo = Math.floor(i / STEPS_PER_CHORD);
      const section = Math.floor(chordNo / 4) % DENSITY.length;
      if (pos === 0) {
        if (chordNo % 8 === 0) prog = pick(PROGRESSIONS);
        chord = CHORDS[prog[chordNo % prog.length]];
        pad(chord.pad, t, STEPS_PER_CHORD * EIGHTH);
        bass(chord.root, t);
        if (section === 2 && Math.random() < 0.6) {
          let at = t + EIGHTH * 2, n = MELODY[Math.floor(Math.random() * 3) + 1];
          for (let k = 0; k < 3 + Math.floor(Math.random() * 2); k++) {
            const len = EIGHTH * (2 + Math.floor(Math.random() * 3));
            glass(n, at, len);
            at += len;
            n = MELODY[Math.max(0, Math.min(MELODY.length - 1, MELODY.indexOf(n) + (Math.random() < 0.5 ? -1 : 1)))];
          }
        }
      }
      if (pos === 8) bass(chord.root + (Math.random() < 0.3 ? 7 : 0), t);
      const chance = DENSITY[section] * (pos % 2 ? 0.55 : 1);
      if (Math.random() < chance) {
        let n = pick(chord.bells);
        if (n === lastBell) n = chord.bells[(chord.bells.indexOf(n) + 1) % chord.bells.length];
        lastBell = n;
        bell(n, t, pos % 4 === 0 ? 1 : 0.7);
      }
      if (t >= nextDrop) {
        if (nextDrop) drop(t + Math.random() * EIGHTH);
        nextDrop = t + 5 + Math.random() * 10;
      }
    }

    return {
      step: EIGHTH, lowpass: 6500, echo: EIGHTH * 1.5, level: 0.55,
      begin() { prog = PROGRESSIONS[0]; nextDrop = 0; },
      end() {},
      schedule,
    };
  })();

  /* ======================================================================
     ChaosOS 8 · Metro lo-fi
     ====================================================================== */

  const METRO = (function () {
    const BPM = 82;
    const SIXTEENTH = 60 / BPM / 4;
    const BAR = 16;

    // Rootless jazz voicings, all diatonic to C major so the melody fits every chord.
    const CHORDS = {
      Dm9: { root: 38, keys: [53, 57, 60, 64], tones: [74, 76, 77, 81, 84] },
      G13: { root: 43, keys: [53, 59, 64, 69], tones: [74, 76, 79, 81, 83] },
      Cmaj9: { root: 36, keys: [52, 55, 59, 62], tones: [72, 74, 76, 79, 83] },
      Am9: { root: 45, keys: [55, 59, 60, 64], tones: [72, 76, 79, 81, 83] },
      Fmaj9: { root: 41, keys: [57, 60, 64, 67], tones: [72, 76, 77, 79, 81] },
      Em7: { root: 40, keys: [55, 59, 62, 67], tones: [71, 74, 76, 79, 83] },
      G6: { root: 43, keys: [55, 59, 62, 64], tones: [74, 76, 79, 81, 83] },
    };
    const PROGRESSIONS = [
      ['Dm9', 'G13', 'Cmaj9', 'Am9'],
      ['Fmaj9', 'Em7', 'Dm9', 'Cmaj9'],
      ['Am9', 'Fmaj9', 'Cmaj9', 'G6'],
      ['Fmaj9', 'G6', 'Em7', 'Am9'],
    ];
    // Electric piano rhythms: [16th step, length in 16ths, velocity]
    const COMPS = [
      [[0, 10, 1], [10, 6, 0.6]],
      [[0, 6, 1], [6, 4, 0.55], [12, 4, 0.7]],
      [[0, 15, 0.95]],
      [[0, 3, 0.9], [3, 7, 0.75], [14, 2, 0.5]],
    ];
    const KICKS = [[0, 10], [0, 7, 10], [0, 10, 15], [0, 3, 10]];

    let prog = PROGRESSIONS[0], chord = CHORDS.Dm9, comp = COMPS[0], kicks = KICKS[0];
    let keysBus = null, trem = null, wobble = null, crackle = null;

    /** Swing: off-beat eighths land late, like a slightly lazy drummer. */
    function swung(pos) { return pos % 4 === 2 ? SIXTEENTH * 0.34 : pos % 2 ? SIXTEENTH * 0.18 : 0; }

    function begin() {
      // Electric piano bus with a gentle tremolo, plus a slow tape wobble on its pitch.
      keysBus = ctx.createGain();
      keysBus.gain.value = 0.85;
      trem = ctx.createOscillator();
      trem.frequency.value = 4.2;
      const tremAmt = ctx.createGain();
      tremAmt.gain.value = 0.12;
      trem.connect(tremAmt); tremAmt.connect(keysBus.gain);
      route(keysBus, 0.45, 0.12, 0);
      wobble = { osc: ctx.createOscillator(), amt: ctx.createGain() };
      wobble.osc.frequency.value = 0.55;
      wobble.amt.gain.value = 7;                  // cents
      wobble.osc.connect(wobble.amt);
      trem.start(); wobble.osc.start();

      // Vinyl: a quiet hiss with random pops, looping underneath everything.
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.05;
      for (let k = 0; k < 22; k++) {
        const at = Math.floor(Math.random() * (len - 200)), amp = 0.25 + Math.random() * 0.6;
        for (let j = 0; j < 60; j++) d[at + j] += (Math.random() * 2 - 1) * amp * Math.pow(1 - j / 60, 2);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2400;
      band.Q.value = 0.6;
      const lvl = ctx.createGain();
      lvl.gain.value = 0.06;
      src.connect(band); band.connect(lvl); lvl.connect(warm);
      src.start();
      crackle = src;
      prog = PROGRESSIONS[0];
    }

    function end(at) {
      const t = at || ctx.currentTime;
      for (const node of [crackle, trem, wobble && wobble.osc]) { try { if (node) node.stop(t); } catch (err) { /* already stopped */ } }
      crackle = trem = wobble = null;
      keysBus = null;
    }

    /** Electric piano: a soft FM tine with a bell-like attack and a warm body. */
    function keys(notes, t, dur, vel) {
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.linearRampToValueAtTime(0.042 * vel, t + 0.006);
      out.gain.exponentialRampToValueAtTime(0.024 * vel, t + 0.5);
      out.gain.setValueAtTime(0.024 * vel, t + Math.max(0.5, dur - 0.05));
      out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.45);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      lp.connect(out);
      out.connect(keysBus);
      notes.forEach((n, k) => {
        const f = mtof(n);
        const at = t + k * 0.006;                  // a hand, not a machine
        const car = ctx.createOscillator();
        car.frequency.value = f;
        const mod = ctx.createOscillator();
        mod.frequency.value = f;
        const depth = ctx.createGain();
        depth.gain.setValueAtTime(f * 1.1, at);
        depth.gain.exponentialRampToValueAtTime(f * 0.08, at + 0.45);
        mod.connect(depth); depth.connect(car.frequency);
        if (wobble) { wobble.amt.connect(car.detune); wobble.amt.connect(mod.detune); }
        car.connect(lp);
        car.start(at); mod.start(at);
        car.stop(t + dur + 0.5); mod.stop(t + dur + 0.5);
      });
    }

    function bassNote(n, t, dur) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = mtof(n);
      const sub = ctx.createOscillator();
      sub.frequency.value = mtof(n);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 520;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.13, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.07, t + 0.35);
      env.gain.setValueAtTime(0.07, t + Math.max(0.36, dur - 0.06));
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
      o.connect(lp); sub.connect(lp); lp.connect(env);
      route(env, 0.06, 0, 0);
      o.start(t); sub.start(t);
      o.stop(t + dur + 0.2); sub.stop(t + dur + 0.2);
    }

    function kick(t, vel) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.34 * vel, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(env);
      route(env, 0.04, 0, 0);
      o.start(t); o.stop(t + 0.4);
    }

    function snare(t, vel) {
      noiseHit(t, 'bandpass', 1800, 0.7, 0.16 * vel, 0.2, 0.3, 0.05);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.07 * vel, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      o.connect(env);
      route(env, 0.2, 0, 0.05);
      o.start(t); o.stop(t + 0.12);
    }

    function hat(t, vel, open) {
      noiseHit(t, 'highpass', 7200, 0.5, 0.045 * vel, open ? 0.24 : 0.045, 0.1, 0.25);
    }

    /** A soft two-partial pluck for the melody, through the echo. */
    function pluck(n, t, vel) {
      const f = mtof(n);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.05 * vel, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      for (const [mult, amp] of [[1, 1], [2.01, 0.3], [3.98, 0.08]]) {
        const o = ctx.createOscillator();
        o.frequency.value = f * mult;
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g); g.connect(env);
        o.start(t); o.stop(t + 0.95);
      }
      route(env, 0.35, 0.45, Math.random() * 0.8 - 0.4);
    }

    function melody(t) {
      // A short phrase on swung eighths, mostly stepping through the chord's tones.
      let idx = Math.floor(Math.random() * chord.tones.length);
      const starts = pick([[2, 4, 6, 10], [0, 3, 6, 8, 12], [4, 6, 10, 14], [2, 6, 8]]);
      for (const p of starts) {
        if (Math.random() < 0.18) continue;
        pluck(chord.tones[idx], t + p * SIXTEENTH + swung(p), 0.7 + Math.random() * 0.3);
        idx = Math.max(0, Math.min(chord.tones.length - 1, idx + pick([-2, -1, -1, 1, 1, 2])));
      }
    }

    function schedule(i, t) {
      const pos = i % BAR;
      const bar = Math.floor(i / BAR);
      const section = Math.floor(bar / 8) % 4;          // intro · groove · melody · groove
      const inBar = bar % 8;
      const at = t + swung(pos);
      if (pos === 0) {
        if (inBar === 0 && (section === 0 || Math.random() < 0.6)) prog = pick(PROGRESSIONS);
        chord = CHORDS[prog[bar % prog.length]];
        comp = pick(COMPS);
        kicks = pick(KICKS);
        if (section === 2 && inBar % 2 === 0) melody(t);
      }
      for (const [s, len, vel] of comp) {
        if (s === pos) keys(chord.keys, at, len * SIXTEENTH, vel * (0.85 + Math.random() * 0.15));
      }
      const drums = section !== 0 && !(section === 3 && inBar === 7);   // a one-bar break before the loop
      if (drums) {
        if (kicks.indexOf(pos) >= 0) kick(at, pos === 0 ? 1 : 0.8);
        if (pos === 4 || pos === 12) snare(at, 0.9 + Math.random() * 0.1);
        else if (pos === 14 && Math.random() < 0.15) snare(at, 0.3);
        if (pos === 0) bassNote(chord.root, at, SIXTEENTH * 6);
        else if (pos === 10 && Math.random() < 0.7) bassNote(chord.root + pick([0, 0, 7, 12]), at, SIXTEENTH * 3);
        else if (pos === 14 && Math.random() < 0.25) bassNote(chord.root + 7, at, SIXTEENTH * 2);
      }
      if (pos % 2 === 0) {
        const open = drums && pos === 14 && Math.random() < 0.3;
        if (section !== 0 || pos % 4 === 0) hat(at, (pos % 4 ? 0.55 : 0.95) * (0.8 + Math.random() * 0.2) * (section ? 1 : 0.6), open);
      } else if (drums && Math.random() < 0.12) hat(at, 0.3, false);
    }

    return { step: SIXTEENTH, lowpass: 4200, echo: SIXTEENTH * 6, level: 0.42, begin, end, schedule };
  })();

  /* ======================================================================
     Mango OS · liquid glass
     ====================================================================== */

  const MANGO = (function () {
    const BPM = 100;
    const SIXTEENTH = 60 / BPM / 4;
    const BAR = 16;

    // Bright E major: lush pads, a glassy arpeggio on top, everything diatonic.
    const CHORDS = {
      A: { root: 45, pad: [56, 59, 61, 64], arp: [69, 71, 73, 76, 80, 81] },      // Amaj9
      E: { root: 40, pad: [56, 59, 63, 66], arp: [68, 71, 75, 76, 78, 83] },      // Emaj9
      Cs: { root: 37, pad: [56, 59, 63, 64], arp: [68, 71, 73, 75, 76, 80] },     // C#m9
      B: { root: 47, pad: [54, 59, 61, 63], arp: [71, 73, 75, 78, 80, 83] },      // Badd9
      Fs: { root: 42, pad: [57, 59, 61, 64], arp: [69, 71, 73, 76, 78, 81] },     // F#m11
    };
    const PROGRESSIONS = [['A', 'E', 'Cs', 'B'], ['Cs', 'A', 'E', 'B'], ['A', 'B', 'Cs', 'E'], ['Fs', 'A', 'E', 'B']];
    // Arpeggio shapes: indexes into the chord's arp notes, one per eighth note.
    const ARPS = [[0, 2, 4, 2, 1, 3, 5, 3], [0, 1, 2, 4, 3, 2, 1, 2], [5, 4, 2, 0, 1, 2, 4, 3], [0, 3, 1, 4, 2, 5, 3, 1]];
    const LEAD = [76, 78, 80, 83, 85, 88];          // E major pentatonic

    let prog = PROGRESSIONS[0], chord = CHORDS.A, arp = ARPS[0];
    // The "sidechain": pads and bass duck on every beat, so the mix breathes with the kick.
    let pump = null, pumpBass = null;

    function begin() {
      pump = ctx.createGain();
      route(pump, 0.5, 0.08, 0);
      pumpBass = ctx.createGain();
      route(pumpBass, 0.04, 0, 0);
      prog = PROGRESSIONS[0];
    }

    function end() { pump = pumpBass = null; }

    function duck(t) {
      for (const g of [pump, pumpBass]) {
        if (!g) continue;
        g.gain.setValueAtTime(0.45, t);
        g.gain.linearRampToValueAtTime(1, t + SIXTEENTH * 3);
      }
    }

    /** A wide, soft pad: two detuned saws per note through a slowly opening filter. */
    function pad(notes, t, dur) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(900, t);
      lp.frequency.linearRampToValueAtTime(2200, t + dur * 0.6);
      lp.frequency.linearRampToValueAtTime(1200, t + dur + 1);
      lp.Q.value = 0.4;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.022, t + 0.5);
      env.gain.setValueAtTime(0.022, t + dur - 0.1);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.2);
      lp.connect(env);
      env.connect(pump || dry);
      for (const n of notes) {
        for (const cents of [-9, 8]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = mtof(n);
          o.detune.value = cents;
          o.connect(lp);
          o.start(t); o.stop(t + dur + 1.3);
        }
      }
    }

    /** Glass: a bright FM pluck with a clear, bell-like tail. */
    function glassNote(n, t, vel, pan) {
      const f = mtof(n);
      const car = ctx.createOscillator();
      car.frequency.value = f;
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 4;
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(f * 0.9, t);
      depth.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.35);
      mod.connect(depth); depth.connect(car.frequency);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.04 * vel, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      car.connect(env);
      route(env, 0.35, 0.35, pan);
      car.start(t); mod.start(t);
      car.stop(t + 0.85); mod.stop(t + 0.85);
    }

    function sub(n, t, dur) {
      const o = ctx.createOscillator();
      o.frequency.value = mtof(n);
      const o2 = ctx.createOscillator();
      o2.type = 'triangle';
      o2.frequency.value = mtof(n);
      const g2 = ctx.createGain();
      g2.gain.value = 0.35;
      o2.connect(g2);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.03);
      env.gain.setValueAtTime(0.12, t + Math.max(0.05, dur - 0.08));
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.1);
      o.connect(env); g2.connect(env);
      env.connect(pumpBass || dry);
      o.start(t); o2.start(t);
      o.stop(t + dur + 0.15); o2.stop(t + dur + 0.15);
    }

    function kick(t, vel) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(44, t + 0.1);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.3 * vel, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(env);
      route(env, 0.03, 0, 0);
      o.start(t); o.stop(t + 0.34);
    }

    /** A finger snap: a bright noise burst and a tiny tonal click. */
    function snap(t, vel) {
      noiseHit(t, 'bandpass', 2600, 1.4, 0.11 * vel, 0.09, 0.45, -0.1);
      noiseHit(t + 0.012, 'bandpass', 1900, 1.2, 0.05 * vel, 0.06, 0.4, 0.1);
    }

    function shaker(t, vel) {
      noiseHit(t, 'highpass', 8200, 0.6, 0.028 * vel, 0.05, 0.12, 0.35);
    }

    /** A rising glass drop, like a notification dissolving into the mix. */
    function sparkle(t) {
      const o = ctx.createOscillator();
      const f = mtof(pick(LEAD) + 12);
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.12);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.018, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(env);
      route(env, 0.9, 0.5, Math.random() * 1.4 - 0.7);
      o.start(t); o.stop(t + 0.45);
    }

    /** A soft lead for the melody section: sine plus a quiet octave, with a little glide in. */
    function lead(n, t, len) {
      const f = mtof(n);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.03, t + 0.03);
      env.gain.setValueAtTime(0.03, t + len * 0.75);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.35);
      for (const [mult, amp] of [[1, 1], [2, 0.18]]) {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(f * mult * 0.97, t);
        o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.06);
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g); g.connect(env);
        o.start(t); o.stop(t + len + 0.4);
      }
      route(env, 0.55, 0.4, 0.15);
    }

    function melody(t) {
      let idx = Math.floor(Math.random() * 3) + 1;
      const rhythm = pick([[0, 4, 6, 10], [2, 6, 8, 12, 14], [0, 3, 6, 12], [4, 8, 10]]);
      rhythm.forEach((p, k) => {
        const len = ((rhythm[k + 1] || 16) - p) * SIXTEENTH;
        lead(LEAD[idx], t + p * SIXTEENTH, Math.min(len, SIXTEENTH * 6));
        idx = Math.max(0, Math.min(LEAD.length - 1, idx + pick([-1, -1, 1, 1, 2, -2])));
      });
    }

    function schedule(i, t) {
      const pos = i % BAR;
      const bar = Math.floor(i / BAR);
      const section = Math.floor(bar / 8) % 4;          // intro · groove · lift · breakdown
      const inBar = bar % 8;
      if (pos === 0) {
        if (inBar === 0 && (section === 0 || Math.random() < 0.6)) prog = pick(PROGRESSIONS);
        chord = CHORDS[prog[bar % prog.length]];
        if (bar % 2 === 0) arp = pick(ARPS);
        pad(chord.pad, t, BAR * SIXTEENTH);
        if (section === 2 && inBar % 2 === 0) melody(t);
      }
      const beat = pos % 4 === 0;
      const drums = section === 1 || section === 2;
      if (beat && section !== 0) duck(t);

      // The arpeggio runs in eighths everywhere; the intro thins it out.
      if (pos % 2 === 0 && (section !== 0 || Math.random() < 0.7)) {
        const n = chord.arp[arp[(pos / 2) % arp.length]];
        glassNote(n, t, pos % 4 === 0 ? 1 : 0.7, pos % 4 === 0 ? -0.35 : 0.35);
      }
      if (section !== 0) {
        if (pos === 0) sub(chord.root, t, SIXTEENTH * 5.5);
        else if (pos === 6) sub(chord.root, t, SIXTEENTH * 1.6);
        else if (pos === 8) sub(chord.root + pick([0, 0, 12]), t, SIXTEENTH * 3.5);
        else if (pos === 14 && Math.random() < 0.4) sub(chord.root + 7, t, SIXTEENTH * 1.6);
      }
      if (drums) {
        if (section === 2 ? beat : (pos === 0 || pos === 10)) kick(t, pos === 0 ? 1 : 0.85);
        if (pos === 4 || pos === 12) snap(t, 0.9 + Math.random() * 0.1);
        shaker(t + (pos % 2 ? SIXTEENTH * 0.08 : 0), (pos % 2 ? 1 : 0.55) * (0.8 + Math.random() * 0.2));
      } else if (section === 3 && pos % 4 === 2) shaker(t, 0.5);
      if (pos === 15 && Math.random() < 0.18) sparkle(t);
    }

    return { step: SIXTEENTH, lowpass: 9000, echo: SIXTEENTH * 3, level: 0.42, begin, end, schedule };
  })();

  /* ======================================================================
     Prism OS · holographic synthwave
     ====================================================================== */

  const HOLO = (function () {
    const BPM = 88;
    const SIXTEENTH = 60 / BPM / 4;
    const BAR = 16;

    // A minor with dreamy extensions; everything diatonic, so the arpeggio fits every chord.
    const CHORDS = {
      Am: { root: 45, pad: [57, 60, 64, 71], arp: [57, 60, 64, 67, 71, 72] },     // Am9
      F: { root: 41, pad: [57, 60, 64, 65], arp: [53, 57, 60, 64, 65, 69] },      // Fmaj7
      C: { root: 48, pad: [55, 59, 64, 67], arp: [55, 59, 60, 64, 67, 71] },      // Cmaj7
      G: { root: 43, pad: [55, 59, 62, 64], arp: [55, 59, 62, 64, 67, 71] },      // G6
      Em: { root: 40, pad: [55, 59, 62, 66], arp: [52, 55, 59, 62, 64, 67] },     // Em7
    };
    const PROGRESSIONS = [['Am', 'F', 'C', 'G'], ['F', 'G', 'Em', 'Am'], ['Am', 'Em', 'F', 'G'], ['C', 'G', 'Am', 'F']];
    const LEAD = [69, 71, 72, 74, 76, 79, 81];      // A natural minor, high

    let prog = PROGRESSIONS[0], chord = CHORDS.Am, padBus = null, lfo = null;

    function begin() {
      // Pads share one filter that sweeps slowly, like light moving through a prism.
      padBus = ctx.createBiquadFilter();
      padBus.type = 'lowpass';
      padBus.frequency.value = 1400;
      padBus.Q.value = 2;
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const amt = ctx.createGain();
      amt.gain.value = 900;
      lfo.connect(amt); amt.connect(padBus.frequency);
      lfo.start();
      route(padBus, 0.7, 0.12, 0);
      prog = PROGRESSIONS[0];
    }

    function end(at) {
      try { if (lfo) lfo.stop(at || ctx.currentTime); } catch (err) { /* already stopped */ }
      lfo = null; padBus = null;
    }

    function pad(notes, t, dur) {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.018, t + 1.2);
      env.gain.setValueAtTime(0.018, t + dur - 0.2);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 2);
      env.connect(padBus || dry);
      for (const n of notes) {
        for (const cents of [-12, 0, 11]) {
          const o = ctx.createOscillator();
          o.type = 'sawtooth';
          o.frequency.value = mtof(n);
          o.detune.value = cents;
          o.connect(env);
          o.start(t); o.stop(t + dur + 2.1);
        }
      }
    }

    /** A short saw pluck through a closing filter: the classic synthwave arpeggio. */
    function arp(n, t, vel, pan) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(n);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 6;
      lp.frequency.setValueAtTime(3800, t);
      lp.frequency.exponentialRampToValueAtTime(500, t + 0.22);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.03 * vel, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(lp); lp.connect(env);
      route(env, 0.35, 0.45, pan);
      o.start(t); o.stop(t + 0.32);
    }

    function bass(n, t, dur) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(n);
      const sub = ctx.createOscillator();
      sub.frequency.value = mtof(n - 12);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.07, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.03, t + dur * 0.8);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      o.connect(lp); sub.connect(lp); lp.connect(env);
      route(env, 0.05, 0, 0);
      o.start(t); sub.start(t);
      o.stop(t + dur + 0.1); sub.stop(t + dur + 0.1);
    }

    function kick(t) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.28, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(env);
      route(env, 0.05, 0, 0);
      o.start(t); o.stop(t + 0.37);
    }

    /** A big, roomy snare: a noise burst sent mostly to the reverb. */
    function snare(t) {
      noiseHit(t, 'bandpass', 1500, 0.8, 0.09, 0.25, 1.1, 0);
      noiseHit(t, 'highpass', 5000, 0.5, 0.03, 0.12, 0.6, 0.1);
    }

    function hat(t, vel) { noiseHit(t, 'highpass', 9000, 0.6, 0.02 * vel, 0.04, 0.15, -0.25); }

    /** A soft gliding lead, sine and a touch of square. */
    function lead(n, t, len) {
      const f = mtof(n);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.026, t + 0.05);
      env.gain.setValueAtTime(0.026, t + len * 0.8);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.4);
      for (const [type, amp] of [['sine', 1], ['square', 0.12]]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(f * 0.98, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
        const vib = ctx.createOscillator();
        vib.frequency.value = 5.2;
        const va = ctx.createGain();
        va.gain.value = f * 0.004;
        vib.connect(va); va.connect(o.frequency);
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g); g.connect(env);
        o.start(t); vib.start(t);
        o.stop(t + len + 0.45); vib.stop(t + len + 0.45);
      }
      route(env, 0.6, 0.4, 0.1);
    }

    function melody(t) {
      let idx = Math.floor(Math.random() * 3) + 2;
      const rhythm = pick([[0, 6, 8, 12], [0, 4, 10], [2, 6, 8, 14], [0, 8, 12]]);
      rhythm.forEach((p, k) => {
        const len = ((rhythm[k + 1] || 16) - p) * SIXTEENTH;
        lead(LEAD[idx], t + p * SIXTEENTH, Math.min(len, SIXTEENTH * 8));
        idx = Math.max(0, Math.min(LEAD.length - 1, idx + pick([-2, -1, 1, 1, 2])));
      });
    }

    function schedule(i, t) {
      const pos = i % BAR;
      const bar = Math.floor(i / BAR);
      const section = Math.floor(bar / 8) % 4;          // intro · groove · lift · drift
      const inBar = bar % 8;
      if (pos === 0) {
        if (inBar === 0 && (section === 0 || Math.random() < 0.6)) prog = pick(PROGRESSIONS);
        chord = CHORDS[prog[bar % prog.length]];
        pad(chord.pad, t, BAR * SIXTEENTH);
        if (section === 2 && inBar % 2 === 0) melody(t);
      }
      // Up-and-down arpeggio over two octaves.
      const notes = chord.arp, span = notes.length * 2 - 2;
      const k = i % span, idx = k < notes.length ? k : span - k;
      const octave = (bar % 2) ? 12 : 0;
      if (section !== 0 || pos % 2 === 0) arp(notes[idx] + octave, t, pos % 4 === 0 ? 1 : 0.65, pos % 2 ? 0.3 : -0.3);
      if (section === 1 || section === 2) {
        if (pos === 0 || pos === 8) kick(t);
        if (pos === 4 || pos === 12) snare(t);
        if (pos % 2 === 0) hat(t, pos % 4 === 2 ? 1 : 0.5);
      }
      if (section !== 0 && pos % 2 === 0) bass(chord.root - 12 + (pos === 14 ? 12 : 0), t, SIXTEENTH * 1.6);
    }

    return { step: SIXTEENTH, lowpass: 7500, echo: SIXTEENTH * 3, level: 0.48, begin, end, schedule };
  })();

  /* ======================================================================
     ChaosOS 95 · sound-card chiptune
     ====================================================================== */

  const RETRO = (function () {
    const BPM = 126;
    const SIXTEENTH = 60 / BPM / 4;
    const BAR = 16;

    // C major / A minor: bright and a little bit 1995.
    const CHORDS = {
      C: { root: 36, arp: [60, 64, 67], scale: [72, 74, 76, 79, 81, 84] },
      Am: { root: 45, arp: [57, 60, 64], scale: [69, 72, 74, 76, 79, 81] },
      F: { root: 41, arp: [53, 57, 60], scale: [69, 72, 74, 77, 79, 81] },
      G: { root: 43, arp: [55, 59, 62], scale: [71, 74, 76, 79, 81, 83] },
      Em: { root: 40, arp: [52, 55, 59], scale: [71, 72, 74, 76, 79, 83] },
    };
    const PROGRESSIONS = [['C', 'Am', 'F', 'G'], ['Am', 'F', 'C', 'G'], ['F', 'G', 'Em', 'Am'], ['C', 'G', 'Am', 'F']];
    // Lead rhythms in 16ths: [start, length]
    const RHYTHMS = [
      [[0, 2], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]],
      [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2]],
      [[0, 4], [4, 2], [6, 2], [8, 6], [14, 2]],
      [[0, 2], [2, 1], [3, 1], [4, 4], [8, 2], [10, 1], [11, 1], [12, 4]],
    ];

    let prog = PROGRESSIONS[0], chord = CHORDS.C, rhythm = RHYTHMS[0], phrase = [];

    function begin() { prog = PROGRESSIONS[0]; }
    function end() {}

    function pulse(n, t, len, vel, type, pan, vibrato) {
      const f = mtof(n);
      const o = ctx.createOscillator();
      o.type = type || 'square';
      o.frequency.value = f;
      let vib = null;
      if (vibrato) {
        vib = ctx.createOscillator();
        vib.frequency.value = 6;
        const va = ctx.createGain();
        va.gain.setValueAtTime(0, t);
        va.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(len, 0.3));
        vib.connect(va); va.connect(o.frequency);
        vib.start(t); vib.stop(t + len + 0.05);
      }
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(vel, t + 0.005);
      env.gain.setValueAtTime(vel * 0.8, t + Math.max(0.01, len - 0.03));
      env.gain.linearRampToValueAtTime(0.0001, t + len);
      o.connect(env);
      route(env, 0.12, 0.15, pan || 0);
      o.start(t); o.stop(t + len + 0.02);
    }

    function kick(t) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 600;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.linearRampToValueAtTime(0.16, t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(lp); lp.connect(env);
      route(env, 0.02, 0, 0);
      o.start(t); o.stop(t + 0.16);
    }

    function makePhrase() {
      // A short motif that repeats with small changes, the way game music does.
      let idx = Math.floor(Math.random() * 3) + 1;
      phrase = rhythm.map(() => {
        idx = Math.max(0, Math.min(5, idx + pick([-2, -1, 0, 1, 1, 2])));
        return idx;
      });
    }

    function schedule(i, t) {
      const pos = i % BAR;
      const bar = Math.floor(i / BAR);
      const section = Math.floor(bar / 8) % 4;          // intro · theme · bridge · theme
      const inBar = bar % 8;
      if (pos === 0) {
        if (inBar === 0) { prog = pick(PROGRESSIONS); rhythm = pick(RHYTHMS); makePhrase(); }
        else if (inBar === 4 && Math.random() < 0.5) makePhrase();
        chord = CHORDS[prog[bar % prog.length]];
      }
      // Fast chord arpeggio, the sound card's way of playing a chord.
      if (section !== 1 || pos % 2 === 0) pulse(chord.arp[i % 3] + (section === 2 ? 12 : 0), t, SIXTEENTH * 0.9, 0.012, 'square', -0.3);
      // Bass: root and octave on eighths.
      if (pos % 2 === 0 && section !== 0) pulse(chord.root + (pos % 4 === 2 ? 12 : 0), t, SIXTEENTH * 1.7, 0.06, 'triangle', 0);
      // Lead melody in the theme sections.
      if (section === 1 || section === 3) {
        rhythm.forEach(([start, len], k) => {
          if (start === pos) pulse(chord.scale[phrase[k] || 0], t, len * SIXTEENTH * 0.95, 0.022, 'square', 0.2, len >= 4);
        });
      }
      if (section !== 0) {
        if (pos === 0 || pos === 8 || (pos === 10 && section === 3)) kick(t);
        if (pos === 4 || pos === 12) noiseHit(t, 'bandpass', 2400, 0.9, 0.07, 0.09, 0.08, 0);
        if (pos % 2 === 0) noiseHit(t, 'highpass', 8000, 0.7, 0.018, 0.025, 0.02, 0.2);
      }
    }

    return { step: SIXTEENTH, lowpass: 5200, echo: SIXTEENTH * 3, level: 0.78, begin, end, schedule };
  })();

  const STYLES = { aero: AERO, metro: METRO, mango: MANGO, holo: HOLO, retro: RETRO };
  style = AERO;

  /* ---------- Transport ---------- */

  function pump() {
    if (!ctx || !playing) return;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      style.schedule(step, nextTime);
      nextTime += style.step;
      step++;
    }
  }

  function level() { return volume * style.level; }

  function start() {
    if (!enabled || held || playing || !gestured || document.hidden) return;
    if (!build()) return;
    clearTimeout(restartTimer);
    playing = true;
    step = 0;
    nextTime = ctx.currentTime + 0.15;
    warm.frequency.setValueAtTime(style.lowpass, ctx.currentTime);
    echoIn.delayTime.setValueAtTime(style.echo, ctx.currentTime);
    style.begin();
    const g = bus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime);
    g.linearRampToValueAtTime(level(), ctx.currentTime + 3);
    clearInterval(timer);
    timer = setInterval(pump, 60);
    pump();
  }

  function stop(fade) {
    if (!playing) return;
    playing = false;
    clearInterval(timer);
    if (!ctx || !bus) return;
    const g = bus.gain, now = ctx.currentTime, len = fade || 1;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + len);
    style.end(now + len + 0.1);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(0.3); else start(); });
  // Browsers only allow audio after a gesture: the first click or key press starts the music.
  const kick = () => { gestured = true; if (enabled && !playing) start(); };
  document.addEventListener('pointerdown', kick, true);
  document.addEventListener('keydown', kick, true);

  Z.music = {
    /** Called on user gestures: starts the music once the browser allows audio. */
    kick,
    setEnabled(on) { enabled = !!on; if (enabled) start(); else stop(1); },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (playing && bus) { bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setTargetAtTime(level(), ctx.currentTime, 0.1); }
    },
    /** Switches to the music of an operating system, fading the old style out first. */
    setStyle(id) {
      const next = STYLES[id] || AERO;
      if (next === style) return;
      const wasPlaying = playing;
      stop(1.2);
      style = next;
      clearTimeout(restartTimer);
      if (wasPlaying) restartTimer = setTimeout(start, 1300);
    },
    /** Silences the music for a while (the OS install screen), then picks it up again. */
    hold(on, fade) {
      held = !!on;
      clearTimeout(restartTimer);
      if (held) stop(fade || 1.2);
      else start();
    },
    get style() { for (const id in STYLES) if (STYLES[id] === style) return id; return 'aero'; },
    get enabled() { return enabled; },
    get playing() { return playing; },
  };
})(window.ICHAOS = window.ICHAOS || {});
