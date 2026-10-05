/* One-time upgrades. Each has effects (see js/systems/modifiers.js for the effect types)
   and a `req(state)` that decides when it appears in the shop. */
(function (Z) {
  'use strict';

  const own = (s, id) => s.buildings[id] || 0;

  /* ---- Building tier upgrades (generated) ---- */

  const TRAFFIC_TIERS = [10, 25, 50, 100, 150, 200, 300, 400];
  const TRAFFIC_MULTS = [2, 1.5, 1.5, 2, 2, 2, 2.5, 3];
  const GENERIC_TIERS = [
    ['Enterprise Edition', 'Same thing, but now it has a sales team.'],
    ['Hyperscale', 'Now running in 40 regions nobody asked for.'],
    ['Final Form', 'It cannot be optimized further. It will be anyway.'],
    ['Beyond Comprehension', 'Analysts have stopped asking questions.'],
  ];

  const TIER_NAMES = {
    blog: [['Listicles', '"17 Reasons Why." Reasons not included.'],
      ['SEO Keyword Stuffing', 'Best blog best blog cheap blog near me.'],
      ['Ghostwriters Paid in Pizza', 'They write 40 posts a day. Two slices each.'],
      ['Content Strategy Deck', '84 slides. The strategy is "more content".']],
    meme: [['Impact Font License', 'TOP TEXT. BOTTOM TEXT. PROFIT.'],
      ['Deep-Fried Filters', 'Saturation at 400%. Comedy at 400%.'],
      ['Meme Recycling Plant', 'Nothing is wasted. Everything is reposted.'],
      ['Meme Lawyers', 'Your watermark is now legally binding.']],
    comments: [['Reply Notifications', 'Someone replied to you! (They disagree.)'],
      ['Downvote Button', 'Users can now express feelings numerically.'],
      ['Pinned Controversy', 'The top comment is always a fight.'],
      ['Infinite Reply Threads', 'The indentation goes off the right side of the screen.']],
    clickbait: [['ALL CAPS HEADLINES', 'YOU WILL NOT BELIEVE THIS UPGRADE.'],
      ['Shocked Face Thumbnails', 'Mouth open. Red arrow pointing at nothing.'],
      ['"Doctors Hate Him"', 'Doctors are, at most, mildly annoyed.'],
      ['Headlines Written by Rage', 'Accuracy fell 90%. Clicks rose 300%.']],
    bots: [['Sunset Profile Pictures', 'Every bot is now "Jennifer, 34, loves life".'],
      ['Bots That Argue With Bots', 'Engagement has never been this efficient.'],
      ['Bots With Backstories', 'Each bot has a dog, a divorce and opinions.'],
      ['Bot Union', 'Demanded better Wi-Fi. Got it.']],
    trolls: [['Sock Puppet Starter Kit', 'Twelve personalities, one keyboard.'],
      ['Professional Contrarians', 'They disagree with everything, including this description.'],
      ['Troll Training Academy', 'Graduates know exactly which words to misspell.'],
      ['Coordinated Inauthentic Behavior™', 'It is trademarked now, so it is fine. Probably.']],
    streamer: [['Ring Light', 'Every pore is now content.'],
      ['Overreaction Coaching', 'Gasping lessons, three times a week.'],
      ['24/7 Stream Schedule', 'Sleep streams count as content.'],
      ['Reactions to Reactions', 'Someone reacts to them reacting to you.']],
    influencer: [['Brand Deals', 'Everything in the house has a discount code.'],
      ['Staged Breakups', 'Two members dated for exactly one sponsorship cycle.'],
      ['Apology Tour', 'Sorry, sorrier, sorriest. Each one is its own video.'],
      ['Merch Drop', 'Hoodies that say "hoodie". $90.']],
    viral: [['Dance Choreographer', 'Three moves. Two of them are pointing.'],
      ['Liability Waiver', 'Participants agree it was their idea.'],
      ['Challenge Chains', 'Every challenge nominates five more challenges.'],
      ['Viral Prophecy', 'Predicts the next trend by starting it.']],
    algorithm: [['Engagement Metrics', 'Time spent angry now counts as time well spent.'],
      ['Rabbit Hole Optimizer', 'From cooking videos to conspiracies in four clicks.'],
      ['Autoplay Next', 'The next video starts before you decide anything.'],
      ['The Algorithm Knows You', 'It knows you skipped breakfast. It has suggestions.']],
    aislop: [['Prompt Engineers', 'They type "make it better" professionally.'],
      ['Hallucination Quotas', 'Every article must contain at least one new fact.'],
      ['AI Writes Prompts for AI', 'Humans have been politely removed from the loop.'],
      ['Six-Fingered Hands', 'More fingers, more engagement. Science.']],
    monopoly: [['Hostile Takeovers', 'Friendly takeovers were less fun.'],
      ['Terms of Service Update', 'You agreed by reading this sentence.'],
      ['Antitrust Speedrun', 'Any% congressional hearing in 11 minutes.'],
      ['Too Big to Scroll', 'The homepage is now the entire internet.']],
    deadnet: [['Bot-to-Bot Commerce', 'Bots sell ads to bots who click ads for bots.'],
      ['Ghost Engagement', 'Likes from accounts deleted in 2014.'],
      ['Nobody Is Here', 'Traffic is at an all-time high.'],
      ['Heat Death of Content', 'Every possible post has been posted. Repost.']],

    adbanner: [['Blinking Text', 'Flashing at a frequency lawyers call "bold".'],
      ['Animated GIF Ads', 'A dancing hamster sells mortgages.'],
      ['Ads Inside Ads', 'Each banner now contains a smaller banner.'],
      ['Ad-pocalypse', 'There is no content. Only banners.']],
    popup: [['Fake Close Buttons', 'The X is also an ad.'],
      ['Pop-unders', 'Surprise! Found when you close the browser.'],
      ['Popups That Open Popups', 'A self-sustaining ecosystem.'],
      ['Modal Hell', '"Are you sure you want to leave?" Forever.']],
    premium: [['Premium Plus', 'Like Premium, but with the word Plus.'],
      ['Premium Plus Max', 'Twice the words, twice the price.'],
      ['Premium Ultra Lite', 'Fewer features for more money. Bold.'],
      ['Premium Infinity Pro', 'Unlocks the ability to unlock things.']],
    sponsor: [['Integrated Ad Reads', 'Seamlessly transitions into talking about socks.'],
      ['Unskippable Segments', 'The sponsor is the content now.'],
      ['Sponsored Opinions', 'This opinion is brought to you by an opinion brand.'],
      ['Sponsored Sponsorships', 'This deal is sponsored by another deal.']],
    databroker: [['Shadow Profiles', 'We know your friends better than you do.'],
      ['Location "Insights"', 'You visited a bakery 400 times. Noted.'],
      ['Data Lake (Swamp)', 'Nobody can find anything. Very valuable.'],
      ['Data About the Data', 'Selling information about the information we sell.']],
    token: [['Whitepaper (3 Pages)', 'Page three is just a picture of a rocket.'],
      ['Rug-Pull Insurance', 'Covers everything except rug pulls.'],
      ['Staking the Stake', 'Yield on yield on vibes.'],
      ['Tokenized Tokens', 'Each token is backed by a smaller token.']],
    bundle: [['Bundle of Bundles', 'Fourteen bundles, one invoice, zero shows.'],
      ['Annual Plan (Non-Refundable)', 'Commitment is a feature.'],
      ['Cancel by Fax Only', 'Fax machine not included.'],
      ['Subscription to Cancel Subscriptions', 'Cancellation is a premium experience.']],

    closet: [['Removed the Second Mop', 'Airflow improved 40%.'],
      ['Closet Air Conditioning', 'It is a desk fan pointed at the door.'],
      ['Closet Expansion Pack', 'Annexed the hallway.']],
    rack: [['Labeled Cables', 'Every cable is labeled "important".'],
      ['Hot Aisle / Cold Aisle', 'Also used as a sauna.'],
      ['Rack of Racks', 'Racks all the way down.']],
    datacenter: [['Backup Generators', 'Tested once. Loudly.'],
      ['Liquid Cooling', 'Mostly water. Partly energy drink.'],
      ['Data Center Under the Sea', 'The fish have started reading the comments.']],
    cloud: [['Multi-Region', 'Outages are now available in every timezone.'],
      ['Auto Scaling', 'Scales up instantly. The bill too.'],
      ['Cloud Above the Cloud', 'Meteorologists are confused.']],
    orbital: [['Solar Panels', 'Infinite power, minus eclipses.'],
      ['Laser Uplinks', 'Pew pew, but for packets.'],
      ['Dyson-ish Swarm', 'Not a sphere. More of a vibe.']],

    volunteer: [['Mod Badge', 'A tiny green shield. Absolute power.'],
      ['Mod Group Chat', 'Where the real moderation drama happens.'],
      ['Mod Pizza Fridays', 'Morale up 300%. Budget down $40.']],
    automod: [['Regex Rules', 'Now blocks words that rhyme with bad words.'],
      ['Machine Learning (if-statements)', 'Six hundred if-statements in a trench coat.'],
      ['AutoMod Moderates AutoMod', 'Self-regulation, finally.']],
    tns: [['Policy Wiki', 'Four thousand pages. Searchable, in theory.'],
      ['Escalation Matrix', 'Every problem has a manager. Every manager has a problem.'],
      ['Global Response Center', 'A room with many screens and one tired person.']],
    oversight: [['Public Statements', 'Very long. Very calm. Very late.'],
      ['Appeal Process', 'Appeals are reviewed by the appeals board\'s appeal board.'],
      ['Supreme Content Court', 'Wigs are optional but encouraged.']],
    aimod: [['Context Window', 'Now remembers what you said three messages ago.'],
      ['Ban Prediction', 'Bans users before they post. Efficient.'],
      ['Pre-Crime Moderation', 'Your next comment has already been removed.']],
  };

  const CAT_TIERS = {
    traffic: { tiers: TRAFFIC_TIERS, mults: TRAFFIC_MULTS, factor: 20 },
    money: { tiers: [10, 25, 50, 100], mults: [1.25, 1.25, 1.25, 1.25], factor: 15 },
    infra: { tiers: [10, 25, 50], mults: [2, 2, 2], factor: 10 },
    mod: { tiers: [10, 25, 50], mults: [2, 2, 2], factor: 10 },
  };

  const tierUpgrades = [];
  for (const b of Z.BUILDINGS) {
    const spec = CAT_TIERS[b.cat];
    const names = TIER_NAMES[b.id] || [];
    spec.tiers.forEach((tier, i) => {
      const named = names[i];
      const generic = GENERIC_TIERS[i - names.length];
      const name = named ? named[0] : b.name + ': ' + generic[0];
      const flavor = named ? named[1] : generic[1];
      tierUpgrades.push({
        id: b.id + '_t' + tier,
        name,
        icon: b.icon,
        cost: b.cost * spec.factor * Math.pow(b.growth || Z.BAL.costGrowth, tier),
        era: b.era,
        group: 'building',
        building: b.id,
        tier,
        effects: [{ t: 'bMult', id: b.id, x: spec.mults[i] }],
        req: s => own(s, b.id) >= tier,
        flavor,
      });
    });
  }

  /* ---- Hand-made upgrades ---- */

  const U = (id, group, name, icon, cost, effects, req, flavor, era) =>
    ({ id, group, name, icon, cost, effects, req, flavor, era: era || 1 });

  const special = [
    // Clicking — strong early, then a slowly fading share of total output
    U('keyboard', 'click', 'Mechanical Keyboard', '⌨️', 20, [{ t: 'clickFlat', v: 1 }],
      s => s.run.clicks >= 5, 'Clackety. Every keystroke is content.'),
    U('monitor2', 'click', 'Second Monitor', '🖥️', 150, [{ t: 'clickMult', x: 2 }],
      s => s.run.clicks >= 40, 'One screen for content. One screen for reading the comments.'),
    U('energy', 'click', 'Energy Drink Sponsorship', '🥤', 2500, [{ t: 'clickMult', x: 2 }],
      s => s.run.attention >= 2000, 'Tastes like the color blue.'),
    U('hottake', 'click', 'Hot Take Generator', '🌶️', 4e4, [{ t: 'clickAps', v: 0.02 }],
      s => s.run.attention >= 5e4, 'Every click now also contains an opinion.'),
    U('ergorage', 'click', 'Ergonomic Rage', '😤', 5e6, [{ t: 'clickMult', x: 3 }, { t: 'clickAps', v: 0.02 }],
      s => s.run.attention >= 1e7, 'A wrist rest designed for typing angrily.'),
    U('thumb', 'click', 'Thumb of Destiny', '👍', 5e9, [{ t: 'clickMult', x: 5 }, { t: 'clickAps', v: 0.02 }],
      s => s.run.attention >= 1e10, 'One thumb. Infinite scrolling. Unstoppable.'),

    // Automation
    U('intern', 'auto', 'Unpaid Intern', '🧑‍💻', 8000, [{ t: 'autoClick', v: 2 }],
      s => s.run.attention >= 1e4, 'Clicks for you twice a second. Keeps asking about "the actual job".'),
    U('interns', 'auto', 'Intern Army', '👥', 2e6, [{ t: 'autoClick', v: 5 }],
      s => !!s.upgrades.intern && s.run.attention >= 3e6, 'They formed a union. The union also clicks.'),
    U('sre', 'auto', 'SRE On-Call Rotation', '📟', 2.5e5, [{ t: 'autoHotfix' }],
      s => own(s, 'rack') >= 3, 'Pushes a Hotfix by itself when Stability falls below your threshold.'),

    // Monetization
    U('cookies', 'money', 'Cookie Consent Banner', '🍪', 500, [{ t: 'yieldMult', x: 1.2 }],
      s => own(s, 'adbanner') >= 1, 'We use cookies. You accept. That is the deal.'),
    U('autoplay', 'money', 'Autoplay Video Ads', '📺', 3e4, [{ t: 'yieldMult', x: 1.3 }, { t: 'pressureMult', x: 1.1 }],
      s => own(s, 'popup') >= 3, 'With sound. Obviously.'),
    U('preroll', 'money', 'Unskippable Pre-roll', '⏯️', 2e6, [{ t: 'yieldMult', x: 1.3 }],
      s => own(s, 'premium') >= 3, 'Your video will begin after this 45-minute documentary.'),
    U('affiliate', 'money', 'Affiliate Links Everywhere', '🔗', 1e8, [{ t: 'yieldMult', x: 1.5 }],
      s => own(s, 'sponsor') >= 3, 'Even the word "the" is now an affiliate link.'),
    U('dynamicprice', 'money', 'Dynamic Pricing for Air', '💨', 2e10, [{ t: 'yieldMult', x: 1.5 }],
      s => s.run.attention >= 2e10, 'The price changes when you look at it.'),
    U('outrage', 'chaos', 'Monetize the Outrage', '💢', 2.5e5, [{ t: 'chaosYield', v: 0.5 }],
      s => s.run.maxChaos >= 50, 'Anger is just engagement with extra steps.'),

    // Chaos
    U('ragebait', 'chaos', 'Rage Bait Analytics', '📈', 8000, [{ t: 'chaosAtt', v: 0.5 }],
      s => own(s, 'comments') >= 5, 'Turns out people click harder when they are furious.'),
    U('brakes', 'chaos', 'Remove the Brakes', '🚫', 1.5e5, [{ t: 'policy', id: 'unhinged' }],
      s => s.run.maxChaos >= 70, 'The editorial team has been replaced by a raccoon.'),
    U('calendar', 'chaos', 'Controversy Calendar', '📅', 5e7, [{ t: 'chaosAtt', v: 0.5 }],
      s => own(s, 'trolls') >= 10, 'A scandal every Tuesday. Planned six months ahead.'),
    U('farming', 'chaos', 'Engagement Farming', '🌾', 5e9, [{ t: 'chaosYield', v: 0.5 }, { t: 'chaosAtt', v: 0.5 }],
      s => s.run.attention >= 5e9, 'We plant arguments and harvest ad impressions.'),

    // Stability and infrastructure
    U('reboot', 'stability', 'Turn It Off and On Again', '🔌', 900, [{ t: 'regenMult', x: 1.5 }],
      s => own(s, 'closet') >= 1, 'Fixes 80% of problems. Causes the other 20%.'),
    U('loadbal', 'stability', 'Load Balancer', '⚖️', 5e4, [{ t: 'capacityMult', x: 1.5 }],
      s => own(s, 'rack') >= 3, 'Spreads the traffic evenly between things that are on fire.'),
    U('statuspage', 'stability', 'Status Page', '🟢', 3e5, [{ t: 'meltdownMult', x: 0.5 }],
      s => s.stats.meltdowns >= 1 || own(s, 'rack') >= 8, 'All systems operational. (Last updated 3 years ago.)'),
    U('chaoseng', 'stability', 'Chaos Engineering', '🧪', 2e7, [{ t: 'drainMult', x: 0.75 }],
      s => own(s, 'datacenter') >= 1, 'We break things on purpose now. It is called a strategy.'),
    U('rollback', 'stability', 'Rollback Button', '⏪', 3e8, [{ t: 'hotfixPower', v: 15 }, { t: 'hotfixCooldown', x: 0.7 }],
      s => s.stats.hotfixes >= 10, 'For when the Hotfix needs a Hotfix.'),
    U('phonenum', 'stability', 'Change Phone Number', 'svg:bsod', 2.5e8,
      [{ t: 'crashGuard', x: 0.4 }, { t: 'stabilityBonus', v: 4 }, { t: 'attMult', x: 2.5 }],
      s => s.run.attention >= 1e8,
      'The servers kept calling at 3 AM to report blue screens. New number: they can\'t reach you, so they stopped crashing. Everything earns ×2.5.'),
    U('k8s', 'stability', 'Kubernetes (Nobody Understands It)', '☸️', 1e10, [{ t: 'capacityMult', x: 2 }],
      s => own(s, 'datacenter') >= 10, 'It works. Nobody knows why. Do not touch the YAML.'),

    // Moderation
    U('guidelines', 'mod', 'Community Guidelines (Unread)', '📜', 2500, [{ t: 'controlMult', x: 1.5 }],
      s => own(s, 'volunteer') >= 3, 'Nobody has read them. They work anyway, somehow.'),
    U('apologyvid', 'mod', 'Apology Video Studio', '😔', 2e4, [{ t: 'action', id: 'apology' }],
      s => own(s, 'volunteer') >= 3 || s.run.maxChaos >= 60, 'Gray wall, sad lighting, no eye contact.'),
    U('shadowban', 'mod', 'Shadowban Technology', '👻', 1.5e5, [{ t: 'modPenalty', x: 0 }],
      s => own(s, 'automod') >= 3, 'The banned never find out. They just get very quiet.'),
    U('outsourced', 'mod', 'Outsourced Moderation', '🌍', 3e7, [{ t: 'controlMult', x: 2 }],
      s => own(s, 'tns') >= 3, 'A call center that now also handles your hate mail.'),
    U('blockbtn', 'mod', 'Block Button', '⛔', 5e9, [{ t: 'controlMult', x: 1.5 }],
      s => own(s, 'tns') >= 15, 'Revolutionary technology: users moderate each other.'),

    // Events
    U('prteam', 'events', 'PR Team', '📣', 7.5e4, [{ t: 'badSeverity', x: 0.7 }],
      s => s.stats.events >= 5, 'Professionally says "we take this very seriously".'),
    U('baitlib', 'events', 'Engagement Bait Library', '📚', 2e6, [{ t: 'goodEvents', x: 1.3 }],
      s => s.stats.events >= 12, 'A shelf of proven viral formats, alphabetized by shame.'),
    U('forecaster', 'events', 'Trend Forecaster', '🔮', 5e6, [{ t: 'buffDuration', x: 1.5 }],
      s => s.stats.events >= 15, 'Reads tea leaves. The tea is sponsored.'),
    U('crisis', 'events', 'Crisis Comms Playbook', '📕', 1e9, [{ t: 'badSeverity', x: 0.7 }],
      s => s.stats.events >= 30, 'Step 1: say nothing. Step 2: say less.'),

    // Global Attention
    U('seo', 'global', 'SEO Black Magic', '🔍', 1500, [{ t: 'attMult', x: 1.2 }],
      s => own(s, 'blog') >= 15, 'Hidden white text that says "free money" 4,000 times.'),
    U('darkmode', 'global', 'Dark Mode', '🌙', 3.5e4, [{ t: 'attMult', x: 1.15 }],
      s => s.run.attention >= 4e4, 'Same site, but sadder.'),
    U('infinite', 'global', 'Infinite Scroll', '♾️', 3e6, [{ t: 'attMult', x: 1.5 }],
      s => s.run.attention >= 5e6, 'There is no bottom. There was never a bottom.'),
    U('push', 'global', 'Push Notifications', '🔔', 1e8, [{ t: 'attMult', x: 1.5 }, { t: 'pressureMult', x: 1.1 }],
      s => s.run.attention >= 1.5e8, '"Someone you might know posted something you might like."'),
    U('dopamine', 'global', 'Dopamine Slot Machine', '🎰', 5e10, [{ t: 'attMult', x: 2 }],
      s => s.run.attention >= 5e10, 'Pull to refresh. Pull to refresh. Pull to refresh.'),

    // Synergies between buildings
    U('botcomments', 'synergy', 'Bots in the Comments', '🤖', 2.5e5, [{ t: 'synergy', id: 'comments', src: 'bots', v: 0.02 }],
      s => own(s, 'bots') >= 5 && own(s, 'comments') >= 25, 'Half the argument is now automated.'),
    U('blogbots', 'synergy', 'Bots Write the Blogs', '✍️', 4e5, [{ t: 'synergy', id: 'blog', src: 'bots', v: 0.05 }],
      s => own(s, 'bots') >= 10, 'Quality unchanged. Nobody noticed.'),
    U('trollbait', 'synergy', 'Troll-Powered Clickbait', '🪝', 6e6, [{ t: 'synergy', id: 'clickbait', src: 'trolls', v: 0.03 }],
      s => own(s, 'trolls') >= 5, 'Trolls write the headlines. Everyone clicks to complain.'),
    U('reactmemes', 'synergy', 'Streamers React to Memes', '📺', 8e7, [{ t: 'synergy', id: 'meme', src: 'streamer', v: 0.05 }],
      s => own(s, 'streamer') >= 5, 'Nine hours of looking at memes and saying "bro".'),
    U('influbots', 'synergy', 'Influencers Buy Bots', '💸', 3e9, [{ t: 'synergy', id: 'bots', src: 'influencer', v: 0.03 }],
      s => own(s, 'influencer') >= 5, 'Every follower is real if you pay for it.', 2),
    U('viralalgo', 'synergy', 'The Algorithm Loves Challenges', '🧮', 1e12, [{ t: 'synergy', id: 'viral', src: 'algorithm', v: 0.03 }],
      s => own(s, 'algorithm') >= 5, 'Recommended for you: a dance you will regret.', 4),
    U('aiclickbait', 'synergy', 'AI Writes the Clickbait', '🧠', 2e13, [{ t: 'synergy', id: 'clickbait', src: 'aislop', v: 0.05 }],
      s => own(s, 'aislop') >= 5, '"You won\'t believe #7" — #7 was generated in 0.2 seconds.', 5),

    // Era mechanics
    U('trendjack', 'events', 'Trendjacking', '#️⃣', 5e8, [{ t: 'trendMult', v: 1 }],
      s => s.run.attention >= 5e8, 'Trending buildings produce ×4 instead of ×3.', 2),
  ];

  Z.UPGRADES = special.concat(tierUpgrades);
  Z.U = Z.util.byId(Z.UPGRADES);
})(window.ICHAOS = window.ICHAOS || {});
