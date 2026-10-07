# Internet Chaos · development notes

How the game is put together. The player-facing overview is the [README](../README.md).

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
For players, upload the production build instead (see **Production build** below).

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
sparse pluck melody. Mango OS has bright, airy keynote-style electronica: wide pads that
breathe with the beat, a glassy arpeggio, sub bass, finger snaps, a shaker and a soft
gliding lead. Prism OS has dreamy synthwave (pads through a sweeping filter, a saw
arpeggio, a roomy snare) and ChaosOS 95 plays sound-card chiptune (square-wave arpeggios, a
triangle bass, a looping lead and noise drums). None of them quite loops. Music starts on the first click, pauses in hidden
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
+10% offline efficiency. The bonuses of every installed system stack, each from its own era
on (which only matters after a reboot, see below). Installing plays a
Windows 8 style setup screen, then the whole interface turns into flat Metro tiles: colored
live tiles in the top bar, a navigation rail on wide screens, tile upgrades, pivot tabs,
full-width confirmation bands and a sad blue screen for meltdowns. The music switches to a
lo-fi Metro beat. The Style Shop starts over: the Aero themes stay behind, and ChaosOS 8 has
its own 24 themes (18 to unlock), with milestones counted from the moment of the upgrade.

From the Viral Era on, *Mango OS Liquid Glass* follows for $20Qa: Attention ×1.05, Money per
Attention ×1.05, server capacity ×1.1, Hotfix cooldown ×0.75, Stability repair ×1.1 and +2
hours of offline progress. A "Mango OS is available" notification announces it. The install
screen greets you with a big handwritten "hello" and a progress bar, a startup chime plays,
and the interface becomes macOS-style liquid glass: a desktop menu bar with a clock (File,
Edit, View, Window and Help open Settings, the Style Shop, Statistics, Eras and Help), a
colorful wavy wallpaper, a floating glass toolbar with colored icon orbs, a glass sidebar,
window lights on every window, frosted cards, round switches and notification-style toasts.
Its Style Shop has 24 themes of its own (18 to unlock): wallpapers, accent colors, website
styles (Liquid Glass, Notes, Widgets, Keynote, Spatial…) and light effects.

From the AI Era on, *Prism OS Hologram* costs $200Qi: Attention and Money per Attention
×1.05, server capacity ×1.1, +10 automatic clicks, good events ×1.1 as likely and +10%
offline efficiency. Its setup screen is a glowing projection; the interface becomes floating
holograms in deep violet space: dark translucent windows with an iridescent edge, neon glow,
glowing icon glyphs and a column of hologram buttons. 16 themes (10 to unlock).

From the Post-Internet Era on, *ChaosOS 95 Retro CRT* costs $3Sp: Attention and Money per
Attention ×1.05, blue screens 30% rarer and shorter, Stability repair ×1.25, click power ×3
and +4 hours of offline progress. Setup is a black CRT turning on with a segmented progress
bar; then everything is grey bevelled windows with navy title bars on a teal desktop, a
taskbar with a working Start menu and clock, desktop icons, yellow help balloons for
notifications, a proper blue screen for meltdowns and CRT scanlines over the whole screen.
16 themes (10 to unlock).

Rules: `js/systems/os.js`, `Z.OSES` in `js/config.js` and the stacking in
`js/systems/modifiers.js`; window, setup screen, rail, menu bar and taskbar: `js/ui/os.js`;
look: sections 7–11, 14 and 15 of `css/game.css`. "ChaosOS", "Mango OS" and "Prism OS" are
made-up names, so the game stays clear of real trademarks.

**Era shops.** The 30 buildings keep the same ids and numbers in every era, but each era
dresses them in its own names, icons and flavor lines (171 in total, none repeated): a
Forum Thread in the Forum Era is a Status Update, a Six-Second Loop, an Engagement Bait
Post, a Prompt-Written Article, a Thought Leadership Post and finally an Echo Post. Each
building is defined under the name of the era it arrives in; `ERA_NAMES` in
`js/content/buildings.js` holds every later era's version, and `Z.skinBuildings(era)` swaps
them in when the era changes. Texts that name buildings read the current names.

**Era mechanics.** Every era has a signature mechanic in the website window
(`js/systems/eramech.js`, drawn by `js/ui/eramech.js`): flame wars to douse (Forum), a friend
network worth up to +30% Attention (Social Media), trend alerts with a 20-second countdown
(Viral), a feed switch between calm and max engagement (Algorithm), AI claims to trust or
fact-check (AI), quarterly Money/s targets from shareholders (Corporate) and bot swarms that
may help or hurt (Post-Internet and later). Ignoring them never costs much. A quarter is
judged on its average Money/s (money earned since it began ÷ 180 s), and the next target is
that average × 1.2, so one lucky or unlucky moment does not decide it. While you are away the
mechanics pause (an alert waits for you, the quarter starts over). The running state is
saved, so reloading the page neither clears a flame war nor keeps its bonus without it.

**Era challenges.** Three optional goals per era (`js/content/challenges.js`, rules in
`js/systems/meta.js`), shown in the Eras window. Each completed one adds 8–15% to the Clout
for the next era. Some complete when reached ("Use Fake Leak 4 times"); others hold for the
whole era ("no meltdowns", "within 30 minutes") and are sealed when it ends.

**Era records.** Every finished era is stored in `s.history` (time, Clout, Attention,
meltdowns, challenges, operating system, date) and listed in ☰ Menu → Era records with the
fastest run of each era.

**Reboot the Internet (🔁).** The layer above the eras (`js/content/reboot.js`, rules in
`js/systems/reboot.js`, window in `js/ui/reboot.js`). Once the era goal of the Post-Internet
Era (or any later era) is reached, the player may reboot: the last era is recorded, and the
game starts over in the Forum Era on the next internet version (v2, v3…).
- Lost: the era, Clout, lifetime Clout (and its Attention bonus) and Clout perks.
- Kept: Bandwidth and its upgrades, the operating system and its themes (each system's
  bonuses come back when the new internet reaches its era), achievements, era records,
  completed challenges, the daily streak, statistics and settings.
- Bandwidth = 10 × √(lifetime Clout incl. this era's ÷ 2M) × protocol reward × Wayback
  Machine. A full first internet pays about 10; going on to later eras pays more with
  diminishing returns (about ×2.7 per extra era).
- 11 Bandwidth upgrades (Attention, clicks, start Clout, Tolerance, luck, offline, automation
  from the start, Clout ×, challenge bonus ×, lower era goals, more Bandwidth).
- Protocols: an optional handicap for the next internet (Dial-up Only, Ad-Free, No Rules,
  Glass Servers); rebooting from it pays ×1.4–1.6 Bandwidth. Shown as a chip above the shop.
- Records: every era record notes its internet version; the fastest full internet (all seven
  eras) is shown in Reboot, Era records and Statistics. Six achievements belong to it.

The Eras window shows a Reboot card from the Corporate Internet Era on, ☰ Menu has
🔁 Reboot the Internet, and rebooting plays a short BIOS boot screen (a plain fade with
reduced motion).

**Daily challenge.** The calendar day picks a modifier (a bonus with a twist, the same for
everyone that day) and a goal. The goal pays Clout; consecutive days build a streak (up to
+150%). It appears in Next Goals, as a chip above the shop and in ☰ Menu. The simulator never
sets one, so balancing ignores it.

**Share card.** ☰ Menu → Share your website draws a 1200×630 PNG of the site (name, era,
address, big numbers) in the colors of the installed system, to download or copy
(`js/ui/share.js`).

**Keyboard shortcuts.** Space clicks the big button, 1–4 switch shop tabs, B buys the
best-value building of the open tab, U the cheapest affordable upgrade, E/S/D/R/H open Eras,
Style, Daily, Records and Help (`js/ui/keys.js`, also listed in Help).

**Languages.** English and Czech (Settings → Language). `js/i18n.js` translates the page as
it is drawn with a MutationObserver, using `js/lang/cs.js`: exact strings plus patterns for
strings with numbers and names. The interface, help, windows and systems are translated; game
content (building, upgrade and event names, flavor lines and comments) stays in English. A
new language is one more file in `js/lang/` and an entry in `Z.i18n.LANGS`.

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
                         the ChaosOS 8, Mango OS, Prism OS and ChaosOS 95 skins and themes,
                         era mechanics, challenges, records, daily challenge, sharing,
                         Reboot the Internet
assets/                  game logo (+ favicon, home-screen and top-bar copies), DPLDS logo
js/core.js               namespace, helpers, seeded RNG, event bus
js/i18n.js, js/lang/     translation of the page (Czech in js/lang/cs.js)
js/format.js             number / money / time formatting (1K … 1Tg, or scientific)
js/config.js             balance values, policies, eras        ← tune here
js/content/*.js          buildings, upgrades, events, perks/actions, achievements,
                         chatter (Live Feed pages), cosmetics, sponsors, challenges,
                         reboot (Bandwidth upgrades and protocols)
js/state.js              the single persistent state shape
js/systems/*.js          rules: modifiers, economy, effects, events, actions/automation,
                         progression (achievements + prestige), notification bonus,
                         operating system upgrade, era mechanics, meta progression
                         (records, challenges, daily), Reboot the Internet,
                         game loop + offline sim
js/save.js               save/load, validation of untrusted data, export/import
js/audio.js, js/music.js Web Audio sound effects and generative music
js/ui/*.js               DOM rendering (HUD, website, shop, panels, dialogs, Live Feed pages,
                         help and tour, sponsors, bonus bubble, backups, Style Shop,
                         OS upgrade window and install screen, era mechanic box, records,
                         challenges and daily window, Reboot window, share card, keyboard,
                         DEV menu)
js/main.js               boot, timing loop, autosave, notification wiring
tools/balance-sim.html   headless balance simulator using the real rules
tools/selftest.html      automatic checks of the rules (see "Self-test" below)
tools/css-audit.js       developer check that finds unused CSS and compares stylesheets
tools/build.py           production build: dist/ (minified, one script, no source maps)
                         and release/internet-chaos-web.zip
tools/make-release.ps1   runs tools/build.py
tools/screenshots.py     README screenshots, taken from the real game (drives
                         tools/screenshot.html in headless Edge or Chrome)
```

The rules in `js/systems` never touch the DOM, so the UI, offline progress and the
balance simulator all run the same code.

## DEV menu

Press **F8** (or Ctrl+Shift+D) in the game to open a testing panel (`js/ui/dev.js`): add or
set Money (`25Qa`, `3.5T`, `1e15`…), Attention and Clout, reach the era goal, start the
next era the normal way (with Clout) or switch straight to any era, forwards or backwards
(a fresh start without Clout), switch to any operating system, newer or older, add
buildings, get the available upgrades for free, unlock every theme and achievement, reveal the whole interface,
trigger this era's mechanic, complete its challenges, roll or finish a daily challenge,
reboot the internet at once, add Bandwidth or clear every reboot,
fast-forward 10 minutes or an hour, and fix or melt down the site. Changes are saved right
away, so use a backup if you want to keep a real game. The player build leaves the menu
out; `python tools/build.py --dev` keeps it.

## Production build

`python tools/build.py` (Python 3.8+) makes `dist/`, the folder to upload, and
`release/internet-chaos-web.zip` from it. The scripts listed in `index.html` are joined in
order into `js/game.min.js` and minified with esbuild (comments and whitespace removed,
local names shortened, no source map); `css/game.css` and `index.html` are minified too and
get cache-busting version stamps. esbuild is downloaded once from the npm registry into
`tools/.esbuild/` and checked against the registry's SHA-512. The readable source stays in
`js/` and `css/`. After changing `index.html`'s script list, nothing else needs updating.

## Self-test

Open `tools/selftest.html` through a local web server (as for the balance simulator). It
runs about 270 checks on fresh in-memory games, never your save: era challenges (counting
"this era", completing, sealing and the Clout bonus), every era mechanic and its buttons,
era records, the daily challenge (same for everyone, modifiers, streak and reward), the
operating systems (stacking bonuses, install order, default themes, effect types), saves
(new fields kept, old saves upgraded, damaged values repaired), offline progress with the
mechanics, Czech texts of the new content, two simulated playthroughs and Reboot the
Internet (when it is possible, what resets and what stays, every Bandwidth upgrade,
protocols, records, saves and the pacing of a second internet). The page title
reads `passed N/N` or `FAILED k/N`. Run it after changing rules or content.

## README screenshots

`python tools/screenshots.py` retakes every picture in `docs/images/`, and
`python tools/screenshots.py prism-os` retakes just one. For each shot it serves the project
locally, opens `tools/screenshot.html?shot=<name>` in headless Edge or Chrome with a
throwaway profile and saves a 1600×900 PNG. The stage page plays a game with the balance
simulator (seed 1) up to a set time, dresses it (operating system, site name, Live Feed),
loads the real game in a frame and sets the scene, such as an open window or a running era
mechanic. The shot list and the simulated play time for each era are at the top of the
stage page; if balancing changes, adjust `stopAt` so each shot still lands in its era (the
console warns when it does not). Your own browser and its saves are never touched. The
`tools/` folder is not part of the build.

## Balancing

Open `tools/balance-sim.html` through a local web server (for example
`python -m http.server`, then `http://localhost:8000/tools/balance-sim.html`) and press
**Run simulation**. A scripted player plays at high speed and prints a timeline and how
long every era takes. In the browser console, `ICHAOS_SIM.pacingText({ profile: 'casual',
seed: 1, minutes: 60 })` prints what a player meets and when (profiles: `attentive`,
`casual`, `idle`), including quiet stretches with nothing new.

Current pacing for an attentive scripted player (it catches most notifications, completes
some era challenges by itself and buys each operating system 4–12 minutes into its era): the
first era takes about 27–34 minutes, then roughly 13–18, 17–25, 16–28, 24–36, 40–48 and
64–94 minutes (seeds 1–6), so eras still get longer as the game goes on. A casual player reaches the
first era in about 35 minutes, a mostly idle one in about 45.

`ICHAOS_SIM.run({ seed: 1, hours: 20, maxEras: 7, reboots: 3 })` also reboots at the end of
each Post-Internet Era and spends Bandwidth (cheapest upgrade first). A full internet takes
about 4 hours the first time, then about 2.5 hours (v2), 2¼ hours (v3) and 1½ hours (v4),
with each reboot paying about 9–10 Bandwidth.

## Saves

- Autosave every 15 seconds and when the tab is hidden or closed.
- A backup copy is kept. A damaged save falls back to it, and unreadable data is kept aside rather than overwritten.
- **Settings → Download backup** saves an `ICHAOS1.` code to a file; **Import** accepts a
  code or that file, including `ZUHA1.` codes and browser saves from before the rename.
- Every loaded or imported field is type- and range-checked; unknown keys are dropped.
- Offline progress: 60% efficiency for up to 8 hours (the Night Shift perk raises both).
  Chaos, Stability, events and automation keep running while you are away; the era
  mechanics wait.
