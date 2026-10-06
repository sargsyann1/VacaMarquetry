/* ================================================================
   VaCa Marquetry — attribution.js  v2
   Phase 1 — Marketing Attribution Collector
   Phase 2 — Payload helper (forms + WhatsApp), last-touch primary
   Phase 4 — Google Ads conversion layer (vacaTrackConversion)

   Captures marketing attribution on landing and persists it to
   localStorage under `vaca_attribution`:

     • first_touch — WRITE ONCE. The original visitor attribution,
       never overwritten on later visits.
     • last_touch  — initialised on first visit, then refreshed on
       any later visit that carries NEW campaign parameters
       (gclid / gbraid / wbraid / fbclid / any utm_*). Visits with
       no parameters preserve the previous last_touch.
     • last_click  — (v2) most recent visit carrying a Google click ID
       (gclid / gbraid / wbraid); only replaced by a newer click.

   Fully self-contained. Touches only the `vaca_attribution` key and
   never interferes with the cookie / visitor / session system in
   main.js. Loads before main.js on every page.
   ================================================================ */
(function () {
  'use strict';

  var KEY = 'vaca_attribution';

  /* Campaign parameters read from the URL query string */
  var PARAM_FIELDS = [
    'gclid', 'gbraid', 'wbraid', 'fbclid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
  ];

  function nowISO() {
    try { return new Date().toISOString(); } catch (e) { return ''; }
  }

  /* Read the campaign parameters from the current URL */
  function readParams() {
    var out = {};
    var qs = null;
    try { qs = new URLSearchParams((window.location && window.location.search) || ''); }
    catch (e) { qs = null; }
    for (var i = 0; i < PARAM_FIELDS.length; i++) {
      var k = PARAM_FIELDS[i];
      var v = qs ? qs.get(k) : null;
      out[k] = v ? String(v).trim() : '';
    }
    return out;
  }

  /* Build a full touch snapshot: params + browser context */
  function buildTouch() {
    var t   = readParams();
    var loc = window.location || {};
    t.referrer     = (typeof document !== 'undefined' && document.referrer) ? document.referrer : '';
    t.landing_page = loc.href || '';
    t.hostname     = loc.hostname || '';
    t.pathname     = loc.pathname || '';
    return t;
  }

  /* Does this touch carry any campaign parameter? */
  function hasCampaignData(touch) {
    for (var i = 0; i < PARAM_FIELDS.length; i++) {
      if (touch[PARAM_FIELDS[i]]) return true;
    }
    return false;
  }

  function clone(src, extra) {
    var out = {}, k;
    for (k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k]; }
    if (extra) { for (k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k]; } }
    return out;
  }

  function safeParse(raw) {
    if (!raw) return null;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : null; }
    catch (e) { return null; }
  }

  try {
    if (typeof localStorage === 'undefined') return;

    var store   = safeParse(localStorage.getItem(KEY)) || {};
    var current = buildTouch();
    var now     = nowISO();
    var hasData = hasCampaignData(current);
    var changed = false;

    /* first_touch — WRITE ONCE, never overwritten */
    if (!store.first_touch) {
      store.first_touch = clone(current, { first_visit_at: now });
      changed = true;
    }

    /* last_touch — set on first visit; afterwards only refresh when
       new campaign parameters are present. No params => preserve. */
    if (!store.last_touch) {
      store.last_touch = clone(current, { updated_at: now });
      changed = true;
    } else if (hasData) {
      store.last_touch = clone(current, { updated_at: now });
      changed = true;
    }

    /* last_click — most recent touch carrying a Google click ID
       (gclid / gbraid / wbraid). Only replaced by a newer click, so a
       later UTM-only visit (e.g. Instagram) cannot erase the ad click
       that Google Ads needs for conversion upload. */
    if (current.gclid || current.gbraid || current.wbraid) {
      store.last_click = clone(current, { updated_at: now });
      changed = true;
    }

    if (changed) localStorage.setItem(KEY, JSON.stringify(store));

    /* Read-only convenience accessor for debugging / later phases.
       Does not mutate stored state. */
    try { window.vacaAttribution = store; } catch (e) {}

  } catch (e) {
    /* Never break the page or the cookie/session system */
    try { if (window.console) window.console.warn('[VaCa attribution]', e && e.message); } catch (e2) {}
  }

  /* ----------------------------------------------------------------
     Phase 2 — Form-binding helper  (v2: last-touch primary fields)
     Returns a FLAT, string-only snapshot of stored attribution, ready
     to merge into an outgoing payload (JSON object or FormData) —
     used by every form AND the WhatsApp button.
     Reads localStorage fresh at call time; missing values become "".
     Never throws — safe to call from any submit / click handler.

     Primary fields (gclid, gbraid, wbraid, fbclid, utm_*) describe the
     touch that should get conversion credit:
       • UTMs come from last_touch when it carries campaign data,
         otherwise from first_touch (never mixed across touches).
       • Click IDs come from last_click (most recent Google ad click),
         falling back to first_touch, so a returning visitor's latest
         paid click is uploaded even after later organic/UTM visits.
     These keys are already mapped into Airtable by the Make scenarios
     (GCLID ← gclid, UTM * ← utm_*), so the CRM GCLID field now holds
     the latest click without any Make change.
     first_* keys keep the original first-touch values as history.
     referrer / first_touch_landing_page / first_visit_at stay
     first-touch (origin of the relationship), as in v1.
     ---------------------------------------------------------------- */
  window.vacaAttributionPayload = function () {
    var out = {
      gclid: '', gbraid: '', wbraid: '', fbclid: '',
      utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '',
      attribution_touch: '', click_id_captured_at: '',
      referrer: '', first_touch_landing_page: '', first_visit_at: '',
      first_gclid: '', first_gbraid: '', first_wbraid: '', first_fbclid: '',
      first_utm_source: '', first_utm_medium: '', first_utm_campaign: '', first_utm_term: '', first_utm_content: '',
      last_gclid: '', last_gbraid: '', last_wbraid: '', last_fbclid: '',
      last_utm_source: '', last_utm_medium: '', last_utm_campaign: '',
      last_utm_term: '', last_utm_content: '', last_referrer: '', last_landing_page: '', last_updated_at: '',
      attribution_json: '',
      page_language: '',
      visitor_id: '', session_id: ''
    };
    try { out.page_language = (document.documentElement.getAttribute('lang') || '').toLowerCase(); } catch (e) {}
    /* Visitor / Session identity (set by main.js §8; independent of attribution) */
    try { out.visitor_id = (localStorage.getItem('vaca_visitor_id')) || ''; } catch (e) {}
    try { out.session_id = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vaca_session_id')) || ''; } catch (e) {}
    try {
      if (typeof localStorage === 'undefined') return out;
      var raw = localStorage.getItem(KEY);
      if (!raw) return out;
      var store = safeParse(raw);
      if (!store) return out;
      var f = store.first_touch || {};
      var l = store.last_touch  || {};

      /* History — first touch, unchanged forever */
      out.first_gclid = f.gclid || ''; out.first_gbraid = f.gbraid || ''; out.first_wbraid = f.wbraid || ''; out.first_fbclid = f.fbclid || '';
      out.first_utm_source = f.utm_source || ''; out.first_utm_medium = f.utm_medium || ''; out.first_utm_campaign = f.utm_campaign || '';
      out.first_utm_term = f.utm_term || ''; out.first_utm_content = f.utm_content || '';
      out.referrer = f.referrer || ''; out.first_touch_landing_page = f.landing_page || ''; out.first_visit_at = f.first_visit_at || '';

      /* Latest campaign touch */
      out.last_gclid = l.gclid || ''; out.last_gbraid = l.gbraid || ''; out.last_wbraid = l.wbraid || ''; out.last_fbclid = l.fbclid || '';
      out.last_utm_source = l.utm_source || ''; out.last_utm_medium = l.utm_medium || '';
      out.last_utm_campaign = l.utm_campaign || ''; out.last_utm_term = l.utm_term || ''; out.last_utm_content = l.utm_content || '';
      out.last_referrer = l.referrer || ''; out.last_landing_page = l.landing_page || ''; out.last_updated_at = l.updated_at || '';

      /* Primary — credited touch */
      var useLast = hasCampaignData(l);
      var t = useLast ? l : f;
      out.attribution_touch = useLast ? 'last' : 'first';
      out.utm_source = t.utm_source || ''; out.utm_medium = t.utm_medium || ''; out.utm_campaign = t.utm_campaign || '';
      out.utm_term = t.utm_term || ''; out.utm_content = t.utm_content || '';

      /* Click IDs — most recent Google click (store.last_click, v2), falling
         back to first_touch for data written by v1 before last_click existed */
      var k = store.last_click || ((l.gclid || l.gbraid || l.wbraid) ? l : null);
      var c = k || f;
      out.gclid  = c.gclid  || '';
      out.gbraid = c.gbraid || '';
      out.wbraid = c.wbraid || '';
      out.fbclid = l.fbclid || f.fbclid || '';
      if (out.gclid || out.gbraid || out.wbraid) {
        out.click_id_captured_at = k ? (k.updated_at || '') : (f.first_visit_at || '');
      }

      out.attribution_json = raw;
    } catch (e) {}
    return out;
  };

  /* ----------------------------------------------------------------
     Phase 4 — Google Ads conversion layer
     Fill in VACA_ADS once the conversion actions exist in Google Ads
     (Tools → Conversions → tag setup → "Use Google tag"):
       id     — 'AW-XXXXXXXXXX'
       labels — the part after the slash in send_to 'AW-XXXXXXXXXX/<label>'
     While id is empty, NO Google Ads tag is configured and only the
     GA4 events fire (current production behaviour).
     ---------------------------------------------------------------- */
  var VACA_ADS = {
    id: '',                       /* TODO: 'AW-XXXXXXXXXX' */
    labels: {
      portrait_inquiry: '',       /* TODO: primary — portrait form */
      generate_lead:    '',       /* TODO: primary — artwork enquiry form */
      contact_submit:   '',       /* TODO: primary — contact form */
      whatsapp_click:   ''        /* TODO: secondary — WhatsApp click */
    }
  };

  var adsReady = /^AW-\d+$/.test(VACA_ADS.id);
  if (adsReady && typeof window.gtag === 'function') {
    try { window.gtag('config', VACA_ADS.id); } catch (e) {}
  }

  /* Fire a GA4 event and, when configured, the matching Google Ads
     conversion. Drop-in replacement for gtag('event', name, params).
     Never throws. */
  window.vacaTrackConversion = function (eventName, params) {
    params = params || {};
    if (typeof window.gtag !== 'function') return;
    try { window.gtag('event', eventName, params); } catch (e) {}
    var label = VACA_ADS.labels[eventName];
    if (!adsReady || !label) return;
    try {
      var conv = { send_to: VACA_ADS.id + '/' + label };
      if (params.value !== undefined) { conv.value = params.value; conv.currency = params.currency || 'EUR'; }
      if (params.transaction_id)      { conv.transaction_id = params.transaction_id; }
      window.gtag('event', 'conversion', conv);
    } catch (e) {}
  };
})();
