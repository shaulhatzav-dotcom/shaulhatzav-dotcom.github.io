/* shaulhatzav.co.il: install-to-home-screen button + offline cache (built by make_pwa.py, 28/11/2026).
   Any element with data-install becomes a "📲 התקנה" button. Android/computer Chrome: the browser's own install dialog.
   iPhone/iPad: no install dialog exists, so the button shows how to do it (Share ⬆️ → Add to Home Screen). */
(function () {
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var deferred = null;
  function ev(name) { try { if (typeof count === 'function') count(name); } catch (e) {} }   // GoatCounter in the games
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      // opened as the app: keep the full games on the phone so they work without internet
      if (standalone) navigator.serviceWorker.ready.then(function (r) { r.active && r.active.postMessage('cache-games'); });
    }).catch(function () {});
  }
  var css = document.createElement('style');
  css.textContent = '[data-install][hidden]{display:none!important}' +
    '#iosHelp{position:fixed;inset:0;z-index:99999;background:rgba(20,17,42,.78);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:Rubik,system-ui,sans-serif;direction:rtl}' +
    '#iosHelp .c{background:#fff;color:#22264a;border:3px solid #22264a;border-radius:22px;box-shadow:4px 6px 0 #22264a;max-width:420px;width:100%;padding:18px 20px 14px;font-size:18px;line-height:1.45}' +
    '#iosHelp b{font-weight:900}#iosHelp ol{margin:8px 0 12px;padding-inline-start:22px}#iosHelp li{margin:6px 0}' +
    '#iosHelp .i{display:inline-block;border:2px solid #0e7c86;border-radius:8px;padding:0 6px;color:#0e7c86;font-weight:900}' +
    '#iosHelp button{font:inherit;font-weight:900;background:#ffd23f;color:#22264a;border:3px solid #22264a;border-radius:999px;padding:6px 22px;cursor:pointer}' +
    '#iosHelp .arr{text-align:center;font-size:34px;margin-top:6px;animation:iosb 1s infinite alternate}@keyframes iosb{to{transform:translateY(8px)}}';
  document.head.appendChild(css);
  function show(on) { document.querySelectorAll('[data-install]').forEach(function (b) { b.hidden = !on; }); }
  function iosHelp() {
    if (document.getElementById('iosHelp')) return;
    var d = document.createElement('div'); d.id = 'iosHelp';
    d.innerHTML = '<div class="c"><b>📲 שאול הצב במסך הבית</b><ol>' +
      '<li>לוחצים על כפתור השיתוף <span class="i">⬆️</span> בתחתית המסך (בספארי)</li>' +
      '<li>גוללים ובוחרים <b>"הוספה למסך הבית"</b> <span class="i">➕</span></li>' +
      '<li>לוחצים <b>"הוסף"</b>, וזהו! 🐢</li></ol>' +
      '<div style="text-align:center"><button type="button">הבנתי</button></div><div class="arr">⬇️</div></div>';
    d.addEventListener('click', function (e) { if (e.target === d || e.target.tagName === 'BUTTON') d.remove(); });
    document.body.appendChild(d);
  }
  if (standalone) { ev('app-open'); return; }
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; show(true); });
  addEventListener('appinstalled', function () { show(false); ev('app-installed'); });
  if (ios) show(true);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-install]'); if (!b) return;
    e.preventDefault();
    if (deferred) {
      ev('app-install-click');
      deferred.prompt();
      deferred.userChoice.then(function (c) { if (c.outcome === 'accepted') show(false); deferred = null; });
    } else if (ios) { ev('app-install-ios-help'); iosHelp(); }
  });
})();
