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
   ============================================================ */
(function () {
  var KEY = 'vaca_cookie_consent';

  try {
    if (localStorage.getItem(KEY)) return; // already decided
  } catch (e) { return; }

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

    banner.style.opacity   = '0';
    banner.style.transform = 'translateY(16px)';
    setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 320);
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

  // Animate in after paint
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
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

  // Analytics click event
  btn.addEventListener('click', function () {
    if (typeof gtag === 'function') {
      gtag('event', 'whatsapp_click', {
        source:  'floating_button',
        phone:   '+393517571986',
        page:    window.location.pathname
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

});
