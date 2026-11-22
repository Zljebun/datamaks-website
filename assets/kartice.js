/* Datamaks: animacija na karticama prototipa. Pokrece se samo dok je kartica vidljiva i tab aktivan (klasa .on na roditelju .kv);
   uz prefers-reduced-motion ili ?kartice=slike nista se ne pokrece (ostaje zavrsno stanje / stare slike).
   Brojaci (.cn) se broje ovdje (8 puta u sekundi), jer animacija CSS varijable traje cijeli frejm na glavnoj niti. */
(function () {
  var kv = document.querySelectorAll('.kv');
  if (!kv.length || !window.IntersectionObserver) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('ks')) return;
  var LOOP = 8000, st = new Map(), tm = null;
  var tick = function () {
    var now = performance.now();
    st.forEach(function (s, el) {
      if (!s.on) return;
      s.t += now - s.last; s.last = now;
      var f = Math.min(1, (s.t % LOOP) / (LOOP * 0.4)); f = 1 - Math.pow(1 - f, 3);
      s.cn.forEach(function (c) { c.style.setProperty('--n', Math.round(c.dataset.t * f)); });
    });
  };
  var apply = function () {
    var any = false, now = performance.now();
    st.forEach(function (s, el) {
      var on = s.v && !document.hidden;
      if (on && !s.on) s.last = now;
      s.on = on; el.classList.toggle('on', on); any = any || on;
    });
    if (any && !tm) tm = setInterval(tick, 125); else if (!any && tm) { clearInterval(tm); tm = null; }
  };
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { st.get(e.target.parentNode).v = e.isIntersecting; });
    apply();
  }, { threshold: 0.3 });
  kv.forEach(function (k) {
    var el = k.parentNode, cn = [].slice.call(el.querySelectorAll('.cn'));
    cn.forEach(function (c) { c.dataset.t = c.style.getPropertyValue('--t'); });
    st.set(el, { v: false, on: false, t: 0, last: 0, cn: cn }); io.observe(k);
  });
  document.addEventListener('visibilitychange', apply);
})();
