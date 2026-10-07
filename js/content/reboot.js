/* Reboot the Internet: the layer above the Internet Eras.

   After the Post-Internet Era (or any later era) the player may reboot the whole internet:
   back to the Forum Era on a new version (v2, v3…), without Clout and Clout perks, but with
   Bandwidth. Bandwidth buys upgrades that survive every reboot, so every new internet goes
   faster than the last one. Rules: js/systems/reboot.js.

   Upgrades: cost(level) = ceil(cost × growth^level). `effects` apply once per level, like
   perks; `apply(m, lvl)` handles anything else; upgrades without either are read directly by
   the rules (Veteran Founder, Lower Standards, Edge Cache, Challenge Memory, Wayback Machine).

   Protocols: an optional handicap for the next internet. Rebooting from an internet that
   ran on one pays more Bandwidth. */
(function (Z) {
  'use strict';

  Z.REBOOT_UPGRADES = [
    { id: 'backbone', icon: '📡', name: 'Fiber Backbone', cost: 2, growth: 1.6, max: 25,
      desc: 'Attention ×1.25 per level.', effects: [{ t: 'attMult', x: 1.25 }] },
    { id: 'keyboard', icon: '⌨️', name: 'Mechanical Keyboard', cost: 1, growth: 2, max: 5,
      desc: 'Click power ×2 per level.', effects: [{ t: 'clickMult', x: 2 }] },
    { id: 'founder', icon: '🧢', name: 'Veteran Founder', cost: 3, growth: 2.5, max: 6,
      desc: 'Start every new internet with 25 Clout, ×4 per extra level.' },
    { id: 'uptime', icon: '🛡️', name: '99.999% Uptime', cost: 2, growth: 2, max: 5,
      desc: '+4 Chaos Tolerance per level.', effects: [{ t: 'tolerance', v: 4 }] },
    { id: 'packets', icon: '🍀', name: 'Lucky Packets', cost: 2, growth: 2, max: 5,
      desc: 'Good events 15% more likely and bonuses last 10% longer per level.',
      effects: [{ t: 'goodEvents', x: 1.15 }, { t: 'buffDuration', x: 1.1 }] },
    { id: 'online', icon: '🌙', name: 'Always Online', cost: 2, growth: 2, max: 4,
      desc: 'Offline progress: +2 hours of cap and +5% efficiency per level.',
      effects: [{ t: 'offlineCap', v: 2 }, { t: 'offlineEff', v: 0.05 }] },
    { id: 'cron', icon: '⏰', name: 'Cron Jobs', cost: 3, growth: 3, max: 2,
      desc: 'Level 1: auto-Hotfix and the Auto-Buyer from the start. Level 2: also Auto-Policy, PR Autopilot and Auto-Actions.',
      apply(m, lvl) {
        m.autoHotfix = true; m.autobuy = true;
        if (lvl >= 2) { m.riskManager = true; m.prAutopilot = true; m.scheduler = true; }
      } },
    { id: 'cache', icon: '🗄️', name: 'Edge Cache', cost: 3, growth: 1.8, max: 10,
      desc: 'Clout from Internet Eras ×1.25 per level.' },
    { id: 'memory', icon: '🧠', name: 'Challenge Memory', cost: 3, growth: 2, max: 4,
      desc: 'Era challenge bonuses +50% per level.' },
    { id: 'standards', icon: '📉', name: 'Lower Standards', cost: 4, growth: 3, max: 4,
      desc: 'Every era needs 25% less Attention per level.' },
    { id: 'wayback', icon: '📚', name: 'Wayback Machine', cost: 5, growth: 2, max: 10,
      desc: '+25% Bandwidth from every reboot per level.' },
  ];
  Z.REBOOT_UPGRADE = Z.util.byId(Z.REBOOT_UPGRADES);

  Z.PROTOCOLS = [
    { id: 'standard', icon: '🌐', name: 'Standard Internet', desc: 'The internet as you know it.', reward: 1, effects: [] },
    { id: 'dialup', icon: '📞', name: 'Dial-up Only', desc: 'Everything loads very slowly.', reward: 1.4,
      effects: [{ t: 'attMult', x: 0.6 }] },
    { id: 'adfree', icon: '🚫', name: 'Ad-Free Internet', desc: 'Advertisers pay half. Users love it.', reward: 1.5,
      effects: [{ t: 'yieldMult', x: 0.5 }] },
    { id: 'norules', icon: '🔥', name: 'No Rules', desc: 'Moderators barely show up. Everyone is louder.', reward: 1.5,
      effects: [{ t: 'controlMult', x: 0.5 }, { t: 'pressureMult', x: 1.25 }] },
    { id: 'glass', icon: '🫙', name: 'Glass Servers', desc: 'Servers break if you look at them.', reward: 1.6,
      effects: [{ t: 'tolerance', v: -12 }, { t: 'drainMult', x: 1.3 }] },
  ];
  Z.PROTOCOL = Z.util.byId(Z.PROTOCOLS);
})(window.ICHAOS = window.ICHAOS || {});
