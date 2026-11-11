# The Eldritch Ledger (ledger.eldritzh.com)

The community pages of the Eldritzh stream. They appear on eldritzh.com (Fourthwall) through one script; this repository only serves them.

**Don't edit `data/` by hand.** Streamer.bot's `Website :: Publish` action rewrites it from what happens on stream and commits it here. Everything else is safe to edit on github.com.

| Path | What |
|---|---|
| `embed.js` | Draws every page. Fourthwall loads it. |
| `index.html` | Preview of all pages at ledger.eldritzh.com |
| `data/` | Written by Streamer.bot: `story_chapters.json`, `story_state.json`, `commands.md`, `guide.md`, `pacts.json`, `circles.json`, `codex.json`, `partners.json` (+ `logos/`), `sounds.json`, `bestiary.json`, `congregation.json`, `order.json`, `remembrance.json`, `investigator.json`, `covenant.json`, `fishing.json`, `people.json`, `patchnotes.md`, `about.md`, `nav.json`, `site.json` |
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
