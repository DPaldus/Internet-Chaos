/* Live Feed pages: what people say under the Blog Post, the Meme Page and in the Comment Section.
   Pure content. js/ui/chat.js decides who speaks, when, and how unhinged it gets.

   A line is 'personality|text'. Personalities:
     reg       an ordinary user          serious   takes a stupid topic very seriously
     confused  misunderstood everything  troll     starts fights on purpose
     story     replies with an absurd story          drama  overreacts to nothing
     smart     a surprisingly good point defensive aggressively defends themselves
     offtopic  is in the wrong thread    pedant    corrects tiny details
     wrong     confidently wrong         lurker    mostly says "^ this"
     mod       a moderator               spam      a spam bot
   Placeholders: {site} website name · {@} the user being replied to · {u} someone else in the
   thread · {n} a small number · {N} a big number · {trend} the trending building.

   Tiers follow the Chaos meter: low (calm), mid (heated), high (unhinged).
   Threads are short scripted exchanges. Cast letters keep one user per letter, and
   'B>0|text' means speaker B replies to step 0 of the same thread. */
(function (Z) {
  'use strict';

  const USERS = [
    'CerealKiller_99', 'gary_from_accounting', 'xX_Lukewarm_Xx', 'spoon_enthusiast', 'TheRealDave', 'not_a_duck',
    'BreadDad', 'ok_but_why', 'HonestlyKaren', 'Mothman_Mike', 'QuietLurker42', 'umbrella_hater', 'throwaway_8812',
    'PotatoTrustFund', 'SirCommentsALot', 'grandmas_wifi', 'NoContextNina', 'CaptainHotTake', 'lowercase_lena',
    'DuckHistorian', 'stair_truther', 'Jennifer_34_LovesLife', 'miss_understanding', 'actually_a_doctor_jk',
    'xXDarkLordXx', 'pixel_pete', 'RageQuitRachel', 'MildlyFurious', 'tinfoil_tony', 'SoupScholar', 'WiFi_Whisperer',
    'DangerNoodle', 'the_one_with_opinions', 'HeyItsBarb', 'CouchPhilosopher', 'literal_gremlin', 'sleepy_moth',
    'BobBobBob', 'DefinitelyNotABot', 'PedantPaul', 'NotYourUncle', 'TheGooseIsLoose', 'Overreactor3000', 'calm_carl',
    'ShrimpLord', 'BigSpoonEnergy', 'toast_with_feelings', 'kevin_from_upstairs', 'RecipeHunter', 'marsha_in_HR',
    'dial_up_dan', 'HamsterOnTheWheel', 'zero_chill', 'sir_reads_a_lot', 'TypingAngrily', 'HatPotatoFan',
    'BirdLawExpert', 'averagecheeseenjoyer', 'Oatmeal_Overlord', 'screaming_into_void', 'PleaseBeKind',
    'NumberOneChairFan', 'GeraldsGhost', 'AnonymousCarrot', 'moist_gremlin_hours', 'Linda_from_book_club',
    'two_raccoons_in_a_coat', 'fern_mom', 'ThatGuyWithTheVan', 'bean_counter_bea', 'ProfessionalNapper',
  ];

  /* Usernames that suit a personality get picked for it more often. */
  const AFFINITY = {
    pedant: ['PedantPaul', 'sir_reads_a_lot', 'BirdLawExpert', 'bean_counter_bea'],
    troll: ['CaptainHotTake', 'xXDarkLordXx', 'zero_chill', 'literal_gremlin', 'moist_gremlin_hours'],
    drama: ['Overreactor3000', 'RageQuitRachel', 'screaming_into_void', 'MildlyFurious'],
    serious: ['SoupScholar', 'CouchPhilosopher', 'DuckHistorian', 'marsha_in_HR'],
    wrong: ['tinfoil_tony', 'actually_a_doctor_jk', 'ThatGuyWithTheVan'],
    defensive: ['TypingAngrily', 'HonestlyKaren', 'the_one_with_opinions'],
    confused: ['miss_understanding', 'ok_but_why', 'sleepy_moth', 'grandmas_wifi'],
    smart: ['calm_carl', 'pixel_pete', 'fern_mom'],
    lurker: ['QuietLurker42', 'throwaway_8812', 'ProfessionalNapper'],
    story: ['NotYourUncle', 'kevin_from_upstairs', 'two_raccoons_in_a_coat', 'Linda_from_book_club'],
  };

  const MODS = ['ModeratorMarge', 'AutoMod', 'tns_trevor', 'night_shift_mod'];
  const SPAMMERS = ['FREE_PREMIUM_4U', 'crypto_king_99999', 'Sergeant_Gold_Ship', 'HotCarrots_Official', 'win_big_now_7'];

  /* ---------- Pages ---------- */

  const blog = {
    id: 'blog', name: 'Blog Post', icon: '📝', path: 'blog',
    blurb: 'Reactions to the latest article',
    low: [
      'reg|Good read. Bookmarked it and will absolutely never open it again.',
      'serious|I appreciate that {site} still writes full paragraphs. Most sites just post a picture of a paragraph.',
      'smart|The interesting part isn\'t the conclusion, it\'s that the author clearly changed their mind halfway through and kept typing anyway.',
      'story|My uncle tried something like this in 1997. He\'s fine. He lives on a boat now, but he\'s fine.',
      'confused|Is this the recipe blog? I\'m on step 4 and there\'s no oven in this article',
      'reg|came for the headline, stayed because I\'m on the bus and my phone is at 9%',
      'pedant|Small thing, but paragraph three says "irregardless". Otherwise great.',
      'offtopic|Does anyone know if the bakery on 5th still does the cinnamon thing on Tuesdays',
      'reg|the comments under these posts are always nicer than I expect. don\'t ruin it, anybody',
      'serious|Printed this out to read later. Out of respect.',
      'lurker|first comment in 6 years of reading. keep going {site}',
    ],
    mid: [
      'troll|Imagine writing 2,000 words about this. Couldn\'t be me. (I read all of them.)',
      'defensive|Before anyone replies: yes I read the whole thing, no I won\'t be taking questions.',
      'wrong|This is basically what Einstein said. Look it up. Not right now though.',
      'drama|I genuinely had to put my phone down after the second paragraph. I need a minute.',
      'pedant|The article says "a couple" and then lists three. Three is "a few". We have words for this.',
      'confused|so is the author for it or against it, I read it twice and I think it changed',
      'smart|Everyone in here is arguing about the headline. The article itself says something completely different.',
      'troll|ratio\'d by the author\'s own conclusion. incredible stuff',
      'story|this happened to my cousin except replace everything in the article with a goat. long story',
      'offtopic|unrelated but the font on this site makes everything sound sarcastic',
      'serious|I have shared this with my HOA. There will be a meeting.',
    ],
    high: [
      'drama|THIS ARTICLE RUINED MY THANKSGIVING AND IT\'S NOT EVEN NOVEMBER',
      'wrong|The author is clearly a bot. I can tell because I am also a bot. Wait',
      'troll|didn\'t read it but I disagree with every word, in order',
      'defensive|I am not "arguing in bad faith". I\'m arguing in a GOOD faith you have never experienced',
      'confused|why is everyone yelling. what happened. I just got here and I\'m already mad',
      'story|I have read this article 41 times. My wife has left. The article stayed.',
      'pedant|You cannot be "literally shaking" and type in full sentences. Pick one.',
      'serious|I am forming a committee. We meet in the replies. Bring snacks and grievances.',
      'offtopic|has anyone seen my cat he is orange and has opinions',
      'smart|Fun fact: most of this comment section is replying to comments that got deleted. We\'re arguing with ghosts.',
      'drama|{site} has gone too far this time. I\'m unsubscribing and then resubscribing to keep an eye on things.',
    ],
    threads: [
      { tier: 'low', cast: { A: 'smart', B: 'troll', C: 'defensive', D: 'reg' }, steps: [
        'A|Genuine question: did anyone in this comment section read past the headline?',
        'B>0|no and I\'m not starting now',
        'C>0|I read it. Well. The first paragraph and the last word.',
        'D>2|so the same as everyone else but with confidence',
      ] },
      { tier: 'high', cast: { A: 'drama', B: 'pedant', C: 'troll', D: 'serious' }, steps: [
        'A|I\'m reporting this article to the internet',
        'B>0|The internet doesn\'t have a report button. You\'d be reporting it to {site}. Who wrote it.',
        'C>1|so he\'s reporting {site} to {site}. love that for him',
        'A>2|IT\'S CALLED ACCOUNTABILITY',
        'D>3|I\'ll second the report. On the record. Whatever the record is.',
      ] },
    ],
    topics: [
      {
        title: 'I Drank Only Room-Temperature Water for 30 Days. Here\'s What Happened.',
        slug: 'room-temperature-water-30-days', read: 6,
        body: 'Day one was fine. On day nine I started describing things as "lukewarm" without being asked. By day thirty I had become, in a word, ambient.',
        low: [
          'reg|I already do this by accident because I forget my glass on the desk',
          'serious|Did you control for altitude? Room temperature in Denver is a different beast.',
          'story|My grandma has drunk room-temperature water her whole life. She is 94 and has never once been in a hurry.',
          'smart|honestly the real finding here is "drinking more water helps". the temperature is a fun wrapper',
        ],
        mid: [
          'drama|Cold water people are going to see this and riot. I\'m so ready.',
          'wrong|Room temperature is 50 degrees. Everyone knows this. It\'s in the name.',
          'pedant|Whose room? Rooms vary. This is unscientific at its core.',
          'troll|ice cubes are just water with commitment. you wouldn\'t understand',
        ],
        high: [
          'drama|I TRIED THIS FOR ONE DAY AND I CAN NOW HEAR COLORS',
          'wrong|If you drink water at room temperature the water becomes YOU temperature. That\'s how fevers start.',
          'troll|the cold water lobby has entered the chat. we have funding',
          'serious|I formally challenge the author to a duel. Weapons: two glasses. Temperature: chosen by the crowd.',
        ],
        threads: [
          { tier: 'low', cast: { A: 'serious', B: 'reg', C: 'pedant' }, steps: [
            'A|Day 30 results? Any change in sleep, mood, or general vibe?',
            'B>0|vibe went from "chilled" to "room temp". so a sideways move',
            'C>1|Technically "chilled" would have been before the experiment, not during.',
            'B>2|I mean I\'m going to bed',
          ] },
          { tier: 'high', cast: { A: 'wrong', B: 'smart', C: 'drama', D: 'troll' }, steps: [
            'A|fun fact, warm water has more water in it. it expands. more water per sip',
            'B>0|That\'s not how that works. Same amount of water, it just takes up a tiny bit more space.',
            'A>1|So you admit it takes up more space. Thank you.',
            'D>2|he\'s right tho. I pour hot water and my glass is fuller. checkmate',
            'C>0|I\'ve been drinking cold water like a FOOL for 30 years',
            'B>4|Please do not change anything in your life based on this thread.',
          ] },
        ],
      },
      {
        title: 'Ranking Every Chair in Our Office From Worst to Slightly Less Worst',
        slug: 'office-chairs-ranked', read: 9,
        body: 'Number 7 squeaks in a minor key. Number 4 has a ghost. Number 1 is a beanbag that our lawyers have asked us to stop discussing.',
        low: [
          'reg|number 4 having a ghost is the best thing I\'ve read all week',
          'serious|As someone who has sat in office chairs professionally for 22 years, the lumbar analysis here is spot on.',
          'story|We had a chair at my old job that slowly sank if you lied in it. Management got rid of it within a month.',
          'confused|is this sponsored? where do I buy number 3',
        ],
        mid: [
          'defensive|Number 7 is MY chair at home and it is not "in a minor key", it is in a mature key.',
          'pedant|A beanbag is not a chair. It is a sack with ambitions.',
          'troll|ranking chairs is easy. standing is #1. you\'re welcome',
          'smart|You can tell exactly who wrote this by which chair is ranked first. Accountability, people.',
        ],
        high: [
          'drama|I sat in chair #2 once and I have not been the same since. Who do I sue.',
          'wrong|chairs were invented in 1974 by IKEA so ranking anything older is fake',
          'pedant|The thing in chair #4 is a poltergeist, not a ghost. If you\'re going to rank spirits, get it right.',
          'serious|I have contacted the ghost. It disputes its ranking.',
        ],
        threads: [
          { tier: 'mid', cast: { A: 'defensive', B: 'troll', C: 'smart' }, steps: [
            'A|Why is the mesh chair so low?? It\'s literally the best design there is',
            'B>0|says the guy whose back makes a noise like bubble wrap',
            'A>1|My back sounds fine. That noise is a feature.',
            'C>0|Mesh is great for airflow and terrible if you sit cross-legged. Whoever ranked this sits cross-legged.',
            'A>3|ok that\'s actually fair. still mad though',
          ] },
          { tier: 'high', cast: { A: 'serious', B: 'confused', C: 'drama', D: 'pedant' }, steps: [
            'A|Petition to rename chair #4 to Gerald now that we know it\'s haunted',
            'B>0|wait who is Gerald, is he the author',
            'C>0|GERALD DESERVED BETTER THAN #4',
            'D>2|We don\'t know the ghost\'s name. You have all just decided it\'s Gerald.',
            'A>3|He told me. In a dream. While I was sitting in him.',
            'B>4|ok I\'m lost but I\'m on Team Gerald',
          ] },
        ],
      },
      {
        title: 'Why I Stopped Using Umbrellas (And You Should Too)',
        slug: 'why-i-quit-umbrellas', read: 4,
        body: 'An umbrella is a tiny roof you have to hold. I refuse to hold a roof. Since March I have simply been wet, and I have never felt more free.',
        low: [
          'reg|"I refuse to hold a roof" is going on my gravestone',
          'story|I lost 11 umbrellas last year. One of them I lost twice. I respect this choice.',
          'smart|A hood and a decent jacket beat an umbrella in wind every time. The rest is vibes.',
          'confused|so what do you use when it rains',
        ],
        mid: [
          'drama|My umbrella has been through more with me than any human. Delete this.',
          'wrong|umbrellas actually attract rain. it\'s like a magnet but for clouds',
          'defensive|I use an umbrella AND I am free. You can be free and dry. Read a book.',
          'troll|imagine being scared of water. you\'re 60% water. coward behavior',
        ],
        high: [
          'drama|BIG UMBRELLA DOESN\'T WANT YOU TO SEE THIS ARTICLE',
          'serious|I have been standing in the rain since I read this. Hour three. I feel nothing. Is this freedom?',
          'wrong|Umbrellas were banned in Europe in 2019 for exactly this reason. It was in the European newspaper.',
          'story|I threw my umbrella into the sea after reading this and the sea threw it back. We are not done talking.',
        ],
        threads: [
          { tier: 'low', cast: { A: 'confused', B: 'reg', C: 'smart' }, steps: [
            'A|so what do you actually do when it rains',
            'B>0|you get wet. that\'s the whole article',
            'A>1|oh I thought there was a trick',
            'C>2|the trick is accepting it',
          ] },
          { tier: 'high', cast: { A: 'troll', B: 'defensive', C: 'pedant', D: 'story' }, steps: [
            'A|umbrella users when a light breeze shows up: 🌂➡️🙃',
            'B>0|I have NEVER lost an umbrella to wind. Not once. Not even the time in Scotland.',
            'C>1|"Not even the time" implies there was a time.',
            'B>2|There was a time but it wasn\'t LOST, it LEFT.',
            'D>3|mine left too. it lives with a family in Belgium now. they seem happy',
            'A>4|this is the most normal thing anyone has said in here',
          ] },
        ],
      },
    ],
  };

  const meme = {
    id: 'meme', name: 'Meme Page', icon: '🖼️', path: 'memes',
    blurb: 'Jokes, reposts and people trying to be funnier',
    low: [
      'reg|this is literally me',
      'reg|sent this to the group chat and nobody laughed so I\'m laughing here instead',
      'story|showed this to my dad, he said "I don\'t get it" and then laughed out loud 20 minutes later at dinner',
      'lurker|saving this for when I need it',
      'smart|the format is old but the timing of the bottom text is genuinely great',
      'confused|is this a reference to something? I feel like I\'m missing a reference',
      'reg|lmao',
      'offtopic|anyone else\'s phone at 4% right now or just me',
      'serious|This meme accurately represents my lived experience and I\'m a little uncomfortable about it.',
      'reg|top tier. no notes',
    ],
    mid: [
      'troll|this was funny in 2014 when I made it',
      'pedant|The font isn\'t Impact, it\'s an Impact knockoff. You can tell by the S.',
      'story|this happened to me except I caused it and the fire department was involved',
      'drama|I laughed so hard I accidentally liked my ex\'s photo from 2016. I\'m moving countries.',
      'wrong|this meme is from the movie Shrek',
      'reg|whoever made this: get some sleep. respectfully',
      'troll|reposting this as my own on 4 other sites. thanks {site}',
      'defensive|It\'s not stolen if I add a different caption. That\'s called art.',
      'confused|wait which one is me',
      'smart|Meme lifecycle: funny, overused, ironic, post-ironic, funny again. This one is at stage five.',
    ],
    high: [
      'drama|THIS MEME HAS MORE PERSONALITY THAN MY ENTIRE FAMILY',
      'troll|unfunny. laughed for 11 minutes but unfunny',
      'wrong|this is actually a historical photograph',
      'story|I got this meme tattooed on my back. Mirrored. I can only read it in mirrors, which is fine, that\'s where I spend most of my time',
      'confused|is this the comment section or the meme page I have 40 tabs open and they\'re all screaming',
      'pedant|Nobody has noticed the bottom text is one pixel off-center and frankly I can\'t enjoy anything until that\'s fixed',
      'serious|I\'m calling my representative about this meme. Not for any reason. I just want them to see it.',
      'defensive|why are you all laughing at him. he is doing his best',
      'offtopic|reminder to drink water (room temperature)',
      'drama|I printed this meme and hung it in the living room. My landlord has been informed.',
    ],
    threads: [
      { tier: 'mid', cast: { A: 'troll', B: 'serious', C: 'confused', D: 'drama' }, steps: [
        'A|reposted from my cousin\'s account in 2017',
        'B>0|Do you have proof? Screenshots with timestamps, please.',
        'A>1|my cousin is the proof',
        'C>2|is your cousin the one in the meme',
        'D>3|IS THE COUSIN IN THE MEME',
      ] },
      { tier: 'high', cast: { A: 'reg', B: 'troll', C: 'pedant', D: 'drama', E: 'smart' }, steps: [
        'A|ok who can make this meme worse. I\'ll start: TOP TEXT',
        'B>0|bottom text',
        'C>1|You\'ve both forgotten the middle text. Every meme has middle text. It\'s implied.',
        'D>2|THE MIDDLE TEXT WAS INSIDE US ALL ALONG',
        'E>3|this is genuinely how every meme format dies and I\'m honored to be here for it',
      ] },
    ],
    topics: [
      {
        title: 'when the wifi drops for one second', slug: 'wifi-cat', emoji: '🐈', bg: '#2f6db5',
        top: 'WHEN THE WIFI DROPS FOR ONE SECOND', bottom: 'AND YOU FORGET WHO YOU ARE',
        low: [
          'reg|the cat\'s face is exactly how I look when the loading circle shows up',
          'story|my router is in the kitchen so every time the microwave runs I lose my wifi AND my sense of self',
          'smart|it works because cats already look like they lost the plot',
          'confused|why is the cat sad. is it his wifi',
        ],
        mid: [
          'pedant|Cats don\'t use wifi. They\'re on ethernet. Everyone knows this.',
          'troll|I have 5G. couldn\'t relate',
          'drama|my wifi dropped WHILE I was looking at this. I felt seen and attacked.',
          'wrong|the cat is actually a famous cat from tv, it\'s Garfield',
        ],
        high: [
          'drama|THE CAT KNOWS. LOOK AT HIS EYES. HE KNOWS ABOUT THE ROUTER',
          'troll|the wifi didn\'t drop, the cat unplugged it. justice for the router',
          'wrong|wifi means "wireless fidelity". it\'s supposed to be loyal. if it drops that\'s on YOU',
          'serious|I\'m starting a support group for the cat. Tuesdays. Wired connection only.',
        ],
        threads: [
          { tier: 'mid', cast: { A: 'wrong', B: 'pedant', C: 'reg' }, steps: [
            'A|wifi stands for wireless fidelity btw. fun fact',
            'B>0|It doesn\'t stand for anything. It was a marketing name.',
            'A>1|Then why does it have letters',
            'C>2|he\'s got you there',
          ] },
          { tier: 'high', cast: { A: 'drama', B: 'troll', C: 'serious', D: 'confused' }, steps: [
            'A|whoever let the cat near the router needs to be STOPPED',
            'B>0|the cat is innocent. the router had it coming',
            'C>1|Every router has it coming. That is the nature of routers.',
            'D>2|are we still talking about the meme or is this real life now',
            'A>3|IT WAS ALWAYS REAL LIFE',
          ] },
        ],
      },
      {
        title: 'me at 3 am', slug: 'medieval-ducks', emoji: '🦆', bg: '#6b3fa0',
        top: 'ME: I\'LL GO TO BED EARLY TONIGHT', bottom: 'ALSO ME AT 3 AM: READING ABOUT MEDIEVAL DUCKS',
        low: [
          'reg|the medieval ducks part is way too specific. who hurt you',
          'story|I once stayed up until 4am learning how lighthouses work. I have never needed this information.',
          'smart|you never choose the 3am topic. the 3am topic chooses you',
          'confused|were there ducks in medieval times? asking for 3am reasons',
        ],
        mid: [
          'pedant|Medieval ducks were just ducks. Ducks haven\'t changed. That\'s what makes them ducks.',
          'troll|imagine sleeping. couldn\'t be me (it\'s 3am, help)',
          'wrong|ducks were invented by the romans to guard bridges',
          'defensive|medieval ducks are a completely normal interest and I\'m tired of pretending otherwise',
        ],
        high: [
          'drama|IT\'S 3AM AND I KNOW TOO MUCH ABOUT DUCKS NOW. THE DUCKS KNOW TOO MUCH ABOUT ME',
          'wrong|in medieval times the king WAS a duck. that\'s why castles had moats',
          'serious|I have written a 40-page document on medieval ducks since this was posted. Who wants it.',
          'troll|ducks aren\'t real. wake up. (then go back to bed)',
        ],
        threads: [
          { tier: 'low', cast: { A: 'confused', B: 'smart', C: 'story' }, steps: [
            'A|wait were there actual medieval ducks or is that the joke',
            'B>0|there were. ducks are way older than anything medieval',
            'C>1|there\'s a painting from the 1400s of a duck that looks extremely disappointed in the painter. look it up at 3am',
            'A>2|it is 3am. I\'m looking.',
          ] },
          { tier: 'high', cast: { A: 'wrong', B: 'pedant', C: 'defensive', D: 'troll' }, steps: [
            'A|ducks were the original mail service. that\'s why they say "quack" (quick)',
            'B>0|That is not an etymology. That is two words that look similar.',
            'C>1|let him have this. it\'s 3am for everybody',
            'D>0|correct. pigeons replaced ducks after the great duck strike of 1302',
            'B>3|Please stop teaching people history at 3 in the morning.',
            'A>4|history is best at 3am. that\'s when it happened',
          ] },
        ],
      },
      {
        title: 'potato with a tiny hat', slug: 'hat-potato', emoji: '🥔', hat: '🎩', bg: '#a8682a',
        top: 'POTATO WITH A TINY HAT', bottom: 'IMMEDIATELY 40% MORE TRUSTWORTHY',
        low: [
          'reg|I would let this potato do my taxes',
          'story|we put a hat on our dog for one photo and now he\'s basically the mayor of our street. it works',
          'smart|it\'s the hat-to-potato ratio. a big hat would look suspicious',
          'confused|is it a real potato or a drawing',
        ],
        mid: [
          'troll|potato is clearly a scammer. the hat is a disguise',
          'pedant|That isn\'t a hat, it\'s a bottle cap. The potato is misrepresenting itself.',
          'defensive|Not everyone in a small hat is hiding something, ok. Some of us just like small hats.',
          'wrong|potatoes can\'t wear hats, they don\'t have heads. that\'s a tomato',
        ],
        high: [
          'drama|I WOULD DIE FOR THIS POTATO. I WOULD NOT DIE FOR MOST PEOPLE',
          'serious|Potato for president. I\'ve drafted the platform. It\'s mostly soup.',
          'wrong|this potato is a famous actor in disguise. look at the jawline',
          'troll|the potato is a fed',
        ],
        threads: [
          { tier: 'mid', cast: { A: 'serious', B: 'troll', C: 'smart', D: 'reg' }, steps: [
            'A|Genuinely asking: would you trust the potato with your house keys?',
            'B>0|no. that\'s exactly what he wants',
            'C>0|I\'d trust him with the keys but not the wifi password',
            'D>2|this is the most reasonable security policy I\'ve ever read',
          ] },
          { tier: 'high', cast: { A: 'drama', B: 'pedant', C: 'troll', D: 'serious' }, steps: [
            'A|if anything happens to this potato I\'m burning the internet down',
            'B>0|You can\'t burn the internet. It\'s mostly undersea cables.',
            'C>1|so it\'s a water internet. checks out',
            'D>0|I\'ve started a fund for the potato. We have raised $14 and one additional hat.',
            'A>3|PUT THE HAT ON HIM. PUT IT ON HIM NOW',
          ] },
        ],
      },
    ],
  };

  const comments = {
    id: 'comments', name: 'Comment Section', icon: '💬', path: 'forum',
    blurb: 'The most argumentative corner of the site',
    low: [
      'reg|Honestly both sides have a point and I\'m going to go make lunch',
      'serious|Before we start: please remember there are real people behind these usernames. Mostly.',
      'smart|Half of this disagreement is people defining the word differently. Define it first, then fight.',
      'reg|I come here every day to watch, not participate. Hi everyone.',
      'story|This exact debate ended my book club in 2019. Proceed with care.',
      'confused|what are we arguing about today',
      'pedant|Small correction to the top comment: it\'s "per se", not "per say".',
      'offtopic|the dark mode on this site is so good honestly',
      'lurker|been reading this thread since breakfast. no regrets',
      'reg|I\'ll allow it',
    ],
    mid: [
      'troll|everyone in here is wrong including me and that\'s why I\'m winning',
      'defensive|I didn\'t say you were wrong. I said you were incorrect. Huge difference.',
      'drama|I have never been so disrespected by a comment with 3 upvotes',
      'wrong|This was settled by the supreme court in 1888. Case closed. Google it.',
      'pedant|You\'ve used "literally" four times and not once literally.',
      'confused|wait are we on the same side? I can\'t tell anymore',
      'smart|The fun part is that you both agree. You\'ve been arguing about phrasing for 40 minutes.',
      'story|My neighbor and I stopped talking over this exact question. He moved. I won.',
      'troll|source: trust me',
      'serious|I\'ve made a spreadsheet of every argument in this thread. Column D is getting concerning.',
      'offtopic|is anyone else\'s cat staring at the wall right now. just checking',
      'defensive|I\'m not mad. I\'m typing fast because I\'m efficient.',
    ],
    high: [
      'drama|THIS IS WHY ALIENS DON\'T VISIT US',
      'troll|I\'m switching sides every comment until someone cries',
      'wrong|I\'m a doctor (not medical) and I can confirm I\'m right',
      'defensive|I\'M NOT YELLING, MY CAPS LOCK IS STUCK AND I\'M TOO ANGRY TO FIX IT',
      'confused|I\'ve been in this thread for 3 hours, I still don\'t know the topic, and I\'m VERY against it',
      'pedant|You can\'t "ratio" someone on a forum with no ratio feature. This is anarchy.',
      'story|this thread is why my grandfather left the internet in 2003 and he was right',
      'serious|I\'m calling for a ceasefire. Terms: everyone logs off for 10 minutes and drinks a glass of water.',
      'offtopic|ANYWAY does anyone have a good lasagna recipe',
      'drama|I\'m printing this thread and mailing it to my future children so they know what I went through',
      'smart|If you read the top-level comments in order, it\'s the five stages of grief. We\'re at bargaining.',
      'troll|mods are asleep. post opinions about soup',
    ],
    threads: [
      { tier: 'mid', cast: { A: 'pedant', B: 'defensive', C: 'troll' }, steps: [
        'A|"Your wrong." It\'s "you\'re".',
        'B>0|I know how to spell. I was typing fast because I was RIGHT.',
        'C>1|imagine being right and wrong in the same sentence',
        'B>2|EDIT: fixed it. Still right.',
        'A>3|You changed it to "youre". Now there\'s no apostrophe at all.',
        'C>4|this is the best thing that\'s happened to me today',
      ] },
      { tier: 'high', cast: { A: 'serious', B: 'troll', C: 'drama', D: 'confused', E: 'smart' }, steps: [
        'A|Proposal: we settle this with a poll.',
        'B>0|poll is rigged. I voted 40 times',
        'C>1|THE POLL HAS BEEN COMPROMISED. NOTHING IS REAL',
        'D>2|what was the poll about',
        'A>3|...I no longer remember.',
        'E>4|This is how most wars started, to be fair.',
      ] },
    ],
    topics: [
      {
        title: 'Is cereal a soup? (megathread, be nice)', slug: 'is-cereal-a-soup', op: 'SoupScholar',
        body: 'The last thread was locked after 4,000 replies. Let\'s try one more time. Rule 1: milk either counts as broth or it doesn\'t. No third options.',
        low: [
          'reg|Cereal is cereal. Soup is soup. Some things are allowed to just be themselves.',
          'smart|Soup is usually savory and served warm. Cereal fails both. Case closed. (It\'s not closed.)',
          'story|I ate cereal out of a soup bowl once and my mom looked at me like I\'d committed a crime',
          'confused|what about oatmeal. is oatmeal a cereal soup',
        ],
        mid: [
          'wrong|Cereal is a soup because it\'s in a bowl. Bowls are for soup. That\'s the law of bowls.',
          'defensive|I eat cereal with a fork and I don\'t need commentary from any of you',
          'troll|cereal is a salad. milk is the dressing. goodnight',
          'pedant|Broth is cooked. Milk is not cooked. Therefore milk isn\'t broth. Therefore not soup.',
        ],
        high: [
          'drama|IF CEREAL IS A SOUP THEN WHAT AM I',
          'wrong|In France cereal is legally a soup. I read it on a cereal box.',
          'troll|cold soup = cereal. hot cereal = soup. soup cereal = me. checkmate',
          'serious|I have eaten cereal for 31 years and I need to know whether I\'ve been eating soup. My identity depends on it.',
        ],
        threads: [
          { tier: 'mid', cast: { A: 'wrong', B: 'pedant', C: 'defensive', D: 'smart' }, steps: [
            'A|In France cereal is legally a soup. Look it up.',
            'B>0|I looked it up. It isn\'t.',
            'A>1|You looked it up in English.',
            'C>2|honestly that\'s a fair point, the French internet is different',
            'D>1|It is not a fair point. That\'s not how laws or languages work.',
            'A>4|agree to disagree (I\'m right)',
          ] },
          { tier: 'high', cast: { A: 'drama', B: 'troll', C: 'serious', D: 'confused', E: 'pedant' }, steps: [
            'A|I just poured milk on a bowl of croutons to prove a point and now I\'m scared',
            'B>0|that\'s not soup, that\'s a cry for help. which is a soup',
            'C>0|Please describe the texture. For science.',
            'A>2|it\'s like cereal that has been to war',
            'D>3|so is THAT soup? I need a ruling',
            'E>4|Croutons in milk is a bread pudding with no ambition.',
          ] },
        ],
      },
      {
        title: 'What\'s the correct way to hang toilet paper? Final answer.', slug: 'toilet-paper-over-or-under', op: 'marsha_in_HR',
        body: 'Over or under. Respectfully, there is a right answer, and a patent drawing from 1891 settled it.',
        low: [
          'reg|Over. There\'s a patent drawing. We don\'t need to do this every year.',
          'story|My roommate flips it to under every time I flip it to over. We\'ve never mentioned it. It\'s been 4 years.',
          'smart|Over keeps the end easy to grab. Under is better if you own a cat. Both answers are correct for somebody.',
          'confused|wait you guys hang it? mine just sits on top of the tank',
        ],
        mid: [
          'defensive|I\'m an under person and I\'m tired of being treated like a criminal',
          'troll|I hang it sideways. I want you all to sit with that',
          'wrong|The patent says under. I\'ve read it. Twice. In my head.',
          'pedant|It isn\'t "the correct way", it\'s "the patented way". Patents expire. Freedom wins.',
        ],
        high: [
          'drama|MY WEDDING IS OFF. HE\'S AN UNDER',
          'troll|I keep the roll in the freezer. cold paper builds character',
          'wrong|toilet paper was invented after toilets, which is why nobody knows how to hang it',
          'serious|I\'m drafting a constitution for this thread. Article 1: over. Article 2: no further questions.',
        ],
        threads: [
          { tier: 'low', cast: { A: 'story', B: 'confused', C: 'reg' }, steps: [
            'A|The hotel I stayed at folded the end into a little triangle and I felt like royalty for 3 days',
            'B>0|was the triangle over or under',
            'A>1|...I don\'t remember. I\'ve failed you all.',
            'C>2|you had one job',
          ] },
          { tier: 'high', cast: { A: 'defensive', B: 'troll', C: 'drama', D: 'pedant' }, steps: [
            'A|UNDER IS NOT A PERSONALITY FLAW. IT\'S A LIFESTYLE',
            'B>0|ok under guy',
            'A>1|I will find out where you live and hang ALL of your rolls under',
            'C>2|this is the scariest threat I\'ve ever read online',
            'D>2|Technically that\'s not a threat. That\'s interior design.',
            'B>4|ok interior design guy',
          ] },
        ],
      },
      {
        title: 'Unpopular opinion: stairs are overrated', slug: 'stairs-are-overrated', op: 'stair_truther',
        body: 'Hear me out. Ramps exist. Elevators exist. Stairs are just a ramp that gave up halfway.',
        low: [
          'reg|stairs are fine. they\'ve done nothing to you',
          'smart|Stairs are a great design: compact, no power, they last for centuries. A ramp to the same height takes way more space.',
          'story|I live on the 6th floor and the elevator has been broken since spring. Stairs are my whole personality now.',
          'confused|is this about stairs or is it a metaphor',
        ],
        mid: [
          'troll|stairs are a scam by big leg',
          'defensive|Some of us take the stairs on purpose. For our health. And because the elevator scares me.',
          'pedant|"A ramp that gave up halfway" would be a cliff. Stairs are a ramp with a plan.',
          'wrong|stairs were invented in 1990 for the movie Home Alone',
        ],
        high: [
          'drama|I tripped on a stair in 2017 and nobody in this thread has apologized yet',
          'serious|I have counted every stair in my city. There are 3,400,912. They know I\'m counting.',
          'wrong|escalators are stairs that got a job. ladders are stairs that got scared. that\'s in the bible',
          'troll|stairs are just floors that got stacked. the floor has been lying to us',
        ],
        threads: [
          { tier: 'mid', cast: { A: 'serious', B: 'troll', C: 'smart', D: 'defensive' }, steps: [
            'A|Honestly curious: what would you replace stairs with?',
            'B>0|fireman poles. up AND down',
            'C>1|Poles only work going down. You\'d need an elevator next to every pole. You\'ve invented a building.',
            'D>1|I don\'t care how you go down, I care that I don\'t have to go up',
            'B>3|ok pole hater',
          ] },
          { tier: 'high', cast: { A: 'drama', B: 'wrong', C: 'pedant', D: 'story', E: 'troll' }, steps: [
            'A|ONE STEP IN MY BUILDING IS TALLER THAN THE OTHERS AND I TRIP ON IT EVERY SINGLE DAY',
            'B>0|that\'s a stair trap. castles had them to stop invaders. your building is a castle now',
            'C>1|It\'s called a trip step, and yes, castles had them. That is not why YOUR stair is taller.',
            'D>0|my old building had one. I moved. the stair moved too. it\'s in my new building somehow',
            'E>3|the stair is following you. this is a horror movie and you\'re not the main character',
            'A>4|I\'M NOT GOING HOME TONIGHT',
          ] },
        ],
      },
    ],
  };

  /* ---------- Replies written on the spot, by the replier's personality ---------- */

  const REPLIES = {
    reg: {
      low: ['haha same', 'this is the way', 'good point honestly', 'lol fair'],
      mid: ['why is this thread like this', 'lmao this escalated', '{@} you can\'t just say that'],
      high: ['i come here for the content and leave with trauma every time', 'this thread is a fire and I\'m the guy with popcorn', 'someone check on {@}'],
    },
    lurker: { low: ['^ this'], mid: ['^ this', 'following'], high: ['following (for legal reasons)', 'commenting so I can find this thread again'] },
    pedant: {
      low: ['Small correction: it\'s "could have", not "could of".', 'Not to be that person, but the post says the opposite.', '*its'],
      mid: ['"Literally" is doing a lot of work in that sentence.', 'That\'s an opinion, not a fact. Please label those.', 'Source? And not your uncle this time.'],
      high: ['I\'m not reading the rest of your comment until you fix that comma.', '{@}, you\'ve mixed up "then" and "than" so badly I\'m worried about you.', 'Every word in your comment is spelled correctly and it\'s still wrong somehow.'],
    },
    troll: {
      low: ['bold take', 'lol ok'],
      mid: ['ratio', 'cope', 'didn\'t read lol', 'source: trust me bro', 'ok {@}'],
      high: ['{@} has never touched grass and it shows', 'mad?', 'this you? 📸', 'reported {@} to their mom'],
    },
    defensive: {
      low: ['that\'s not really what I said, but ok'],
      mid: ['I never said that.', 'Read my comment again. Slowly.', 'Wow ok. I\'m literally just asking questions.'],
      high: ['I\'M NOT MAD, I\'M JUST TYPING HARD', 'Screenshotted. My lawyer will love this.', 'Blocked. Unblocked to tell you I blocked you. Blocked again.'],
    },
    confused: {
      low: ['wait what did I miss', 'is this a joke? genuinely asking'],
      mid: ['are you agreeing or disagreeing, I can\'t tell', 'who is {@} replying to', 'I thought this was the recipe thread'],
      high: ['I\'ve lost track of the sides so I\'m with {@} by default', 'WHY IS EVERYONE YELLING ABOUT GEESE', 'is {@} a bot? am I a bot?'],
    },
    smart: {
      low: ['Fair point, with one bit of nuance: it depends on what you\'re optimizing for.', 'This is the most reasonable comment in here.'],
      mid: ['You\'re both arguing about different definitions of the same word.', '{@} has the right conclusion for the wrong reason, which is somehow worse.'],
      high: ['Everyone take a breath and re-read the original post. It says the opposite of what anyone here thinks.', 'I traced this argument back 40 replies. It started because someone misread "sandwich" as "sandbox".'],
    },
    drama: {
      low: ['this made my whole day honestly'],
      mid: ['{@} I have never felt so disrespected in my life', 'I\'m logging off. (back in 4 minutes)'],
      high: ['THIS IS THE WORST THING I\'VE EVER READ AND I\'VE READ THE TERMS OF SERVICE', '{@} you have changed the course of my life and NOT for the better', 'I\'M SCREENSHOTTING THIS FOR MY THERAPIST'],
    },
    story: {
      low: ['this reminds me of my aunt\'s wedding when the cake fell over and everyone just ate it off the floor. good times'],
      mid: ['I said exactly this at Thanksgiving once and my cousin hasn\'t spoken to me since. 2016. Worth it.'],
      high: ['{@} I had a dream about this exact comment last night. You were a pelican.', 'this happened to me in 2009 except I was a mall Santa and it was in a hot air balloon'],
    },
    offtopic: {
      low: ['unrelated but how do you get a sticker off a laptop without the gunk'],
      mid: ['anyway what\'s everyone having for dinner'],
      high: ['my landlord just texted "we need to talk" with no punctuation. anyway carry on'],
    },
    serious: {
      low: ['Thank you for sharing your perspective.', 'I\'d like to respectfully add a counterpoint.'],
      mid: ['{@}, I\'ve read your comment four times and I formally disagree with points 1 through 3.', 'This deserves a proper debate. I\'ve booked the community center.'],
      high: ['I am writing a letter to {site} about {@}. A physical letter. With a stamp.', 'I demand a recount of the upvotes.'],
    },
    wrong: {
      low: ['pretty sure that\'s how it works yeah'],
      mid: ['Actually this was proven by science in the 1800s.', 'No, {@}. The Great Wall of China is visible from my house.'],
      high: ['{@} is wrong because the earth is six feet from the sun. Look it up.', 'I don\'t need to google it. I AM the google.'],
    },
    mod: {
      low: ['Friendly reminder to keep it kind, everyone.'],
      mid: ['{@}, please keep it civil.', 'Comment approved. Reluctantly.'],
      high: ['{@}, I need you to log off and think about what you\'ve done.', 'Locking this reply chain. Unlocking it. I don\'t know how this button works.'],
    },
  };

  /* Who tends to answer whom. Weights are [personality, weight]. */
  const REACTS = {
    wrong: [['pedant', 4], ['smart', 3], ['confused', 1], ['troll', 1]],
    troll: [['defensive', 4], ['drama', 3], ['troll', 1], ['smart', 1]],
    story: [['confused', 3], ['reg', 2], ['serious', 1], ['story', 1]],
    drama: [['troll', 3], ['reg', 2], ['serious', 1]],
    pedant: [['defensive', 4], ['troll', 2], ['pedant', 1]],
    defensive: [['troll', 3], ['pedant', 2], ['drama', 1]],
    confused: [['smart', 3], ['reg', 2], ['troll', 1]],
    smart: [['wrong', 2], ['defensive', 2], ['lurker', 2], ['reg', 1]],
    serious: [['troll', 2], ['pedant', 2], ['confused', 1]],
    offtopic: [['confused', 2], ['reg', 2], ['offtopic', 1]],
    reg: [['reg', 2], ['troll', 1], ['pedant', 1], ['lurker', 1]],
    lurker: [['reg', 1]],
    player: [['reg', 2], ['troll', 2], ['serious', 1], ['defensive', 1], ['drama', 1], ['confused', 1]],
  };

  /* Replies to the player's own comments live in js/content/replies.js. */

  const SPAM = [
    '🔥🔥 CHECK MY PROFILE FOR FREE {site} PREMIUM 🔥🔥',
    'Hello dear, I am a general on a ship and I need help moving my gold',
    'Great article! Here is my unrelated coin: CHAOSCOIN 🚀🚀🚀',
    'i make $9,000 a week from home just by reading comment sections, ask me how',
    'first',
    'FIRST (not first)',
    'Nice post! Visit my blog for 400 more posts like it but worse',
    '🥕 HOT CARROTS IN YOUR AREA 🥕',
    'Is your car\'s extended warranty about to expire? Reply YES',
  ];

  /* Tacked onto comments when Chaos is high. */
  const EDITS = [
    'EDIT: why is this downvoted??', 'EDIT: wow this blew up', 'EDIT: thanks for the gold, kind stranger',
    'EDIT: people in the replies are being very rude to me and also correct', 'EDIT: I\'ve been told this is wrong. I stand by it.',
    'EDIT: spelling', 'EDIT: not spelling. I was right the first time.', 'EDIT: my mom found this',
  ];

  const MOD_LINES = {
    mid: [
      'Friendly reminder: attack the argument, not the person. (Also maybe not the argument.)',
      'Removed 14 comments about soup. Please stop.',
      'If you\'re here from the other thread: no.',
    ],
    high: [
      'Thread slow mode is on. Everyone gets one comment per minute. Make it count.',
      'I\'m not paid enough for this. I\'m not paid at all, actually.',
      'Who taught AutoMod to reply "skill issue"',
      'The mod team is in an emergency meeting. The meeting is also arguing.',
    ],
  };

  /* Lines that only make sense in certain game situations. Checked against the live game. */
  const SITUATIONS = [
    { when: g => g.s.meltdown > 0, chance: 0.65, lines: [
      'drama|THE SITE IS DOWN. HOW AM I POSTING. AM I THE SITE NOW',
      'reg|503? again?',
      'confused|is it down for everyone or just me',
      'story|{site} went down so I went outside. there\'s a big light in the sky out there. weird',
      'troll|I unplugged it. you\'re welcome',
      'serious|Day 1 of the outage. Food is running low. Morale is high.',
    ] },
    { when: g => g.s.meltdown <= 0 && g.s.res.stability < 35, chance: 0.25, lines: [
      'reg|is {site} lagging for anyone else or is it my potato laptop',
      'pedant|The page loaded the comments before the article. That is not how reading works.',
      'drama|every time I hit post my comment shows up three times. I am three people now',
      'confused|my comment disappeared, came back, and now has someone else\'s username??',
      'smart|Stability on this site is held together with tape and prayer right now. Enjoy it while it lasts.',
    ] },
    { when: g => g.s.policy === 'wholesome', chance: 0.18, lines: [
      'reg|it\'s so wholesome in here today it\'s actually unsettling',
      'troll|tried to start a fight but someone complimented my username. I\'m disarmed',
      'serious|I\'d like to thank everyone for being kind today. Let\'s see how long it lasts.',
    ] },
    { when: g => g.s.policy === 'unhinged', chance: 0.18, lines: [
      'serious|Who is the editor now? The posts have started rhyming.',
      'drama|the editorial policy here is now just a raccoon screaming and honestly? relatable',
      'confused|did {site} get hacked or is this the new direction',
    ] },
    { when: g => (g.s.buildings.adbanner || 0) + (g.s.buildings.popup || 0) > 0, chance: 0.08, lines: [
      'reg|there are more ads on {site} than words',
      'troll|clicked "close ad" and it opened 3 more ads. respect',
      'confused|is the dancing hamster part of the article',
    ] },
    { when: g => (g.s.buildings.premium || 0) > 0, chance: 0.05, lines: [
      'drama|they put the reply button behind {site} Premium?? I paid. I\'m still mad',
    ] },
    { when: g => (g.s.buildings.bots || 0) > 0, chance: 0.1, bot: true, lines: [
      'reg|Great post! I am a real person who loves posts! 🙂',
      'reg|So true! I also have opinions! Like this comment!',
      'reg|Wow! As a human, I agree with this human content!',
    ] },
    { when: g => !!(g.s.trend && g.s.trend.id), chance: 0.08, lines: [
      'reg|{trend} are trending again. buckle up',
      'smart|Notice how every post today is somehow about {trend}? That\'s the trend doing that.',
    ] },
    { when: g => g.s.era === 2, chance: 0.05, lines: ['reg|who still uses forums. follow me on {site} Social', 'troll|this thread would be funnier as a status update'] },
    { when: g => g.s.era === 3, chance: 0.05, lines: ['drama|this is going viral and I\'m IN THE SCREENSHOT', 'reg|hi to everyone who came from the viral post'] },
    { when: g => g.s.era === 4, chance: 0.05, lines: ['confused|the algorithm sent me here from a video about bread', 'smart|You didn\'t find this thread. The algorithm decided you\'d be angry here.'] },
    { when: g => g.s.era === 5, chance: 0.06, lines: ['smart|Most replies here are written by AI. Including this one. Or is it.', 'wrong|As a large language model, I think stairs are overrated.'] },
    { when: g => g.s.era === 6, chance: 0.05, lines: ['serious|This comment is brought to you by {site} Holdings™. Comments are a premium feature now.', 'reg|the terms of service for this comment section are longer than the comments'] },
    { when: g => g.s.era >= 7, chance: 0.06, lines: ['confused|is anyone here human? hello?', 'reg|[this user has not logged in since 2014. still posting]'] },
  ];

  /* One-off reactions to things happening in the game. page: which page reacts ('*' = all). */
  const REACTIONS = {
    'event:viral': { page: '*', lines: ['drama|WE\'RE ON THE FRONT PAGE', 'reg|hello to everyone arriving from the viral post 👋', 'troll|this blew up and it\'s not even good. love the internet'] },
    'event:raid': { page: 'comments', burst: 4, lines: ['troll|we have arrived. bring us your worst opinions', 'troll|this forum is mid', 'troll|raid raid raid', 'drama|WHO ARE THESE PEOPLE', 'serious|To our visitors from the other forum: please wipe your feet.'] },
    'event:argument': { page: 'comments', burst: 2, lines: ['reg|oh here we go', 'smart|This argument started two threads ago and followed us here.'] },
    'event:mom': { page: 'blog', lines: ['reg|Hi sweetie, it\'s Mom. I liked the part with the words. Call your father.'] },
    'event:celebrity': { page: '*', lines: ['confused|a celebrity linked {site}?? which one', 'troll|celebrity mentioned us. nobody act weird. too late'] },
    'event:server': { page: '*', lines: ['reg|did the page just flicker for anyone', 'story|my comment took 40 seconds to post. I aged.'] },
    'event:ddos': { page: '*', lines: ['confused|why is everything loading in slow motion', 'drama|someone is attacking {site} and honestly? same'] },
    'event:outage': { page: '*', lines: ['reg|ok it\'s back. what did I miss'] },
    'action:stir': { page: 'comments', burst: 2, lines: ['troll|who stirred the pot. I want to shake their hand', 'drama|THE ADMIN POSTED A POLL ABOUT PINEAPPLE ON PIZZA. WHY WOULD YOU DO THIS'] },
    'action:apology': { page: '*', lines: ['troll|the apology video had a sponsor segment lol', 'serious|I accept the apology. Conditionally. I have conditions.', 'pedant|"We\'re sorry if anyone was offended" is not an apology. It\'s a weather report.'] },
    'action:hotfix': { page: '*', lines: ['reg|site feels faster? or am I imagining it', 'smart|Someone just pushed a hotfix. You can tell because the button moved.'] },
    'recovered': { page: '*', lines: ['reg|IT\'S BACK', 'drama|I survived the outage. I will be telling my grandchildren.', 'troll|was it down? didn\'t notice'] },
    'renamed': { page: '*', lines: ['troll|{before} was better', 'confused|wait is this still the same site', 'serious|I will continue calling it {before} out of respect.', 'reg|new name, same comment section. we love to see it'] },
  };

  Z.CHAT = {
    USERS, AFFINITY, MODS, SPAMMERS, REPLIES, REACTS, SPAM, EDITS, MOD_LINES, SITUATIONS, REACTIONS,
    PAGES: [blog, meme, comments],
  };
  Z.CHAT.PAGE = Z.util.byId(Z.CHAT.PAGES);
})(window.ICHAOS = window.ICHAOS || {});
