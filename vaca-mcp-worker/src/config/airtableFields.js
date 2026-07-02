/**
 * VaCa Marquetry — Airtable Field Maps
 *
 * Single source of truth. Maps Worker payload key → exact Airtable column name.
 * Field names verified against live schema (appgaZWpeSTTkjoUa) on 2026-06-29.
 *
 * CASE-SENSITIVE. Schema is mixed — some fields lowercase, most Title Case.
 * DO NOT change without updating Airtable first.
 */

// ─── Leads table (tblCOVYuKMZq28Usi) ──────────────────────────────────────────

export const LEADS_FIELD_MAP = {
  name:             'name',
  email:            'email',
  lead_type:        'Lead Type',
  lead_source:      'Lead Source',
  interaction_type: 'Interaction Type',
  status:           'Status',
  lead_score:       'Lead Score',
  lead_heat:        '🌡 Lead Heat',
  message:          'Message',
  incoming_message: 'Incoming Message',
  source_page:      'Source Page',
  submitted_at:     'Submitted At',
  artwork_title:    'Artwork Title',
  artwork_slug:     'Artwork Slug',
  artwork_page_url: 'Artwork Page URL',
  subject_type:     'subject_type',
  portrait_size:    'Portrait Size',
  budget:           'budget',
  occasion:         'Occasion',
  customer_notes:   'Customer Notes',
  visitor_id:       'Visitor ID',
  session_id:       'Session ID',
  device_type:      'Device Type',
  os:               'OS',
  browser:          'Browser',
  pages_visited:    'Pages Visited',
  time_on_site:     'Time on Site (s)',
  scroll_depth:     'Scroll Depth (%)',
  make_run_id:      'Make Run ID'
};

// ─── Collectors CRM (tbltxJzIzrSzLWc3m) ───────────────────────────────────────
// Different schema: primary field is "Full Name", no lead_type/source_page/etc.
// Only map fields that actually exist in this table.

export const COLLECTOR_FIELD_MAP = {
  name:       'Full Name',
  email:      'Email',
  lead_score: 'Lead Score',
  status:     'Status'
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function toLeadsFields(payload) {
  return toFields(payload, LEADS_FIELD_MAP);
}

export function toCollectorFields(payload) {
  return toFields(payload, COLLECTOR_FIELD_MAP);
}

function toFields(payload, map) {
  const fields = {};
  for (const [key, col] of Object.entries(map)) {
    const val = payload[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      fields[col] = val;
    }
  }
  return fields;
}
