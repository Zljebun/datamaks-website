/* Datamaks: kontakt forma na naslovnici. Format zahtjeva preuzet iz stare naslovnice:
   POST JSON na Supabase funkciju "contact", polja ime, email, firma, tip, poruka, _gotcha,
   uspjeh (response.ok) vodi na thank-you stranicu istog jezika. Dodano: validacija i FAIL-OPEN
   (greska ne brise unos, prikazuje direktne kontakte). Mjerenje konverzije radi consent.js na thank-you stranici. */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var ENDPOINT = 'https://tjufkzervoxvyteomaww.supabase.co/functions/v1/contact';
  var btn = form.querySelector('button[type="submit"]');
  var fail = form.querySelector('.ffail');
  var status = document.getElementById('form-status');
  var busy = false;
  var f = function (n) { return form.querySelector('[name=' + n + ']'); };
  var val = function (n) { return (f(n) || {}).value || ''; };

  function mark(input, errId, bad) {
    var e = document.getElementById(errId);
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    input.classList.toggle('bad', bad);
    if (e) e.hidden = !bad;
  }
  function validate() {
    var n = f('name'), m = f('email');
    var okN = n.value.trim().length > 0;
    var okM = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim());
    mark(n, 'e-name', !okN);
    mark(m, 'e-email', !okM);
    if (!okN) { n.focus(); return false; }
    if (!okM) { m.focus(); return false; }
    return true;
  }
  ['name', 'email'].forEach(function (k) {
    f(k).addEventListener('input', function () { if (this.classList.contains('bad')) validate.call(null); });
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (busy) return;
    fail.hidden = true;
    if (!validate()) return;
    // preview: slanje je iskljuceno (u produkcijskoj izgradnji ovog bloka nema)
    if (window.DMF && window.DMF.preview && !window.DMF.allowSend) {
      fail.hidden = false;
      fail.querySelector('strong').textContent = 'Preview: slanje je isključeno.';
      return;
    }
    busy = true;
    var originalText = btn.textContent;
    btn.textContent = form.dataset.sending;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    var payload = {
      ime: val('name'),
      email: val('email'),
      firma: val('company'),
      tip: val('topic'),
      poruka: val('message'),
      _gotcha: val('_gotcha')
    };
    try {
      var response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        window.location.href = form.dataset.thanks;
        return; // dugme ostaje onemoguceno dok traje preusmjeravanje
      }
      throw new Error('Form submission failed');
    } catch (error) {
      // fail-open: unos ostaje u formi, korisnik dobija direktne kontakte umjesto tehnicke greske
      btn.textContent = originalText;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      busy = false;
      fail.hidden = false;
      if (status) status.focus({ preventScroll: false });
    }
  });
})();
