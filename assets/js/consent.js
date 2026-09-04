/* Datamaks - GDPR cookie consent + Google Analytics 4 (Consent Mode v2)
   gtag se učitava ODMAH, ali podrazumijevano BEZ kolačića
   (analytics_storage: denied) -> GA šalje anonimne pingove bez kolačića,
   pa se svaka posjeta mjeri (uključujući paid iz reklama). Tek na "Prihvatam"
   se uključuju kolačići (analytics_storage: granted) za precizniju statistiku.
   Izbor se pamti u localStorage (dm_consent = "granted" | "denied").
   Banner tekst prati <html lang>. */
(function () {
  'use strict';

  var GA_ID = 'G-4WZCVMT7W1';
  var STORE_KEY = 'dm_consent';

  var TEXT = {
    bs: {
      msg: 'Analitiku posjeta koristimo radi poboljšanja sajta. Bez vašeg pristanka mjerimo anonimno i bez kolačića. Uz pristanak koristimo kolačiće za precizniju statistiku.',
      accept: 'Prihvatam', reject: 'Odbijam'
    },
    hr: {
      msg: 'Analitiku posjeta koristimo radi poboljšanja stranice. Bez vašeg pristanka mjerimo anonimno i bez kolačića. Uz pristanak koristimo kolačiće za precizniju statistiku.',
      accept: 'Prihvaćam', reject: 'Odbijam'
    },
    sr: {
      msg: 'Analitiku poseta koristimo radi poboljšanja sajta. Bez vaše saglasnosti merimo anonimno i bez kolačića. Uz saglasnost koristimo kolačiće za precizniju statistiku.',
      accept: 'Prihvatam', reject: 'Odbijam'
    },
    en: {
      msg: 'We use visit analytics to improve this site. Without your consent we measure anonymously and without cookies. With consent we use cookies for more accurate statistics.',
      accept: 'Accept', reject: 'Decline'
    },
    de: {
      msg: 'Wir nutzen Besuchsstatistiken zur Verbesserung dieser Website. Ohne Ihre Zustimmung messen wir anonym und ohne Cookies. Mit Zustimmung verwenden wir Cookies für genauere Statistiken.',
      accept: 'Akzeptieren', reject: 'Ablehnen'
    }
  };

  var lang = (document.documentElement.lang || 'bs').toLowerCase().slice(0, 2);
  var t = TEXT[lang] || TEXT.bs;

  function readChoice() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function saveChoice(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) {}
  }

  // gtag + Consent Mode se postavljaju ODMAH, prije bilo kakvog izbora.
  // U "denied" stanju GA šalje cookieless pingove (bez kolačića), pa se
  // posjete mjere anonimno. Na "granted" se kolačići uključuju.
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var prior = readChoice();
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: (prior === 'granted') ? 'granted' : 'denied'
  });

  (function loadGA() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    // Kontakt forma preusmjerava na /thank-you.html — svaka posjeta te strane je
    // uspješno poslan upit. Konverzija generate_lead se sada šalje uvijek
    // (cookieless ako nema pristanka). Key event u property 548110029.
    if (location.pathname.indexOf('thank-you') !== -1) {
      gtag('event', 'generate_lead');
    }
  })();

  function grantConsent() {
    saveChoice('granted');
    gtag('consent', 'update', { analytics_storage: 'granted' });
  }
  function denyConsent() {
    saveChoice('denied');
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  function injectStyles() {
    if (document.getElementById('dm-consent-styles')) return;
    var css =
      '.dm-consent{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;' +
      'max-width:440px;background:#ffffff;color:#334155;border:1px solid #e2e8f0;' +
      'border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.18);' +
      'padding:1.1rem 1.25rem;font-family:\'Inter\',-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;' +
      'transform:translateY(140%);transition:transform .35s ease;}' +
      '.dm-consent.is-visible{transform:translateY(0);}' +
      '.dm-consent__text{margin:0 0 .9rem;font-size:.9rem;line-height:1.5;}' +
      '.dm-consent__actions{display:flex;gap:.6rem;justify-content:flex-end;}' +
      '.dm-consent__btn{cursor:pointer;border-radius:8px;font-size:.9rem;font-weight:600;' +
      'padding:.55rem 1.1rem;border:1px solid transparent;font-family:inherit;}' +
      '.dm-consent__btn--accept{background:#1e40af;color:#fff;}' +
      '.dm-consent__btn--accept:hover{background:#1e3a8a;}' +
      '.dm-consent__btn--reject{background:transparent;color:#475569;border-color:#cbd5e1;}' +
      '.dm-consent__btn--reject:hover{background:#f1f5f9;}' +
      '@media (max-width:520px){.dm-consent{max-width:none;}}';
    var style = document.createElement('style');
    style.id = 'dm-consent-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBanner() {
    injectStyles();
    var bar = document.createElement('div');
    bar.className = 'dm-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', 'Cookie consent');

    var p = document.createElement('p');
    p.className = 'dm-consent__text';
    p.textContent = t.msg;

    var actions = document.createElement('div');
    actions.className = 'dm-consent__actions';

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'dm-consent__btn dm-consent__btn--reject';
    reject.textContent = t.reject;

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'dm-consent__btn dm-consent__btn--accept';
    accept.textContent = t.accept;

    actions.appendChild(reject);
    actions.appendChild(accept);
    bar.appendChild(p);
    bar.appendChild(actions);
    document.body.appendChild(bar);

    function dismiss() {
      bar.classList.remove('is-visible');
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 350);
    }
    accept.addEventListener('click', function () { grantConsent(); dismiss(); });
    reject.addEventListener('click', function () { denyConsent(); dismiss(); });

    requestAnimationFrame(function () { bar.classList.add('is-visible'); });
  }

  // Mjerenje klika na prototipe (funnel korak 2). gtag je uvijek prisutan, pa
  // se event šalje i bez pristanka (cookieless).
  function attachProtoTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="/mockups/"]');
      if (!a || typeof window.gtag !== 'function') return;
      var href = a.getAttribute('href') || '';
      var m = href.match(/\/mockups\/([^\/?#]+)/);
      var item = m ? m[1] : 'svi';
      window.gtag('event', 'select_content', {
        content_type: 'prototip',
        item_id: item,
        link_url: href
      });
    }, true);
  }

  // Heartbeat mjerenje zadržavanja (radi i cookieless jer je gtag uvijek učitan).
  // Broji AKTIVNO vrijeme (pauzira kad je tab skriven) i šalje event na pragovima.
  // Zasebna imena (stay_15s, stay_30s...) -> lako se čita "koliko ih ostalo bar Ns".
  function attachHeartbeat() {
    var marks = [15, 30, 60, 120, 180];
    var idx = 0, sec = 0;
    setInterval(function () {
      if (document.visibilityState !== 'visible') return;
      sec++;
      while (idx < marks.length && sec >= marks[idx]) {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'stay_' + marks[idx] + 's', { page_path: location.pathname });
        }
        idx++;
      }
    }, 1000);
  }

  function init() {
    attachProtoTracking();
    attachHeartbeat();
    if (!readChoice()) showBanner();  // pokaži banner samo ako izbor još nije napravljen
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
