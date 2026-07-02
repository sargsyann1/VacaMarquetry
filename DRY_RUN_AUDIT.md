# VaCa MCP Worker — DRY RUN Audit Report
**Date:** 2026-06-29  
**Mode:** DRY RUN only — no Airtable writes performed  
**Source verified:** Live Airtable Leads schema (`tblCOVYuKMZq28Usi`) pulled direct via API

---

## Test Results: 19/20 PASS

```
✅ F01  WA hot (artwork context)
✅ F02  Artwork inquiry valid
❌ F03  Portrait inquiry full data         ← spec error, not code error (see below)
✅ F04  Contact form clean
✅ F05  Cookie high intent (score 5)       ← ENUM FAILURES detected (no write in dry_run)
✅ F06  Artwork wrong enum fix             ← ENUM FAILURE detected (Organic)
✅ F07  Cookie lead_type="Cookie Accept"   ← ENUM FAILURES detected
✅ F08  Missing email (artwork)            ← correctly rejected
✅ F09  Invalid email format               ← correctly rejected
✅ F10  Missing artwork_slug               ← correctly rejected
✅ F11  Intent score out of range          ← correctly rejected
✅ F12  Empty name                         ← correctly rejected
✅ F13  Cookie missing visitor_id          ← correctly rejected
✅ F14  Unknown lead_source               ← accepted, warning emitted ✓
✅ F15  Portrait missing subject_type      ← accepted, warning emitted ✓
✅ F16  WA no email → leads_crm
✅ F17  Cookie low intent → analytics_only
✅ F18  Hot artwork lead → collector_crm
✅ F19  Portrait budget=5000 → collector_crm
✅ F20  Cookie score=0 → analytics_only
```

---

## F03 — False Fail (Spec Error, Not a Code Bug)

**What happened:**  
Fixture F03 expected `heat: '🔥 Hot'` for a portrait inquiry with `budget: '3500'` and no `intent_score`.

**Actual scorer output:** `🟡 Warm` (score 5)

**Trace:**
```
base           = 0      (no intent_score in payload)
portrait bonus = +3
budget bonus   = +2     (3500 > 0)
scaled         = 5      → Warm
```

**The spec's comment** said "+3 portrait bonus, +2 budget = intent_score_scaled: 7" — that's a **arithmetic error in the spec**. 0 + 3 + 2 = 5, not 7.

**Scorer code is correct.**

**Real-world note:** A real portrait inquiry from the website would carry `intent_score: 2` from sessionStorage (portrait page view = score 2). That gives `2 + 3 + 2 = 7 → Hot`. The fixture didn't include a page-level score. Update fixture F03 to either include `intent_score: 2` or change expected heat to `🟡 Warm`.

---

## CRITICAL — Enum Mismatches (Would Break All Airtable Writes)

These values are produced by the normalizer but **do not exist in the real Airtable schema**. Without `typecast: true`, every affected record write returns a 422 error.

### Issue 1 — `lead_type: "Website Visitor"` does not exist

| | Value |
|---|---|
| **Worker sends** | `"Website Visitor"` |
| **Airtable has** | `"Cookie Accept"` |
| **Affected flows** | All cookie consent records (F05, F07, F17, F20) |

`enums.js` maps `'Cookie Accept' → 'Website Visitor'` and `DEFAULTS.cookie_consent.lead_type = 'Website Visitor'` — but `"Website Visitor"` is not a choice in the Airtable Lead Type select field. The existing Make.com cookie scenario hardcodes `"Cookie Accept"`, which IS in Airtable. **Revert to `"Cookie Accept"`.**

### Issue 2 — `lead_source: "Organic"` does not exist

| | Value |
|---|---|
| **Worker sends** | `"Organic"` |
| **Airtable has** | `"Website Organic"` |
| **Affected flows** | Cookie consent (all), artwork inquiry after `"Collection"` normalization |

`ENUM_MAPS.lead_source` maps both `'Collection'` and `'Website Organic'` → `'Organic'` — but `"Organic"` is not an Airtable choice. `"Website Organic"` IS. Additionally, `"Collection"` is a valid Airtable Lead Source option that should be preserved, not remapped. **Fix:** `"Organic"` → `"Website Organic"` in enums; keep `"Collection"` as-is.

### Issue 3 — `lead_source: "Portrait Page"` does not exist

| | Value |
|---|---|
| **Worker sends** | `"Portrait Page"` |
| **Airtable has** | `"Portrait Inquiry"` |
| **Affected flows** | All portrait inquiry records (F03, F15, F19) |

`DEFAULTS.portrait_inquiry.lead_source = 'Portrait Page'` and `ENUM_MAPS.lead_source` has `'Portrait Page': 'Portrait Page'` (identity, no fix). **Fix:** change to `"Portrait Inquiry"` throughout.

### Issue 4 — `interaction_type: "Cookie Accept"` does not exist

| | Value |
|---|---|
| **Worker sends** | `"Cookie Accept"` |
| **Airtable has** | WhatsApp Click, Artwork Zoom, Form Submit, NFS Page View, Collection View, Exhibition View, Contact Form |
| **Affected flows** | All cookie consent records |

`DEFAULTS.cookie_consent.interaction_type = 'Cookie Accept'` and `ENUM_MAPS.interaction_type` maps `'Cookie Accept' → 'Cookie Accept'` (identity). Neither `"Cookie Accept"` nor any equivalent exists in the Airtable Interaction Type enum. **Fix:** use `"Page View"` (add this option to Airtable) or `"Form Submit"` — or add `"Cookie Accept"` to the Airtable enum. Recommended: add `"Cookie Accept"` to Airtable Interaction Type field.

### Issue 5 — `interaction_type: "Form Submit"` normalizes away valid "Contact Form"

The normalizer maps `"Contact Form" → "Form Submit"`. However, `"Contact Form"` IS a valid Airtable Interaction Type option (confirmed in schema). This normalization is **unnecessary and removes valid signal** — contact form submissions are distinct from other form submits. **Fix:** remove this mapping from ENUM_MAPS.interaction_type. Keep "Contact Form" as-is.

---

## HIGH — Code Gaps vs Spec

### Gap 1 — No `typecast: true` in Airtable write

`writer.js` sends:
```javascript
body: JSON.stringify({ records: [{ fields }] })
```

Every Make.com scenario uses `typecast: true` to allow flexible enum matching. Without it, any unrecognized select value returns a 422. Even after fixing the enum mismatches above, this is a safety net that should be present.

**Fix:** Add to writer.js:
```javascript
body: JSON.stringify({ records: [{ fields }], typecast: true })
```

Wait — Airtable API does not accept `typecast` at the top level of a POST. It goes on each record: `{ fields, ... }` or as a query param. Actually for Airtable REST API v0, the correct way is:
```javascript
body: JSON.stringify({ records: [{ fields }] })
// and add ?typecast=true to the URL:
`https://api.airtable.com/v0/${baseId}/${tableId}?typecast=true`
```
**Fix:** Append `?typecast=true` to the Airtable API URL in `createRecord()`.

### Gap 2 — Telegram alert not implemented

`router.js` correctly sets `alert: true` for hot leads and portrait inquiries. `writer.js` reads `routing.destination` but never reads `routing.alert`. No Telegram message is ever sent.

**Required:** Add Telegram `sendMessage` call in `writer.js` when `routing.alert === true` and `mode !== 'dry_run'`. Use `env.TELEGRAM_CHAT_ID` (already in `wrangler.toml`) and `env.TELEGRAM_BOT_TOKEN` (needs adding as a secret).

### Gap 3 — Dead letter destination never routed to

The spec defines a `dead_letter` route for leads with no contact vector. `router.js` never returns `destination: 'dead_letter'`. Currently, a WhatsApp lead with no `source_page`, no `email`, and no `incoming_message` routes to `leads_crm` as a standard lead.

Low risk for now — validator blocks the worst cases. Add dead-letter logic before shadow mode.

### Gap 4 — No retry on 429 (rate limit)

`createRecord()` makes one attempt and throws on any non-200 response. Airtable limits to 5 writes/second per base. Under load (e.g., portrait + leads_crm dual-write), back-to-back 429s would silently fail.

**Fix:** Wrap `createRecord` with one retry after 1s delay on 429.

### Gap 5 — `also_write` uses LEADS_FIELD_MAP for Collector CRM table

When a portrait inquiry routes to `collector_crm` with `also_write: 'leads_crm'`, the writer calls `toAirtableFields()` for both tables. `toAirtableFields()` maps payload keys to **Leads table column names** (e.g., "Lead Score", "🌡 Lead Heat"). The Collector CRM table (`tbltxJzIzrSzLWc3m`) has different field names and structure. Writing Leads-specific fields to the Collector table will either error or be silently ignored.

**For now:** safe in dry_run. Before shadow mode, audit Collector CRM field names and create a separate `toCollectorFields()` mapper, or accept that only common fields (Name, Email, etc.) are written to Collector CRM.

### Gap 6 — wrangler.toml has three unresolved placeholder IDs

```toml
AIRTABLE_TEST_BASE_ID     = "appSHADOW_ID_REPLACE_ME"   ← starts with "app" → safety check passes but base doesn't exist
AIRTABLE_ANALYTICS_TABLE_ID = "tblANALYTICS_REPLACE_ME"
AIRTABLE_DEADLETTER_TABLE_ID = "tblDEADLETTER_REPLACE_ME"
```

`"appSHADOW_ID_REPLACE_ME".startsWith('app')` returns `true` — so the safety guard in `writer.js` passes, but the Airtable API call would return a 404. Safe in dry_run mode only. Must be resolved before shadow mode.

---

## LOW — Spec Inconsistencies

### `"Interaction Type: Contact Form"` in spec described as a bug

The audit report (SYSTEM_AUDIT.md) listed BRK-04: artwork inquiry sets Interaction Type to "Contact Form" which "should be Form Submit". The live Airtable schema confirms "Contact Form" IS a valid Interaction Type choice. The "bug" was a misreading — "Contact Form" is intentionally distinct. The normalizer should NOT remap it.

### Cookie `interaction_type: "Cookie Accept"` is the real issue

This IS missing from Airtable's Interaction Type enum. Two options:
- Add "Cookie Accept" to Airtable Interaction Type field (preferred — preserves data granularity)
- Map to "Page View" (no information loss, works today)

---

## Summary: What Needs Fixing Before Any Airtable Write

| # | Issue | Severity | File | Fix |
|---|-------|----------|------|-----|
| 1 | `lead_type: "Website Visitor"` → not in Airtable | **CRITICAL** | enums.js | Change to `"Cookie Accept"` |
| 2 | `lead_source: "Organic"` → not in Airtable | **CRITICAL** | enums.js | Change to `"Website Organic"` |
| 3 | `lead_source: "Portrait Page"` → not in Airtable | **CRITICAL** | enums.js | Change to `"Portrait Inquiry"` |
| 4 | `interaction_type: "Cookie Accept"` → not in Airtable | **CRITICAL** | enums.js + Airtable | Add option to Airtable OR map to "Page View" |
| 5 | `interaction_type: "Contact Form"` wrongly normalized away | **HIGH** | enums.js | Remove mapping — keep as-is |
| 6 | No `typecast=true` on Airtable writes | **HIGH** | writer.js | Add `?typecast=true` to URL |
| 7 | Telegram alert not implemented | **HIGH** | writer.js | Add Telegram POST on `alert === true` |
| 8 | wrangler.toml placeholder IDs | **HIGH** | wrangler.toml | Replace before shadow mode |
| 9 | `also_write` uses wrong field map for Collector CRM | **HIGH** | writer.js | Audit Collector schema before dual-write |
| 10 | No 429 retry | **MEDIUM** | writer.js | Add 1-retry with 1s delay |
| 11 | Dead letter routing missing | **MEDIUM** | router.js | Add no-contact-vector check |
| 12 | Fixture F03 expected heat wrong | **LOW** | fixtures.js | Fix expected heat or add intent_score:2 |

**Items 1–6 must be fixed before shadow mode. Items 7–9 before production.**

---

## What Is Working Correctly

- All 8 failure cases correctly rejected (F08–F13) ✓
- Routing logic correct for all 7 routing-specific fixtures ✓
- Scorer correct (portrait bonus, budget bonus, artwork bonus, WA scaling) ✓
- Cookie country/city correctly stripped from payload (BRK-03 fix working) ✓  
- source_url aliased to source_page ✓  
- artwork_context aliased to artwork_title ✓  
- email lowercased ✓
- Unknown lead_source generates warning without rejection ✓
- portrait_inquiry missing subject_type generates warning without rejection ✓
- Mode enforcement: `shadow` default in wrangler.toml ✓
- Safety guard on unknown modes ✓
- Safety guard on invalid base ID format ✓ (but see Gap 6 — placeholder bypasses it)
