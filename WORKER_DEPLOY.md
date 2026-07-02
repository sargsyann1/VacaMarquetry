# VaCa MCP Worker — Deployment Guide

**Status:** All 20 DRY RUN fixtures pass. Ready for shadow mode deployment.

---

## What was built

A production-ready Cloudflare Worker that sits between all 5 webhook sources and Airtable.
Pipeline: **Validate → Normalize → Score → Route → Write**

All 12 issues from DRY_RUN_AUDIT.md have been fixed:

| # | Fix | File |
|---|-----|------|
| 1 | `lead_type: 'Cookie Accept'` (was "Website Visitor") | enums.js |
| 2 | `lead_source: 'Website Organic'` for cookies (was "Organic") | enums.js |
| 3 | `lead_source: 'Portrait Inquiry'` for portraits (was "Portrait Page") | enums.js |
| 4 | `"Contact Form"` NOT remapped to "Form Submit" (valid Airtable value) | enums.js |
| 5 | `LEGACY_MAP` normalizes all old Make.com values to canonical Airtable values | enums.js |
| 6 | `?typecast=true` added to all Airtable API calls | writer.js |
| 7 | 429 retry (one retry, 1.1s delay) | writer.js |
| 8 | Telegram alert fires when `routing.alert === true` | writer.js + telegram.js |
| 9 | `toCollectorFields()` uses safe subset for Collector CRM writes | airtableFields.js |
| 10 | Dead letter route added for no-contact-vector leads | router.js |
| 11 | `source_url` accepted as alias for `source_page` in validator | validator.js |
| 12 | All 20 test fixtures correct — F03 scoring fixed (intent_score=2 + bonuses = 7) | fixtures.js |

---

## Files changed

```
src/
  index.js                   — pipeline entrypoint, CORS, mode logic
  config/
    enums.js                 — ALLOWED sets, DEFAULTS, LEGACY_MAP (4 enum fixes)
    airtableFields.js        — LEADS_FIELD_MAP + COLLECTOR_FIELD_MAP + helpers
  modules/
    validator.js             — required fields, format checks, source_url alias
    normalizer.js            — aliasing, defaults, legacy normalization, enum guard
    scorer.js                — intent_score + bonuses → scaled score + heat
    router.js                — routing matrix + dead_letter rule
    writer.js                — Airtable write (typecast, retry, placeholder guard)
    telegram.js              — NEW: HTML alert to Telegram chat 7890260331
test/
  fixtures.js                — 20 fixtures covering all paths
  runner.js                  — direct module test (no HTTP required)
wrangler.toml                — shadow mode default, placeholder comments
```

---

## Before deploying — required setup

### Step 1: Create shadow base in Airtable

1. Go to airtable.com → Create Base → "VaCa Leads SHADOW"
2. Duplicate the Leads table structure (same fields, no data)
3. Copy the base ID (starts with `app`)
4. Update `wrangler.toml`:

```toml
AIRTABLE_TEST_BASE_ID = "appXXXXXXXXXXXXXX"   # replace placeholder
```

### Step 2: Add "Cookie Accept" to Airtable Interaction Type field

The Worker sends `interaction_type: 'Cookie Accept'` for cookie consent records.
With `?typecast=true` this will auto-create the option on first write — but it's cleaner to add it manually:

1. Open Airtable Leads table
2. Click **Interaction Type** field → Edit field
3. Add option: `Cookie Accept`

### Step 3: Set secrets

```bash
cd vaca-mcp-worker

# Airtable Personal Access Token
# Get from: airtable.com/account → Personal access tokens
# Scopes needed: data.records:write, schema.bases:read
wrangler secret put AIRTABLE_TOKEN

# Telegram Bot Token
# Get from: @BotFather on Telegram
wrangler secret put TELEGRAM_BOT_TOKEN
```

---

## Deploy to shadow mode

```bash
cd vaca-mcp-worker

# Install dependencies (if not done)
npm install

# Deploy to Cloudflare
wrangler deploy

# Confirm deployment URL, e.g.:
# https://vaca-mcp-worker.YOUR-SUBDOMAIN.workers.dev
```

Default mode is `shadow` — all writes go to `AIRTABLE_TEST_BASE_ID`, never PROD.

---

## Test with curl (shadow mode)

Replace `WORKER_URL` with your deployed worker URL.

### WhatsApp lead (Hot)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: dry_run" \
  -H "X-VaCa-Source: whatsapp" \
  -d '{
    "source_page": "https://vacamarquetry.shop/artworks/the-sovereign.html",
    "incoming_message": "I am interested in The Sovereign.",
    "artwork_context": "The Sovereign",
    "intent_score": 8
  }'
```

### Artwork inquiry (standard)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: dry_run" \
  -H "X-VaCa-Source: artwork_inquiry" \
  -d '{
    "name": "Marco Rossi",
    "email": "marco@test.com",
    "message": "Interested in purchasing this piece.",
    "artwork_title": "King of Ararat",
    "artwork_slug": "king-of-ararat",
    "artwork_url": "https://vacamarquetry.shop/artworks/king-of-ararat.html",
    "intent_score": 4
  }'
```

### Portrait inquiry (Hot → collector_crm + Telegram)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: shadow" \
  -H "X-VaCa-Source: portrait_inquiry" \
  -d '{
    "name": "Sophie Laurent",
    "email": "sophie@test.com",
    "subject_type": "Family portrait",
    "budget": "3500",
    "occasion": "Anniversary",
    "intent_score": 2,
    "source_page": "https://vacamarquetry.shop/custom-portraits.html"
  }'
```

### Cookie consent (low intent → analytics_only)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: dry_run" \
  -H "X-VaCa-Source: cookie_consent" \
  -d '{
    "visitor_id": "v-test-001",
    "session_id": "s-test-001",
    "intent_score": 1,
    "device_type": "Mobile",
    "browser": "Safari",
    "pages_visited": 2
  }'
```

### Cookie consent (high intent → leads_crm)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: shadow" \
  -H "X-VaCa-Source: cookie_consent" \
  -d '{
    "visitor_id": "v-test-002",
    "session_id": "s-test-002",
    "intent_score": 6,
    "device_type": "Desktop",
    "browser": "Chrome",
    "pages_visited": 8,
    "time_on_site": 540,
    "scroll_depth": 90
  }'
```

### Contact form (validation reject — missing source_page)
```bash
curl -X POST https://WORKER_URL \
  -H "Content-Type: application/json" \
  -H "X-VaCa-Mode: dry_run" \
  -H "X-VaCa-Source: contact" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "message": "Missing source page."
  }'
# Expected: HTTP 400, status: "rejected"
```

---

## Promote to production

Only after shadow testing confirms records are written correctly:

1. Verify shadow base has records with correct field values
2. Verify Telegram alerts fired for Hot / Portrait leads
3. Update `wrangler.toml`:

```toml
VACA_MODE = "production"
```

4. Redeploy:

```bash
wrangler deploy
```

---

## Remaining open items

| Item | Priority | Action |
|------|----------|--------|
| Replace `AIRTABLE_TEST_BASE_ID` placeholder | **CRITICAL** | Create shadow base, update wrangler.toml |
| Replace `AIRTABLE_ANALYTICS_TABLE_ID` placeholder | HIGH | Create analytics table or remove analytics writes |
| Replace `AIRTABLE_DEADLETTER_TABLE_ID` placeholder | MEDIUM | Create DLQ table (can skip for now — write skipped gracefully) |
| Add "Cookie Accept" to Airtable Interaction Type field | HIGH | Manual Airtable edit (typecast will auto-create on first write if skipped) |
| Wire Make.com Contact Form scenario to Worker URL | **CRITICAL** | BRK-01: contact form has no scenario, no Airtable write |
| Wire Make.com Portrait Inquiry scenario to Worker URL | **CRITICAL** | BRK-02: portrait form has no scenario, no Airtable write |
| Audit Collector CRM table schema | MEDIUM | Expand COLLECTOR_FIELD_MAP once schema is confirmed |
| Fix Schema.org on The Sovereign | LOW | Change `InStock` → `OutOfStock` on sovereign page |
