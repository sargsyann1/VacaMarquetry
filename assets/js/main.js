// VaCa Marquetry V2 — shared interactions

/* ============================================================
   1. CONSENT MODE RESTORE
   If user already accepted in a previous session, upgrade GA4
   analytics_storage before any event fires on this page.
   ============================================================ */
(function () {
  try {
    if (localStorage.getItem('vaca_cookie_consent') === 'accepted') {
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage:        'granted'
        });
      }
    }
  } catch (e) {}
})();


/* ============================================================
   2. COOKIE CONSENT BANNER
   - Shown only on first visit (no localStorage key yet)
   - Accept → grants GA4 analytics_storage
   - Decline → remains denied, banner dismissed
   - Luxury minimal design via .cookie-banner CSS class
   - Mobile: body.has-cookie-banner pushes WA button up via CSS
   ============================================================ */
(function () {
  var KEY = 'vaca_cookie_consent';

  // Check prior decision — if localStorage throws (iOS Private Browsing),
  // do NOT return: still show the banner, just can't persist the choice.
  var alreadyDecided = false;
  try {
    if (localStorage.getItem(KEY)) alreadyDecided = true;
  } catch (e) { /* storage unavailable — show banner anyway */ }

  if (alreadyDecided) return;

  function removeBanner() {
    document.body.classList.remove('has-cookie-banner');
    document.body.style.removeProperty('--cookie-banner-h');
    banner.style.opacity   = '0';
    banner.style.transform = 'translateY(16px)';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 320);
  }

  function applyConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}

    if (typeof gtag === 'function') {
      if (value === 'accepted') {
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage:        'granted'
        });
        gtag('event', 'cookie_consent_accepted');
      } else {
        gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage:        'denied'
        });
      }
    }

    removeBanner();
  }

  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Cookie preference');
  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-text">' +
        '<p class="cookie-title">This site uses cookies</p>' +
        '<p class="cookie-body">' +
          'We use analytics to understand how visitors engage with the work &mdash; ' +
          'no advertising, no third-party tracking. ' +
          '<a href="contact.html" class="cookie-link">Privacy policy</a>' +
        '</p>' +
      '</div>' +
      '<div class="cookie-actions">' +
        '<button class="cookie-btn-accept" aria-label="Accept analytics cookies">Accept</button>' +
        '<button class="cookie-btn-decline" aria-label="Decline analytics cookies">Decline</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(banner);

  // Animate in after paint + measure height to push WA button up on mobile
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      // Measure rendered height so CSS can push the WA button above the banner
      var h = banner.offsetHeight;
      if (h > 0) {
        document.body.style.setProperty('--cookie-banner-h', h + 'px');
      }
      document.body.classList.add('has-cookie-banner');

      banner.style.opacity   = '1';
      banner.style.transform = 'translateY(0)';
    });
  });

  banner.querySelector('.cookie-btn-accept').addEventListener('click', function () {
    applyConsent('accepted');
  });
  banner.querySelector('.cookie-btn-decline').addEventListener('click', function () {
    applyConsent('declined');
  });
})();


/* ============================================================
   3. WHATSAPP FLOATING BUTTON
   - Injected globally (no per-page HTML needed)
   - Luxury minimal: bone bg, walnut border, no green block
   - Click tracked via gtag event (if consent granted)
   - source label: floating_button
   ============================================================ */
(function () {
  var PHONE   = '393517571986';
  var MESSAGE = encodeURIComponent(
    'Hello VaCa Marquetry, I would like to inquire about an artwork or Private Collection piece.'
  );
  var HREF = 'https://wa.me/' + PHONE + '?text=' + MESSAGE;

  var btn = document.createElement('a');
  btn.href      = HREF;
  btn.target    = '_blank';
  btn.rel       = 'noopener noreferrer';
  btn.className = 'wa-float';
  btn.setAttribute('aria-label', 'Contact VaCa Marquetry on WhatsApp');

  // WhatsApp logo SVG — two-path version (bubble + phone)
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"' +
    ' fill="currentColor" aria-hidden="true">' +
    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15' +
    '-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475' +
    '-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52' +
    '.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207' +
    '-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372' +
    '-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2' +
    ' 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719' +
    ' 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
    '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.885' +
    ' a.5.5 0 0 0 .606.617l6.197-1.624A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12' +
    ' S18.627 0 12 0zm0 21.818a9.827 9.827 0 0 1-5.028-1.381l-.36-.214-3.732.978.995-3.638' +
    '-.235-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57' +
    ' 21.818 12 17.43 21.818 12 21.818z"/>' +
    '</svg>' +
    '<span class="wa-label">WhatsApp</span>';

  // Smart click: personalise message with last-viewed artwork + fire GA4 event
  btn.addEventListener('click', function () {
    var artwork = '', score = 1, interactionType = 'WhatsApp Click';
    try {
      artwork          = sessionStorage.getItem('vaca_last_artwork') || '';
      score            = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
      // Mark WA click as highest-intent interaction
      sessionStorage.setItem('vaca_intent_score',      '3');
      sessionStorage.setItem('vaca_interaction_type',  'WhatsApp Click');
      sessionStorage.setItem('vaca_lead_source',       'WhatsApp');
    } catch (e) {}

    var msg = artwork
      ? 'Hello VaCa Marquetry, I’m interested in the artwork “' + artwork + '”. Could you share more details?'
      : 'Hello VaCa Marquetry, I would like to inquire about an artwork or Private Collection piece.';
    this.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);

    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        source:           'floating_button',
        phone:            '+393517571986',
        page:             window.location.pathname,
        artwork_context:  artwork || '(none)',
        intent_score:     score
      });
    }
  });

  document.body.appendChild(btn);
})();


/* ============================================================
   4. DOM-READY INTERACTIONS
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* — Mobile nav toggle — */
  var toggle   = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // Close nav on outside click
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* — FAQ accordion — */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-question');
    if (!q) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (open) {
        if (open !== item) open.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  /* — Upload zone file count — */
  var uploadInput = document.querySelector('#portrait-photos');
  var uploadZone  = document.querySelector('.upload-zone');
  if (uploadInput && uploadZone) {
    var defaultText = uploadZone.querySelector('.upload-zone-text').textContent;
    uploadInput.addEventListener('change', function () {
      var count = uploadInput.files.length;
      uploadZone.querySelector('.upload-zone-text').textContent =
        count > 0 ? count + ' file' + (count > 1 ? 's' : '') + ' selected' : defaultText;
    });
  }

  /* ============================================================
     5. MUSEUM VIEWER
     Centered floating frame. Backdrop-blur gallery atmosphere.
     Gold mat border. Zoom constrained inside frame.
     Arrows outside frame. Auto-wired: no per-page HTML changes.
     ============================================================ */
  (function () {

    /* ── 5a. Gallery container selectors ──────────────────────── */
    // .exh-photo-set MUST come before .exh-grid: parent grouping runs
    // first; dedup in registerGroup prevents double-registration.
    var GALLERY_SELECTORS = [
      '.exh-photo-set',
      '.exh-grid',
      '.exh-grid-wide',
      '.process-grid',
      '.atmosphere-grid',
      '.packaging-pair',
      '.awards-wrap',
      '.exhibition-photo-grid',
    ];

    function isInsideLink(el) {
      var node = el.parentElement;
      while (node && node !== document.body) {
        if (node.tagName === 'A') return true;
        node = node.parentElement;
      }
      return false;
    }

    var groups = [];

    function registerGroup(imgArray) {
      imgArray = imgArray.filter(function (img) {
        return !img.classList.contains('lb-trigger') && !isInsideLink(img) && img.src;
      });
      if (!imgArray.length) return -1;
      var idx = groups.length;
      groups.push({ images: imgArray });
      imgArray.forEach(function (img, i) {
        img.dataset.lbGroup = idx;
        img.dataset.lbIdx   = i;
        img.classList.add('lb-trigger');
      });
      return idx;
    }

    GALLERY_SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (container) {
        registerGroup(
          Array.prototype.slice.call(container.querySelectorAll('img'))
            .filter(function (img) { return img.src; })
        );
      });
    });

    document.querySelectorAll('.nfs-grid, .nfs-grid-wide').forEach(function (grid) {
      registerGroup(
        Array.prototype.slice.call(grid.querySelectorAll('img'))
          .filter(function (img) { return img.src; })
      );
    });

    var heroFrame  = document.querySelector('.artwork-primary-frame');
    var artGallery = document.querySelector('.artwork-gallery');
    if (heroFrame || artGallery) {
      var heroImgs    = heroFrame  ? Array.prototype.slice.call(heroFrame.querySelectorAll('img'))  : [];
      var galleryImgs = artGallery ? Array.prototype.slice.call(artGallery.querySelectorAll('img')) : [];
      registerGroup(
        heroImgs.concat(galleryImgs).filter(function (img) { return img.src; })
      );
    }

    if (!groups.length) return;

    /* ── 5b. Build museum viewer DOM ─────────────────────────── */
    var lb = document.createElement('div');
    lb.id        = 'vaca-lb';
    lb.className = 'vaca-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Artwork viewer');
    lb.setAttribute('aria-hidden', 'true');

    var SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17"' +
      ' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    var SVG_PREV = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="19" height="19"' +
      ' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
      '<polyline points="15 18 9 12 15 6"/></svg>';
    var SVG_NEXT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="19" height="19"' +
      ' fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
      '<polyline points="9 18 15 12 9 6"/></svg>';
    var SVG_SPIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34"' +
      ' fill="none" stroke="currentColor" stroke-width="1.3">' +
      '<circle cx="12" cy="12" r="9" stroke-opacity="0.18"/>' +
      '<path d="M12 3 a9 9 0 0 1 9 9" stroke-linecap="round"/></svg>';

    lb.innerHTML =
      '<button class="lb-close" aria-label="Close viewer">' + SVG_CLOSE + '</button>' +
      '<div class="lb-viewer">' +
        '<button class="lb-arrow lb-prev" aria-label="Previous artwork">' + SVG_PREV + '</button>' +
        '<div class="lb-frame-wrap">' +
          '<div class="lb-museum-frame">' +
            '<div class="lb-img-container">' +
              '<div class="lb-loader">' + SVG_SPIN + '</div>' +
              '<img class="lb-img" alt="" draggable="false">' +
            '</div>' +
          '</div>' +
          '<div class="lb-frame-footer">' +
            '<p class="lb-caption"></p>' +
            '<span class="lb-counter"></span>' +
          '</div>' +
        '</div>' +
        '<button class="lb-arrow lb-next" aria-label="Next artwork">' + SVG_NEXT + '</button>' +
      '</div>';

    document.body.appendChild(lb);

    var lbClose        = lb.querySelector('.lb-close');
    var lbPrev         = lb.querySelector('.lb-prev');
    var lbNext         = lb.querySelector('.lb-next');
    var lbMuseumFrame  = lb.querySelector('.lb-museum-frame');
    var lbImgContainer = lb.querySelector('.lb-img-container');
    var lbLoader       = lb.querySelector('.lb-loader');
    var lbImg          = lb.querySelector('.lb-img');
    var lbCaption      = lb.querySelector('.lb-caption');
    var lbCounter      = lb.querySelector('.lb-counter');

    var curGroup = -1, curIdx = -1, lbOpen = false;

    /* ── 5c. Open / Close / Load ─────────────────────────────── */
    function lbOpenAt(groupIdx, imgIdx) {
      curGroup = groupIdx; curIdx = imgIdx; lbOpen = true;
      document.body.classList.add('lb-open');
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      lbClose.focus();
      resetTransform(false);
      loadSlide(groupIdx, imgIdx);

      // ── Lead intent: artwork zoom = high-intent signal ─────────
      try {
        var artAlt = groups[groupIdx].images[imgIdx].alt || '';
        if (artAlt) sessionStorage.setItem('vaca_last_artwork', artAlt);
        sessionStorage.setItem('vaca_interaction_type', 'Artwork Zoom');
        var prevScore = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
        if (prevScore < 3) sessionStorage.setItem('vaca_intent_score', '3');
      } catch (e) {}
    }

    function lbCloseViewer() {
      lbOpen = false;
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      resetTransform(false);
      // Small delay so close animation plays before blanking image
      setTimeout(function () { if (!lbOpen) { lbImg.src = ''; lbImg.classList.remove('is-loaded'); } }, 300);
    }

    function loadSlide(gIdx, iIdx) {
      var srcImg = groups[gIdx].images[iIdx];
      // Support optional data-lb-src for hi-res version; fall back to src
      var hiResSrc = srcImg.dataset.lbSrc || srcImg.src;
      var cap      = srcImg.alt || '';
      var total    = groups[gIdx].images.length;
      var multi    = total > 1;

      resetTransform(false);
      lbImg.classList.remove('is-loaded');
      lbLoader.classList.add('is-visible');
      lbCaption.textContent = cap;
      lbCounter.textContent = multi ? (iIdx + 1) + ' / ' + total : '';

      lbPrev.classList.toggle('is-hidden', !(multi && iIdx > 0));
      lbNext.classList.toggle('is-hidden', !(multi && iIdx < total - 1));

      // Show thumb immediately (already cached), then swap hi-res
      if (srcImg.complete && srcImg.naturalWidth) {
        lbImg.src = srcImg.src;
        lbImg.alt = cap;
        lbImg.classList.add('is-loaded');
        lbLoader.classList.remove('is-visible');
      }

      if (hiResSrc !== srcImg.src || !srcImg.complete) {
        var preload = new Image();
        preload.onload = function () {
          lbImg.src = hiResSrc;
          lbImg.alt = cap;
          lbImg.classList.add('is-loaded');
          lbLoader.classList.remove('is-visible');
        };
        preload.onerror = function () { lbLoader.classList.remove('is-visible'); };
        preload.src = hiResSrc;
      }
    }

    function goPrev() { if (curIdx > 0)                              { resetTransform(false); loadSlide(curGroup, --curIdx); } }
    function goNext() { if (curIdx < groups[curGroup].images.length - 1) { resetTransform(false); loadSlide(curGroup, ++curIdx); } }

    /* ── 5d. Transform: zoom + pan, constrained inside frame ──── */
    var scale = 1, panX = 0, panY = 0;

    function applyTransform(animated) {
      lbImg.style.transition = animated
        ? 'transform 220ms cubic-bezier(0.25, 0.1, 0.25, 1)'
        : 'none';
      lbImg.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
    }

    function resetTransform(animated) {
      scale = 1; panX = 0; panY = 0;
      lbImgContainer.classList.remove('is-zoomed', 'is-dragging');
      applyTransform(animated);
    }

    // Clamp pan so image never completely leaves frame
    function clampPan() {
      if (scale <= 1) { panX = 0; panY = 0; return; }
      var iw = lbImg.offsetWidth;
      var ih = lbImg.offsetHeight;
      var cw = lbImgContainer.offsetWidth;
      var ch = lbImgContainer.offsetHeight;
      // With transform-origin: center center, max pan = half the overflow
      var maxX = Math.max(0, (iw * scale - cw) / 2);
      var maxY = Math.max(0, (ih * scale - ch) / 2);
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    }

    // Zoom toward a point (clientX/Y = screen coords)
    function zoomAtPoint(newScale, clientX, clientY) {
      var rect = lbImgContainer.getBoundingClientRect();
      var cx   = rect.left + rect.width  / 2;  // natural image center
      var cy   = rect.top  + rect.height / 2;
      var relX = clientX - cx;
      var relY = clientY - cy;
      // Image-space point under cursor
      var imgX = (relX - panX) / scale;
      var imgY = (relY - panY) / scale;
      scale = newScale;
      panX  = relX - imgX * scale;
      panY  = relY - imgY * scale;
      clampPan();
      lbImgContainer.classList.toggle('is-zoomed', scale > 1);
    }

    /* ── 5e. Mouse wheel zoom ────────────────────────────────── */
    lbImgContainer.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor   = e.deltaY < 0 ? 1.18 : 0.847;
      var newScale = Math.min(4, Math.max(1, scale * factor));
      zoomAtPoint(newScale, e.clientX, e.clientY);
      applyTransform(false);
    }, { passive: false });

    /* ── 5f. Click / keyboard events ────────────────────────── */
    document.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el !== document.body) {
        if (el.classList && el.classList.contains('lb-trigger')) {
          e.preventDefault();
          lbOpenAt(parseInt(el.dataset.lbGroup, 10), parseInt(el.dataset.lbIdx, 10));
          return;
        }
        el = el.parentElement;
      }
    });

    // Click backdrop (anywhere on overlay outside the frame) closes
    lb.addEventListener('click', function (e) {
      if (!lbMuseumFrame.contains(e.target) &&
          !lbPrev.contains(e.target) &&
          !lbNext.contains(e.target) &&
          !lbClose.contains(e.target)) {
        lbCloseViewer();
      }
    });

    lbClose.addEventListener('click', function (e) { e.stopPropagation(); lbCloseViewer(); });
    lbPrev.addEventListener('click',  function (e) { e.stopPropagation(); goPrev(); });
    lbNext.addEventListener('click',  function (e) { e.stopPropagation(); goNext(); });

    document.addEventListener('keydown', function (e) {
      if (!lbOpen) return;
      if (e.key === 'Escape')      { lbCloseViewer(); }
      if (e.key === 'ArrowLeft')   { goPrev(); }
      if (e.key === 'ArrowRight')  { goNext(); }
    });

    /* ── 5g. Touch: swipe + pinch-zoom + pan ─────────────────── */
    var touchStartX = 0, touchStartY = 0;
    var pinchStartDist = 0, pinchStartScale = 1;
    var panStartX = 0, panStartY = 0, panBaseX = 0, panBaseY = 0;
    var pinching = false, isDragging = false, doubleTapTimer = null;

    function touchDist(t) {
      var dx = t[0].clientX - t[1].clientX;
      var dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    lbImgContainer.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        pinching        = true;
        isDragging      = false;
        pinchStartDist  = touchDist(e.touches);
        pinchStartScale = scale;
      } else if (e.touches.length === 1) {
        pinching    = false;
        isDragging  = false;
        panStartX   = e.touches[0].clientX;
        panStartY   = e.touches[0].clientY;
        panBaseX    = panX;
        panBaseY    = panY;
        touchStartX = panStartX;
        touchStartY = panStartY;

        if (doubleTapTimer) {
          clearTimeout(doubleTapTimer);
          doubleTapTimer = null;
          // Double-tap: toggle 2.5× zoom toward tap point / reset
          if (scale > 1) { resetTransform(true); }
          else { zoomAtPoint(2.5, e.touches[0].clientX, e.touches[0].clientY); applyTransform(true); }
        } else {
          doubleTapTimer = setTimeout(function () { doubleTapTimer = null; }, 300);
        }
      }
    }, { passive: true });

    lbImgContainer.addEventListener('touchmove', function (e) {
      if (pinching && e.touches.length === 2) {
        e.preventDefault();
        var newScale = Math.min(4, Math.max(1, pinchStartScale * (touchDist(e.touches) / pinchStartDist)));
        // Keep image centred between the two fingers
        var midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        var midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomAtPoint(newScale, midX, midY);
        applyTransform(false);
      } else if (!pinching && e.touches.length === 1 && scale > 1) {
        e.preventDefault();
        isDragging = true;
        lbImgContainer.classList.add('is-dragging');
        panX = panBaseX + (e.touches[0].clientX - panStartX);
        panY = panBaseY + (e.touches[0].clientY - panStartY);
        clampPan();
        applyTransform(false);
      }
    }, { passive: false });

    lbImgContainer.addEventListener('touchend', function (e) {
      if (pinching) {
        pinching = false;
        if (scale < 1.05) { resetTransform(true); }
        return;
      }
      lbImgContainer.classList.remove('is-dragging');
      if (!isDragging && scale <= 1 && e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) goNext(); else goPrev();
        }
      }
      isDragging = false;
    }, { passive: true });

    // Swipe on the rest of the overlay (outside image frame) also navigates
    lb.addEventListener('touchstart', function (e) {
      if (lbImgContainer.contains(e.target)) return;
      if (e.touches.length === 1) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (lbImgContainer.contains(e.target)) return;
      if (scale <= 1 && e.changedTouches.length === 1) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) goNext(); else goPrev();
        }
      }
    }, { passive: true });

  })(); // end museum viewer IIFE


  /* ============================================================
     6. LEAD INTENT TRACKER
     Page-level signal detection. Writes to sessionStorage.
     WA button + museum viewer read these to personalise messages
     and enrich GA4 events. Score propagates to highest value seen.

     Scores  — High (3): NFS, artwork zoom, WA click
               Medium (2): Collection, Exhibitions, artwork detail
               Low (1): Homepage, other pages
     ============================================================ */
  (function () {
    var path   = window.location.pathname;
    var score  = 1;
    var source = 'Website Organic';
    var iType  = 'Page View';

    if      (path.indexOf('not-for-sale') !== -1)         { score = 3; source = 'Not For Sale';   iType = 'NFS Page View'; }
    else if (path.indexOf('custom-portraits') !== -1)     { score = 2; source = 'Portrait Inquiry'; }
    else if (path.indexOf('collection') !== -1)           { score = 2; source = 'Collection';      iType = 'Collection View'; }
    else if (path.indexOf('exhibitions') !== -1)          { score = 2; source = 'Exhibitions';     iType = 'Exhibition View'; }
    else if (path.indexOf('the-sovereign') !== -1 ||
             path.indexOf('arctic-eagle')  !== -1 ||
             path.indexOf('christ')        !== -1)        { score = 3; source = 'Not For Sale';   iType = 'NFS Page View'; }
    else if (path.indexOf('/artworks/') !== -1 ||
             (path.indexOf('.html') !== -1 && path.indexOf('artwork') !== -1)) {
                                                            score = 2; source = 'Collection';      iType = 'Collection View'; }

    try {
      var stored = parseInt(sessionStorage.getItem('vaca_intent_score') || '0');
      if (score > stored) {
        sessionStorage.setItem('vaca_intent_score',     score.toString());
        sessionStorage.setItem('vaca_lead_source',      source);
        sessionStorage.setItem('vaca_page_visited',     path);
        sessionStorage.setItem('vaca_interaction_type', iType);
      }
    } catch (e) {}
  })();

});
