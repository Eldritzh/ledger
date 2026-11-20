/* =====================================================================================
   ⛧ THE ELDRITCH LEDGER — bar.js  (the site-wide event bar)
   A thin bar at the top of every eldritzh.com page: the special events running now (Yule, Moon Night,
   Lucia, a Lingering Omen ...) blended into one strip when several run at once, and under it a banner for
   each announced charity drive and sponsored campaign. Everything is automatic:

     events   data/events.json   written by Season :: Core (seasons.txt), pushed by Website :: Publish.
                                 It also lists the calendar's next 60 days, so the bar turns over on the
                                 right day even while Streamer.bot is off. Weekly things (derbies, tides,
                                 Dares, candles on their own) are never shown as events.
     banners  data/partners.json written by Partners :: Core. A banner is shown for every charity, every
                                 campaign with an end date, and every running sponsored giveaway. A partner
                                 file's "banner": true / false forces it on or off (!partner set <id> banner=on|off|auto).
                                 Always-on partners without dates (G-Portal, Wehype) stay on the Partners page.

   Fourthwall: Site design > Style > Edit HTML code (header code), once:
     <script src="https://ledger.eldritzh.com/bar.js" defer></script>
   Options on that script tag:
     data-eldr-events="0"        no event strip          data-eldr-banners="0"   no banners
     data-eldr-mount="#id"       draw inside that element instead of at the top of the page
     data-eldr-next="0"          no "Next: ..." teaser for an event starting within 7 days
   Test a date: add ?eldrbar=2026-12-13 to any page address (Lucia), ?eldrbar=2026-11-24 (Yule + Moon Night).
   1.1.0 (19 Nov): the stream's own events from Website :: Publish next to the seasons: the Onyx Fair (kind "fair",
   a violet onyx diamond and little flares), Happy Hour and the Stars Are Right (kind "timed", with "until"), each with
   its own small mark (look.sig: dot, diamond, ring, star) and particles (flares, coins).
   1.1.1 (20 Nov): the bar no longer draws over the shop's own menu, cart or pop-ups on phones (it sat on top of the
   menu drawer). It stays on its own low layer, and steps out of sight while the shop has an overlay open.
   ===================================================================================== */
(function () {
  'use strict';
  if (window.__eldrBar) { window.__eldrBar.refresh(); return; }

  var me = document.currentScript;
  var BASE = (me && me.src) ? me.src.replace(/[^\/]*(\?.*)?$/, '') : 'https://ledger.eldritzh.com/';
  var VERSION = '1.1.1';
  var OPT = function (k, d) { var v = me && me.getAttribute('data-eldr-' + k); return v == null || v === '' ? d : v; };
  var TZ = 'Europe/Stockholm';
  var GOLD = '#D4AF37', GREEN = '#52B788';

  // ------------------------------------------------------------------ helpers
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!attrs.hasOwnProperty(k) || attrs[k] == null || attrs[k] === false) continue;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style' && typeof attrs[k] === 'object') { for (var s in attrs[k]) n.style.setProperty(s, attrs[k][s]); }
      else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false || c === '') return;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return n;
  }
  function color(c, d) { return /^#[0-9a-f]{3,8}$/i.test(String(c || '')) ? c : d; }
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // dates: the stream's calendar runs on Stockholm time; "yyyy-mm-dd" strings compare as text
  function todayStr() {
    var t = (location.search.match(/[?&]eldrbar=(\d{4}-\d{2}-\d{2})/) || [])[1];
    if (t) return t;
    try { return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function nowUnix() {
    var t = (location.search.match(/[?&]eldrbar=(\d{4}-\d{2}-\d{2})/) || [])[1];
    return t ? Date.parse(t + 'T12:00:00Z') / 1000 : Date.now() / 1000;
  }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }
  function nice(s) { var d = new Date(s + 'T12:00:00Z'); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); }
  function short(s) { var d = new Date(s + 'T12:00:00Z'); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); }

  function untilText(e, today) {
    if (e.kind === 'timed' && e.until) {
      var m = Math.round((e.until - nowUnix()) / 60);
      if (m < 60) return 'on stream now · ' + Math.max(1, m) + ' min left';
      return 'on stream now · until ' + new Date(e.until * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
    }
    if (e.kind === 'omen' && e.until) {
      var s = e.until - nowUnix();
      if (s < 36 * 3600) return 'lingers ' + Math.max(1, Math.round(s / 3600)) + ' more hours';
      return 'lingers ' + Math.round(s / 86400) + ' more days';
    }
    var n = daysBetween(today, e.to);
    if (n <= 0) return e.from === e.to ? 'tonight only' : 'last day today';
    if (n === 1) return 'until tomorrow';
    return 'until ' + nice(e.to);
  }

  // ------------------------------------------------------------------ data
  function bucket() { return Math.floor(Date.now() / 60000); }
  function load(file) {
    return fetch(BASE + 'data/' + file + '?v=' + bucket(), { cache: 'no-store', credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error(file + ': ' + r.status); return r.json(); })
      .catch(function () { return null; });
  }

  function runningEvents(data, today) {
    if (!data || data.enabled === false || !Array.isArray(data.events)) return [];
    var now = nowUnix();
    return data.events.filter(function (e) {
      if (!e || !e.name) return false;
      if (e.kind === 'omen') return e.until ? e.until > now : (e.from <= today && today <= e.to);
      if (e.kind === 'timed') return !!e.until && e.until > now;          // happy hour, the Stars: gone the moment they end
      if (e.from <= today && today <= e.to) return true;
      return !!(e.held && e.now && today <= addDays(e.to, 1));   // a stream that ran past midnight keeps its season
    }).sort(function (a, b) { return (b.priority || 0) - (a.priority || 0); });
  }
  function nextEvent(data, today, running) {
    if (!data || data.enabled === false || !Array.isArray(data.events)) return null;
    var ids = running.map(function (e) { return e.id; });
    var up = data.events.filter(function (e) { return e.kind !== 'omen' && e.kind !== 'timed' && e.from > today && daysBetween(today, e.from) <= 7 && ids.indexOf(e.id) < 0; });
    up.sort(function (a, b) { return a.from < b.from ? -1 : a.from > b.from ? 1 : (b.priority || 0) - (a.priority || 0); });
    return up[0] || null;
  }

  function bannerPartners(data, today) {
    if (!data || !Array.isArray(data.partners)) return [];
    return data.partners.filter(function (p) {
      if (!p || !p.name) return false;
      if (p.start && today < p.start) return false;
      if (p.end && today > p.end) return false;
      if (p.banner === false || p.banner === 'off') return false;
      if (p.banner === true || p.banner === 'on') return true;
      return p.type === 'charity' || !!p.end || !!(p.giveaway && /open|run|live|start/i.test(String(p.giveaway.status || '')));
    }).sort(function (a, b) { return (a.type === 'charity' ? 0 : 1) - (b.type === 'charity' ? 0 : 1) || (a.rank || 0) - (b.rank || 0); })
      .filter(function (p) { return store('eldrTbHide:' + p.id + ':' + (p.end || '')) !== '1'; });
  }

  // ------------------------------------------------------------------ styles
  function injectStyles() {
    if (document.getElementById('eldr-tb-style')) return;
    if (!document.querySelector('link[href*="family=Cinzel"]')) {
      var f = document.createElement('link'); f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Montserrat:wght@300;400;600&display=swap';
      document.head.appendChild(f);
    }
    var css = [
      '.eldr-tb{all:initial;display:block;position:relative;z-index:0;isolation:isolate;font:300 13px/1.45 Montserrat,system-ui,sans-serif;color:#d9d6cc;-webkit-font-smoothing:antialiased}',
      '.eldr-tb *,.eldr-tb *::before,.eldr-tb *::after{box-sizing:border-box}',
      // the event strip
      '.eldr-tb-ev{position:relative;overflow:hidden;background:#07080a;border-bottom:1px solid #1f2328}',
      '.eldr-tb-ev::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:var(--eldr-tb-line)}',
      '.eldr-tb-glow{position:absolute;inset:0;background:var(--eldr-tb-glow);opacity:.55;pointer-events:none;animation:eldrTbBreathe 9s ease-in-out infinite}',
      '.eldr-tb-row{position:relative;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px 18px;max-width:1280px;margin:0 auto;padding:8px 44px 8px 16px;min-height:40px}',
      '.eldr-tb-seg{display:flex;align-items:center;gap:10px;min-width:0}',
      '.eldr-tb-sig{flex:none;width:9px;height:9px;border-radius:50%;background:var(--a);box-shadow:0 0 10px 2px var(--g)}',
      // 1.1.0: a small mark of its own for the stream's events
      '.eldr-tb-sig.diamond{border-radius:1px;transform:rotate(45deg);width:8px;height:8px;background:linear-gradient(135deg,#f1e9ff,var(--a) 45%,#1a1026)}',
      '.eldr-tb-sig.ring{background:none;border:2px solid var(--a);width:10px;height:10px}',
      '.eldr-tb-sig.star{background:none;box-shadow:none;width:auto;height:auto;border-radius:0;color:var(--a);text-shadow:0 0 8px var(--g);font-size:13px;line-height:1}',
      '.eldr-tb-sig.star::before{content:"\\2726"}',
      '.eldr-tb-name{font-family:Cinzel,serif;font-weight:700;font-size:13.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--a);text-shadow:0 0 12px var(--g);white-space:nowrap}',
      '.eldr-tb-when{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9a968b;white-space:nowrap}',
      '.eldr-tb-text{color:#d9d6cc;opacity:.9;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.eldr-tb-sep{flex:none;width:1px;height:22px;background:linear-gradient(var(--l),var(--r))}',
      '.eldr-tb-curse .eldr-tb-name{font-style:italic}',
      '.eldr-tb-candles{display:inline-flex;gap:3px;align-items:flex-end;margin-left:2px}',
      '.eldr-tb-candles i{display:block;width:4px;height:12px;border-radius:1px;background:#3a3f46}',
      '.eldr-tb-candles i.on{background:#f3e9d2;box-shadow:0 -5px 6px -1px #ffb347}',
      '.eldr-tb-candles i.now{outline:1px solid var(--a);outline-offset:1px}',
      '.eldr-tb-rune{font-size:12px;color:#d9d6cc;white-space:nowrap}',
      '.eldr-tb-rune b{font-weight:600;color:var(--a)}',
      '.eldr-tb-next{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9a968b;white-space:nowrap}',
      '.eldr-tb-next b{font-weight:600;color:var(--a)}',
      '.eldr-tb-det{position:relative;display:none;max-width:1280px;margin:0 auto;padding:0 44px 9px 16px;text-align:center;font-size:12.5px;color:#cfcabd}',
      '.eldr-tb-det b{font-family:Cinzel,serif;font-weight:700;letter-spacing:.06em;color:var(--a)}',
      '.eldr-tb-open .eldr-tb-det{display:block}',
      '.eldr-tb-multi .eldr-tb-more{display:block}',
      '.eldr-tb-more{position:absolute;right:10px;top:20px;transform:translateY(-50%);display:none;background:none;border:0;color:#9a968b;font:inherit;font-size:16px;cursor:pointer;padding:4px 8px}',
      // particles
      '.eldr-tb-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
      '.eldr-tb-fx span{position:absolute;display:block;border-radius:50%;opacity:0;will-change:transform,opacity}',
      '.eldr-tb-fx .snow{width:3px;height:3px;background:#fff;top:-6px;animation:eldrTbFall linear infinite}',
      '.eldr-tb-fx .motes{width:3px;height:3px;background:var(--c);box-shadow:0 0 6px var(--c);bottom:-6px;animation:eldrTbRise linear infinite}',
      '.eldr-tb-fx .embers{width:2px;height:2px;background:var(--c);box-shadow:0 0 5px var(--c);bottom:-4px;animation:eldrTbRise linear infinite}',
      '.eldr-tb-fx .stars{width:2px;height:2px;background:#fff;box-shadow:0 0 4px var(--c);animation:eldrTbTwinkle ease-in-out infinite}',
      '.eldr-tb-fx .ash,.eldr-tb-fx .smoke{width:4px;height:4px;background:var(--c);filter:blur(1px);top:-6px;animation:eldrTbFall linear infinite}',
      '.eldr-tb-fx .flares{width:3px;height:3px;background:var(--c);box-shadow:0 0 0 0 var(--c);animation:eldrTbFlare ease-out infinite}',
      '.eldr-tb-fx .coins{width:4px;height:4px;border-radius:1px;background:var(--c);box-shadow:0 0 6px var(--c);top:-6px;animation:eldrTbCoin linear infinite}',
      '@keyframes eldrTbFlare{0%,70%{transform:scale(.2);opacity:0;box-shadow:0 0 0 0 var(--c)}78%{opacity:1}100%{transform:scale(1);opacity:0;box-shadow:0 0 0 9px transparent,0 0 14px 4px var(--c)}}',
      '@keyframes eldrTbCoin{0%{transform:translate(0,0) rotateY(0);opacity:0}15%{opacity:.9}100%{transform:translate(-6px,64px) rotateY(720deg);opacity:0}}',
      '@keyframes eldrTbFall{0%{transform:translate(0,0);opacity:0}15%{opacity:.8}100%{transform:translate(18px,70px);opacity:0}}',
      '@keyframes eldrTbRise{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(-10px,-70px);opacity:0}}',
      '@keyframes eldrTbTwinkle{0%,100%{opacity:0}50%{opacity:.9}}',
      '@keyframes eldrTbBreathe{0%,100%{opacity:.45}50%{opacity:.7}}',
      // banners
      '.eldr-tb-bn{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;max-width:1280px;margin:0 auto;padding:10px 16px}',
      '.eldr-tb-bnwrap{background:linear-gradient(#0b0d10,#07080a);border-bottom:1px solid #1f2328}',
      '.eldr-tb-card{position:relative;display:flex;gap:12px;align-items:center;padding:10px 38px 10px 12px;border:1px solid #1f2328;border-left:3px solid var(--k);border-radius:10px;background:linear-gradient(90deg,var(--kg),rgba(14,16,19,.9) 55%);min-width:0}',
      '.eldr-tb-logo{flex:none;width:44px;height:44px;border-radius:8px;object-fit:contain;background:#0e1013;border:1px solid #1f2328;padding:4px}',
      '.eldr-tb-body{min-width:0;flex:1}',
      '.eldr-tb-top{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '.eldr-tb-label{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#07080a;background:var(--k);border-radius:999px;padding:1px 7px}',
      '.eldr-tb-title{font-family:Cinzel,serif;font-weight:700;font-size:14px;letter-spacing:.04em;color:#f0ead6}',
      '.eldr-tb-end{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#9a968b}',
      '.eldr-tb-blurb{font-size:12.5px;color:#cfcabd;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.eldr-tb-extra{font-size:12px;color:#d9d6cc;margin-top:3px}',
      '.eldr-tb-extra code{font-family:ui-monospace,Menlo,monospace;color:var(--k);background:rgba(255,255,255,.04);border:1px solid #1f2328;border-radius:4px;padding:0 5px}',
      '.eldr-tb-prog{height:6px;border-radius:999px;background:#1a1d21;overflow:hidden;margin-top:6px}',
      '.eldr-tb-prog i{display:block;height:100%;background:linear-gradient(90deg,#2f7a5a,var(--k));box-shadow:0 0 8px var(--k)}',
      '.eldr-tb-go{flex:none;align-self:center;font:600 11px/1 Montserrat,sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:#07080a;background:var(--k);border-radius:999px;padding:8px 13px;white-space:nowrap;transition:filter .15s,box-shadow .15s}',
      '.eldr-tb-go:hover,.eldr-tb-go:focus-visible{filter:brightness(1.12);box-shadow:0 0 14px var(--kg2);outline:none}',
      '.eldr-tb-x{position:absolute;top:6px;right:6px;width:24px;height:24px;border:0;border-radius:50%;background:none;color:#6f6b62;font:16px/1 system-ui,sans-serif;cursor:pointer}',
      '.eldr-tb-x:hover,.eldr-tb-x:focus-visible{color:#d9d6cc;background:rgba(255,255,255,.06);outline:none}',
      '.eldr-tb a{color:inherit}',
      // small screens: names and dates first, the lines open on a tap
      '@media (max-width:760px){',
      ' .eldr-tb-row{justify-content:flex-start;gap:4px 14px;padding:7px 40px 7px 12px}',
      ' .eldr-tb-text,.eldr-tb-next{display:none}',
      ' .eldr-tb-more{display:block}',
      ' .eldr-tb-seg{flex-wrap:wrap;gap:4px 8px}',
      ' .eldr-tb-sep{display:none}',
      ' .eldr-tb-det{text-align:left;padding:0 40px 9px 12px}',
      ' .eldr-tb-det div{margin-top:3px}',
      ' .eldr-tb-bn{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding:8px 12px}',
      ' .eldr-tb-card{flex:0 0 88%;scroll-snap-align:start;flex-wrap:wrap;align-items:flex-start}',
      ' .eldr-tb-body{flex:1 1 calc(100% - 60px)}',
      ' .eldr-tb-go{margin-left:auto}',
      ' .eldr-tb-bn:has(> :only-child) .eldr-tb-card{flex-basis:100%}',
      '}',
      // 1.1.1: while the shop has its menu, cart or a pop-up open (it locks the page's scrolling), keep out of the way
      '.eldr-tb.eldr-tb-under{visibility:hidden}',
      '@media (prefers-reduced-motion:reduce){.eldr-tb-fx{display:none}.eldr-tb-glow{animation:none}}'
    ].join('\n');
    document.head.appendChild(el('style', { id: 'eldr-tb-style', text: css }));
  }

  // ------------------------------------------------------------------ the event strip
  function hexA(c, a) {   // #rgb / #rrggbb -> rgba()
    c = color(c, GOLD).slice(1); if (c.length === 3) c = c.replace(/./g, '$&$&'); c = c.slice(0, 6);
    var n = parseInt(c, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function particles(evs) {
    var fx = el('div', { class: 'eldr-tb-fx', 'aria-hidden': 'true' });
    var kinds = [];
    evs.forEach(function (e) { var p = (e.look && e.look.particles) || ''; if (/^(snow|motes|embers|stars|ash|smoke|flares|coins)$/.test(p)) kinds.push({ k: p, c: color(e.look.glow, color(e.look.accent, GOLD)) }); });
    if (!kinds.length) return fx;
    var total = Math.min(26, 14 + 6 * (kinds.length - 1)), per = Math.ceil(total / kinds.length);
    kinds.forEach(function (k, ki) {
      for (var i = 0; i < per; i++) {
        var dur = 5 + Math.random() * 6, delay = -Math.random() * dur;
        var st = { left: (Math.random() * 100).toFixed(1) + '%', '--c': k.c, 'animation-duration': dur.toFixed(1) + 's', 'animation-delay': delay.toFixed(1) + 's' };
        if (k.k === 'stars' || k.k === 'flares') st.top = (10 + Math.random() * 80).toFixed(0) + '%';
        fx.appendChild(el('span', { class: k.k, style: st }));
      }
    });
    return fx;
  }

  function candles(e, today) {
    var c = e.candles; if (!c || !Array.isArray(c.weeks)) return null;
    var lit = c.lit || [], cur = null;
    c.weeks.forEach(function (w) { if (w.from <= today && today <= w.to) cur = w; });
    var row = el('span', { class: 'eldr-tb-candles', title: lit.length + ' of ' + c.weeks.length + ' candles lit' },
      c.weeks.map(function (w) { return el('i', { class: (lit.indexOf(w.n) >= 0 ? 'on' : '') + (cur && cur.n === w.n ? ' now' : '') }); }));
    var bits = [row];
    if (cur && cur.rune) {
      var on = lit.indexOf(cur.n) >= 0;
      bits.push(el('span', { class: 'eldr-tb-rune' }, [el('b', { text: (cur.glyph ? cur.glyph + ' ' : '') + cur.rune }),
        on ? ' is awake' + (cur.what ? ': ' + cur.what : '') : ' waits for this week’s first stream']));
    }
    return bits;
  }

  function drawEvents(evs, nxt, today) {
    var glows = evs.map(function (e) { return color(e.look && e.look.glow, color(e.look && e.look.accent, GOLD)); });
    var accents = evs.map(function (e) { return color(e.look && e.look.accent, GOLD); });
    // blended background: one soft glow per event, spread across the strip, highest priority in the middle-left
    var layers = glows.map(function (g, i) {
      var x = evs.length === 1 ? 50 : Math.round(15 + 70 * i / (evs.length - 1));
      return 'radial-gradient(ellipse 55% 160% at ' + x + '% 50%,' + hexA(g, .42) + ',transparent 70%)';
    });
    var line = accents.length === 1 ? 'linear-gradient(90deg,transparent,' + accents[0] + ',transparent)'
      : 'linear-gradient(90deg,transparent,' + accents.join(',') + ',transparent)';
    var wrap = el('div', { class: 'eldr-tb-ev', role: 'region', 'aria-label': 'Events running now', style: { '--eldr-tb-glow': layers.join(','), '--eldr-tb-line': line } });
    wrap.appendChild(el('div', { class: 'eldr-tb-glow' }));
    wrap.appendChild(particles(evs));
    var row = el('div', { class: 'eldr-tb-row' });
    var compact = evs.length > 1 || !!evs[0].candles;   // the lines go behind the ▾ button
    evs.forEach(function (e, i) {
      var a = accents[i], g = glows[i];
      if (i > 0) row.appendChild(el('span', { class: 'eldr-tb-sep', style: { '--l': hexA(accents[i - 1], .8), '--r': hexA(a, .8) } }));
      var seg = el('div', { class: 'eldr-tb-seg' + (e.side === 'curse' ? ' eldr-tb-curse' : ''), style: { '--a': a, '--g': hexA(g, .7) } }, [
        el('span', { class: 'eldr-tb-sig' + (/^(diamond|ring|star)$/.test(e.look && e.look.sig || '') ? ' ' + e.look.sig : '') }),
        el('span', { class: 'eldr-tb-name', text: e.name }),
        el('span', { class: 'eldr-tb-when', text: (e.kind === 'omen' ? (e.side === 'curse' ? 'Curse · ' : 'Omen · ') : e.kind === 'fair' ? 'Fair · ' : '') + untilText(e, today) })
      ]);
      var cd = candles(e, today); if (cd) cd.forEach(function (n) { seg.appendChild(n); });
      if (e.text && !compact) seg.appendChild(el('span', { class: 'eldr-tb-text', title: e.text, text: e.text }));
      else if (e.text) seg.title = e.text;
      row.appendChild(seg);
    });
    if (nxt && OPT('next', '1') !== '0') {
      var na = color(nxt.look && nxt.look.accent, GOLD);
      row.appendChild(el('span', { class: 'eldr-tb-next', style: { '--a': na } }, ['Next: ', el('b', { text: nxt.name }), ' · ' + short(nxt.from)]));
    }
    wrap.appendChild(row);
    // what each event does: inline for one event on wide screens, else behind the ▾ button
    var det = el('div', { class: 'eldr-tb-det' }, evs.filter(function (e) { return e.text; }).map(function (e, i) {
      return el('div', { style: { '--a': color(e.look && e.look.accent, GOLD) } }, [el('b', { text: e.name }), ' ', e.text]);
    }));
    wrap.appendChild(det);
    if (compact) wrap.classList.add('eldr-tb-multi');
    var more = el('button', { class: 'eldr-tb-more', type: 'button', 'aria-expanded': 'false', 'aria-label': 'Show what the events do', text: '▾',
      onclick: function () { var o = wrap.classList.toggle('eldr-tb-open'); more.setAttribute('aria-expanded', o ? 'true' : 'false'); more.textContent = o ? '▴' : '▾'; } });
    wrap.appendChild(more);
    return wrap;
  }

  // ------------------------------------------------------------------ the banners
  function drawBanner(p, today) {
    var charity = p.type === 'charity';
    var k = charity ? GREEN : GOLD;
    var link = safeUrl(p.link);
    var logo = p.logo ? (safeUrl(p.logo) || (/^[\w\/.-]+$/.test(p.logo) ? BASE + 'data/' + p.logo : '')) : '';
    var extra = [];
    if (charity && p.charity) {
      var c = p.charity;
      extra.push(el('div', { class: 'eldr-tb-extra' }, [el('b', { text: c.raised || '0' }), c.goal ? ' raised of ' + c.goal : ' raised',
        c.donors ? ' · ' + c.donors + (c.donors === 1 ? ' donor' : ' donors') : '', c.matched ? ' · ' + c.matched + ' matched' : '']));
      if (c.pct != null && c.pct >= 0) extra.push(el('div', { class: 'eldr-tb-prog', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(c.pct)) },
        el('i', { style: { width: Math.max(2, Math.min(100, c.pct)).toFixed(1) + '%' } })));
    }
    if (p.giveaway && p.giveaway.prize) extra.push(el('div', { class: 'eldr-tb-extra' }, ['Giveaway: ', el('b', { text: p.giveaway.prize }),
      p.giveaway.enter ? ' · type ' : null, p.giveaway.enter ? el('code', { text: p.giveaway.enter }) : null, p.giveaway.enter ? ' in chat' : null]));
    var code = (p.codes || []).filter(function (x) { return x && x.code && (!x.expires || x.expires >= today); })[0];
    if (code) extra.push(el('div', { class: 'eldr-tb-extra' }, ['Code ', el('code', { text: code.code }), code.text ? ' ' + code.text : '']));
    var hideKey = 'eldrTbHide:' + p.id + ':' + (p.end || '');
    var card = el('div', { class: 'eldr-tb-card', style: { '--k': k, '--kg': hexA(k, .14), '--kg2': hexA(k, .45) } }, [
      logo ? el('img', { class: 'eldr-tb-logo', src: logo, alt: '', loading: 'lazy', decoding: 'async' }) : null,
      el('div', { class: 'eldr-tb-body' }, [
        el('div', { class: 'eldr-tb-top' }, [
          el('span', { class: 'eldr-tb-label', text: p.label || (charity ? 'Charity' : 'Ad') }),   // the disclosure label always shows
          el('span', { class: 'eldr-tb-title', text: p.name }),
          p.end ? el('span', { class: 'eldr-tb-end', text: (p.end === today ? 'last day' : 'until ' + short(p.end)) }) : null
        ]),
        p.blurb ? el('div', { class: 'eldr-tb-blurb', text: p.blurb }) : null
      ].concat(extra)),
      link ? el('a', { class: 'eldr-tb-go', href: link, target: '_blank', rel: charity ? 'noopener' : 'sponsored noopener', text: charity ? 'Donate' : 'Visit' }) : null,
      el('button', { class: 'eldr-tb-x', type: 'button', 'aria-label': 'Hide ' + p.name, title: 'Hide', text: '×',
        onclick: function () { store(hideKey, '1'); var w = card.parentNode; card.remove(); if (w && !w.children.length && w.parentNode) w.parentNode.remove(); } })
    ]);
    return card;
  }

  // ------------------------------------------------------------------ mount
  var root = null, lastSig = '', lastData = null;
  function mountPoint() {
    if (root && root.isConnected) return root;
    root = el('div', { class: 'eldr-tb', id: 'eldr-tb', 'data-eldr-bar-version': VERSION });
    var sel = OPT('mount', ''), host = sel ? document.querySelector(sel) : null;
    if (host) host.appendChild(root);
    else {
      // Fourthwall: above the sticky header, at the top of the page; anywhere else: first thing in <body>
      var page = document.querySelector('.page');
      if (page) page.insertBefore(root, page.firstChild); else document.body.insertBefore(root, document.body.firstChild);
    }
    return root;
  }

  function render(evData, ptData) {
    lastData = [evData, ptData];
    var today = todayStr();
    var evs = OPT('events', '1') === '0' ? [] : runningEvents(evData, today);
    var nxt = evs.length ? nextEvent(evData, today, evs) : null;
    var bns = OPT('banners', '1') === '0' ? [] : bannerPartners(ptData, today);
    var sig = JSON.stringify([today, evs, nxt && nxt.id, bns.map(function (b) { return [b.id, b.charity && b.charity.raised, b.giveaway && b.giveaway.status, b.blurb]; })]);
    if (sig === lastSig && root && root.isConnected) return;
    lastSig = sig;
    var r = mountPoint();
    while (r.firstChild) r.removeChild(r.firstChild);
    if (!evs.length && !bns.length) { r.style.display = 'none'; return; }
    r.style.display = '';
    r.classList.toggle('eldr-tb-under', overlayOpen());
    if (evs.length) r.appendChild(drawEvents(evs, nxt, today));
    if (bns.length) r.appendChild(el('div', { class: 'eldr-tb-bnwrap', role: 'region', 'aria-label': 'Charity and sponsors' },
      el('div', { class: 'eldr-tb-bn' }, bns.map(function (b) { return drawBanner(b, today); }))));
  }

  function refresh() {
    if (document.hidden) return;
    Promise.all([OPT('events', '1') === '0' ? null : load('events.json'), OPT('banners', '1') === '0' ? null : load('partners.json')])
      .then(function (d) { injectStyles(); render(d[0], d[1]); })
      .catch(function (e) { if (window.console) console.warn('[eldr bar]', e); });
  }

  // 1.1.1: Fourthwall locks the page's scrolling while its menu drawer, cart or a pop-up is open. The bar sits on the
  // lowest layer already; this also hides it then, in case a theme draws its drawer underneath the page.
  function overlayOpen() {
    try {
      var b = getComputedStyle(document.body), h = getComputedStyle(document.documentElement);
      return b.overflow === 'hidden' || b.overflowY === 'hidden' || h.overflow === 'hidden' || h.overflowY === 'hidden' || b.position === 'fixed';
    } catch (e) { return false; }
  }
  function watchOverlays() {
    var sync = function () { if (root) root.classList.toggle('eldr-tb-under', overlayOpen()); };
    if (window.MutationObserver) {
      var mo = new MutationObserver(sync);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    window.addEventListener('resize', sync);
    sync();
  }

  function start() {
    refresh();
    watchOverlays();
    // Fourthwall swaps the page on its own navigation: put the bar back from the last data when it goes missing
    var t = null;
    if (window.MutationObserver) new MutationObserver(function () {
      if (t || !lastData || (root && root.isConnected)) return;
      t = setTimeout(function () { t = null; if (root && !root.isConnected) { lastSig = ''; root = null; render(lastData[0], lastData[1]); } }, 150);
    }).observe(document.body, { childList: true, subtree: true });
    setInterval(refresh, 5 * 60 * 1000);   // also turns the day over at midnight
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
  }
  window.__eldrBar = { refresh: refresh, version: VERSION, base: BASE };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
