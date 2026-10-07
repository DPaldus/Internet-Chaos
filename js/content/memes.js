/* The Meme Page's memes, in the formats the internet actually uses: Drake, the expanding
   brain, Panik/Kalm/Panik, the distracted boyfriend, two buttons, a trade offer, "Nobody:",
   "Always has been", "This is fine", "Is this a pigeon?", Gru's plan, "Change my mind",
   Stonks, two Spider-Men pointing, a screenshot of a post, a text from Mom, and the
   classic top text / bottom text. Every picture is drawn from emoji by js/ui/chat.js; the
   jokes are about the internet and running a website.

   Each meme is a topic of the Meme Page (see js/content/chatter.js) with its own comments.
   kind     rows (drake, brain, panik, gru) · scene (emoji placed on a picture) · buttons ·
            trade · nobody · tweet · texts · classic
   eras     only shown in these Internet Eras (all when missing)
   keys     extra words that tie a comment to this meme (js/ui/chat.js) */
(function (Z) {
  'use strict';

  const MEMES = [
    {
      title: 'bug or feature', slug: 'drake-bug-feature', kind: 'drake',
      rows: [['🙅', 'Fixing the bug'], ['😏👉', 'Calling it a feature in the patch notes']],
      keys: ['bug', 'feature', 'drake', 'patch'],
      low: [
        'reg|me every single day at work',
        'smart|The words "in the patch notes" are doing a lot of heavy lifting in the bottom panel.',
        'story|my car beeps when I turn left. I call it the left-turn chime now. it\'s a feature',
        'lurker|this is the way',
      ],
      mid: [
        'pedant|Technically a bug becomes a feature once it\'s documented. So please document it.',
        'troll|devs when the "feature" takes the whole site down: 🙅',
        'defensive|Some bugs ARE features. My entire personality, for example.',
        'confused|wait so is my wifi dropping a feature',
      ],
      high: [
        'drama|I REPORTED A BUG IN 2019 AND THEY GAVE IT AN AWARD',
        'wrong|bugs were invented when a real bug got into a computer. so they ARE features. nature\'s features',
        'troll|the site going down is a feature called "touch grass mode"',
        'serious|I have filed this meme under "documentation".',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'smart', B: 'troll', C: 'drama', D: 'pedant' }, steps: [
          'A|The real joke is that the bug report and the feature request are the same ticket.',
          'B>0|closed as duplicate',
          'C>1|MY TICKET WAS CLOSED AS A DUPLICATE OF ITSELF',
          'D>2|That\'s not a duplicate. That\'s recursion.',
          'B>3|closed as recursion',
        ] },
      ],
    },
    {
      title: 'big brain reading', slug: 'galaxy-brain-comments', kind: 'brain',
      rows: [['🧠', 'Reading the article'], ['🧠💡', 'Reading only the headline'], ['🧠✨', 'Reading only the comments'],
        ['🌌', 'Writing a 2,000-word reply to a comment you misread']],
      keys: ['brain', 'article', 'headline', 'reply', 'misread'],
      low: [
        'reg|the last panel is a personal attack and I accept it',
        'smart|It\'s funny because the brain gets bigger as the effort gets worse.',
        'story|I once replied to a typo for three days. I was right, though',
        'lurker|I\'m at panel 3 right now',
      ],
      mid: [
        'pedant|Panel four should be "misread on purpose". That\'s the true galaxy brain.',
        'troll|panel 5: not reading anything and still winning the argument (me)',
        'defensive|I DID read the article. The first sentence counts as reading.',
        'confused|which panel is the smart one? the glowy one?',
      ],
      high: [
        'drama|I AM PANEL FOUR. I HAVE ALWAYS BEEN PANEL FOUR',
        'wrong|the brain grows when you skip articles. that\'s neuroscience',
        'serious|I wrote a 2,000-word reply to this meme. I misread it. The cycle is complete.',
        'troll|didn\'t read the meme, disagree with panel 3',
      ],
      threads: [
        { tier: 'high', cast: { A: 'serious', B: 'pedant', C: 'troll', D: 'confused' }, steps: [
          'A|I disagree with panel two. Headlines are a valid source.',
          'B>0|Did you read the rest of panel two?',
          'A>1|I read the title of panel two.',
          'C>2|galaxy brain behavior, live, in the wild',
          'D>3|so is he panel 2 or panel 4 now',
          'B>4|He\'s a new panel. We need a bigger brain.',
        ] },
      ],
    },
    {
      title: 'panik kalm panik', slug: 'panik-kalm-cache', kind: 'panik',
      rows: [['😱', 'PANIK', 'Your website is down'], ['😌', 'KALM', 'It\'s probably just the cache'], ['😱', 'PANIK', 'You don\'t know what a cache is']],
      keys: ['panik', 'kalm', 'cache', 'down'],
      low: [
        'reg|this is literally every sysadmin',
        'smart|Step four is clearing the cache anyway and hoping. Works 60% of the time.',
        'story|my uncle fixed his whole computer by unplugging it and plugging it back in. he\'s an IT legend now',
        'confused|what IS a cache',
      ],
      mid: [
        'pedant|It\'s pronounced "cash". I\'ve heard things in this thread I can\'t unhear.',
        'troll|panik is a lifestyle',
        'defensive|I know what a cache is. I just don\'t want to explain it here.',
        'wrong|a cache is where pirates keep their gold. that\'s why websites need one',
      ],
      high: [
        'drama|PANIK. KALM. PANIK. THAT\'S MY ENTIRE WEEK',
        'troll|me reading this during an outage: 😐',
        'serious|I\'ve added a fourth panel: "the cache was the friends we made along the way". KALM.',
        'confused|IS THE SITE DOWN NOW OR IS THIS THE MEME',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'confused', B: 'smart', C: 'wrong', D: 'reg' }, steps: [
          'A|ok but genuinely what is a cache',
          'B>0|A copy of things you already loaded, so they load faster next time.',
          'C>1|wrong. it\'s a small bag for coins',
          'D>2|that\'s a purse',
          'C>3|a purse is a cache for your hands',
        ] },
      ],
    },
    {
      title: 'distracted by a domain', slug: 'distracted-domain', kind: 'scene',
      scene: { bg: 'linear-gradient(#bfe3ff, #f3efe2 62%, #c9b98f)', items: [
        { e: '💃', x: 20, y: 60, s: 22, label: 'A NEW DOMAIN FOR $0.99', lx: 22, ly: 18, w: 38 },
        { e: '🚶‍♂️', x: 52, y: 62, s: 24, label: 'ME', lx: 52, ly: 30, flip: true },
        { e: '😠', x: 80, y: 58, s: 20, label: 'MY 47 UNFINISHED PROJECTS', lx: 78, ly: 18, w: 38 },
      ] },
      keys: ['domain', 'project', 'projects', 'boyfriend', 'distracted'],
      low: [
        'reg|47 is a rookie number',
        'story|I own 11 domains. One of them is just a picture of my dog. Worth it.',
        'smart|The renewal price in year two is the real villain of this meme.',
        'lurker|called out',
      ],
      mid: [
        'troll|$0.99 the first year. $49.99 forever after. romance',
        'pedant|A domain is not a project. It\'s a promise you make to yourself and break.',
        'defensive|My unfinished projects are not unfinished. They\'re in early access.',
        'confused|wait which one is the girlfriend',
      ],
      high: [
        'drama|I BOUGHT THREE DOMAINS WHILE READING THIS MEME',
        'wrong|domains are free if you buy them at midnight',
        'troll|projects are temporary. domain renewal emails are forever',
        'serious|I\'d like to formally apologize to my 47 projects. I\'ll get back to you. (I will not.)',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'story', B: 'pedant', C: 'troll', D: 'reg' }, steps: [
          'A|I bought mysite-final-v2.com in 2015. Still empty. Still renewing.',
          'B>0|Why not mysite-final.com?',
          'A>1|Someone bought it. It was me. In 2014.',
          'C>2|bro is outbidding himself',
          'D>2|this is the most relatable thing I\'ve read today',
        ] },
      ],
    },
    {
      title: 'two buttons at 3 am', slug: 'two-buttons-bedtime', kind: 'buttons',
      buttons: ['Go to bed', 'Buy one more server'], who: '😰', caption: 'me at 3 am',
      keys: ['button', 'buttons', 'server', 'servers', 'bed', 'sleep'],
      low: [
        'reg|it\'s 3am and I clicked the right one',
        'smart|The trick is buying the server, THEN going to bed. Everybody wins.',
        'lurker|I\'m in this picture and I don\'t like it',
        'story|my partner asked why the lights were on at 4am. I said "infrastructure"',
      ],
      mid: [
        'troll|imagine having a choice. I have autobuy',
        'pedant|You can press both. The buttons aren\'t mutually exclusive. Read the interface.',
        'defensive|Some of us need 40 servers to sleep, ok',
        'confused|is there a third button for snacks',
      ],
      high: [
        'drama|I PRESSED BOTH AND NOW I\'M A SERVER',
        'troll|a bed is just a server for people',
        'wrong|sleeping is when the servers grow. that\'s science',
        'serious|I\'ve pressed "one more server" 214 times tonight. The sun is rising. I regret nothing.',
      ],
      threads: [
        { tier: 'high', cast: { A: 'drama', B: 'smart', C: 'troll', D: 'confused' }, steps: [
          'A|WHY IS IT ALWAYS 3 AM WHEN THE SERVERS NEED ME',
          'B>0|Because at 3 am nobody else is buying servers. Supply and demand.',
          'C>1|servers are cheaper at night. like gas stations',
          'D>2|is that true?? I\'ve been buying them at noon like a fool',
          'A>3|WE ALL HAVE',
        ] },
      ],
    },
    {
      title: 'trade offer', slug: 'trade-offer-attention', kind: 'trade',
      give: 'your attention span', get: '14 notifications and a cookie banner',
      keys: ['trade', 'offer', 'attention', 'notification', 'notifications', 'cookie'],
      low: [
        'reg|this is just how the internet works',
        'smart|It\'s a fair trade if you value the cookie. I don\'t.',
        'lurker|accepted before I read it',
        'story|I accepted a trade like this in 2009 and I\'ve been on this website ever since',
      ],
      mid: [
        'troll|counteroffer: you receive nothing and you like it',
        'pedant|A cookie banner is not a gift. It\'s a legal requirement shaped like a gift.',
        'defensive|I declined the cookies. I still got the notifications. Rigged.',
        'confused|can I trade back',
      ],
      high: [
        'drama|I GAVE THEM MY ATTENTION SPAN AND NOW I CAN\'T FINISH A SENTE',
        'troll|i receive: your data. you receive: "we value your privacy"',
        'wrong|attention span is a type of bridge',
        'serious|I\'m taking this offer to arbitration.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'serious', B: 'troll', C: 'smart' }, steps: [
          'A|I\'d like to negotiate. What if I give you half my attention span?',
          'B>0|you don\'t have half. you have a quarter. we checked',
          'C>1|To be fair, nobody has a whole one anymore. It\'s a seller\'s market.',
          'A>2|Then I\'d like a refund on the notifications.',
          'B>3|no refunds. only more notifications',
        ] },
      ],
    },
    {
      title: 'nobody asked', slug: 'nobody-cookie-banner', kind: 'nobody',
      who: 'The cookie banner at 3 am', punch: 'WE VALUE YOUR PRIVACY', emoji: '🍪',
      keys: ['nobody', 'cookie', 'cookies', 'banner', 'privacy'],
      low: [
        'reg|every single website',
        'smart|The best part is "we value your privacy" followed by a list of 400 partners.',
        'lurker|accept all (I\'m tired)',
        'story|I clicked "reject all" once and the site asked if I was sure six times',
      ],
      mid: [
        'troll|"necessary cookies" is doing a lot of work',
        'pedant|"Nobody:" then "Absolutely nobody:". You did it right. I\'m almost disappointed.',
        'confused|can I eat these cookies',
        'defensive|I read the whole cookie policy. Somebody has to.',
      ],
      high: [
        'drama|THE COOKIE BANNER FOLLOWED ME INTO MY DREAMS',
        'troll|the cookie banner is the only one who talks to me at 3am',
        'wrong|cookies are tiny programs that bake when you click accept',
        'serious|I\'m starting a petition to ban cookie banners. Please accept the cookies to sign it.',
      ],
      threads: [
        { tier: 'high', cast: { A: 'confused', B: 'wrong', C: 'pedant', D: 'troll' }, steps: [
          'A|wait if I accept the cookies do I get cookies',
          'B>0|yes. they mail them to you. that\'s why they need your address',
          'C>1|They do not mail you cookies.',
          'B>2|then why do they need my address',
          'D>3|he\'s got a point',
          'C>4|He has never once had a point.',
        ] },
      ],
    },
    {
      title: 'always has been', slug: 'always-has-been-comments', kind: 'scene',
      scene: { bg: 'radial-gradient(circle at 30% 70%, #3a7bd5 0 18%, #1f4f8f 19% 21%, transparent 22%), radial-gradient(#ffffff 0 1px, transparent 2px) 0 0 / 24px 24px, #050a1f', items: [
        { e: '🌍', x: 30, y: 72, s: 30 },
        { e: '🧑‍🚀', x: 58, y: 40, s: 15, label: 'Wait, the whole internet is just people arguing in the comments?', lx: 34, ly: 13, w: 52 },
        { e: '🔫', x: 74, y: 35, s: 8 },
        { e: '🧑‍🚀', x: 84, y: 32, s: 15, label: 'Always has been', lx: 82, ly: 62, w: 30 },
      ] },
      keys: ['astronaut', 'always', 'internet', 'arguing', 'comment'],
      low: [
        'reg|always has been',
        'smart|Even the first websites had a guestbook. It was a comment section with better manners.',
        'story|the first thing I ever wrote online was "first". I was not first.',
        'lurker|🌍🧑‍🚀🔫🧑‍🚀',
      ],
      mid: [
        'troll|wait it\'s all comments? always has been. wait it\'s all ratio? always has been',
        'pedant|You couldn\'t hold that in a pressurized glove. The second astronaut is lying.',
        'confused|which astronaut am I',
        'defensive|I\'m not arguing, I\'m discussing. Loudly.',
      ],
      high: [
        'drama|IT WAS COMMENTS ALL ALONG',
        'wrong|the moon landing was a comment section',
        'troll|the earth is flat and this meme is round',
        'serious|I have sent this to a space agency. They have not replied. Which is a reply.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'confused', B: 'smart', C: 'troll', D: 'story' }, steps: [
          'A|why is the second astronaut so mad',
          'B>0|He found out first and had to keep it secret for years.',
          'C>1|he\'s been in the comments since 1997. look at him. he\'s seen things',
          'D>2|my dad has that exact look when the router blinks orange',
        ] },
      ],
    },
    {
      title: 'this is fine', slug: 'this-is-fine-stability', kind: 'scene',
      scene: { bg: 'linear-gradient(#ffb347, #ff7b2e 55%, #a53b12)', top: 'CHAOS 98% · STABILITY 3%', bottom: 'this is fine.', items: [
        { e: '🔥', x: 12, y: 30, s: 16 }, { e: '🔥', x: 88, y: 28, s: 18 }, { e: '🔥', x: 75, y: 70, s: 14 },
        { e: '🔥', x: 18, y: 76, s: 13 }, { e: '🔥', x: 50, y: 22, s: 10 },
        { e: '🐶', x: 47, y: 58, s: 24 }, { e: '☕', x: 64, y: 66, s: 10 },
      ] },
      keys: ['fine', 'fire', 'dog', 'chaos', 'stability', 'meltdown'],
      low: [
        'reg|me watching the Stability bar',
        'smart|The dog is fine because the dog doesn\'t own the servers.',
        'story|my first website caught fire too. not literally. well. once literally.',
        'lurker|this is fine',
      ],
      mid: [
        'troll|it\'s only a meltdown if you look at it',
        'pedant|At 3% Stability it\'s "this is almost fine". Precision matters.',
        'defensive|I keep Chaos high on PURPOSE. It\'s called strategy.',
        'confused|is the dog ok? someone check on the dog',
      ],
      high: [
        'drama|THE DOG IS NOT FINE. NOBODY IS FINE',
        'troll|buy more servers? nah. coffee',
        'wrong|fire is good for servers. it warms them up',
        'serious|I called the fire department. They asked if I\'d tried turning it off and on again.',
      ],
      threads: [
        { tier: 'high', cast: { A: 'serious', B: 'troll', C: 'smart', D: 'drama' }, steps: [
          'A|Genuine question: what is the dog\'s Tolerance?',
          'B>0|infinite. he is the Tolerance',
          'C>0|Probably low. That\'s why he\'s drinking coffee instead of buying servers.',
          'D>2|HE CAN\'T AFFORD SERVERS. HE\'S A DOG',
          'B>3|skill issue',
        ] },
      ],
    },
    {
      title: 'is this engagement?', slug: 'is-this-engagement', kind: 'scene',
      scene: { bg: 'linear-gradient(#f6e7c1, #e7cf98)', bottom: 'IS THIS ENGAGEMENT?', items: [
        { e: '🧑', x: 26, y: 52, s: 28, label: 'ME', lx: 26, ly: 14 },
        { e: '👉', x: 48, y: 46, s: 11 },
        { e: '🦋', x: 75, y: 34, s: 14, label: 'A BOT SAYING "GREAT POST!"', lx: 74, ly: 60, w: 40 },
      ] },
      keys: ['pigeon', 'butterfly', 'engagement', 'bot', 'bots'],
      low: [
        'reg|yes. yes it is',
        'smart|Technically it counts. Morally, it does not.',
        'lurker|great post! (I am a real person)',
        'story|my most liked post was liked by 400 accounts named "user8812". I\'m still proud',
      ],
      mid: [
        'troll|engagement is engagement. the butterfly counts',
        'pedant|It\'s not a pigeon and it\'s not engagement. Two wrongs.',
        'defensive|My followers are real. Some of them are just very consistent.',
        'confused|is the butterfly a bot? am I the butterfly?',
      ],
      high: [
        'drama|EVERY COMMENT I\'VE EVER GOTTEN WAS A BUTTERFLY',
        'wrong|bots are just butterflies that learned to type',
        'troll|Great post! I am a butterfly who loves posts! 🦋',
        'serious|I reported the butterfly. The butterfly reported me back.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'pedant', B: 'confused', C: 'troll' }, steps: [
          'A|For the record, the original is "Is this a pigeon?" and it isn\'t one.',
          'B>0|so what is it',
          'A>1|A butterfly.',
          'C>2|so the bot is a butterfly that thinks it\'s a pigeon that thinks it\'s engagement',
          'B>3|I need to lie down',
        ] },
      ],
    },
    {
      title: 'the plan', slug: 'gru-read-the-comments', kind: 'gru',
      rows: [['😀', 'Make a website'], ['😃', 'Get millions of visitors'], ['😄', 'Read the comments'], ['😐', 'Read the comments']],
      keys: ['plan', 'gru', 'comments', 'visitors'],
      low: [
        'reg|panel 4 got me',
        'smart|The plan was flawless until it met the users.',
        'story|I read the comments on my first post. I closed the laptop for a week.',
        'lurker|never read the comments (I am in the comments)',
      ],
      mid: [
        'troll|step 5: become the comments',
        'pedant|Panel four is identical to panel three. That\'s the joke. I get it. I\'m explaining it anyway.',
        'defensive|The comments on MY site are lovely, thank you.',
        'confused|why is he sad in the last one. what did the comments say',
      ],
      high: [
        'drama|I READ THE COMMENTS AND NOW I LIVE IN THEM',
        'troll|step 4: ratio',
        'wrong|this guy invented the internet. it\'s in the movie',
        'serious|Panel four is my autobiography.',
      ],
      threads: [
        { tier: 'low', cast: { A: 'confused', B: 'reg', C: 'smart' }, steps: [
          'A|what did the comments say though',
          'B>0|we\'re the comments',
          'A>1|oh no',
          'C>2|Oh yes.',
        ] },
      ],
    },
    {
      title: 'change my mind', slug: 'change-my-mind-hit-counter', kind: 'scene',
      scene: { bg: 'linear-gradient(#9fd18b, #6aa85b 60%, #4b7f40)', bottom: 'CHANGE MY MIND', items: [
        { e: '🧔', x: 28, y: 46, s: 24 }, { e: '☕', x: 38, y: 64, s: 9 },
        { e: '', x: 66, y: 52, s: 1, sign: 'Every website was better with a hit counter' },
      ] },
      keys: ['counter', 'change', 'mind', 'website'],
      low: [
        'reg|can\'t. you\'re right',
        'smart|A hit counter was the only analytics that ever made you feel good.',
        'story|my counter said 00004 for a year. three of them were me',
        'lurker|visitor #0000071 checking in',
      ],
      mid: [
        'troll|change my mind: hit counters were lying to you',
        'pedant|Hits are not visits. "Hit counter" was a misnomer from day one.',
        'defensive|I still have one. It\'s at 13. It\'s honest work.',
        'confused|what\'s a hit counter. is it like likes?',
      ],
      high: [
        'drama|BRING BACK THE HIT COUNTER. BRING BACK THE GUESTBOOK. BRING BACK MY 2003',
        'wrong|hit counters counted how many times you hit the computer',
        'troll|my mind has been changed. into a hit counter',
        'serious|I\'ve set up a table in the town square. Nobody has changed my mind. Two people have changed my tire.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'troll', B: 'story', C: 'pedant', D: 'reg' }, steps: [
          'A|ok I\'ll change your mind: they were ugly',
          'B>0|they were beautiful. mine had flames. FLAMES',
          'C>1|The flames were a GIF. GIFs are not a counter feature.',
          'B>2|the flames were part of the experience',
          'D>3|mind not changed. flames won',
        ] },
      ],
    },
    {
      title: 'stonks', slug: 'stonks-404-ads', kind: 'scene',
      scene: { bg: 'linear-gradient(#0d1b3d, #1c3768)', top: 'SELLING AD SPACE ON THE 404 PAGE', bottom: 'STONKS', items: [
        { e: '🧑‍💼', x: 28, y: 55, s: 26 },
        { e: '📈', x: 70, y: 48, s: 30 },
      ] },
      keys: ['stonks', 'stocks', 'ad', 'ads', '404', 'money'],
      low: [
        'reg|genius, honestly',
        'smart|404 pages get more traffic than half the site. It\'s just math.',
        'story|I clicked a broken link and bought a vacuum. It\'s a great vacuum.',
        'lurker|stonks',
      ],
      mid: [
        'troll|next: ads on the error message for the ad',
        'pedant|It\'s "stocks". I know it\'s the joke. I have to say it.',
        'defensive|I put ads on my 404 page and I\'m not ashamed. I\'m rich. Slightly.',
        'confused|is this financial advice',
      ],
      high: [
        'drama|THE 404 PAGE MAKES MORE THAN I DO',
        'wrong|stonks are like stocks but for memes. you can buy them at the bank',
        'troll|not stonks: reading this meme. stonks: reposting it',
        'serious|I\'ve invested my savings in 404 pages. My advisor is a man named Stonks.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'confused', B: 'smart', C: 'troll' }, steps: [
          'A|is this financial advice',
          'B>0|No. Nothing on this site is financial advice. Especially the ads.',
          'C>1|it\'s financial advice if you believe in yourself',
          'A>2|ok I believe in myself. now what',
          'C>3|now you\'re the 404 page',
        ] },
      ],
    },
    {
      title: 'bots pointing at bots', slug: 'pointing-bots', kind: 'scene', eras: [5, 6, 7],
      scene: { bg: 'linear-gradient(#1b2b5a, #3b1d55)', bottom: 'THE COMMENT SECTION IN 2040', items: [
        { e: '🤖', x: 24, y: 48, s: 24, label: '"GREAT POST!"', lx: 24, ly: 16, w: 42 },
        { e: '👉', x: 41, y: 52, s: 11 },
        { e: '👈', x: 59, y: 52, s: 11 },
        { e: '🤖', x: 76, y: 48, s: 24, label: '"GREAT POST!"', lx: 76, ly: 16, w: 42 },
      ] },
      keys: ['bot', 'bots', 'pointing', 'great', 'post'],
      low: [
        'reg|great post! (I am human. probably)',
        'smart|At some point the bots will start replying to each other and we\'ll just watch. Oh wait.',
        'lurker|🤖👉👈🤖',
        'story|my aunt argued with a bot for an hour. she won. the bot thanked her for the great post',
      ],
      mid: [
        'troll|which one is the original. neither. both. great post!',
        'pedant|They\'re not pointing at each other, they\'re pointing at "the conversation". It\'s sadder.',
        'defensive|I\'m not a bot. I just type fast and agree with everything.',
        'confused|are we the bots? genuinely asking',
      ],
      high: [
        'drama|I HAVEN\'T TALKED TO A HUMAN IN THIS THREAD SINCE MONDAY',
        'wrong|the dead internet theory was started by a bot to drive engagement',
        'troll|Great post! I agree with this post! 🤖',
        'serious|I\'d like every human in this thread to reply "potato" so we can count. Bots: please don\'t.',
      ],
      threads: [
        { tier: 'high', cast: { A: 'serious', B: 'reg', C: 'troll', D: 'confused' }, steps: [
          'A|Roll call. Humans, reply "potato".',
          'B>0|potato',
          'C>0|Potato! Great post! 🙂',
          'D>2|that one\'s a bot',
          'C>3|Great observation! I am a real person!',
        ] },
      ],
    },
    {
      title: 'a post about opinions', slug: 'ai-opinions-post', kind: 'tweet', eras: [5, 6, 7],
      name: 'Helpful Assistant', handle: '@definitely_a_person', avatar: '🤖',
      text: 'As a language model, I don\'t have opinions.\n\nAnyway, here are 10 reasons stairs are overrated.',
      likes: '98K', reposts: '14K', replies: '2.1K',
      keys: ['opinion', 'opinions', 'model', 'stairs', 'reasons'],
      low: [
        'reg|reason 7 was surprisingly good',
        'smart|"I have no opinions" followed by ten opinions is the most human thing it has ever done.',
        'lurker|saving for reason 4',
        'story|my toaster said the same thing this morning',
      ],
      mid: [
        'troll|ratio\'d by a chatbot. couldn\'t be me. it\'s been me twice',
        'pedant|Ten reasons, but reason 6 is reason 2 again with different words.',
        'defensive|Stairs are fine. I don\'t care what a robot thinks. (Reason 3 was fair.)',
        'confused|wait is the stair guy from the forum a robot',
      ],
      high: [
        'drama|THE AI HAS OPINIONS ABOUT STAIRS AND THEY\'RE BETTER THAN MINE',
        'wrong|this was written by a real person pretending to be an AI pretending to be a person',
        'troll|stair_truther finally got a job',
        'serious|I\'ve asked the AI for its sources. It made up four.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'smart', B: 'wrong', C: 'pedant' }, steps: [
          'A|Fun fact: half of these reasons were in the forum thread about stairs.',
          'B>0|so the forum trained the AI',
          'C>1|The forum trained the AI to be wrong about stairs. Congratulations, everyone.',
          'B>2|thank you',
        ] },
      ],
    },
    {
      title: 'mom found the site', slug: 'mom-found-the-site', kind: 'texts',
      with: 'Mom ❤️',
      bubbles: [['them', 'Hi sweetie, I found your website!'], ['me', 'please don\'t comment'], ['them', 'I commented'],
        ['them', 'I commented 14 times'], ['them', 'Why is everybody yelling about soup']],
      keys: ['mom', 'mother', 'soup', 'comment', 'commented'],
      low: [
        'reg|moms are the best users honestly',
        'smart|Fourteen comments is just engagement with love.',
        'story|my mom signs every comment "love, Mom". on every site. even the weather site',
        'lurker|hi mom',
      ],
      mid: [
        'troll|which one of you is the mom. show yourself',
        'pedant|"Everybody" is fine, but she\'s right: nobody here can stop yelling about soup.',
        'defensive|My mom does NOT comment on my site. (She does. She\'s the top commenter.)',
        'confused|wait is soup the mom',
      ],
      high: [
        'drama|MY MOM FOUND MY WEBSITE AND NOW SHE MODERATES IT',
        'wrong|moms can see every website. that\'s how the internet started',
        'troll|mom is the most based user on this site',
        'serious|I\'d like to thank the mom for 14 thoughtful comments. Please bring snacks next time.',
      ],
      threads: [
        { tier: 'low', cast: { A: 'reg', B: 'story', C: 'troll' }, steps: [
          'A|ok who here is the mom. we just want to talk',
          'B>0|it\'s me. I\'m the mom. I came for the blog and stayed for the soup',
          'C>1|mom please the soup thread is a war zone',
          'B>2|then I will bring soup to the war zone',
        ] },
      ],
    },
    {
      title: 'when someone picks up the phone', slug: 'dial-up-phone', kind: 'classic', eras: [1, 2],
      emoji: '☎️', bg: '#3a6b35',
      top: 'WHEN SOMEONE PICKS UP THE PHONE', bottom: 'WHILE YOU\'RE DOWNLOADING ONE (1) JPEG',
      keys: ['phone', 'dial', 'jpeg', 'download', 'modem'],
      low: [
        'reg|the screech of the modem lives in my head rent free',
        'story|my mom picked up the phone during my 6-hour download. I still haven\'t recovered',
        'smart|A whole generation learned patience from progress bars.',
        'lurker|*modem noises*',
      ],
      mid: [
        'troll|imagine not having a second phone line. peasants',
        'pedant|A JPEG of that size would take about four minutes. The panic was justified.',
        'defensive|I still use dial-up and I\'m doing great, thanks.',
        'confused|why would the phone stop the internet',
      ],
      high: [
        'drama|IT WAS 97% DONE. NINETY. SEVEN.',
        'wrong|dial-up was faster than fiber, it just had more steps',
        'troll|me picking up the phone on purpose',
        'serious|I\'d like to formally apologize to my brother for 1999.',
      ],
      threads: [
        { tier: 'mid', cast: { A: 'confused', B: 'smart', C: 'story' }, steps: [
          'A|wait why would the phone stop the internet',
          'B>0|The internet came through the phone line. Picking up the phone cut it off.',
          'A>1|the internet was IN THE PHONE?',
          'C>2|yes and grandma was in the internet. it was a different time',
        ] },
      ],
    },
    {
      title: 'we\'ve updated our privacy policy', slug: 'privacy-policy-update', kind: 'classic', eras: [6, 7],
      emoji: '📜', bg: '#4b5563',
      top: 'WE\'VE UPDATED OUR PRIVACY POLICY', bottom: 'NOBODY READ THE OLD ONE EITHER',
      keys: ['privacy', 'policy', 'terms', 'updated'],
      low: [
        'reg|accept. scroll. accept. scroll',
        'smart|The new policy is the old policy with a longer list of partners.',
        'story|I read one once. It was 40 pages. Page 31 said I owe them a goat.',
        'lurker|I agree to the terms',
      ],
      mid: [
        'troll|the policy says they own this comment now. hi lawyers',
        'pedant|You agreed to the old one by "continuing to use the site". Check paragraph 9.',
        'defensive|I read every privacy policy. I don\'t have friends but I have rights.',
        'confused|what did they change? is it the goat thing',
      ],
      high: [
        'drama|I ACCEPTED THE POLICY AND NOW THEY KNOW MY DREAMS',
        'wrong|privacy policies are legally poems',
        'troll|updated: we sell your data. previous: we sold your data',
        'serious|I\'ve printed the new policy. It\'s taller than me.',
      ],
      threads: [
        { tier: 'high', cast: { A: 'serious', B: 'troll', C: 'pedant', D: 'drama' }, steps: [
          'A|I have read the entire updated policy. I have concerns.',
          'B>0|name one',
          'A>1|Section 14 lists "your soul" under "optional data".',
          'C>2|"Optional" means you can opt out. By mail. In 1987.',
          'D>3|I DON\'T HAVE A STAMP',
        ] },
      ],
    },
  ];

  /* The page itself: new memes rotate in faster than blog posts, and the regulars talk
     like the internet's favorite meme forums. */
  const page = Z.CHAT.PAGE.meme;
  page.topicSeconds = 150;
  page.topics = page.topics.concat(MEMES);
  page.low = page.low.concat([
    'reg|this is the way',
    'lurker|username checks out',
    'reg|take my upvote and leave',
    'reg|I came here to say this',
    'reg|why is this so accurate',
    'lurker|me_irl',
  ]);
  page.mid = page.mid.concat([
    'troll|instructions unclear, bought another server',
    'reg|happy cake day! (it isn\'t. I just like saying it)',
    'troll|nobody: / me: commenting "nobody:"',
    'smart|The best memes are three years late and somehow still on time.',
    'reg|ah yes, the internet, made of internet',
    'defensive|I laughed at this before it was posted. I\'m just faster.',
  ]);
  page.high = page.high.concat([
    'reg|task failed successfully',
    'wrong|this meme is older than the internet. I saw it on a cave wall',
    'troll|ratio + L + this meme is mine now',
    'story|I sent this to my boss by accident. I am now the boss.',
    'drama|THIS MEME FIXED MY WIFI',
    'confused|I\'ve looked at this for 10 minutes and I\'m laughing and I don\'t know why',
  ]);
})(window.ICHAOS = window.ICHAOS || {});
