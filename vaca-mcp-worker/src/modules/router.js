/**
 * VaCa MCP Worker — Routing Engine
 *
 * Priority order:
 *   1. No contact vector → dead_letter (non-cookie only)
 *   2. Portrait Inquiry  → collector_crm + leads_crm + Telegram
 *   3. Cookie Consent    → score>=4 leads_crm | score<4 analytics_only
 *   4. Hot (score>=7)    → leads_crm + Telegram
 *   5. Standard          → leads_crm
 */

export function route(leadType, scored) {
  const s          = Number(scored.intent_score_scaled || 0);
  const hasContact = !!(scored.email || scored.incoming_message || scored.source_page);

  if (!hasContact && leadType !== 'cookie_consent') {
    return {
      destination: 'dead_letter',
      alert:       false,
      reason:      'No contact vector — no email, message, or source_page'
    };
  }

  if (leadType === 'portrait_inquiry') {
    return {
      destination: 'collector_crm',
      also_write:  'leads_crm',
      alert:       true,
      alert_level: '🎨 Portrait Inquiry',
      reason:      'Portrait inquiries always escalate to Collector CRM + Leads CRM'
    };
  }

  if (leadType === 'cookie_consent') {
    if (s >= 4) {
      return { destination: 'leads_crm',     alert: false, reason: `High-intent visitor (score ${s} >= 4)` };
    }
    return       { destination: 'analytics_only', alert: false, reason: `Low-intent visitor (score ${s} < 4)` };
  }

  if (s >= 7) {
    return {
      destination: 'leads_crm',
      alert:       true,
      alert_level: '🔥 Hot Lead',
      reason:      `Score ${s} >= 7`
    };
  }

  return {
    destination: 'leads_crm',
    alert:       false,
    reason:      `Standard routing (score ${s})`
  };
}
