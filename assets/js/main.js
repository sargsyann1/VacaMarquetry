/* ================================================================
   VaCa Marquetry — main.js  v3
   Sections:
     1. Nav toggle (mobile hamburger)
     2. WhatsApp floating button (inject + smart message)
     3. Cookie consent banner (Consent Mode v2 — analytics + ads)
     4. Museum viewer (lightbox — zoom, pan, swipe, pinch)
     5. Lead intent tracker (sessionStorage scoring)
     6. Debug utilities (window.resetCookies)
     7. FAQ accordion  ·  8. Visitor/session IDs
     9. Collection filters (EN + IT)
    10. Local staging mode (local hosts only, opt-in)
   ================================================================ */
'use strict';

/* ================================================================
   SECTION 1 — NAV TOGGLE
   ================================================================ */
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  var IS_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;
  var TXT = IS_IT
    ? { open: 'Apri il menu', close: 'Chiudi il menu', note: 'Intarsio su Misura · Realizzato a Mano in Italia' }
    : { open: 'Open menu', close: 'Close menu', note: 'Bespoke Marquetry · Handmade in Italy' };

  if (!links.id) links.id = 'site-menu';
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-label', TXT.open);

  /* Mobile/tablet menu extras (hidden on desktop by CSS): the header CTA
     repeated as a full-width button, and a quiet studio line. The copy uses
     its own class — conversion-ux.js reads the first `.nav-cta`. */
  var cta = document.querySelector('.nav-cta');
  if (cta) {
    var ctaItem = document.createElement('li');
    ctaItem.className = 'nav-menu-cta-item';
    var ctaCopy = document.createElement('a');
    ctaCopy.className = 'btn btn-primary nav-menu-cta';
    ctaCopy.href = cta.getAttribute('href');
    var longLabel = cta.querySelector('.nav-cta-long');
    ctaCopy.textContent = (longLabel || cta).textContent.trim();
    ctaItem.appendChild(ctaCopy);
    links.appendChild(ctaItem);
  }
  var note = document.createElement('li');
  note.className = 'nav-menu-note';
  note.setAttribute('aria-hidden', 'true');
  note.textContent = TXT.note;
  links.appendChild(note);

  function setOpen(open, returnFocus) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? TXT.close : TXT.open);
    links.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (!open && returnFocus) toggle.focus();
  }
  function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

  toggle.addEventListener('click', function () { setOpen(!isOpen()); });

  /* Outside click (overlay, header, page) closes the menu */
  document.addEventListener('click', function (e) {
    if (isOpen() && !toggle.contains(e.target) && !links.contains(e.target)) setOpen(false);
  });

  /* Same-page anchor links (e.g. #prezzi) — close the menu after the tap */
  links.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) setOpen(false);
  });

  /* Escape closes and returns focus to the menu button */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) setOpen(false, true);
  });

  /* Growing past the menu breakpoint (rotation, resize) must not leave the
     page scroll-locked behind a hidden menu */
  var desktop = window.matchMedia('(min-width: 1200px)');
  function onBreakpoint() { if (desktop.matches && isOpen()) setOpen(false); }
  if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
  else if (desktop.addListener) desktop.addListener(onBreakpoint);

  /* Sticky header: clean at the top of the page, a quiet surface once the
     page scrolls beneath it (CSS: .site-header.is-scrolled) */
  if (header) {
    var ticking = false;
    var update = function () {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();

/* ================================================================
   SECTION 2 — WHATSAPP FLOATING BUTTON
   Injected into every page via main.js.
   Smart message: reads vaca_last_artwork from sessionStorage.
   ================================================================ */
(function () {
  var PHONE = '393517571986';
  var IS_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;

  /* Inject button */
  var btn = document.createElement('a');
  btn.className = 'wa-float';
  btn.href = 'https://wa.me/' + PHONE;
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';
  btn.setAttribute('aria-label', IS_IT ? 'Scrivici su WhatsApp' : 'Chat on WhatsApp');
  btn.innerHTML =
    '<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M16 2C8.268 2 2 8.268 2 16c0 2.46.664 4.764 1.82 6.742L2 30l7.484-1.792A13.93 13.93 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.4a11.34 11.34 0 01-5.78-1.582l-.414-.245-4.442 1.064 1.098-4.312-.27-.44A11.36 11.36 0 014.6 16C4.6 9.7 9.7 4.6 16 4.6S27.4 9.7 27.4 16 22.3 27.4 16 27.4zm6.22-8.468c-.34-.17-2.014-1.002-2.326-1.116-.312-.114-.54-.17-.768.17-.228.34-.882 1.116-1.082 1.344-.2.228-.4.256-.74.086-.34-.17-1.436-.53-2.736-1.692-1.012-.906-1.694-2.024-1.894-2.364-.2-.34-.022-.524.15-.694.154-.152.34-.4.51-.6.17-.2.228-.34.34-.568.114-.228.058-.428-.028-.598-.086-.17-.768-1.854-1.054-2.538-.278-.666-.56-.576-.768-.586-.2-.01-.428-.012-.656-.012a1.26 1.26 0 00-.912.428c-.312.34-1.196 1.168-1.196 2.85s1.224 3.306 1.394 3.534c.17.228 2.408 3.676 5.836 5.154.816.352 1.452.562 1.948.72.82.26 1.566.224 2.156.136.658-.098 2.014-.824 2.298-1.62.284-.796.284-1.48.2-1.62-.082-.142-.31-.228-.65-.398z"/>' +
    '</svg>';
  document.body.appendChild(btn);

  /* ── WhatsApp webhook URL ──────────────────────────────────────────
     Paste the Make.com webhook URL for the WA Lead scenario here.
     Leave blank ('') to skip CRM logging without breaking the WA button. */
  var WA_WEBHOOK_URL = 'https://hook.eu2.make.com/enneb60q3m64izxwj0r5ae3t5mgp91m7';

  btn.addEventListener('click', function (e) {
    var artwork = '', score = 1;
    try {
      artwork = sessionStorage.getItem('vaca_last_artwork') || '';
      score   = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
      sessionStorage.setItem('vaca_intent_score',     '3');
      sessionStorage.setItem('vaca_interaction_type', 'WhatsApp Click');
      sessionStorage.setItem('vaca_lead_source',      'WhatsApp');
    } catch (ex) {}

    var msg;
    if (IS_IT) {
      msg = artwork
        ? 'Buongiorno VaCa Marquetry, sono interessato/a all\u2019opera \u201c' + artwork + '\u201d. Potete darmi pi\u00f9 informazioni?'
        : 'Buongiorno VaCa Marquetry, vorrei informazioni su un ritratto su misura in intarsio.';
    } else {
      msg = artwork
        ? 'Hello VaCa Marquetry, I\'m interested in the artwork \u201c' + artwork + '\u201d. Could you share more details?'
        : 'Hello VaCa Marquetry, I would like to inquire about an artwork or Private Collection piece.';
    }

    /* Update href FIRST — WA opens in new tab so page stays alive */
    this.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);

    /* ── CRM webhook — fire-and-forget ──────────────────────────── */
    /* intent_score maps to HOT/WARM/COLD router in Make.com:
       (session_score × 2) + artwork_bonus → COLD ≤2, WARM 3-6, HOT ≥7
       e.g. artwork zoom + WA click → score 3 → crm_score 8 = HOT          */
    var crm_score = (score * 2) + (artwork ? 2 : 0);
    var payload = {
      lead_type:        'WhatsApp Lead',
      lead_source:      'WhatsApp',
      interaction_type: 'WhatsApp Click',
      artwork_context:  artwork || '',
      intent_score:     crm_score,
      incoming_message: msg,
      source_page:      window.location.href,
      submitted_at:     new Date().toISOString()
    };
    /* Attach marketing attribution — same flat payload the forms send
       (gclid / gbraid / wbraid / utm_* / visitor_id / session_id …) */
    try {
      var attribution = (window.vacaAttributionPayload && window.vacaAttributionPayload()) || {};
      for (var ak in attribution) {
        if (Object.prototype.hasOwnProperty.call(attribution, ak) && !(ak in payload)) payload[ak] = attribution[ak];
      }
    } catch (attrErr) {}

    console.log('WA_CLICK_TRIGGERED');
    console.log(payload);

    if (WA_WEBHOOK_URL) {
      try {
        fetch(WA_WEBHOOK_URL, {
          method:    'POST',
          headers:   { 'Content-Type': 'application/json' },
          body:      JSON.stringify(payload),
          keepalive: true
        }).catch(function (err) {
          console.warn('[VaCa WA] Webhook error:', err);
        });
      } catch (fetchErr) {
        console.warn('[VaCa WA] Fetch failed:', fetchErr);
      }
    } else {
      console.warn('[VaCa WA] WA_WEBHOOK_URL not configured — CRM logging skipped.');
    }

    var waParams = {
      source:          'floating_button',
      phone:           '+393517571986',
      page:            window.location.pathname,
      artwork_context: artwork || '(none)',
      intent_score:    score,
      page_language:   IS_IT ? 'it' : 'en'
    };
    if (typeof window.vacaTrackConversion === 'function') {
      window.vacaTrackConversion('whatsapp_click', waParams);
    } else if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', waParams);
    }
  });

  /* Inline WhatsApp links (e.g. contact page, IT form) — mark with
     data-wa-link. They go through the floating button so the click gets
     the same message, CRM webhook, attribution and GA4/Ads event. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('[data-wa-link]');
    if (!link) return;
    e.preventDefault();
    btn.click();
  });
})();

/* ================================================================
   SECTION 3 — COOKIE CONSENT BANNER
   Consent Mode v2: analytics_storage, ad_storage, ad_user_data and
   ad_personalization denied by default (<head> snippet on every page).
   Accept → gtag consent update (all four granted) → GA4 + Google Ads
   start collecting. The <head> snippet re-applies the stored
   "accepted" choice on every later page load.
   Decline → banner dismissed, everything stays denied.
   ================================================================ */
(function () {
  var KEY = 'vaca_cookie_consent';
  var decided = false;
  try { if (localStorage.getItem(KEY)) decided = true; } catch (e) {}
  if (decided) return;

  function removeBanner(banner) {
    banner.style.transform = 'translateY(110%)';
    document.body.classList.remove('has-cookie-banner');
    document.body.style.removeProperty('--vaca-banner-h');
    setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 340);
  }

  var IS_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;
  var TXT = IS_IT
    ? { label: 'Consenso cookie',
        text: 'Utilizziamo cookie di analisi e di misurazione pubblicitaria (Google) per capire come i visitatori scoprono il nostro lavoro. Non vendiamo i tuoi dati personali.',
        policy: 'Informativa sui cookie', decline: 'Rifiuta', accept: 'Accetta' }
    : { label: 'Cookie consent',
        text: 'We use analytics and advertising-measurement cookies (Google) to understand how visitors discover our work. No personal data is sold.',
        policy: 'Cookie Policy', decline: 'Decline', accept: 'Accept' };

  /* Site root resolved from this script's own URL, so the policy link
     works from /, /artworks/ and /it/ alike */
  var policyHref = 'cookie-policy.html';
  try {
    var self = document.querySelector('script[src*="assets/js/main.js"]');
    if (self) policyHref = new URL(IS_IT ? '../../it/cookie-policy.html' : '../../cookie-policy.html', self.src).href;
  } catch (e) {}

  var banner = document.createElement('div');
  banner.id = 'vaca-cookie-banner';
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', TXT.label);
  banner.innerHTML =
    '<p class="cookie-text">' + TXT.text + ' <a href="' + policyHref + '" class="cookie-link">' + TXT.policy + '</a></p>' +
    '<div class="cookie-actions">' +
      '<button id="cookie-decline" class="btn-cookie btn-cookie-ghost">' + TXT.decline + '</button>' +
      '<button id="cookie-accept"  class="btn-cookie btn-cookie-primary">' + TXT.accept + '</button>' +
    '</div>';
  document.body.appendChild(banner);

  /* Keep the WhatsApp button above the banner whatever its height
     (longer copy / Italian text wraps to more lines on phones) */
  function syncBannerHeight() {
    if (!banner.parentNode) return;
    document.body.style.setProperty('--vaca-banner-h', banner.offsetHeight + 'px');
  }
  window.addEventListener('resize', syncBannerHeight);

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      banner.classList.add('is-visible');
      document.body.classList.add('has-cookie-banner');
      syncBannerHeight();
    });
  });

  /* ── Cookie Intelligence webhook ────────────────────────────────── */
  var COOKIE_WEBHOOK_URL = 'https://hook.eu2.make.com/pj775ngcim51f24g9v7m1mrr06xbrac5';

  banner.querySelector('#cookie-accept').addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'accepted'); } catch (e) {}
    if (typeof gtag === 'function') {
      /* Same four signals the <head> snippet restores on later page loads */
      gtag('consent', 'update', {
        analytics_storage:  'granted',
        ad_storage:         'granted',
        ad_user_data:       'granted',
        ad_personalization: 'granted'
      });
      gtag('event', 'cookie_consent', { choice: 'accepted' });
    }

    /* ── Fire CRM payload ──────────────────────────────────────── */
    if (COOKIE_WEBHOOK_URL) {
      try {
        var ua = navigator.userAgent;
        var isTablet   = /iPad|Android(?!.*Mobile)/i.test(ua);
        var isMobile   = /Mobi|Android|iPhone|iPad/i.test(ua);
        var deviceType = isTablet ? 'Tablet' : (isMobile ? 'Mobile' : 'Desktop');

        var os = 'Unknown';
        if      (/Windows/i.test(ua))                              os = 'Windows';
        else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua))  os = 'macOS';
        else if (/iPhone/.test(ua))                                os = 'iOS';
        else if (/iPad/.test(ua))                                  os = 'iPadOS';
        else if (/Android/.test(ua))                               os = 'Android';
        else if (/Linux/.test(ua))                                 os = 'Linux';

        var browser = 'Unknown';
        if      (/Firefox/i.test(ua))   browser = 'Firefox';
        else if (/Edg/i.test(ua))       browser = 'Edge';
        else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
        else if (/Chrome/i.test(ua))    browser = 'Chrome';
        else if (/Safari/i.test(ua))    browser = 'Safari';

        var visitorId = '', sessionId = '', pagesCount = 1, timeOnSite = 0, intentScore = 1;
        try {
          visitorId    = localStorage.getItem('vaca_visitor_id')  || '';
          sessionId    = sessionStorage.getItem('vaca_session_id') || '';
          pagesCount   = parseInt(sessionStorage.getItem('vaca_pages_visited')  || '1');
          timeOnSite   = Math.round((Date.now() - parseInt(sessionStorage.getItem('vaca_session_start') || String(Date.now()))) / 1000);
          intentScore  = parseInt(sessionStorage.getItem('vaca_intent_score') || '1');
        } catch (ex) {}

        var tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (ex) {}

        var cookiePayload = {
          visitor_id:    visitorId,
          session_id:    sessionId,
          device_type:   deviceType,
          os:            os,
          browser:       browser,
          timezone:      tz,
          pages_visited: pagesCount,
          time_on_site:  timeOnSite,
          scroll_depth:  0,
          intent_score:  intentScore,
          event_type:    'Cookie Accept',
          source_page:   window.location.href,
          timestamp:     new Date().toISOString()
        };

        console.log('[VaCa Cookie] CRM payload:', cookiePayload);

        fetch(COOKIE_WEBHOOK_URL, {
          method:    'POST',
          headers:   { 'Content-Type': 'application/json' },
          body:      JSON.stringify(cookiePayload),
          keepalive: true
        }).catch(function (err) { console.warn('[VaCa Cookie] Webhook error:', err); });
      } catch (cookieErr) { console.warn('[VaCa Cookie] Payload error:', cookieErr); }
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
  var LB_IT = (document.documentElement.getAttribute('lang') || '').toLowerCase().indexOf('it') === 0;
  var LBT = LB_IT
    ? { viewer: 'Visualizzatore opere', close: 'Chiudi', prev: 'Opera precedente', next: 'Opera successiva', vis: 'Visualizzazione', open: 'Apri a schermo intero' }
    : { viewer: 'Artwork viewer', close: 'Close viewer', prev: 'Previous artwork', next: 'Next artwork', vis: 'Visualisation', open: 'Open full screen' };
  lb.setAttribute('aria-label', LBT.viewer);
  lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML =
    '<button class="lb-close" aria-label="' + LBT.close + '">&#215;</button>' +
    '<div class="lb-viewer">' +
      '<button class="lb-arrow lb-prev" aria-label="' + LBT.prev + '">&#8592;</button>' +
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
          '<span class="lb-counter" aria-live="polite"></span>' +
        '</div>' +
        '<div class="lb-dots" aria-hidden="true"></div>' +
      '</div>' +
      '<button class="lb-arrow lb-next" aria-label="' + LBT.next + '">&#8594;</button>' +
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
  var lbDots         = lb.querySelector('.lb-dots');

  /* ── State ────────────────────────────────────────────────── */
  var groups   = [];
  var curGroup = 0, curIdx = 0, lbOpen = false;
  var scale = 1, panX = 0, panY = 0;
  var isDragging = false, dragStartX, dragStartY, panStartX, panStartY;
  var pinching = false, pinchStartScale, pinchStartDist;
  var lastTap  = 0;
  var swipeStartX = 0, swipeStartY = 0;
  /* Phase 2.2.1 — history entry (same URL) so Back closes the viewer first;
     opener element for focus return; vertical-swipe tracking for close */
  var histPushed = false, opener = null, swipeDY = 0, swipeVertical = false;

  /* WebP support — lets the viewer load the lightweight WebP twin at full
     resolution instead of the multi-MB JPG fallback baked into <img src>. */
  var _c = document.createElement('canvas');
  var WEBP_OK = !!(_c.getContext && _c.getContext('2d') &&
    _c.toDataURL('image/webp').indexOf('data:image/webp') === 0);

  /* Resolve the full-resolution source for the museum viewer.
     The thumbnail's src already points at the FULL image (scaled down by CSS),
     so we keep full resolution and only swap the extension to WebP. Every JPG
     under assets/images/ has a generated .webp twin, so this is always safe. */
  function fullResSrc(img) {
    if (img.dataset.lbSrc) return img.dataset.lbSrc;
    var s = img.getAttribute('src') || img.src;
    if (WEBP_OK && /\.jpe?g(\?|#|$)/i.test(s)) {
      return s.replace(/\.jpe?g(\?|#|$)/i, '.webp$1');
    }
    return s;
  }

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
    opener = groups[gIdx].images[iIdx];
    /* Same URL, no hash: the page address and title never change, so no
       page view is created — Back simply closes the viewer first. */
    if (!histPushed && window.history && typeof history.pushState === 'function') {
      try { history.pushState({ vacaLb: true }, '', window.location.href); histPushed = true; } catch (e) {}
    }
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

  /* Public close (button, backdrop, Escape, swipe-down): if the viewer added a
     history entry, step back through it — the popstate handler then closes. */
  function lbCloseViewer() {
    if (!lbOpen) return;
    if (histPushed) { histPushed = false; history.back(); return; }
    lbCloseNow();
  }
  window.addEventListener('popstate', function () {
    histPushed = false;
    if (lbOpen) lbCloseNow();
  });

  function lbCloseNow() {
    lbOpen = false;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-open');
    resetTransform(false);
    lbMuseumFrame.style.transform = ''; lbMuseumFrame.style.opacity = '';
    setTimeout(function () {
      if (!lbOpen) { lbImg.removeAttribute('src'); lbImg.classList.remove('is-loaded'); }
    }, 300);
    /* Return focus to the image that opened the viewer, without scrolling */
    if (opener && typeof opener.focus === 'function') {
      try { opener.focus({ preventScroll: true }); } catch (e) { opener.focus(); }
    }
  }

  function loadSlide(gIdx, iIdx) {
    var srcImg   = groups[gIdx].images[iIdx];
    var hiResSrc = fullResSrc(srcImg);
    var cap      = srcImg.alt || '';
    var total    = groups[gIdx].images.length;
    var multi    = total > 1;
    resetTransform(false);
    lbImg.classList.remove('is-loaded');
    lbLoader.classList.add('is-visible');
    /* Display only: EN labels use " -- " — shown as an em dash. The image alt
       (also stored for the enquiry context) is left exactly as it was. */
    var isVis = !!(srcImg.closest && srcImg.closest('.is-visualisation'));
    var shown = cap.replace(/\s--\s/g, ' — ');
    /* The tag says it — drop the long "(room visualisation…)" note from the
       displayed caption only (alt text unchanged) */
    if (isVis) shown = shown.replace(/\s*\((?:room visualisation|visualizzazione d.ambiente)[^)]*\)/i, '');
    lbCaption.textContent = shown;
    if (isVis) {
      var tag = document.createElement('span');
      tag.className = 'lb-vis';
      tag.textContent = LBT.vis;
      lbCaption.appendChild(document.createTextNode(' '));
      lbCaption.appendChild(tag);
    }
    lbCounter.textContent = multi ? (iIdx + 1) + ' / ' + total : '';
    lbDots.innerHTML = '';
    if (multi && total <= 12) {
      for (var d = 0; d < total; d++) {
        var dot = document.createElement('span');
        dot.className = 'lb-dot' + (d === iIdx ? ' is-active' : '');
        lbDots.appendChild(dot);
      }
    }
    lbPrev.classList.toggle('is-hidden', !(multi && iIdx > 0));
    lbNext.classList.toggle('is-hidden', !(multi && iIdx < total - 1));
    /* Show thumb immediately if cached — use currentSrc so we reuse the
       already-loaded WebP rendition rather than kicking off a JPG download */
    if (srcImg.complete && srcImg.naturalWidth) {
      lbImg.src = srcImg.currentSrc || srcImg.src; lbImg.alt = cap;
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
      /* Keyboard: focusable trigger, Enter/Space opens (focus returns here on close) */
      if (!isInsideLink(img) && !img.hasAttribute('tabindex')) {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', (img.alt ? img.alt + ' — ' : '') + LBT.open);
        img.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpenAt(gIdx, iIdx); }
        });
      }
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
    if (e.key === 'Tab') {
      /* Keep focus inside the viewer while it is open */
      var f = [lbClose, lbPrev, lbNext].filter(function (b) { return !b.classList.contains('is-hidden'); });
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      return;
    }
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
      swipeDY = 0; swipeVertical = false;
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
    } else if (!pinching && e.touches.length === 1 && scale <= 1) {
      /* Swipe down to close (not zoomed): the frame follows the finger */
      var mdx = e.touches[0].clientX - swipeStartX;
      var mdy = e.touches[0].clientY - swipeStartY;
      if (swipeVertical || (mdy > 12 && Math.abs(mdy) > Math.abs(mdx) * 1.2)) {
        swipeVertical = true;
        swipeDY = Math.max(0, mdy);
        e.preventDefault();
        lbMuseumFrame.style.transition = 'none';
        lbMuseumFrame.style.transform = 'translateY(' + (swipeDY * 0.6) + 'px)';
        lbMuseumFrame.style.opacity = String(Math.max(0.35, 1 - swipeDY / 500));
      }
    }
  }, { passive: false });

  lbImgContainer.addEventListener('touchend', function (e) {
    if (pinching) { pinching = false; }
    if (isDragging) { isDragging = false; lbImgContainer.classList.remove('is-dragging'); }
    if (swipeVertical) {
      swipeVertical = false;
      lbMuseumFrame.style.transition = '';
      if (swipeDY > 90) { lbCloseViewer(); }
      else { lbMuseumFrame.style.transform = ''; lbMuseumFrame.style.opacity = ''; }
      swipeDY = 0;
      return;
    }
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
  var sessionKeys = [
    'vaca_intent_score', 'vaca_lead_source', 'vaca_page_visited',
    'vaca_interaction_type', 'vaca_last_artwork',
    'vaca_session_id', 'vaca_session_start', 'vaca_pages_visited'
  ];
  try { localStorage.removeItem('vaca_cookie_consent'); } catch (e) {}
  try { localStorage.removeItem('vaca_visitor_id'); } catch (e) {}
  sessionKeys.forEach(function (k) { try { sessionStorage.removeItem(k); } catch (e) {} });
  console.log('[VaCa] All cookie, session and visitor data cleared.');
  return 'Done — reload the page to see the cookie consent banner.';
};

/* ================================================================
   SECTION 7 — FAQ ACCORDION
   Toggles .open class on .faq-item when .faq-question is clicked.
   CSS handles the expand animation via max-height transition.
   Only one item open at a time (accordion behaviour).
   ================================================================ */
(function () {
  'use strict';

  function initFaq () {
    var questions = document.querySelectorAll('.faq-question');
    if (!questions.length) return;

    questions.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        if (!item) return;

        var isOpen = item.classList.contains('open');

        /* Close all open items */
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
          var icon = el.querySelector('.faq-icon');
          if (icon) icon.textContent = '+';
        });

        /* If clicked item was closed, open it */
        if (!isOpen) {
          item.classList.add('open');
          var icon = btn.querySelector('.faq-icon');
          if (icon) icon.textContent = '×';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaq);
  } else {
    initFaq();
  }
})();

/* ================================================================
   SECTION 8 — VISITOR IDENTITY & SESSION TRACKING
   Generates persistent visitor_id (localStorage UUID) and per-session
   session_id (sessionStorage UUID). Counts pages visited and records
   session start time — used by Cookie Intelligence CRM pipeline.
   ================================================================ */
(function () {
  'use strict';

  function uuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  try {
    /* Visitor ID — survives across sessions (localStorage) */
    if (!localStorage.getItem('vaca_visitor_id')) {
      localStorage.setItem('vaca_visitor_id', uuid4());
    }
    /* Session ID — new each tab/session */
    if (!sessionStorage.getItem('vaca_session_id')) {
      sessionStorage.setItem('vaca_session_id',    uuid4());
      sessionStorage.setItem('vaca_session_start', String(Date.now()));
      sessionStorage.setItem('vaca_pages_visited', '1');
    } else {
      /* Increment page counter on each subsequent page load */
      var pv = parseInt(sessionStorage.getItem('vaca_pages_visited') || '1');
      sessionStorage.setItem('vaca_pages_visited', String(pv + 1));
    }
  } catch (e) {}
})();

/* ================================================================
   SECTION 9 — COLLECTION FILTERS
   Shared by collection.html and it/collezione.html. Buttons carry a
   language-neutral key (data-filter="portraits" …); cards carry one or
   more keys in data-category. Labels can differ per language.
   Hidden cards get the `hidden` attribute (removed from layout, from the
   tab order and from assistive tech). The last visible card is flagged
   .is-row-orphan so the tablet layout can centre a lone last card for
   any filtered set, not just the full list.
   ================================================================ */
(function () {
  'use strict';

  var bar = document.querySelector('.filter-bar[data-filter-for]');
  if (!bar) return;
  var grid = document.getElementById(bar.getAttribute('data-filter-for'));
  if (!grid) return;

  var buttons = Array.prototype.slice.call(bar.querySelectorAll('[data-filter]'));
  var cards   = Array.prototype.slice.call(grid.querySelectorAll('[data-category]'));
  if (!buttons.length || !cards.length) return;

  grid.classList.add('is-filterable');

  function apply(key) {
    var visible = [];
    cards.forEach(function (card) {
      var cats = (card.getAttribute('data-category') || '').split(/\s+/);
      var show = key === 'all' || cats.indexOf(key) !== -1;
      if (show) { card.removeAttribute('hidden'); visible.push(card); }
      else      { card.setAttribute('hidden', ''); }
      card.classList.remove('is-row-orphan');
    });
    if (visible.length % 2 === 1) visible[visible.length - 1].classList.add('is-row-orphan');

    buttons.forEach(function (btn) {
      var on = btn.getAttribute('data-filter') === key;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-filter]');
    if (!btn || !bar.contains(btn)) return;
    apply(btn.getAttribute('data-filter'));
  });

  var initial = bar.querySelector('[data-filter][aria-pressed="true"]');
  apply(initial ? initial.getAttribute('data-filter') : 'all');
})();

/* ================================================================
   SECTION 10 — LOCAL STAGING MODE
   Unfinished work (photo placeholders, planned blocks, status labels)
   is hidden by CSS unless <html> has .is-staging. That class is set
   here ONLY when both are true:
     1. the page is served from a local host (localhost, 127.0.0.1,
        ::1, a private LAN address, or opened as a file), and
     2. the owner opted in with ?staging=1 (remembered in localStorage
        for that local address; ?staging=0 turns it off).
   On any public domain this section returns immediately: staging.js
   is never requested and ?staging=1 has no effect.
   ================================================================ */
(function () {
  var h = location.hostname;
  var local = location.protocol === 'file:' ||
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]' ||
    /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  if (!local) return;

  var KEY = 'vaca_staging';
  try {
    if (/[?&]staging=1(&|$)/.test(location.search)) localStorage.setItem(KEY, '1');
    else if (/[?&]staging=0(&|$)/.test(location.search)) localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) !== '1') return;
  } catch (e) { return; }

  document.documentElement.classList.add('is-staging');
  var me = document.currentScript || document.querySelector('script[src*="main.js"]');
  var base = me ? me.src.replace(/main\.js.*$/, '') : 'assets/js/';
  var s = document.createElement('script');
  s.src = base + 'staging.js?t=' + Date.now();   /* local only: always fresh */
  document.body.appendChild(s);
})();
