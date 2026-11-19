# The Eldritch Ledger (ledger.eldritzh.com)

The community pages of the Eldritzh stream. They appear on eldritzh.com (Fourthwall) through one script; this repository only serves them.

**Don't edit `data/` by hand.** Streamer.bot's `Website :: Publish` action rewrites it from what happens on stream and commits it here. Everything else is safe to edit on github.com.

| Path | What |
|---|---|
| `embed.js` | Draws every page. Fourthwall loads it. |
| `bar.js` | The event bar at the top of every eldritzh.com page: the special events running now (Yule, Moon Night, Lucia, a Lingering Omen…) and a banner for each charity drive and sponsored campaign. Fourthwall's header code loads it. |
| `index.html` | Preview of all pages at ledger.eldritzh.com |
| `data/` | Written by Streamer.bot: `story_chapters.json`, `story_state.json`, `commands.md`, `guide.md`, `pacts.json`, `circles.json`, `codex.json`, `partners.json` (+ `logos/`), `sounds.json`, `bestiary.json`, `congregation.json`, `order.json`, `remembrance.json`, `investigator.json`, `covenant.json`, `fishing.json`, `people.json`, `patchnotes.md`, `about.md`, `nav.json`, `events.json`, `site.json` |
| `CNAME` | The custom domain for GitHub Pages |
| `.github/workflows/pages.yml` | Publishes the site on every push |

## A page on Fourthwall

Site design → Layout → choose or create the page → Add page section → **Custom HTML**:

```html
<div data-eldr-page="story"></div>
<script src="https://ledger.eldritzh.com/embed.js" defer></script>
```

Pages: `hub`, `story`, `commands`, `patchnotes`, `pacts`, `circles`, `sounds`, `rift`, `investigator` (or `talents`: the same page opened on the talent trees), `codex`, `order`, `fishing`, `covenant`, `congregation`, `bestiary`, `remembrance`, `partners`, `about`.

Every page shows a row of links to the others, read from `data/nav.json` (Streamer.bot's `website\nav.txt`: page, label, address on eldritzh.com). `hub` is the page that lists them all, so the shop's own menu needs one entry.

Partner logos live in `data/logos/` (uploaded by `Website :: Publish` from Streamer.bot's `partners\public\logos\`; old ones are removed when no partner uses them).

Options on the div: `data-eldr-game="hunt-showdown"` (pacts: open on that game), `data-eldr-refresh="5"` (minutes between quiet re-checks while the page is open, 0 = off), `data-eldr-title="0"` (no page header), `data-eldr-nav="0"` (no row of links).

## The event bar (every page)

Fourthwall: Site design → Style → Edit HTML code (header code), once:

```html
<script src="https://ledger.eldritzh.com/bar.js" defer></script>
```

It runs by itself. `data/events.json` comes from Streamer.bot's season engine (`seasons.txt`): what runs now plus the calendar's next 60 days, so the bar turns over on the right day even while Streamer.bot is off. When two events overlap (Yule and Moon Night) they share one strip: their colours blend and the particles mix. Weekly things (derbies, the tide, Dares) never show.

Under it, a banner for each **charity** (with its progress), each **campaign with an end date** and each running **sponsored giveaway**, from `data/partners.json`. Always-on partners without dates stay on the Partners page. Force one on or off with `!partner set <id> banner=on|off|auto`. Ads always carry their label (Ad / Partner); visitors can hide a banner with ×.

Options on the script tag: `data-eldr-events="0"`, `data-eldr-banners="0"`, `data-eldr-next="0"` (no "Next: …" teaser), `data-eldr-mount="#id"` (draw inside that element). Try a date: add `?eldrbar=2026-12-13` to a page address.
