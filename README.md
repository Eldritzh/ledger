# The Eldritch Ledger (ledger.eldritzh.com)

The community pages of the Eldritzh stream. They appear on eldritzh.com (Fourthwall) through one script; this repository only serves them.

**Don't edit `data/` by hand.** Streamer.bot's `Website :: Publish` action rewrites it from what happens on stream and commits it here. Everything else is safe to edit on github.com.

| Path | What |
|---|---|
| `embed.js` | Draws every page. Fourthwall loads it. |
| `index.html` | Preview of all pages at ledger.eldritzh.com |
| `data/` | Written by Streamer.bot: `story_chapters.json`, `story_state.json`, `commands.md`, `pacts.json`, `circles.json`, `codex.json`, `partners.json`, `site.json` |
| `CNAME` | The custom domain for GitHub Pages |
| `.github/workflows/pages.yml` | Publishes the site on every push |

## A page on Fourthwall

Site design → Layout → choose or create the page → Add page section → **Custom HTML**:

```html
<div data-eldr-page="story"></div>
<script src="https://ledger.eldritzh.com/embed.js" defer></script>
```

Pages: `story`, `commands`, `pacts`, `circles`, `codex`, `partners`.

Options on the div: `data-eldr-game="hunt-showdown"` (pacts: open on that game), `data-eldr-refresh="5"` (minutes between quiet re-checks while the page is open, 0 = off), `data-eldr-title="0"` (no page header).
