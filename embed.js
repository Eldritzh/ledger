/* =====================================================================================
   ⛧ THE ELDRITCH LEDGER — embed.js
   Draws the Eldritzh community pages inside any page (Fourthwall Custom HTML sections).

   Fourthwall section (paste once, never again):
     <div data-eldr-page="story"></div>
     <script src="https://ledger.eldritzh.com/embed.js" defer></script>

   Pages: story · commands · pacts · circles · codex · partners · sounds · bestiary · congregation · order (or esorder) · remembrance
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
  var VERSION = '1.3.2';

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
    '.eldr-site section.eldr-card{background:var(--panel);border:1px solid var(--line);border-top:2px solid var(--gold-dim);border-radius:10px;padding:22px 22px 16px;margin:0 0 22px;scroll-margin-top:90px}',
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
    '.eldr-site select.eldr-jump{display:none;width:100%;max-width:420px;margin:0 auto 12px;cursor:pointer}',
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
    '.eldr-site .st-goal .st-part{margin-top:.35rem;font-size:.95rem;color:var(--muted)}',
    '.eldr-site .st-goal .st-part.done{color:var(--green,#52B788)}',
    '.eldr-site .st-goal .st-wait{margin-top:.5rem;font-style:italic;font-size:.95rem;color:var(--gold,#D4AF37)}',
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
    '.eldr-site details.eldr-about{border:1px solid rgba(82,183,136,.25);border-radius:8px;background:rgba(82,183,136,.04);margin:0 0 14px;padding:0 12px}',
    '.eldr-site details.eldr-about summary{font-family:Montserrat,system-ui,sans-serif;font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--green);padding:10px 0}',
    '.eldr-site details.eldr-about .ab{padding:0 0 10px;font-size:15px}',
    '.eldr-site details.eldr-about .ab p{margin:0 0 .7em}',
    '.eldr-site .eldr-intro p{margin:0 0 .6em}',
    '.eldr-site .eldr-intro p:last-child{margin:0}',
    '.eldr-site details .ab{padding:4px 2px 14px}',
    '.eldr-site .eldr-staffbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;background:rgba(122,42,36,.25);border:1px solid rgba(122,42,36,.8);border-radius:10px;padding:10px 14px;margin:0 0 22px;font-size:14px}',
    '.eldr-site .eldr-staffbar.off{justify-content:center;color:var(--muted)}',
    '.eldr-site .eldr-signin{margin-top:22px}',
    '.eldr-site .eldr-keyrow{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0 0}',
    '.eldr-site .eldr-keyrow input.eldr-keyin{flex:1 1 220px;margin:0;max-width:420px}',
    '.eldr-site .eldr-keymsg{color:#e08a7f;font-size:14px;margin:8px 0 0}',
    '.eldr-site .eldr-keymsg:empty{display:none}',
    '.eldr-site section.eldr-staff{border-top-color:#a8433a;background:linear-gradient(180deg,rgba(122,42,36,.16),var(--panel) 120px)}',
    '.eldr-site section.eldr-staff h2{color:#e08a7f}',
    '@media (max-width:620px){',
    '  .eldr-site{padding:30px 12px 44px;border-radius:0}',
    '  .eldr-site section.eldr-card{padding:16px 14px 10px}',
    '  .eldr-site table.stack thead{display:none}',
    '  .eldr-site table.stack tr{display:block;padding:10px 0;border-bottom:1px solid var(--line)}',
    '  .eldr-site table.stack tr:last-child{border-bottom:none}',
    '  .eldr-site table.stack td{display:block;width:100% !important;border:none;padding:2px 0}',
    '  .eldr-site table.stack td:first-child{margin-bottom:4px}',
    '  .eldr-site code{white-space:normal}',
    '  .eldr-site nav.eldr-chips{display:none}',
    '  .eldr-site select.eldr-jump{display:block}',
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
      el('h1', { text: title }),
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
  function roman(n) { var v = [[50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], r = ''; v.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } }); return r; }
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
          var pr = (state.progress || {})[ch.id], parts = pr && pr.parts && pr.parts.length ? pr.parts : null;
          if (parts && parts.length === 1) { have = Number(parts[0].have); need = Number(parts[0].need); }
          var p100 = pr && pr.pct != null ? Math.min(100, Number(pr.pct)) : pct(have, need);
          var goalKids = [el('div', { class: 'eldr-row' }, [
            el('span', { class: 'h', text: ch.unlock.hint || ('Reach ' + num(need) + ' ' + ch.unlock.counter) }),
            el('span', { class: 'n', text: parts && parts.length > 1 ? Math.floor(p100) + '%' : num(Math.min(have, need)) + ' / ' + num(need) })
          ])];
          if (parts && parts.length > 1) parts.forEach(function (p) {
            goalKids.push(el('div', { class: 'eldr-row st-part' + (p.have >= p.need ? ' done' : '') }, [el('span', { text: p.label }), el('span', { class: 'n', text: num(p.have) + ' / ' + num(p.need) })]));
          });
          goalKids.push(bar(p100));
          if (pr && pr.wait) goalKids.push(el('div', { class: 'st-wait', text: pr.wait.charAt(0).toUpperCase() + pr.wait.slice(1) }));
          body.appendChild(el('div', { class: 'st-goal' }, goalKids));
        }
        list.appendChild(el('li', { class: 'st-entry' + (isOpen ? '' : ' sealed') }, [el('div', { class: 'st-num', text: roman(i + 1) }), body]));
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
  function cells(line) {
    // split on | but not on \| (an escaped pipe inside a cell, e.g. `on\|off`)
    return line.trim().replace(/^\|/, '').replace(/([^\\])\|$/, '$1').replace(/\\\|/g, '\u0000').split('|')
      .map(function (c) { return c.replace(/\u0000/g, '|').trim(); });
  }
  function parseMd(md) {
    var lines = String(md || '').replace(/\r/g, '').split('\n');
    var doc = { title: '', intro: [], sections: [] }, cur = null, para = [];
    function flush() {
      if (!para.length) return;
      var t = para.join(' ').trim(); para = [];
      if (!t || /^\(Master copy/i.test(t)) return;
      (cur ? cur.blocks : doc.intro).push({ type: 'p', text: t });
    }
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (/^#\s+/.test(ln)) { flush(); doc.title = ln.replace(/^#\s+/, '').replace(/[⛧✦☩✠]/g, '').trim(); continue; }
      if (/^##\s+/.test(ln)) { flush(); cur = { title: ln.replace(/^##\s+/, '').trim(), blocks: [] }; doc.sections.push(cur); continue; }
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
      if (!ln.trim()) { flush(); continue; }
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
    return load('commands.md', true).then(function (md) {
      var doc = parseMd(md);
      var nodes = [];
      var h = head(ctx.opts, doc.title || 'The Eldritch Ledger', 'Embrace the Tentacle', '');
      if (h) {
        var introP = h.querySelector('.eldr-intro');
        doc.intro.forEach(function (b) { if (b.type === 'p' && !introP) h.appendChild(introP = el('p', { class: 'eldr-intro', html: inline(b.text.replace(/^\*|\*$/g, '')) })); });
      }
      nodes.push(h);
      var secs = doc.sections.map(function (s) {
        var id = 'eldr-' + slug(s.title.replace(/^[^\w]+/, ''));
        var node = el('section', { class: 'eldr-card', id: id }, [el('h2', { html: inline(s.title) }), aboutBox(guideFor(ctx, s.title))].concat(s.blocks.map(blockNode)));
        return { s: s, id: id, node: node };
      });
      var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a command…', 'aria-label': 'Find a command' });
      var nav = el('nav', { class: 'eldr-chips', 'aria-label': 'Sections' }, secs.map(function (x) {
        return el('a', { class: 'eldr-chip', href: '#' + x.id, text: x.s.title.replace(/^[^\w]+/, '').trim(),
          onclick: function (e) { e.preventDefault(); goTo(x); } });
      }));
      // Phones: 29 chips in a sideways strip were unreachable (the swipe gets eaten by the shop page), so show a picker instead.
      var jump = el('select', { class: 'eldr-select eldr-jump', 'aria-label': 'Jump to a section',
        onchange: function () { var x = secs[+jump.value]; jump.selectedIndex = 0; if (x) goTo(x); } },
        [el('option', { value: '', text: 'Jump to a section…' })].concat(secs.map(function (x, i) {
          return el('option', { value: String(i), text: x.s.title.replace(/^[^\w]+/, '').replace(/\*/g, '').trim() });
        })));
      function goTo(x) {
        if (search.value) { search.value = ''; search.dispatchEvent(new Event('input')); }
        x.node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
      nodes.push(el('div', { class: 'eldr-jumpbox' }, [nav, jump]), search);
      secs.forEach(function (x) { nodes.push(x.node); });
      nodes.push(foot(ctx.site && ctx.site.files && ctx.site.files['commands.md']));
      return staffSections(ctx).then(function (staff) {
        if (staff.length) nodes.splice(1, 0, staff[0]); if (staff.length > 1) nodes.splice(4, 0, el('div', null, staff.slice(1)));
        if (!stored(STAFF_KEY) && ctx.site && ctx.site.staffApi) nodes.push(staffSignIn());
        return nodes;
      });
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

  // ================================================================== GUIDE (guide.md: "## Title" -> what it is)
  function gkey(s) { return String(s || '').toLowerCase().replace(/^page:\s*/, 'page:').replace(/[^a-z0-9:]+/g, ''); }
  function parseGuide(md) {
    var map = {}, cur = null, buf = [];
    function done() { if (cur) map[gkey(cur)] = buf.join('\n').trim(); }
    String(md || '').replace(/\r/g, '').split('\n').forEach(function (ln) {
      if (/^##\s+/.test(ln)) { done(); cur = ln.replace(/^##\s+/, '').trim(); buf = []; }
      else if (cur) buf.push(ln);
    });
    done();
    return map;
  }
  function guideNodes(md) {
    var doc = parseMd('## x\n' + md);
    var blocks = doc.sections.length ? doc.sections[0].blocks : [];
    return blocks.map(function (b) { return b.type === 'p' ? el('p', { html: inline(b.text) }) : blockNode(b); });
  }
  function guideFor(ctx, title) { var g = ctx.guide || {}; return g[gkey(title)] || g[gkey(String(title).replace(/^[^\w]+/, ''))] || ''; }
  function aboutBox(md, open) {
    if (!md) return null;
    return el('details', { class: 'eldr-about', open: !!open }, [el('summary', null, el('span', { class: 't', text: 'What is this?' })), el('div', { class: 'ab' }, guideNodes(md))]);
  }

  // ================================================================== STAFF VIEW (key from /modkey, checked by the forge)
  var STAFF_KEY = 'eldr_staff_key';
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e2) {} } }
  function stored(k) { try { var v = localStorage.getItem(k); if (v) return v; } catch (e) {} try { return sessionStorage.getItem(k); } catch (e2) { return null; } }
  function takeKeyFromUrl() {
    // #eldr-key=... (never sent to any server) or the old ?key=...; either way it is removed from the address bar
    var key = null, h = location.hash || '', m = h.match(/(?:^#|&)eldr-key=([A-Za-z0-9_\-]+)/);
    if (m) { key = m[1]; h = h.replace(m[0], '').replace(/^#&/, '#'); if (h === '#') h = ''; }
    var q = new URLSearchParams(location.search);
    if (!key && q.get('key') && /^eldr_/.test(q.get('key'))) key = q.get('key');
    if (q.has('key')) q.delete('key');
    if (key) {
      store(STAFF_KEY, key);
      try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + h); } catch (e) {}
    }
    try { sessionStorage.removeItem('eldr_mod_key'); } catch (e) {}   // the old unchecked key
  }
  function staffSignIn() {
    // paste box for a /modkey key (or the whole link from Discord); shown only when this browser has no key
    var input = el('input', { class: 'eldr-search eldr-keyin', type: 'password', autocomplete: 'off', spellcheck: 'false',
      placeholder: 'eldr_… or the link from Discord', 'aria-label': 'Staff key' });
    var msg = el('p', { class: 'eldr-keymsg' });
    function go(ev) {
      if (ev) ev.preventDefault();
      var v = (input.value || '').trim(), m = v.match(/eldr_[A-Za-z0-9_\-]+/);
      if (!m || m[0].length > 80) { msg.textContent = 'That doesn\'t look like a staff key. It starts with eldr_.'; return; }
      store(STAFF_KEY, m[0]); location.reload();
    }
    return el('details', { class: 'eldr-about eldr-signin' }, [
      el('summary', null, el('span', { class: 't', text: 'Staff sign-in' })),
      el('form', { class: 'ab', onsubmit: go }, [
        el('p', { text: 'Staff: run /modkey get in Discord and paste the key here. This browser remembers it until you sign out.' }),
        el('div', { class: 'eldr-keyrow' }, [input, el('button', { class: 'eldr-chip', type: 'submit', text: 'Sign in' })]),
        msg])]);
  }
  function staffSections(ctx) {
    var key = stored(STAFF_KEY), api = ctx.site && ctx.site.staffApi;
    if (!key || !api) return Promise.resolve([]);
    return fetch(api.replace(/\/+$/, '') + '/web/staff', { headers: { 'X-Staff-Key': key }, cache: 'no-store', credentials: 'omit' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.status === 401) { store(STAFF_KEY, null); return [el('div', { class: 'eldr-staffbar off', text: 'Your staff key has expired or was revoked. Get a new one in Discord with /modkey get.' })]; }
        if (!res.j || !res.j.ok) return [el('div', { class: 'eldr-staffbar off', text: (res.j && res.j.error) || 'The staff view could not be loaded.' })];
        var out = [el('div', { class: 'eldr-staffbar' }, [
          el('span', { text: 'Staff view · ' + (res.j.name || 'staff') + ' · key valid until ' + day(res.j.expires) }),
          el('button', { class: 'eldr-chip', type: 'button', text: 'Sign out', onclick: function () { store(STAFF_KEY, null); location.reload(); } })])];
        var doc = parseMd(res.j.markdown || '');
        if (doc.intro.length) out.push(el('section', { class: 'eldr-card eldr-staff' }, [el('h2', { text: 'For staff' })].concat(doc.intro.map(blockNode))));
        doc.sections.forEach(function (s) { out.push(el('section', { class: 'eldr-card eldr-staff' }, [el('h2', { html: inline(s.title) })].concat(s.blocks.map(blockNode)))); });
        return out;
      })
      .catch(function () { return [el('div', { class: 'eldr-staffbar off', text: 'The staff view is out of reach right now (the forge may be offline).' })]; });
  }

  // ================================================================== SOUNDS (sounds.txt)
  var WHO = { viewer: 'Everyone', sub: 'Subscribers & members', special: 'Special folks', vip: 'VIPs', mod: 'Mods' };
  function priceText(p) {
    p = String(p || '').trim().toLowerCase();
    if (p === '' ) return '';
    if (p === 'free' || p === '0') return 'Free';
    var m = p.match(/^(\d+)\s*(p|e)$/);
    if (m) { var n = +m[1]; return m[2] === 'p' ? n + (n === 1 ? ' Pact' : ' Pacts') : n + (n === 1 ? ' Eldritch Pact' : ' Eldritch Pacts'); }
    if (/^\d+$/.test(p)) return num(+p) + ' Madness';
    return p;
  }
  function secsText(s) { s = +s || 0; return s <= 0 ? 'none' : s < 120 ? s + ' s' : Math.round(s / 60) + ' min'; }
  function sounds(ctx) {
    return load('sounds.json').then(function (d) {
      var list = d.sounds || [], st = ctx.state;
      var out = [head(ctx.opts, 'Sounds', 'Make the stream scream',
        'Type a sound\'s name in chat to play it on stream. Each one has its own price, cooldown and audience.')];
      if (d.enabled === false) out.push(el('p', { class: 'eldr-note', text: 'The sound engine is switched off right now. The list below is what plays when it is back.' }));
      var notes = [];
      if (d.happyHour) notes.push('Happy hour makes Madness prices cheaper (Pacts are never discounted).');
      if (list.some(function (s) { return s.bits > 0; })) notes.push('Cheer bits, send a Super Chat or KICKs with the sound\'s name in the message (like <code>!steven</code>) to play it with money' + (d.moneyAnyTier ? ', whoever you are.' : '.'));
      if (list.some(function (s) { return s.others; })) notes.push('<strong>Unlock</strong> means anyone outside that audience can still play it, for that price.');
      if (d.userCooldown > 0) notes.push('You can play one sound every ' + secsText(d.userCooldown) + '.');
      if (notes.length) out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'How it works' }), el('ul', null, notes.map(function (n) { return el('li', { html: n }); })), el('p', { class: 'eldr-muted eldr-small', html: '<code>!sounds</code> in chat lists the sounds open to you with your price. <code>!sound info &lt;name&gt;</code> tells you everything about one.' })]));
      if (!list.length) { out.push(empty('No sounds yet.')); return out.concat(foot(d.updated)); }
      if (!st.who) st.who = 'all';
      var tools = el('div', { class: 'pa-tools' });
      var filters = [['all', 'All'], ['viewer', 'Everyone'], ['sub', 'Subscribers'], ['special', 'Special folks'], ['bits', 'With bits']];
      var chips = el('div', { class: 'eldr-chips', style: { margin: '0' } });
      var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a sound…', 'aria-label': 'Find a sound', value: st.q || '' });
      tools.appendChild(chips); tools.appendChild(search);
      var box = el('div');
      function draw() {
        chips.innerHTML = '';
        filters.forEach(function (f) { chips.appendChild(el('button', { class: 'eldr-chip', type: 'button', 'aria-pressed': String(st.who === f[0]), text: f[1], onclick: function () { st.who = f[0]; draw(); } })); });
        box.innerHTML = '';
        var q = (st.q || '').toLowerCase().replace(/^!/, '');
        var groups = {}, order = [];
        list.forEach(function (s) {
          if (st.who === 'bits' ? !(s.bits > 0) : st.who !== 'all' && (s.who || []).indexOf(st.who) < 0) return;
          var hay = (s.id + ' ' + (s.label || '') + ' ' + (s.aliases || []).join(' ')).toLowerCase();
          if (q && hay.indexOf(q) < 0) return;
          var g = s.group || 'Sounds';
          if (!groups[g]) { groups[g] = []; order.push(g); }
          groups[g].push(s);
        });
        if (!order.length) { box.appendChild(empty('No sound matches that.')); return; }
        order.forEach(function (g) {
          var t = el('table', { class: 'stack' });
          t.appendChild(el('thead', null, el('tr', null, ['Command', 'Who', 'Price', 'Cooldown'].map(function (x) { return el('th', { text: x }); }))));
          var tb = el('tbody');
          groups[g].forEach(function (s) {
            var pr = s.price || {}, parts = [];
            if (pr.base) parts.push(priceText(pr.base));
            Object.keys(pr).forEach(function (k) { if (k !== 'base') parts.push((WHO[k] || k) + ': ' + priceText(pr[k])); });
            var who = (s.who || []).map(function (w) { return WHO[w] || w; }).join(' or ');
            tb.appendChild(el('tr', { style: s.off ? { opacity: '.55' } : null }, [
              el('td', null, [el('code', { text: '!' + s.id }), ' ', el('strong', { text: s.label || '' }),
                (s.aliases || []).length ? el('div', { class: 'eldr-small eldr-muted', text: 'also ' + s.aliases.map(function (a) { return '!' + a; }).join(', ') }) : null,
                s.off ? el('span', { class: 'eldr-badge red', text: 'silenced' }) : null]),
              el('td', null, [who, s.others ? el('div', { class: 'eldr-small eldr-muted', text: 'Others: unlock for ' + priceText(s.others) }) : null]),
              el('td', null, [parts.join(' · '), s.bits > 0 ? el('div', { class: 'eldr-small eldr-muted', text: 'or cheer ' + num(s.bits) + ' bits' }) : null]),
              el('td', { text: secsText(s.cooldown) })
            ]));
          });
          t.appendChild(tb);
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: g.charAt(0).toUpperCase() + g.slice(1) }), t]));
        });
      }
      search.addEventListener('input', function () { st.q = search.value; draw(); });
      draw();
      out.push(tools, box, foot(ctx.site && ctx.site.files && ctx.site.files['sounds.json']));
      return out;
    });
  }

  // ================================================================== BESTIARY (beings, families, every enemy, legends)
  var GROUPS = { mythos: 'The Mythos', otherworld: 'The Otherworld', legend: 'Legends' };
  var DEPTH = { shallow: 'Shallows', deep: 'Deep', abyss: 'Abyss' };
  var WHERE = { deep: 'the Deep', abyss: 'the Abyss', any: 'any depth', raid: 'raid boss', shallow: 'the Shallows' };
  function bestiary(ctx) {
    return load('bestiary.json').then(function (d) {
      var st = ctx.state, fams = d.families || [], beings = d.beings || [], horrors = d.horrors || [], weapons = d.weapons || [];
      var famById = {}; fams.forEach(function (f) { famById[f.id] = f; });
      var foeCount = fams.reduce(function (a, f) { return a + (f.foes || []).length; }, 0);
      var out = [head(ctx.opts, 'The Bestiary', 'What waits beneath the stream', '')];
      out.push(el('div', { class: 'eldr-stats' }, [
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(beings.length) }), el('span', { text: 'Beings' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(fams.length) }), el('span', { text: 'Families' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(foeCount) }), el('span', { text: 'Enemies of the deep' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(horrors.length) }), el('span', { text: 'Legendary horrors' })])
      ]));
      var search = el('input', { class: 'eldr-search', type: 'search', placeholder: 'Find a creature…', 'aria-label': 'Find a creature', value: st.q || '' });
      out.push(search);
      var searchables = [];   // {node, hay, parent?}

      // Beings
      if (beings.length) {
        var grid = el('div', { class: 'eldr-grid' });
        beings.forEach(function (b) {
          var card = el('article', { class: 'ci' }, [
            el('div', { class: 'eldr-row' }, [el('h3', { text: b.name }), b.typeLabel ? el('span', { class: 'eldr-badge green', text: b.typeLabel }) : null]),
            b.hint ? el('p', { class: 'eldr-small', style: { fontStyle: 'italic', margin: '6px 0' }, text: b.hint }) : null,
            el('div', { class: 'eldr-small eldr-muted', text: num(b.madness[0]) + '–' + num(b.madness[1]) + ' Madness' + (b.ichor ? ' · ' + b.ichor + ' Ichor' : '') + (b.seconds ? ' · gone after ' + secsText(b.seconds) : '') }),
            (b.aliases || []).length ? el('div', { class: 'eldr-small eldr-muted', text: 'Also answers to: ' + b.aliases.join(', ') }) : null
          ]);
          grid.appendChild(card);
          searchables.push({ node: card, hay: (b.name + ' ' + (b.aliases || []).join(' ') + ' ' + (b.typeLabel || '')).toLowerCase() });
        });
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Beings' }),
          el('p', { class: 'eldr-muted eldr-small', html: 'They break through onto the stream itself. Before one appears, chat gets a hint of what kind of thing is coming. Type its name to banish it; <code>!pour</code> Ichor into the tear for a bigger reward.' }), grid]));
      }

      // Families, by group
      ['mythos', 'otherworld', 'legend'].concat(Object.keys(fams.reduce(function (a, f) { if (!GROUPS[f.group]) a[f.group] = 1; return a; }, {}))).forEach(function (g) {
        var list = fams.filter(function (f) { return f.group === g; });
        if (!list.length) return;
        var sec = el('section', { class: 'eldr-card' }, [el('h2', { text: GROUPS[g] || g })]);
        if (g === 'legend') sec.appendChild(el('p', { class: 'eldr-muted eldr-small', text: 'Legend families have no lord and no Gate Key; their horrors only turn up rarely, and their materials come from them.' }));
        list.forEach(function (f) {
          var foes = (f.foes || []).slice().sort(function (a, b) { var o = { shallow: 1, deep: 2, abyss: 3 }; return (o[a.depth] || 0) - (o[b.depth] || 0); });
          var legends = horrors.filter(function (h) { return h.family === f.id; });
          var det = el('details', null, [el('summary', null, [el('span', { class: 't', text: f.label }),
            el('span', { class: 'eldr-small eldr-muted', style: { fontFamily: 'inherit', fontWeight: '400' }, text: (foes.length ? foes.length + (foes.length === 1 ? ' enemy' : ' enemies') : legends.length + (legends.length === 1 ? ' horror' : ' horrors')) + (f.lord ? ' · lord: ' + f.lord : '') })])]);
          var body = el('div', { class: 'ab' });
          if (f.lord) body.appendChild(el('p', null, [el('strong', { text: 'Lord: ' + f.lord + '. ' }), el('em', { text: f.lordLine || '' })]));
          var mats = f.materials || {};
          body.appendChild(el('p', { class: 'eldr-small' }, [el('strong', { text: 'Drops: ' }),
            (mats.common || []).join(', '), (mats.rare || []).length ? ' · rare: ' + mats.rare.join(', ') : '', (mats.boss || []).length ? ' · from the lord: ' + mats.boss.join(', ') : '',
            f.lure ? ' · lure: ' + f.lure : '']));
          if ((f.beings || []).length) body.appendChild(el('p', { class: 'eldr-small' }, [el('strong', { text: 'Beings of this kind: ' }), f.beings.join(', ')]));
          if (foes.length) {
            var t = el('table', { class: 'stack' });
            t.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Enemy' }), el('th', { text: 'Where' }), el('th', { text: 'Encounter' })])));
            var tb = el('tbody');
            foes.forEach(function (x) {
              var tr = el('tr', null, [el('td', null, el('strong', { text: x.name })), el('td', { text: x.depth ? DEPTH[x.depth] || x.depth : 'Descend' }),
                el('td', { class: 'eldr-small', style: { fontStyle: x.line ? 'italic' : 'normal' }, text: x.line || '' })]);
              tb.appendChild(tr);
              searchables.push({ node: tr, hay: (x.name + ' ' + f.label).toLowerCase(), det: det });
            });
            t.appendChild(tb); body.appendChild(t);
          }
          if (legends.length) body.appendChild(el('p', { class: 'eldr-small' }, [el('strong', { text: 'Legendary horrors: ' }), legends.map(function (h) { return h.name + ' (' + (WHERE[h.where] || h.where) + ')'; }).join(', ')]));
          det.appendChild(body); sec.appendChild(det);
          searchables.push({ node: det, hay: (f.label + ' ' + (f.lord || '') + ' ' + (f.beings || []).join(' ')).toLowerCase(), isDet: true });
        });
        out.push(sec);
      });

      // legendary horrors and weapons
      if (horrors.length) {
        var t2 = el('table', { class: 'stack' }), tb2 = el('tbody');
        t2.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Horror' }), el('th', { text: 'Where' }), el('th', { text: 'It appears' })])));
        horrors.forEach(function (h) {
          var tr = el('tr', null, [el('td', null, el('strong', { text: h.name })), el('td', { text: WHERE[h.where] || h.where }), el('td', { class: 'eldr-small', style: { fontStyle: 'italic' }, text: h.line || '' })]);
          tb2.appendChild(tr); searchables.push({ node: tr, hay: h.name.toLowerCase() });
        });
        t2.appendChild(tb2);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Legendary horrors' }),
          el('p', { class: 'eldr-muted eldr-small', text: 'Rare in the deep and the abyss, harder to beat and better paid. The raid bosses answer when the streamer summons a raid.' }), t2]));
      }
      if (weapons.length) {
        var t3 = el('table', { class: 'stack' }), tb3 = el('tbody');
        t3.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Weapon' }), el('th', { text: 'Kind' }), el('th', { text: 'Wielder' })])));
        weapons.forEach(function (w) {
          var tr = el('tr', null, [el('td', null, el('strong', { text: w.name })), el('td', { text: w.type }), el('td', { text: w.wielder })]);
          tb3.appendChild(tr); searchables.push({ node: tr, hay: (w.name + ' ' + w.wielder).toLowerCase() });
        });
        t3.appendChild(tb3);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Legendary weapons' }),
          el('p', { class: 'eldr-muted eldr-small', text: 'Fate hands one out now and then in duels and descents, and sealing a boon makes it likelier. Sometimes the wielder steps out of legend to fight beside you.' }), t3]));
      }
      function filter() {
        var q = (st.q || '').trim().toLowerCase();
        searchables.forEach(function (s) { if (!s.isDet) s.node.style.display = !q || s.hay.indexOf(q) >= 0 ? '' : 'none'; });
        searchables.forEach(function (s) {
          if (!s.isDet) return;
          var any = !q || s.hay.indexOf(q) >= 0 || Array.prototype.some.call(s.node.querySelectorAll('tbody tr'), function (tr) { return tr.style.display !== 'none'; });
          if (s.hay.indexOf(q) >= 0 && q) s.node.querySelectorAll('tbody tr').forEach(function (tr) { tr.style.display = ''; });
          s.node.style.display = any ? '' : 'none';
          if (q) s.node.open = any;
        });
      }
      search.addEventListener('input', function () { st.q = search.value; filter(); });
      if (st.q) filter();
      out.push(foot(ctx.site && ctx.site.files && ctx.site.files['bestiary.json']));
      return out;
    });
  }

  // ================================================================== CONGREGATION (cults, Tsathoggua, nemeses, depths, clips)
  function congregation(ctx) {
    return Promise.all([load('congregation.json'), loadOpt('codex.json')]).then(function (r) {
      var d = r[0] || {}, cx = r[1] || {};
      var out = [head(ctx.opts, 'The Congregation', 'The state of the dark', '')];
      // cults
      var cu = d.cults;
      if (cu && cu.list) {
        var max = Math.max.apply(null, cu.list.map(function (c) { return c.glory || 0; }).concat([1]));
        var reign = cu.list.filter(function (c) { return c.id === cu.reigning; })[0];
        var grid = el('div', { class: 'eldr-grid' });
        cu.list.forEach(function (c, i) {
          grid.appendChild(el('article', { class: 'ci' + (c.id === cu.reigning ? ' bound' : '') }, [
            el('div', { class: 'eldr-row' }, [el('h3', null, [el('span', { class: 'id', text: '#' + (i + 1) }), c.deity]), c.id === cu.reigning ? el('span', { class: 'eldr-badge gold', text: 'Reigning' }) : null]),
            el('div', { class: 'eldr-small eldr-muted', text: c.name }),
            bar(pct(c.glory, max), c.id === cu.reigning ? 'gold' : ''),
            el('div', { class: 'eldr-row eldr-small' }, [el('span', { text: num(c.glory) + ' glory' }), el('span', { class: 'eldr-muted', text: c.members + ' faithful' })]),
            el('div', { class: 'eldr-small', text: 'Boon: ' + c.boon })
          ]));
        });
        out.push(el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'The cults' }), el('span', { class: 'eldr-badge', text: 'Glory in ' + (function (m) { var x = new Date((m || '') + '-01T12:00:00Z'); return isNaN(x) ? 'this month' : x.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); })(cu.month) })]),
          reign ? el('p', { html: '<strong>' + esc(reign.deity) + '</strong> reigns, crowned last month.' }) : null,
          grid, el('p', { class: 'eldr-muted eldr-small', html: 'Join with <code>!cult join &lt;name&gt;</code>. Everything you do earns your cult glory; the winners of the month are rewarded.' })]));
      }
      // Tsathoggua
      var ts = d.tsathoggua;
      if (ts) {
        var rows = function (l) { var t = el('table', { class: 'cx-top' }), tb = el('tbody'); l.forEach(function (x, i) { tb.appendChild(el('tr', null, [el('td', { text: '#' + (i + 1) }), el('td', { text: x.name }), el('td', { class: 'num', text: num(x.fed) })])); }); t.appendChild(tb); return t; };
        out.push(el('section', { class: 'eldr-card' }, [
          el('div', { class: 'eldr-row' }, [el('h2', { text: 'Tsathoggua' }), el('span', { class: 'eldr-badge ' + (ts.asleep ? 'teal' : 'green'), text: ts.sealed ? 'Sealed' : ts.asleep ? 'Full and asleep' : 'Hungry' })]),
          bar(ts.pct, 'gold'),
          el('div', { class: 'eldr-row eldr-small' }, [el('span', { text: ts.pct + '% full' }), el('span', { class: 'eldr-muted', text: num(ts.full) + ' / ' + num(ts.target) })]),
          (ts.now || []).length ? el('h3', { text: 'Feeding him now' }) : null, (ts.now || []).length ? rows(ts.now) : null,
          (ts.allTime || []).length ? el('h3', { text: 'His most devoted, all time' }) : null, (ts.allTime || []).length ? rows(ts.allTime) : null,
          el('p', { class: 'eldr-muted eldr-small', html: '<code>!feed 500</code>, <code>!feed pact</code> or Sanity on Twitch. Fill him and he sleeps, and blessings spill over the chat.' })]));
      }
      // nemeses
      var nm = d.nemeses;
      if (nm) {
        var card = function (n) {
          return el('article', { class: 'ci' + (n.warchief ? ' bound' : '') }, [
            el('div', { class: 'eldr-row' }, [el('h3', { text: n.name + (n.epithet ? (/^(the|of|from|who) /i.test(n.epithet) ? ' ' : ', ') + n.epithet : '') }),
              n.warchief ? el('span', { class: 'eldr-badge gold', text: 'Warchief' }) : n.ended ? el('span', { class: 'eldr-badge red', text: 'Slain ' + day(n.ended) }) : el('span', { class: 'eldr-badge', text: 'Level ' + n.level })]),
            el('div', { class: 'eldr-small eldr-muted', text: [n.kind, n.family, n.home ? DEPTH[n.home] || n.home : ''].filter(Boolean).join(' · ') }),
            el('div', { class: 'eldr-small', text: num(n.victims) + (n.victims === 1 ? ' victim' : ' victims') + (n.scars ? ' · ' + n.scars + (n.scars === 1 ? ' scar' : ' scars') : '') }),
            (n.traits || []).length ? el('div', { class: 'cd', style: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' } },
              n.traits.map(function (t) { return el('span', { class: 'eldr-badge ' + (t.kind === 'w' ? 'green' : 'red'), title: t.flavor || '', text: t.name }); })) : null
          ]);
        };
        var cap = el('div', { class: 'eldr-grid' }); (nm.captains || []).forEach(function (n) { cap.appendChild(card(n)); });
        var sec = el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'The nemeses' }), el('span', { class: 'eldr-badge', text: nm.alive + ' alive · ' + nm.dead + ' slain' })]),
          (nm.captains || []).length ? cap : empty('No nemesis walks the dark right now.'),
          el('p', { class: 'eldr-muted eldr-small', html: 'Red traits make it stronger, green ones are its weaknesses (hover for what they do). <code>!nemesis board</code> in chat shows the same.' })]);
        if ((nm.slain || []).length) { var sl = el('div', { class: 'eldr-grid' }); nm.slain.forEach(function (n) { sl.appendChild(card(n)); }); sec.appendChild(el('h3', { text: 'Lately slain' })); sec.appendChild(sl); }
        out.push(sec);
      }
      // the depths (from the Codex boards)
      var want = [['delve_deepest_shallow', 'Deepest in the Shallows'], ['delve_deepest_deep', 'Deepest in the Deep'], ['delve_deepest_abyss', 'Deepest in the Abyss'], ['delve_bottoms', 'Bottoms broken'], ['nemeses_slain', 'Nemeses slain'], ['warchiefs_slain', 'Warchiefs slain']];
      var boards = (cx.leaderboards || []);
      var tiles = el('div', { class: 'eldr-grid' }), anyB = false;
      want.forEach(function (w) {
        var b = boards.filter(function (x) { return x.stat === w[0]; })[0];
        var rowsB = b && (b.allTime || []).slice(0, 5);
        if (!rowsB || !rowsB.length) return;
        anyB = true;
        var t = el('table', { class: 'cx-top' }), tb = el('tbody');
        rowsB.forEach(function (x) { tb.appendChild(el('tr', null, [el('td', { text: '#' + x.rank }), el('td', { text: x.name }), el('td', { class: 'num', text: num(x.value) })])); });
        t.appendChild(tb);
        tiles.appendChild(el('article', { class: 'ci' }, [el('h3', { text: w[1] }), t]));
      });
      if (anyB) out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Hunters of the deep' }), tiles]));
      // clipomania
      if ((d.clipomania || []).length) {
        var t4 = el('table', { class: 'stack' }), tb4 = el('tbody');
        t4.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Month' }), el('th', { text: 'Champions' })])));
        d.clipomania.forEach(function (m) {
          var dt = new Date(m.month + '-01T12:00:00Z');
          tb4.appendChild(el('tr', null, [el('td', { text: isNaN(dt) ? m.month : dt.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) }),
            el('td', { text: m.top.map(function (x, i) { return (i + 1) + '. ' + x.name + ' (' + x.clips + ')'; }).join('   ') })]));
        });
        t4.appendChild(tb4);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Clipomania champions' }),
          el('p', { class: 'eldr-muted eldr-small', text: 'Clip the stream on Twitch and post it in the Discord clips channel. Every month the top clippers win Pacts.' }), t4]));
      }
      if (out.length === 1) out.push(empty('The congregation has nothing to show yet.'));
      out.push(foot(d.updated));
      return out;
    });
  }

  // ================================================================== THE ESOTERIC ORDER (order.json, 5 Nov)
  function order(ctx) {
    return load('order.json').then(function (d) {
      d = d || {};
      var name = d.name || 'The Esoteric Order of the Tentacle';
      var out = [head(ctx.opts, name, 'Embrace the Tentacle',
        'Show up and the Order remembers. Every stream day you are here counts toward your rank: 25 ranks in five circles, the Oath at rank 13.')];
      var circles = d.circles || [], ranks = d.ranks || [], members = d.members || [];
      var ru = d.rules || {};
      out.push(el('section', { class: 'eldr-card' }, [
        el('h2', { text: 'How it works' }),
        el('p', { html: 'Chat on a stream day and it counts. <code>!order</code> shows your rank and what the next one needs. Your own sub adds ' +
          num(ru.subBonusDays || 0) + ' extra day a month.' }),
        ru.standingFromRank ? el('p', { html: 'From rank ' + ru.standingFromRank + ' you keep your <strong>good standing</strong> by being here ' +
          num(ru.standingDays) + ' days in every ' + num(ru.standingWindow) + '. Out of standing you are <em>astray</em>: the rank stays, the perks wait until you return.' }) : null
      ]));
      // the circles and their ranks
      if (circles.length) {
        var grid = el('div', { class: 'eldr-grid' });
        circles.forEach(function (c) {
          var rs = ranks.filter(function (r) { return r.circle === c.n; });
          var n = members.filter(function (m) { return m.circle === c.n; }).length;
          var t = el('table', { class: 'cx-top' }), tb = el('tbody');
          rs.forEach(function (r) {
            var perk = [r.weeklyPacts ? r.weeklyPacts + ' Pact' + (r.weeklyPacts === 1 ? '' : 's') + ' a week' : '', r.monthlyEldritch ? r.monthlyEldritch + ' Eldritch a month' : ''].filter(Boolean).join(', ');
            tb.appendChild(el('tr', null, [el('td', { text: r.n }), el('td', { text: r.name }), el('td', { class: 'num', title: perk, text: num(r.days) + ' d' })]));
          });
          t.appendChild(tb);
          grid.appendChild(el('article', { class: 'ci' }, [
            el('div', { class: 'eldr-row' }, [el('h3', { text: c.name }), el('span', { class: 'eldr-badge', text: n + (n === 1 ? ' soul' : ' souls') })]), t]));
        });
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The five circles' }), grid,
          el('p', { class: 'eldr-muted eldr-small', text: 'Days are stream days you were here. Hover a rank for its perks.' })]));
      }
      // the members, highest first
      if (members.length) {
        var t2 = el('table', { class: 'stack' }), tb2 = el('tbody');
        t2.appendChild(el('thead', null, el('tr', null, [el('th', { text: '' }), el('th', { text: 'Name' }), el('th', { text: 'Rank' }), el('th', { text: 'Days' })])));
        members.forEach(function (m, i) {
          tb2.appendChild(el('tr', null, [el('td', { text: '#' + (i + 1) }),
            el('td', null, [m.name, m.astray ? el('span', { class: 'eldr-badge red', style: { marginLeft: '6px' }, text: 'astray' }) : null]),
            el('td', { text: m.rank + ' · ' + m.rankName }), el('td', { class: 'num', text: num(m.days) })]));
        });
        t2.appendChild(tb2);
        out.push(el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'The faithful' }), el('span', { class: 'eldr-badge', text: members.length + ' members' })]), t2]));
      } else out.push(empty('Nobody has been counted yet. Chat on a stream day to be the first.'));
      out.push(foot(d.updated));
      return out;
    });
  }

  // ================================================================== THE REMEMBRANCE (remembrance.json, 5 Nov)
  function remembrance(ctx) {
    return load('remembrance.json').then(function (d) {
      d = d || {};
      var ru = d.rules || {};
      var out = [head(ctx.opts, 'The Remembrance', 'Every month, the faithful are remembered',
        'At the start of each month the dark looks back at who kept it company. The most devoted become Heralds; a few more are drawn at random. Everyone gets something.')];
      out.push(el('section', { class: 'eldr-card' }, [
        el('div', { class: 'eldr-row' }, [el('h2', { text: d.monthName || 'Last month' }), el('span', { class: 'eldr-badge', text: num(d.devoted) + ' devoted' })]),
        el('p', { html: 'Be here at least <strong>' + num(ru.minDays) + '</strong> stream days in a month to be counted. Days, subs, gifts, bits, raids and tips give extra entries (up to ' +
          num(ru.maxEntries) + '). The top ' + num(ru.heralds) + ' become <strong>Heralds</strong>, about ' + num(ru.winnerPct) + '% more win a gift, and every devoted soul gets ' +
          num(ru.allMadness) + ' Madness.' })
      ]));
      var list = function (title, rows, cls) {
        if (!rows || !rows.length) return null;
        var t = el('table', { class: 'stack' }), tb = el('tbody');
        rows.forEach(function (r) {
          tb.appendChild(el('tr', null, [el('td', { text: r.name }), el('td', { class: 'eldr-muted', text: r.days ? r.days + ' days' : '' }),
            el('td', null, [r.gift || '', r.rare ? el('span', { class: 'eldr-badge gold', style: { marginLeft: '6px' }, text: 'rare' }) : null])]));
        });
        t.appendChild(tb);
        return el('section', { class: 'eldr-card' }, [el('h2', { text: title }), t]);
      };
      var h = list('Heralds', d.heralds), w = list('Remembered', d.winners);
      if (h) out.push(h);
      if (w) out.push(w);
      if (!h && !w) out.push(empty('No Remembrance has been drawn yet.'));
      if ((d.gifts || []).length) {
        var t3 = el('table', { class: 'stack' }), tb3 = el('tbody');
        t3.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Gift' }), el('th', { text: 'What it does' }), el('th', { text: 'Chance' })])));
        d.gifts.forEach(function (g) {
          tb3.appendChild(el('tr', null, [el('td', null, [g.name, g.tier === 'rare' ? el('span', { class: 'eldr-badge gold', style: { marginLeft: '6px' }, text: 'rare' }) : null]),
            el('td', { class: 'eldr-small', text: g.what || '' }), el('td', { class: 'num', text: g.chancePct + '%' })]));
        });
        t3.appendChild(tb3);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'What can be given' }), t3]));
      }
      out.push(foot(d.updated));
      return out;
    });
  }

  var PAGES = { story: story, commands: commands, pacts: pacts, circles: circles, codex: codex, partners: partners, sounds: sounds, bestiary: bestiary, congregation: congregation, order: order, esorder: order, remembrance: remembrance };

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
      return loadOpt('guide.md', true).then(function (g) { ctx.guide = parseGuide(g || ''); return site; });
    }).then(function (site) {
      var sig = site ? JSON.stringify(site.files || site.updated || '') : String(Math.random());
      if (quiet && sig === ctx.sig) return;          // nothing new since the last look
      ctx.sig = sig;
      return Promise.resolve(fn(ctx)).then(function (nodes) {
        var y = window.scrollY;
        var wrap = el('div', { class: 'eldr-wrap' });
        nodes.forEach(function (n) { if (n) wrap.appendChild(n); });
        var pg = (ctx.guide || {})[gkey('page:' + page)], hd = wrap.querySelector('header.eldr-head');
        if (pg && hd) {
          var old = hd.querySelector('.eldr-intro'); if (old) old.remove();
          var intro = el('div', { class: 'eldr-intro' }, guideNodes(pg));
          var count = hd.querySelector('.st-count'); if (count) hd.insertBefore(intro, count); else hd.appendChild(intro);
        }
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
    takeKeyFromUrl();
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
