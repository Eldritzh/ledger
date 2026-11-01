/* =====================================================================================
   THE ELDRITCH LEDGER — embed.js
   Draws the Eldritzh community pages inside any page (Fourthwall Custom HTML sections).

   Fourthwall section (paste once, never again):
     <div data-eldr-page="story"></div>
     <script src="https://ledger.eldritzh.com/embed.js" defer></script>

   Pages: story · commands · pacts · circles · codex · partners
   Options on the div:
     data-eldr-game="hunt-showdown"   pacts: open on this game (default: the game on the wheel now)
     data-eldr-refresh="5"            minutes between quiet re-checks while the page is open (0 = off)
     data-eldr-title="0"              hide the page's own header

   Data comes from ./data/ next to this file. Streamer.bot's "Website :: Publish" action
   commits it to GitHub; GitHub Pages serves it. Nothing here needs editing for new data.
   ===================================================================================== */
(function () {
  'use strict';

  if (window.__eldrLedger) { window.__eldrLedger.scan(); return; }

  var me = document.currentScript;
  var BASE = (me && me.src) ? me.src.replace(/[^\/]*(\?.*)?$/, '') : 'https://ledger.eldritzh.com/';
  var VERSION = '1.1.0';

  // ------------------------------------------------------------------ auth helper
  function checkAuthKey() {
    try {
      var params = new URLSearchParams(window.location.search);
      var key = params.get('key');
      if (key) {
        sessionStorage.setItem('eldr_mod_key', key);
        return key;
      }
      return sessionStorage.getItem('eldr_mod_key');
    } catch (e) {
      return null;
    }
  }

  // ------------------------------------------------------------------ tiny helpers
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!attrs.hasOwnProperty(k) || attrs[k] == null || attrs[k] === false) continue;
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'style' && typeof attrs[k] === 'object') { for (var s in attrs[k]) n.style[s] = attrs[k][s]; }
      else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(n) { return Number(n || 0).toLocaleString('en-US'); }
  function kfmt(n) { n = Number(n || 0); return n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : num(n); }
  function hm(min) { min = Math.max(0, Math.round(min || 0)); return min < 60 ? min + 'm' : Math.floor(min / 60) + 'h' + (min % 60 ? ' ' + (min % 60) + 'm' : ''); }
  function slug(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function toDate(v) { if (v == null || v === '') return null; var d = typeof v === 'number' ? new Date(v < 1e12 ? v * 1000 : v) : new Date(v); return isNaN(d) ? null : d; }
  function day(v) { var d = toDate(v); return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
  function ago(v) {
    var d = toDate(v); if (!d) return '';
    var s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 90) return 'just now';
    if (s < 5400) return Math.round(s / 60) + ' minutes ago';
    if (s < 129600) return Math.round(s / 3600) + ' hours ago';
    if (s < 1209600) return Math.round(s / 86400) + ' days ago';
    return 'on ' + day(d);
  }
  function left(unix) {
    if (!unix) return '';
    var s = unix - Date.now() / 1000;
    if (s <= 0) return 'due now';
    return s >= 86400 ? Math.floor(s / 86400) + ' days left' : Math.max(1, Math.floor(s / 3600)) + ' hours left';
  }
  function pct(a, b) { return b > 0 ? Math.max(0, Math.min(100, a * 100 / b)) : 0; }
  function bar(p, cls) { return el('div', { class: 'eldr-bar' + (cls ? ' ' + cls : '') }, el('i', { style: { width: p.toFixed(1) + '%' } })); }

  // ------------------------------------------------------------------ data
  var cache = {};
  function bucket() { return Math.floor(Date.now() / 60000); }   // new URL once a minute: fresh enough, kind to the CDN
  function load(file, asText) {
    var key = file + '@' + bucket();
    if (cache[key]) return cache[key];
    var p = fetch(BASE + 'data/' + file + '?v=' + bucket(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(file + ': ' + r.status); return asText ? r.text() : r.json(); });
    cache[key] = p;
    p.catch(function () { delete cache[key]; });
    return p;
  }
  function loadOpt(file, asText) { return load(file, asText).catch(function () { return null; }); }

  // ------------------------------------------------------------------ styles (scoped to .eldr-site)
  function injectStyles() {
    if (document.getElementById('eldr-style')) return;
    var f = document.createElement('link');
    f.rel = 'stylesheet';
    f.href = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&family=Montserrat:wght@300;400;600&display=swap';
    document.head.appendChild(f);
    var st = document.createElement('style');
    st.id = 'eldr-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var CSS = [
    '.eldr-site{--gold:#D4AF37;--gold-dim:#8f7624;--green:#52B788;--teal:#2fb3a8;--seal:#7a2a24;--bg:#07080a;--panel:#0e1013;--panel2:#14171b;--line:#1f2328;--text:#d9d6cc;--muted:#9a968b;',
    '  all:initial;display:block;box-sizing:border-box;width:100%;background:radial-gradient(ellipse at top,#10161a 0%,var(--bg) 60%);color:var(--text);',
    '  font-family:Montserrat,system-ui,sans-serif;font-weight:300;font-size:16px;line-height:1.6;padding:44px 16px 56px;border-radius:12px;text-align:left}',
    '.eldr-site *,.eldr-site *::before,.eldr-site *::after{box-sizing:border-box}',
    /* neutralise the host theme's element styles (zero-specificity list, so every rule below still wins) */
    '.eldr-site :where(h1,h2,h3,p,ul,ol,li,table,thead,tbody,tr,th,td,section,article,header,footer,nav,details,summary,div,span,a,button,input,select,img,code,strong,em,b,i){margin:0;padding:0;border:0;background:none;box-shadow:none;text-shadow:none;text-transform:none;letter-spacing:normal;font:inherit;color:inherit;line-height:inherit;text-decoration:none;float:none;min-height:0;max-width:none}',
    '.eldr-site ul{padding-left:1.3em;margin:0 0 1em;list-style:disc}',
    '.eldr-site li{margin:0 0 .3em}',
    '.eldr-site .eldr-wrap{max-width:960px;margin:0 auto}',
    '.eldr-site a{color:var(--green);text-decoration:underline;text-underline-offset:3px}',
    '.eldr-site a:hover{color:var(--gold)}',
    '.eldr-site p{margin:0 0 1em}',
    '.eldr-site header.eldr-head{text-align:center;margin:0 0 32px}',
    '.eldr-site .eldr-tag{font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--green);margin:0 0 14px}',
    '.eldr-site h1{font-family:"Cinzel Decorative",Georgia,serif;font-weight:700;color:var(--gold);font-size:clamp(28px,5vw,46px);line-height:1.1;margin:0 0 14px;letter-spacing:.02em;text-shadow:0 0 24px rgba(212,175,55,.25)}',
    '.eldr-site .eldr-intro{max-width:660px;margin:0 auto;color:var(--muted);font-style:italic}',
    '.eldr-site .eldr-upd{font-size:12px;color:var(--gold-dim);margin-top:10px;letter-spacing:.05em}',
    '.eldr-site h2{font-family:Cinzel,Georgia,serif;font-weight:700;color:var(--gold);font-size:21px;line-height:1.3;margin:0 0 14px;letter-spacing:.04em}',
    '.eldr-site h3{font-family:Cinzel,Georgia,serif;font-weight:700;color:var(--text);font-size:16px;margin:18px 0 8px;letter-spacing:.04em}',
    '.eldr-site section.eldr-card{background:var(--panel);border:1px solid var(--line);border-top:2px solid var(--gold-dim);border-radius:10px;padding:22px 22px 16px;margin:0 0 22px;scroll-margin-top:24px}',
    '.eldr-site section.eldr-card.mod-card{border-top:2px solid var(--seal);background:rgba(122,42,36,.08);}',
    '.eldr-site table{width:100%;border-collapse:collapse;font-size:15px;margin:0 0 8px}',
    '.eldr-site th{text-align:left;font-weight:600;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--green);padding:0 10px 10px;border-bottom:1px solid var(--line)}',
    '.eldr-site td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}',
    '.eldr-site tr:last-child td{border-bottom:none}',
    '.eldr-site td.num,.eldr-site th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.eldr-site code{font-family:ui-monospace,Consolas,monospace;font-size:13px;color:var(--gold);background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);border-radius:4px;padding:1px 6px;white-space:nowrap;display:inline-block;margin:1px 0}',
    '.eldr-site strong{color:#f0ead6;font-weight:600}',
    '.eldr-site em{font-style:italic}',
    '.eldr-site .ep{color:var(--teal);font-weight:600}',
    '.eldr-site .eldr-note{margin:14px 0 4px;padding:12px 14px;border-left:2px solid var(--green);background:rgba(82,183,136,.06);border-radius:0 6px 6px 0;font-size:14px}',
    '.eldr-site .eldr-muted{color:var(--muted)}',
    '.eldr-site .eldr-small{font-size:13px}',
    '.eldr-site .eldr-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 28px}',
    '.eldr-site .eldr-chip{font:inherit;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text);border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:var(--panel);cursor:pointer;text-decoration:none;transition:border-color .2s,color .2s}',
    '.eldr-site .eldr-chip:hover,.eldr-site .eldr-chip:focus-visible{border-color:var(--gold);color:var(--gold);outline:none}',
    '.eldr-site .eldr-chip[aria-pressed="true"]{border-color:var(--gold);color:#111;background:var(--gold);font-weight:600}',
    '.eldr-site input.eldr-search,.eldr-site select.eldr-select{font:inherit;font-size:15px;color:var(--text);background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:9px 12px;min-width:0}',
    '.eldr-site input.eldr-search{display:block;width:100%;max-width:420px;margin:0 auto 18px}',
    '.eldr-site input.eldr-search:focus,.eldr-site select.eldr-select:focus{outline:2px solid var(--green);outline-offset:1px}',
    '.eldr-site .eldr-bar{height:8px;border-radius:4px;background:rgba(230,220,195,.08);overflow:hidden;margin:6px 0}',
    '.eldr-site .eldr-bar i{display:block;height:100%;background:linear-gradient(90deg,#2f6b4a,var(--green));box-shadow:0 0 8px rgba(82,183,136,.5);transition:width .6s ease}',
    '.eldr-site .eldr-bar.gold i{background:linear-gradient(90deg,var(--gold-dim),var(--gold));box-shadow:0 0 8px rgba(212,175,55,.45)}',
    '.eldr-site .eldr-badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:2px 9px;color:var(--muted);white-space:nowrap}',
    '.eldr-site .eldr-badge.gold{color:var(--gold);border-color:rgba(212,175,55,.45)}',
    '.eldr-site .eldr-badge.green{color:var(--green);border-color:rgba(82,183,136,.45)}',
    '.eldr-site .eldr-badge.teal{color:var(--teal);border-color:rgba(47,179,168,.5)}',
    '.eldr-site .eldr-badge.red{color:#d9776f;border-color:rgba(122,42,36,.8)}',
    '.eldr-site .eldr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}',
    '.eldr-site .eldr-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin:0 0 22px}',
    '.eldr-site .eldr-stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px;text-align:center}',
    '.eldr-site .eldr-stat b{display:block;font-family:Cinzel,Georgia,serif;font-size:24px;color:var(--gold);font-weight:700;font-variant-numeric:tabular-nums}',
    '.eldr-site .eldr-stat span{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}',
    '.eldr-site .eldr-row{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:baseline;justify-content:space-between}',
    '.eldr-site .eldr-empty{text-align:center;color:var(--muted);font-style:italic;padding:28px 10px}',
    '.eldr-site .eldr-loading{text-align:center;color:var(--muted);font-style:italic;padding:40px 10px;letter-spacing:.06em}',
    '.eldr-site .eldr-foot{text-align:center;margin-top:34px;color:var(--muted);font-style:italic;font-size:14px}',
    '.eldr-site .eldr-foot .sig{display:block;margin-top:12px;font-style:normal;letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:var(--green)}',
    '.eldr-site details{border-top:1px solid var(--line)}',
    '.eldr-site details:first-of-type{border-top:none}',
    '.eldr-site summary{cursor:pointer;list-style:none;padding:12px 2px;display:flex;justify-content:space-between;gap:10px;align-items:baseline;font-family:Cinzel,Georgia,serif;font-weight:700;color:var(--text);letter-spacing:.04em}',
    '.eldr-site summary::-webkit-details-marker{display:none}',
    '.eldr-site summary::before{content:"\\2726";color:var(--gold-dim);margin-right:8px;transition:transform .2s}',
    '.eldr-site details[open] summary::before{transform:rotate(45deg);color:var(--gold)}',
    '.eldr-site summary span.t{flex:1}',
    '.eldr-site summary:focus-visible{outline:2px solid var(--green);outline-offset:2px}',
    /* story */
    '.eldr-site.eldr-story{font-family:"IM Fell English",Georgia,serif;font-weight:400}',
    '.eldr-site .st-entries{list-style:none;margin:0;padding:0}',
    '.eldr-site .st-entry{display:grid;grid-template-columns:3.4rem 1fr;gap:1.2rem;padding:2.2rem 0;border-bottom:1px solid rgba(212,175,55,.14)}',
    '.eldr-site .st-num{font:700 1.05rem/1.9 Cinzel,Georgia,serif;color:var(--gold);text-align:right;letter-spacing:.06em}',
    '.eldr-site .st-entry h2{font-size:clamp(1.2rem,3.4vw,1.55rem);color:#f0ead6;margin:0 0 .7rem}',
    '.eldr-site .st-text p{font-size:1.15rem;line-height:1.7;margin:0 0 1em}',
    '.eldr-site .st-text p:first-child{display:flow-root}',
    '.eldr-site .st-text p:first-child::first-letter{font-family:"Cinzel Decorative",Georgia,serif;font-size:3.1em;float:left;line-height:.9;padding:.06em .12em 0 0;color:var(--gold)}',
    '.eldr-site .st-entry.sealed .st-num,.eldr-site .st-entry.sealed h2{color:var(--muted)}',
    '.eldr-site .st-ghost{display:grid;gap:.55rem;padding:.3rem 0 .8rem;filter:blur(3px);opacity:.5;user-select:none}',
    '.eldr-site .st-ghost span{height:.7rem;border-radius:2px;background:linear-gradient(90deg,rgba(230,220,195,.22),rgba(230,220,195,.06))}',
    '.eldr-site .st-goal{padding:.9rem 1rem;background:var(--panel2);border:1px solid rgba(122,42,36,.55);border-radius:6px}',
    '.eldr-site .st-goal .h::before{content:"\\2726";color:var(--seal);margin-right:.45rem}',
    '.eldr-site .st-goal .n{font:700 .82rem/1 Cinzel,Georgia,serif;color:var(--muted);letter-spacing:.06em;font-variant-numeric:tabular-nums}',
    '.eldr-site .st-count{font:700 .82rem/1 Cinzel,Georgia,serif;letter-spacing:.2em;text-transform:uppercase;margin:18px 0 0}',
    '.eldr-site .st-count b{color:var(--gold)}',
    /* pacts */
    '.eldr-site .pa-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}',
    '.eldr-site .pa-item{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:10px 12px}',
    '.eldr-site .pa-item .nm{font-weight:600;color:#f0ead6}',
    '.eldr-site .pa-item .ds{font-size:14px;color:var(--muted);margin-top:4px}',
    '.eldr-site .pa-item.on{border-color:rgba(212,175,55,.5)}',
    '.eldr-site .pa-slot{display:flex;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--line)}',
    '.eldr-site .pa-slot:last-child{border-bottom:none}',
    '.eldr-site .pa-slot .id{font-family:Cinzel,Georgia,serif;color:var(--gold-dim);min-width:2.4em}',
    '.eldr-site .pa-slot .tx{flex:1}',
    '.eldr-site .pa-slot.done .tx{text-decoration:line-through;color:var(--muted)}',
    '.eldr-site .pa-tools{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:0 0 20px}',
    '.eldr-site .pa-tools .eldr-search{margin:0;flex:1 1 220px}',
    /* circles */
    '.eldr-site .ci{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:16px}',
    '.eldr-site .ci.bound{border-color:rgba(212,175,55,.45)}',
    '.eldr-site .ci.active{box-shadow:0 0 0 1px var(--green),0 0 22px rgba(82,183,136,.25)}',
    '.eldr-site .ci h3{margin:0 0 6px;font-size:17px;color:#f0ead6}',
    '.eldr-site .ci .id{color:var(--gold-dim);font-family:Cinzel,Georgia,serif;margin-right:6px}',
    /* codex */
    '.eldr-site .cx-ach{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:10px 2px;border-top:1px solid var(--line)}',
    '.eldr-site .cx-ach:first-child{border-top:none}',
    '.eldr-site .cx-ach .nm{font-weight:600;color:#f0ead6}',
    '.eldr-site .cx-ach .ds{grid-column:1/-1;font-size:14px;color:var(--muted)}',
    '.eldr-site .cx-ach .fl{grid-column:1/-1;font-size:13px;color:var(--gold-dim);font-style:italic}',
    '.eldr-site .cx-ach.secret .nm{color:var(--muted);letter-spacing:.3em}',
    '.eldr-site .cx-top td:first-child{width:3em;font-family:Cinzel,Georgia,serif;color:var(--gold-dim)}',
    '.eldr-site .cx-top tr:nth-child(1) td:first-child{color:var(--gold)}',
    '.eldr-site .cx-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 14px}',
    /* partners */
    '.eldr-site .pt{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:8px}',
    '.eldr-site .pt img{max-width:160px;max-height:64px;object-fit:contain;align-self:flex-start}',
    '.eldr-site .pt h3{margin:0;font-size:18px;color:#f0ead6}',
    '.eldr-site .pt .cd{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '@media (max-width:620px){',
    '  .eldr-site{padding:30px 12px 44px;border-radius:0}',
    '  .eldr-site section.eldr-card{padding:16px 14px 10px}',
    '  .eldr-site table.stack thead{display:none}',
    '  .eldr-site table.stack tr{display:block;padding:10px 0;border-bottom:1px solid var(--line)}',
    '  .eldr-site table.stack tr:last-child{border-bottom:none}',
    '  .eldr-site table.stack td{display:block;width:100% !important;border:none;padding:2px 0}',
    '  .eldr-site table.stack td:first-child{margin-bottom:4px}',
    '  .eldr-site code{white-space:normal}',
    '  .eldr-site nav.eldr-chips{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;margin:0 -12px 22px;padding:0 12px 6px;scrollbar-width:thin}',
    '  .eldr-site nav.eldr-chips .eldr-chip{flex:0 0 auto}',
    '  .eldr-site .st-entry{grid-template-columns:1fr;gap:.4rem}',
    '  .eldr-site .st-num{text-align:left}',
    '}',
    '@media (prefers-reduced-motion:reduce){.eldr-site *{transition:none !important;animation:none !important}}'
  ].join('\n');

  // ------------------------------------------------------------------ page frame
  function head(opts, title, tag, intro) {
    if (opts.noTitle) return null;
    return el('header', { class: 'eldr-head' }, [
      el('p', { class: 'eldr-tag', text: tag || 'Embrace the Tentacle' }),
      el('h1', { text: '' + title + '' }),
      intro ? el('p', { class: 'eldr-intro', text: intro }) : null
    ]);
  }
  function foot(updated, extra) {
    return el('footer', { class: 'eldr-foot' }, [
      extra || null,
      updated ? el('div', { class: 'eldr-upd', text: 'Last written ' + ago(updated) }) : null,
      el('span', { class: 'sig', text: 'The Tentacle Union' })
    ]);
  }
  function empty(t) { return el('div', { class: 'eldr-empty', text: t }); }
  function failed() { return empty('The Ledger could not be read just now. Try again in a moment.'); }

  // ================================================================== STORY
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV'];
  function story(ctx) {
    return Promise.all([load('story_chapters.json'), loadOpt('story_state.json')]).then(function (r) {
      var chapters = Array.isArray(r[0]) ? r[0] : (r[0] && r[0].chapters) || [];
      var state = r[1] || { unlocked: [], counters: {} };
      var unlocked = state.unlocked || [], counters = state.counters || {};
      ctx.root.classList.add('eldr-story');
      var open = 0;
      var list = el('ol', { class: 'st-entries' });
      chapters.forEach(function (ch, i) {
        var isOpen = !ch.unlock || unlocked.indexOf(ch.id) >= 0;
        if (isOpen) open++;
        var body = el('div', { class: 'st-body' });
        body.appendChild(el('h2', { text: isOpen ? ch.title : 'A sealed page' }));
        if (isOpen) {
          var t = el('div', { class: 'st-text' });
          String(ch.text || '').split(/\n\s*\n/).forEach(function (para) { if (para.trim()) t.appendChild(el('p', { text: para.trim() })); });
          body.appendChild(t);
        } else {
          var g = el('div', { class: 'st-ghost', 'aria-hidden': 'true' });
          [96, 88, 92, 61].forEach(function (w) { g.appendChild(el('span', { style: { width: w + '%' } })); });
          body.appendChild(g);
          var have = Number(counters[ch.unlock.counter] || 0), need = Number(ch.unlock.value || 1);
          body.appendChild(el('div', { class: 'st-goal' }, [
            el('div', { class: 'eldr-row' }, [
              el('span', { class: 'h', text: ch.unlock.hint || ('Reach ' + num(need) + ' ' + ch.unlock.counter) }),
              el('span', { class: 'n', text: num(Math.min(have, need)) + ' / ' + num(need) })
            ]),
            bar(pct(have, need))
          ]));
        }
        list.appendChild(el('li', { class: 'st-entry' + (isOpen ? '' : ' sealed') }, [el('div', { class: 'st-num', text: ROMAN[i] || String(i + 1) }), body]));
      });
      var h = head(ctx.opts, 'The Eldritch Ledger', "The congregation's story",
        'Every soul who speaks on stream signs the Ledger. As the congregation banishes, feeds, chants and dies together, new pages are revealed.');
      if (h) h.appendChild(el('p', { class: 'st-count', html: '<b>' + open + '</b> of <b>' + chapters.length + '</b> pages revealed' }));
      return [h, chapters.length ? list : empty('The Ledger is still blank.'), foot(state.updated, el('div', { text: 'Pages unlock live on stream. Type !story in chat to see the next goal.' }))];
    });
  }

  // ================================================================== COMMANDS (from commands.md)
  function inline(s) {
    var out = esc(s);
    out = out.replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    out = out.replace(/Eldritch Pacts?/g, function (m) { return '<span class="ep">' + m + '</span>'; });
    return out;
  }
  function cells(line) { return line.trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); }
  function parseMd(md) {
    var lines = String(md || '').replace(/\r/g, '').split('\n');
    var doc = { title: '', intro: [], sections: [] }, cur = null, para = [];
    var inModBlock = false;

    function flush() {
      if (!para.length) return;
      var t = para.join(' ').trim(); para = [];
      if (!t || /^\(Master copy/i.test(t)) return;
      (cur ? cur.blocks : doc.intro).push({ type: 'p', text: t });
    }

    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];

      // Detect HTML mod block comments or containers
      if (/<div[^>]*data-eldr-auth=["']staff["']/i.test(ln) || /<!--\s*MOD\s*START/i.test(ln)) {
        inModBlock = true;
      }
      if (/<\/div>/i.test(ln) && inModBlock || /<!--\s*MOD\s*END/i.test(ln)) {
        inModBlock = false;
        continue;
      }

      if (/^#\s+/.test(ln)) { flush(); doc.title = ln.replace(/^#\s+/, '').replace(/⛧/g, '').trim(); continue; }
      if (/^##\s+/.test(ln)) {
        flush();
        cur = { title: ln.replace(/^##\s+/, '').trim(), isMod: inModBlock, blocks: [] };
        doc.sections.push(cur);
        continue;
      }
      if (/^###\s+/.test(ln)) { flush(); (cur ? cur.blocks : doc.intro).push({ type: 'h3', text: ln.replace(/^###\s+/, '') }); continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { flush(); continue; }
      if (/^\s*\|/.test(ln)) {
        flush();
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        i--;
        var hdr = cells(rows[0]), body = rows.slice(1).filter(function (r) { return !/^\s*\|?\s*:?-{2,}/.test(r); }).map(cells);
        (cur ? cur.blocks : doc.intro).push({ type: 'table', head: hdr, rows: body });
        continue;
      }
      if (/^\s*[-*]\s+/.test(ln)) {
        flush();
        var items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
        i--;
        (cur ? cur.blocks : doc.intro).push({ type: 'ul', items: items });
        continue;
      }
      if (!ln.trim() || ln.trim().indexOf('<') === 0) { flush(); continue; }
      para.push(ln.trim());
    }
    flush();
    return doc;
  }
  function blockNode(b) {
    if (b.type === 'p') return el('p', { class: 'eldr-note', html: inline(b.text) });
    if (b.type === 'h3') return el('h3', { html: inline(b.text) });
    if (b.type === 'ul') return el('ul', null, b.items.map(function (t) { return el('li', { html: inline(t) }); }));
    var t = el('table', { class: 'stack' });
    t.appendChild(el('thead', null, el('tr', null, b.head.map(function (h) { return el('th', { html: inline(h) }); }))));
    var tb = el('tbody');
    b.rows.forEach(function (r) { tb.appendChild(el('tr', null, r.map(function (c, j) { return el('td', { html: inline(c), style: j === 0 ? { width: '36%' } : null }); }))); });
    t.appendChild(tb);
    return t;
  }
  function commands(ctx) {
    var hasModKey = !!checkAuthKey();
    return load('commands.md', true).then(function (md) {
      var doc = parseMd(md);
      var nodes = [];
      var h = head(ctx.opts, doc.title || 'The Eldritch Ledger', 'Embrace the Tentacle', '');
      if (h) {
        var introP = h.querySelector('.eldr-intro');
        doc.intro.forEach(function (b) { if (b.type === 'p' && !introP) h.appendChild(introP = el('p', { class: 'eldr-intro', html: inline(b.text.replace(/^\*|\*$/g, '')) })); });
      }
      nodes.push(h);

      var secs = [];
      doc.sections.forEach(function (s) {
        if (s.isMod && !hasModKey) return; // Hide mod sections unless valid key exists
        var id = 'eldr-' + slug(s.title.replace(/^[^\w]+/, ''));
        var node = el('section', { class: 'eldr-card' + (s.isMod ? ' mod-card' : ''), id: id }, [el('h2', { html: inline(s.title) })].concat(s.blocks.map(blockNode)));
        secs.push({ s: s, id: id, node: node });
      });

      var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a command…', 'aria-label': 'Find a command' });
      var nav = el('nav', { class: 'eldr-chips', 'aria-label': 'Sections' }, secs.map(function (x) {
        return el('a', { class: 'eldr-chip', href: '#' + x.id, text: x.s.title.replace(/^[^\w]+/, '').trim(),
          onclick: function (e) { e.preventDefault(); x.node.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      }));
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        secs.forEach(function (x) {
          var any = false;
          x.node.querySelectorAll('tbody tr').forEach(function (tr) { var hit = !q || tr.textContent.toLowerCase().indexOf(q) >= 0; tr.style.display = hit ? '' : 'none'; if (hit) any = true; });
          var title = x.s.title.toLowerCase().indexOf(q) >= 0;
          if (title && q) x.node.querySelectorAll('tbody tr').forEach(function (tr) { tr.style.display = ''; });
          x.node.style.display = (!q || any || title) ? '' : 'none';
        });
      });
      nodes.push(nav, search);
      secs.forEach(function (x) { nodes.push(x.node); });
      nodes.push(foot(ctx.site && ctx.site.files && ctx.site.files['commands.md']));
      return nodes;
    });
  }

  // ================================================================== PACTS (wheel lists + what is sealed now)
  function pacts(ctx) {
    return load('pacts.json').then(function (d) {
      var games = (d.games || []).filter(function (g) { return g.items && g.items.length; });
      var wheel = d.wheel || null;
      var current = d.current || '';
      var st = ctx.state;
      if (!st.game) st.game = ctx.opts.game || current || (games[0] && games[0].slug) || '';
      var out = [head(ctx.opts, 'The Pact Wheel', 'Spend a Pact, bind a challenge',
        'Every game has its own list of Pacts. !pact spins the wheel over the list of the game being played, and the challenge it lands on is sealed until Dave pulls it off.')];

      // sealed now
      if (wheel && wheel.entries && wheel.entries.length) {
        var open = wheel.entries.filter(function (e) { return e.status === 'open' || e.status === 'done'; });
        var sec = el('section', { class: 'eldr-card' }, [
          el('div', { class: 'eldr-row' }, [
            el('h2', { text: 'Sealed right now' + (wheel.game ? ' · ' + wheel.game : '') }),
            el('span', { class: 'eldr-badge gold', text: 'Pool ' + num(wheel.pool) + ' Madness' })
          ])
        ]);
        if (!wheel.enabled) sec.appendChild(el('p', { class: 'eldr-muted', text: 'The wheel is closed between streams. These are the last sealed Pacts.' }));
        if (!open.length) sec.appendChild(empty('Nothing is sealed yet. Spin with !pact in chat.'));
        open.forEach(function (e) {
          var tx = e.display || e.text;
          sec.appendChild(el('div', { class: 'pa-slot' + (e.status === 'done' ? ' done' : '') }, [
            el('span', { class: 'id', text: '#' + e.id }),
            el('span', { class: 'tx', text: tx }),
            e.kind === 'eldritch' ? el('span', { class: 'eldr-badge teal', text: 'Eldritch' }) : null,
            e.status === 'done' ? el('span', { class: 'eldr-badge green', text: 'Done' }) : null,
            e.user ? el('span', { class: 'eldr-muted eldr-small', text: e.user }) : null
          ]));
        });
        out.push(sec);
      }

      if (!games.length) { out.push(empty('No game lists have been written yet.')); return out.concat(foot(d.updated)); }

      var g = games.filter(function (x) { return x.slug === st.game; })[0] || games[0];
      var tools = el('div', { class: 'pa-tools' });
      var pick = el('select', { class: 'eldr-select', 'aria-label': 'Game' }, games.map(function (x) {
        return el('option', { value: x.slug, text: x.name + ' (' + x.items.length + ')' + (x.slug === current ? ' · live' : ''), selected: x.slug === g.slug });
      }));
      var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a Pact…', 'aria-label': 'Find a Pact', value: st.q || '' });
      tools.appendChild(pick); tools.appendChild(search);

      var listSec = el('section', { class: 'eldr-card' });
      function draw() {
        var game = games.filter(function (x) { return x.slug === st.game; })[0] || games[0];
        var q = (st.q || '').toLowerCase();
        listSec.innerHTML = '';
        listSec.appendChild(el('div', { class: 'eldr-row' }, [
          el('h2', { text: game.name }),
          el('span', { class: 'eldr-badge' + (game.slug === current ? ' green' : ''), text: game.items.length + ' Pacts' + (game.slug === current ? ' · on the wheel' : '') })
        ]));
        var sealed = {};
        if (wheel && wheel.entries && game.slug === current) wheel.entries.forEach(function (e) { if (e.status === 'open') sealed[(e.text || '').toLowerCase()] = 1; });
        var ul = el('ul', { class: 'pa-list' });
        game.items.forEach(function (it) {
          var hay = (it.name + ' ' + (it.note || '')).toLowerCase();
          if (q && hay.indexOf(q) < 0) return;
          var on = sealed[it.name.toLowerCase()];
          ul.appendChild(el('li', { class: 'pa-item' + (on ? ' on' : '') }, [
            el('div', { class: 'eldr-row' }, [
              el('span', { class: 'nm', text: it.name }),
              it.target ? el('span', { class: 'eldr-badge gold', text: '× ' + it.target }) : null,
              on ? el('span', { class: 'eldr-badge green', text: 'sealed' }) : null
            ]),
            it.note ? el('div', { class: 'ds', text: it.note }) : null
          ]));
        });
        listSec.appendChild(ul.childNodes.length ? ul : empty('No Pact matches that.'));
        listSec.appendChild(el('p', { class: 'eldr-note eldr-small', html: 'A number like <strong>× 5</strong> means it counts: five of them before it is done. Add your own with <code>!pactadd &lt;text&gt; [count]</code> (free while a list is short).' }));
      }
      pick.addEventListener('change', function () { st.game = pick.value; draw(); });
      search.addEventListener('input', function () { st.q = search.value; draw(); });
      draw();
      out.push(tools, listSec, foot(d.updated));
      return out;
    });
  }

  // ================================================================== CIRCLES (summonings)
  function circles(ctx) {
    return load('circles.json').then(function (d) {
      var out = [head(ctx.opts, 'Summoning Circles', 'Feed the circle, choose the game',
        'Pledge Madness, Pacts or real offerings to a game. When a circle is bound, Dave owes it time in that game before its deadline. Miss it, and every offering comes back with interest.')];
      var s = d.stats || {};
      out.push(el('div', { class: 'eldr-stats' }, [
        el('div', { class: 'eldr-stat' }, [el('b', { text: (s.keptPct != null ? s.keptPct : 100) + '%' }), el('span', { text: 'Circles kept' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(s.fulfilled) }), el('span', { text: 'Fulfilled' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: s.avgDays ? Number(s.avgDays).toFixed(1) : '-' }), el('span', { text: 'Days to fulfil' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: '€' + num(Math.round((s.centsFulfilled || 0) / 100)) }), el('span', { text: 'Offered by the faithful' })])
      ]));
      var cs = (d.circles || []).filter(function (c) { return c.status !== 'proposed'; });
      var prop = (d.circles || []).filter(function (c) { return c.status === 'proposed'; });
      var grid = el('div', { class: 'eldr-grid' });
      cs.forEach(function (c) {
        var bound = c.status === 'bound';
        var p = bound ? pct(c.min, c.reqMin) : pct(c.raised, c.target);
        grid.appendChild(el('article', { class: 'ci' + (bound ? ' bound' : '') + (c.active ? ' active' : '') }, [
          el('div', { class: 'eldr-row' }, [
            el('h3', null, [el('span', { class: 'id', text: '#' + c.id }), c.game]),
            c.kind === 'sponsored' ? el('span', { class: 'eldr-badge teal', text: 'Pact with ' + (c.sponsor || 'a partner') })
              : el('span', { class: 'eldr-badge ' + (bound ? 'gold' : 'green'), text: bound ? 'Bound' : 'Gathering' })
          ]),
          bar(p, bound ? 'gold' : ''),
          el('div', { class: 'eldr-row eldr-small' }, [
            el('span', { text: bound ? hm(c.min) + ' of ' + hm(c.reqMin) + ' given' : kfmt(c.raised) + ' / ' + kfmt(c.target) + ' Essence' }),
            el('span', { class: 'eldr-muted', text: bound ? left(c.deadline) : (c.reqMin ? 'then ' + hm(c.reqMin) + ' of stream' : '') })
          ]),
          c.sessionsNeed ? el('div', { class: 'eldr-small eldr-muted', text: c.sessions + ' of ' + c.sessionsNeed + ' streams done' }) : null,
          el('div', { class: 'eldr-small eldr-muted', text: (c.summoners || 0) + (c.summoners === 1 ? ' summoner' : ' summoners') + (c.cents ? ' · €' + (c.cents / 100).toFixed(2) + ' offered' : '') }),
          c.active ? el('div', { class: 'eldr-small', style: { color: 'var(--green)' }, text: 'Dave stands in this circle right now.' }) : null,
          el('div', { class: 'eldr-small' }, [el('code', { text: '!circle ' + c.id + ' 500' }), ' or cheer with ', el('code', { text: 'circle' + c.id })])
        ]));
      });
      out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Burning now' }), cs.length ? grid : empty('No circle burns right now. Propose one with !circle propose <game>.')]));
      if (prop.length) out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Proposed' }),
        el('p', { text: prop.map(function (c) { return '#' + c.id + ' ' + c.game; }).join(' · ') }),
        el('p', { class: 'eldr-muted eldr-small', text: 'Staff approve a proposal and set its target.' })]));
      var hist = d.history || [];
      if (hist.length) {
        var t = el('table', { class: 'stack' });
        t.appendChild(el('thead', null, el('tr', null, ['Circle', 'Outcome', 'Time given', 'Summoners', 'Closed'].map(function (x, i) { return el('th', { text: x, class: i > 1 ? 'num' : null }); }))));
        var tb = el('tbody');
        hist.forEach(function (h) {
          var ok = h.status === 'fulfilled', why = String(h.status || '').replace('broken:', '');
          tb.appendChild(el('tr', null, [
            el('td', null, [el('span', { class: 'eldr-muted', text: '#' + h.id + ' ' }), h.game, h.sponsor ? el('span', { class: 'eldr-muted', text: ' · ' + h.sponsor }) : null]),
            el('td', null, el('span', { class: 'eldr-badge ' + (ok ? 'green' : 'red'), text: ok ? 'Fulfilled' : (why === 'faded' ? 'Faded' : why === 'expired' ? 'Expired' : 'Broken') })),
            el('td', { class: 'num', text: h.reqMin ? hm(h.min) + ' / ' + hm(h.reqMin) : hm(h.min) }),
            el('td', { class: 'num', text: num(h.summoners) + (h.top ? ' · ' + h.top : '') }),
            el('td', { class: 'num', text: day(h.ended) })
          ]));
        });
        t.appendChild(tb);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The record' }), t]));
      }
      out.push(foot(d.now ? d.now : null));
      return out;
    });
  }

  // ================================================================== CODEX (achievements + leaderboards)
  function codex(ctx) {
    return load('codex.json').then(function (d) {
      var st = ctx.state;
      var out = [head(ctx.opts, 'The Codex', 'Revelations of the Tentacle Union',
        'Achievements earned on stream, across Twitch, YouTube and Kick. Link your accounts with !link so they count together. !codex hide keeps you off this page.')];
      var boards = (d.leaderboards || []).filter(function (b) { return (b.allTime && b.allTime.length) || (b.month && b.month.length); });
      if (boards.length) {
        if (!st.board) st.board = boards[0].stat;
        if (!st.period) st.period = 'allTime';
        var sec = el('section', { class: 'eldr-card' });
        var pick = el('select', { class: 'eldr-select', 'aria-label': 'Leaderboard' }, boards.map(function (b) { return el('option', { value: b.stat, text: b.label || b.stat, selected: b.stat === st.board }); }));
        var per = el('div', { class: 'eldr-chips', style: { margin: '0', justifyContent: 'flex-start' } });
        var tableBox = el('div');
        function drawBoard() {
          var b = boards.filter(function (x) { return x.stat === st.board; })[0] || boards[0];
          per.innerHTML = '';
          [['allTime', 'All time'], ['month', 'This month']].forEach(function (p) {
            if (p[0] === 'month' && !b.month) return;
            per.appendChild(el('button', { class: 'eldr-chip', type: 'button', 'aria-pressed': String(st.period === p[0]), text: p[1], onclick: function () { st.period = p[0]; drawBoard(); } }));
          });
          var rows = b[st.period] || b.allTime || [];
          tableBox.innerHTML = '';
          if (!rows.length) { tableBox.appendChild(empty('Nobody yet. Be the first.')); return; }
          var t = el('table', { class: 'cx-top' });
          var tb = el('tbody');
          rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('td', { text: '#' + r.rank }), el('td', { text: r.name }), el('td', { class: 'num', text: num(r.value) })])); });
          t.appendChild(tb); tableBox.appendChild(t);
        }
        pick.addEventListener('change', function () { st.board = pick.value; drawBoard(); });
        sec.appendChild(el('h2', { text: 'The Ledger of Names' }));
        sec.appendChild(el('div', { class: 'cx-controls' }, [pick, per]));
        sec.appendChild(tableBox);
        drawBoard();
        out.push(sec);
      }
      var achs = d.achievements || [];
      if (achs.length) {
        var catName = {}, catOrder = [];
        (d.categories || []).forEach(function (c) { catName[c.id] = c.name; catOrder.push(c.id); });
        var byCat = {};
        achs.forEach(function (a) { var k = a.category || 'other'; (byCat[k] = byCat[k] || []).push(a); if (catOrder.indexOf(k) < 0) catOrder.push(k); });
        var total = achs.length, unlockedAny = achs.filter(function (a) { return a.unlocked > 0; }).length;
        var sec2 = el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'Revelations' }), el('span', { class: 'eldr-badge gold', text: unlockedAny + ' of ' + total + ' found by someone' })])]);
        var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a Revelation…', 'aria-label': 'Find an achievement', style: { margin: '0 0 12px', maxWidth: 'none' } });
        sec2.appendChild(search);
        var groups = [];
        catOrder.forEach(function (k) {
          var list = byCat[k]; if (!list) return;
          list.sort(function (a, b) { return (a.tier || 0) - (b.tier || 0) || (b.unlocked || 0) - (a.unlocked || 0); });
          var found = list.filter(function (a) { return a.unlocked > 0; }).length;
          var det = el('details', null, [el('summary', null, [el('span', { class: 't', text: catName[k] || k }), el('span', { class: 'eldr-small eldr-muted', text: found + ' / ' + list.length })])]);
          var box = el('div');
          list.forEach(function (a) {
            var node = el('div', { class: 'cx-ach' + (a.hidden ? ' secret' : '') }, [
              el('span', { class: 'nm', text: a.name }),
              el('span', { class: 'eldr-badge' + (a.tier >= 9 ? ' teal' : a.tier >= 6 ? ' gold' : ''), text: a.tierName || ('Tier ' + a.tier) }),
              a.desc ? el('span', { class: 'ds', text: a.desc }) : null,
              el('span', { class: 'ds', text: (a.unlocked ? num(a.unlocked) + (a.unlocked === 1 ? ' soul' : ' souls') + ' · ' + a.percent + '%' : 'Nobody yet') + (a.title ? ' · title: ' + a.title : '') + (a.platform && a.platform !== 'any' ? ' · ' + a.platform + ' only' : '') }),
              a.flavor ? el('span', { class: 'fl', text: a.flavor }) : null
            ]);
            node.__hay = (a.name + ' ' + (a.desc || '') + ' ' + (a.title || '')).toLowerCase();
            box.appendChild(node);
          });
          det.appendChild(box);
          groups.push({ det: det, box: box });
          sec2.appendChild(det);
        });
        search.addEventListener('input', function () {
          var q = search.value.trim().toLowerCase();
          groups.forEach(function (g) {
            var any = false;
            Array.prototype.forEach.call(g.box.children, function (n) { var hit = !q || n.__hay.indexOf(q) >= 0; n.style.display = hit ? '' : 'none'; if (hit) any = true; });
            g.det.style.display = any ? '' : 'none';
            if (q) g.det.open = any;
          });
        });
        out.push(sec2);
      }
      var rec = d.recent || [];
      if (rec.length) {
        var t = el('table');
        var tb = el('tbody');
        rec.forEach(function (r) { tb.appendChild(el('tr', null, [el('td', { text: r.name }), el('td', { text: r.achievement }), el('td', { class: 'num eldr-muted', text: ago(r.at) })])); });
        t.appendChild(tb);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Lately revealed' }), t]));
      }
      if (!boards.length && !achs.length) out.push(empty('The Codex has not been written yet.'));
      out.push(foot(d.generatedAt));
      return out;
    });
  }

  // ================================================================== PARTNERS
  function partners(ctx) {
    return load('partners.json').then(function (d) {
      var list = d.partners || [];
      var out = [head(ctx.opts, 'Patrons of the Ledger', 'Brands that signed the book',
        'Paid partnerships of the stream. Using their links and codes supports the channel.')];
      if (!list.length) { out.push(empty('No patrons have signed the Ledger yet.')); return out.concat(foot(d.updated)); }
      var grid = el('div', { class: 'eldr-grid' });
      list.forEach(function (p) {
        var logo = /^https:\/\//i.test(p.logo || '') ? el('img', { src: p.logo, alt: p.name + ' logo', loading: 'lazy' }) : null;
        grid.appendChild(el('article', { class: 'pt' }, [
          logo,
          el('div', { class: 'eldr-row' }, [el('h3', { text: p.name }), el('span', { class: 'eldr-badge', text: p.label || 'Ad' })]),
          p.blurb ? el('p', { text: p.blurb, style: { margin: 0 } }) : null,
          (p.codes || []).length ? el('div', { class: 'cd' }, p.codes.map(function (c) {
            return el('span', null, [el('code', { text: c.code }), c.text ? ' ' + c.text : '', c.expires ? el('span', { class: 'eldr-muted eldr-small', text: ' until ' + day(c.expires) }) : null]);
          })) : null,
          (p.commands || []).length ? el('div', { class: 'eldr-small eldr-muted' }, ['In chat: '].concat(p.commands.map(function (c) { return el('code', { text: c }); }))) : null,
          /^https?:\/\//i.test(p.link || '') ? el('a', { href: p.link, target: '_blank', rel: 'sponsored noopener', text: 'Visit ' + p.name + ' →' }) : null
        ]));
      });
      out.push(grid, foot(d.updated));
      return out;
    });
  }

  var PAGES = { story: story, commands: commands, pacts: pacts, circles: circles, codex: codex, partners: partners };

  // ------------------------------------------------------------------ mount
  function render(root, quiet) {
    var page = (root.getAttribute('data-eldr-page') || '').toLowerCase().trim();
    var fn = PAGES[page];
    var ctx = root.__eldr || (root.__eldr = { root: root, state: {}, sig: '' });
    ctx.opts = {
      game: root.getAttribute('data-eldr-game') || '',
      noTitle: root.getAttribute('data-eldr-title') === '0'
    };
    root.classList.add('eldr-site');
    if (!fn) { root.innerHTML = ''; root.appendChild(empty('Unknown page "' + page + '". Use one of: ' + Object.keys(PAGES).join(', ') + '.')); return Promise.resolve(); }
    if (!quiet) { root.innerHTML = ''; root.appendChild(el('div', { class: 'eldr-loading', text: 'Opening the Ledger…' })); }
    return loadOpt('site.json').then(function (site) {
      ctx.site = site || {};
      var sig = site ? JSON.stringify(site.files || site.updated || '') : String(Math.random());
      if (quiet && sig === ctx.sig) return;          // nothing new since the last look
      ctx.sig = sig;
      return Promise.resolve(fn(ctx)).then(function (nodes) {
        var y = window.scrollY;
        var wrap = el('div', { class: 'eldr-wrap' });
        nodes.forEach(function (n) { if (n) wrap.appendChild(n); });
        root.innerHTML = '';
        root.appendChild(wrap);
        if (quiet) window.scrollTo(0, y);
      });
    }).catch(function (e) {
      if (window.console) console.warn('[eldritzh] ' + page + ':', e);
      if (!quiet) { root.innerHTML = ''; root.appendChild(failed()); }
    });
  }

  function mount(root) {
    if (root.__eldrMounted) return;
    root.__eldrMounted = true;
    injectStyles();
    render(root, false);
    var mins = parseFloat(root.getAttribute('data-eldr-refresh'));
    if (isNaN(mins)) mins = 5;
    if (mins > 0) {
      var t = setInterval(function () {
        if (!document.body.contains(root)) { clearInterval(t); return; }
        if (document.visibilityState === 'hidden') return;
        cache = {};
        render(root, true);
      }, Math.max(1, mins) * 60000);
    }
  }

  function scan() { Array.prototype.forEach.call(document.querySelectorAll('[data-eldr-page]'), mount); }

  window.__eldrLedger = { scan: scan, version: VERSION, base: BASE, pages: Object.keys(PAGES) };

  // Fourthwall may add sections after load (page builder, client-side navigation): watch for them.
  function start() {
    scan();
    if (window.MutationObserver) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () { pending = false; scan(); }, 150);
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
