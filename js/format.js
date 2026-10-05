/* Number, money, percent and duration formatting. */
(function (Z) {
  'use strict';

  const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
    'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
    'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg'];

  let notation = 'short';

  function stripZeros(str) {
    return str.indexOf('.') >= 0 ? str.replace(/\.?0+$/, '') : str;
  }

  function scientific(n) {
    const exp = Math.floor(Math.log10(n));
    let mant = n / Math.pow(10, exp);
    let e = exp;
    if (mant >= 9.995) { mant /= 10; e += 1; }
    return mant.toFixed(2) + 'e' + e;
  }

  /**
   * Format a number for display.
   * opts.dec  — max decimals below 1000 (default 1)
   * opts.fixed — keep trailing zeros (money)
   * opts.floor — floor below 1000 (counters that should tick in whole units)
   */
  function num(n, opts) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    if (!isFinite(n)) return n > 0 ? '∞' : '-∞';
    const o = opts || {};
    const sign = n < 0 ? '-' : '';
    n = Math.abs(n);

    if (n < 1000) {
      if (o.floor) return sign + Math.floor(n);
      let dec = o.dec === undefined ? 1 : o.dec;
      if (n >= 100) dec = 0;
      else if (n >= 10) dec = Math.min(dec, 1);
      const s = n.toFixed(dec);
      return sign + (o.fixed ? s : stripZeros(s));
    }

    if (notation === 'sci' && n >= 1e6) return sign + scientific(n);

    let tier = Math.floor(Math.log10(n) / 3);
    let mant = n / Math.pow(1000, tier);
    if (mant >= 999.5) { tier += 1; mant /= 1000; }
    if (tier >= SUFFIXES.length) return sign + scientific(n);
    const dec = mant < 10 ? 2 : mant < 100 ? 1 : 0;
    return sign + mant.toFixed(dec) + SUFFIXES[tier];
  }

  function money(n) {
    if (n < 0) return '-' + money(-n);
    return '$' + num(n, { dec: 2, fixed: n < 100 });
  }

  function pct(v, dec) { return (v).toFixed(dec === undefined ? 0 : dec) + '%'; }

  function mult(x) {
    if (x >= 100) return '×' + num(x);
    return '×' + stripZeros(x.toFixed(x < 10 ? 2 : 1));
  }

  function time(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600),
      m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
    return s + 's';
  }

  function clock(ts) {
    const d = new Date(ts);
    const hh = d.getHours(), mm = d.getMinutes();
    return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
  }

  Z.fmt = {
    num, money, pct, mult, time, clock,
    int(n) { return num(n, { floor: true }); },
    rate(n) { return num(n, { dec: 2 }); },
    setNotation(v) { notation = v === 'sci' ? 'sci' : 'short'; },
  };
})(window.ICHAOS = window.ICHAOS || {});
