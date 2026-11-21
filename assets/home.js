/* Datamaks naslovnica: hero scena (haos postaje jedan ekran) i izbor problema. Tekstovi dolaze iz window.DM (po jeziku). */
(function () {
  var DM = window.DM || {};
  var sc = document.getElementById('scene'), trk = document.getElementById('trk'), stl = document.getElementById('st');
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (sc && trk) {
    var stn = DM.stn || [], steps = trk.children;
    var setP = function (p) {
      sc.dataset.p = p;
      var k = p >= 2 ? p - 1 : 0;
      for (var i = 0; i < 4; i++) steps[i].classList.toggle('ok', i < k);
      trk.style.setProperty('--f', k > 0 ? (k - 1) / 3 : 0);
      stl.textContent = k > 0 ? stn[k - 1] : stn[0];
    };
    var dur = [2800, 1200, 1100, 1100, 1100, 2400], pi = 0, tm = null, vis = true;
    var tick = function () { setP(pi); tm = setTimeout(function () { pi = (pi + 1) % 6; tick(); }, dur[pi]); };
    if (rm) { sc.setAttribute('data-static', ''); setP(5); }
    else {
      var go = function () { if (!tm && vis && !document.hidden) tick(); };
      var stop = function () { clearTimeout(tm); tm = null; };
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; vis ? go() : stop(); }, { threshold: .2 }).observe(sc);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : go(); });
      if (document.readyState === 'complete') go(); else addEventListener('load', function () { setTimeout(go, 300); });
    }
  }
  var pk = document.querySelectorAll('.pk'), pis = document.querySelectorAll('#pi .pi');
  var pe = document.getElementById('pe'), ps = document.getElementById('ps');
  function upd() {
    var n = 0;
    pk.forEach(function (b, i) {
      var on = b.getAttribute('aria-pressed') === 'true'; if (on) n++;
      var it = pis[i];
      if (on && it.hidden) { it.hidden = false; it.style.animation = 'none'; void it.offsetWidth; it.style.animation = ''; }
      if (!on) it.hidden = true;
    });
    if (pe) pe.hidden = n > 0;
    if (ps) { ps.hidden = n === 0; ps.textContent = (DM.sum || '{n}').replace('{n}', n); }
  }
  pk.forEach(function (b) {
    b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); upd(); });
  });
  upd();
})();
