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

  // Meta Pixel (Datamaks). Consent-gated: dok nema pristanka eventi se drze
  // (revoke) i posalju tek na "granted". Standardni fbq snippet.
  var PIXEL_ID = '1387485776211055';
  (function loadPixel() {
    if (window.fbq) return;
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var t = document.createElement('script'); t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(t);
    fbq('consent', (prior === 'granted') ? 'grant' : 'revoke');
    fbq('init', PIXEL_ID);
    fbq('track', 'PageView');
    // thank-you = uspjesno poslata forma → Lead (kao i generate_lead za GA)
    if (location.pathname.indexOf('thank-you') !== -1) {
      fbq('track', 'Lead');
    }
  })();

  function grantConsent() {
    saveChoice('granted');
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (window.fbq) fbq('consent', 'grant');
  }
  function denyConsent() {
    saveChoice('denied');
    gtag('consent', 'update', { analytics_storage: 'denied' });
    if (window.fbq) fbq('consent', 'revoke');
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

  // Jedinstveni kontakt FAB (isti na cijelom sajtu): plavi headset -> Viber/WhatsApp/Poziv.
  function injectFab() {
    if (document.getElementById('dm-fab')) return;
    var css =
      '#dm-fab{position:fixed;right:20px;bottom:20px;z-index:9990;display:flex;flex-direction:column;gap:12px;align-items:flex-end;font-family:inherit}' +
      '#dm-fab .dm-acts{display:flex;flex-direction:column;gap:12px;align-items:flex-end;opacity:0;transform:translateY(12px) scale(.95);pointer-events:none;transition:opacity .2s ease,transform .2s ease}' +
      '#dm-fab.open .dm-acts{opacity:1;transform:none;pointer-events:auto}' +
      '#dm-fab a.dm-b{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:999px;color:#fff;font-weight:600;font-size:15px;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18)}' +
      '#dm-fab a.dm-b svg{width:24px;height:24px;fill:#fff;flex:0 0 auto}' +
      '#dm-fab .v{background:#7360F2}#dm-fab .w{background:#25D366}#dm-fab .p{background:#1e40af}' +
      '#dm-fab button.dm-t{width:60px;height:60px;border-radius:50%;border:none;background:#1e40af;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(30,64,175,.5)}' +
      '#dm-fab button.dm-t svg{width:28px;height:28px;fill:#fff}' +
      '#dm-fab .ic-x{display:none}#dm-fab.open button.dm-t{background:#0f172a}#dm-fab.open .ic-o{display:none}#dm-fab.open .ic-x{display:block}' +
      '@media(max-width:520px){#dm-fab a.dm-b .t{display:none}#dm-fab a.dm-b{padding:14px;border-radius:50%}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var VB = '<svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 5.82 2 10.5c0 2.3 1.09 4.4 2.9 5.94-.1 1.22-.55 2.55-1.45 3.66-.2.24-.02.6.29.56 1.86-.2 3.35-.9 4.4-1.62.9.24 1.86.36 2.86.36 5.5 0 10-3.82 10-8.5S17.5 2 12 2zm4.44 11.13c-.2.56-1.16 1.07-1.62 1.14-.41.06-.94.09-1.51-.1-.35-.11-.8-.26-1.37-.5-2.41-1.04-3.98-3.47-4.1-3.63-.12-.16-.98-1.3-.98-2.48s.62-1.76.84-2c.22-.24.48-.3.64-.3l.46.01c.15 0 .35-.06.54.41.2.48.67 1.66.73 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4l-.36.42c-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.07 1.92 1.19.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.14z"/></svg>';
    var WA = '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    var CL = '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.18z"/></svg>';
    var HS = '<svg class="ic-o" viewBox="0 0 24 24"><path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h4v1h-7v2h6c1.66 0 3-1.34 3-3V10c0-4.97-4.03-9-9-9z"/></svg>';
    var XI = '<svg class="ic-x" viewBox="0 0 24 24"><path d="M18.3 5.71L12 12.01l-6.3-6.3-1.41 1.41L10.59 13.4l-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z"/></svg>';
    var w = document.createElement('div'); w.id = 'dm-fab';
    w.innerHTML =
      '<div class="dm-acts">' +
      '<a class="dm-b v" href="viber://add?number=38765469565" data-k="viber" aria-label="Viber">' + VB + '<span class="t">Viber</span></a>' +
      '<a class="dm-b w" href="https://wa.me/436677970082" target="_blank" rel="noopener" data-k="whatsapp" aria-label="WhatsApp">' + WA + '<span class="t">WhatsApp</span></a>' +
      '<a class="dm-b p" href="tel:+38765469565" data-k="telefon" aria-label="Pozovi">' + CL + '<span class="t">Pozovi</span></a>' +
      '</div>' +
      '<button class="dm-t" type="button" aria-label="Kontakt" aria-expanded="false">' + HS + XI + '</button>';
    document.body.appendChild(w);
    var tgl = w.querySelector('.dm-t');
    tgl.addEventListener('click', function (e) { e.stopPropagation(); var o = w.classList.toggle('open'); tgl.setAttribute('aria-expanded', o); });
    document.addEventListener('click', function (e) { if (!w.contains(e.target)) { w.classList.remove('open'); tgl.setAttribute('aria-expanded', 'false'); } });
    var arr = w.querySelectorAll('a[data-k]');
    for (var i = 0; i < arr.length; i++) {
      (function (a) {
        a.addEventListener('click', function () {
          var k = a.getAttribute('data-k');
          if (typeof window.gtag === 'function') window.gtag('event', 'kontakt_klik', { kanal: k, stranica: location.pathname });
          if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: 'kontakt-' + k });
        });
      })(arr[i]);
    }
  }

  function init() {
    attachProtoTracking();
    attachHeartbeat();
    injectFab();
    if (!readChoice()) showBanner();  // pokaži banner samo ako izbor još nije napravljen
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
