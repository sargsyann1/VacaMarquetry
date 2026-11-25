/**
 * VaCa Marquetry — lead forms (portrait, contact, trade) for every language.
 *
 * Moved out of the pages' inline scripts on 2026-11-25 (roadmap phase 2),
 * so one handler serves EN, IT and future languages. The data each Make.com
 * webhook receives is unchanged:
 *   - portrait: multipart FormData of the form + photos_count, source_url,
 *               attribution; non-English pages also send language=<code>
 *               (Italian always did: language=it).
 *   - contact / trade: JSON with the same keys as before.
 * Strings come from window.VACA_I18N.forms (assets/js/i18n/<lang>.js).
 * conversion-ux.js validates [required] fields in the capture phase first.
 */
(function () {
  'use strict';

  var I18N = window.VACA_I18N || {};
  var LANG = I18N.lang || (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
  var T = I18N.forms;
  if (!T) { console.error('[forms] interface strings missing (assets/js/i18n/' + LANG + '.js)'); return; }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* Webhooks (Make.com) — see memory/make-crm-scenarios before changing */
  var PORTRAIT_WEBHOOK_URL = 'https://hook.eu2.make.com/h5lg5ik06nwcxwc9bm401v2yk83lgrpc';
  var CONTACT_WEBHOOK_URL  = 'https://hook.eu2.make.com/gelvu7ctcx2t11y2uiv449qqt8dxp1mc';
  var TRADE_WEBHOOK_URL    = 'https://hook.eu2.make.com/t7fhusnf0kjm4qmbfh93ow5xtor0n1v7';

  /* ── shared helpers ─────────────────────────────────────────── */
  function helpers(form, submitBtn, opts) {
    var label = submitBtn.textContent;
    return {
      setLoading: function (on) {
        submitBtn.disabled = on;
        submitBtn.textContent = on ? T.sending : label;
        submitBtn.style.opacity = on ? '0.6' : '';
      },
      clearErrors: function () {
        form.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
        form.querySelectorAll('.field-error-text').forEach(function (el) { el.remove(); });
        var fe = form.querySelector('.form-error-msg');
        if (fe) fe.remove();
      },
      fieldError: function (input, msg) {
        var field = input.closest ? input.closest('.field') : input.parentElement;
        if (!field) return;
        field.classList.add('has-error');
        var p = document.createElement('p');
        p.className = 'field-error-text';
        p.textContent = msg;
        field.appendChild(p);
        if (input.type !== 'file') input.focus();
      },
      formError: function (msg) {
        var p = document.createElement('p');
        p.className = 'form-error-msg';
        p.textContent = msg;
        submitBtn.parentNode.insertBefore(p, submitBtn);
        if (opts && opts.scrollOnError) submitBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
  }

  function checkEmail(h, emailEl) {
    var v = emailEl.value.trim();
    if (!v) { h.fieldError(emailEl, T.errEmail); return false; }
    if (!EMAIL_RE.test(v)) { h.fieldError(emailEl, T.errEmailValid); return false; }
    return true;
  }

  function attribution() {
    return (window.vacaAttributionPayload && window.vacaAttributionPayload()) || {};
  }

  function track(eventName, params) {
    if (window.vacaTrackConversion) { window.vacaTrackConversion(eventName, params); }
    else if (typeof gtag === 'function') { gtag('event', eventName, params); }
  }

  function looksLikeBot(form) {
    return window.vacaLooksLikeBot && window.vacaLooksLikeBot(form);
  }

  /* Honeypot value, sent as `website` so the Make scenarios can also drop
     direct webhook posts that filled it. Real visitors always send ''. */
  function honeypot(form) {
    return (form.querySelector('.hp-field [name="website"]') || {}).value || '';
  }

  /* ================================================================
     PORTRAIT — custom-portraits.html and its translations
     ================================================================ */
  (function () {
    var form      = document.getElementById('portrait-form');
    var submitBtn = document.getElementById('portrait-submit');
    var successEl = document.getElementById('portrait-success');
    if (!form || !submitBtn) return;
    var P = T.portrait;
    var h = helpers(form, submitBtn, { scrollOnError: true });

    /* Upload feedback — how many photos were picked */
    var photoInput = form.querySelector('[name="photos"]');
    var uploadZone = form.querySelector('.upload-zone');
    var uploadText = uploadZone && uploadZone.querySelector('.upload-zone-text');
    var uploadIdle = uploadText ? uploadText.innerHTML : '';
    if (photoInput && uploadZone && uploadText) {
      photoInput.addEventListener('change', function () {
        var n = photoInput.files ? photoInput.files.length : 0;
        uploadZone.classList.toggle('has-files', n > 0);
        uploadText.innerHTML = n > 0 ? P.photosSelected(n) : uploadIdle;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* Spam guard: honeypot filled or sent within 3 s of page load — drop silently */
      if (looksLikeBot(form)) return;
      h.clearErrors();

      var valid     = true;
      var nameEl    = form.querySelector('[name="name"]');
      var emailEl   = form.querySelector('[name="email"]');
      var subjectEl = form.querySelector('[name="subject_type"]');
      var budgetEl  = form.querySelector('[name="budget"]');
      var photosEl  = form.querySelector('[name="photos"]');

      if (!nameEl.value.trim()) { h.fieldError(nameEl, T.errName); valid = false; }
      if (!checkEmail(h, emailEl)) valid = false;
      if (subjectEl && !subjectEl.value) { h.fieldError(subjectEl, P.errSubject); valid = false; }
      if (budgetEl && !budgetEl.value) { h.fieldError(budgetEl, P.errBudget); valid = false; }
      /* Photo required (1–5): the Make portrait scenario is only proven with attachments */
      var photoCount = (photosEl && photosEl.files) ? photosEl.files.length : 0;
      if (photoCount === 0) { h.fieldError(photosEl, P.errPhotos); valid = false; }
      else if (photoCount > 5) { h.fieldError(photosEl, P.errPhotosMax); valid = false; }
      if (!valid) return;

      h.setLoading(true);

      var fd = new FormData(form);
      if (photoCount === 0 && fd.delete) fd.delete('photos');
      fd.append('photos_count', String(photoCount));
      if (LANG !== 'en') fd.append('language', LANG);
      fd.append('source_url', window.location.href);
      var attr = attribution();
      for (var ak in attr) {
        if (Object.prototype.hasOwnProperty.call(attr, ak)) fd.append(ak, attr[ak]);
      }

      fetch(PORTRAIT_WEBHOOK_URL, { method: 'POST', body: fd })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.style.display = 'none';
          successEl.style.display = 'block';
          successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          track('portrait_inquiry', {
            event_category: 'form',
            event_label: LANG === 'en' ? 'custom_portrait' : 'custom_portrait_' + LANG,
            budget: budgetEl ? budgetEl.value : '',
            photos_count: photoCount,
            page_language: LANG
          });
        })
        .catch(function (err) {
          console.error('[portrait-form]', err);
          h.setLoading(false);
          h.formError(P.errSend);
        });
    });
  })();

  /* ================================================================
     CONTACT — contact.html and its translations
     ================================================================ */
  (function () {
    var form      = document.getElementById('contact-form');
    var submitBtn = document.getElementById('contact-submit');
    var successEl = document.getElementById('contact-success');
    if (!form || !submitBtn) return;
    var C = T.contact;
    var h = helpers(form, submitBtn);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (looksLikeBot(form)) return;
      h.clearErrors();

      var valid   = true;
      var nameEl  = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      var msgEl   = form.querySelector('[name="message"]');

      if (!nameEl.value.trim()) { h.fieldError(nameEl, T.errName); valid = false; }
      if (!checkEmail(h, emailEl)) valid = false;
      if (!msgEl.value.trim()) { h.fieldError(msgEl, C.errMessage); valid = false; }
      if (!valid) return;

      h.setLoading(true);

      var payloadObj = {
        name:       nameEl.value.trim(),
        email:      emailEl.value.trim(),
        message:    msgEl.value.trim(),
        source_url: window.location.href,
        website:    honeypot(form)
      };
      var attr = attribution();
      for (var ak in attr) {
        if (Object.prototype.hasOwnProperty.call(attr, ak)) payloadObj[ak] = attr[ak];
      }

      fetch(CONTACT_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payloadObj)
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.style.display = 'none';
          successEl.style.display = 'block';
          track('contact_submit', { event_category: 'form', event_label: 'contact' });
        })
        .catch(function (err) {
          console.error('[contact-form]', err);
          h.setLoading(false);
          h.formError(C.errSend);
        });
    });
  })();

  /* ================================================================
     TRADE — trade.html and its translations
     ================================================================ */
  (function () {
    var form      = document.getElementById('trade-form');
    var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    if (!form || !submitBtn) return;
    var D = T.trade;
    var h = helpers(form, submitBtn);

    /* Success banner injected after the form */
    var successEl = document.createElement('div');
    successEl.style.cssText = 'display:none;padding:1.5rem;background:var(--color-surface,#faf9f6);border:1px solid var(--color-border,#e5e0d8);border-radius:8px;text-align:center;margin-top:1rem;';
    successEl.innerHTML = D.successHtml;
    form.parentNode.insertBefore(successEl, form.nextSibling);

    function val(name) { return (form.querySelector('[name="' + name + '"]') || {}).value || ''; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (looksLikeBot(form)) return;
      h.clearErrors();

      var companyEl = form.querySelector('[name="company"]');
      var contactEl = form.querySelector('[name="contact_name"]');
      var emailEl   = form.querySelector('[name="email"]');
      var valid     = true;

      if (!companyEl.value.trim()) { h.fieldError(companyEl, D.errCompany); valid = false; }
      if (!contactEl.value.trim()) { h.fieldError(contactEl, D.errContact); valid = false; }
      if (!checkEmail(h, emailEl)) valid = false;
      if (!valid) return;

      h.setLoading(true);

      var payloadObj = {
        company:      companyEl.value.trim(),
        contact_name: contactEl.value.trim(),
        role:         val('role'),
        email:        emailEl.value.trim(),
        project_type: val('project_type'),
        scale:        val('scale'),
        budget:       val('budget'),
        notes:        val('notes'),
        source_url:   window.location.href,
        website:      honeypot(form)
      };
      var attr = attribution();
      for (var ak in attr) {
        if (Object.prototype.hasOwnProperty.call(attr, ak)) payloadObj[ak] = attr[ak];
      }

      fetch(TRADE_WEBHOOK_URL, {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        body:      JSON.stringify(payloadObj),
        keepalive: true
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.style.display = 'none';
          successEl.style.display = 'block';
          track('trade_inquiry_submit', { event_category: 'form', event_label: 'trade' });
        })
        .catch(function (err) {
          console.error('[VaCa Trade]', err);
          h.setLoading(false);
          h.formError(D.errSend);
        });
    });
  })();
})();
