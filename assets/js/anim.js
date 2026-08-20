// Reveal animacija za sekciju "Kako radimo" (linija toka + kartice na scroll)
(function () {
  "use strict";
  var ps = document.querySelector(".process-steps");
  if (!ps) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    return; // sve ostaje vidljivo u mirnom stanju, bez animacije
  }

  ps.classList.add("anim-ready");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        ps.classList.add("anim-in");
        io.disconnect();
      }
    });
  }, { threshold: 0.25 });
  io.observe(ps);
})();
