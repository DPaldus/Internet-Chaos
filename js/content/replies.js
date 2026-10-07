/* How the Live Feed pages answer the player's own comments (posted as the site admin).
   Pure content; js/ui/chat.js reads the comment, finds what it is (a question, a
   greeting, an insult, a ban threat, meme slang, Czech…) and picks lines from here.

   Lines are 'personality|text' like in js/content/chatter.js, plus these placeholders:
     {echo}  a short quote of what the admin wrote      {ECHO}  the same, shouting
     {word}  the most telling word of it                {Word}  capitalized
     {num}   a number the admin wrote                   {me}    the admin's name
   Intents are checked in order; the first that matches leads the replies. */
(function (Z) {
  'use strict';

  /* What a comment is about. [id, pattern] (null = decided in code). */
  const INTENTS = [
    ['repeat', null],
    ['link', /https?:\/\/|www\.|\.(com|net|org|io|cz)\b/i],
    ['ban', /\b(ban+(ed|ning|s)?|kick(ed|ing)?|mute[ds]?|block(ed|ing)?|delet(e|ed|ing)|remov(e|ed|ing)|report(ed|ing)?|timeout|lock(ed|ing)? (this|the) thread)\b/i],
    ['calm', /\b(calm down|chill|relax|be (nice|kind|civil|respectful)|stop (fighting|arguing|it)|play nice|behave|cool it|take a breath|everyone breathe|peace)\b/i],
    ['insult', /\b(stupid|idiots?|dumb|morons?|cringe|trash|garbage|losers?|clowns?|noobs?|shut up|stfu|hate (you|this|u|y'?all)|worst|pathetic|annoying|braindead|npcs?|bots|get a life|nobody asked|go away)\b/i],
    ['meme', /\b(based|ratio|cope|seethe|skill issue|touch grass|no cap|fr fr|bussin|rizz|sus|mid|sigma|ok boomer|gigachad|chad|goated|cooked|delulu|slay|yeet|this is the way|stonks|big brain|main character)\b/i],
    ['hype', /\b(let'?s go+|lfg|hype|pog(gers)?|gg|yay+|woo+|hell yeah|we did it|we'?re so back)\b|!{3,}/i],
    ['thanks', /\b(thanks?|thank you|thx|tysm|ty|appreciate (it|you|y'?all)|cheers|díky|diky|dekuju|děkuju|dekuji|děkuji)\b/i],
    ['sorry', /\b(sorry|apologi[sz]e|my bad|oops|whoops|forgive me|pardon)\b/i],
    ['praise', /\b(love|great|awesome|amazing|best|good job|well done|nice|cool|beautiful|wholesome|legend|proud|brilliant|perfect|incredible|fantastic|wonderful|good (post|point|take)|you guys rock|goat)\b/i],
    ['greet', /^(hi+|hey+|hello+|yo+|sup|howdy|hiya|greetings|good (morning|evening|afternoon)|ahoj|čau|cau|nazdar|zdravím|zdravim|hola|hallo|what'?s up)\b/i],
    ['bye', /\b(bye+|goodbye|good ?night|gn|cya|see (ya|you)|logging off|signing off|brb|afk|gotta go|later)\b/i],
    ['announce', /\b(update|patch|new feature|announcement|maintenance|coming soon|we('re| are) (adding|launching|introducing|removing)|introducing|launch(ing)?|roadmap|downtime|rule|rules|new policy)\b/i],
    ['money', /\$\d|\b(money|cash|premium|subscri(be|ption|bers?)|paywall|pay|ads?|advert|sponsor(ed|s)?|crypto|nfts?|coins?|donate|merch|monetiz\w*|profit|investors?)\b/i],
    ['chaos', /\b(chaos|meltdown|servers?|crash(ed|ing)?|lag+y?|stability|bugs?|buggy|broken|down|outage|hotfix|error|404|503)\b/i],
    ['laugh', /\b(lol+|lmao+|lmfao|rofl|haha+|hehe+|xd+)\b|😂|🤣|💀/i],
    ['agree', /^(yes+|yeah+|yep|yup|true|agreed?|same|exactly|this|\+1|facts|correct|indeed|absolutely|ano|jo|real)\b/i],
    ['disagree', /^(no+|nope|nah|wrong|false|disagree|incorrect|nein|ne)\b/i],
    ['opinion', /\b(i think|imo|imho|in my opinion|unpopular opinion|hot take|honestly|tbh|i believe|i feel like|change my mind)\b/i],
    ['question', null],
  ];

  /* How each intent feels to the commenters: pos, neg or neutral. */
  const MOOD = {
    praise: 'pos', thanks: 'pos', greet: 'pos', hype: 'pos', laugh: 'pos', agree: 'pos', sorry: 'pos', calm: 'pos', bye: 'pos',
    insult: 'neg', ban: 'neg', disagree: 'neg', repeat: 'neg',
  };

  /* Replies by intent. Each is either tiered {low, mid, high} or a plain list. */
  const LINES = {
    question: {
      low: [
        'smart|Good question. Short answer: it depends. Long answer: it also depends.',
        'reg|{word}? honestly I was wondering the same thing',
        'story|My uncle asked "{echo}" at a wedding once. The wedding is still going.',
        'confused|wait is this a quiz. is there a prize',
        'serious|I\'ll answer properly once I\'ve read three sources and slept on it.',
      ],
      mid: [
        'troll|great question. next question',
        'wrong|The answer is yes. I don\'t know the question but the answer is yes.',
        'pedant|Before anyone answers, define "{word}".',
        'reg|the admin is asking US? who is running this place',
        'smart|Honest answer: nobody in this thread knows, and that has never stopped us.',
        'confused|I was going to ask the same thing but about soup',
      ],
      high: [
        'troll|no. (I didn\'t read it)',
        'drama|THE ADMIN DOESN\'T KNOW EITHER?? WE\'RE ON OUR OWN',
        'wrong|it\'s soup. the answer is always soup',
        'story|I asked "{echo}" into a well once and the well asked me back',
        'confused|{word}? in THIS economy?',
      ],
    },
    yesno: [
      'reg|yes', 'troll|no', 'smart|Yes, with an asterisk the size of a server.', 'wrong|Yes. Scientists agree. One scientist. Me.',
      'confused|maybe? I said yes last time and I\'m still thinking about it', 'lurker|^ what they said',
    ],
    greet: {
      low: ['reg|oh hi admin 👋', 'lurker|the admin speaks', 'serious|Hello. Welcome to the comments. Please wipe your feet.', 'reg|hey {me}! love the site', 'story|The last time an admin said hi to me it was 2006 and I still have the screenshot.'],
      mid: ['troll|hi admin, bye admin', 'confused|hi?? do we know each other', 'drama|THE ADMIN SAID HI TO ME (to everyone, but mostly me)', 'defensive|Hi. For the record, I was here before the admin.'],
      high: ['drama|HI ADMIN. PLEASE HELP. THE COMMENTS HAVE BECOME SENTIENT', 'troll|"hi" he says. while the site is like THIS', 'confused|hello? are you real? is anyone real?'],
    },
    bye: ['reg|bye admin 👋', 'drama|DON\'T LEAVE US HERE WITH THEM', 'troll|finally', 'serious|Goodnight, admin. The comments will be here. Unsupervised.', 'lurker|o7'],
    thanks: ['reg|np admin', 'serious|You\'re welcome. We do this for free, as you know.', 'troll|thank me with a premium account', 'drama|THE ADMIN THANKED US. I\'M FRAMING THIS', 'smart|Appreciated. A thank-you from the admin is rarer than a working search bar.'],
    sorry: ['serious|Apology accepted. Conditionally. I have conditions.', 'pedant|"Sorry if anyone was offended" would not have counted. This one counts. Barely.', 'troll|not accepted. ratio', 'reg|it\'s fine admin, we\'ve seen worse. we\'ve DONE worse', 'drama|AN APOLOGY? FROM AN ADMIN? IS THE INTERNET ENDING'],
    praise: {
      low: ['reg|aww thanks admin', 'serious|Thank you. The community appreciates being appreciated.', 'lurker|wholesome admin moment', 'story|my mom said the same thing about my blog in 2004. she was also wrong. jk thanks'],
      mid: ['troll|sure, now say it without the sponsored link', 'defensive|I\'ll take the compliment, but I\'m not changing my opinion about the stairs.', 'confused|wait was that about me? I\'ll take it', 'drama|THE ADMIN LIKES US. I HAVE NEVER FELT SO SEEN'],
      high: ['troll|admin is being nice. something is wrong. check the servers', 'drama|THE ADMIN SAID "{echo}" AND I\'M CRYING IN A PUBLIC BUS', 'wrong|that\'s exactly what an admin would say before deleting everything'],
    },
    hype: ['reg|LET\'S GOOO', 'troll|calm down admin it\'s a comment section', 'drama|I\'M SO HYPED AND I DON\'T EVEN KNOW WHY', 'lurker|W', 'confused|what are we celebrating. I\'m in either way'],
    laugh: ['reg|lmao', 'troll|it wasn\'t that funny admin', 'lurker|😂', 'serious|I\'m glad the admin finds this amusing. Some of us are working.', 'story|that laugh reminded me of my grandpa. he also laughed at his own website'],
    insult: {
      low: ['serious|Wow. Okay. That\'s a choice for an admin to make.', 'reg|harsh but fair? mostly harsh', 'defensive|Excuse me? I have been nothing but polite in this comment section.', 'smart|Calling your own users "{word}" is a bold retention strategy.'],
      mid: ['troll|mad? 😂', 'drama|THE ADMIN CALLED US "{WORD}". I\'M SCREENSHOTTING', 'defensive|"{echo}"?? I\'m literally the only reason this site has traffic', 'troll|ratio + you run the site + touch grass', 'pedant|Ad hominem. Textbook. I\'d expect better from the person who owns the server.'],
      high: ['drama|THE ADMIN HAS TURNED ON US. THIS IS LIKE A MOVIE', 'troll|admin rage-posting at 3am again 💀', 'defensive|I\'M NOT "{WORD}", YOU\'RE "{WORD}"', 'confused|wait who is the {word}? is it me? it\'s probably me', 'serious|I\'ve forwarded "{echo}" to the board of directors. The board is my cat.'],
    },
    ban: {
      low: ['serious|Please don\'t ban anyone. We\'re mostly harmless.', 'reg|wait what did we do', 'lurker|*quietly closes tab*', 'smart|Banning people is how you get three new accounts per person. Ask any forum.'],
      mid: ['troll|ban me. I have 40 accounts', 'defensive|You can\'t ban me, I quit first.', 'drama|THE BAN HAMMER IS OUT. EVERYONE ACT NATURAL', 'wrong|banning is illegal on the internet. it\'s in the constitution of the internet'],
      high: ['troll|banned me? I\'m posting from a toaster now', 'drama|IF I GET BANNED TELL MY STORY', 'defensive|You can\'t ban a feeling, admin.', 'confused|who\'s getting banned? is it the duck? don\'t ban the duck'],
    },
    calm: {
      low: ['reg|we\'re calm admin, we\'re always calm', 'serious|Agreed. Let\'s all take a breath and continue respectfully.', 'smart|Good call. This thread was one "actually" away from a war.'],
      mid: ['troll|I am extremely calm. CALMEST PERSON HERE.', 'defensive|I AM calm. This is just how I type.', 'reg|ok ok. truce. for five minutes'],
      high: ['drama|CALM?? THE SITE IS ON FIRE', 'troll|"calm down" says the person running an Unhinged website', 'confused|calm down about what? what happened? I just got here and I\'m already upset'],
    },
    meme: [
      'reg|the admin knows the lingo 💀', 'troll|"{echo}" — admin trying to sound young', 'smart|Memes from the admin. The site has reached its final form.',
      'drama|THE ADMIN SAID "{WORD}" I\'M ON THE FLOOR', 'pedant|"{Word}" is not a real word. I checked. Twice.', 'confused|what does "{word}" mean. asking for my dad',
      'lurker|based admin', 'story|my grandma said "{word}" at dinner once and the whole family went silent',
    ],
    announce: ['serious|Will this be in the patch notes? I read the patch notes.', 'troll|nobody asked but ok', 'drama|AN UPDATE?? WHAT DID YOU CHANGE. I CAN FEEL IT', 'reg|finally some news', 'smart|Translation: something got moved and nobody will find it for a month.', 'confused|is the update why my comments are blue now', 'pedant|An announcement this important deserves a full stop at the end.'],
    money: ['troll|and there it is. the money', 'serious|Please don\'t put the comments behind a paywall. They\'re the only free thing left.', 'drama|THEY\'RE MONETIZING THE COMMENTS NEXT. I CAN FEEL IT', 'reg|take my money (I have $4)', 'smart|Every site starts as a hobby and ends as a subscription. We are watching it happen live.', 'wrong|ads are actually free money from the government'],
    chaos: ['reg|the site has been weird today ngl', 'drama|I KNEW IT. I KNEW THE SERVERS WERE CRYING', 'smart|To be fair, the comment section IS the chaos.', 'troll|have you tried turning it off and on again', 'confused|is the {word} why my profile picture is a duck now', 'serious|Thank you for the transparency, admin. Please also fix the search bar.'],
    agree: ['reg|admin gets it', 'lurker|^ admin is right', 'troll|wow agreeing with the admin. bootlicker energy', 'smart|The rare correct admin take.'],
    disagree: ['defensive|You can\'t just say "no" to a whole comment section.', 'troll|"no" — the admin, probably, in a history book one day', 'serious|Could you expand on that? "{echo}" is a bit thin.', 'drama|THE ADMIN SAID NO. TO US. TO ME.'],
    opinion: ['troll|hot take from a cold server', 'serious|Interesting perspective. I disagree with all of it, respectfully.', 'reg|"{echo}" — admin is spitting', 'smart|That\'s actually reasonable, which is why this thread will hate it.', 'drama|THE ADMIN HAS OPINIONS NOW', 'wrong|"{echo}" is literally what Einstein said'],
    caps: ['reg|why is the admin yelling', 'troll|caps lock is cruise control for cool, admin', 'drama|THE ADMIN IS YELLING SO I\'M YELLING', 'pedant|You don\'t need capital letters to be heard. You need good arguments.', 'confused|IS SOMETHING WRONG? SHOULD WE BE YELLING?'],
    long: ['troll|tl;dr', 'reg|I\'m not reading all that but I\'m happy for you. or sorry that happened', 'serious|I read the whole thing. Twice. I have notes.', 'smart|The admin wrote an essay. The comment section is about to reply to the first five words of it.', 'drama|THE ADMIN WROTE A WHOLE ESSAY. FOR US???'],
    short: ['reg|the admin has spoken. briefly', 'troll|"{echo}". that\'s it? that\'s the post?', 'lurker|{echo}', 'smart|Concise. More admins should try that.', 'confused|"{echo}"? is that code?'],
    emoji: ['reg|{echo}', 'confused|the admin communicates in hieroglyphs now', 'troll|use your words admin', 'lurker|{echo} {echo}'],
    link: ['troll|not clicking that', 'confused|is this a rickroll', 'serious|I don\'t click links from admins. Or anyone. Or myself.', 'drama|I CLICKED IT. WHY DID I CLICK IT', 'reg|link is broken. like my heart'],
    repeat: ['reg|admin you already said that', 'troll|copy paste admin strikes again', 'smart|The admin is stuck in a loop. Someone push a hotfix.', 'confused|déjà vu', 'pedant|You\'ve posted this exact comment before. Word for word. I keep records.'],
    number: ['pedant|{num}? Source?', 'wrong|{num} is a made-up number and I respect it', 'serious|I\'ve written {num} down. For the record.', 'troll|{num}? ratio'],
    czech: ['reg|is that Czech? 🇨🇿 ahoj admin!', 'confused|Google Translate says the admin just said "{echo}" and honestly I believe it', 'smart|A multilingual admin. Fancy.', 'troll|ahoj. that\'s the only Czech I know. ahoj', 'story|I went to Prague once. A man sold me a sausage at 3am and I think about it constantly.', 'wrong|that\'s Latin. I took Latin. it means "more servers"'],
    mention: ['reg|the admin mentioned us by name now??', 'drama|THE ADMIN KNOWS OUR NAMES'],
    generic: {
      low: ['reg|"{echo}" — honestly, yeah', 'serious|Thank you for engaging with the community. Rare these days.', 'reg|the admin said "{echo}" and I think about it daily now', 'lurker|adding "{echo}" to my bio', 'confused|wait, the owner of {site} reads these??', 'smart|Can\'t argue with "{echo}". I\'ve tried. In my head.'],
      mid: ['troll|ok admin', 'defensive|With respect, you don\'t even read the comments. (You\'re reading them right now, I realize.)', 'reg|"{echo}" is a wild thing to say on your own site', 'drama|THE ADMIN REPLIED. SCREENSHOTTING.', 'troll|fix the site first lol', 'serious|Screenshotted "{echo}". For legal reasons.', 'confused|"{echo}" ok but what does that mean for the soup debate'],
      high: ['troll|who asked', 'drama|THE ADMIN IS HERE. EVERYONE ACT NORMAL. ACT NORMAL!!!', 'wrong|that\'s not the real admin. the real admin is a duck', 'defensive|I\'m not leaving. You can\'t ban a feeling.', 'troll|"{echo}" 💀💀💀', 'drama|"{ECHO}" — THE ADMIN, MOMENTS BEFORE DISASTER', 'confused|the admin is here?? is the admin also arguing about soup', 'serious|Admin, with all due respect, have you considered less Chaos'],
    },
  };

  /* When the admin answers someone directly, that person answers back in character. */
  const BY_PERS = {
    reg: { pos: ['oh wow thanks admin!', 'the admin replied to ME. today is a good day'], neg: ['ok that was a bit harsh admin', 'wow. ok. noted'], q: ['honestly no idea, I just come here for the comments', 'uhh yes? I think yes'], any: ['ok admin, fair', 'the admin replied to me, this is my peak'] },
    troll: { pos: ['aww the admin likes me. still ratio tho', 'don\'t be nice to me admin, I\'ll get worse'], neg: ['mad? 😂', 'the admin is malding. we did it, chat'], q: ['idk ask the duck', 'skill issue'], any: ['ok admin', 'didn\'t read lol'] },
    pedant: { pos: ['Thank you. Someone here finally appreciates precision.', 'Appreciated. Also, your comment is missing an Oxford comma.'], neg: ['Insults aren\'t arguments, admin. I\'d have expected a footnote at least.', 'Noted. Spelled correctly, too. I\'ll allow it.'], q: ['Technically, yes. Practically, also yes. Pedantically, it depends.', 'Define your terms and I\'ll answer.'], any: ['I\'ve reviewed your reply. Two notes, both minor.', 'Correct, mostly. I\'d have phrased it differently.'] },
    defensive: { pos: ['Finally, someone sees it. Thank you.', 'See? Even the ADMIN agrees with me.'], neg: ['I never said that. Read my comment again. Slowly.', 'Wow. The admin too? I\'m being attacked from all sides.'], q: ['Why are you asking ME? I just got here.', 'I don\'t have to answer that and I won\'t. (yes)'], any: ['That\'s not what I said, but ok.', 'I stand by my comment. All of it.'] },
    confused: { pos: ['oh! thank you? what did I do', 'yay?? I\'ll take it'], neg: ['wait what did I do', 'am I in trouble?? I thought this was the recipe thread'], q: ['I was going to ask YOU that', 'yes? no? which answer gets me out of this'], any: ['wait, the admin is talking to me?', 'sorry, which thread is this'] },
    smart: { pos: ['Thanks. To be fair, it was a low bar in here.', 'Appreciated. The rest of the thread is still wrong though.'], neg: ['That\'s not a counterargument, admin. That\'s a mood.', 'I\'d love a source for that. Any source.'], q: ['Short answer: yes. Long answer: yes, but people will argue anyway.', 'Good question. The honest answer is that nobody here knows.'], any: ['Fair point, with one bit of nuance.', 'That\'s reasonable. This thread will hate it.'] },
    drama: { pos: ['THE ADMIN NOTICED ME. I CAN DIE HAPPY', 'I\'M SCREENSHOTTING THIS FOR MY GRANDCHILDREN'], neg: ['I HAVE NEVER BEEN SO DISRESPECTED BY A WEBSITE', 'I\'M LOGGING OFF. (BACK IN 4 MINUTES)'], q: ['HOW SHOULD I KNOW. NOBODY TELLS ME ANYTHING', 'THE ANSWER IS PAIN, ADMIN'], any: ['THE ADMIN REPLIED TO ME. I NEED TO LIE DOWN', 'I have been personally addressed by {site}. I need a minute.'] },
    story: { pos: ['thanks admin. this reminds me of the time a mayor thanked me. it was for leaving', 'aww. my aunt said the same thing right before the cake fell over'], neg: ['that\'s exactly what my landlord said in 2011. he\'s in prison now (unrelated)', 'wow. the last person who said that to me was a goose'], q: ['funny you ask. in 1998 I asked the same thing to a man at a bus stop', 'long story. it involves a pelican'], any: ['this reminds me of my uncle\'s wedding. long story', 'the admin replied to me. like the time a seagull took my fries. intimate'] },
    offtopic: { pos: ['thanks! anyway does anyone have a lasagna recipe', 'aw. also my cat is staring at the wall again'], neg: ['sorry admin. unrelated but is the bakery still open'], q: ['no idea. anyway what\'s everyone having for dinner'], any: ['ok! unrelated but how do I get stickers off a laptop'] },
    serious: { pos: ['Thank you, admin. I\'ve added this to my records.', 'I appreciate that. It means a lot to the committee.'], neg: ['I will be writing a formal letter about this reply.', 'Noted, and filed under "concerns".'], q: ['I\'d like to answer properly. I\'ve booked the community center.', 'An excellent question. My response is in a 14-page document.'], any: ['Acknowledged.', 'Thank you for your input. It will be discussed at the next meeting.'] },
    wrong: { pos: ['thanks admin. I\'m right a lot. scientists hate it', 'see, the admin knows I\'m right'], neg: ['actually, I\'m right. this was proven in 1874', 'wrong. the admin is wrong. look it up'], q: ['yes. it was decided by the supreme court of the internet', 'the answer is 42. it\'s always 42'], any: ['that\'s what I said', 'correct, as I said earlier (I did not say this earlier)'] },
    lurker: { pos: ['🥹', 'first time posting, and the admin noticed'], neg: ['*goes back to lurking*', 'sorry. I\'ll go'], q: ['idk I just read', '...yes?'], any: ['👀', 'oh no I\'ve been seen'] },
  };

  /* People keep talking about what the admin said for a while afterwards. */
  const AFTER = [
    'reg|still thinking about the admin saying "{echo}"',
    'troll|can we go back to the admin\'s "{echo}" comment. that was something',
    'smart|For anyone just arriving: the admin said "{echo}" and the thread has not recovered.',
    'drama|I CAN\'T STOP THINKING ABOUT "{ECHO}"',
    'confused|wait, the admin was here? what did I miss',
    'story|years from now people will ask where they were when the admin said "{echo}"',
    'pedant|For the record, the admin\'s comment was "{echo}". Not what people are quoting.',
    'serious|I\'ve pinned "{echo}" in my heart. Not on the site. In my heart.',
  ];

  /* Real mistakes in the admin's comment, found by the resident pedant. */
  const PEDANTRY = [
    [/\byour (all|welcome|right|wrong|so|very|crazy|not|going|being|kidding|joking|the best|the worst)\b/i, '"You\'re", admin. You run a website.'],
    [/\balot\b/i, '"A lot" is two words. I\'ll wait.'],
    [/\b(could|should|would|must|might) of\b/i, '"{1} have." Not "{1} of". I\'m begging you, admin.'],
    [/\btheir (is|are|was|were)\b/i, '"There", not "their". Nobody owns that sentence.'],
    [/\b(better|more|less|rather|worse|bigger|smaller|faster|slower|older|younger) then\b/i, '"Than." Comparisons use "than". "Then" is for time.'],
    [/\bits (a|an|the|not|been|so|very|going|getting|over|true|fine|ok|okay)\b/i, '"It\'s", with an apostrophe. Its absence is a crime.'],
    [/\b(definately|definatly|defiantly)\b/i, '"Definitely." The other spelling means something much angrier.'],
    [/\bseperate\b/i, '"Separate." There\'s "a rat" in separate. Remember the rat.'],
    [/\b(to|will|gonna|might|never|don't|dont) loose\b/i, '"Lose." "Loose" is what your grip on this site is.'],
    [/\birregardless\b/i, '"Irregardless" is technically a word and I hate that it is.'],
    [/\bliterally\b/i, 'Was it literally, though? Was it, admin?'],
    [/\b(ur|u|r)\b/i, 'It costs nothing to type "you", admin. Three whole letters.'],
    [/(^|[^A-Za-z])i([^A-Za-z']|$)/, 'Capital I, admin. You are a proper noun.'],
    [/!{2,}/, 'One exclamation mark is plenty. Two is a cry for help.'],
    [/\?{2,}/, 'One question mark asks a question. Three asks for attention.'],
  ];
  /* Only when nothing better is wrong, and not every time. */
  const STYLE_NITS = [
    [/^[a-z]/, 'Sentences start with a capital letter. The admin should lead by example.'],
    [/[a-z0-9]$/i, 'No full stop at the end. Bold of you, admin.'],
  ];

  /* Words too common to quote back. */
  const STOP = ('a an the and or but so to of in on at for with is are was were be been being am i you he she it we they me my your '
    + 'our their this that these those do does did done not no yes just like really very about what why how who when where which '
    + 'there here have has had will would can could should if then than as from by up down out over under again more most some '
    + 'any all im its dont cant wont lol ok okay hi hey hello please thanks thank yeah yep nope also too much many one get got '
    + 'make made know think going gonna want need its it\'s i\'m don\'t can\'t won\'t you\'re they\'re we\'re isn\'t that\'s '
    + 'here\'s guys everyone anyone someone something thing things stuff really actually literally ever still even only well '
    + 'now today admin site').split(' ');

  /* Czech gives itself away by its letters, or by a few very common words. */
  const CZECH = /[ěščřžůťďň]|\b(ahoj|čau|cau|díky|diky|dekuju|děkuju|prosím|prosim|proč|proc|jsem|není|neni|taky|jako|nebo|ano|jojo|dobrý|dobry|tohle|hele|kluci|lidi|vole|fakt)\b/i;

  Z.CHAT.PLAYER = { INTENTS, MOOD, LINES, BY_PERS, AFTER, PEDANTRY, STYLE_NITS, STOP, CZECH };
})(window.ICHAOS = window.ICHAOS || {});
