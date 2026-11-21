/* Datamaks sajt: zajednicka skripta (header, izbornik, jezik, reveal, TOC, progres citanja). Bez biblioteka. */
(function () {
  var d = document, h = d.documentElement;
  h.classList.add('js');
  if (/static/.test(location.search)) h.classList.remove('js');

  var hd = d.getElementById('hd');
  function sc() { if (hd && !hd.classList.contains('solid')) hd.classList.toggle('sc', window.scrollY > 40); }
  addEventListener('scroll', sc, { passive: true }); sc();

  // otkrivanje pri skrolu
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // jezicki izbornik i mobilni meni
  var lt = d.getElementById('lt'), ld = d.getElementById('ld'), bg = d.getElementById('bg'), mm = d.getElementById('mm');
  function lang(o) { if (!ld) return; ld.hidden = !o; lt.setAttribute('aria-expanded', o); }
  function menu(o) { if (!mm) return; mm.hidden = !o; bg.setAttribute('aria-expanded', o); hd.classList.toggle('mo', o); }
  if (lt) lt.addEventListener('click', function (e) { e.stopPropagation(); menu(false); lang(ld.hidden); });
  if (bg) bg.addEventListener('click', function (e) { e.stopPropagation(); lang(false); menu(mm.hidden); });
  if (mm) mm.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  d.addEventListener('click', function (e) { if (ld && !ld.contains(e.target)) lang(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { lang(false); menu(false); } });
  // ako se prozor prosiri preko tacke prelaza, zatvori mobilni meni
  addEventListener('resize', function () { if (innerWidth >= 1040) menu(false); });

  // clanak: sadrzaj (aktivna sekcija) i progres citanja
  var prose = d.querySelector('.prose');
  if (prose && 'IntersectionObserver' in window) {
    var hs = prose.querySelectorAll('h2[id]');
    var links = d.querySelectorAll('.toc a');
    var cur = null;
    function mark(id) {
      if (id === cur) return; cur = id;
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-15% 0px -70% 0px' });
    hs.forEach(function (x) { spy.observe(x); });
  }
  var prog = d.getElementById('prog'), art = d.querySelector('.art-grid');
  if (prog && art) {
    var tick = false;
    function pr() {
      var r = art.getBoundingClientRect(), t = r.height - innerHeight * .6;
      var p = t > 0 ? Math.min(1, Math.max(0, -r.top / t)) : 0;
      prog.style.transform = 'scaleX(' + p + ')'; tick = false;
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(pr); } }, { passive: true }); pr();
  }
})();
