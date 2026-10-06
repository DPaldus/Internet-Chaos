# Internet Chaos

A browser idle game about growing one useless website into an absurd internet empire.
You name the website yourself on first launch (rename it any time from **Menu** or by
clicking the site's title).
You create Attention, Attention earns Money, Money buys more content. The catch is
**Chaos**: it multiplies everything, but past your servers' **Tolerance** it drains
**Stability**, and at 0% your site melts down.

## Run it

Open `index.html` in any modern browser. No server, build step or install is needed.
Progress saves to the browser's local storage automatically. Saves belong to that browser,
so use **Settings → Export save** to move a game to another browser or keep a backup.
Any static file host also works, since the game is plain HTML, CSS and JavaScript.

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
tabs). Achievements, Statistics, Settings and Sound live in the ☰ Menu.

**For new players.** The screen starts with only the button, the Shop and the goals. Shop
tabs, bulk buying (×10/×25/Max), the numbers summary, Chaos details and the 🎨 Style button
appear once they matter, each with a short note. A new game opens with a 7-step tour, and
the **?** button holds the core loop plus a glossary of every term (terms you have not met
yet are marked "Later"). The tour can be replayed from there. Code: `js/ui/help.js`.

**Sponsors.** Sponsorship upgrades and buildings put a sponsor on your website: a "Sponsored
by" strip of brand badges, sponsor ads in the ad slots and, for the Energy Drink
Sponsorship, a BLU VOLT can next to the button. Brands are defined in
`js/content/sponsors.js`. They are purely visual, since the bonus stays on the upgrade.

**About the Developer.** At the bottom of Settings, with the DPLDS logo (`assets/`).

**Style Shop (🎨).** Unlock and apply backgrounds, glass colors, website styles and effects.
Themes unlock through lifetime milestones (never Money), are purely cosmetic, and the choice
is saved with the game. Items are defined in `js/content/cosmetics.js`, styled in
`css/cosmetics.css`.

**Live Feed pages.** The Blog Post, Meme Page and Comment Section tiles at the top of the
Live Feed open living pages of your site: an article, a meme or a forum thread, with
comments that keep arriving. The Chaos meter sets the mood. Low Chaos is ordinary internet
chatter; higher Chaos brings arguments, trolls, pedants, absurd stories, spam, double posts
and moderators losing control. You can comment as the site admin, reply and vote. Feed
entries that mention one of these pages also open it. The lines live in
`js/content/chatter.js`.

Systems unlock as they become relevant: Editorial Policy, Actions (Stir the Pot, Hotfix,
Apology Video, plus one per era), random and choice events, Trending Topics, automation,
the analytics dashboard and seven themed **Internet Eras** with Clout perks.

## Project layout

```
index.html               entry point
css/style.css            layout, components, Forum Era theme tokens
css/themes.css           tokens for the later eras
css/chat.css             website-name dialog and Live Feed pages
css/cosmetics.css        Style Shop themes and window
css/aero.css             Frutiger Aero skin for the interface (loaded last, applies to every era)
css/guide.css            help window, tour, sponsors, About the Developer
assets/                  DPLDS logo images
js/core.js               namespace, helpers, seeded RNG, event bus
js/format.js             number / money / time formatting (1K … 1Tg, or scientific)
js/config.js             balance values, policies, eras        ← tune here
js/content/*.js          buildings, upgrades, events, perks/actions, achievements,
                         chatter (Live Feed page comments)
js/state.js              the single persistent state shape
js/systems/*.js          rules: modifiers, economy, effects, events, actions/automation,
                         progression (achievements + prestige), game loop + offline sim
js/save.js               save/load, validation of untrusted data, export/import
js/audio.js              Web Audio sound effects
js/ui/*.js               DOM rendering (HUD, website, shop, panels, dialogs, Live Feed pages)
js/main.js               boot, timing loop, autosave, notification wiring
tools/balance-sim.html   headless balance simulator using the real rules
```

The rules in `js/systems` never touch the DOM, so the UI, offline progress and the
balance simulator all run the same code.

## Balancing

Open `tools/balance-sim.html` (through the local server above) and press **Run
simulation**. A scripted player plays at high speed and prints when each building
first appears, the income curve and how long every era takes. With the current numbers
the scripted player clears the first era in about 45 minutes. Each later era takes
10–50 minutes, and a human will be slower.

## Saves

- Autosave every 15 seconds and when the tab is hidden or closed.
- A backup copy is kept. A damaged save falls back to it, and unreadable data is kept aside rather than overwritten.
- **Menu → Export save** creates an `ICHAOS1.` code. **Import** accepts a code or a `.txt` file,
  including `ZUHA1.` codes and browser saves from before the rename.
- Every loaded or imported field is type- and range-checked; unknown keys are dropped.
- Offline progress: 60% efficiency for up to 8 hours (the Night Shift perk raises both).
  Chaos, Stability, events and automation keep running while you are away.
