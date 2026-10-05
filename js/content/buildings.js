/* Buildings: everything the player buys in quantity.
   traffic → Attention/s (aps), adds Chaos pressure (cp) and server load
   money   → raises Yield ($ per Attention) by a percentage (pct) per unit
   infra   → adds server capacity (cap) and Stability repair per second (regen)
   mod     → adds Control, which pulls the Chaos target down */
(function (Z) {
  'use strict';

  Z.CATS = [
    { id: 'traffic', name: 'Content', icon: '📝',
      blurb: 'Makes Attention. Most of it also adds Chaos and server load.' },
    { id: 'money', name: 'Monetization', icon: '💰',
      blurb: 'Raises how much Money each point of Attention earns.' },
    { id: 'infra', name: 'Infrastructure', icon: '🖥️',
      blurb: 'Adds server capacity, which raises Chaos Tolerance, and repairs Stability.' },
    { id: 'mod', name: 'Moderation', icon: '🧹',
      blurb: 'Adds Control, which pulls Chaos down. Calms Attention a little too.' },
  ];
  Z.CAT = Z.util.byId(Z.CATS);

  const T = (id, name, plural, icon, cost, aps, cp, load, era, flavor) =>
    ({ id, cat: 'traffic', name, plural, icon, cost, aps, cp, load, era, flavor });
  const M = (id, name, plural, icon, cost, pct, cp, era, flavor) =>
    ({ id, cat: 'money', name, plural, icon, cost, pct, cp, load: 0, era, flavor, growth: Z.BAL.moneyCostGrowth });
  const I = (id, name, plural, icon, cost, cap, regen, era, flavor) =>
    ({ id, cat: 'infra', name, plural, icon, cost, cap, regen, cp: 0, load: 0, era, flavor });
  const D = (id, name, plural, icon, cost, control, era, flavor) =>
    ({ id, cat: 'mod', name, plural, icon, cost, control, cp: 0, load: 0, era, flavor });

  Z.BUILDINGS = [
    T('blog', 'Blog Post', 'Blog Posts', '📝', 5, 0.25, 0, 1, 1,
      'A 300-word article titled "Thoughts". It contains no thoughts.'),
    T('meme', 'Meme Page', 'Meme Pages', '🖼️', 60, 1.25, 0.6, 1, 1,
      'Recycled jokes, freshly watermarked.'),
    T('comments', 'Comment Section', 'Comment Sections', '💬', 700, 6, 1.6, 2, 1,
      'Where nuance goes to die. Extremely engaging.'),
    T('clickbait', 'Clickbait Factory', 'Clickbait Factories', '🎣', 9000, 30, 2.5, 2, 1,
      'Number 7 will shock you. Number 8 does not exist.'),
    T('bots', 'Bot Farm', 'Bot Farms', '🤖', 150000, 150, 3.5, 4, 1,
      '10,000 phones on a shelf, liking everything.'),
    T('trolls', 'Troll Network', 'Troll Networks', '👹', 3e6, 800, 7, 3, 1,
      'Professionally wrong, on purpose, at scale.'),
    T('streamer', 'Reaction Streamer', 'Reaction Streamers', '🎥', 6.5e7, 4200, 4, 5, 1,
      'Watches your content out loud for nine hours a day.'),
    T('influencer', 'Influencer House', 'Influencer Houses', '🏠', 1.4e9, 22000, 6, 6, 2,
      'Six people, one ring light, zero privacy.'),
    T('viral', 'Viral Challenge Studio', 'Viral Challenge Studios', '🔥', 3e10, 115000, 10, 8, 3,
      'Invents dances. Legal reviews them afterwards.'),
    T('algorithm', 'Recommendation Algorithm', 'Recommendation Algorithms', '🧮', 6.5e11, 600000, 8, 12, 4,
      'Knows what you want to watch before you hate it.'),
    T('aislop', 'AI Slop Generator', 'AI Slop Generators', '🧠', 1.4e13, 3.1e6, 14, 18, 5,
      '40,000 articles per hour. Some of them are in English.'),
    T('monopoly', 'Internet Monopoly', 'Internet Monopolies', '🏢', 3e14, 1.6e7, 12, 25, 6,
      'Buys competitors. Renames them. Shuts them down.'),
    T('deadnet', 'Dead Internet', 'Dead Internets', '💀', 6.5e15, 8.5e7, 25, 40, 7,
      'Bots posting for bots, monetized by bots. Margins are excellent.'),

    M('adbanner', 'Ad Banner', 'Ad Banners', '📢', 150, 0.03, 0.3, 1,
      '"PUNCH THE MONKEY, WIN A PRIZE." A timeless business model.'),
    M('popup', 'Pop-up Ad', 'Pop-up Ads', '🪟', 8000, 0.06, 1.2, 1,
      'Close button sold separately.'),
    M('premium', 'Premium Membership', 'Premium Memberships', '💎', 600000, 0.12, 0.2, 1,
      'Removes ads. Adds premium ads.'),
    M('sponsor', 'Sponsorship Deal', 'Sponsorship Deals', '🤝', 6e7, 0.25, 0.8, 1,
      'This post is brought to you by a mattress.'),
    M('databroker', 'Data Broker', 'Data Brokers', '🕵️', 8e9, 0.5, 3, 2,
      'We value your privacy at $0.0004 per user.'),
    M('token', 'Engagement Token', 'Engagement Tokens', '🪙', 1.5e12, 1, 6, 3,
      'A cryptocurrency backed by vibes and one guy named Kevin.'),
    M('bundle', 'Subscription Bundle', 'Subscription Bundles', '📦', 3e14, 2, 2, 6,
      'Pay for 14 services to watch one show.'),

    I('closet', 'Server in a Closet', 'Closet Servers', '🖥️', 300, 6, 0.02, 1,
      'Next to the mop. Mostly works.'),
    I('rack', 'Server Rack', 'Server Racks', '🗄️', 2e4, 40, 0.06, 1,
      'Cable management is a lifestyle choice.'),
    I('datacenter', 'Data Center', 'Data Centers', '🏭', 3e6, 300, 0.15, 1,
      'Uses the electricity of a small country. Cooled by one large fan.'),
    I('cloud', 'Cloud Region', 'Cloud Regions', '☁️', 9e8, 2500, 0.4, 2,
      'Someone else\'s computer, but expensive.'),
    I('orbital', 'Orbital Server Ring', 'Orbital Server Rings', '🛰️', 4e11, 22000, 1, 5,
      'Latency is terrible. Vibes are immaculate.'),

    D('volunteer', 'Volunteer Moderator', 'Volunteer Moderators', '🧹', 450, 5, 1,
      'Paid in exposure and small power trips.'),
    D('automod', 'AutoMod Bot', 'AutoMod Bots', '🛡️', 3e4, 35, 1,
      'Deletes anything containing the letter Q.'),
    D('tns', 'Trust & Safety Team', 'Trust & Safety Teams', '⚖️', 5e6, 260, 1,
      'Has read the Community Guidelines. All of them. Twice.'),
    D('oversight', 'Oversight Board', 'Oversight Boards', '🏛️', 2e9, 2200, 2,
      'Meets quarterly to overturn decisions from 2019.'),
    D('aimod', 'AI Moderator', 'AI Moderators', '👁️', 8e11, 20000, 5,
      'Bans everyone named Steve. Very efficient.'),
  ];
  Z.B = Z.util.byId(Z.BUILDINGS);
  Z.TRAFFIC = Z.BUILDINGS.filter(b => b.cat === 'traffic');
})(window.ICHAOS = window.ICHAOS || {});
