/* ================================================================
   VaCa Marquetry — main.js  v3
   Sections:
     1. Nav toggle (mobile hamburger)
     2. WhatsApp floating button (inject + smart message)
     3. Cookie consent banner (GA4 Consent Mode v2)
     4. Museum viewer (lightbox — zoom, pan, swipe, pinch)
     5. Lead intent tracker (sessionStorage scoring)
     6. Debug utilities (window.resetCookies)
   ================================================================ */
'use strict';

/* ================================================================
   SECTION 1 — NAV TOGGLE
   ================================================================ */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('is-open', !open);
    document.body.classList.toggle('nav-open', !open);
  });

  document.addEventListener('click', function (e) {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }
  });
})();

/* ================================================================
   SECTION 2 — WHATSAPP FLOATING BUTTON
   Injected into every page via main.js.
   Smart message: reads vaca_last_artwork from sessionStorage.
   ================================================================ */
(function () {
  var PHONE = '393517571986';

  /* Inject button */
  var btn = document.createElement('a');
  btn.className = 'wa-float';
  btn.href = 'https://wa.me/' + PHONE;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', 'Chat on WhatsApp');
  btn.innerHTML =
    '<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M16 2C8.268 2 2 8.268 2 16c0 2.46.664 4.764 1.82 6.742L2 30l7.484-1.792A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.4a11.34 11.34 0 01-5.78-1.582l-.414-.245-4.442 1.064 1.098-4.312-.27-.44A11.36 11.36 0 014.6 16C4.6 9.7 9.7 4.6 16 4.6S27.4 9.7 27.4 16 22.3 27.4 16 27.4zm6.22-8.468c-.34-.17-2.014-1.002-2.326-1.116-.312-.114-.54-.17-.768.17-.228.34-.882 1.116-1.082 1.344-.2.228-.4.256-.74.086-.34-.17-1.436-.53-2.736-1.692-1.012-.906-1.694-2.024-1.894-2.364-.2-.34-.022-.524.15-.694.154-.152.34-.4.51-.6.17-.2.228-.34.34-.568.114-.228.058-.428-.028-.598-.086-.17-.768-1.854-1.054-2.538-.278-.666-.56-.576-.768-.586-.2-.01-.428-.012-.656-.012a1.26 1.26 0 00-.912.428c-.312.34-1.196 1.168-1.196 2.85s1.224 3.306 1.394 3.534c.17.228 2.408 3.676 5.836 5.154.816.352 1.452.562 1.948.72.82.26 1.566.224 2.156.136.658-.098 2.014-.824 2.298-1.62.284-.796.284-1.48.2-1.62-.082-.142-.31-.228-.65-.398z"/>' +
    '</svg>';
  document.body.appendChild(btn);

  btn.addEventListener('click', function (e) {
    var artwork = '', score = 1;
    try {
      artwork = sessionStorage.getItem('vaca_last_artwork') || '';
      score   = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
      sessionStorage.setItem('vaca_intent_score',     '3');
      sessionStorage.setItem('vaca_interaction_type', 'WhatsApp Click');
      sessionStorage.setItem('vaca_lead_source',      'WhatsApp');
    } catch (ex) {}
    var msg = artwork
      ? 'Hello VaCa Marquetry, I\'m interested in the artwork “' + artwork + '”. Could you share more details?'
      : 'Hello VaCa Marquetry, I would like to inquire about an artwork or Private Collection piece.';
    this.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        source:          'floating_button',
        phone:           '+393517571986',
        page:            window.location.pathname,
        artwork_context: artwork || '(none)',
        intent_score:    score
      });
    }
  });
})();

/* ================================================================
   SECTION 3 — COOKIE CONSENT BANNER
   GA4 Consent Mode v2: analytics_storage denied by default.
   Accept → gtag consent update → GA4 starts collecting.
   Decline → banner dismissed, storage stays denied.
   ================================================================ */
(function () {
  var KEY = 'vaca_cookie_consent';
  var decided = false;
  try { if (localStorage.getItem(KEY)) decided = true; } catch (e) {}
  if (decided) return;

  function removeBanner(banner) {
    banner.style.transform = 'translateY(110%)';
    document.body.classList.remove('has-cookie-banner');
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 340);
  }

  var banner = document.createElement('div');
  banner.id = 'vaca-cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.innerHTML =
    '<p class="cookie-text">We use analytics cookies to understand how visitors engage with our work. No personal data is sold or shared.</p>' +
    '<div class="cookie-actions">' +
      '<button id="cookie-decline" class="btn-cookie btn-cookie-ghost">Decline</button>' +
      '<button id="cookie-accept"  class="btn-cookie btn-cookie-primary">Accept</button>' +
    '</div>';
  document.body.appendChild(banner);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      document.body.classList.add('has-cookie-banner');
    });
  });

  banner.querySelector('#cookie-accept').addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' });
      gtag('event', 'cookie_consent', { choice: 'accepted' });
    }
    removeBanner(banner);
  });

  banner.querySelector('#cookie-decline').addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'declined'); } catch (e) {}
    if (typeof gtag === 'function') {
      gtag('event', 'cookie_consent', { choice: 'declined' });
    }
    removeBanner(banner);
  });
})();

/* ================================================================
   SECTION 4 — MUSEUM VIEWER
   DOM structure (injected once):
     .vaca-lb → .lb-viewer (flex-row) →
       .lb-arrow.lb-prev | .lb-frame-wrap (.lb-museum-frame + .lb-frame-footer) | .lb-arrow.lb-next
   Zoom: scroll-wheel / pinch, anchored at cursor/midpoint.
   Pan: mouse drag / touch drag when scale > 1.
   Swipe: left/right when scale === 1 → navigate slides.
   Double-tap: toggle 2.5× zoom.
   ================================================================ */
(function () {
  /* ── Build DOM ─────────────────────────────────────────────── */
  var lb = document.createElement('div');
  lb.id = 'vaca-lb';
  lb.className = 'vaca-lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Artwork viewer');
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML =
    '<button class="lb-close" aria-label="Close viewer">&#215;</button>' +
    '<div class="lb-viewer">' +
      '<button class="lb-arrow lb-prev" aria-label="Previous artwork">&#8592;</button>' +
      '<div class="lb-frame-wrap">' +
        '<div class="lb-museum-frame">' +
          '<div class="lb-img-container">' +
            '<div class="lb-loader">' +
              '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="2.5" stroke-dasharray="60" stroke-linecap="round"/>' +
              '</svg>' +
            '</div>' +
            '<img class="lb-img" alt="" draggable="false">' +
          '</div>' +
        '</div>' +
        '<div class="lb-frame-footer">' +
          '<p class="lb-caption"></p>' +
          '<span class="lb-counter"></span>' +
        '</div>' +
      '</div>' +
      '<button class="lb-arrow lb-next" aria-label="Next artwork">&#8594;</button>' +
    '</div>';
  document.body.appendChild(lb);

  /* ── DOM refs ─────────────────────────────────────────────── */
  var lbClose        = lb.querySelector('.lb-close');
  var lbPrev         = lb.querySelector('.lb-prev');
  var lbNext         = lb.querySelector('.lb-next');
  var lbMuseumFrame  = lb.querySelector('.lb-museum-frame');
  var lbImgContainer = lb.querySelector('.lb-img-container');
  var lbImg          = lb.querySelector('.lb-img');
  var lbLoader       = lb.querySelector('.lb-loader');
  var lbCaption      = lb.querySelector('.lb-caption');
  var lbCounter      = lb.querySelector('.lb-counter');

  /* ── State ────────────────────────────────────────────────── */
  var groups   = [];
  var curGroup = 0, curIdx = 0, lbOpen = false;
  var scale = 1, panX = 0, panY = 0;
  var isDragging = false, dragStartX, dragStartY, panStartX, panStartY;
  var pinching = false, pinchStartScale, pinchStartDist;
  var lastTap  = 0;
  var swipeStartX = 0, swipeStartY = 0;

  /* ── Transform helpers ────────────────────────────────────── */
  function applyTransform(animate) {
    lbImg.style.transition = animate ? 'transform 260ms ease' : 'none';
    lbImg.style.transform  = 'translate(' + panX + 'px,' + panY + 'px) scale(' + scale + ')';
  }

  function resetTransform(animate) {
    scale = 1; panX = 0; panY = 0;
    lbImgContainer.classList.remove('is-zoomed', 'is-dragging');
    applyTransform(animate);
  }

  function clampPan() {
    if (scale <= 1) { panX = 0; panY = 0; return; }
    var iw = lbImg.offsetWidth,  ih = lbImg.offsetHeight;
    var cw = lbImgContainer.offsetWidth, ch = lbImgContainer.offsetHeight;
    var maxX = Math.max(0, (iw * scale - cw) / 2);
    var maxY = Math.max(0, (ih * scale - ch) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  }

  function zoomAtPoint(newScale, clientX, clientY) {
    var rect = lbImgContainer.getBoundingClientRect();
    var cx = rect.left + rect.width  / 2;
    var cy = rect.top  + rect.height / 2;
    var relX = clientX - cx, relY = clientY - cy;
    var imgX = (relX - panX) / scale, imgY = (relY - panY) / scale;
    scale = newScale;
    panX  = relX - imgX * scale;
    panY  = relY - imgY * scale;
    clampPan();
    lbImgContainer.classList.toggle('is-zoomed', scale > 1);
  }

  function touchDist(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ── Viewer open / close / navigate ──────────────────────── */
  function lbOpenAt(gIdx, iIdx) {
    curGroup = gIdx; curIdx = iIdx; lbOpen = true;
    document.body.classList.add('lb-open');
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    lbClose.focus();
    resetTransform(false);
    loadSlide(gIdx, iIdx);
    try {
      var alt = groups[gIdx].images[iIdx].alt || '';
      if (alt) sessionStorage.setItem('vaca_last_artwork', alt);
      sessionStorage.setItem('vaca_interaction_type', 'Artwork Zoom');
      var prev = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
      if (prev < 3) sessionStorage.setItem('vaca_intent_score', '3');
    } catch (e) {}
  }

  function lbCloseViewer() {
    lbOpen = false;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-open');
    resetTransform(false);
    setTimeout(function () {
      if (!lbOpen) { lbImg.src = ''; lbImg.classList.remove('is-loaded'); }
    }, 300);
  }

  function loadSlide(gIdx, iIdx) {
    var srcImg   = groups[gIdx].images[iIdx];
    var hiResSrc = srcImg.dataset.lbSrc || srcImg.src;
    var cap      = srcImg.alt || '';
    var total    = groups[gIdx].images.length;
    var multi    = total > 1;
    resetTransform(false);
    lbImg.classList.remove('is-loaded');
    lbLoader.classList.add('is-visible');
    lbCaption.textContent = cap;
    lbCounter.textContent = multi ? (iIdx + 1) + ' / ' + total : '';
    lbPrev.classList.toggle('is-hidden', !(multi && iIdx > 0));
    lbNext.classList.toggle('is-hidden', !(multi && iIdx < total - 1));
    /* Show thumb immediately if cached */
    if (srcImg.complete && srcImg.naturalWidth) {
      lbImg.src = srcImg.src; lbImg.alt = cap;
      lbImg.classList.add('is-loaded');
      lbLoader.classList.remove('is-visible');
    }
    /* Preload hi-res */
    var preload = new Image();
    preload.onload = function () {
      lbImg.src = hiResSrc; lbImg.alt = cap;
      lbImg.classList.add('is-loaded');
      lbLoader.classList.remove('is-visible');
    };
    preload.src = hiResSrc;
  }

  function prevSlide() { if (curIdx > 0) { curIdx--; loadSlide(curGroup, curIdx); } }
  function nextSlide() {
    if (curIdx < groups[curGroup].images.length - 1) { curIdx++; loadSlide(curGroup, curIdx); }
  }

  /* ── Group registration ───────────────────────────────────── */
  function isInsideLink(el) {
    var node = el.parentElement;
    while (node && node !== document.body) {
      if (node.tagName === 'A' && node.getAttribute('href')) return true;
      node = node.parentElement;
    }
    return false;
  }

  function registerGroup(groupName, imgEls) {
    var images = [];
    for (var i = 0; i < imgEls.length; i++) {
      var img = imgEls[i];
      if (img.classList.contains('lb-trigger')) continue;
      img.classList.add('lb-trigger');
      images.push(img);
    }
    if (!images.length) return;
    var gIdx = groups.length;
    groups.push({ name: groupName, images: images });
    images.forEach(function (img, iIdx) {
      img.addEventListener('click', function (e) {
        if (isInsideLink(img)) return;
        e.preventDefault();
        lbOpenAt(gIdx, iIdx);
      });
    });
  }

  /* ── Auto-discovery: data-lb-group / data-lb-solo ────────── */
  function discoverGroups() {
    /* Grouped images */
    var all = document.querySelectorAll('[data-lb-group]');
    var map = {};
    all.forEach(function (img) {
      var g = img.dataset.lbGroup;
      if (!map[g]) map[g] = [];
      map[g].push(img);
    });
    Object.keys(map).forEach(function (g) { registerGroup(g, map[g]); });
    /* Solo images */
    document.querySelectorAll('[data-lb-solo]').forEach(function (img, i) {
      registerGroup('solo-' + i, [img]);
    });
  }

  /* ── Controls ─────────────────────────────────────────────── */
  lbClose.addEventListener('click', lbCloseViewer);
  lbPrev.addEventListener('click', prevSlide);
  lbNext.addEventListener('click', nextSlide);

  /* Backdrop click */
  lb.addEventListener('click', function (e) {
    if (!lbMuseumFrame.contains(e.target) &&
        !lbPrev.contains(e.target) &&
        !lbNext.contains(e.target) &&
        !lbClose.contains(e.target)) {
      lbCloseViewer();
    }
  });

  /* Keyboard */
  document.addEventListener('keydown', function (e) {
    if (!lbOpen) return;
    if (e.key === 'Escape')     lbCloseViewer();
    if (e.key === 'ArrowLeft')  prevSlide();
    if (e.key === 'ArrowRight') nextSlide();
  });

  /* Wheel zoom */
  lbImgContainer.addEventListener('wheel', function (e) {
    e.preventDefault();
    var factor   = e.deltaY < 0 ? 1.18 : 0.847;
    var newScale = Math.min(4, Math.max(1, scale * factor));
    zoomAtPoint(newScale, e.clientX, e.clientY);
    applyTransform(false);
  }, { passive: false });

  /* Mouse drag */
  lbImgContainer.addEventListener('mousedown', function (e) {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    panStartX  = panX;      panStartY  = panY;
    lbImgContainer.classList.add('is-dragging');
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    panX = panStartX + (e.clientX - dragStartX);
    panY = panStartY + (e.clientY - dragStartY);
    clampPan();
    applyTransform(false);
  });
  document.addEventListener('mouseup', function () {
    if (isDragging) { isDragging = false; lbImgContainer.classList.remove('is-dragging'); }
  });

  /* Touch: pinch + drag + swipe + double-tap */
  lbImgContainer.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinching        = true;
      pinchStartScale = scale;
      pinchStartDist  = touchDist(e.touches);
      e.preventDefault();
    } else if (e.touches.length === 1) {
      var t = e.touches[0];
      swipeStartX = t.clientX;
      swipeStartY = t.clientY;
      if (scale > 1) {
        isDragging = true;
        dragStartX = t.clientX; dragStartY = t.clientY;
        panStartX  = panX;      panStartY  = panY;
      }
      /* Double-tap */
      var now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        if (scale > 1) { resetTransform(true); }
        else { zoomAtPoint(2.5, t.clientX, t.clientY); applyTransform(true); }
      }
      lastTap = now;
    }
  }, { passive: false });

  lbImgContainer.addEventListener('touchmove', function (e) {
    if (pinching && e.touches.length === 2) {
      e.preventDefault();
      var newScale = Math.min(4, Math.max(1, pinchStartScale * (touchDist(e.touches) / pinchStartDist)));
      var midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      var midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      zoomAtPoint(newScale, midX, midY);
      applyTransform(false);
    } else if (isDragging && e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      panX = panStartX + (e.touches[0].clientX - dragStartX);
      panY = panStartY + (e.touches[0].clientY - dragStartY);
      clampPan();
      applyTransform(false);
    }
  }, { passive: false });

  lbImgContainer.addEventListener('touchend', function (e) {
    if (pinching) { pinching = false; }
    if (isDragging) { isDragging = false; lbImgContainer.classList.remove('is-dragging'); }
    /* Swipe to navigate when not zoomed */
    if (scale <= 1 && e.changedTouches.length === 1) {
      var dx = e.changedTouches[0].clientX - swipeStartX;
      var dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) nextSlide(); else prevSlide();
      }
    }
  });

  /* ── Init ─────────────────────────────────────────────────── */
  discoverGroups();

})();

/* ================================================================
   SECTION 5 — LEAD INTENT TRACKER
   Page-level score persisted to sessionStorage.
   Score:  3 = High  (NFS page, artwork zoom, WA click)
           2 = Medium (collection, exhibitions, portraits)
           1 = Low   (homepage, other)
   ================================================================ */
(function () {
  var path   = window.location.pathname;
  var score  = 1, source = 'Website Organic', iType = 'Page View';

  if      (path.indexOf('not-for-sale')         !== -1) { score = 3; source = 'Not For Sale';     iType = 'NFS Page View'; }
  else if (path.indexOf('the-sovereign')         !== -1 ||
           path.indexOf('arctic-eagle')          !== -1 ||
           path.indexOf('christ')                !== -1) { score = 3; source = 'Not For Sale';     iType = 'NFS Page View'; }
  else if (path.indexOf('custom-portraits')      !== -1) { score = 2; source = 'Portrait Inquiry'; iType = 'Portrait Page View'; }
  else if (path.indexOf('collection')            !== -1) { score = 2; source = 'Collection';       iType = 'Collection View'; }
  else if (path.indexOf('exhibitions')           !== -1) { score = 2; source = 'Exhibitions';      iType = 'Exhibition View'; }
  else if (path.indexOf('/artworks/')            !== -1 ||
           path.indexOf('the-lion-within')       !== -1 ||
           path.indexOf('strength-in-harmony')   !== -1 ||
           path.indexOf('king-of-ararat')        !== -1 ||
           path.indexOf('black-woman')           !== -1) { score = 2; source = 'Collection';       iType = 'Collection View'; }

  try {
    var stored = parseInt(sessionStorage.getItem('vaca_intent_score') || '0');
    if (score > stored) {
      sessionStorage.setItem('vaca_intent_score',     String(score));
      sessionStorage.setItem('vaca_lead_source',      source);
      sessionStorage.setItem('vaca_page_visited',     path);
      sessionStorage.setItem('vaca_interaction_type', iType);
    }
  } catch (e) {}
})();

/* ================================================================
   SECTION 6 — DEBUG UTILITIES
   Access from browser console: window.resetCookies()
   ================================================================ */
window.resetCookies = function () {
  var keys = [
    'vaca_intent_score', 'vaca_lead_source', 'vaca_page_visited',
    'vaca_interaction_type', 'vaca_last_artwork'
  ];
  try { localStorage.removeItem('vaca_cookie_consent'); } catch (e) {}
  keys.forEach(function (k) { try { sessionStorage.removeItem(k); } catch (e) {} });
  console.log('[VaCa] All cookie and session data cleared.');
  return 'Done — reload the page to see the cookie consent banner.';
};
