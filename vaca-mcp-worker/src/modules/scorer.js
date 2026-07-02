/**
 * VaCa MCP Worker — Lead Scorer
 *
 * Bonus table (non-cookie only):
 *   Portrait Inquiry:        +3
 *   Artwork title present:   +2
 *   Budget > 0:              +2
 *   Artwork Inquiry type:    +1
 *
 * Example: portrait page view sets intent_score=2
 *   2 + 3 (portrait) + 2 (budget) = 7 → Hot
 *
 * Heat: >=7 Hot | 3-6 Warm | 0-2 Cold
 * Lead Score (Airtable rating 1-5): round(scaled/2) clamped 1-5
 */

export function score(leadType, normalized) {
  let base = Number(normalized.intent_score ?? 0);
  if (!Number.isFinite(base) || base < 0) base = 0;
  if (base > 10) base = 10;

  let bonus = 0;

  if (leadType !== 'cookie_consent') {
    if (leadType === 'portrait_inquiry')   bonus += 3;
    if (normalized.artwork_title)          bonus += 2;
    if (normalized.budget && Number(String(normalized.budget).replace(/[^0-9.]/g, '')) > 0) bonus += 2;
    if (leadType === 'artwork_inquiry')    bonus += 1;
  }

  const scaled    = leadType === 'cookie_consent'
    ? base
    : Math.min(10, Math.max(0, base + bonus));

  const heat      = scaled >= 7 ? '🔥 Hot' : scaled >= 3 ? '🟡 Warm' : '❄️ Cold';
  const leadScore = Math.max(1, Math.min(5, Math.round(scaled / 2)));

  return {
    ...normalized,
    intent_score_raw:    base,
    intent_score_scaled: scaled,
    lead_score:          leadScore,
    lead_heat:           heat
  };
}
