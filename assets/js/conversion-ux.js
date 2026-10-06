/**
 * VaCa Marquetry — Conversion UX (Phase 2.1, 2026-09-27)
 *
 * Presentation / client-side helpers only. This file does NOT touch
 * tracking (gtag, dataLayer, attribution), webhook URLs, fetch calls or the
 * FormData each page builds. Pages keep their own submit handlers.
 *
 * 1. Sticky mobile "Free Preview" CTA (phones only; pages whose script tag
 *    carries data-sticky-cta). Links to the page's existing header CTA.
 * 2. Required fields: visual marker + pre-submit validation for every
 *    [required] control. Runs in the capture phase before the page's own
 *    submit handler and only blocks it when something is missing.
 * 3. Photo upload: type/size checks, in-browser resize of large photos
 *    (files are swapped inside the same <input name="photos">, so the page
 *    sends exactly the same field), and status feedback.
 */
(function () {
  'use strict';

  var IS_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;
  var T = IS_IT ? {
    ctaEyebrow: 'Anteprima gratuita', ctaText: 'Richiedi il tuo ritratto',
    reqNote: 'I campi contrassegnati con * sono obbligatori',
    fill: function (l) { return 'Compila il campo “' + l + '”.'; },
    choose: function (l) { return 'Seleziona un’opzione per “' + l + '”.'; },
    email: 'Inserisci un indirizzo email valido.',
    preparing: function (n) { return 'Preparazione di ' + n + (n === 1 ? ' foto…' : ' foto…'); },
    ready: function (n, size, from) { return '✓ ' + n + (n === 1 ? ' foto pronta' : ' foto pronte') + ' · ' + size + (from ? ' (ottimizzate da ' + from + ')' : ''); },
    tooMany: 'Puoi caricare al massimo 5 foto.',
    notImage: function (f) { return '“' + f + '” non è un’immagine. Scegli foto in formato JPG, PNG, WEBP o HEIC.'; },
    tooBig: function (f) { return '“' + f + '” supera i 25 MB. Scegli una foto più leggera.'; },
    totalBig: 'Le foto selezionate sono troppo pesanti (oltre 20 MB). Scegline meno o più leggere.',
    uploading: function (size) { return 'Invio delle foto in corso (' + size + ')… tieni aperta questa pagina.'; },
    slow: 'Ancora qualche istante: con la rete mobile l’invio delle foto può richiedere un po’ di più.',
    wait: 'Attendi: stiamo preparando le foto…'
  } : {
    ctaEyebrow: 'Free Preview', ctaText: 'Request your portrait',
    reqNote: 'Fields marked * are required',
    fill: function (l) { return 'Please complete “' + l + '”.'; },
    choose: function (l) { return 'Please choose an option for “' + l + '”.'; },
    email: 'Please enter a valid email address.',
    preparing: function (n) { return 'Preparing ' + n + (n === 1 ? ' photo…' : ' photos…'); },
    ready: function (n, size, from) { return '✓ ' + n + (n === 1 ? ' photo ready' : ' photos ready') + ' · ' + size + (from ? ' (optimised from ' + from + ')' : ''); },
    tooMany: 'Please select up to 5 photos.',
    notImage: function (f) { return '“' + f + '” is not an image. Please choose JPG, PNG, WEBP or HEIC photos.'; },
    tooBig: function (f) { return '“' + f + '” is larger than 25 MB. Please choose a smaller photo.'; },
    totalBig: 'The selected photos are too large together (over 20 MB). Please choose fewer or smaller photos.',
    uploading: function (size) { return 'Uploading your photos (' + size + ')… please keep this page open.'; },
    slow: 'Almost there — photos can take a little longer on mobile data.',
    wait: 'One moment — preparing your photos…'
  };

  function mb(bytes) { return (bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0) + ' MB'; }

  /* ================================================================
     1. STICKY MOBILE CTA
     ================================================================ */
  (function () {
    var me = document.currentScript || document.querySelector('script[src*="conversion-ux.js"]');
    if (!me || !me.hasAttribute('data-sticky-cta')) return;
    var src = document.querySelector('.nav-cta');
    if (!src) return;

    var bar = document.createElement('a');
    bar.className = 'sticky-cta';
    bar.href = src.getAttribute('href');
    bar.setAttribute('aria-hidden', 'true');
    bar.tabIndex = -1;
    bar.innerHTML = '<span class="sticky-cta__eyebrow">' + T.ctaEyebrow + '</span>' +
                    '<span class="sticky-cta__text">' + T.ctaText + ' <span aria-hidden="true">&rarr;</span></span>';
    document.body.appendChild(bar);

    var phone = window.matchMedia('(max-width: 600px)');
    /* Elements that already offer the action: while any is on screen the bar stays away */
    var blockers = Array.prototype.slice.call(document.querySelectorAll(
      '.hero-cta-row, #inquiry, #richiesta, #portrait-form, #aw-inquire, .artwork-cta, .site-footer'));
    var visible = new Set();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
        update();
      });
      blockers.forEach(function (el) { io.observe(el); });
    }
    function inputFocused() {
      var a = document.activeElement;
      return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    }
    /* After a successful enquiry the bar has done its job on this page */
    function sent() {
      return Array.prototype.some.call(document.querySelectorAll('.form-success, #ai-success'), function (e) {
        return e.offsetParent !== null;
      });
    }
    function update() {
      var b = document.body;
      var show = phone.matches && !sent() &&
        window.scrollY > window.innerHeight * 0.6 &&
        visible.size === 0 &&
        !b.classList.contains('has-cookie-banner') &&
        !b.classList.contains('nav-open') &&
        !b.classList.contains('lb-open') &&
        !inputFocused();
      if (show !== bar.classList.contains('is-visible')) {
        bar.classList.toggle('is-visible', show);
        b.classList.toggle('has-sticky-cta', show);
        bar.setAttribute('aria-hidden', show ? 'false' : 'true');
        bar.tabIndex = show ? 0 : -1;
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', function () { setTimeout(update, 50); });
    if (phone.addEventListener) phone.addEventListener('change', update);
    /* Body classes set by main.js (cookie banner, menu, lightbox) */
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    update();
  })();

  /* ================================================================
     2. REQUIRED FIELDS — marker + pre-submit validation
     ================================================================ */
  function labelFor(el) {
    var f = el.closest('.field');
    var l = (el.id && document.querySelector('label[for="' + el.id + '"]')) || (f && f.querySelector('label'));
    return l ? l.textContent.replace(/\*|\(.*?\)/g, '').replace(/\s+/g, ' ').trim() : '';
  }
  function markRequired(root) {
    Array.prototype.forEach.call(root.querySelectorAll('[required]'), function (el) {
      if (el.type === 'hidden' || el.type === 'file') return;
      el.setAttribute('aria-required', 'true');
      var f = el.closest('.field');
      if (f) f.classList.add('is-required');
    });
  }
  function showError(el, msg) {
    var f = el.closest('.field') || el.parentElement;
    if (!f) return;
    f.classList.add('has-error');
    el.setAttribute('aria-invalid', 'true');
    var p = document.createElement('p');
    p.className = 'field-error-text';
    p.setAttribute('role', 'alert');
    p.textContent = msg;
    f.appendChild(p);
  }
  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll('.has-error'), function (x) { x.classList.remove('has-error'); });
    Array.prototype.forEach.call(form.querySelectorAll('.field-error-text'), function (x) { x.remove(); });
    Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var forms = Array.prototype.slice.call(document.querySelectorAll('form#portrait-form, form#contact-form, form#trade-form'));
  forms.forEach(function (form) {
    markRequired(form);
    if (form.querySelector('.is-required') && !form.querySelector('.form-required-note')) {
      var note = document.createElement('p');
      note.className = 'form-required-note';
      note.textContent = T.reqNote;
      form.insertBefore(note, form.firstChild);
    }
    /* Clear a field's error as soon as it is corrected */
    form.addEventListener('input', function (e) { fieldOk(e.target); });
    form.addEventListener('change', function (e) { fieldOk(e.target); });
  });
  function fieldOk(el) {
    var f = el && el.closest && el.closest('.field.has-error');
    if (!f || el.type === 'file') return;
    if (String(el.value || '').trim()) {
      f.classList.remove('has-error');
      el.removeAttribute('aria-invalid');
      var p = f.querySelector('.field-error-text'); if (p) p.remove();
    }
  }

  /* Artwork enquiry (built by artwork-loader.js, not a <form>): markers only —
     its own script already validates name and email */
  var aw = document.getElementById('ai-form-inner');
  if (aw) markRequired(aw);

  /* Capture phase on document: runs before each page's own submit handler */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (forms.indexOf(form) === -1) return;

    /* Photos still being prepared: wait, then submit again */
    var up = form.__vacaUpload;
    if (up && up.busy) {
      e.preventDefault(); e.stopImmediatePropagation();
      up.setStatus(T.wait, 'busy');
      up.busy.then(function () { resubmit(form); });
      return;
    }
    if (up && up.error) {
      e.preventDefault(); e.stopImmediatePropagation();
      up.zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    clearErrors(form);
    var first = null;
    Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (el) {
      if (el.type === 'file' || el.disabled) return;
      var v = String(el.value || '').trim();
      var msg = null;
      if (!v) msg = el.tagName === 'SELECT' ? T.choose(labelFor(el)) : T.fill(labelFor(el));
      else if (el.type === 'email' && !EMAIL_RE.test(v)) msg = T.email;
      if (msg) { showError(el, msg); if (!first) first = el; }
    });
    if (first) {
      e.preventDefault();
      e.stopImmediatePropagation();
      first.focus({ preventScroll: true });
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    /* Valid → the page's handler runs unchanged (it sends the form) */
    if (up) up.onSend();
  }, true);

  function resubmit(form) {
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  /* ================================================================
     3. PHOTO UPLOAD — validate, resize, status
     ================================================================ */
  var MAX_FILES = 5;
  var MAX_ORIGINAL = 25 * 1048576;   /* per photo, before resizing */
  var MAX_TOTAL = 20 * 1048576;      /* all photos, after resizing */
  var MAX_EDGE = 2400;               /* px — ample detail for the portrait preview */
  var KEEP_UNDER = 1.5 * 1048576;    /* already-light photos are sent untouched */
  var QUALITY = 0.86;
  var canSwap = (function () { try { return !!new DataTransfer().items; } catch (e) { return false; } })();

  function isImage(f) {
    return /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name);
  }
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }
  function resize(file) {
    /* Small JPEG/PNG/WEBP within limits → keep as is */
    return loadImage(file).then(function (r) {
      var w = r.img.naturalWidth, h = r.img.naturalHeight;
      if (file.size <= KEEP_UNDER && Math.max(w, h) <= MAX_EDGE) { URL.revokeObjectURL(r.url); return file; }
      var s = Math.min(1, MAX_EDGE / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * s); c.height = Math.round(h * s);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);   /* PNG transparency → white */
      ctx.drawImage(r.img, 0, 0, c.width, c.height);                   /* EXIF orientation applied by the browser */
      URL.revokeObjectURL(r.url);
      return new Promise(function (resolve) {
        c.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) { resolve(file); return; }   /* never make it bigger */
          var name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          try { resolve(new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified })); }
          catch (e) { resolve(file); }
        }, 'image/jpeg', QUALITY);
      });
    }, function () { return file; });   /* browser cannot decode (e.g. HEIC on Chrome) → send original */
  }

  Array.prototype.forEach.call(document.querySelectorAll('form#portrait-form input[type="file"][name="photos"]'), function (input) {
    var form = input.form;
    var zone = form.querySelector('.upload-zone') || input.parentElement;
    var status = document.createElement('p');
    status.className = 'upload-status';
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    zone.parentNode.insertBefore(status, zone.nextSibling);

    var state = { busy: null, error: false, bytes: 0, zone: zone };
    form.__vacaUpload = state;
    state.setStatus = function (msg, kind) {
      status.hidden = !msg;
      status.textContent = msg || '';
      status.className = 'upload-status' + (kind ? ' is-' + kind : '');
    };

    var sending = false;
    input.addEventListener('change', function () {
      if (sending) return;
      var files = Array.prototype.slice.call(input.files || []);
      state.error = false;
      var f = input.closest('.field'); if (f) { f.classList.remove('has-error'); var old = f.querySelector('.field-error-text'); if (old) old.remove(); }
      if (!files.length) { state.setStatus(''); state.bytes = 0; return; }

      var problem = null;
      if (files.length > MAX_FILES) problem = T.tooMany;
      files.some(function (x) {
        if (!isImage(x)) { problem = T.notImage(x.name); return true; }
        if (x.size > MAX_ORIGINAL) { problem = T.tooBig(x.name); return true; }
        return false;
      });
      if (problem) { state.error = true; state.setStatus(problem, 'error'); return; }

      var before = files.reduce(function (a, x) { return a + x.size; }, 0);
      state.setStatus(T.preparing(files.length), 'busy');
      state.busy = Promise.all(files.map(resize)).then(function (out) {
        var after = out.reduce(function (a, x) { return a + x.size; }, 0);
        if (canSwap && out.some(function (x, i) { return x !== files[i]; })) {
          var dt = new DataTransfer();
          out.forEach(function (x) { dt.items.add(x); });
          sending = true; input.files = dt.files; sending = false;   /* same <input name="photos"> — page reads it as before */
        } else { after = before; }
        state.bytes = after;
        state.busy = null;
        if (after > MAX_TOTAL) { state.error = true; state.setStatus(T.totalBig, 'error'); return; }
        state.setStatus(T.ready(out.length, mb(after), after < before * 0.9 ? mb(before) : null), 'ok');
      });
    });

    /* While the page's handler sends: reassuring status, cleared if it fails */
    var btn = form.querySelector('[type="submit"]');
    var slowTimer = null;
    state.onSend = function () {
      var n = input.files ? input.files.length : 0;
      if (!n) return;
      state.setStatus(T.uploading(mb(state.bytes || Array.prototype.reduce.call(input.files, function (a, x) { return a + x.size; }, 0))), 'busy');
      clearTimeout(slowTimer);
      slowTimer = setTimeout(function () { if (btn && btn.disabled) state.setStatus(T.slow, 'busy'); }, 15000);
      /* If the page's own checks stopped the send, drop the uploading note */
      setTimeout(function () {
        if (btn && !btn.disabled && !state.busy) {
          clearTimeout(slowTimer);
          state.setStatus(T.ready(n, mb(state.bytes || 0), null), 'ok');
        }
      }, 60);
    };
    if (btn && 'MutationObserver' in window) {
      new MutationObserver(function () {
        if (!btn.disabled && status.classList.contains('is-busy') && !state.busy) {
          clearTimeout(slowTimer);
          var n = input.files ? input.files.length : 0;
          state.setStatus(n ? T.ready(n, mb(state.bytes), null) : '', n ? 'ok' : '');
        }
      }).observe(btn, { attributes: true, attributeFilter: ['disabled'] });
    }
  });
})();
