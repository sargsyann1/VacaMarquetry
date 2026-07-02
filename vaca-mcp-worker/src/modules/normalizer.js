/**
 * VaCa MCP Worker — Normalizer
 * Runs after validation. Never rejects — only cleans and repairs.
 */

import { DEFAULTS, ALLOWED, LEGACY_MAP } from '../config/enums.js';

const STRIP = {
  cookie_consent: ['country', 'city', 'timezone'],
  _all: ['intent_score_raw', 'intent_score_scaled', '_files', 'source_url', 'artwork_url', 'artwork_context', 'timestamp']
};

export function normalize(leadType, raw) {
  const payload  = { ...raw };
  const warnings = [];

  if (payload.source_url   && !payload.source_page)      payload.source_page     = payload.source_url;
  if (payload.artwork_url  && !payload.artwork_page_url)  payload.artwork_page_url = payload.artwork_url;
  if (payload.artwork_context && !payload.artwork_title)  payload.artwork_title   = payload.artwork_context;
  if (payload.timestamp    && !payload.submitted_at)     payload.submitted_at    = payload.timestamp;

  const defaults = DEFAULTS[leadType] || {};
  for (const [k, v] of Object.entries(defaults)) {
    if (!payload[k]) payload[k] = v;
  }

  for (const field of ['lead_type', 'lead_source', 'interaction_type']) {
    const legacyMap = LEGACY_MAP[field];
    if (payload[field] && legacyMap?.[payload[field]]) {
      const old = payload[field];
      payload[field] = legacyMap[payload[field]];
      warnings.push({ field, msg: `Legacy value '${old}' normalized to '${payload[field]}'`, severity: 'info' });
    }
  }

  for (const field of ['lead_type', 'lead_source', 'interaction_type']) {
    const allowed = ALLOWED[field];
    if (payload[field] && allowed && !allowed.has(payload[field])) {
      const old = payload[field];
      payload[field] = defaults[field] || null;
      warnings.push({
        field,
        msg:      `Unknown value '${old}' not in enum — replaced with '${payload[field]}'`,
        severity: 'warning'
      });
    }
  }

  if (payload.device_type && !ALLOWED.device_type.has(payload.device_type)) {
    payload.device_type = null;
  }

  for (const f of STRIP[leadType] || []) delete payload[f];
  for (const f of STRIP._all)            delete payload[f];

  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string') payload[k] = v.trim();
  }

  if (payload.email) payload.email = payload.email.toLowerCase();
  if (!payload.submitted_at) payload.submitted_at = new Date().toISOString();

  return { payload, warnings };
}
