/* Landing: mjerenje kontakata (GA4/Pixel) i kratki upit. Preneseno iz postojece stranice; slanje je zasticeno van datamaks.net. */
(function () {
  function dmTrack(name, kanal) {
    if (window.gtag) { gtag('event', name, { kanal: kanal, stranica: 'landing-softver' }); }
    if (window.fbq) { fbq('track', 'Lead', { content_name: 'kontakt-' + kanal }); }
  }
  document.querySelectorAll('.lp-hero [data-kanal]').forEach(function (a) {
    a.addEventListener('click', function () { dmTrack('kontakt_klik', a.getAttribute('data-kanal')); });
  });
  var leadForm = document.getElementById('lead-form');
  if (!leadForm) return;
  leadForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    // preview i probna okruzenja ne smiju slati prave upite u produkcijsku bazu
    if (!/(^|\.)datamaks\.net$/.test(location.hostname)) {
      alert('Preview: slanje upita je isključeno van datamaks.net.');
      return;
    }
    if (window.gtag) { gtag('event', 'lead_form_submit', { stranica: 'landing-softver' }); }
    var btn = leadForm.querySelector('button[type=submit]');
    var orig = btn.textContent;
    btn.textContent = 'Slanje...';
    btn.disabled = true;
    var val = function (n) { return (leadForm.querySelector('[name=' + n + ']') || {}).value || ''; };
    var msg = val('message'), phone = val('phone'), email = val('email');
    var payload = {
      ime: val('name'),
      email: email || 'upit-bez-emaila@datamaks.net',
      firma: '',
      tip: 'Softver za namjestaj (landing)',
      poruka: (msg ? msg + '\n' : '') + 'Telefon/Viber: ' + phone,
      _gotcha: val('_gotcha')
    };
    try {
      var r = await fetch('https://tjufkzervoxvyteomaww.supabase.co/functions/v1/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (r.ok) { window.location.href = '/thank-you.html'; } else { throw new Error('failed'); }
    } catch (err) {
      alert('Greška pri slanju. Molimo pišite nam na Viber ili pozovite.');
      btn.textContent = orig; btn.disabled = false;
    }
  });
})();
