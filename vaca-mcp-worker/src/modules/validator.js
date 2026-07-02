/**
 * VaCa MCP Worker — Schema Validator
 *
 * Returns { valid, errors, warnings }.
 * Errors block the write. Warnings are informational only.
 * Never touches Airtable — pure data inspection.
 *
 * Field aliasing note:
 *   source_url is accepted as a valid alias for source_page in the required-field check.
 *   artwork_url is accepted as alias for artwork_page_url (not required, so no check needed).
 *   Full aliasing is applied in the normalizer step that follows.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE  = /^[a-z0-9-]+$/;

function blank(v)    { return v === undefined || v === null || String(v).trim() === ''; }
function isEmail(v)  { return EMAIL_RE.test(String(v || '').trim()); }
function isUrl(v)    { try { new URL(String(v)); return true; } catch { return false; } }
function inRange(v)  { const n = Number(v); return Number.isFinite(n) && n >= 0 && n <= 10; }
function isSlug(v)   { return SLUG_RE.test(String(v || '')); }

// Known field aliases — accepted in place of the canonical required field
const FIELD_ALIASES = {
  source_page: ['source_url']
};

const REQUIRED = {
  whatsapp:         ['source_page'],
  contact:          ['name', 'email', 'message', 'source_page'],
  artwork_inquiry:  ['name', 'email', 'artwork_title', 'artwork_slug'],
  portrait_inquiry: ['name', 'email'],
  cookie_consent:   ['visitor_id', 'session_id']
};

export function validate(leadType, raw) {
  const errors   = [];
  const warnings = [];

  const required = REQUIRED[leadType];
  if (!required) {
    return {
      valid:    false,
      errors:   [{ field: '_type', msg: `Unknown lead type: "${leadType}"`, severity: 'error' }],
      warnings: []
    };
  }

  for (const field of required) {
    if (blank(raw[field])) {
      // Check if an accepted alias is present
      const aliases = FIELD_ALIASES[field] || [];
      const hasAlias = aliases.some(a => !blank(raw[a]));
      if (!hasAlias) {
        errors.push({ field, msg: `${field} is required`, severity: 'error' });
      }
    }
  }

  if (!blank(raw.email) && !isEmail(raw.email))
    errors.push({ field: 'email', msg: 'Invalid email address', severity: 'error' });

  if (!blank(raw.name) && String(raw.name).trim().length < 2)
    errors.push({ field: 'name', msg: 'Name must be at least 2 characters', severity: 'error' });

  if (!blank(raw.source_page) && !isUrl(raw.source_page))
    errors.push({ field: 'source_page', msg: 'source_page must be a valid URL', severity: 'error' });

  if (!blank(raw.source_url) && !isUrl(raw.source_url))
    errors.push({ field: 'source_url', msg: 'source_url must be a valid URL', severity: 'error' });

  if (!blank(raw.artwork_url) && !isUrl(raw.artwork_url))
    errors.push({ field: 'artwork_url', msg: 'artwork_url must be a valid URL', severity: 'error' });

  if (!blank(raw.artwork_slug) && !isSlug(raw.artwork_slug))
    errors.push({ field: 'artwork_slug', msg: 'artwork_slug must be lowercase alphanumeric with hyphens only', severity: 'error' });

  if (!blank(raw.intent_score) && !inRange(raw.intent_score))
    errors.push({ field: 'intent_score', msg: 'intent_score must be between 0 and 10', severity: 'error' });

  if (leadType === 'contact' && !blank(raw.message) && String(raw.message).trim().length < 10)
    warnings.push({ field: 'message', msg: 'Message is very short (< 10 chars)', severity: 'warning' });

  if (leadType === 'portrait_inquiry' && blank(raw.subject_type))
    warnings.push({ field: 'subject_type', msg: 'Portrait subject unknown — subject_type not provided', severity: 'warning' });

  if (leadType === 'cookie_consent' && blank(raw.intent_score))
    warnings.push({ field: 'intent_score', msg: 'intent_score missing — will default to 0, routes to analytics_only', severity: 'warning' });

  return { valid: errors.length === 0, errors, warnings };
}
