/**
 * VaCa Marquetry -- Artwork Detail Loader v2
 *
 * Strategy (in priority order):
 *   1. Read inline <script id="artwork-data" type="application/json"> block
 *      embedded in the page -- works on file://, http://, everywhere, instantly.
 *   2. If no inline block found, attempt fetch() of artwork.json (HTTP only).
 *   3. If both fail, show a graceful fallback with email link.
 *
 * Handles missing gallery images silently (img.onerror -> hide container).
 * Builds real mailto: inquiry link from artwork title.
 */
(function () {
  'use strict';

  // WebP support detection
  var _canvas = document.createElement('canvas');
  var imgExt = (_canvas.getContext && _canvas.getContext('2d') &&
    _canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0)
    ? '.webp' : '.jpg';

  var slug = document.body.dataset.slug;
  if (!slug) return;

  /* Site root resolved from this script's own URL, so artwork pages work at
     /artworks/ (EN) and /it/opere/ (IT) alike */
  var SITE_ROOT = '../';
  try {
    var selfScript = document.querySelector('script[src*="assets/js/artwork-loader.js"]');
    if (selfScript) SITE_ROOT = new URL('../../', selfScript.src).href;
  } catch (e) {}
  function siteUrl(p) { return SITE_ROOT + p; }
  function artworkBase(s) { return siteUrl('assets/images/artworks/' + s + '/'); }

  /* UI language — Italian pages declare <html lang="it"> */
  var IS_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;
  var T = IS_IT ? {
    status: { available: 'Disponibile', sold: 'Venduta', not_for_sale: 'Collezione Privata', collection: 'Opera della Collezione', other: 'Informazioni' },
    titleSuffix: ' | Collezione VaCa Marquetry',
    metaDesc: function (d) { return d.title + ' — opera originale in intarsio di VaCa Marquetry. ' + d.pieceCount + ' tasselli tagliati a mano. ' + d.dimensions + '.'; },
    pieces: ' tasselli di impiallacciatura tagliati a mano',
    primaryAlt: ' — opera originale in intarsio di VaCa Marquetry',
    noteCollection: 'Quest’opera fa parte della serie VaCa Marquetry Collection — non in vendita.',
    notePrivate: 'Quest’opera fa parte della collezione privata dell’artista.',
    ctaLink: 'Scopri la Collezione →', ctaHref: 'it/collezione.html',
    mailSubject: function (t) { return 'Richiesta su ' + t; },
    mailBody: function (t) { return 'Buongiorno VaCa Marquetry,\n\nsono interessato/a a "' + t + '". Vorrei ricevere maggiori informazioni su prezzo, disponibilità e consegna.\n\nGrazie.'; },
    fallbackSubject: 'Richiesta su un’opera',
    fallbackBody: 'Buongiorno VaCa Marquetry,\n\nvorrei informazioni su un’opera.\n\nPagina: ',
    gallery: { 'cover.jpg': 'vista completa dell’opera', 'wall.jpg': 'esposta su una parete di galleria', 'lifestyle.jpg': 'in un ambiente d’interni', 'interior.jpg': 'in un ambiente d’interni', 'detail-01.jpg': 'dettaglio dell’impiallacciatura, primo piano', 'detail-02.jpg': 'dettaglio della venatura e della texture del legno', 'detail-03.jpg': 'dettaglio fine dell’impiallacciatura, macro', 'gallery.jpg': 'vista aggiuntiva', 'front.jpg': 'vista frontale completa', 'hospital.jpg': 'esposta in situ' },
    gallerySep: ' — ',
    visLabel: 'Visualizzazione',
    visAlt: ' (visualizzazione d’ambiente, non un’installazione reale)',
    staging: {
      eyebrow: 'In arrivo',
      tag: 'Immagine richiesta',
      purpose: 'Scopo', format: 'Formato consigliato', status: 'Stato', statusText: 'In attesa di fotografia',
      slots: [
        { key: 'macro', title: 'Macro della texture del legno', purpose: 'Mostrare venatura, linee di taglio e giunture dell’impiallacciatura', format: '1:1 · 1600×1600px' },
        { key: 'scale', title: 'Riferimento dimensionale', purpose: 'Far capire le dimensioni reali accanto a una persona o a un arredo', format: '3:2 · 1800×1200px' },
        { key: 'interior', title: 'Opera in un interno reale', purpose: 'Mostrare l’opera installata in un ambiente reale, con luce naturale', format: '3:2 · 2400×1600px' },
        { key: 'certificate', title: 'Certificato di autenticità', purpose: 'Mostrare il certificato firmato accanto all’opera', format: '4:5 · 1200×1500px', forSaleOnly: true }
      ]
    },
    defaultMsg: function (t) { return 'Sono interessato/a a "' + t + '". Potete confermarmi disponibilità e prezzo?'; },
    labelName: 'Il tuo nome', labelEmail: 'Indirizzo email', labelMessage: 'Messaggio',
    send: 'Invia la richiesta', sending: 'Invio in corso…',
    microcopy: 'Rispondiamo entro 48 ore &middot; I tuoi dati non vengono mai venduti',
    privacyPre: 'Inviando il modulo prendi atto che i tuoi dati personali saranno trattati secondo la nostra ', privacyLink: 'Informativa sulla privacy', privacyHref: 'it/privacy.html',
    successTitle: 'Abbiamo ricevuto la tua richiesta.', successText: 'Ti contatteremo entro 48 ore.',
    errName: 'Inserisci il tuo nome.', errEmail: 'Inserisci il tuo indirizzo email.', errEmailValid: 'Inserisci un indirizzo email valido.',
    errSend: 'Si è verificato un errore. Riprova oppure scrivi a vacamarquetrysales@gmail.com'
  } : {
    status: { available: 'Available', sold: 'Sold', not_for_sale: 'Private Collection', collection: 'Collection Piece', other: 'Enquire' },
    titleSuffix: ' | VaCa Marquetry Collection',
    metaDesc: function (d) { return d.title + ' -- an original wood veneer marquetry artwork by VaCa Marquetry. ' + d.pieceCount + ' hand-cut pieces. ' + d.dimensions + '.'; },
    pieces: ' hand-cut veneer pieces',
    primaryAlt: ' -- original marquetry by VaCa Marquetry',
    noteCollection: 'This work is part of the VaCa Marquetry Collection series — not for sale.',
    notePrivate: 'This work is held in the artist’s private collection.',
    ctaLink: 'View Private Collection →', ctaHref: 'not-for-sale.html',
    mailSubject: function (t) { return 'Inquiry about ' + t; },
    mailBody: function (t) { return 'Hello VaCa Marquetry,\n\nI am interested in "' + t + '". Please send me more information about price, availability, and delivery.\n\nThank you.'; },
    fallbackSubject: 'Artwork Enquiry',
    fallbackBody: 'Hello VaCa Marquetry,\n\nI would like to enquire about an artwork.\n\nPage: ',
    gallery: { 'cover.jpg': 'Full artwork view', 'wall.jpg': 'Displayed on a gallery wall', 'lifestyle.jpg': 'In an interior setting', 'interior.jpg': 'In an interior setting', 'detail-01.jpg': 'Veneer detail -- close up', 'detail-02.jpg': 'Wood grain and texture detail', 'detail-03.jpg': 'Fine veneer detail — extreme close up', 'gallery.jpg': 'Additional view', 'front.jpg': 'Full frontal view', 'hospital.jpg': 'Displayed in situ' },
    gallerySep: ' -- ',
    visLabel: 'Visualisation',
    visAlt: ' (room visualisation, not a real installation)',
    staging: {
      eyebrow: 'Coming Soon',
      tag: 'Image required',
      purpose: 'Purpose', format: 'Recommended', status: 'Status', statusText: 'Awaiting photography',
      slots: [
        { key: 'macro', title: 'Macro texture of the wood', purpose: 'Show the veneer grain, cut lines and seams up close', format: '1:1 · 1600×1600px' },
        { key: 'scale', title: 'Size reference', purpose: 'Show the real scale beside a person or furniture', format: '3:2 · 1800×1200px' },
        { key: 'interior', title: 'Installed in a real interior', purpose: 'Show the work in a real room, in natural light', format: '3:2 · 2400×1600px' },
        { key: 'certificate', title: 'Certificate of Authenticity', purpose: 'Show the signed certificate beside this work', format: '4:5 · 1200×1500px', forSaleOnly: true }
      ]
    },
    defaultMsg: function (t) { return 'I\'m interested in "' + t + '". Could you confirm current availability and pricing?'; },
    labelName: 'Your Name', labelEmail: 'Email Address', labelMessage: 'Message',
    send: 'Send Enquiry', sending: 'Sending…',
    microcopy: 'We respond within 48 hours &middot; Your details are never sold',
    privacyPre: 'By submitting this form, you acknowledge that your personal data will be processed according to our ', privacyLink: 'Privacy Policy', privacyHref: 'privacy.html',
    successTitle: 'Your enquiry has been received.', successText: 'We\'ll be in touch within 48 hours.',
    errName: 'Please enter your name.', errEmail: 'Please enter your email address.', errEmailValid: 'Please enter a valid email address.',
    errSend: 'Something went wrong. Please try again or email vacamarquetrysales@gmail.com'
  };

  // 1. Try inline data block first (always works, no fetch needed)
  var inlineEl = document.getElementById('artwork-data');
  if (inlineEl) {
    try {
      var data = JSON.parse(inlineEl.textContent);
      populatePage(data, slug);
      return;
    } catch (e) {
      console.error('[artwork-loader] Inline artwork-data parse error:', e);
    }
  }

  // 2. Fallback: fetch artwork.json (requires HTTP server)
  if (typeof fetch === 'undefined') {
    console.warn('[artwork-loader] fetch() not available and no inline data found.');
    showFallback();
    return;
  }

  var jsonUrl = artworkBase(slug) + 'artwork.json';
  console.log('[artwork-loader] Loading', jsonUrl);

  fetch(jsonUrl)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' fetching ' + jsonUrl);
      return r.json();
    })
    .then(function (data) {
      populatePage(data, slug);
    })
    .catch(function (err) {
      console.error('[artwork-loader] Could not load artwork data:', err);
      console.error('[artwork-loader] If opening via file://, use: python -m http.server 8080');
      showFallback();
    });

  /* Populate all page fields from data object */
  function populatePage(data, slug) {
    console.log('[artwork-loader] ARTWORK DATA', data);
    console.log('[artwork-loader] GALLERY ARRAY', data.gallery);
    document.title = data.title + T.titleSuffix;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', T.metaDesc(data));
    }

    var statusText = T.status[data.status] || T.status.other;
    set('aw-availability', statusText);
    var badge = document.getElementById('aw-availability');
    if (badge) badge.className = 'artwork-availability ' + (data.status || 'available');

    set('aw-title', data.title);
    set('aw-story', data.story);
    set('aw-category',   data.category);
    set('aw-materials',  data.materials);
    set('aw-piececount', data.pieceCount + T.pieces);
    set('aw-dimensions', data.dimensions);
    set('aw-weight',     data.weight);
    set('aw-year',       data.year);
    set('aw-finish',     data.finish);
    set('aw-framed',     data.framed);
    set('aw-price', data.price);

    var primaryImg = document.getElementById('aw-primary-img');
    if (primaryImg) {
      primaryImg.alt = data.title + T.primaryAlt;
      primaryImg.onerror = function () {
        console.warn('[artwork-loader] cover.jpg not found for', slug);
      };
      /* Visual audit 2026-09: the studio photo (cover) is the first view;
         rendered room images follow in the gallery, labelled. */
      primaryImg.src = artworkBase(slug) + 'cover' + imgExt;
      /* Viewer (Phase 2.2.1): the main image opens the whole artwork set —
         it joins the gallery group (first in DOM order) instead of opening solo */
      primaryImg.removeAttribute('data-lb-solo');
      primaryImg.setAttribute('data-lb-group', slug + '-gallery');
    }

    var btn = document.getElementById('aw-inquire');
    if (btn) {
      if (data.status === 'not_for_sale' || data.status === 'collection') {
        // Hide CTA entirely and replace with a private collection / brand-collection notice
        var ctaBlock = btn.closest('.artwork-cta');
        if (ctaBlock) {
          var ctaNote = data.status === 'collection' ? T.noteCollection : T.notePrivate;
          ctaBlock.innerHTML =
            '<p style="font-family:var(--font-editorial);font-style:italic;font-size:1rem;' +
            'color:var(--brass-dark);margin:0 0 var(--space-sm);">' +
            ctaNote + '</p>' +
            '<a href="' + siteUrl(T.ctaHref) + '" class="btn btn-ghost" style="margin-top:4px;">' +
            T.ctaLink + '</a>';
        }
      } else {
        var subject = encodeURIComponent(T.mailSubject(data.title));
        var mailBody = encodeURIComponent(T.mailBody(data.title));
        btn.href = 'mailto:vacamarquetrysales@gmail.com?subject=' + subject + '&body=' + mailBody;

        var cta = btn.closest('.artwork-cta');
        if (cta) {
          buildInquiryForm(cta, data, slug);
        }
      }
    }

    buildGallery(data, slug);
    buildStagingSlots(data);
  }

  /* Build gallery strip */
  function buildGallery(data, slug) {
    console.log('[artwork-loader] buildGallery — container:', document.getElementById('aw-gallery'), 'gallery:', data.gallery);
    var container = document.getElementById('aw-gallery');
    if (!container || !data.gallery || !data.gallery.length) return;

    var labels = T.gallery;
    var vis = data.visualisations || [];

    /* cover.jpg is already the primary image. Real photos first, then
       rendered room visualisations (tagged), keeping JSON order within each. */
    var files = data.gallery.filter(function (f) { return f !== 'cover.jpg'; });
    files = files.filter(function (f) { return vis.indexOf(f) === -1; })
      .concat(files.filter(function (f) { return vis.indexOf(f) !== -1; }));

    files.forEach(function (file) {
      var isVis = vis.indexOf(file) !== -1;
      var thumb = document.createElement('div');
      thumb.className = 'artwork-gallery-thumb' + (isVis ? ' is-visualisation' : '');

      var img = document.createElement('img');
      img.alt     = data.title + T.gallerySep + (labels[file] || file) + (isVis ? T.visAlt : '');
      img.loading = 'lazy';
      img.onerror = function () {
        console.warn('[artwork-loader] Gallery image missing:', file);
        thumb.style.display = 'none';
      };
      /* Wire into museum viewer — data-lb-group set before main.js scans */
      img.dataset.lbGroup = slug + '-gallery';
      var base = artworkBase(slug);
      var stem = file.replace(/\.jpe?g$/i, '');
      img.src = base + (imgExt === '.webp' ? stem + '.webp' : file);
      /* Responsive thumbs: the gallery renders at 130–180px, so the small
         renditions are more than enough. WebP-only (no responsive JPG exists);
         non-WebP browsers keep the single full-size src above. */
      if (imgExt === '.webp') {
        img.srcset = base + stem + '-480.webp 480w, ' + base + stem + '-800.webp 800w';
        img.sizes  = '180px';
      }

      thumb.appendChild(img);
      if (isVis) {
        var tag = document.createElement('span');
        tag.className = 'vis-label';
        tag.textContent = T.visLabel;
        thumb.appendChild(tag);
      }
      container.appendChild(thumb);
    });
  }

  /* Staging placeholders for photography still to be shot (visual audit 2026-09) */
  function buildStagingSlots(data) {
    var gallery = document.getElementById('aw-gallery');
    if (!gallery || document.getElementById('aw-staging')) return;
    var forSale = !(data.status === 'not_for_sale' || data.status === 'collection');
    var S = T.staging;
    var html = '<span class="eyebrow" style="display:block;margin:var(--space-lg) 0 var(--space-md);">' + S.eyebrow + '</span>' +
      '<div class="staging-grid">';
    S.slots.forEach(function (slot) {
      if (slot.forSaleOnly && !forSale) return;
      html += '<div class="img-required" role="img" data-staging="artwork-' + slot.key + '" aria-label="' + S.tag + ': ' + slot.title + '">' +
        '<span class="img-required__tag">' + S.tag + '</span>' +
        '<strong class="img-required__title">' + slot.title + '</strong>' +
        '<dl><dt>' + S.purpose + '</dt><dd>' + slot.purpose + '</dd>' +
        '<dt>' + S.format + '</dt><dd>' + slot.format + '</dd>' +
        '<dt>' + S.status + '</dt><dd>' + S.statusText + '</dd></dl>' +
      '</div>';
    });
    html += '</div>';
    var wrap = document.createElement('div');
    wrap.id = 'aw-staging';
    wrap.innerHTML = html;
    gallery.parentNode.insertBefore(wrap, gallery.nextSibling);
  }

  /* Inline artwork inquiry form */
  function buildInquiryForm(ctaEl, data, slug) {
    var ARTWORK_WEBHOOK_URL = 'https://hook.eu2.make.com/0fw3v3txv385q8e4olynxkjypujvjs3p';

    var wrap = document.createElement('div');
    wrap.className = 'artwork-inquiry-wrap';
    wrap.id = 'aw-inquiry-wrap';

    var defaultMsg = T.defaultMsg(data.title);

    /* Privacy policy URL resolved from this script's location (site root) */
    var privacyHref = siteUrl(T.privacyHref);

    wrap.innerHTML =
      '<div class="artwork-inquiry-form" id="ai-form-inner">' +
        '<div class="field">' +
          '<label for="ai-name">' + T.labelName + '</label>' +
          '<input type="text" id="ai-name" name="name" autocomplete="name" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="ai-email">' + T.labelEmail + '</label>' +
          '<input type="email" id="ai-email" name="email" autocomplete="email" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="ai-message">' + T.labelMessage + '</label>' +
          '<textarea id="ai-message" name="message" rows="3"></textarea>' +
        '</div>' +
        '<button type="button" id="ai-submit" class="btn btn-primary" style="width:100%;">' + T.send + '</button>' +
        '<p class="form-microcopy">' + T.microcopy + '</p>' +
        '<p class="form-privacy">' + T.privacyPre + '<a href="' + privacyHref + '">' + T.privacyLink + '</a>.</p>' +
      '</div>' +
      '<div class="artwork-inquiry-success" id="ai-success" style="display:none;">' +
        '<p style="color:var(--brass);font-size:1.3rem;margin:0 0 8px;">&#10022;</p>' +
        '<p style="font-family:var(--font-editorial);font-size:1.05rem;color:var(--walnut);margin:0 0 6px;">' + T.successTitle + '</p>' +
        '<p style="opacity:.65;font-size:.85rem;margin:0;">' + T.successText + '</p>' +
      '</div>';

    ctaEl.parentNode.insertBefore(wrap, ctaEl.nextSibling);

    var msgEl = document.getElementById('ai-message');
    if (msgEl) msgEl.value = defaultMsg;

    var inquireBtn = document.getElementById('aw-inquire');
    if (inquireBtn) {
      inquireBtn.addEventListener('click', function (e) {
        e.preventDefault();
        wrap.classList.add('open');
        wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        var nameInput = document.getElementById('ai-name');
        if (nameInput) nameInput.focus();
      });
    }

    var submitBtn = document.getElementById('ai-submit');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
      var nameInput  = document.getElementById('ai-name');
      var emailInput = document.getElementById('ai-email');
      var msgInput   = document.getElementById('ai-message');

      wrap.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
      wrap.querySelectorAll('.field-error-text').forEach(function (el) { el.remove(); });

      var valid = true;

      if (!nameInput.value.trim()) {
        aiFieldError(nameInput, T.errName);
        valid = false;
      }
      if (!emailInput.value.trim()) {
        aiFieldError(emailInput, T.errEmail);
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        aiFieldError(emailInput, T.errEmailValid);
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = T.sending;
      submitBtn.style.opacity = '0.6';

      var payloadObj = {
        name:          nameInput.value.trim(),
        email:         emailInput.value.trim(),
        message:       msgInput ? msgInput.value.trim() : defaultMsg,
        artwork_title: data.title,
        artwork_slug:  slug,
        artwork_url:   window.location.href,
        source_url:    window.location.href
      };
      /* Phase 2 — attach marketing attribution (hidden payload only) */
      var attribution = (window.vacaAttributionPayload && window.vacaAttributionPayload()) || {};
      for (var ak in attribution) {
        if (Object.prototype.hasOwnProperty.call(attribution, ak)) payloadObj[ak] = attribution[ak];
      }
      var payload = JSON.stringify(payloadObj);

      fetch(ARTWORK_WEBHOOK_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var inner   = document.getElementById('ai-form-inner');
          var success = document.getElementById('ai-success');
          if (inner)   inner.style.display   = 'none';
          if (success) success.style.display = 'block';
          var convParams = { event_category: 'form', event_label: 'artwork_inquiry', artwork_title: data.title, artwork_slug: slug };
          if (window.vacaTrackConversion) { window.vacaTrackConversion('generate_lead', convParams); }
          else if (typeof gtag === 'function') { gtag('event', 'generate_lead', convParams); }
        })
        .catch(function (err) {
          console.error('[artwork-inquiry]', err);
          submitBtn.disabled = false;
          submitBtn.textContent = T.send;
          submitBtn.style.opacity = '';
          var existingErr = wrap.querySelector('.form-error-msg');
          if (existingErr) existingErr.remove();
          var errP = document.createElement('p');
          errP.className = 'form-error-msg';
          errP.textContent = T.errSend;
          submitBtn.insertAdjacentElement('afterend', errP);
        });
    });

    function aiFieldError(input, msg) {
      var field = input.closest ? input.closest('.field') : input.parentElement;
      if (!field) return;
      field.classList.add('has-error');
      var p = document.createElement('p');
      p.className = 'field-error-text';
      p.textContent = msg;
      field.appendChild(p);
      input.focus();
    }
  }

  /* Graceful fallback — shown when both inline data and fetch() fail */
  function showFallback() {
    // Ensure the inquiry button still works with a direct mailto link
    var btn = document.getElementById('aw-inquire');
    if (btn) {
      btn.href = 'mailto:vacamarquetrysales@gmail.com' +
                 '?subject=' + encodeURIComponent(T.fallbackSubject) +
                 '&body='    + encodeURIComponent(T.fallbackBody + window.location.href);
    }
    // Show a minimal notice where the primary image would be
    var primaryWrap = document.getElementById('aw-primary-img');
    if (primaryWrap) {
      primaryWrap.style.opacity = '0.35';
    }
    console.warn('[artwork-loader] Fallback mode — no data available for this page.');
  }

  /* Helper: safely set textContent of element by id */
  function set(id, value) {
    var el = document.getElementById(id);
    if (el && value !== undefined && value !== null && value !== '') {
      el.textContent = value;
    }
  }

})();
