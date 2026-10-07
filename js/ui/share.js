/* 📸 Share card: draws a 1200×630 picture of the player's website (name, era, address and
   the big numbers) on a canvas, in the colors of the installed operating system, to
   download as a PNG or copy as an image. No libraries, nothing leaves the browser. */
(function (Z) {
  'use strict';

  const ui = Z.ui;
  const { h } = ui;
  const W = 1200, H = 630;
  const FONT = '"Inter", "Segoe UI", -apple-system, Helvetica, Arial, sans-serif';
  let game = null, logo = null;

  // Background and accent per operating system.
  const LOOKS = {
    aero: { bg: ['#1f7fd0', '#5bb8ef', '#a9def8'], card: 'rgba(255,255,255,.88)', ink: '#0f2d4d', sub: '#3e6488', accent: '#1d7ad6' },
    metro: { bg: ['#0a2c74', '#1150b9', '#0b3a92'], card: 'rgba(255,255,255,.95)', ink: '#1d1d1d', sub: '#5d6875', accent: '#1f6fd8' },
    mango: { bg: ['#0c2f88', '#6c8fe0', '#e78a6a'], card: 'rgba(255,255,255,.82)', ink: '#1c1c1e', sub: '#5b6478', accent: '#0a84ff' },
    holo: { bg: ['#120a3a', '#3b1c8c', '#0d6c9c'], card: 'rgba(30,20,80,.72)', ink: '#ffffff', sub: '#c9c2ff', accent: '#5ee7ff' },
    retro: { bg: ['#007a7a', '#008080', '#006a6a'], card: '#c3c3c3', ink: '#000000', sub: '#303030', accent: '#000080' },
  };

  function loadLogo() {
    if (logo) return Promise.resolve(logo);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { logo = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = 'assets/internet-chaos-logo-480.png';
    });
  }

  function roundRect(ctx, x, y, w, hgt, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hgt, r);
    ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
    ctx.arcTo(x, y + hgt, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /** Shrinks the font until the text fits `max` pixels. */
  function fitText(ctx, text, weight, size, max) {
    let px = size;
    do { ctx.font = weight + ' ' + px + 'px ' + FONT; px -= 2; } while (ctx.measureText(text).width > max && px > 14);
  }

  function draw(canvas, img) {
    const s = game.s, f = Z.fmt, os = Z.opsys.current(s), look = LOOKS[os.id] || LOOKS.aero, t = Z.i18n.tr;
    const ctx = canvas.getContext('2d');
    const era = Z.era(s.era);
    const name = Z.siteName(s);

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, look.bg[0]); bg.addColorStop(0.55, look.bg[1]); bg.addColorStop(1, look.bg[2]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // Soft light blobs.
    for (const [x, y, r, a] of [[980, 90, 260, 0.18], [160, 560, 300, 0.12], [700, 380, 200, 0.08]]) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, 'rgba(255,255,255,' + a + ')'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    // The card.
    const cx = 60, cy = 60, cw = W - 120, ch = H - 120;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    roundRect(ctx, cx, cy, cw, ch, os.id === 'retro' || os.id === 'metro' ? 0 : 28);
    ctx.fillStyle = look.card;
    ctx.fill();
    ctx.restore();

    // Title bar line with the address.
    ctx.fillStyle = look.accent;
    roundRect(ctx, cx + 36, cy + 34, 420, 40, os.id === 'retro' || os.id === 'metro' ? 0 : 20);
    ctx.globalAlpha = 0.14; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = look.sub;
    ctx.font = '500 20px ' + FONT;
    const url = Z.siteText(s, era.url[0]);
    ctx.fillText('🔒 ' + (url.length > 38 ? url.slice(0, 37) + '…' : url), cx + 54, cy + 61);

    if (img) {
      const lw = 230, lh = lw * img.height / img.width;
      ctx.drawImage(img, cx + cw - lw - 36, cy + 22, lw, lh);
    }

    ctx.fillStyle = look.ink;
    fitText(ctx, name, '800', 72, cw - 80);
    ctx.fillText(name, cx + 36, cy + 160);
    ctx.font = '600 28px ' + FONT;
    ctx.fillStyle = look.accent;
    ctx.fillText(t(era.name) + '  ·  ' + os.icon + ' ' + os.name + ' ' + os.edition, cx + 36, cy + 206);
    ctx.fillStyle = look.sub;
    fitText(ctx, '“' + t(era.tagline) + '”', 'italic 400', 24, cw - 80);
    ctx.fillText('“' + t(era.tagline) + '”', cx + 36, cy + 246);

    // The numbers.
    const stats = [
      ['👁', 'Total Attention', f.num(s.stats.totalAttention)],
      ['💵', 'Best Money/s', f.money(s.stats.bestMps)],
      ['✦', 'Clout', f.int(s.cloutLifetime)],
      ['🌐', 'Eras completed', f.int(s.stats.eras)],
      ['🏆', 'Achievements', Object.keys(s.achievements).length + ' / ' + Z.ACHIEVEMENTS.length],
      ['⏱️', 'Play time', f.time(s.stats.playTime)],
    ];
    const gx = cx + 36, gy = cy + 270, gw = (cw - 72 - 40) / 3, gh = 80;
    stats.forEach(([icon, label, value], i) => {
      const x = gx + (i % 3) * (gw + 20), y = gy + Math.floor(i / 3) * (gh + 12);
      roundRect(ctx, x, y, gw, gh, os.id === 'retro' || os.id === 'metro' ? 0 : 18);
      ctx.fillStyle = look.accent; ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
      ctx.font = '34px ' + FONT;
      ctx.fillText(icon, x + 18, y + 52);
      ctx.fillStyle = look.sub;
      ctx.font = '500 18px ' + FONT;
      ctx.fillText(t(label), x + 74, y + 30);
      ctx.fillStyle = look.ink;
      fitText(ctx, value, '800', 32, gw - 92);
      ctx.fillText(value, x + 74, y + 64);
    });

    ctx.fillStyle = look.sub;
    ctx.font = '500 18px ' + FONT;
    ctx.fillText(t('Internet Chaos · an idle game about growing one useless website into an internet empire'), cx + 36, cy + ch - 26);
  }

  function filename() {
    const slug = Z.siteName(game.s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-website';
    return 'internet-chaos-' + slug + '.png';
  }

  async function open() {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (err) { /* draw anyway */ } }
    draw(canvas, await loadLogo());
    const preview = h('img', { class: 'share-preview', alt: 'A picture of your website with its numbers', src: canvas.toDataURL('image/png'), width: String(W), height: String(H) });
    const download = h('button', { type: 'button', class: 'btn btn-primary', text: '⬇️ Download PNG' });
    download.addEventListener('click', () => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const a = h('a', { href: URL.createObjectURL(blob), download: filename() });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    });
    const copy = h('button', { type: 'button', class: 'btn', text: '📋 Copy image' });
    copy.hidden = !(navigator.clipboard && window.ClipboardItem);
    copy.addEventListener('click', () => {
      canvas.toBlob(blob => {
        navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]).then(
          () => ui.toast({ icon: '📋', title: 'Image copied', text: 'Paste it anywhere.', kind: 'info', duration: 2500 }),
          () => ui.toast({ icon: '⚠️', title: 'Could not copy', text: 'Your browser blocked it. Use Download instead.', kind: 'bad' }));
      }, 'image/png');
    });
    const body = h('div', { class: 'share' }, [
      h('p', { class: 'modal-lead', text: 'A snapshot of your website to show off. It updates every time you open this window.' }),
      preview,
      h('div', { class: 'btn-row' }, [download, copy]),
    ]);
    ui.modal.open({ id: 'share', title: '📸 Share your website', body, wide: true });
  }

  ui.share = { init(g) { game = g; Z.ui.$('btn-share').addEventListener('click', open); }, open };
})(window.ICHAOS = window.ICHAOS || {});
