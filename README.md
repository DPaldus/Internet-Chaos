# Internet Chaos

A browser idle game about growing one useless website into an absurd internet empire.
You name the website yourself on first launch (rename it any time from **Menu** or by
clicking the site's title).
You create Attention, Attention earns Money, Money buys more content. The catch is
**Chaos**: it multiplies everything, but past your servers' **Tolerance** it drains
**Stability**, and at 0% your site melts down.

Made by DPLDS.

## Run it

Open `index.html` in any modern browser. No server, build step or install is needed.
Progress saves to the browser's local storage automatically. Saves belong to that browser,
so use **Settings → Download backup** to move a game to another browser or keep a copy.
Any static file host also works, since the game is plain HTML, CSS and JavaScript.
To put it online (itch.io or GitHub Pages), see [PUBLISHING.md](PUBLISHING.md).

## How it plays

| Resource | What it does |
| --- | --- |
| Attention | Made by clicks and Content buildings. Counts toward the next Internet Era. |
| Money | Attention × Yield. Spent on everything. Monetization buildings raise Yield. |
| Chaos | Drifts toward `Pressure / (Pressure + Control)`. Boosts Attention and Yield. |
| Tolerance | `10 + 80 × Capacity / (Capacity + Load)`. Servers add capacity, content adds load. |
| Stability | Drains while Chaos sits above Tolerance and repairs below it. Under 60% production slows; 0% is a meltdown. |

**Layout.** Three windows: your website (with Editorial Policy and Actions), the Shop
(upgrades above buildings) and Community (goals, with Live Feed, Analytics and Automation as
tabs). Achievements, Statistics, Settings, Sound and Music live in the ☰ Menu.

**For new players.** The screen starts with only the button, the Shop and the goals. Shop
tabs, bulk buying (×10/×25/Max), the numbers summary, Chaos details and the 🎨 Style button
appear once they matter, each with a short note, and never two within 20 seconds. A new game
opens with a 7-step tour, and the **?** button holds the core loop plus a glossary of every
term (terms you have not met yet are marked "Later"). The tour can be replayed from there.
Code: `js/ui/help.js`.

**Floating notifications.** Every few minutes a glowing bell floats over the page for 12
seconds. Catching it gives a surprise: an Attention frenzy, a brand deal, a click storm, or
(when the site is struggling) a digital detox. Missing it costs nothing. Timing and rewards
are in `js/systems/bonus.js` and `Z.BAL.bonus`, the bubble in `js/ui/bonus.js`.

**Sponsors.** Sponsorship upgrades and buildings put a sponsor on your website: a "Sponsored
by" strip of brand badges, sponsor ads in the ad slots and, for the Energy Drink
Sponsorship, a BLU VOLT can next to the button. Each sponsor also brings its own choice
event (a recall, a tracking scandal, a salsa feud…). Brands live in
`js/content/sponsors.js`, their events in `js/content/events.js`.

**Music.** Generative music synthesized live with the Web Audio API (no audio files), one
style per operating system. ChaosOS 7 has calm Frutiger Aero ambient: pad chords, glassy
bells, soft bass, water drops and the odd melody. ChaosOS 8 has a mellow lo-fi beat:
electric piano chords with tape wobble, round bass, soft swung drums, vinyl crackle and a
sparse pluck melody. Neither quite loops. Music starts on the first click, pauses in hidden
tabs, and has its own switch and volume (☰ Menu, Settings). Code: `js/music.js`.

**Save safety.** Settings has one-click **Download backup** and **Copy save code**. After
two hours of play without a backup (and once there is real progress) a small reminder offers
the same. The game also asks the browser to keep its storage persistent. Code:
`js/ui/backup.js`.

**Style Shop (🎨).** Unlock and apply backgrounds, glass colors, website styles and effects.
Themes unlock through lifetime milestones (never Money), spread over the first hours of
play. They are purely cosmetic and saved with the game. Items are defined in
`js/content/cosmetics.js`.

**Operating System Upgrade (🪟).** The website starts on *ChaosOS 7 Aero*, the glossy
Frutiger Aero look. From the Social Media Era on, *ChaosOS 8 Metro* can be installed for
$10T: a one-time purchase that survives every era and permanently gives Attention ×1.3,
Money per Attention ×1.2, click power ×2, 50% shorter meltdowns, Stability repair ×1.25 and
+10% offline efficiency (about 15% faster mid-game in the simulator). Installing plays a
Windows 8 style setup screen, then the whole interface turns into flat Metro tiles: colored
live tiles in the top bar, a navigation rail on wide screens, tile upgrades, pivot tabs,
full-width confirmation bands and a sad blue screen for meltdowns. The music switches to a
lo-fi Metro beat. The Style Shop starts over: the Aero themes stay behind, and ChaosOS 8 has
its own 24 themes (18 to unlock), with milestones counted from the moment of the upgrade.
Rules: `js/systems/os.js` and `Z.OSES` in `js/config.js`; window, setup screen and rail:
`js/ui/os.js`; look: sections 7–9 of `css/game.css`. "ChaosOS" is a made-up name, so the
game stays clear of real trademarks.

**Live Feed pages.** The Blog Post, Meme Page and Comment Section tiles at the top of the
Live Feed open living pages of your site: an article, a meme or a forum thread, with
comments that keep arriving. The Chaos meter sets the mood. Low Chaos is ordinary internet
chatter; higher Chaos brings arguments, trolls, pedants, absurd stories, spam, double posts
and moderators losing control. You can comment as the site admin, reply and vote. The
lines live in `js/content/chatter.js`.

**Icon and About.** `assets/internet-chaos-logo.png` is the game logo (master file); the
favicon, home-screen icon and top-bar logo are made from it. Settings ends with an About
the Developer section with the DPLDS logo.

Systems unlock as they become relevant: Editorial Policy, Actions (Stir the Pot, Hotfix,
Apology Video, plus one per era), random and choice events, Trending Topics, automation,
the analytics dashboard and seven themed **Internet Eras** with Clout perks.

## Project layout

```
index.html               entry point
css/game.css             all styles, in sections: base layout and Forum Era tokens, era
                         themes, Live Feed pages, the Frutiger Aero skin, Style Shop themes,
                         help/tour/sponsors/notifications/backups, the OS upgrade window,
                         the ChaosOS 8 Metro skin and its themes
assets/                  game logo (+ favicon, home-screen and top-bar copies), DPLDS logo
js/core.js               namespace, helpers, seeded RNG, event bus
js/format.js             number / money / time formatting (1K … 1Tg, or scientific)
js/config.js             balance values, policies, eras        ← tune here
js/content/*.js          buildings, upgrades, events, perks/actions, achievements,
                         chatter (Live Feed pages), cosmetics, sponsors
js/state.js              the single persistent state shape
js/systems/*.js          rules: modifiers, economy, effects, events, actions/automation,
                         progression (achievements + prestige), notification bonus,
                         operating system upgrade, game loop + offline sim
js/save.js               save/load, validation of untrusted data, export/import
js/audio.js, js/music.js Web Audio sound effects and generative music
js/ui/*.js               DOM rendering (HUD, website, shop, panels, dialogs, Live Feed pages,
                         help and tour, sponsors, bonus bubble, backups, Style Shop,
                         OS upgrade window and install screen)
js/main.js               boot, timing loop, autosave, notification wiring
tools/balance-sim.html   headless balance simulator using the real rules
tools/css-audit.js       developer check that finds unused CSS and compares stylesheets
tools/make-release.ps1   packs release/internet-chaos-web.zip for itch.io
```

The rules in `js/systems` never touch the DOM, so the UI, offline progress and the
balance simulator all run the same code.

## Balancing

Open `tools/balance-sim.html` through a local web server (for example
`python -m http.server`, then `http://localhost:8000/tools/balance-sim.html`) and press
**Run simulation**. A scripted player plays at high speed and prints a timeline and how
long every era takes. In the browser console, `ICHAOS_SIM.pacingText({ profile: 'casual',
seed: 1, minutes: 60 })` prints what a player meets and when (profiles: `attentive`,
`casual`, `idle`), including quiet stretches with nothing new.

Current pacing for an attentive scripted player (it catches most notifications and buys
ChaosOS 8 about ten minutes into the Social Media Era): the first era takes about 30
minutes, then roughly 15–20, 10–25, 25–35, 25–40 and 55–70 minutes, so eras still get longer
as the game goes on. A casual player reaches the first era in about 35 minutes, a mostly
idle one in about 45.

## Saves

- Autosave every 15 seconds and when the tab is hidden or closed.
- A backup copy is kept. A damaged save falls back to it, and unreadable data is kept aside rather than overwritten.
- **Settings → Download backup** saves an `ICHAOS1.` code to a file; **Import** accepts a
  code or that file, including `ZUHA1.` codes and browser saves from before the rename.
- Every loaded or imported field is type- and range-checked; unknown keys are dropped.
- Offline progress: 60% efficiency for up to 8 hours (the Night Shift perk raises both).
  Chaos, Stability, events and automation keep running while you are away.
