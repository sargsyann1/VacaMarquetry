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

  var jsonUrl = '../assets/images/' + slug + '/artwork.json';
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
    document.title = data.title + ' | VaCa Marquetry Collection';
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content',
        data.title + ' -- an original wood veneer marquetry artwork by VaCa Marquetry. ' +
        data.pieceCount + ' hand-cut pieces. ' + data.dimensions + '.');
    }

    var statusText = data.status === 'available' ? 'Available' :
                     data.status === 'sold'      ? 'Sold'      : 'Enquire';
    set('aw-availability', statusText);
    var badge = document.getElementById('aw-availability');
    if (badge) badge.className = 'artwork-availability ' + (data.status || 'available');

    set('aw-title', data.title);
    set('aw-story', data.story);
    set('aw-category',   data.category);
    set('aw-materials',  data.materials);
    set('aw-piececount', data.pieceCount + ' hand-cut veneer pieces');
    set('aw-dimensions', data.dimensions);
    set('aw-weight',     data.weight);
    set('aw-year',       data.year);
    set('aw-finish',     data.finish);
    set('aw-framed',     data.framed);
    set('aw-price', data.price);

    var primaryImg = document.getElementById('aw-primary-img');
    if (primaryImg) {
      primaryImg.alt = data.title + ' -- original marquetry by VaCa Marquetry';
      primaryImg.onerror = function () {
        console.warn('[artwork-loader] hero.jpg not found for', slug);
      };
      primaryImg.src = '../assets/images/' + slug + '/hero' + imgExt;
    }

    var btn = document.getElementById('aw-inquire');
    if (btn) {
      var subject = encodeURIComponent('Inquiry about ' + data.title);
      var mailBody = encodeURIComponent(
        'Hello VaCa Marquetry,\n\nI am interested in "' + data.title + '". ' +
        'Please send me more information about price, availability, and delivery.\n\nThank you.'
      );
      btn.href = 'mailto:vacamarquetry@vacamarquetry.shop?subject=' + subject + '&body=' + mailBody;

      var cta = btn.closest('.artwork-cta');
      if (cta) {
        buildInquiryForm(cta, data, slug);
      }
    }

    buildGallery(data, slug);
  }

  /* Build gallery strip */
  function buildGallery(data, slug) {
    var container = document.getElementById('aw-gallery');
    if (!container || !data.gallery || !data.gallery.length) return;

    var labels = {
      'cover.jpg':     'Full artwork view',
      'wall.jpg':      'Displayed on a gallery wall',
      'lifestyle.jpg': 'In an interior setting',
      'detail-01.jpg': 'Veneer detail -- close up',
      'detail-02.jpg': 'Wood grain and texture detail',
      'gallery.jpg':   'Additional view'
    };

    data.gallery.forEach(function (file) {
      var thumb = document.createElement('div');
      thumb.className = 'artwork-gallery-thumb';

      var img = document.createElement('img');
      img.alt     = data.title + ' -- ' + (labels[file] || file);
      img.loading = 'lazy';
      img.onerror = function () {
        console.warn('[artwork-loader] Gallery image missing:', file);
        thumb.style.display = 'none';
      };
      img.src = '../assets/images/' + slug + '/' +
        (imgExt === '.webp' ? file.replace(/\.jpg$/i, '.webp') : file);

      thumb.appendChild(img);
      container.appendChild(thumb);
    });
  }

  /* Inline artwork inquiry form */
  function buildInquiryForm(ctaEl, data, slug) {
    var ARTWORK_WEBHOOK_URL = 'https://hook.eu2.make.com/jute9hiso8mnsoyxtls58zhvqedbfqej';

    var wrap = document.createElement('div');
    wrap.className = 'artwork-inquiry-wrap';
    wrap.id = 'aw-inquiry-wrap';

    var defaultMsg = 'I\'m interested in "' + data.title +
                     '". Could you confirm current availability and pricing?';

    wrap.innerHTML =
      '<div class="artwork-inquiry-form" id="ai-form-inner">' +
        '<div class="field">' +
          '<label for="ai-name">Your Name</label>' +
          '<input type="text" id="ai-name" name="name" autocomplete="name">' +
        '</div>' +
        '<div class="field">' +
          '<label for="ai-email">Email Address</label>' +
          '<input type="email" id="ai-email" name="email" autocomplete="email">' +
        '</div>' +
        '<div class="field">' +
          '<label for="ai-message">Message</label>' +
          '<textarea id="ai-message" name="message" rows="3"></textarea>' +
        '</div>' +
        '<button type="button" id="ai-submit" class="btn btn-primary" style="width:100%;">Send Enquiry</button>' +
        '<p class="form-microcopy">We respond within 48 hours &middot; Your details are never shared</p>' +
      '</div>' +
      '<div class="artwork-inquiry-success" id="ai-success" style="display:none;">' +
        '<p style="color:var(--brass);font-size:1.3rem;margin:0 0 8px;">&#10022;</p>' +
        '<p style="font-family:var(--font-editorial);font-size:1.05rem;color:var(--walnut);margin:0 0 6px;">Your enquiry has been received.</p>' +
        '<p style="opacity:.65;font-size:.85rem;margin:0;">We\'ll be in touch within 48 hours.</p>' +
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
        aiFieldError(nameInput, 'Please enter your name.');
        valid = false;
      }
      if (!emailInput.value.trim()) {
        aiFieldError(emailInput, 'Please enter your email address.');
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) {
        aiFieldError(emailInput, 'Please enter a valid email address.');
        valid = false;
      }
      if (!valid) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      submitBtn.style.opacity = '0.6';

      var payload = JSON.stringify({
        name:          nameInput.value.trim(),
        email:         emailInput.value.trim(),
        message:       msgInput ? msgInput.value.trim() : defaultMsg,
        artwork_title: data.title,
        artwork_slug:  slug,
        artwork_url:   window.location.href,
        source_url:    window.location.href
      });

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
          if (typeof gtag === 'function') { gtag('event', 'generate_lead', { event_category: 'form', event_label: 'artwork_inquiry', artwork_title: data.title, artwork_slug: slug }); }
        })
        .catch(function (err) {
          console.error('[artwork-inquiry]', err);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Enquiry';
          submitBtn.style.opacity = '';
          var existingErr = wrap.querySelector('.form-error-msg');
          if (existingErr) existingErr.remove();
          var errP = document.createElement('p');
          errP.className = 'form-error-msg';
          errP.textContent = 'Something went wrong. Please try again or email vacamarquetry@vacamarquetry.shop';
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

  /* Graceful fallback when all data sources fail */
  function showFallback() {
    var split = document.querySelector('.artwork-split');
    if (!split) return;
    split.innerHTML =
      '<div style="padding: var(--space-xl) 0; text-align: center; grid-column: 1 / -1;">' +
      '<p style="opacity:0.6; margin-bottom:var(--space-md);">' +
      'Artwork details could not be loaded. ' +
      'Please contact us directly for pricing and availability.' +
      '</p>' +
      '<a href="mailto:vacamarquetry@vacamarquetry.shop" class="btn btn-primary">' +
      'Contact Us by Email' +
      '</a>' +
      '</div>';
  }

  /* Utility */
  function set(id, value) {
    var el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }

})();
