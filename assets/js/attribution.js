/* ================================================================
   VaCa Marquetry — attribution.js  v1
   Phase 1 — Marketing Attribution Collector

   Captures marketing attribution on landing and persists it to
   localStorage under `vaca_attribution`:

     • first_touch — WRITE ONCE. The original visitor attribution,
       never overwritten on later visits.
     • last_touch  — initialised on first visit, then refreshed on
       any later visit that carries NEW campaign parameters
       (gclid / gbraid / wbraid / fbclid / any utm_*). Visits with
       no parameters preserve the previous last_touch.

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

    if (changed) localStorage.setItem(KEY, JSON.stringify(store));

    /* Read-only convenience accessor for debugging / later phases.
       Does not mutate stored state. */
    try { window.vacaAttribution = store; } catch (e) {}

  } catch (e) {
    /* Never break the page or the cookie/session system */
    try { if (window.console) window.console.warn('[VaCa attribution]', e && e.message); } catch (e2) {}
  }

  /* ----------------------------------------------------------------
     Phase 2 — Form-binding helper.
     Returns a FLAT, string-only snapshot of stored attribution, ready
     to merge into an outgoing form payload (JSON object or FormData).
     Reads localStorage fresh at call time; missing values become "".
     Never throws — safe to call from any form submit handler.
     ---------------------------------------------------------------- */
  window.vacaAttributionPayload = function () {
    var out = {
      gclid: '', gbraid: '', wbraid: '', fbclid: '',
      utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '',
      referrer: '', first_touch_landing_page: '', first_visit_at: '',
      last_gclid: '', last_utm_source: '', last_utm_medium: '', last_utm_campaign: '',
      last_utm_term: '', last_utm_content: '', last_referrer: '', last_landing_page: '', last_updated_at: '',
      attribution_json: '',
      visitor_id: '', session_id: ''
    };
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
      out.gclid = f.gclid || ''; out.gbraid = f.gbraid || ''; out.wbraid = f.wbraid || ''; out.fbclid = f.fbclid || '';
      out.utm_source = f.utm_source || ''; out.utm_medium = f.utm_medium || ''; out.utm_campaign = f.utm_campaign || '';
      out.utm_term = f.utm_term || ''; out.utm_content = f.utm_content || '';
      out.referrer = f.referrer || ''; out.first_touch_landing_page = f.landing_page || ''; out.first_visit_at = f.first_visit_at || '';
      out.last_gclid = l.gclid || ''; out.last_utm_source = l.utm_source || ''; out.last_utm_medium = l.utm_medium || '';
      out.last_utm_campaign = l.utm_campaign || ''; out.last_utm_term = l.utm_term || ''; out.last_utm_content = l.utm_content || '';
      out.last_referrer = l.referrer || ''; out.last_landing_page = l.landing_page || ''; out.last_updated_at = l.updated_at || '';
      out.attribution_json = raw;
    } catch (e) {}
    return out;
  };
})();
