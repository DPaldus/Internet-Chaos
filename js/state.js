/* The single game-state shape. Everything persistent lives in this object;
   js/save.js validates every field of it when loading. */
(function (Z) {
  'use strict';

  function freshRun() {
    return { attention: 0, money: 0, time: 0, clicks: 0, maxChaos: 0, meltdowns: 0, upgrades: 0 };
  }

  function freshStats() {
    return {
      totalAttention: 0, totalMoney: 0, totalClicks: 0, autoClicks: 0, totalChaos: 0,
      highestChaos: 0, bestMps: 0, bestAps: 0, highestStability: 100, playTime: 0,
      events: 0, choices: 0, eras: 0, largestViral: 0, meltdowns: 0, buildingsBought: 0,
      upgradesBought: 0, offlineTime: 0, longestAway: 0, hotfixes: 0, stirs: 0, actions: 0,
      cloutEarned: 0, unhingedTime: 0, fastestEra: 0, bonuses: 0,
    };
  }

  function freshFlags() {
    return {
      reveal: {},          // UI sections the player has discovered
      ev: {},              // how often each event / milestone has happened
      lowChaosAt: -999,    // run time when Chaos was last under 10%
      serverWatch: 0,      // seconds left in the "survive a server failure" window
      serverSurvived: false,
      cpsPeak: 0,
      exported: false,
      muted: false,
      tutorial: false,     // the first-launch tour was finished or skipped
      lastBackup: 0,       // when a backup file or save code was last made (ms)
      backupAt: 0,         // play time at that backup, for the backup reminder
      backupSnooze: 0,     // play time the reminder was postponed to
      osOffer: '',         // the newest operating system the player was told about
    };
  }

  Z.state = {
    freshRun, freshStats, freshFlags,
    RUN_KEYS: Object.keys(freshRun()),
    STAT_KEYS: Object.keys(freshStats()),

    create(now) {
      return {
        version: Z.VERSION,
        seed: (Math.random() * 4294967296) >>> 0,
        created: now,
        lastSaved: now,
        siteName: '',        // the player's own website name; '' until they pick one
        era: 1,
        clout: 0,
        cloutLifetime: 0,
        perks: {},
        res: { attention: 0, money: 0, chaos: 0, stability: 100 },
        run: freshRun(),
        buildings: {},
        upgrades: {},
        seen: {},
        policy: 'normal',
        buffs: [],
        cooldowns: {},
        meltdown: 0,
        events: { next: Z.BAL.events.firstDelay, pending: null, forced: null },
        trend: { id: null, time: 0, next: Z.BAL.trends.interval },
        auto: {
          clicker: true, hotfix: true, hotfixAt: 40,
          buyer: false, buyCats: { traffic: true, money: true, infra: false, mod: false, upgrades: false },
          policy: false, prOn: false, pr: 'safe', scheduler: false,
        },
        accum: { autoClick: 0, autobuy: 0, risk: 0 },
        achievements: {},
        stats: freshStats(),
        flags: freshFlags(),
        settings: { sound: true, volume: 0.6, music: true, musicVolume: 0.5, notation: 'short', reduceMotion: false, buyQty: '1' },
        feed: [],
        cosmetics: { bg: 'sky', color: 'aqua', site: 'era', fx: 'bubbles', unlocked: {} },   // Style Shop choices
        os: { id: 'aero', installed: 0, base: {} },   // operating system; `base` = stats at install time
      };
    },
  };
})(window.ICHAOS = window.ICHAOS || {});
