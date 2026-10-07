/* Top bar: Attention, Money, Chaos (with target and Tolerance markers), Stability, Clout. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { $, setText, setHidden, setStyle } = ui;
  let el = null;
  const last = { att: 0, money: 0 };

  function init() {
    el = {
      vAtt: $('v-att'), rAtt: $('r-att'), vMoney: $('v-money'), rMoney: $('r-money'),
      hudChaos: $('hud-chaos'), vChaos: $('v-chaos'), fChaos: $('f-chaos'), tChaos: $('t-chaos'),
      mTol: $('m-tol'), rChaos: $('r-chaos'), barChaos: $('bar-chaos'),
      hudStab: $('hud-stab'), vStab: $('v-stab'), fStab: $('f-stab'), rStab: $('r-stab'), barStab: $('bar-stab'),
      hudClout: $('hud-clout'), vClout: $('v-clout'), rClout: $('r-clout'),
      eraChip: $('era-chip'), btnEras: $('btn-eras'), erasDot: $('eras-dot'), achCount: $('ach-count'),
      btnStyle: $('btn-style'),
    };
  }

  function bump(node, cls) {
    node.classList.remove(cls === 'bump-up' ? 'bump-down' : 'bump-up');
    ui.replay(node, cls);
  }

  /** Attention and Money, `ahead` seconds past the last tick (smooth counting). */
  function renderCounters(g, ahead) {
    const s = g.s, c = g.c, f = Z.fmt;
    setText(el.vAtt, f.int(s.res.attention + c.aps * ahead));
    setText(el.vMoney, f.money(s.res.money + c.mps * ahead));
  }

  function react(node, key, value, passive) {
    const prev = last[key];
    if (value < prev - Math.max(0.01, prev * 0.002)) bump(node, 'bump-down');
    else if (value - prev > passive + 0.5) bump(node, 'bump-up');
    last[key] = value;
  }

  function stabilityText(g) {
    const s = g.s, c = g.c, f = Z.fmt;
    if (s.meltdown > 0) return 'MELTDOWN · back in ' + Math.ceil(s.meltdown) + 's';
    if (c.stabRate < -0.01) {
      const secs = s.res.stability / -c.stabRate;
      return '▼ ' + c.stabRate.toFixed(2) + '/s · 0% in ' + f.time(secs);
    }
    const eff = c.stabEff < 1 ? ' · output ' + Math.round(c.stabEff * 100) + '%' : '';
    if (s.res.stability < Z.BAL.stability.max - 0.05) return '▲ +' + c.stabRate.toFixed(2) + '/s' + eff;
    return 'Stable' + eff;
  }

  function render(g) {
    const s = g.s, c = g.c, f = Z.fmt, rev = s.flags.reveal;

    renderCounters(g, 0);
    setText(el.rAtt, '+' + f.rate(c.aps) + '/s');
    setText(el.rMoney, '+' + f.money(c.mps) + '/s');
    react(el.vAtt, 'att', s.res.attention, c.aps * 0.5);
    react(el.vMoney, 'money', s.res.money, c.mps * 0.5);

    setHidden(el.hudChaos, !rev.chaos);
    if (rev.chaos) {
      const chaos = s.res.chaos;
      setText(el.vChaos, chaos.toFixed(0) + '% · ' + f.mult(c.chaosAttMult));
      setStyle(el.fChaos, 'width', chaos.toFixed(2) + '%');
      setStyle(el.tChaos, 'left', c.target.toFixed(2) + '%');
      setStyle(el.mTol, 'left', c.tolerance.toFixed(2) + '%');
      el.barChaos.setAttribute('aria-valuenow', chaos.toFixed(0));
      el.hudChaos.classList.toggle('over', chaos > c.tolerance + 0.5);
      el.hudChaos.classList.toggle('melting', s.meltdown > 0);
      setText(el.rChaos, 'Target ' + c.target.toFixed(0) + '% · Tolerance ' + c.tolerance.toFixed(0) + '%');
      el.hudChaos.title = 'Chaos multiplies Attention by ' + f.mult(c.chaosAttMult) + ' and Money per Attention by ' + f.mult(c.chaosYieldMult)
        + '. Chaos drifts toward its target. Above the Tolerance notch, Stability drains.';
    }

    setHidden(el.hudStab, !rev.stability);
    if (rev.stability) {
      const st = s.res.stability;
      setText(el.vStab, st.toFixed(0) + '%');
      setStyle(el.fStab, 'width', st.toFixed(2) + '%');
      el.barStab.setAttribute('aria-valuenow', st.toFixed(0));
      el.hudStab.classList.toggle('warn', st < 60 && st >= 30);
      el.hudStab.classList.toggle('crit', st < 30 || s.meltdown > 0);
      el.hudStab.classList.toggle('draining', c.stabRate < -0.01);
      setText(el.rStab, stabilityText(g));
    }

    setHidden(el.hudClout, !rev.clout);
    if (rev.clout) {
      setText(el.vClout, f.int(s.clout));
      setText(el.rClout, f.mult(g.m.cloutMult) + ' Attention');
    }

    setText(el.eraChip, Z.era(s.era).name + (s.reboot.count ? ' · v' + Z.reboot.version(s) : ''));
    setText(el.achCount, String(g.m.achCount) + '/' + Z.ACHIEVEMENTS.length);
    setHidden(el.btnEras, !rev.eras);
    setHidden(el.btnStyle, !rev.style);
    setHidden(el.erasDot, !Z.prestige.canPrestige(s));
  }

  ui.hud = { init, render, renderCounters };
})(window.ICHAOS = window.ICHAOS || {});
