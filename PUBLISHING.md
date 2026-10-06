# Zveřejnění hry Internet Chaos

Hra je čistě webová (HTML, CSS, JavaScript), takže ji jde nahrát kamkoli, kde se dají
hostovat statické soubory. Nejjednodušší jsou **itch.io** (komunita hráčů indie her) a
**GitHub Pages** (vlastní odkaz zdarma). Obojí zvládneš za pár minut.

## 1. Připrav balíček

Spusť ve složce hry:

```
pwsh -File tools\make-release.ps1
```

Vznikne `release\internet-chaos-web.zip` (index.html v kořeni + `css/`, `js/`, `assets/`).
Vývojářské nástroje (`tools/`) ani soubory s uložením do balíčku nejdou.

## 2. itch.io (doporučeno)

1. Přihlas se na [itch.io](https://itch.io) → **Upload new project**.
2. **Kind of project:** HTML.
3. **Uploads:** nahraj `internet-chaos-web.zip` a zaškrtni **This file will be played in the browser**.
4. **Embed options:**
   - Viewport: **1280 × 800** (hra se přizpůsobí i menší šířce).
   - Zaškrtni **Mobile friendly** (orientace Portrait nebo Landscape, obojí funguje).
   - Zaškrtni **Fullscreen button**.
   - Volitelně **Click to launch in fullscreen**, pokud chceš hru přes celou obrazovku.
5. **Classification:** Game · **Genre:** Simulation (případně Strategy) · **Tags:** viz níže.
6. **Pricing:** No payments (nebo „Donate“, když chceš dobrovolné příspěvky).
7. Nahraj screenshoty (stačí 3–5 z prohlížeče) a jako **Cover image** použij logo
   `assets/internet-chaos-logo.png` (itch doporučuje 630 × 500, ořízne si ho samo).
8. Ulož jako **Draft**, vyzkoušej odkaz „View page“, a když vše funguje, přepni na **Public**.

Ukládání funguje i na itch.io (prohlížeč si pozici pamatuje), jen platí, že je vázané na
konkrétní prohlížeč. Hráči si zálohu stáhnou v ☰ Menu → Settings & saves → Download backup.

### Texty pro stránku na itch.io (k vložení)

**Title:** Internet Chaos

**Short description / tagline:**
Grow one useless website into an absurd internet empire. Keep the Chaos just below meltdown.

**Description:**

> You just made a website. Nobody has seen it. Yet.
>
> Click to create content, earn Attention and Money, and buy everything the internet is
> made of: blog posts, meme pages, comment sections, clickbait factories, bot farms and
> influencer houses.
>
> But every viral hit brings **Chaos**. Chaos multiplies everything you earn, until it
> pushes past what your servers can take and your site melts down. Hire moderators, buy
> servers, pick your editorial policy and decide how close to the edge you dare to live.
>
> - Name your own website and watch it grow from a GeoCities homepage into an empire
> - Seven Internet Eras, from the Forum Era to the Post-Internet Era, each with its own look
> - Living comment sections that get more unhinged as Chaos rises
> - Sponsors, scandals, viral posts, outages and decisions with consequences
> - Catch floating notifications for surprise bonuses
> - A Frutiger Aero style shop with themes to unlock
> - Calm generative ambient music, offline progress, no ads, no sign-up
>
> Made by DPLDS, a one-man indie studio from the Czech Republic.

**Tags:** idle, incremental, clicker, simulation, satire, retro, frutiger-aero, browser, singleplayer, humor

## 3. GitHub Pages (vlastní odkaz zdarma)

1. Založ si účet na [github.com](https://github.com) a vytvoř nový veřejný repozitář,
   třeba `internet-chaos`.
2. **Add file → Upload files** a přetáhni obsah složky hry (`index.html`, `css`, `js`,
   `assets`; `tools` a `save-from-desktop-app.txt` vynech). Potvrď **Commit changes**.
3. **Settings → Pages → Branch:** `main`, složka `/ (root)` → **Save**.
4. Za minutu je hra na `https://<tvé-jméno>.github.io/internet-chaos/`.

## Po každé úpravě hry

Spusť znovu `tools\make-release.ps1` a na itch.io nahraj nový zip (starý smaž), nebo na
GitHubu nahraj změněné soubory. Uložené hry hráčů zůstanou, protože se ukládají v jejich
prohlížeči.
