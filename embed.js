/* =====================================================================================
   ⛧ THE ELDRITCH LEDGER — embed.js
   Draws the Eldritzh community pages inside any page (Fourthwall Custom HTML sections).

   Fourthwall section (paste once, never again):
     <div data-eldr-page="story"></div>
     <script src="https://ledger.eldritzh.com/embed.js" defer></script>

   Pages: hub · story · commands · pacts · circles · codex · partners · sounds · bestiary · congregation · order (or esorder) ·
          remembrance · rift · investigator (or talents) · covenant · fishing · patchnotes · about
   Options on the div:
     data-eldr-game="hunt-showdown"   pacts: open on this game (default: the game on the wheel now)
     data-eldr-refresh="5"            minutes between quiet re-checks while the page is open (0 = off)
     data-eldr-title="0"              hide the page's own header
     data-eldr-nav="0"                hide the row of links to the other pages (nav.json, from website\nav.txt)

   Data comes from ./data/ next to this file. Streamer.bot's "Website :: Publish" action
   commits it to GitHub; GitHub Pages serves it. Nothing here needs editing for new data.
   ===================================================================================== */
(function () {
  'use strict';

  if (window.__eldrLedger) { window.__eldrLedger.scan(); return; }

  var me = document.currentScript;
  var BASE = (me && me.src) ? me.src.replace(/[^\/]*(\?.*)?$/, '') : 'https://ledger.eldritzh.com/';
  var VERSION = '1.10.0';

  // ------------------------------------------------------------------ tiny helpers
  // 12 Nov: a lineage's or occupation's words carry its boons, then "Bane: ..." / "Banes: ...". Shown as two lines.
  function boonBane(text) {
    var t = String(text || ''), m = t.split(/[.,;:]?\s*\bBanes?:\s*/);
    if (m.length < 2) return el('div', { class: 'eldr-small', text: t });
    var good = m[0].replace(/[.,;\s]+$/, ''), bad = m.slice(1).join(' ').replace(/[.\s]+$/, '');
    return el('div', { class: 'eldr-small' }, [
      el('div', null, [el('strong', { text: 'Good at: ' }), good.charAt(0).toUpperCase() + good.slice(1) + '.']),
      el('div', { class: 'eldr-muted' }, [el('strong', { text: 'Bad at: ' }), bad.charAt(0).toUpperCase() + bad.slice(1) + '.'])]);
  }

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
    /* 12 Nov: switched off right now: a red row with a tag, a whole system folded to its red name bar */
    '.eldr-site .eldr-offtag{color:#f2a59c;background:rgba(122,42,36,.38);border-color:rgba(176,64,56,.9);font-size:10px;margin:0 0 0 8px;vertical-align:middle}',
    '.eldr-site tr.eldr-offrow>td{background:rgba(122,42,36,.16)}',
    '.eldr-site tr.eldr-offrow>td:first-child{box-shadow:inset 3px 0 0 #a23b33}',
    '.eldr-site tr.eldr-offrow code{color:#e0948b;background:rgba(122,42,36,.18);border-color:rgba(176,64,56,.4)}',
    '.eldr-site section.eldr-card.eldr-off{border-color:rgba(162,59,51,.55);border-top-color:#a23b33;background:linear-gradient(180deg,rgba(122,42,36,.24),rgba(122,42,36,.07) 120px),var(--panel)}',
    '.eldr-site section.eldr-off>h2{margin:0}',
    '.eldr-site section.eldr-off.eldr-open>h2,.eldr-site section.eldr-off.eldr-peek>h2{margin:0 0 14px}',
    '.eldr-site section.eldr-off:not(.eldr-open):not(.eldr-peek){padding-bottom:20px}',
    '.eldr-site section.eldr-off:not(.eldr-open):not(.eldr-peek)>:not(h2){display:none !important}',
    '.eldr-site .eldr-offtoggle{all:unset;box-sizing:border-box;display:flex;align-items:center;flex-wrap:wrap;gap:6px 0;width:100%;cursor:pointer;color:#d9877e}',
    '.eldr-site .eldr-offtoggle:focus-visible{outline:2px solid #a23b33;outline-offset:4px;border-radius:4px}',
    '.eldr-site .eldr-offtoggle .eldr-chev{margin-left:auto;padding-left:12px;font-size:14px;color:var(--muted);transition:transform .2s}',
    '.eldr-site .eldr-open .eldr-offtoggle .eldr-chev{transform:rotate(180deg)}',
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
    '.eldr-site .pt-plate{display:flex;align-items:center;justify-content:center;height:96px;margin:-4px -4px 4px;padding:12px 16px;background:var(--panel);border:1px solid var(--line);border-radius:8px}',
    '.eldr-site .pt-plate img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}',
    '.eldr-site .pt-plate.art{height:140px;padding:0;overflow:hidden}',
    '.eldr-site .pt-plate.art img{width:100%;height:100%;object-fit:cover}',
    '.eldr-site .pt-plate .nm{font-family:Cinzel,Georgia,serif;font-weight:700;font-size:22px;color:var(--gold);text-align:center;line-height:1.15}',
    '.eldr-site .pt-cos{display:flex;flex-wrap:wrap;align-items:stretch;gap:0;margin:0 0 2px;border:1px solid var(--line);border-radius:8px;background:var(--panel)}',
    '.eldr-site .pt-co{flex:1 1 0;min-width:96px;display:grid;grid-template-rows:56px auto;justify-items:center;align-items:center;gap:6px;padding:10px 12px}',
    '.eldr-site .pt-co + .pt-co{border-left:1px solid var(--line)}',
    '.eldr-site .pt-co img{max-width:100%;max-height:56px;object-fit:contain}',
    '.eldr-site .pt-co .nm{font-family:Cinzel,Georgia,serif;font-weight:700;font-size:15px;color:#f0ead6;text-align:center;line-height:1.15}',
    '.eldr-site .pt-co .rl{font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);text-align:center}',
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
    /* 11 Nov: the menu, the hub, dots for ranks, the look-up card */
    '.eldr-site nav.eldr-nav{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin:-18px 0 30px;padding:0 0 16px;border-bottom:1px solid var(--line)}',
    '.eldr-site nav.eldr-nav .eldr-chip{font-size:11px;padding:5px 11px}',
    '.eldr-site nav.eldr-nav .eldr-chip.hub{color:var(--gold);border-color:rgba(212,175,55,.45)}',
    '.eldr-site nav.eldr-nav .eldr-chip[aria-current="page"]{border-color:var(--gold);color:#111;background:var(--gold);font-weight:600}',
    '.eldr-site nav.eldr-nav select.eldr-select{font-size:12px;padding:5px 8px;border-radius:999px;cursor:pointer;max-width:170px}',
    '.eldr-site a.hub-card{display:block;color:var(--text);text-decoration:none;transition:border-color .2s,transform .2s}',
    '.eldr-site a.hub-card h3{margin:0 0 6px;color:var(--gold)}',
    '.eldr-site a.hub-card:hover,.eldr-site a.hub-card:focus-visible{border-color:var(--gold);color:var(--text);outline:none;transform:translateY(-2px)}',
    '.eldr-site .eldr-pips{display:inline-flex;gap:4px;align-items:center;vertical-align:middle;white-space:nowrap}',
    '.eldr-site .eldr-pips i{display:block;width:9px;height:9px;border-radius:50%;border:1px solid var(--gold-dim);background:none}',
    '.eldr-site .eldr-pips i.on{background:var(--gold);border-color:var(--gold);box-shadow:0 0 6px rgba(212,175,55,.5)}',
    '.eldr-site .lk-card{max-width:620px;margin:6px auto 8px}',
    '.eldr-site .lk-card h3{margin:14px 0 6px}',
    '.eldr-site .lk-card .eldr-row h3{margin:0;font-size:19px}',
    '.eldr-site .lk-tal{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px}',
    '.eldr-site .lk-t{white-space:nowrap}',
    '.eldr-site ol.cg-stars{margin:0 0 1em;padding-left:1.6em;columns:2;column-gap:28px}',
    '.eldr-site ol.cg-stars li{break-inside:avoid;margin:0 0 .3em}',
    /* 11 Nov: the talent tree */
    '.eldr-site .tt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin:0 0 6px}',
    '.eldr-site .tt-grid section.eldr-card{margin:0;padding:18px 14px 6px;background:radial-gradient(ellipse at 50% 0%,#141a1c 0%,var(--panel) 62%)}',
    '.eldr-site .tt-tree.has{border-top-color:var(--gold)}',
    '.eldr-site .tt-stage{position:relative;margin:6px 0 0}',
    '.eldr-site .tt-lines{position:absolute;inset:0;pointer-events:none}',
    '.eldr-site .tt-lines svg{display:block;width:100%;height:100%;overflow:visible}',
    '.eldr-site .tt-lines path{fill:none;stroke:#2b3037;stroke-width:2;stroke-dasharray:3 5;transition:stroke .25s}',
    '.eldr-site .tt-lines path.on{stroke:var(--gold);stroke-dasharray:none;filter:drop-shadow(0 0 3px rgba(212,175,55,.45))}',
    '.eldr-site .tt-cell{position:absolute;transform:translateX(-50%);width:104px;display:flex;flex-direction:column;align-items:center;text-align:center}',
    '.eldr-site .tt-name{display:block;position:relative;z-index:1;margin-top:7px;padding:1px 5px;border-radius:4px;background:rgba(14,16,19,.92);font-size:12px;line-height:1.25;color:var(--muted);max-width:104px}',
    '.eldr-site .tt-node{z-index:1}',
    '.eldr-site .tt-gate{position:absolute;top:-42px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border-top:1px dashed #2b3037;padding-top:5px;min-width:190px}',
    '.eldr-site .tt-gate.on{color:var(--gold);border-top-color:var(--gold-dim)}',
    '.eldr-site button.tt-node{all:unset;box-sizing:border-box;position:relative;width:56px;height:56px;cursor:pointer;display:block;border-radius:50%;-webkit-tap-highlight-color:transparent}',
    '.eldr-site .tt-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--gold-dim);background:radial-gradient(circle at 50% 35%,#1b2023 0%,#0b0d0f 75%);color:var(--gold-dim);display:flex;align-items:center;justify-content:center;transition:border-color .2s,box-shadow .2s,color .2s,background .2s,transform .15s}',
    '.eldr-site .tt-ring svg{width:30px;height:30px;display:block}',
    '.eldr-site .tt-rank{position:absolute;right:-12px;bottom:-5px;font-size:10px;font-weight:600;line-height:1;padding:3px 6px;border-radius:999px;background:#0b0d0f;border:1px solid var(--line);color:var(--muted);white-space:nowrap}',
    '.eldr-site .tt-node:hover .tt-ring,.eldr-site .tt-node:focus-visible .tt-ring{transform:scale(1.07);box-shadow:0 0 0 3px rgba(212,175,55,.14),0 0 16px rgba(212,175,55,.3)}',
    '.eldr-site .tt-node:focus-visible .tt-ring{outline:2px solid var(--green);outline-offset:3px}',
    '.eldr-site .tt-node.open .tt-ring{border-color:var(--gold-dim);color:#b9982f}',
    '.eldr-site .tt-node.some .tt-ring{border-color:var(--gold);color:var(--gold);box-shadow:0 0 12px rgba(212,175,55,.28)}',
    '.eldr-site .tt-node.some .tt-rank{color:var(--gold);border-color:var(--gold-dim)}',
    '.eldr-site .tt-node.full .tt-ring{border-color:#f0d36b;color:#15120a;background:radial-gradient(circle at 50% 30%,#f3d977 0%,var(--gold) 55%,#8f7624 100%);box-shadow:0 0 18px rgba(212,175,55,.5)}',
    '.eldr-site .tt-node.full .tt-rank{color:#15120a;background:var(--gold);border-color:#f0d36b}',
    '.eldr-site .tt-node.locked{cursor:not-allowed}',
    '.eldr-site .tt-node.locked .tt-ring{border-color:#2b3037;color:#3a4048;background:#0b0d0f}',
    '.eldr-site .tt-node.locked:hover .tt-ring{transform:none;box-shadow:none}',
    '.eldr-site .tt-node.soon{cursor:default}',
    '.eldr-site .tt-node.soon .tt-ring{border-style:dashed;border-color:#2b3037;color:#3a4048}',
    '.eldr-site .tt-node.soon:hover .tt-ring{transform:none;box-shadow:none}',
    '.eldr-site .tt-node.sel .tt-ring{box-shadow:0 0 0 3px rgba(82,183,136,.55),0 0 16px rgba(212,175,55,.25)}',
    '.eldr-site .tt-node.cap{width:68px;height:68px}',
    '.eldr-site .tt-node.cap .tt-ring{border-radius:16px;transform:rotate(45deg);border-width:2px;outline:1px solid rgba(212,175,55,.25);outline-offset:4px}',
    '.eldr-site .tt-node.cap .tt-ring svg{transform:rotate(-45deg);width:34px;height:34px}',
    '.eldr-site .tt-node.cap:hover .tt-ring,.eldr-site .tt-node.cap:focus-visible .tt-ring{transform:rotate(45deg) scale(1.06)}',
    '.eldr-site .tt-node.cap.locked:hover .tt-ring{transform:rotate(45deg)}',
    '.eldr-site .tt-node.cap .tt-rank{right:-16px;bottom:-9px}',
    '.eldr-site .tt-node.cap + .tt-name{margin-top:16px;color:var(--text)}',
    '.eldr-site .tt-node.shake{animation:eldr-shake .32s}',
    '@keyframes eldr-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}',
    '.eldr-site section.tt-sum{position:sticky;top:8px;z-index:5;padding:10px 16px;margin-bottom:14px;box-shadow:0 10px 24px rgba(0,0,0,.55)}',
    '.eldr-site .tt-total{font-family:Cinzel,Georgia,serif;font-size:19px;color:var(--gold);font-weight:700}',
    '.eldr-site .tt-acts{display:flex;gap:8px;flex-wrap:wrap}',
    '.eldr-site section.tt-cmd{margin-top:22px;border-top-color:var(--gold)}',
    '.eldr-site .tt-cmdrow{display:flex;gap:10px;align-items:center;margin:6px 0}',
    '.eldr-site .tt-save{background:var(--gold);color:#15120a;border-color:var(--gold);font-weight:600}',
    '.eldr-site .tt-save:hover{background:#f0d36b;color:#15120a}',
    '.eldr-site .tt-save[disabled]{opacity:.55;cursor:wait}',
    '.eldr-site .tt-acct{border-color:var(--gold-dim)}',
    '.eldr-site .tt-cmdrow code{flex:1;min-width:0;display:block;padding:9px 12px;font-size:13px;white-space:nowrap;overflow-x:auto;user-select:all}',
    '.eldr-site button.tt-link{all:unset;cursor:pointer;color:var(--green);text-decoration:underline;text-underline-offset:3px;font-size:inherit}',
    '.eldr-site section.tt-pick{padding:16px 18px;margin-bottom:22px;min-height:118px}',
    '.eldr-site .tt-detail h3{margin:0 0 2px;font-size:18px}',
    '.eldr-site .tt-detail p{margin:10px 0 6px}',
    '.eldr-site .tt-detail.idle p{margin:8px 0}',
    '.eldr-site .tt-step{display:flex;align-items:center;gap:12px}',
    '.eldr-site button.tt-btn{all:unset;box-sizing:border-box;width:34px;height:34px;border-radius:50%;border:1px solid var(--gold-dim);color:var(--gold);font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer}',
    '.eldr-site button.tt-btn:hover,.eldr-site button.tt-btn:focus-visible{border-color:var(--gold);background:rgba(212,175,55,.12)}',
    '.eldr-site button.tt-btn[disabled]{opacity:.3;cursor:not-allowed;background:none}',
    '.eldr-site .tt-need{color:#c98a52}',
    '.eldr-site .tt-met{color:var(--green)}',
    '.eldr-site .tt-msg{color:#e0a15f;margin-top:4px}',
    '@media (max-width:860px){.eldr-site .tt-grid{grid-template-columns:1fr}}',
    '@media (prefers-reduced-motion:reduce){.eldr-site .tt-node.shake{animation:none}.eldr-site .tt-ring{transition:none}}',
    '@media (max-width:620px){',
    '  .eldr-site{padding:30px 12px 44px;border-radius:0}',
    '  .eldr-site section.eldr-card{padding:16px 14px 10px}',
    '  .eldr-site table.stack thead{display:none}',
    '  .eldr-site table.stack tr{display:block;padding:10px 0;border-bottom:1px solid var(--line)}',
    '  .eldr-site table.stack tr:last-child{border-bottom:none}',
    '  .eldr-site table.stack td{display:block;width:100% !important;border:none;padding:2px 0}',
    '  .eldr-site table.stack td:first-child{margin-bottom:4px}',
    '  .eldr-site table.stack tr.eldr-offrow{background:rgba(122,42,36,.16);box-shadow:inset 3px 0 0 #a23b33;padding-left:12px;padding-right:8px}',
    '  .eldr-site table.stack tr.eldr-offrow>td{background:none;box-shadow:none}',
    '  .eldr-site code{white-space:normal}',
    '  .eldr-site nav.eldr-chips{display:none}',
    '  .eldr-site nav.eldr-nav .eldr-chip.near{display:none}',
    '  .eldr-site nav.eldr-nav{margin-top:-8px}',
    '  .eldr-site .tt-cell{width:84px}',
    '  .eldr-site .tt-name{font-size:11px;max-width:84px}',
    '  .eldr-site .tt-cmdrow{flex-wrap:wrap}',
    '  .eldr-site .tt-cmdrow code{flex-basis:100%}',
    '  .eldr-site ol.cg-stars{columns:1}',
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

  // ================================================================== SWITCHED OFF (12 Nov)
  // What is off right now comes from the publisher (sounds.json / fx.json "off" and "enabled", {off} in commands.md).
  // One thing off: its row turns red with a tag. A whole system off: its card folds to the red name bar; click to open.
  function offTag(word) { return el('span', { class: 'eldr-badge red eldr-offtag', text: word }); }
  function offRow(tr, word) {
    tr.classList.add('eldr-offrow');
    var td = tr.firstChild; if (td && word) td.appendChild(offTag(word));
    return tr;
  }
  function foldOff(section, word, open) {
    var h2 = section.querySelector('h2'); if (!h2) return section;
    section.classList.add('eldr-off');
    if (open) section.classList.add('eldr-open');
    var btn = el('button', { class: 'eldr-offtoggle', type: 'button', 'aria-expanded': String(!!open) });
    while (h2.firstChild) btn.appendChild(h2.firstChild);
    btn.appendChild(offTag(word));
    btn.appendChild(el('span', { class: 'eldr-chev', 'aria-hidden': 'true', text: '\u25BE' }));
    btn.addEventListener('click', function () { var o = section.classList.toggle('eldr-open'); btn.setAttribute('aria-expanded', String(o)); });
    h2.appendChild(btn);
    return section;
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
      if (/^##\s+/.test(ln)) {
        flush();
        var ttl = ln.replace(/^##\s+/, '').trim(), offH = /\s*\{off\}\s*$/.test(ttl);   // {off}: the whole system is switched off
        cur = { title: ttl.replace(/\s*\{off\}\s*$/, ''), off: offH, blocks: [] }; doc.sections.push(cur); continue;
      }
      if (/^###\s+/.test(ln)) { flush(); (cur ? cur.blocks : doc.intro).push({ type: 'h3', text: ln.replace(/^###\s+/, '') }); continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { flush(); continue; }
      if (/^\s*\|/.test(ln)) {
        flush();
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        i--;
        var hdr = cells(rows[0]), body = rows.slice(1).filter(function (r) { return !/^\s*\|?\s*:?-{2,}/.test(r); }).map(cells);
        body.forEach(function (r) { if (/^\{off\}\s*/.test(r[0] || '')) { r[0] = r[0].replace(/^\{off\}\s*/, ''); r.off = true; } });   // {off}: this one is switched off
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
  function blockNode(b, offWord, offAll) {
    if (b.type === 'p') return el('p', { class: 'eldr-note', html: inline(b.text) });
    if (b.type === 'h3') return el('h3', { html: inline(b.text) });
    if (b.type === 'ul') return el('ul', null, b.items.map(function (t) { return el('li', { html: inline(t) }); }));
    var t = el('table', { class: 'stack' });
    t.appendChild(el('thead', null, el('tr', null, b.head.map(function (h) { return el('th', { html: inline(h) }); }))));
    var tb = el('tbody');
    b.rows.forEach(function (r) {
      var tr = el('tr', null, r.map(function (c, j) { return el('td', { html: inline(c), style: j === 0 ? { width: '36%' } : null }); }));
      tb.appendChild(r.off || offAll ? offRow(tr, offWord || 'sealed') : tr);
    });
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
        var node = el('section', { class: 'eldr-card', id: id }, [el('h2', { html: inline(s.title) }), aboutBox(guideFor(ctx, s.title))]
          .concat(s.blocks.map(function (b) { return blockNode(b, 'sealed', s.off); })));
        if (s.off) foldOff(node, 'sealed');
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
        if (x.s.off && !x.node.classList.contains('eldr-open')) { var tg = x.node.querySelector('.eldr-offtoggle'); if (tg) tg.click(); }
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
          x.node.classList.toggle('eldr-peek', !!q && (any || title));   // a folded (switched-off) section opens while it matches
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
  // a partner logo: an https URL, or logos/<file> that Website :: Publish uploaded next to partners.json
  function logoUrl(v) {
    v = String(v || '').trim();
    if (/^https:\/\//i.test(v)) return v;
    if (/^logos\/[A-Za-z0-9._-]+$/.test(v) && v.indexOf('..') < 0) return BASE + 'data/' + v;
    return '';
  }
  // the image; if it fails to load, the alt text's name in Cinzel takes its place
  function logoImg(src, alt) {
    var img = el('img', { src: src, alt: alt, loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () {
      var n = el('span', { class: 'nm', text: String(alt || '').replace(/ logo$/, '') });
      if (img.parentNode) img.parentNode.replaceChild(n, img);
    });
    return img;
  }
  function partners(ctx) {
    return load('partners.json').then(function (d) {
      var list = d.partners || [];
      var out = [head(ctx.opts, 'Patrons of the Ledger', 'Brands that signed the book',
        'Paid partnerships of the stream. Using their links and codes supports the channel.')];
      if (!list.length) { out.push(empty('No patrons have signed the Ledger yet.')); return out.concat(foot(d.updated)); }
      var grid = el('div', { class: 'eldr-grid' });
      list.forEach(function (p) {
        var cos = (p.partners || []).filter(function (m) { return m && m.name; });
        var art = cos.length > 0;                    // a deal: its own logo is the game's key art, the companies follow
        var src = logoUrl(p.logo);
        var plate = src ? el('div', { class: 'pt-plate' + (art ? ' art' : '') }, logoImg(src, p.name + (art ? '' : ' logo')))
                        : (art ? null : el('div', { class: 'pt-plate' }, el('span', { class: 'nm', text: p.name })));
        var row = art ? el('div', { class: 'pt-cos' }, cos.map(function (m) {
          var u = logoUrl(m.logo);
          return el('div', { class: 'pt-co', title: m.name + (m.role ? ' (' + m.role + ')' : '') }, [
            u ? logoImg(u, m.name + ' logo') : el('span', { class: 'nm', text: m.name }),
            el('span', { class: 'rl', text: m.role || '' })
          ]);
        })) : null;
        grid.appendChild(el('article', { class: 'pt' }, [
          plate,
          row,
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
      var engineOff = d.enabled === false;
      if (engineOff) out.push(el('p', { class: 'eldr-note', text: 'The sound engine is silenced right now. Open a group to see what plays when it is back.' }));
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
            var tr = el('tr', null, [
              el('td', null, [el('code', { text: '!' + s.id }), ' ', el('strong', { text: s.label || '' }), s.off || engineOff ? offTag('silenced') : null,
                (s.aliases || []).length ? el('div', { class: 'eldr-small eldr-muted', text: 'also ' + s.aliases.map(function (a) { return '!' + a; }).join(', ') }) : null]),
              el('td', null, [who, s.others ? el('div', { class: 'eldr-small eldr-muted', text: 'Others: unlock for ' + priceText(s.others) }) : null]),
              el('td', null, [parts.join(' · '), s.bits > 0 ? el('div', { class: 'eldr-small eldr-muted', text: 'or cheer ' + num(s.bits) + ' bits' }) : null]),
              el('td', { text: secsText(s.cooldown) })
            ]);
            tb.appendChild(s.off || engineOff ? offRow(tr) : tr);
          });
          t.appendChild(tb);
          var card = el('section', { class: 'eldr-card' }, [el('h2', { text: g.charAt(0).toUpperCase() + g.slice(1) }), t]);
          // the whole engine off, or every sound in the group silenced: fold the group to its name (opens while searching)
          if (engineOff || list.every(function (s) { return (s.group || 'Sounds') !== g || s.off; })) { foldOff(card, 'silenced'); if (q) card.classList.add('eldr-peek'); }
          box.appendChild(card);
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

      // Elite Beings (11 Nov): the ones the congregation has driven back; the others stay unnamed
      var eli = d.elites;
      if (eli) {
        var seen = eli.banished || [];
        out.push(el('section', { class: 'eldr-card' }, [
          el('div', { class: 'eldr-row' }, [el('h2', { text: 'Elite Beings' }), eli.beings ? el('span', { class: 'eldr-badge', text: seen.length + ' of ' + eli.beings + ' driven back' }) : null]),
          el('p', { class: 'eldr-muted eldr-small', html: 'Now and then a Being comes through as an Elite. Its name does not banish it: every message in chat is a blow, and everyone who fought is rewarded when it falls. <code>!banished</code> shows the ones you helped drive back.' }),
          seen.length ? el('div', { class: 'eldr-grid' }, seen.map(function (b) {
            return el('article', { class: 'ci bound' }, [el('h3', { text: b.name }), el('div', { class: 'eldr-small eldr-muted', text: 'Driven back by ' + num(b.souls) + (b.souls === 1 ? ' soul' : ' souls') })]);
          })) : el('p', { class: 'eldr-muted', text: 'No Elite has been driven back yet.' })]));
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
      // the Stars (11 Nov): the Old Ones that fell, and the one in the sky now. Those still to come are a count.
      var sr = d.stars;
      if (sr) {
        var fallen = sr.fallen || [], now = sr.fallenNow || 0;
        out.push(el('section', { class: 'eldr-card' }, [
          el('div', { class: 'eldr-row' }, [el('h2', { text: 'The Stars Are Right' }), el('span', { class: 'eldr-badge' + (now ? ' gold' : ''), text: now + ' of ' + sr.total + ' Old Ones driven back' })]),
          sr.risen ? el('div', null, [
            el('div', { class: 'eldr-row' }, [el('strong', { text: sr.risen.name + ' is in the sky' }), sr.risen.hype ? el('span', { class: 'eldr-badge teal', text: 'Raised by a hype train' }) : null]),
            bar(Number(sr.risen.pct || 0), 'gold'),
            el('div', { class: 'eldr-small eldr-muted', text: 'Its might, as it stands. Strike it in chat before it fades.' })]) : null,
          sr.cycle > 0 ? el('p', { class: 'eldr-small', text: 'The whole roster has fallen ' + (sr.cycle === 1 ? 'once' : sr.cycle + ' times') + ' already, and risen again.' }) : null,
          fallen.length ? el('h3', { text: 'Driven back' }) : null,
          fallen.length ? el('ol', { class: 'cg-stars' }, fallen.map(function (n, i) { return el('li', { class: sr.cycle > 0 && i >= now ? 'eldr-muted' : '', text: n }); })) : el('p', { class: 'eldr-muted', text: 'None has fallen yet.' }),
          el('p', { class: 'eldr-muted eldr-small', html: 'A hype train raises the next Old One, each mightier than the last. Nobody knows who comes next until it rises. <code>!stars</code> in chat.' })]));
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
        t3.appendChild(el('thead', null, el('tr', null, [el('th', { text: 'Gift' }), el('th', { text: 'What it does' })])));
        d.gifts.forEach(function (g) {
          tb3.appendChild(el('tr', null, [el('td', null, [g.name, g.tier === 'rare' ? el('span', { class: 'eldr-badge gold', style: { marginLeft: '6px' }, text: 'rare' }) : null]),
            el('td', { class: 'eldr-small', text: g.what || '' })]));
        });
        t3.appendChild(tb3);
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'What can be given' }), t3]));
      }
      out.push(foot(d.updated));
      return out;
    });
  }

  // ================================================================== RIFT SHARDS (11 Nov): live from the forge's /web/rift
  // What each shard is and who holds what (no odds: the public feed carries none since 11 Nov). 12 Nov: with a /shard key a viewer
  // also sees their own shards and opens their sealed ones (riftMine). Needs web_staffApi (site.staffApi).
  function rift(ctx) {
    var api = ctx.site && ctx.site.staffApi;
    var top = [head(ctx.opts, 'Rift Shards', 'Hold the tear in your hand',
      'Shards are effects you keep for later: get one now, fire it on stream whenever you like with !fx and its name.')];
    var how = el('section', { class: 'eldr-card' }, [el('h2', { text: 'How it works' }), el('ul', null, [
      '<strong>Get sealed shards</strong>: buy one with <code>!shard</code> (a Pact), or gain them from bits, subs, gifted subs, memberships, Super Chats, KICKs, Ko-fi and the shop (one per ~2.50 €), hype trains, the Merchant and some achievements.',
      '<strong>Open them</strong> when you like: <code>!shard open</code> in chat, <code>/shard open</code> in Discord, or right here under <strong>Your shards</strong>. Each one shows which effect it holds.',
      '<strong>Fire one</strong> on stream with <code>!fx &lt;name&gt;</code>: an opened shard pays instead of a Pact. Cooldowns, Elder Sign seals and the line still apply; if chat seals it, you get the shard back.'
    ].map(function (h) { return el('li', { html: h }); }))]);
    top.push(how);
    // 12 Nov: the command list comes from commands.md (the Effects, Support & Patrons rows that touch shards or !fx),
    // so this page and the Commands page can't drift apart again.
    var cmds = el('section', { class: 'eldr-card' });
    top.push(cmds);
    loadOpt('commands.md', true).then(function (md) {
      var rows = [];
      parseMd(md || '').sections.forEach(function (sec) {
        sec.blocks.forEach(function (b) {
          if (b.type === 'table') b.rows.forEach(function (r) { if (/!fx|!shard|\/shard|!seal\b|!rend/i.test(r[0] || '')) rows.push(r); });
        });
      });
      if (!rows.length) return;
      cmds.appendChild(el('h2', { text: 'Commands' }));
      cmds.appendChild(blockNode({ type: 'table', head: ['Command', 'What it does'], rows: rows }));
    });
    // 12 Nov: every effect the Rift can fire (fx.json), dormant ones in red; the whole Rift sealed folds the card
    var fxP = loadOpt('fx.json');
    var fxCard = el('section', { class: 'eldr-card', style: { display: 'none' } });
    top.push(fxCard);
    fxP.then(function (fx) { if (fx && (fx.effects || []).length) { fxEffects(fxCard, fx); fxCard.style.display = ''; } });
    if (!api) { top.push(el('p', { class: 'eldr-note', text: 'The live shard list appears here once the forge address is set.' })); return top; }
    top.push(riftMine(ctx, api));
    return Promise.all([fetch(api.replace(/\/+$/, '') + '/web/rift', { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.json(); }), fxP])
      .then(function (res) {
        var d = res[0], fx = res[1] || {}, dormant = {};
        if (!d || !d.ok) throw new Error('no data');
        (fx.effects || []).forEach(function (e) { if (e.off || fx.enabled === false) dormant[e.id] = true; });
        var out = top.slice(), st = ctx.state;
        if (d.sealed && d.sealed.total) {
          out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Still sealed' }),
            el('p', { text: num(d.sealed.total) + ' sealed shard' + (d.sealed.total === 1 ? '' : 's') + ' wait to be opened.' }),
            d.sealed.holders.length ? el('p', { class: 'eldr-muted eldr-small', text: d.sealed.holders.map(function (h) { return h.name + ' ' + h.qty; }).join(' · ') }) : null]));
        }
        if (!st.tier) st.tier = 'all';
        var chips = el('div', { class: 'eldr-chips' }), box = el('div');
        var list = (d.effects || []).filter(function (e) { return e.drawable || e.held > 0; });
        function draw() {
          chips.innerHTML = '';
          [['all', 'All'], ['pact', 'Pact'], ['eldritch', 'Eldritch'], ['held', 'Held by someone']].forEach(function (f) {
            chips.appendChild(el('button', { class: 'eldr-chip', type: 'button', 'aria-pressed': String(st.tier === f[0]), text: f[1], onclick: function () { st.tier = f[0]; draw(); } }));
          });
          box.innerHTML = '';
          var rows = list.filter(function (e) { return st.tier === 'all' || (st.tier === 'held' ? e.held > 0 : e.tier === st.tier); });
          if (!rows.length) { box.appendChild(empty('No shard matches that.')); return; }
          rows.sort(function (a, b) { return (a.tier === b.tier ? 0 : a.tier === 'eldritch' ? -1 : 1) || (b.held - a.held) || String(a.label).localeCompare(b.label); });
          var t = el('table', { class: 'stack' });
          t.appendChild(el('thead', null, el('tr', null, ['Shard', 'Tier', 'Held', 'Holders'].map(function (x) { return el('th', { text: x }); }))));
          var tb = el('tbody');
          rows.forEach(function (e) {
            var tr = el('tr', null, [
              el('td', { 'data-l': 'Shard' }, [el('strong', { text: e.label }), dormant[e.id] ? offTag('dormant') : null, el('div', { class: 'eldr-muted eldr-small' }, el('code', { text: '!fx ' + e.id }))]),
              el('td', { 'data-l': 'Tier' }, [e.tier === 'eldritch' ? 'Eldritch' : 'Pact', e.drawable ? null : el('div', { class: 'eldr-small eldr-muted', text: 'not drawn' })]),
              el('td', { 'data-l': 'Held', text: num(e.held) }),
              el('td', { 'data-l': 'Holders', text: (e.holders || []).map(function (h) { return h.name + (h.qty > 1 ? ' ×' + h.qty : ''); }).join(', ') || '—' })]);
            tb.appendChild(dormant[e.id] ? offRow(tr) : tr);
          });
          t.appendChild(tb); box.appendChild(t);
        }
        draw();
        out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Every shard' }), chips, box]));
        return out.concat(foot(d.updated));
      })
      .catch(function () { return top.concat([el('p', { class: 'eldr-note', text: 'The rift is quiet right now (the forge may be offline). The list comes back by itself.' })]); });
  }

  // ------------------------------------------------------------------ 12 Nov: the Rift's effects, what is dormant right now
  var FX_KIND = { visual: 'On screen', sound: 'A sound', input: 'In the game' };
  function fxEffects(card, fx) {
    var sealed = fx.enabled === false, groups = [], by = {};
    fx.effects.forEach(function (e) { var g = e.group || 'Effects'; if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(e); });
    card.appendChild(el('h2', { text: 'Every effect' }));
    card.appendChild(el('p', { class: 'eldr-note', html: sealed
      ? 'The Rift is <strong>sealed</strong> right now: no effect can be fired until it opens again.'
      : 'Fire any of these with <code>!fx &lt;name&gt;</code>. Ones marked <strong>dormant</strong> are switched off for now.' }));
    groups.forEach(function (g) {
      card.appendChild(el('h3', { text: g.charAt(0).toUpperCase() + g.slice(1) }));
      var t = el('table', { class: 'stack' });
      t.appendChild(el('thead', null, el('tr', null, ['Effect', 'Costs', 'Where'].map(function (x) { return el('th', { text: x }); }))));
      var tb = el('tbody');
      by[g].forEach(function (e) {
        var cost = [e.tier === 'eldritch' ? 'An Eldritch Pact' : 'A Pact'];
        if (e.ritual > 1) cost = [e.ritual + ' viewers, ' + (e.tier === 'eldritch' ? 'an Eldritch Pact' : 'a Pact') + ' each'];
        var tr = el('tr', null, [
          el('td', { 'data-l': 'Effect', style: { width: '40%' } }, [el('strong', { text: e.label }), e.off || sealed ? offTag('dormant') : null,
            el('div', { class: 'eldr-muted eldr-small' }, el('code', { text: '!fx ' + e.id }))]),
          el('td', { 'data-l': 'Costs' }, [cost[0], e.cult ? el('div', { class: 'eldr-small eldr-muted', text: 'Only for the faithful of ' + e.cult.charAt(0).toUpperCase() + e.cult.slice(1) }) : null]),
          el('td', { 'data-l': 'Where', text: (e.kind || []).map(function (k) { return FX_KIND[k] || k; }).join(' + ') })]);
        tb.appendChild(e.off || sealed ? offRow(tr) : tr);
      });
      t.appendChild(tb); card.appendChild(t);
    });
    if (sealed) foldOff(card, 'sealed');
  }

  // ------------------------------------------------------------------ 12 Nov: your own shards, and opening sealed ones
  // Key from /shard key in Discord (#eldr-rift=... in the link, never sent anywhere but the forge). It can only show
  // your shards and open your sealed ones; it can't give, buy or fire anything.
  var RIFT_KEY = 'eldr_rift_key';
  function takeRiftKey() {
    var h = location.hash || '', m = h.match(/(?:^#|&)eldr-rift=(rift_[A-Za-z0-9_\-]+)/);
    if (!m) return;
    store(RIFT_KEY, m[1]);
    h = h.replace(m[0], '').replace(/^#&/, '#'); if (h === '#') h = '';
    try { history.replaceState(null, '', location.pathname + location.search + h); } catch (e) {}
  }
  function nonce() {
    var a = new Uint8Array(12), out = '';
    try { (window.crypto || window.msCrypto).getRandomValues(a); } catch (e) { for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < a.length; j++) out += ('0' + a[j].toString(16)).slice(-2);
    return out;
  }
  function riftMine(ctx, api) {
    takeRiftKey();
    var st = ctx.state, base = api.replace(/\/+$/, ''), box = el('section', { class: 'eldr-card' });
    function signIn(note) {
      var input = el('input', { class: 'eldr-search eldr-keyin', type: 'password', autocomplete: 'off', spellcheck: 'false',
        placeholder: 'rift_… or the link from Discord', 'aria-label': 'Rift key' });
      var msg = el('p', { class: 'eldr-keymsg', text: note || '' });
      function go(ev) {
        if (ev) ev.preventDefault();
        var m = (input.value || '').trim().match(/rift_[A-Za-z0-9_\-]+/);
        if (!m || m[0].length > 80) { msg.textContent = 'That doesn\'t look like a Rift key. It starts with rift_.'; return; }
        store(RIFT_KEY, m[0]); fill();
      }
      box.innerHTML = '';
      box.appendChild(el('h2', { text: 'Your shards' }));
      box.appendChild(el('p', { html: 'Open your sealed shards right here. In Discord, type <code>/shard key</code> and open the link it gives you (or paste the key below). Your Discord has to be linked first: <code>/forge link</code>.' }));
      box.appendChild(el('form', { onsubmit: go }, [el('div', { class: 'eldr-keyrow' }, [input, el('button', { class: 'eldr-chip', type: 'submit', text: 'Show my shards' })]), msg]));
    }
    function call(path, opts) {
      opts = opts || {};
      opts.headers = Object.assign({ 'X-Rift-Key': stored(RIFT_KEY) || '' }, opts.headers || {});
      opts.cache = 'no-store'; opts.credentials = 'omit';
      return fetch(base + path, opts).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j || {} }; }); });
    }
    function show(d) {
      box.innerHTML = '';
      var bar = el('div', { class: 'eldr-keyrow', style: { justifyContent: 'space-between', margin: '0 0 6px' } }, [
        el('h2', { text: 'Your shards' + (d.name ? ' · ' + d.name : ''), style: { margin: '0' } }),
        el('button', { class: 'eldr-chip', type: 'button', text: 'Sign out', onclick: function () { store(RIFT_KEY, null); st.riftLast = null; signIn(); } })]);
      box.appendChild(bar);
      if (st.riftLast) box.appendChild(el('p', { class: 'eldr-note', html: st.riftLast }));
      var sealed = d.sealed || 0, msg = el('p', { class: 'eldr-keymsg' });
      function open(count, btn) {
        btn.disabled = true; msg.textContent = '';
        call('/web/rift/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: count, nonce: nonce() }) })
          .then(function (res) {
            if (res.status === 401) { store(RIFT_KEY, null); signIn('Your key has expired or was revoked. Get a new one with /shard key.'); return; }
            if (res.status !== 200) { btn.disabled = false; msg.textContent = res.j.error || 'That didn\'t work. Try again in a moment.'; return; }
            if (res.j.ok && res.j.opened && res.j.opened.length) {
              st.riftLast = '🜏 ' + res.j.count + ' shard' + (res.j.count === 1 ? '' : 's') + ' cracked open: ' + res.j.opened.map(function (o) {
                return '<strong>' + esc(o.label) + '</strong>' + (o.qty > 1 ? ' ×' + o.qty : '') + (o.tier === 'eldritch' ? ' (Eldritch)' : '');
              }).join(', ') + '. Fire them on stream with <code>!fx</code> and the name.';
            }
            show(res.j);
          })
          .catch(function () { btn.disabled = false; msg.textContent = 'The forge is out of reach right now. Nothing was opened.'; });
      }
      var b1 = el('button', { class: 'eldr-chip', type: 'button', text: 'Open one' }), ba = el('button', { class: 'eldr-chip', type: 'button', text: 'Open all ' + sealed });
      b1.addEventListener('click', function () { open(1, b1); });
      ba.addEventListener('click', function () { open('all', ba); });
      box.appendChild(el('p', { text: sealed ? sealed + ' sealed shard' + (sealed === 1 ? '' : 's') + ' waiting.' : 'No sealed shards right now.' }));
      if (sealed) box.appendChild(el('div', { class: 'eldr-keyrow' }, sealed > 1 ? [b1, ba] : [b1]));
      box.appendChild(msg);
      var list = d.shards || [];
      if (list.length) {
        var t = el('table', { class: 'stack' });
        t.appendChild(el('thead', null, el('tr', null, ['Shard', 'Tier', 'You hold', 'Fire it'].map(function (x) { return el('th', { text: x }); }))));
        var tb = el('tbody');
        list.forEach(function (s) {
          tb.appendChild(el('tr', null, [el('td', { 'data-l': 'Shard' }, el('strong', { text: s.label })),
            el('td', { 'data-l': 'Tier', text: s.tier === 'eldritch' ? 'Eldritch' : 'Pact' }),
            el('td', { 'data-l': 'You hold', text: num(s.qty) }),
            el('td', { 'data-l': 'Fire it' }, el('code', { text: '!fx ' + s.id }))]));
        });
        t.appendChild(tb); box.appendChild(t);
      } else box.appendChild(el('p', { class: 'eldr-muted eldr-small', text: 'No opened shards yet.' }));
      if (d.expires) box.appendChild(el('p', { class: 'eldr-muted eldr-small', text: 'This browser stays signed in until ' + day(d.expires) + '. Only you see this part of the page.' }));
    }
    function fill() {
      if (!stored(RIFT_KEY)) { signIn(); return; }
      box.innerHTML = ''; box.appendChild(el('h2', { text: 'Your shards' })); box.appendChild(el('p', { class: 'eldr-muted', text: 'Looking…' }));
      call('/web/rift/me').then(function (res) {
        if (res.status === 401) { store(RIFT_KEY, null); signIn('Your key has expired or was revoked. Get a new one with /shard key.'); return; }
        if (res.status !== 200 || !res.j.ok) { box.innerHTML = ''; box.appendChild(el('h2', { text: 'Your shards' })); box.appendChild(el('p', { class: 'eldr-note', text: res.j.error || 'Your shards are out of reach right now.' })); return; }
        show(res.j);
      }).catch(function () { box.innerHTML = ''; box.appendChild(el('h2', { text: 'Your shards' })); box.appendChild(el('p', { class: 'eldr-note', text: 'Your shards are out of reach right now (the forge may be offline).' })); });
    }
    fill();
    return box;
  }

  // ================================================================== 11 Nov: the menu, the hub, look-up by name
  // nav.json (website\nav.txt): [{page, label, url, group, text}]. On the preview (index.html next to this file) the
  // links are ?page=…; on eldritzh.com they are the Fourthwall addresses from nav.txt.
  var PREVIEW = (function () { try { return new URL(BASE, location.href).origin === location.origin; } catch (e) { return false; } })();
  function navPages(ctx) {
    return ((ctx.nav && ctx.nav.pages) || []).filter(function (p) { return p && p.page && p.label && (PREVIEW ? PAGES[p.page] : p.url); });
  }
  function navHref(p) {
    if (PREVIEW) return '?page=' + encodeURIComponent(p.page);
    return /^(\/(?!\/)|https:\/\/)/.test(p.url || '') ? p.url : '#';
  }
  function navBar(ctx, page) {
    var list = navPages(ctx);
    if (list.length < 2 || page === 'hub') return null;
    var here = list.filter(function (p) { return p.page === page || (page === 'esorder' && p.page === 'order'); })[0];
    var hub = list.filter(function (p) { return p.page === 'hub'; })[0];
    var near = here && here.group ? list.filter(function (p) { return p.group === here.group; }) : [];
    var kids = [];
    if (hub) kids.push(el('a', { class: 'eldr-chip hub', href: navHref(hub), text: '← ' + hub.label }));
    near.forEach(function (p) {
      kids.push(el('a', { class: 'eldr-chip near', href: navHref(p), text: p.label, 'aria-current': p === here ? 'page' : null }));
    });
    var groups = [], by = {};
    list.forEach(function (p) { if (p.page === 'hub') return; var g = p.group || ''; if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(p); });
    var sel = el('select', { class: 'eldr-select', 'aria-label': 'Go to another page',
      onchange: function () { var v = sel.value; sel.selectedIndex = 0; if (v) location.href = v; } },
      [el('option', { value: '', text: 'All pages…' })].concat(groups.map(function (g) {
        var opts = by[g].map(function (p) { return el('option', { value: navHref(p), text: p.label }); });
        return g ? el('optgroup', { label: g }, opts) : opts[0];
      })));
    kids.push(sel);
    return el('nav', { class: 'eldr-nav', 'aria-label': 'The Ledger’s pages' }, kids);
  }
  function hub(ctx) {
    var list = navPages(ctx).filter(function (p) { return p.page !== 'hub'; });
    var out = [head(ctx.opts, 'The Ledger', 'Embrace the Tentacle', 'Everything the stream keeps, written down. Pick a page.')];
    if (!list.length) { out.push(empty('The pages are not listed yet.')); return out; }
    var groups = [], by = {};
    list.forEach(function (p) { var g = p.group || 'Pages'; if (!by[g]) { by[g] = []; groups.push(g); } by[g].push(p); });
    groups.forEach(function (g) {
      var grid = el('div', { class: 'eldr-grid' });
      by[g].forEach(function (p) {
        grid.appendChild(el('a', { class: 'ci hub-card', href: navHref(p) }, [el('h3', { text: p.label }), p.text ? el('div', { class: 'eldr-small eldr-muted', text: p.text }) : null]));
      });
      out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: g }), grid]));
    });
    out.push(foot(ctx.site && ctx.site.files && ctx.site.files['nav.json']));
    return out;
  }

  function weight(g) { g = Number(g || 0); return g >= 1000 ? (g / 1000).toFixed(g >= 10000 ? 0 : 1).replace(/\.0$/, '') + ' kg' : num(g) + ' g'; }
  function pips(rank, ranks) {
    var n = el('span', { class: 'eldr-pips', role: 'img', 'aria-label': rank + ' of ' + ranks });
    for (var i = 0; i < ranks; i++) n.appendChild(el('i', { class: i < rank ? 'on' : '' }));
    return n;
  }
  function mark(n) { return n > 0 ? '✦' + (n > 1 ? n : '') + ' ' : ''; }
  function tabs(st, list, draw) {
    var row = el('div', { class: 'eldr-chips', role: 'group' });
    function paint() {
      row.innerHTML = '';
      list.forEach(function (t) {
        row.appendChild(el('button', { class: 'eldr-chip', type: 'button', 'aria-pressed': String(st.tab === t[0]), text: t[1], onclick: function () { st.tab = t[0]; paint(); draw(); } }));
      });
    }
    paint();
    row.pick = function (id) { st.tab = id; paint(); draw(); };
    return row;
  }

  // The look-up box: people.json is only fetched when someone uses it. Everything in it is already said in chat.
  function personCard(p, extra) {
    var kids = [el('div', { class: 'eldr-row' }, [
      el('h3', { text: mark(p.rebirths) + p.name }),
      el('span', { class: 'eldr-badge gold', text: 'Level ' + p.level })])];
    var line = [p.title, p.frame ? p.frame + ' frame' : '', [p.lineage, p.occupation].filter(Boolean).join(' '), p.pronouns].filter(Boolean).join(' · ');
    if (line) kids.push(el('div', { class: 'eldr-small eldr-muted', text: line }));
    if ((p.aka || []).length) kids.push(el('div', { class: 'eldr-small eldr-muted', text: 'Also known as ' + p.aka.join(', ') }));
    if (p.rebirths > 0) kids.push(el('div', { class: 'eldr-small', text: 'Born again ' + (p.rebirths === 1 ? 'once' : p.rebirths + ' times') + '.' }));
    if ((p.talents || []).length) {
      kids.push(el('h3', { text: 'Talents' }));
      kids.push(el('div', { class: 'lk-tal' }, p.talents.map(function (t) { return el('span', { class: 'lk-t' }, [t.name + ' ', pips(t.rank, t.ranks)]); })));
    }
    if ((p.banished || []).length) {
      kids.push(el('h3', { text: 'Elites banished' }));
      kids.push(el('div', { class: 'eldr-small', text: p.banished.join(', ') }));
    }
    var f = p.fishing;
    if (f) {
      kids.push(el('h3', { text: 'Night Fishing' }));
      kids.push(el('div', { class: 'eldr-small', text: ['Fishing skill ' + num(f.skill), num(f.species) + (f.species === 1 ? ' kind of fish' : ' kinds of fish') + ' in the journal', f.water ? 'fishing ' + f.water : ''].filter(Boolean).join(' · ') }));
      if (f.best) kids.push(el('div', { class: 'eldr-small', text: 'Best catch: ' + f.best.fish + ' (' + weight(f.best.grams) + ')' }));
      if ((f.legendaries || []).length) kids.push(el('div', { class: 'eldr-small' }, [el('span', { class: 'eldr-badge gold', text: 'Legendary' }), ' ' + f.legendaries.join(', ')]));
    }
    var more = extra ? extra(p) : null;
    if (more) kids.push(more);
    return el('article', { class: 'ci bound lk-card' }, kids);
  }
  function lookup(ctx, extra) {
    var st = ctx.state, people = null, busy = null;
    var input = el('input', { class: 'eldr-search', type: 'search', placeholder: 'A chat name…', 'aria-label': 'Look someone up by chat name', autocomplete: 'off', spellcheck: 'false', value: st.who || '' });
    var box = el('div', { 'aria-live': 'polite' });
    function get() {
      if (people) return Promise.resolve(people);
      if (!busy) busy = loadOpt('people.json').then(function (d) { people = (d && d.people) || []; busy = null; return people; });
      return busy;
    }
    function norm(s) { return String(s || '').toLowerCase().replace(/^@/, '').trim(); }
    function show(q) {
      st.who = q;
      q = norm(q);
      box.innerHTML = '';
      if (q.length < 2) return;
      get().then(function (list) {
        if (norm(input.value) !== q) return;
        box.innerHTML = '';
        if (!list.length) { box.appendChild(empty('Nobody is written down yet.')); return; }
        var exact = list.filter(function (p) { return norm(p.name) === q || (p.aka || []).some(function (a) { return norm(a) === q; }); })[0];
        if (exact) { box.appendChild(personCard(exact, extra)); return; }
        var near = list.filter(function (p) { return norm(p.name).indexOf(q) >= 0 || (p.aka || []).some(function (a) { return norm(a).indexOf(q) >= 0; }); });
        near.sort(function (a, b) { return (norm(a.name).indexOf(q) === 0 ? 0 : 1) - (norm(b.name).indexOf(q) === 0 ? 0 : 1) || b.level - a.level; });
        if (near.length === 1) { box.appendChild(personCard(near[0], extra)); return; }
        if (!near.length) { box.appendChild(el('p', { class: 'eldr-muted eldr-small', style: { textAlign: 'center' }, html: 'Nobody by that name is on the public pages. A name appears after its first XP on stream, and <code>!forget</code> takes it off again.' })); return; }
        box.appendChild(el('div', { class: 'eldr-chips', style: { margin: '0' } }, near.slice(0, 12).map(function (p) {
          return el('button', { class: 'eldr-chip', type: 'button', text: p.name, onclick: function () { input.value = p.name; show(p.name); } });
        })));
        if (near.length > 12) box.appendChild(el('p', { class: 'eldr-muted eldr-small', style: { textAlign: 'center', marginTop: '8px' }, text: 'and ' + (near.length - 12) + ' more: keep typing.' }));
      });
    }
    var timer = null;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { show(input.value); }, 180); });
    if (st.who == null) { try { var w = new URLSearchParams(location.search).get('who'); if (w) { st.who = w.slice(0, 40); input.value = st.who; } } catch (e) {} }
    if (st.who) show(st.who);
    return el('section', { class: 'eldr-card' }, [el('h2', { text: 'Look someone up' }),
      el('p', { class: 'eldr-muted eldr-small', html: 'Type a chat name to see that investigator: the same things <code>!level</code>, <code>!talent</code>, <code>!banished</code> and <code>!fishing</code> say in chat. <code>!forget</code> in chat takes you off every page here.' }),
      input, box]);
  }

  // ================================================================== THE TALENT TREE (11 Nov)
  // A planner, the way talent calculators work: click to take a rank, right-click to give it back. It spends nothing:
  // the site knows nobody. It writes the one chat line (!talent build …) that takes the build for real.
  // investigator.json: trees[].talents[] = { id, name, ranks, cost, capstone, soon, text, needs:[{id, rank}], points }.
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // A small rune for every talent, always the same for the same id: a path through a 3x3 lattice inside the ring.
  function rune(id) {
    var h = hash('rune:' + id), pts = [], used = {}, n = 4 + (h % 3);
    function next() { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; }
    while (pts.length < n) { var k = next() % 9; if (used[k]) continue; used[k] = 1; pts.push([6 + (k % 3) * 6, 6 + Math.floor(k / 3) * 6]); }
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    var dot = pts[next() % pts.length];
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + dot[0] + '" cy="' + dot[1] + '" r="1.9" fill="currentColor"/></svg>';
  }
  function talentTree(ctx, d, redrawPage) {
    var st = ctx.state, trees = d.trees || [], tp = d.talentPoints || {}, first = Number(tp.firstLevel || 5), rebMax = Number(tp.rebirthMax || 0), maxLevel = Number(d.maxLevel || 60);
    var by = {}, order = [];
    trees.forEach(function (tr) { (tr.talents || []).forEach(function (t) { t.tree = tr.id; t.treeName = tr.name; by[t.id] = t; order.push(t); }); });
    if (!st.build) {
      st.build = {}; st.base = st.base || {};
      try {
        var q = new URLSearchParams(location.search).get('build') || '';
        q.split('.').forEach(function (tok) { var m = /^([a-z0-9]+?)(\d+)$/.exec(tok); if (m && by[m[1]]) st.build[m[1]] = Math.min(by[m[1]].ranks, Number(m[2])); });
      } catch (e) {}
      // a link is only kept as far as the tree's own rules allow
      var again = true, keep = {};
      while (again) { again = false; order.forEach(function (t) { if (st.build[t.id] && !keep[t.id]) { var b = st.build; st.build = keep; var ok = !blocks(t).length; st.build = b; if (ok) { keep[t.id] = b[t.id]; again = true; } } }); }
      st.build = keep;
    }
    function rank(id) { return st.build[id] || 0; }
    function base(id) { return (st.base && st.base[id]) || 0; }
    function inTree(tree, not) { return order.reduce(function (a, t) { return a + (t.tree === tree && t.id !== not ? rank(t.id) * t.cost : 0); }, 0); }
    function spent() { return order.reduce(function (a, t) { return a + rank(t.id) * t.cost; }, 0); }
    function blocks(t) {
      var out = [];
      (t.needs || []).forEach(function (n) { var p = by[n.id]; if (p && rank(p.id) < n.rank) out.push(p.name + (n.rank > 1 ? ' at rank ' + n.rank : '')); });
      if (t.points > 0 && inTree(t.tree, t.id) < t.points) out.push(t.points + ' points in the ' + t.treeName + ' tree (' + inTree(t.tree, t.id) + ' so far)');
      return out;
    }
    function cap() { return Math.max(0, maxLevel - first + 1) + rebMax; }
    function budget() { var m = st.me; if (m && m.points != null) return m.points; return m ? (m.level >= first ? m.level - first + 1 : 0) + Math.min(rebMax, m.rebirths || 0) : null; }
    function whyNotAdd(t) {
      if (t.soon) return 'Not ready yet: it waits for its part of the game.';
      if (rank(t.id) >= t.ranks) return 'Already at its top rank.';
      var b = blocks(t); if (b.length) return 'Needs ' + b.join(' and ') + ' first.';
      if (spent() + t.cost > cap()) return 'That is every talent point there is.';
      return '';
    }
    function whyNotRemove(t) {
      if (rank(t.id) <= 0) return 'Nothing to give back.';
      if (rank(t.id) <= base(t.id)) return 'Already taken in the game. Only a stay at Arkham Sanitarium gives it back.';
      st.build[t.id]--;
      var hurt = order.filter(function (u) { return u.id !== t.id && rank(u.id) > 0 && blocks(u).length; })[0];
      st.build[t.id]++;
      return hurt ? hurt.name + ' rests on this. Give that back first.' : '';
    }
    function levelFor(pts) { return pts <= 0 ? 0 : first + pts - 1; }
    function save() {
      try {
        var u = new URL(location.href), s = order.filter(function (t) { return rank(t.id) > 0; }).map(function (t) { return t.id + rank(t.id); }).join('.');
        if (s) u.searchParams.set('build', s); else u.searchParams.delete('build');
        history.replaceState(null, '', u.toString());
      } catch (e) {}
    }
    function command() {
      var parts = order.filter(function (t) { return rank(t.id) > base(t.id); }).map(function (t) { return t.id + (t.ranks > 1 ? ':' + rank(t.id) : ''); });
      return parts.length ? '!talent build ' + parts.join(' ') : '';
    }

    // 12 Nov: members save a build to their own character with the key from /shard key (the Rift page's key). The forge
    // checks the key and the membership and queues "!talent build …" for Codex :: Engine; the Codex checks every rule
    // and only ever adds ranks. Without a key (or for non-members) the tree stays the planner + chat line it was.
    var api = ctx.site && ctx.site.staffApi ? String(ctx.site.staffApi).replace(/\/+$/, '') : '';
    function tcall(path, opts) {
      opts = opts || {};
      opts.headers = Object.assign({ 'X-Rift-Key': stored(RIFT_KEY) || '' }, opts.headers || {});
      opts.cache = 'no-store'; opts.credentials = 'omit';
      return fetch(api + path, opts).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j || {} }; }); });
    }
    function loadMe(keepPlan) {
      takeRiftKey();
      if (!api || !stored(RIFT_KEY)) { st.acct = null; return; }
      st.acct = { busy: true };
      tcall('/web/talent/me').then(function (res) {
        if (res.status === 401) { store(RIFT_KEY, null); st.acct = { err: 'Your key has expired or was revoked. Get a new one with /shard key in Discord.' }; draw(); return; }
        if (res.status !== 200 || !res.j.ok) { st.acct = { err: res.j.error || 'Your character is out of reach right now.' }; draw(); return; }
        var d = res.j, old = st.build || {};
        st.acct = d;
        st.me = { name: d.name, level: d.level, points: d.points, mine: true };
        st.base = {}; Object.keys(d.ranks || {}).forEach(function (k) { if (by[k]) st.base[k] = Math.min(by[k].ranks, d.ranks[k]); });
        st.build = {}; Object.keys(st.base).forEach(function (k) { st.build[k] = st.base[k]; });
        // what was planned on top stays (taking more of something never breaks what rests on it)
        if (keepPlan) Object.keys(old).forEach(function (k) { if (by[k] && old[k] > (st.build[k] || 0)) st.build[k] = old[k]; });
        save(); draw();
      }).catch(function () { st.acct = { err: 'Your character is out of reach right now (the forge may be offline).' }; draw(); });
    }
    if (st.acct === undefined) loadMe(true);
    function account() {
      if (!api) return null;
      var a = st.acct, box = el('section', { class: 'eldr-card tt-acct' });
      if (!a || a.err) {
        var input = el('input', { class: 'eldr-search eldr-keyin', type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'rift_… or the link from Discord', 'aria-label': 'Your key' });
        var msg = el('p', { class: 'eldr-keymsg', text: a && a.err ? a.err : '' });
        box.appendChild(el('h2', { text: 'Save builds to your character' }));
        box.appendChild(el('p', { class: 'eldr-small', html: 'Members can send a build straight to their character instead of pasting the chat line. In Discord, type <code>/shard key</code> (the same key as the Rift page) and open its link once, or paste the key here. Your Discord has to be linked first: <code>/forge link</code>.' }));
        box.appendChild(el('form', { onsubmit: function (ev) {
          ev.preventDefault();
          var m = (input.value || '').trim().match(/rift_[A-Za-z0-9_\-]+/);
          if (!m || m[0].length > 80) { msg.textContent = 'That doesn\'t look like a key. It starts with rift_.'; return; }
          store(RIFT_KEY, m[0]); loadMe(true); draw();
        } }, [el('div', { class: 'eldr-keyrow' }, [input, el('button', { class: 'eldr-chip', type: 'submit', text: 'Load my character' })]), msg]));
        return box;
      }
      if (a.busy) { box.appendChild(el('p', { class: 'eldr-muted', text: 'Looking up your character…' })); return box; }
      box.appendChild(el('div', { class: 'eldr-keyrow', style: { justifyContent: 'space-between', margin: '0' } }, [
        el('div', null, [el('h2', { text: 'Your character · ' + (a.name || ''), style: { margin: '0' } }),
          el('div', { class: 'eldr-small eldr-muted', text: a.known ? 'Level ' + a.level + ' · ' + a.points + (a.points === 1 ? ' talent point' : ' talent points') + ', ' + a.free + ' free' : 'No talent points yet: they come from level ' + first + '.' })]),
        el('div', { class: 'tt-acts' }, [
          el('button', { class: 'eldr-chip', type: 'button', text: 'Reload', onclick: function () { st.saved = ''; loadMe(false); draw(); } }),
          el('button', { class: 'eldr-chip', type: 'button', text: 'Sign out', onclick: function () { store(RIFT_KEY, null); st.acct = null; st.me = null; st.base = {}; st.saved = ''; draw(); } })])]));
      if (!a.canSave && a.why) box.appendChild(el('p', { class: 'eldr-note', style: { margin: '10px 0 0' }, text: a.why }));
      return box;
    }
    function saveToCharacter(cmd, btn, msg) {
      btn.disabled = true; msg.textContent = '';
      tcall('/web/talent/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ build: cmd, nonce: nonce() }) })
        .then(function (res) {
          if (res.status === 401) { store(RIFT_KEY, null); st.acct = { err: 'Your key has expired or was revoked. Get a new one with /shard key in Discord.' }; draw(); return; }
          if (res.status !== 200 || !res.j.ok) { btn.disabled = false; msg.textContent = res.j.error || 'That didn\'t work. Try again in a moment.'; return; }
          st.saved = res.j.text || 'Sent to your character.';
          draw();
          clearTimeout(st.reloadTimer);
          st.reloadTimer = setTimeout(function () { if (document.body.contains(root)) { st.saved = ''; loadMe(true); } }, 75000);   // the bridge runs every minute
        })
        .catch(function () { btn.disabled = false; msg.textContent = 'The forge is out of reach right now. Nothing was sent.'; });
    }

    var root = el('div', { class: 'tt' }), focusId = null;
    function add(t) { var w = whyNotAdd(t); st.sel = t.id; if (w) { st.msg = w; st.shake = t.id; } else { st.build[t.id] = rank(t.id) + 1; st.msg = ''; } save(); draw(); }
    function remove(t) {
      var w = whyNotRemove(t); st.sel = t.id;
      if (w) { st.msg = w; st.shake = t.id; } else { st.build[t.id]--; if (!st.build[t.id]) delete st.build[t.id]; st.msg = ''; }
      save(); draw();
    }
    function copy(text, btn) {
      function done() { var old = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = old; }, 1400); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else { var ta = el('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta); }
    }

    // rows: a talent sits one row under what it needs; a capstone (points in the tree) sits on a row of its own at the foot
    function layout(tr) {
      var list = tr.talents || [], depth = {};
      function dep(t, guard) {
        if (depth[t.id] != null) return depth[t.id];
        if (guard > 12) return 0;
        var ps = (t.needs || []).map(function (n) { return by[n.id]; }).filter(function (p) { return p && p.tree === t.tree; });
        return (depth[t.id] = ps.length ? 1 + Math.max.apply(null, ps.map(function (p) { return dep(p, guard + 1); })) : 0);
      }
      list.forEach(function (t) { dep(t, 0); });
      var deepest = Math.max.apply(null, [0].concat(list.filter(function (t) { return !(t.points > 0); }).map(function (t) { return depth[t.id]; })));
      list.forEach(function (t) { if (t.points > 0 && !(t.needs || []).length) depth[t.id] = deepest + 1; });
      var rows = [], x = {};
      list.forEach(function (t) { (rows[depth[t.id]] = rows[depth[t.id]] || []).push(t); });
      rows = rows.filter(Boolean);
      // a long row without anything above it (odds and ends) wraps
      var wrapped = [];
      rows.forEach(function (r) {
        if (r.length <= 4) { wrapped.push(r); return; }
        var per = Math.ceil(r.length / Math.ceil(r.length / 4));
        for (var i = 0; i < r.length; i += per) wrapped.push(r.slice(i, i + per));
      });
      rows = wrapped;
      rows.forEach(function (r) {
        var want = r.map(function (t, i) {
          var ps = (t.needs || []).map(function (n) { return x[n.id]; }).filter(function (v) { return v != null; });
          return { t: t, w: ps.length ? ps.reduce(function (a, b) { return a + b; }, 0) / ps.length : (i + 0.5) / r.length * 100, i: i };
        }).sort(function (a, b) { return a.w - b.w || a.i - b.i; });
        var gap = 100 / Math.max(3, r.length), lo = gap / 2, hi = 100 - gap / 2;
        if (r.length === 1 && !(r[0].needs || []).length) want[0].w = 50;
        for (var i = 0; i < want.length; i++) want[i].w = Math.max(want[i].w, i ? want[i - 1].w + gap : lo);
        for (var j = want.length - 1; j >= 0; j--) want[j].w = Math.min(want[j].w, j < want.length - 1 ? want[j + 1].w - gap : hi);
        want.forEach(function (o) { x[o.t.id] = o.w; });
      });
      return { rows: rows, x: x };
    }

    function node(t) {
      var r = rank(t.id), b = blocks(t), locked = !t.soon && r === 0 && b.length > 0;
      var state = t.soon ? 'soon' : r >= t.ranks ? 'full' : r > 0 ? 'some' : locked ? 'locked' : 'open';
      var n = el('button', { type: 'button', class: 'tt-node ' + state + (t.capstone ? ' cap' : '') + (st.sel === t.id ? ' sel' : '') + (st.shake === t.id ? ' shake' : ''),
        'data-id': t.id, title: t.name + ': ' + t.text,
        'aria-label': t.name + ', rank ' + r + ' of ' + t.ranks + (t.soon ? ', not ready yet' : locked ? ', locked: needs ' + b.join(' and ') : ''),
        'aria-pressed': String(st.sel === t.id),
        onclick: function () { focusId = t.id; add(t); },
        oncontextmenu: function (e) { e.preventDefault(); focusId = t.id; remove(t); },
        onkeydown: function (e) { if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '-') { e.preventDefault(); focusId = t.id; remove(t); } }
      }, [el('span', { class: 'tt-ring', html: rune(t.id) }), el('span', { class: 'tt-rank', text: t.soon ? 'soon' : r + '/' + t.ranks })]);
      return n;
    }
    function treeCard(tr) {
      var lay = layout(tr), ROW = 124, TOP = 16, ys = [], yy = TOP;
      lay.rows.forEach(function (r) { if (r.some(function (t) { return t.points > 0; })) yy += 30; ys.push(yy); yy += ROW; });
      var H = yy;
      var stage = el('div', { class: 'tt-stage', style: { height: H + 'px' } });
      var lines = '';
      lay.rows.forEach(function (r, ri) {
        r.forEach(function (t) {
          (t.needs || []).forEach(function (nd) {
            var p = by[nd.id]; if (!p || lay.x[p.id] == null) return;
            var pr = -1; lay.rows.forEach(function (rr, k) { if (rr.indexOf(p) >= 0) pr = k; });
            if (pr < 0) return;
            var x1 = lay.x[p.id], y1 = ys[pr] + 58, x2 = lay.x[t.id], y2 = ys[ri] - 2, m = (y1 + y2) / 2;
            var met = rank(p.id) >= nd.rank;
            lines += '<path class="' + (met ? 'on' : '') + '" d="M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + m + ' ' + x2 + ' ' + m + ' ' + x2 + ' ' + y2 + '" vector-effect="non-scaling-stroke"/>';
          });
        });
      });
      var svg = el('div', { class: 'tt-lines', html: '<svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' + lines + '</svg>' });
      stage.appendChild(svg);
      lay.rows.forEach(function (r, ri) {
        r.forEach(function (t) {
          var gate = t.points > 0 ? el('span', { class: 'tt-gate' + (inTree(t.tree, t.id) >= t.points ? ' on' : ''), text: Math.min(inTree(t.tree, t.id), t.points) + ' / ' + t.points + ' points in ' + tr.name }) : null;
          stage.appendChild(el('div', { class: 'tt-cell', style: { left: lay.x[t.id] + '%', top: ys[ri] + 'px' } }, [gate, node(t), el('span', { class: 'tt-name', text: t.name })]));
        });
      });
      var pts = inTree(tr.id, null);
      return el('section', { class: 'eldr-card tt-tree' + (pts ? ' has' : '') }, [
        el('div', { class: 'eldr-row' }, [el('h2', { text: tr.name }), el('span', { class: 'eldr-badge' + (pts ? ' gold' : ''), text: pts + (pts === 1 ? ' point' : ' points') })]), stage]);
    }
    function detail() {
      var t = by[st.sel];
      if (!t) return el('div', { class: 'tt-detail idle' }, [el('p', { class: 'eldr-muted', html: '<strong>Click a talent</strong> to take a rank. <strong>Right-click</strong> (or the − button) gives it back. Start with the ones on the top row: the others open as you go.' })]);
      var r = rank(t.id), b = blocks(t), wa = whyNotAdd(t), wr = whyNotRemove(t);
      var needs = (t.needs || []).map(function (n) { var p = by[n.id]; return p ? p.name + (n.rank > 1 ? ' at rank ' + n.rank : '') : ''; }).filter(Boolean);
      if (t.points > 0) needs.push(t.points + ' points in the ' + t.treeName + ' tree');
      return el('div', { class: 'tt-detail' }, [
        el('div', { class: 'eldr-row' }, [
          el('div', null, [el('h3', { text: t.name }), el('div', { class: 'eldr-small eldr-muted', text: t.treeName + (t.capstone ? ' · Capstone' : '') + ' · ' + t.cost + (t.cost === 1 ? ' point' : ' points') + (t.ranks > 1 ? ' a rank' : '') })]),
          el('div', { class: 'tt-step' }, [
            el('button', { type: 'button', class: 'tt-btn', disabled: wr ? '' : null, 'aria-label': 'Give a rank of ' + t.name + ' back', text: '−', onclick: function () { remove(t); } }),
            pips(r, t.ranks),
            el('button', { type: 'button', class: 'tt-btn', disabled: wa ? '' : null, 'aria-label': 'Take a rank of ' + t.name, text: '+', onclick: function () { add(t); } })])]),
        el('p', { text: String(t.text || '').replace(/^Capstone:\s*/i, '').replace(/^./, function (c) { return c.toUpperCase(); }) + (/[.!?]$/.test(t.text || '') ? '' : '.') }),
        needs.length ? el('div', { class: 'eldr-small ' + (b.length ? 'tt-need' : 'tt-met'), text: b.length ? 'Needs ' + b.join(' and ') + ' first.' : 'Opened by ' + needs.join(' and ') + '.' }) : null,
        st.msg && !(b.length && /^Needs /.test(st.msg)) ? el('div', { class: 'eldr-small tt-msg', role: 'status', text: st.msg }) : null]);
    }
    function summary() {
      var s = spent(), bud = budget(), lvl = levelFor(s), cmd = command(), m = st.me, kids = [];
      var baseSpent = order.reduce(function (a, t) { return a + base(t.id) * t.cost; }, 0);
      var line;
      if (!s) line = 'No talents picked yet.';
      else if (bud != null) {
        line = bud - s >= 0 ? (bud - s) + (bud - s === 1 ? ' point' : ' points') + ' left at level ' + m.level + '.'
          : 'This is ' + (s - bud) + (s - bud === 1 ? ' point' : ' points') + ' more than level ' + m.level + ' has. ' + (lvl <= maxLevel ? 'It all fits at level ' + (lvl - Math.min(rebMax, m.rebirths || 0)) + '.' : 'The last of it comes with Rebirths.');
      } else line = lvl <= maxLevel ? 'This build is whole at level ' + lvl + '.' : 'This build needs the top level and ' + (lvl - maxLevel) + (lvl - maxLevel === 1 ? ' Rebirth.' : ' Rebirths.');
      kids.push(el('div', { class: 'eldr-row' }, [
        el('div', null, [el('span', { class: 'tt-total', text: s + (s === 1 ? ' point' : ' points') }), el('span', { class: 'eldr-small eldr-muted', text: '  ' + line })]),
        el('div', { class: 'tt-acts' }, [
          s > baseSpent ? el('button', { type: 'button', class: 'eldr-chip', text: 'Clear', onclick: function () { st.build = {}; Object.keys(st.base || {}).forEach(function (k) { st.build[k] = st.base[k]; }); st.msg = ''; st.sel = null; save(); draw(); } }) : null,
          s ? el('button', { type: 'button', class: 'eldr-chip', text: 'Copy link', onclick: function (e) { copy(location.href, e.currentTarget); } }) : null])]));
      if (m && !m.mine) kids.push(el('div', { class: 'eldr-small eldr-muted' }, ['Planning from ' + m.name + '’s talents (level ' + m.level + '). ',
        el('button', { type: 'button', class: 'tt-link', text: 'Start empty instead', onclick: function () { st.me = null; st.base = {}; st.build = {}; st.msg = ''; save(); draw(); } })]));
      return el('section', { class: 'eldr-card tt-sum' }, kids);
    }
    function takeIt() {
      var cmd = command();
      if (!cmd) return null;
      var btn = el('button', { type: 'button', class: 'eldr-chip tt-copy', text: 'Copy', onclick: function () { copy(cmd, btn); } });
      var a = st.acct;
      if (a && a.ok && a.canSave) {
        var msg = el('p', { class: 'eldr-keymsg' });
        var sv = el('button', { type: 'button', class: 'eldr-chip tt-save', text: 'Save to my character' });
        sv.addEventListener('click', function () { saveToCharacter(cmd, sv, msg); });
        return el('section', { class: 'eldr-card tt-cmd' }, [el('h2', { text: 'Take it' }),
          st.saved ? el('p', { class: 'eldr-note', role: 'status', text: st.saved }) : null,
          el('div', { class: 'tt-cmdrow' }, [el('code', { text: cmd }), sv, btn]), msg,
          el('p', { class: 'eldr-small eldr-muted', text: 'Saving sends exactly this line as you, so the same rules apply as in chat: what your points and the tree allow is taken, the rest waits, and chat says which. Nothing is ever taken away. Copy pastes it in chat yourself instead.' })]);
      }
      return el('section', { class: 'eldr-card tt-cmd' }, [el('h2', { text: 'Take it in chat' }),
        el('p', { class: 'eldr-small', text: 'Paste this in chat on stream and the build is yours:' }), el('div', { class: 'tt-cmdrow' }, [el('code', { text: cmd }), btn]),
        el('p', { class: 'eldr-small eldr-muted', text: 'Chat takes what your points and the tree allow, and tells you what has to wait. Nothing is spent here on the site.' })]);
    }
    function draw() {
      var had = focusId; focusId = null;
      root.innerHTML = '';
      var ac = account(); if (ac) root.appendChild(ac);
      if (st.saved && !command()) root.appendChild(el('p', { class: 'eldr-note', role: 'status', text: st.saved }));
      root.appendChild(summary());
      root.appendChild(el('section', { class: 'eldr-card tt-pick' }, [detail()]));
      var grid = el('div', { class: 'tt-grid' });
      trees.forEach(function (tr) { grid.appendChild(treeCard(tr)); });
      root.appendChild(grid);
      var take = takeIt(); if (take) root.appendChild(take);
      root.appendChild(el('p', { class: 'eldr-muted eldr-small', style: { textAlign: 'center' }, html: 'Changed your mind after taking them? <em>A Stay at Arkham Sanitarium</em> (channel points) or <code>!talent reset</code> hands every point back.' }));
      st.shake = null;
      if (had) { var f = root.querySelector('.tt-node[data-id="' + had + '"]'); if (f) f.focus({ preventScroll: true }); }
    }
    draw();
    return root;
  }

  // ================================================================== THE INVESTIGATOR (investigator.json, 11 Nov)
  // What things are and what they do, never the figures behind them: the feed carries no weights, odds or prices.
  var CROWN = { gold: 'The gold crown', silver: 'The silver crown', copper: 'The copper crown' };
  function investigator(ctx) {
    return load('investigator.json').then(function (d) {
      d = d || {};
      var st = ctx.state, trees = d.trees || [], occs = d.occupations || [], lins = d.lineages || [], board = d.board || [];
      if (!st.tab) st.tab = ctx.page === 'talents' && trees.length ? 'talents' : 'levels';
      var out = [head(ctx.opts, 'The Investigator', 'Everything you do is written down',
        'Turn up, play and support, and your investigator climbs: levels, titles, talents, and a lineage and an occupation of your own.')];
      var aw = d.awakening;
      out.push(el('div', { class: 'eldr-stats' }, [
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(d.investigators) }), el('span', { text: 'Investigators' })]),
        d.maxLevel ? el('div', { class: 'eldr-stat' }, [el('b', { text: num(d.maxLevel) }), el('span', { text: 'Top level' })]) : null,
        aw ? el('div', { class: 'eldr-stat' }, [el('b', { text: num(aw.level) }), el('span', { text: 'Eldritzh’s Awakening' })]) : null,
        trees.length ? el('div', { class: 'eldr-stat' }, [el('b', { text: num(trees.reduce(function (a, t) { return a + (t.talents || []).length; }, 0)) }), el('span', { text: 'Talents' })]) : null
      ]));
      var hasTree = trees.length && trees.every(function (tr) { return (tr.talents || []).every(function (t) { return t.id; }); });
      var tabRow = null;
      out.push(lookup(ctx, hasTree ? function (p) {
        return el('div', { style: { marginTop: '14px' } }, [el('button', { type: 'button', class: 'eldr-chip', text: 'Plan talents from here', onclick: function () {
          st.me = p; st.base = {}; (p.talents || []).forEach(function (t) { if (t.id) st.base[t.id] = t.rank; });
          st.build = {}; Object.keys(st.base).forEach(function (k) { st.build[k] = st.base[k]; }); st.sel = null; st.msg = '';
          if (tabRow) { tabRow.pick('talents'); tabRow.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        } })]);
      } : null));
      var box = el('div');
      var list = [['levels', 'Levels']];
      if (trees.length) list.push(['talents', 'Talents']);
      if (lins.length) list.push(['lineages', 'Lineages']);
      if (occs.length) list.push(['occupations', 'Occupations']);
      list.push(['board', 'Leaderboard']);
      // 12 Nov: members take a lineage or an occupation right here, with the same key as the Rift page and the talent tree
      // (/shard key in Discord). The forge queues it as their own "!lineage <id>" / "!occupation <id>"; the Codex decides
      // the cost (free first change and after a retune, else an Eldritch Pact, taken then) and says so in chat.
      var papi = ctx.site && ctx.site.staffApi ? String(ctx.site.staffApi).replace(/\/+$/, '') : '';
      function pcall(path, opts) {
        opts = opts || {};
        opts.headers = Object.assign({ 'X-Rift-Key': stored(RIFT_KEY) || '' }, opts.headers || {});
        opts.cache = 'no-store'; opts.credentials = 'omit';
        return fetch(papi + path, opts).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j || {} }; }); });
      }
      var KEY_GONE = 'Your key has expired or was revoked. Get a new one with /shard key in Discord.';
      function pkLoad() {
        takeRiftKey();
        if (!papi || !stored(RIFT_KEY)) { st.pk = null; return; }
        st.pk = { busy: true };
        pcall('/web/talent/me').then(function (res) {
          if (res.status === 401) { store(RIFT_KEY, null); st.pk = { err: KEY_GONE }; }
          else if (res.status !== 200 || !res.j.ok) st.pk = { err: res.j.error || 'Your character is out of reach right now.' };
          else st.pk = res.j;
          draw();
        }).catch(function () { st.pk = { err: 'Your character is out of reach right now (the forge may be offline).' }; draw(); });
      }
      function pickBar(kind) {
        if (!papi) return null;
        if (st.pk === undefined) pkLoad();
        var a = st.pk, word = kind === 'lineage' ? 'lineage' : 'occupation', box = el('section', { class: 'eldr-card tt-acct' });
        if (!a || a.err) {
          var input = el('input', { class: 'eldr-search eldr-keyin', type: 'password', autocomplete: 'off', spellcheck: 'false', placeholder: 'rift_… or the link from Discord', 'aria-label': 'Your key' });
          var msg = el('p', { class: 'eldr-keymsg', text: a && a.err ? a.err : '' });
          box.appendChild(el('h2', { text: 'Take one from here' }));
          box.appendChild(el('p', { class: 'eldr-small', html: 'Members can pick their ' + word + ' right on this page. In Discord, type <code>/shard key</code> (the same key as the Rift page and the talent tree) and open its link once, or paste the key here. Your Discord has to be linked first: <code>/forge link</code>.' }));
          box.appendChild(el('form', { onsubmit: function (ev) {
            ev.preventDefault();
            var m = (input.value || '').trim().match(/rift_[A-Za-z0-9_\-]+/);
            if (!m || m[0].length > 80) { msg.textContent = 'That doesn\'t look like a key. It starts with rift_.'; return; }
            store(RIFT_KEY, m[0]); pkLoad(); draw();
          } }, [el('div', { class: 'eldr-keyrow' }, [input, el('button', { class: 'eldr-chip', type: 'submit', text: 'Load my character' })]), msg]));
          return box;
        }
        if (a.busy) { box.appendChild(el('p', { class: 'eldr-muted', text: 'Looking up your character…' })); return box; }
        var cur = kind === 'lineage' ? a.lineage : a.occupation;
        box.appendChild(el('div', { class: 'eldr-keyrow', style: { justifyContent: 'space-between', margin: '0' } }, [
          el('div', null, [el('h2', { text: 'Your character · ' + (a.name || ''), style: { margin: '0' } }),
            el('div', { class: 'eldr-small eldr-muted', text: cur ? 'Your ' + word + ': ' + cur + '.' : 'No ' + word + ' yet: the first pick is free.' })]),
          el('div', { class: 'tt-acts' }, [
            el('button', { class: 'eldr-chip', type: 'button', text: 'Reload', onclick: function () { st.pkMsg = ''; pkLoad(); draw(); } }),
            el('button', { class: 'eldr-chip', type: 'button', text: 'Sign out', onclick: function () { store(RIFT_KEY, null); st.pk = null; st.pkMsg = ''; draw(); } })])]));
        if (!a.canSave && a.why) box.appendChild(el('p', { class: 'eldr-note', style: { margin: '10px 0 0' }, text: a.why }));
        else box.appendChild(el('p', { class: 'eldr-small eldr-muted', style: { margin: '10px 0 0' }, text: 'Use Take this on a card. A change costs 1 Eldritch Pact unless it is one of your free ones (the first change, and one after each retune); chat tells you which when it lands.' }));
        if (st.pkMsg) box.appendChild(el('p', { class: 'eldr-note', style: { margin: '10px 0 0' }, text: st.pkMsg }));
        return box;
      }
      function pickBtn(kind, o) {
        var a = st.pk;
        if (!papi || !a || !a.ok || !a.canSave) return null;
        var cur = kind === 'lineage' ? a.lineage : a.occupation;
        if (cur === o.name) return el('div', { style: { marginTop: '8px' } }, [el('span', { class: 'eldr-badge', text: 'You are this' })]);
        if (kind === 'lineage' && (a.linOpen || []).indexOf(o.name) < 0) return null;
        var btn = el('button', { class: 'eldr-chip', type: 'button', text: 'Take this', style: { marginTop: '8px' } });
        btn.onclick = function () {
          btn.disabled = true;
          pcall('/web/talent/pick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: kind, name: o.name, nonce: nonce() }) })
            .then(function (res) {
              if (res.status === 401) { store(RIFT_KEY, null); st.pk = { err: KEY_GONE }; draw(); return; }
              st.pkMsg = res.j.text || res.j.error || (res.j.ok ? 'Sent.' : 'That didn\'t work. Try again in a moment.');
              draw();
              if (res.j.queued) { clearTimeout(st.pkTimer); st.pkTimer = setTimeout(function () { if (document.body.contains(box)) { st.pkMsg = ''; pkLoad(); } }, 75000); }
            })
            .catch(function () { st.pkMsg = 'The forge is out of reach right now. Nothing was sent.'; draw(); });
        };
        return btn;
      }
      function ladder(rows, what) {
        var t = el('table', { class: 'cx-top' }), tb = el('tbody');
        rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('td', { text: r.level }), el('td', { text: r.name })])); });
        t.appendChild(tb);
        return el('article', { class: 'ci' }, [el('h3', { text: what }), t]);
      }
      function draw() {
        box.innerHTML = '';
        if (st.tab === 'talents' && hasTree) {
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The talent trees' }),
            el('p', { html: 'Talent points come with your levels, from level ' + ((d.talentPoints || {}).firstLevel || 5) + '. Plan a build here: take the talents on the top row first, and the ones below open as you go. A <strong>capstone</strong> is the last thing a tree teaches, and wants points in its tree first.' }),
            el('p', { class: 'eldr-muted eldr-small', html: 'This is a planner. When you like what you see, it writes one line for chat that takes it for real' + (ctx.site && ctx.site.staffApi ? ', and members can save it straight to their character' : '') + '. In chat you can also take them one at a time: <code>!talent &lt;name&gt;</code> (in Discord: <code>/talent</code>).' })]));
          box.appendChild(talentTree(ctx, d));
        } else if (st.tab === 'talents') {
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Talents' }),
            el('p', { html: 'Talent points come with your levels. Spend them in any tree with <code>!talent &lt;name&gt;</code> (in Discord: <code>/talent</code>); <code>!talent</code> shows what you have. The dots are how many ranks a talent has. A capstone is the last thing a tree teaches.' }),
            el('p', { class: 'eldr-muted eldr-small', html: 'Changed your mind? <em>A Stay at Arkham Sanitarium</em> (channel points) or <code>!talent reset</code> hands every point back.' })]));
          trees.forEach(function (tr) {
            var sec = el('section', { class: 'eldr-card' }, [el('h2', { text: tr.name })]);
            (tr.talents || []).forEach(function (t) {
              sec.appendChild(el('div', { class: 'cx-ach' }, [
                el('span', { class: 'nm' }, [t.name, t.capstone ? el('span', { class: 'eldr-badge gold', style: { marginLeft: '8px' }, text: 'Capstone' }) : null,
                  t.soon ? el('span', { class: 'eldr-badge', style: { marginLeft: '8px' }, text: 'Coming soon' }) : null]),
                pips(0, t.ranks),
                el('span', { class: 'ds', text: String(t.text || '').replace(/^Capstone:\s*/i, '').replace(/^./, function (c) { return c.toUpperCase(); }) })]));
            });
            box.appendChild(sec);
          });
        } else if (st.tab === 'lineages') {
          var linCard = function (o) {
            return el('article', { class: 'ci' }, [
              el('h3', null, [o.name, o.locked ? el('span', { class: 'eldr-badge', style: { marginLeft: '8px' }, text: 'Behind a deed' }) : null]),
              boonBane(o.text),
              (o.stages || []).length ? el('div', { class: 'eldr-small eldr-muted', text: 'In time: ' + o.stages.map(function (s) { return s.name + ' at level ' + s.level; }).join(', ') + '.' }) : null,
              o.locked && o.open ? el('div', { class: 'eldr-small eldr-muted', text: 'To open it: ' + String(o.open).replace(/\s*\(!rebirth\)/, '') + '.' }) : null,
              pickBtn('lineage', o)]);
          };
          var lbar = pickBar('lineage'); if (lbar) box.appendChild(lbar);
          var here = lins.filter(function (o) { return !o.otherworld; }), other = lins.filter(function (o) { return o.otherworld; });
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Lineages' }),
            el('p', { html: 'What your investigator is, under the skin. Every lineage is good at some things and bad at others, the way that blood would be: in descents, raids and the Delve, against certain foes and with certain weapons, in banishing, and at the water. One at a time: <code>!lineage &lt;name&gt;</code>, and <code>!lineage info &lt;name&gt;</code> says it in full (in Discord: <code>/lineage</code>, <code>/lineage info:</code>). Some only open after a deed, and a few change their name as you level; what they are good and bad at stays the same.' }),
            el('div', { class: 'eldr-grid' }, here.map(linCard))]));
          if (other.length) box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Otherworlders' }),
            el('p', { class: 'eldr-muted eldr-small', text: 'They came through the Rift, like much else.' }),
            el('div', { class: 'eldr-grid' }, other.map(linCard))]));
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Who you are' }),
            el('p', { html: 'Apart from all that, you can tell the ledger who you are, if you want to: <code>!identity</code> and <code>!pronouns</code> (in Discord: <code>/identity</code>, <code>/pronouns</code>). It changes nothing in play, it costs nothing, and you can change it or take it back whenever you like. <code>!character</code> shows your whole investigator.' })]));
        } else if (st.tab === 'occupations') {
          var grid = el('div', { class: 'eldr-grid' });
          occs.forEach(function (o) { grid.appendChild(el('article', { class: 'ci' }, [el('h3', { text: o.name }), boonBane(o.text), pickBtn('occupation', o)])); });
          var obar = pickBar('occupation'); if (obar) box.appendChild(obar);
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Occupations' }),
            el('p', { html: 'What your investigator did before the dark found them. A trade has its strengths and its blind spots: each occupation is good at some fights, foes and waters and bad at others. One at a time: <code>!occupation &lt;name&gt;</code>, and <code>!occupation info &lt;name&gt;</code> says it in full (in Discord: <code>/occupation</code>, <code>/occupation info:</code>).' }),
            el('p', { class: 'eldr-muted eldr-small', text: 'Your occupation and your lineage add up, and your talents come on top. Since 12 November everyone may change each once for free.' }), grid]));
        } else if (st.tab === 'board') {
          if (!board.length) { box.appendChild(empty('Nobody has earned XP yet.')); return; }
          var t = el('table', { class: 'stack cx-top' }), tb = el('tbody');
          t.appendChild(el('thead', null, el('tr', null, ['', 'Investigator', 'Level', 'Title'].map(function (x) { return el('th', { text: x }); }))));
          board.forEach(function (r) {
            tb.appendChild(el('tr', null, [el('td', { text: '#' + r.rank }), el('td', null, [el('strong', { text: mark(r.rebirths) + r.name })]),
              el('td', { text: 'Level ' + r.level }), el('td', { class: 'eldr-muted', text: r.title || '' })]));
          });
          t.appendChild(tb);
          box.appendChild(el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'The highest investigators' }),
            el('span', { class: 'eldr-badge', text: num(d.investigators) + ' in all' })]), t,
            el('p', { class: 'eldr-muted eldr-small', text: '✦ marks someone who was born again. Anyone further down is in the look-up box above.' })]));
        } else {
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'How you level' }),
            el('p', { html: 'Everything you do on stream earns XP, and XP becomes levels. <code>!level</code> shows where you stand and <code>!level &lt;name&gt;</code> where someone else does. Linked accounts level together.' }),
            el('ul', null, [
              '<strong>Turning up:</strong> being here for a stream, chatting, watching, your first message of the night.',
              '<strong>Playing:</strong> banishing Beings and fighting Elites, duels and gambles, descents and the Delve, fishing, riddles, prophecies and bounties, goblins, rituals and chants, dreams and expeditions, the Stars, the forge, the Pact Wheel and more. Unlocking achievements counts too.',
              '<strong>Supporting:</strong> bits, subs and gifted subs, memberships, tips and the shop.'
            ].map(function (h) { return el('li', { html: h }); })),
            el('p', { class: 'eldr-muted eldr-small', text: 'Some things only count so many times a stream, so nobody levels by repeating one command.' })]));
          var g = el('div', { class: 'eldr-grid' });
          if ((d.titles || []).length) g.appendChild(ladder(d.titles, 'Titles, from level'));
          if ((d.frames || []).length) g.appendChild(ladder(d.frames, 'Frames, from level'));
          if (g.childNodes.length) box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Titles and frames' }),
            el('p', { class: 'eldr-muted eldr-small', text: 'Your level gives you a title, and a frame around your name on the stream’s overlays.' }), g]));
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Rebirth' }),
            el('p', { html: 'At the top level you can be born again with <code>!rebirth</code>: back to level 1 with a ✦ beside your name. You keep your lineage and occupation, your crowns and achievements, your rank in the Order and your skills and journals. Your talents are reset and earned again as you level, with one extra point for the Rebirth.' })]));
          var crowns = d.crowns || [];
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The three crowns' }),
            el('p', { html: 'All the XP the congregation earns also wakes Eldritzh (see the Covenant page). The three investigators who have given the Awakening the most wear the gold, silver and copper crowns.' }),
            crowns.length ? el('div', { class: 'eldr-grid' }, crowns.map(function (c) {
              return el('article', { class: 'ci' + (c.crown === 'gold' ? ' bound' : '') }, [el('div', { class: 'eldr-small eldr-muted', text: CROWN[c.crown] || c.crown }), el('h3', { text: c.name })]);
            })) : el('p', { class: 'eldr-muted eldr-small', text: 'Nobody wears a crown yet.' })]));
        }
      }
      tabRow = tabs(st, list, draw);
      out.push(tabRow);
      draw();
      out.push(box, foot(d.updated, el('div', { text: 'Type !level in chat to see your own.' })));
      return out;
    });
  }

  // ================================================================== THE COVENANT (covenant.json, 11 Nov)
  function covenant(ctx) {
    return load('covenant.json').then(function (d) {
      d = d || {};
      var aw = d.awakening || {}, list = d.talents || [];
      var out = [head(ctx.opts, 'The Covenant', 'What the congregation woke together',
        'All the XP everyone earns wakes Eldritzh, level by level. Every level gives the congregation one point, and chat votes on what it buys: a talent for everyone, for good.')];
      var taken = list.reduce(function (a, t) { return a + (t.rank || 0); }, 0);
      out.push(el('section', { class: 'eldr-card' }, [
        el('div', { class: 'eldr-row' }, [el('h2', { text: 'Eldritzh’s Awakening' }),
          d.voteOpen ? el('span', { class: 'eldr-badge green', text: 'Vote open in chat' }) : d.waiting > 0 ? el('span', { class: 'eldr-badge gold', text: d.waiting + (d.waiting === 1 ? ' point' : ' points') + ' waiting' }) : null]),
        el('div', { class: 'eldr-row eldr-small' }, [el('span', { text: 'Level ' + num(aw.level) }), el('span', { class: 'eldr-muted', text: 'on the way to level ' + num((aw.level || 0) + 1) })]),
        bar(Number(aw.pct || 0), 'gold'),
        el('p', { class: 'eldr-small', html: d.voteOpen ? 'A vote is running in chat right now: go and choose.'
          : d.waiting > 0 ? 'The next vote opens in chat a little way into the next stream.'
          : 'The next point comes with the next Awakening level. <code>!covenant</code> in chat shows the same.' })]));
      if (!list.length) { out.push(empty('Nothing has been written into the Covenant yet.')); return out.concat(foot(d.updated)); }
      var have = list.filter(function (t) { return t.rank > 0; }), open = list.filter(function (t) { return t.rank < t.ranks; });
      function card(t) {
        return el('article', { class: 'ci' + (t.rank > 0 ? ' bound' : '') }, [
          el('div', { class: 'eldr-row' }, [el('h3', { text: t.name }), pips(t.rank, t.ranks)]),
          el('div', { class: 'eldr-small', text: t.text }),
          t.rank >= t.ranks ? el('div', { class: 'eldr-small eldr-muted', text: 'Taken as far as it goes.' }) : null]);
      }
      out.push(el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: 'Taken so far' }), el('span', { class: 'eldr-badge', text: taken + (taken === 1 ? ' rank' : ' ranks') })]),
        have.length ? el('div', { class: 'eldr-grid' }, have.map(card)) : el('p', { class: 'eldr-muted', text: 'Nothing yet. The first vote decides.' }),
        el('p', { class: 'eldr-muted eldr-small', text: 'These count for everyone, all the time. A lit dot is a rank the congregation has taken.' })]));
      var fresh = open.filter(function (t) { return !(t.rank > 0); });
      if (open.length) out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'Still to be voted on' }),
        el('p', { class: 'eldr-muted eldr-small', text: 'Each vote offers a few of these. The one chat picks gains a rank.' }),
        el('div', { class: 'eldr-grid' }, (fresh.length ? fresh : open).map(card)),
        fresh.length && fresh.length < open.length ? el('p', { class: 'eldr-muted eldr-small', text: 'The ones above with dots still dark can be taken further too.' }) : null]));
      out.push(foot(d.updated));
      return out;
    });
  }

  // ================================================================== NIGHT FISHING (fishing.json, 11 Nov)
  // Only fish somebody has caught are in the feed at all; the rest are a count.
  var RARITY = [['legendary', 'Legendary'], ['rare', 'Rare'], ['uncommon', 'Uncommon'], ['common', 'Common']];
  function fishing(ctx) {
    return load('fishing.json').then(function (d) {
      d = d || {};
      var st = ctx.state, tot = d.totals || {}, waters = d.waters || [], fish = d.fish || [], anglers = d.anglers || [];
      if (!st.tab) st.tab = 'waters';
      var out = [head(ctx.opts, 'Night Fishing', 'Something is on the line',
        'Cast into waters from Innsmouth Harbour to the Sea of Stars and fill the journal. Nobody knows what is down there until somebody pulls it up.')];
      out.push(el('div', { class: 'eldr-stats' }, [
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(waters.length) }), el('span', { text: 'Waters' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(tot.found) + ' / ' + num(tot.species) }), el('span', { text: 'Fish found' })]),
        el('div', { class: 'eldr-stat' }, [el('b', { text: num(tot.legendariesFound) + ' / ' + num(tot.legendaries) }), el('span', { text: 'Legendaries' })])
      ]));
      out.push(el('section', { class: 'eldr-card' }, [el('h2', { text: 'How it works' }), el('ul', null, [
        '<code>!fish</code> casts a line, and so does the <em>Go Fishing</em> channel point reward. The bite comes a little later and the catch reels itself in. In Discord: <code>/fish</code>.',
        'Your <strong>Fishing skill</strong> grows as you catch. Deeper waters need more skill and better <strong>bait</strong>: <code>!water</code> shows where you can fish, <code>!bait</code> what is in your tackle box.',
        'Every fish comes <strong>Fine</strong>, <strong>Choice</strong> or <strong>Prime</strong>, and now and then one comes up <strong>aberrant</strong>: wrong, and worth more. Each is its own line in your journal (<code>!fishing</code>).',
        '<strong>The Wreckage:</strong> now and then the wreck of the <em>Alert</em> drifts in for a short while. Chat is told, and every cast while it is here hauls up something extra.',
        'Sell the catch to the Merchant from Leng, or tip it into Tsathoggua: <code>!fish sell</code>, <code>!fish feed</code>.'
      ].map(function (h) { return el('li', { html: h }); }))]));
      out.push(lookup(ctx));
      var box = el('div');
      function draw() {
        box.innerHTML = '';
        if (st.tab === 'journal') {
          if (!fish.length) { box.appendChild(empty('Nothing has been pulled up yet. Be the first: !fish.')); return; }
          RARITY.forEach(function (r) {
            var rows = fish.filter(function (f) { return f.rarity === r[0]; });
            if (!rows.length) return;
            var grid = el('div', { class: 'eldr-grid' });
            rows.forEach(function (f) {
              grid.appendChild(el('article', { class: 'ci' + (r[0] === 'legendary' ? ' bound' : '') }, [
                el('div', { class: 'eldr-row' }, [el('h3', { text: f.name }), f.aberrant ? el('span', { class: 'eldr-badge teal', title: 'Somebody has pulled up an aberrant one', text: 'Aberrant seen' }) : null]),
                f.flavour ? el('p', { class: 'eldr-small', style: { fontStyle: 'italic', margin: '6px 0' }, text: f.flavour }) : null,
                el('div', { class: 'eldr-small eldr-muted', text: [f.size ? f.size.charAt(0).toUpperCase() + f.size.slice(1) : '', (f.waters || []).join(', ')].filter(Boolean).join(' · ') }),
                f.record ? el('div', { class: 'eldr-small', text: 'Heaviest: ' + weight(f.record.grams) + ', ' + f.record.name }) : null,
                (f.caughtBy || []).length ? el('div', { class: 'eldr-small', text: 'Caught by ' + f.caughtBy.join(', ') }) : null]));
            });
            box.appendChild(el('section', { class: 'eldr-card' }, [el('div', { class: 'eldr-row' }, [el('h2', { text: r[1] }), el('span', { class: 'eldr-badge', text: rows.length + ' found' })]), grid]));
          });
          var hid = (tot.species || 0) - (tot.found || 0);
          if (hid > 0) box.appendChild(el('p', { class: 'eldr-empty', text: num(hid) + ' more ' + (hid === 1 ? 'thing swims' : 'things swim') + ' down there unseen. They are written here when somebody catches one.' }));
        } else if (st.tab === 'anglers') {
          if (!anglers.length) { box.appendChild(empty('Nobody has cast a line yet.')); return; }
          var t = el('table', { class: 'stack cx-top' }), tb = el('tbody');
          t.appendChild(el('thead', null, el('tr', null, ['', 'Angler', 'Skill', 'Journal', 'Best catch'].map(function (x) { return el('th', { text: x }); }))));
          anglers.forEach(function (a) {
            tb.appendChild(el('tr', null, [el('td', { text: '#' + a.rank }), el('td', null, el('strong', { text: a.name })), el('td', { text: 'Skill ' + num(a.skill) }),
              el('td', { text: num(a.species) + (a.species === 1 ? ' kind' : ' kinds') }),
              el('td', { class: 'eldr-muted', text: a.best ? a.best.fish + ' (' + weight(a.best.grams) + ')' : '' })]));
          });
          t.appendChild(tb);
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The most skilled anglers' }), t]));
        } else {
          if (!waters.length) { box.appendChild(empty('The waters are not charted yet.')); return; }
          var t2 = el('table', { class: 'stack' }), tb2 = el('tbody');
          t2.appendChild(el('thead', null, el('tr', null, ['Water', 'Skill needed', 'Bait needed', 'Found'].map(function (x) { return el('th', { text: x }); }))));
          waters.forEach(function (w) {
            tb2.appendChild(el('tr', null, [
              el('td', null, [el('strong', { text: w.name }), w.home ? el('span', { class: 'eldr-badge green', style: { marginLeft: '6px' }, title: 'The game on stream is this water’s own', text: 'Home water' }) : null,
                el('div', { class: 'eldr-small eldr-muted', text: w.from || '' }),
                w.line ? el('div', { class: 'eldr-small', style: { fontStyle: 'italic' }, text: w.line }) : null]),
              el('td', { text: w.skill > 1 ? num(w.skill) : 'None' }),
              el('td', { text: w.bait || 'Any' }),
              el('td', { text: num(w.found) + ' of ' + num(w.total) })]));
          });
          t2.appendChild(tb2);
          box.appendChild(el('section', { class: 'eldr-card' }, [el('h2', { text: 'The waters' }),
            el('p', { class: 'eldr-muted eldr-small', text: 'Shallowest first. “Found” is how many of a water’s fish somebody has caught so far.' }), t2]));
        }
      }
      out.push(tabs(st, [['waters', 'Waters'], ['journal', 'The journal'], ['anglers', 'Anglers']], draw));
      draw();
      out.push(box, foot(d.updated, el('div', { text: 'Type !fishing in chat to see your own journal.' })));
      return out;
    });
  }

  // ================================================================== PATCH NOTES and ABOUT (markdown pages, 11 Nov)
  function mdBlock(b) { return b.type === 'p' ? el('p', { html: inline(b.text) }) : blockNode(b); }
  function mdPage(file, title, tag, each) {
    return function (ctx) {
      return load(file, true).then(function (md) {
        var doc = parseMd(md);
        var intro = doc.intro.filter(function (b) { return b.type === 'p'; }).map(function (b) { return b.text.replace(/^\*|\*$/g, ''); }).join(' ');
        var out = [head(ctx.opts, doc.title || title, tag, intro)];
        if (!doc.sections.length) out.push(empty('Nothing has been written here yet.'));
        doc.sections.forEach(function (s, i) {
          var sec = el('section', { class: 'eldr-card', id: 'eldr-' + slug(s.title) }, [el('h2', { html: inline(s.title) })].concat(s.blocks.map(mdBlock)));
          if (each) each(sec, s, i);
          out.push(sec);
        });
        out.push(foot(ctx.site && ctx.site.files && ctx.site.files[file]));
        return out;
      });
    };
  }
  var patchnotes = mdPage('patchnotes.md', 'Patch Notes', 'What changed in the dark', function (sec, s, i) {
    if (i === 0) sec.querySelector('h2').appendChild(el('span', { class: 'eldr-badge green', style: { marginLeft: '10px', verticalAlign: 'middle' }, text: 'Latest' }));
  });
  var about = mdPage('about.md', 'About the Ledger', 'Embrace the Tentacle');

  var PAGES = { hub: hub, rift: rift, story: story, commands: commands, pacts: pacts, circles: circles, codex: codex, partners: partners, sounds: sounds, bestiary: bestiary, congregation: congregation, order: order, esorder: order, remembrance: remembrance,
    investigator: investigator, talents: investigator, covenant: covenant, fishing: fishing, patchnotes: patchnotes, about: about };

  // ------------------------------------------------------------------ mount
  function render(root, quiet) {
    var page = (root.getAttribute('data-eldr-page') || '').toLowerCase().trim();
    var fn = PAGES[page];
    var ctx = root.__eldr || (root.__eldr = { root: root, state: {}, sig: '' });
    ctx.opts = {
      game: root.getAttribute('data-eldr-game') || '',
      noTitle: root.getAttribute('data-eldr-title') === '0',
      noNav: root.getAttribute('data-eldr-nav') === '0'
    };
    ctx.page = page;
    root.classList.add('eldr-site');
    if (!fn) { root.innerHTML = ''; root.appendChild(empty('Unknown page "' + page + '". Use one of: ' + Object.keys(PAGES).join(', ') + '.')); return Promise.resolve(); }
    if (!quiet) { root.innerHTML = ''; root.appendChild(el('div', { class: 'eldr-loading', text: 'Opening the Ledger…' })); }
    return loadOpt('site.json').then(function (site) {
      ctx.site = site || {};
      return Promise.all([loadOpt('guide.md', true), loadOpt('nav.json')]).then(function (r) { ctx.guide = parseGuide(r[0] || ''); ctx.nav = r[1] || null; return site; });
    }).then(function (site) {
      var sig = site ? JSON.stringify(site.files || site.updated || '') : String(Math.random());
      if (quiet && sig === ctx.sig && page !== 'rift') return;          // nothing new since the last look (the Rift page is live from the forge)
      ctx.sig = sig;
      return Promise.resolve(fn(ctx)).then(function (nodes) {
        var y = window.scrollY;
        var wrap = el('div', { class: 'eldr-wrap' });
        var nb = ctx.opts.noNav ? null : navBar(ctx, page);
        if (nb) wrap.appendChild(nb);
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
