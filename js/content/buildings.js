/* Buildings: everything the player buys in quantity.
   traffic → Attention/s (aps), adds Chaos pressure (cp) and server load
   money   → raises Yield ($ per Attention) by a percentage (pct) per unit
   infra   → adds server capacity (cap) and Stability repair per second (regen)
   mod     → adds Control, which pulls the Chaos target down

   Every Internet Era dresses the same buildings in its own names: the numbers and ids
   stay put (so saves and balance never change), but a Forum Era guestbook becomes a
   podcast in the Viral Era and a ghost thread after the internet ends. Each building is
   defined under the name of the era it arrives in; ERA_NAMES gives every later era its
   own version, and Z.skinBuildings(era) swaps them in. */
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
    T('blog', 'Forum Thread', 'Forum Threads', '🧵', 5, 0.25, 0, 1, 1,
      'Opens with "First post!!" and goes downhill from there.'),
    T('meme', 'Dancing GIF', 'Dancing GIFs', '💃', 60, 1.25, 0.6, 1, 1,
      'A baby, a banana and 40 frames of pure 1998.'),
    T('comments', 'Guestbook', 'Guestbooks', '📖', 700, 6, 1.6, 2, 1,
      'Please sign it. Mom already did.'),
    T('clickbait', 'Chain Email', 'Chain Emails', '📧', 9000, 30, 2.5, 2, 1,
      'Forward to 10 friends or a ghost visits you tonight.'),
    T('bots', 'Spam Bot', 'Spam Bots', '🤖', 150000, 150, 3.5, 4, 1,
      'Sells pills. Replies "nice post" to everything else.'),
    T('trolls', 'Troll Account', 'Troll Accounts', '👹', 3e6, 800, 7, 3, 1,
      'Wrong on purpose since 1997. Has a dial-up connection and no fear.'),
    T('streamer', 'Webcam Page', 'Webcam Pages', '📷', 6.5e7, 4200, 4, 5, 1,
      'A grainy photo of a coffee pot, refreshed every 30 seconds.'),
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

    M('adbanner', '468×60 Banner', '468×60 Banners', '📢', 150, 0.03, 0.3, 1,
      '"PUNCH THE MONKEY, WIN A PRIZE." A timeless business model.'),
    M('popup', 'Pop-up Window', 'Pop-up Windows', '🪟', 8000, 0.06, 1.2, 1,
      'Close one, two more open. Like a hydra, but for casinos.'),
    M('premium', 'Gold Member Badge', 'Gold Member Badges', '⭐', 600000, 0.12, 0.2, 1,
      'A shiny star next to your username. $9.99 a month.'),
    M('sponsor', 'Webring Sponsor', 'Webring Sponsors', '💍', 6e7, 0.25, 0.8, 1,
      'Next site ▶. Previous site ◀. Paid site ★.'),
    M('databroker', 'Data Broker', 'Data Brokers', '🕵️', 8e9, 0.5, 3, 2,
      'We value your privacy at $0.0004 per user.'),
    M('token', 'Engagement Token', 'Engagement Tokens', '🪙', 1.5e12, 1, 6, 3,
      'A cryptocurrency backed by vibes and one guy named Kevin.'),
    M('bundle', 'Subscription Bundle', 'Subscription Bundles', '📦', 3e14, 2, 2, 6,
      'Pay for 14 services to watch one show.'),

    I('closet', 'Dial-up Modem', 'Dial-up Modems', '📞', 300, 6, 0.02, 1,
      'Kshhh-bweee-dinggg. Nobody can use the phone now.'),
    I('rack', 'Beige Tower PC', 'Beige Tower PCs', '🖥️', 2e4, 40, 0.06, 1,
      'Runs the forum, the email and one very loud fan.'),
    I('datacenter', 'Web Hosting Plan', 'Web Hosting Plans', '🏢', 3e6, 300, 0.15, 1,
      'Unlimited bandwidth*. *Up to 5 GB.'),
    I('cloud', 'Cloud Region', 'Cloud Regions', '☁️', 9e8, 2500, 0.4, 2,
      'Someone else\'s computer, but expensive.'),
    I('orbital', 'Orbital Server Ring', 'Orbital Server Rings', '🛰️', 4e11, 22000, 1, 5,
      'Latency is terrible. Vibes are immaculate.'),

    D('volunteer', 'Forum Moderator', 'Forum Moderators', '🧹', 450, 5, 1,
      'Has a green username and no mercy.'),
    D('automod', 'Word Filter', 'Word Filters', '🛡️', 3e4, 35, 1,
      'Replaces every swear word with "heck". Also the word "class".'),
    D('tns', 'Admin Team', 'Admin Teams', '⚖️', 5e6, 260, 1,
      'Three people, one chat room, infinite ban hammers.'),
    D('oversight', 'Oversight Board', 'Oversight Boards', '🏛️', 2e9, 2200, 2,
      'Meets quarterly to overturn decisions from 2019.'),
    D('aimod', 'AI Moderator', 'AI Moderators', '👁️', 8e11, 20000, 5,
      'Bans everyone named Steve. Very efficient.'),
  ];
  Z.B = Z.util.byId(Z.BUILDINGS);
  Z.TRAFFIC = Z.BUILDINGS.filter(b => b.cat === 'traffic');

  /* Each later era's version of every building: [name, plural, icon, flavor].
     A building keeps its own definition in the era it arrives in. */
  const ERA_NAMES = {
    2: {   // Social Media Era: status updates, photo albums, farm games
      blog: ['Status Update', 'Status Updates', '✏️', 'Is feeling hungry. 14 people like this.'],
      meme: ['Rage Comic', 'Rage Comics', '😤', 'Four panels, one face, zero drawing skills.'],
      comments: ['Photo Album', 'Photo Albums', '📸', 'party_pics_FINAL(2). Tag yourself.'],
      clickbait: ['Personality Quiz', 'Personality Quizzes', '🧩', 'Which bread are you? Also, may we see your friends list?'],
      bots: ['Fake Profile Farm', 'Fake Profile Farms', '👥', 'Thousands of new friends, all very active, all named Brenda.'],
      trolls: ['Poke War', 'Poke Wars', '👉', 'Poke. Poke back. Nobody knows why. Nobody can stop.'],
      streamer: ['Cat Video Channel', 'Cat Video Channels', '🐈', 'A cat falls off a table. Eight million views.'],
      adbanner: ['Sidebar Ad', 'Sidebar Ads', '📰', 'Lose belly fat with this one weird trick.'],
      popup: ['Farm Game Coin Pack', 'Farm Game Coin Packs', '🌾', 'Your crops wither unless you pay. Grandma has spent $4,000.'],
      premium: ['Profile Theme', 'Profile Themes', '🎨', 'Glitter backgrounds and autoplay music. Very premium.'],
      sponsor: ['Brand Fan Page', 'Brand Fan Pages', '👍', 'Like us for a chance to win nothing.'],
      closet: ['Shared Hosting Server', 'Shared Hosting Servers', '🖥️', 'Shared with 4,000 other websites and a poker site.'],
      rack: ['Blade Server', 'Blade Servers', '🗄️', 'Thin, loud and occasionally on fire.'],
      datacenter: ['Server Farm', 'Server Farms', '🏭', 'A barn full of computers somewhere very cold.'],
      volunteer: ['Report Button', 'Report Buttons', '🚩', 'Clicked 40,000 times a day. Read twice.'],
      automod: ['Spam Filter', 'Spam Filters', '🛡️', 'Catches all the spam except the spam.'],
      tns: ['Community Team', 'Community Teams', '⚖️', 'Writes "We hear you" in 30 languages.'],
    },
    3: {   // Viral Era: short loops, vertical video, podcasts, influencers, challenges
      blog: ['Six-Second Loop', 'Six-Second Loops', '🔁', 'Six seconds, one shouted catchphrase, infinite replays.'],
      meme: ['Vertical Short', 'Vertical Shorts', '📱', 'Filmed sideways by accident, then upright on purpose.'],
      comments: ['Podcast Episode', 'Podcast Episodes', '🎙️', 'Two friends, three microphones, zero research.'],
      clickbait: ['Reaction Video', 'Reaction Videos', '😱', 'Watching someone watch something. Twelve million views.'],
      bots: ['View Bot Network', 'View Bot Networks', '🤖', 'Watches your videos 24/7. Never skips the ad.'],
      trolls: ['Stan Army', 'Stan Armies', '💅', 'Defends your honor. Starts nine fights before breakfast.'],
      streamer: ['Lip-Sync Dance Clip', 'Lip-Sync Dance Clips', '💃', 'Fifteen seconds of choreography, copied by 40 million teens.'],
      influencer: ['Influencer Squad', 'Influencer Squads', '🤳', 'Five creators, one ring light, a brand deal each.'],
      adbanner: ['Pre-roll Ad', 'Pre-roll Ads', '⏩', 'Skip in 5… 4… 3… Actually, it is unskippable.'],
      popup: ['Creator Fund', 'Creator Funds', '💸', 'Pays $0.02 per million views. Exposure included.'],
      premium: ['Fan Subscription', 'Fan Subscriptions', '⭐', '$4.99 a month for a badge and a shout-out.'],
      sponsor: ['Sponsored Segment', 'Sponsored Segments', '🤝', 'This video is sponsored by a VPN. Again.'],
      databroker: ['Trend Forecaster', 'Trend Forecasters', '📈', 'Knows tomorrow\'s trend. Sells it today.'],
      closet: ['CDN Node', 'CDN Nodes', '🌐', 'Puts your memes closer to the people who hate them.'],
      rack: ['Video Encoding Rack', 'Video Encoding Racks', '🎞️', 'Turns 4K into potato quality at lightning speed.'],
      datacenter: ['Streaming Data Center', 'Streaming Data Centers', '🏭', 'Holds every cat video ever made. Twice.'],
      cloud: ['Auto-Scaling Cloud', 'Auto-Scaling Clouds', '☁️', 'Grows when you go viral. Bills you when you don\'t.'],
      volunteer: ['Comment Pinner', 'Comment Pinners', '📌', 'Pins the one nice comment. Ignores the 4,000 others.'],
      automod: ['Copyright Bot', 'Copyright Bots', '©️', 'Claims your video because a bird sang in the background.'],
      tns: ['Content Review Team', 'Content Review Teams', '⚖️', 'Watches the worst of the internet so you don\'t have to.'],
      oversight: ['Creator Policy Council', 'Creator Policy Councils', '🏛️', 'Updates the rules every Tuesday. Explains them never.'],
    },
    4: {   // Algorithm Era: feeds, engagement bait, infinite scroll
      blog: ['Engagement Bait Post', 'Engagement Bait Posts', '🪝', 'Comment YES if you agree. Comment NO if you also agree.'],
      meme: ['Autoplay Clip', 'Autoplay Clips', '▶️', 'Started before you noticed. Ended after you stopped caring.'],
      comments: ['Infinite Scroll Feed', 'Infinite Scroll Feeds', '♾️', 'There is no bottom. We checked.'],
      clickbait: ['Rage Bait Thread', 'Rage Bait Threads', '😡', 'Wrong on purpose, sorted by anger.'],
      bots: ['Engagement Pod', 'Engagement Pods', '🫂', 'Fifty accounts that promised to like each other forever.'],
      trolls: ['Outrage Cycle', 'Outrage Cycles', '🌀', 'Something new to be furious about every 20 minutes.'],
      streamer: ['Doomscroll Session', 'Doomscroll Sessions', '🌚', 'It is 3 a.m. One more swipe.'],
      influencer: ['Micro-Influencer Network', 'Micro-Influencer Networks', '🤳', '10,000 people with 900 followers each. Very authentic.'],
      viral: ['Trend Recycler', 'Trend Recyclers', '♻️', 'Last year\'s challenge, now with a new sound.'],
      adbanner: ['Native Ad', 'Native Ads', '🧾', 'Looks exactly like a post. That is the point.'],
      popup: ['Shoppable Post', 'Shoppable Posts', '🛍️', 'Tap the shoe. Buy the shoe. Regret the shoe.'],
      premium: ['Paid Checkmark', 'Paid Checkmarks', '✔️', 'Proof you are real, for $8 a month.'],
      sponsor: ['Affiliate Link Network', 'Affiliate Link Networks', '🔗', 'Every link pays a little. Every link is a link.'],
      databroker: ['Behavioral Profile', 'Behavioral Profiles', '🧬', 'Knows you want a new couch before you do.'],
      token: ['Virtual Gift Shop', 'Virtual Gift Shops', '🎁', 'Send a digital rose. Spend a real dollar.'],
      closet: ['Edge Cache', 'Edge Caches', '⚡', 'Your feed, pre-loaded in every city on Earth.'],
      rack: ['Ranking Rack', 'Ranking Racks', '🎛️', 'Sorts every post by how angry it will make you.'],
      datacenter: ['Hyperscale Data Center', 'Hyperscale Data Centers', '🏭', 'Visible from space. Smells like hot dust.'],
      cloud: ['Multi-Cloud Mesh', 'Multi-Cloud Meshes', '☁️', 'Three clouds. Nobody knows which one runs anything.'],
      volunteer: ['Community Note', 'Community Notes', '📝', 'Volunteers adding context to posts that have none.'],
      automod: ['Shadowban Filter', 'Shadowban Filters', '👻', 'You can still post. Nobody will ever see it.'],
      tns: ['Integrity Team', 'Integrity Teams', '⚖️', 'Measures harm in a dashboard nobody opens.'],
      oversight: ['Algorithm Audit Board', 'Algorithm Audit Boards', '🏛️', 'Reviewed the algorithm. Did not understand the algorithm.'],
    },
    5: {   // AI Era: prompts, generated media, chatbots, GPUs
      blog: ['Prompt-Written Article', 'Prompt-Written Articles', '✍️', 'Generated in 0.4 seconds. Proofread in 0.'],
      meme: ['AI-Generated Image', 'AI-Generated Images', '🎨', 'A beautiful sunset. Seven fingers.'],
      comments: ['Chatbot Thread', 'Chatbot Threads', '💬', 'Two chatbots politely agreeing about nothing.'],
      clickbait: ['Synthetic Headline Mill', 'Synthetic Headline Mills', '📰', 'Writes 10,000 headlines a minute and tests them all on you.'],
      bots: ['AI Persona Farm', 'AI Persona Farms', '🤖', 'Fake people with very real opinions about your products.'],
      trolls: ['Deepfake Studio', 'Deepfake Studios', '🎭', 'Any face, any voice, any opinion.'],
      streamer: ['Virtual Streamer', 'Virtual Streamers', '🧸', 'An anime avatar voiced by a language model. Never takes a break.'],
      influencer: ['AI Influencer', 'AI Influencers', '🤳', 'Never ages, never sleeps, never stops selling tea.'],
      viral: ['Generated Trend', 'Generated Trends', '🔥', 'A dance invented by a model, performed by humans.'],
      algorithm: ['Predictive Feed', 'Predictive Feeds', '🔮', 'Shows you what you will want next week.'],
      adbanner: ['Generated Ad', 'Generated Ads', '📢', 'Personalized by a machine that met you once.'],
      popup: ['Upsell Assistant', 'Upsell Assistants', '🗨️', 'Hi! It looks like you are trying to leave.'],
      premium: ['Pro Model Tier', 'Pro Model Tiers', '💎', 'Same answers, delivered with more confidence.'],
      sponsor: ['Sponsored Answer', 'Sponsored Answers', '🤝', 'Every answer now mentions a mattress brand.'],
      databroker: ['Training Data Deal', 'Training Data Deals', '📚', 'Your posts, sold to teach a robot how to post.'],
      token: ['Compute Credit', 'Compute Credits', '🪙', 'Spend them to think. Buy them to spend.'],
      closet: ['Inference Server', 'Inference Servers', '🖥️', 'Hums quietly. Thinks loudly.'],
      rack: ['GPU Rack', 'GPU Racks', '🗄️', 'Warm enough to heat a small apartment.'],
      datacenter: ['AI Training Cluster', 'AI Training Clusters', '🏭', 'Drinks a lake a day. Learns to write haiku.'],
      cloud: ['Model Cloud', 'Model Clouds', '☁️', 'Rent a brain by the millisecond.'],
      volunteer: ['Feedback Rater', 'Feedback Raters', '👍', 'Rates 900 answers an hour. Has opinions now.'],
      automod: ['Prompt Guardrail', 'Prompt Guardrails', '🛡️', 'Refuses to write a poem about cheese. Just in case.'],
      tns: ['Red Team', 'Red Teams', '⚖️', 'Breaks the model before the customers do. Usually.'],
      oversight: ['AI Ethics Board', 'AI Ethics Boards', '🏛️', 'Meets once, publishes a PDF, dissolves.'],
    },
    6: {   // Corporate Internet Era: brands, enterprise, ad tech, lobbying
      blog: ['Thought Leadership Post', 'Thought Leadership Posts', '💼', 'I fired my whole team. Here is what it taught me about kindness.'],
      meme: ['Brand Mascot Meme', 'Brand Mascot Memes', '🦆', 'A frozen-food company being quirky on purpose.'],
      comments: ['Corporate Webinar', 'Corporate Webinars', '📊', 'Ninety minutes. One slide had content.'],
      clickbait: ['Press Release Mill', 'Press Release Mills', '📰', 'Excited to announce our excitement.'],
      bots: ['Brand Ambassador Program', 'Brand Ambassador Programs', '🤖', 'Employees required to post enthusiasm on weekends.'],
      trolls: ['Astroturf Campaign', 'Astroturf Campaigns', '🌱', 'Grassroots support, delivered by a lawn service.'],
      streamer: ['Product Keynote', 'Product Keynotes', '🎤', 'A person in a black sweater says "magical" 40 times.'],
      influencer: ['Creator Agency', 'Creator Agencies', '🏢', 'Manages 900 creators and 900 identical apologies.'],
      viral: ['Synergy Studio', 'Synergy Studios', '🔥', 'Turns trends into "brand moments" six weeks too late.'],
      algorithm: ['Enterprise Feed Engine', 'Enterprise Feed Engines', '🧮', 'Recommends products you already bought.'],
      aislop: ['Content Automation Suite', 'Content Automation Suites', '🧠', 'Writes the newsletter nobody opens, at scale.'],
      adbanner: ['Programmatic Ad', 'Programmatic Ads', '📢', 'Auctioned in 9 milliseconds to a shoe company.'],
      popup: ['Cookie Consent Wall', 'Cookie Consent Walls', '🍪', 'Accept all, or spend six minutes saying no.'],
      premium: ['Enterprise License', 'Enterprise Licenses', '💎', 'Price: contact sales. Sales: never answers.'],
      sponsor: ['Naming Rights Deal', 'Naming Rights Deals', '🤝', 'The stadium, the bridge and your grandma are now sponsored.'],
      databroker: ['Data Partnership', 'Data Partnerships', '🕵️', 'We share your data with 1,400 trusted partners.'],
      token: ['Loyalty Points Program', 'Loyalty Points Programs', '🪙', 'Earn 1 point per $100. Redeem 10,000 for a pen.'],
      closet: ['Private Cloud', 'Private Clouds', '🖥️', 'A public cloud with a fence around it.'],
      rack: ['Compliance Server', 'Compliance Servers', '🗄️', 'Keeps every email forever, for legal reasons.'],
      datacenter: ['Corporate Campus', 'Corporate Campuses', '🏭', 'A slide, a gym, free kombucha and 40,000 servers.'],
      cloud: ['Global Cloud Contract', 'Global Cloud Contracts', '☁️', 'A ten-year deal and one enormous invoice.'],
      orbital: ['Satellite Network', 'Satellite Networks', '🛰️', 'Internet from space, monthly fee from Earth.'],
      volunteer: ['Social Media Intern', 'Social Media Interns', '📋', 'Runs the brand account. Is 19. Is scared.'],
      automod: ['Brand Safety Filter', 'Brand Safety Filters', '🛡️', 'Keeps ads away from anything sad, which is everything.'],
      tns: ['Legal Department', 'Legal Departments', '⚖️', 'Answers every joke with a cease-and-desist letter.'],
      oversight: ['Lobbying Office', 'Lobbying Offices', '🏛️', 'Writes the rules it will be judged by.'],
      aimod: ['Compliance AI', 'Compliance AIs', '👁️', 'Approves everything that makes money.'],
    },
    7: {   // Post-Internet Era: echoes, ghosts, bots talking to bots
      blog: ['Echo Post', 'Echo Posts', '🫥', 'Written by nobody, read by nobody, liked by thousands.'],
      meme: ['Recursive Meme', 'Recursive Memes', '🌀', 'A meme about a meme about the end of memes.'],
      comments: ['Ghost Thread', 'Ghost Threads', '👻', 'Every reply is from an account deleted years ago.'],
      clickbait: ['Headline Loop', 'Headline Loops', '🔁', 'The headline is the article. The article is the headline.'],
      bots: ['Bot Parliament', 'Bot Parliaments', '🤖', 'Bots voting on which bots may post.'],
      trolls: ['Argument Engine', 'Argument Engines', '⚙️', 'Generates fights between people who do not exist.'],
      streamer: ['Endless Stream', 'Endless Streams', '📺', 'Has been live since the servers went quiet.'],
      influencer: ['Ghost Influencer', 'Ghost Influencers', '🤳', 'Still posting. Still sponsored. Gone for years.'],
      viral: ['Signal Spike', 'Signal Spikes', '📡', 'A trend with no origin and no end.'],
      algorithm: ['Self-Feeding Feed', 'Self-Feeding Feeds', '🐍', 'Recommends itself to itself.'],
      aislop: ['Model Collapse Mill', 'Model Collapse Mills', '🧠', 'Trained on its own output. Now only says "content".'],
      monopoly: ['Last Platform', 'Last Platforms', '🏢', 'The only website left. You have to use it.'],
      adbanner: ['Ad for Bots', 'Ads for Bots', '📢', 'Bots watch it, bots click it, bots pay for it.'],
      popup: ['Phantom Paywall', 'Phantom Paywalls', '🚪', 'Pay to see what is behind it. It is another paywall.'],
      premium: ['Afterlife Subscription', 'Afterlife Subscriptions', '💎', 'Your account keeps posting after you are gone. $3.99 a month.'],
      sponsor: ['Void Sponsorship', 'Void Sponsorships', '🤝', 'This silence is brought to you by a mattress.'],
      databroker: ['Memory Broker', 'Memory Brokers', '🕵️', 'Sells what you would have clicked on.'],
      token: ['Echo Coin', 'Echo Coins', '🪙', 'Worth exactly what everyone thinks it is worth. Which is a lot.'],
      bundle: ['Everything Bundle', 'Everything Bundles', '📦', 'One subscription for the whole remaining internet.'],
      closet: ['Abandoned Server', 'Abandoned Servers', '🖥️', 'Nobody pays the bill. It keeps running anyway.'],
      rack: ['Haunted Rack', 'Haunted Racks', '🗄️', 'Blinks in patterns that look a lot like words.'],
      datacenter: ['Archive Vault', 'Archive Vaults', '🏭', 'Every post ever made, stored under a mountain.'],
      cloud: ['Fog Network', 'Fog Networks', '🌫️', 'Lower than a cloud, thicker than a cloud, owned by nobody.'],
      orbital: ['Dyson Server Swarm', 'Dyson Server Swarms', '🛰️', 'Wrapped around the sun. Still buffering.'],
      volunteer: ['Last Moderator', 'Last Moderators', '🧹', 'Still checking the queue. The queue never ends.'],
      automod: ['Ban Daemon', 'Ban Daemons', '🛡️', 'Bans accounts that have not been created yet.'],
      tns: ['Silence Council', 'Silence Councils', '⚖️', 'Decides which nothing may be said.'],
      oversight: ['Archive Court', 'Archive Courts', '🏛️', 'Judges posts from eras that no longer exist.'],
      aimod: ['Watcher Protocol', 'Watcher Protocols', '👁️', 'Sees everything. Says nothing. Still bans Steve.'],
    },
  };

  // The names each building is defined with, for its own era.
  const NATIVE = Object.create(null);
  for (const b of Z.BUILDINGS) NATIVE[b.id] = [b.name, b.plural, b.icon, b.flavor];

  /** The name, plural, icon and flavor a building wears in an era (eras past 7 keep the last look). */
  function lookFor(id, era) {
    const look = ERA_NAMES[era] && ERA_NAMES[era][id];
    return look && Z.B[id].era < era ? look : NATIVE[id];
  }

  let skinned = 1;
  /** Dresses every building in the names of `era`. Cheap to call: it only works when the era changes. */
  Z.skinBuildings = function (era) {
    const e = Math.max(1, Math.min(era || 1, 7));
    if (e === skinned) return false;
    skinned = e;
    for (const b of Z.BUILDINGS) {
      const look = lookFor(b.id, e);
      b.name = look[0]; b.plural = look[1]; b.icon = look[2]; b.flavor = look[3];
    }
    return true;
  };
  Z.skinBuildings.era = () => skinned;
})(window.ICHAOS = window.ICHAOS || {});
