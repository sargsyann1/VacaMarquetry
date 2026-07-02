# VaCa Marquetry — MCP CRM Control Layer
## Architecture Specification v1.0

**Author:** System Architecture Review  
**Date:** 2026-06-29  
**Status:** Draft — Pre-Production  
**Stack:** Make.com · Airtable · Cloudflare Workers (Node.js)

---

## Table of Contents

1. Architecture Diagram
2. Module Breakdown
3. Validation Rules per Lead Type
4. Routing Decision Matrix
5. Safe Mode Implementation
6. Pseudo-Code Reference Implementation
7. Test Plan & Rollout Steps
8. Input → Output Transformation Samples

---

## 1. Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         INCOMING WEBHOOKS                             ║
║                                                                       ║
║  [WhatsApp Click]  [Cookie Accept]  [Artwork Inquiry]                 ║
║  [Contact Form]    [Portrait Inquiry]                                 ║
╚═════════════════════════════┬═════════════════════════════════════════╝
                              │  raw POST (JSON / FormData)
                              ▼
╔═════════════════════════════════════════════════════════════════════╗
║                    MAKE.COM GATEWAY SCENARIO                        ║
║                                                                     ║
║   Single webhook endpoint (or per-source with shared chain)         ║
║   Forwards raw_payload + source_type header to MCP Router           ║
║   No logic here — pure passthrough                                  ║
╚═════════════════════════════┬═══════════════════════════════════════╝
                              │  HTTP POST to MCP Router
                              ▼
╔═════════════════════════════════════════════════════════════════════╗
║              MCP CONTROL LAYER  (Cloudflare Worker)                 ║
║                                                                     ║
║  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐   ║
║  │  A. SCHEMA  │  │  B. NORMALIZER  │  │  C. LEAD SCORER      │   ║
║  │  VALIDATOR  │→ │  (enum fix,     │→ │  (0–10 scale,        │   ║
║  │             │  │   field coerce) │  │   Hot/Warm/Cold)     │   ║
║  └─────────────┘  └─────────────────┘  └──────────┬───────────┘   ║
║                                                    │               ║
║  ┌─────────────────────────────────────────────────▼───────────┐   ║
║  │                  D. ROUTING ENGINE                          │   ║
║  │                                                             │   ║
║  │   Portrait Inquiry ──────────────→ COLLECTOR CRM           │   ║
║  │   Hot Lead (score ≥ 7) ──────────→ COLLECTOR CRM + ALERT   │   ║
║  │   Artwork / Contact / WA ────────→ MAIN LEADS CRM          │   ║
║  │   Cookie (score < threshold) ────→ ANALYTICS ONLY          │   ║
║  │   Cookie (score ≥ threshold) ────→ MAIN LEADS CRM          │   ║
║  └─────────────────────────────────────────────────────────────┘   ║
║                                                                     ║
║  ┌─────────────────────────────────────────────────────────────┐   ║
║  │                  E. SAFE MODE CONTROLLER                    │   ║
║  │                                                             │   ║
║  │   DRY RUN   → return report, NO write                       │   ║
║  │   SHADOW    → write to TEST base only                       │   ║
║  │   PRODUCTION → write to PROD base (validation must pass)    │   ║
║  └─────────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════┬════════════════════════════════════╝
                                 │  validated, normalized payload
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
         ┌──────────────┐  ┌─────────┐  ┌──────────────┐
         │  AIRTABLE    │  │AIRTABLE │  │  AIRTABLE    │
         │  LEADS CRM   │  │COLLECTOR│  │  ANALYTICS   │
         │  (prod/test) │  │  CRM    │  │  (cookie log)│
         └──────────────┘  └─────────┘  └──────────────┘
```

### Deployment Options

**Option A — Pure Make.com (No External Service)**  
Each webhook scenario chains to a shared "MCP Router" sub-scenario via an HTTP module. The router is a Make.com scenario using Built-in modules (Router, Set Variables, Iterator) and JavaScript via HTTP request to a free serverless function for complex logic.

**Option B — Cloudflare Worker (Recommended)**  
A single Cloudflare Worker URL replaces the Make.com chain. All 5 webhooks are updated to point to `https://mcp.vacamarquetry.workers.dev`. The worker runs the full control layer and POSTs validated payloads to Make.com "write-only" scenarios. Zero latency, free tier covers 100,000 requests/day.

**Option C — Hybrid (Current-Stack-Friendly)**  
Keep existing Make.com scenarios as-is. Add a "pre-flight" module at the top of each that calls the MCP Worker endpoint in validation-only mode before proceeding. Least disruptive to current setup.

---

## 2. MCP Module Breakdown

```
mcp-router/
├── index.js              ← Entry point (Cloudflare Worker / Express handler)
├── modules/
│   ├── validator.js      ← Schema validation per lead type
│   ├── normalizer.js     ← Enum fixing, field coercion, defaults
│   ├── scorer.js         ← Intent score normalization + Heat classification
│   ├── router.js         ← Routing decision engine
│   ├── writer.js         ← Airtable write (with safe mode enforcement)
│   └── logger.js         ← Structured logging for all decisions
├── schemas/
│   ├── whatsapp.schema.js
│   ├── contact.schema.js
│   ├── artwork.schema.js
│   ├── portrait.schema.js
│   └── cookie.schema.js
├── config/
│   ├── enums.js          ← Single source of truth for all allowed values
│   ├── airtable.js       ← Table IDs, field IDs, base IDs
│   └── routing.js        ← Routing thresholds and rules
└── test/
    ├── fixtures.js       ← 20 sample lead payloads
    └── runner.js         ← Test harness
```

### Module Responsibilities

#### `index.js` — Entry Point
- Parses `Content-Type` (JSON or `multipart/form-data` for portrait photos)
- Reads `X-VaCa-Mode` header: `dry_run | shadow | production`
- Reads `X-VaCa-Source` header: identifies lead type
- Orchestrates the pipeline: validate → normalize → score → route → write
- Returns structured JSON response to Make.com / caller

#### `validator.js` — Schema Validation
- Validates required fields per lead type
- Validates email format
- Validates field types (string, number, date)
- Returns `{ valid: boolean, errors: ValidationError[] }`
- On failure: logs error, returns 400 with report (never writes)

#### `normalizer.js` — Normalization Engine
- Maps non-standard enum values to canonical ones
- Trims whitespace, lowercases emails
- Applies default values for optional missing fields
- Merges duplicate fields (e.g., `source_url` and `artwork_url` both → `source_page`)

#### `scorer.js` — Lead Scoring
- Normalizes `intent_score` to 0–10 range
- Applies bonus modifiers:
  - has_artwork_context: +2
  - is_portrait_inquiry: +3
  - has_budget: +2
  - is_whatsapp_click: session score × 2
- Classifies: Hot (≥ 7), Warm (3–6), Cold (< 3)
- Sets `🌡 Lead Heat` value

#### `router.js` — Routing Engine
- Returns one of: `leads_crm`, `collector_crm`, `analytics_only`, `dead_letter`
- Applies routing rules (see Section 4)
- Adds `routing_reason` to payload for observability
- `dead_letter`: validation-failed payloads → logged but not written anywhere

#### `writer.js` — Safe Airtable Writer
- Enforces safe mode before any write
- Selects correct Airtable base (prod vs test)
- Selects correct table by routing decision
- Strips any fields NOT in the Airtable schema (prevents unknown field errors)
- Retries once on 429 (rate limit) with 1s delay
- Returns `{ success, record_id, base, table }`

#### `logger.js` — Structured Logging
- Every lead processed generates a log entry:
  ```json
  {
    "timestamp": "ISO",
    "source": "whatsapp",
    "mode": "shadow",
    "valid": true,
    "routing": "collector_crm",
    "score": 8,
    "heat": "🔥 Hot",
    "airtable_record": "recXXX",
    "errors": []
  }
  ```
- Logs are POST'd to Make.com "logging" scenario → Airtable Audit Log table (optional)

---

## 3. Validation Rules per Lead Type

### Enum Definitions — Single Source of Truth

```javascript
// config/enums.js
const ENUMS = {
  leadType: [
    'WhatsApp Lead',
    'Artwork Inquiry',
    'Portrait Inquiry',
    'Contact',
    'Website Visitor'     // replaces "Cookie Accept"
  ],

  leadSource: [
    'WhatsApp',
    'Artwork Page',
    'Contact Form',
    'Portrait Page',
    'Organic'             // replaces "Collection", "Website Organic"
  ],

  interactionType: [
    'WhatsApp Click',
    'Form Submit',
    'Artwork Zoom',
    'Page View',
    'Cookie Accept'
  ],

  status: ['New', 'In Review', 'Quote Sent', 'Complete'],

  leadHeat: ['🔥 Hot', '🟡 Warm', '❄️ Cold'],

  leadSource_legacy_map: {
    // normalizer maps these → canonical values
    'Collection':        'Organic',
    'Website Organic':   'Organic',
    'Artwork Page':      'Artwork Page',  // keep
    'Contact Form':      'Contact Form',  // keep
    'WhatsApp':          'WhatsApp'       // keep
  },

  interactionType_legacy_map: {
    'Contact Form': 'Form Submit'  // ← BRK-04 fix
  }
};
```

### Required Fields per Lead Type

#### WhatsApp Lead
```
REQUIRED:
  source_page       (string, url)
  submitted_at      (ISO datetime)
  lead_type         = "WhatsApp Lead"

OPTIONAL:
  artwork_context   (string)
  intent_score      (number, 0–10)
  incoming_message  (string)
  lead_source       = "WhatsApp"
  interaction_type  = "WhatsApp Click"

NOT REQUIRED (WA has no form):
  name, email, phone

VALIDATION RULES:
  ✓ source_page must be a valid URL
  ✓ submitted_at must be parseable as ISO date
  ✓ intent_score, if present, must be 0 ≤ n ≤ 10
  ✓ If artwork_context present → bonus_score += 2
```

#### Contact Form
```
REQUIRED:
  name              (string, min 2 chars)
  email             (string, valid email format)
  message           (string, min 10 chars)
  source_page       (string, url)

OPTIONAL:
  submitted_at      (ISO datetime, defaults to now())

VALIDATION RULES:
  ✓ email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  ✓ name: not empty, not just whitespace
  ✓ message: minimum 10 characters
  ✗ REJECT if: email missing or malformed
  ✗ REJECT if: name missing
  ✗ FLAG if: message < 10 chars (warn, still write)
```

#### Artwork Inquiry
```
REQUIRED:
  name              (string, min 2 chars)
  email             (string, valid email)
  message           (string)
  artwork_title     (string)
  artwork_slug      (string)
  artwork_url       (string, url)

OPTIONAL:
  source_url        (alias for artwork_url — normalizer merges)

VALIDATION RULES:
  ✓ email valid
  ✓ artwork_slug must match /^[a-z0-9-]+$/
  ✓ artwork_title must not be empty
  ✗ REJECT if: email or name missing
  ✗ REJECT if: artwork_title missing (we don't know what they're inquiring about)

NORMALIZATION:
  source_url → source_page (canonical field name)
  artwork_url and source_url are the same → keep artwork_url as artwork_page_url
```

#### Portrait Inquiry
```
REQUIRED:
  name              (string, min 2 chars)
  email             (string, valid email)
  source_page       (string, url)

STRONGLY EXPECTED (flag if missing, still write):
  subject_type      (string) — who/what the portrait is of
  portrait_size     (string)

OPTIONAL:
  budget            (string / number)
  occasion          (string)
  customer_notes    (string)
  photos            (file array — multipart/form-data)

VALIDATION RULES:
  ✓ email valid
  ✓ name not empty
  ⚠ FLAG if subject_type missing (portrait without subject is unusual)
  ⚠ FLAG if photos missing (user may attach later)
  ✗ REJECT if: email missing

SCORING BONUS:
  +3 base bonus for being a Portrait Inquiry
  +2 if budget present and > 0
  → Portrait Inquiries start at Warm minimum (score ≥ 3)

ROUTING:
  Portrait Inquiry → Collector CRM (always, regardless of score)
```

#### Cookie Consent — Analytics Fingerprint
```
NOT treated as a CRM lead unless intent_score ≥ 4.

REQUIRED for analytics write:
  visitor_id        (string, UUID format)
  session_id        (string, UUID format)
  source_page       (string)
  timestamp         (ISO datetime)

OPTIONAL:
  device_type       (Desktop | Mobile | Tablet)
  os                (Windows | macOS | iOS | iPadOS | Android | Linux)
  browser           (Chrome | Safari | Firefox | Edge | Opera)
  pages_visited     (number)
  time_on_site      (number, seconds)
  scroll_depth      (number, 0–100)
  intent_score      (number, 0–10)

VALIDATION RULES:
  ✓ visitor_id must match UUID pattern or be non-empty string
  ✓ intent_score, if present, must be 0 ≤ n ≤ 10
  ✗ Silently drop: country, city (not in JS payload — see BRK-03)
  → If intent_score ≥ 4: escalate to MAIN LEADS CRM
  → If intent_score < 4: write to ANALYTICS table only

NORMALIZATION:
  Lead Type → "Website Visitor" (not "Cookie Accept")
  Remove country and city from Airtable write (not available in payload)
```

---

## 4. Routing Decision Matrix

```
╔═════════════════════════════════════════════════════════════════════════╗
║                      ROUTING DECISION MATRIX                           ║
╠══════════════════════╦══════════════════════╦══════════════════════════╣
║ LEAD TYPE            ║ CONDITIONS           ║ DESTINATION              ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ Portrait Inquiry     ║ Always               ║ COLLECTOR CRM (primary)  ║
║                      ║                      ║ + LEADS CRM (copy)       ║
║                      ║                      ║ + Telegram ALERT         ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ Artwork Inquiry      ║ score ≥ 7            ║ COLLECTOR CRM + LEADS    ║
║                      ║ score 3–6            ║ LEADS CRM only           ║
║                      ║ score < 3            ║ LEADS CRM (flag Cold)    ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ WhatsApp Lead        ║ score ≥ 7            ║ LEADS CRM + ALERT        ║
║                      ║ score 3–6            ║ LEADS CRM               ║
║                      ║ score < 3            ║ LEADS CRM (flag Cold)    ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ Contact Form         ║ Always               ║ LEADS CRM               ║
║                      ║ (no score context)   ║ score default = 1        ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ Cookie Consent       ║ score ≥ 4            ║ LEADS CRM (Website       ║
║                      ║                      ║ Visitor — high intent)   ║
║                      ║ score < 4            ║ ANALYTICS ONLY           ║
║                      ║ validation fail      ║ DEAD LETTER (log only)   ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ ANY TYPE             ║ validation_failed    ║ DEAD LETTER              ║
║                      ║ (missing required)   ║ (log, no Airtable write) ║
╠══════════════════════╬══════════════════════╬══════════════════════════╣
║ ANY TYPE             ║ score ≥ 7 AND        ║ Collector CRM flag set   ║
║                      ║ has email            ║ + Telegram HOT alert     ║
╚══════════════════════╩══════════════════════╩══════════════════════════╝
```

### Airtable Destinations

| Destination      | Base                    | Table                |
|------------------|-------------------------|----------------------|
| LEADS CRM        | appgaZWpeSTTkjoUa (prod) | tblCOVYuKMZq28Usi   |
| COLLECTOR CRM    | appgaZWpeSTTkjoUa (prod) | tbltxJzIzrSzLWc3m   |
| ANALYTICS        | appgaZWpeSTTkjoUa (prod) | (new) Analytics table|
| TEST LEADS       | appTEST_BASE_ID (shadow) | tblLEADS_TEST        |
| TEST COLLECTOR   | appTEST_BASE_ID (shadow) | tblCOLLECTOR_TEST    |
| DEAD LETTER      | appgaZWpeSTTkjoUa (prod) | (new) tblDeadLetters |

---

## 5. Safe Mode Implementation

### Mode Selection

Mode is determined by priority order:
1. `X-VaCa-Mode` HTTP header (highest — explicit override)
2. `VACA_MODE` environment variable in Cloudflare Worker
3. Default: `shadow` (fail-safe default — never accidentally write to prod)

```
MODE HIERARCHY:
  dry_run     → No writes. Returns normalized payload + routing report.
  shadow      → Writes to TEST Airtable base only.
  production  → Writes to PROD Airtable base (requires validation pass).
```

### Mode Behavior Table

```
╔════════════════╦═══════════════════╦══════════════════╦══════════════╗
║ ACTION         ║ DRY RUN           ║ SHADOW           ║ PRODUCTION   ║
╠════════════════╬═══════════════════╬══════════════════╬══════════════╣
║ Validate       ║ ✅ Run            ║ ✅ Run           ║ ✅ Run       ║
║ Normalize      ║ ✅ Run            ║ ✅ Run           ║ ✅ Run       ║
║ Score          ║ ✅ Run            ║ ✅ Run           ║ ✅ Run       ║
║ Route          ║ ✅ Run            ║ ✅ Run           ║ ✅ Run       ║
║ Write Prod AT  ║ ❌ SKIP           ║ ❌ SKIP          ║ ✅ Write     ║
║ Write Test AT  ║ ❌ SKIP           ║ ✅ Write         ║ ❌ SKIP      ║
║ Telegram Alert ║ ❌ SKIP           ║ ✅ Write (test)  ║ ✅ Write     ║
║ Log to Audit   ║ ✅ Log (dry_run)  ║ ✅ Log (shadow)  ║ ✅ Log       ║
║ HTTP Response  ║ Full report       ║ Test record ID   ║ Prod rec ID  ║
╚════════════════╩═══════════════════╩══════════════════╩══════════════╝
```

### Mode Enforcement Code

```javascript
// In writer.js — the ONLY function that touches Airtable
async function writeToAirtable(normalizedPayload, routingDecision, mode) {

  // SAFETY GUARD: Never infer production — must be explicit
  if (mode !== 'production' && mode !== 'shadow' && mode !== 'dry_run') {
    throw new Error(`SAFETY ABORT: Unknown mode "${mode}". Refusing to write.`);
  }

  if (mode === 'dry_run') {
    return {
      success: true,
      mode: 'dry_run',
      record_id: null,
      message: 'DRY RUN: No Airtable write performed.',
      would_write_to: routingDecision.destination,
      normalized_payload: normalizedPayload
    };
  }

  const baseId = mode === 'shadow'
    ? process.env.AIRTABLE_TEST_BASE_ID
    : process.env.AIRTABLE_PROD_BASE_ID;

  // Validate base ID looks right before writing
  if (!baseId || !baseId.startsWith('app')) {
    throw new Error('SAFETY ABORT: Invalid Airtable base ID — refusing to write.');
  }

  // ... write logic
}
```

---

## 6. Pseudo-Code Reference Implementation

### Entry Point — `index.js`

```javascript
// Cloudflare Worker entry point
export default {
  async fetch(request, env) {
    const mode    = request.headers.get('X-VaCa-Mode')  || env.VACA_MODE || 'shadow';
    const source  = request.headers.get('X-VaCa-Source');

    // Parse payload
    let raw;
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      raw = Object.fromEntries(fd.entries());
      raw._files = extractFiles(fd);           // portrait photos
    } else {
      raw = await request.json();
    }

    // Detect lead type from header or payload
    const leadType = detectLeadType(source, raw);

    // Pipeline
    const validation  = validate(leadType, raw);
    if (!validation.valid) {
      await logger.log({ leadType, mode, valid: false, errors: validation.errors });
      return jsonResponse(400, { status: 'rejected', errors: validation.errors });
    }

    const normalized  = normalize(leadType, raw);
    const scored      = score(leadType, normalized);
    const routing     = route(leadType, scored);
    const result      = await write(scored, routing, mode, env);

    await logger.log({ leadType, mode, valid: true, routing: routing.destination,
                       score: scored.lead_score, heat: scored.lead_heat, ...result });

    return jsonResponse(200, { status: 'accepted', mode, routing, result });
  }
};

function detectLeadType(sourceHeader, raw) {
  if (sourceHeader) return sourceHeader;
  // Infer from payload shape
  if (raw.artwork_title && raw.artwork_slug) return 'artwork_inquiry';
  if (raw.subject_type  || raw._files)       return 'portrait_inquiry';
  if (raw.visitor_id    && raw.device_type)  return 'cookie_consent';
  if (raw.incoming_message)                  return 'whatsapp';
  return 'contact';
}
```

### Validator — `validator.js`

```javascript
const SCHEMAS = {
  whatsapp: {
    required: ['source_page', 'submitted_at'],
    optional: ['artwork_context', 'intent_score', 'incoming_message',
               'lead_source', 'interaction_type'],
    rules: {
      source_page:   (v) => isUrl(v)            || 'source_page must be a valid URL',
      submitted_at:  (v) => isIsoDate(v)        || 'submitted_at must be ISO datetime',
      intent_score:  (v) => v === undefined || (v >= 0 && v <= 10)
                                                 || 'intent_score must be 0–10'
    }
  },

  contact: {
    required: ['name', 'email', 'message', 'source_page'],
    optional: ['submitted_at'],
    rules: {
      email:   (v) => isEmail(v)   || 'Invalid email address',
      name:    (v) => v.trim().length >= 2 || 'Name must be at least 2 characters',
      message: (v) => v.trim().length >= 10 || 'Message too short (warn only)'
    }
  },

  artwork_inquiry: {
    required: ['name', 'email', 'artwork_title', 'artwork_slug'],
    optional: ['message', 'artwork_url', 'source_url'],
    rules: {
      email:         (v) => isEmail(v) || 'Invalid email address',
      name:          (v) => v.trim().length >= 2 || 'Name too short',
      artwork_slug:  (v) => /^[a-z0-9-]+$/.test(v) || 'Invalid artwork_slug format'
    }
  },

  portrait_inquiry: {
    required: ['name', 'email'],
    optional: ['subject_type', 'portrait_size', 'budget', 'occasion',
               'customer_notes', 'source_page', '_files'],
    rules: {
      email: (v) => isEmail(v) || 'Invalid email address',
      name:  (v) => v.trim().length >= 2 || 'Name too short'
    },
    warnings: {
      subject_type: (v) => !!v || 'subject_type missing — portrait subject unknown'
    }
  },

  cookie_consent: {
    required: ['visitor_id', 'session_id', 'timestamp'],
    optional: ['device_type', 'os', 'browser', 'pages_visited',
               'time_on_site', 'scroll_depth', 'intent_score', 'source_page'],
    rules: {
      intent_score: (v) => v === undefined || (v >= 0 && v <= 10)
                                              || 'intent_score must be 0–10'
    },
    // Strip fields that JS never sends (prevents Airtable empty write)
    strip: ['country', 'city', 'timezone']
  }
};

function validate(leadType, raw) {
  const schema = SCHEMAS[leadType];
  if (!schema) return { valid: false, errors: [{ field: '_type', msg: 'Unknown lead type' }] };

  const errors   = [];
  const warnings = [];

  // Required field check
  for (const field of schema.required) {
    if (raw[field] === undefined || raw[field] === null || String(raw[field]).trim() === '') {
      errors.push({ field, msg: `${field} is required`, severity: 'error' });
    }
  }

  // Rule validation
  for (const [field, rule] of Object.entries(schema.rules || {})) {
    if (raw[field] !== undefined) {
      const result = rule(raw[field]);
      if (typeof result === 'string') {
        errors.push({ field, msg: result, severity: 'error' });
      }
    }
  }

  // Warning checks
  for (const [field, check] of Object.entries(schema.warnings || {})) {
    const result = check(raw[field]);
    if (typeof result === 'string') {
      warnings.push({ field, msg: result, severity: 'warning' });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### Normalizer — `normalizer.js`

```javascript
const ENUM_MAPS = {
  lead_source: {
    'Collection':      'Organic',
    'Website Organic': 'Organic',
    'Artwork Page':    'Artwork Page',
    'Contact Form':    'Contact Form',
    'Portrait Page':   'Portrait Page',
    'WhatsApp':        'WhatsApp'
  },
  interaction_type: {
    'Contact Form':    'Form Submit',  // ← fixes BRK-04
    'Form Submit':     'Form Submit',
    'WhatsApp Click':  'WhatsApp Click',
    'Artwork Zoom':    'Artwork Zoom',
    'Page View':       'Page View',
    'Cookie Accept':   'Cookie Accept'
  },
  lead_type: {
    'Cookie Accept': 'Website Visitor',  // ← fixes BRK-05
    'WhatsApp Lead': 'WhatsApp Lead',
    'Artwork Inquiry': 'Artwork Inquiry',
    'Portrait Inquiry': 'Portrait Inquiry',
    'Contact': 'Contact'
  }
};

const DEFAULTS = {
  whatsapp:        { lead_type: 'WhatsApp Lead',    lead_source: 'WhatsApp',      interaction_type: 'WhatsApp Click', status: 'New' },
  contact:         { lead_type: 'Contact',           lead_source: 'Contact Form',  interaction_type: 'Form Submit',    status: 'New' },
  artwork_inquiry: { lead_type: 'Artwork Inquiry',   lead_source: 'Artwork Page',  interaction_type: 'Form Submit',    status: 'New' },
  portrait_inquiry:{ lead_type: 'Portrait Inquiry',  lead_source: 'Portrait Page', interaction_type: 'Form Submit',    status: 'New' },
  cookie_consent:  { lead_type: 'Website Visitor',   lead_source: 'Organic',       interaction_type: 'Cookie Accept',  status: 'New' }
};

function normalize(leadType, raw) {
  const schema  = SCHEMAS[leadType];
  let payload   = { ...raw };

  // Apply defaults
  const defaults = DEFAULTS[leadType] || {};
  for (const [k, v] of Object.entries(defaults)) {
    if (!payload[k]) payload[k] = v;
  }

  // Fix enum values
  for (const [field, map] of Object.entries(ENUM_MAPS)) {
    if (payload[field] && map[payload[field]]) {
      payload[field] = map[payload[field]];
    } else if (payload[field] && !Object.values(map).includes(payload[field])) {
      // Value not in canonical list AND not mappable → replace with default
      payload[field] = defaults[field] || null;
    }
  }

  // Field aliasing
  if (payload.source_url && !payload.source_page) {
    payload.source_page = payload.source_url;
  }
  if (payload.artwork_url && !payload.artwork_page_url) {
    payload.artwork_page_url = payload.artwork_url;
  }

  // Strip fields that are sent by JS but not usable
  if (schema.strip) {
    for (const f of schema.strip) delete payload[f];
  }

  // Trim strings
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string') payload[k] = v.trim();
  }

  // Lowercase email
  if (payload.email) payload.email = payload.email.toLowerCase();

  // Ensure submitted_at
  if (!payload.submitted_at) payload.submitted_at = new Date().toISOString();

  return payload;
}
```

### Scorer — `scorer.js`

```javascript
const THRESHOLDS = { HOT: 7, WARM: 3, COLD: 0 };

function score(leadType, normalized) {
  let base = parseFloat(normalized.intent_score || 0);

  // Normalize session-score formula (WA sends crm_score = session*2 + artwork_bonus)
  // Reverse-normalize to 0–10 scale
  if (leadType === 'whatsapp') {
    // WA score is already crm_score from JS (max 8). Map to 0–10.
    base = Math.min(10, base);
  }

  // Bonus modifiers
  let bonus = 0;
  if (leadType === 'portrait_inquiry')             bonus += 3;
  if (normalized.artwork_title)                    bonus += 2;
  if (normalized.budget && parseFloat(normalized.budget) > 0) bonus += 2;
  if (leadType === 'artwork_inquiry')              bonus += 1;

  // Cookie consent: use raw intent_score as-is (no bonus)
  const finalScore = leadType === 'cookie_consent'
    ? Math.min(10, Math.max(0, base))
    : Math.min(10, Math.max(0, base + bonus));

  const heat = finalScore >= THRESHOLDS.HOT  ? '🔥 Hot'  :
               finalScore >= THRESHOLDS.WARM ? '🟡 Warm' : '❄️ Cold';

  // Cap at 5 for Airtable Lead Score field (uinteger 1–5 with validate.min:1)
  const airtableScore = Math.max(1, Math.min(5, Math.round(finalScore / 2)));

  return {
    ...normalized,
    intent_score_raw:    base,
    intent_score_scaled: finalScore,
    lead_score:          airtableScore,   // → fldENjUV5MUonr2p8
    lead_heat:           heat             // → flddnkMm9vFJIu5jk
  };
}
```

### Router — `router.js`

```javascript
function route(leadType, scored) {
  const score = scored.intent_score_scaled;

  // Dead letter: if validation passed but data is still unusable
  if (!scored.source_page && !scored.email && !scored.incoming_message) {
    return { destination: 'dead_letter', reason: 'No contact vector', alert: false };
  }

  // Portrait Inquiry → always Collector CRM
  if (leadType === 'portrait_inquiry') {
    return {
      destination:  'collector_crm',
      also_write:   'leads_crm',
      alert:        true,
      alert_level:  '🎨 Portrait Inquiry',
      reason:       'Portrait inquiries always go to Collector CRM'
    };
  }

  // Cookie Consent — analytics only unless high intent
  if (leadType === 'cookie_consent') {
    if (score >= 4) {
      return { destination: 'leads_crm', reason: `High-intent visitor (score ${score})`, alert: false };
    }
    return { destination: 'analytics_only', reason: `Low-intent visitor (score ${score})`, alert: false };
  }

  // Hot lead with email → also flag for Collector CRM
  if (score >= 7 && scored.email) {
    return {
      destination:  'collector_crm',
      also_write:   'leads_crm',
      alert:        true,
      alert_level:  '🔥 Hot Lead',
      reason:       `Score ${score} ≥ 7 with email — collector-level`
    };
  }

  // Default for Contact / Artwork / WA
  return {
    destination: 'leads_crm',
    alert:       score >= 7,
    reason:      `Standard lead routing (score ${score})`
  };
}
```

---

## 7. Test Plan & Rollout Steps

### Phase 1 — Build & DRY RUN (Week 1)

**Step 1.1** — Deploy Cloudflare Worker in DRY RUN mode
- Set `VACA_MODE=dry_run` in Worker env
- All 5 existing Make.com scenarios remain unchanged (no webhook URL changes yet)
- Send manual test POSTs to Worker URL directly

**Step 1.2** — Run all 20 test fixtures (see Section 8)
- Verify validation output matches expected
- Verify normalization fixes all known enum issues
- Verify routing matrix produces correct destinations
- No Airtable writes — review JSON responses only

**Step 1.3** — Fix any bugs found in DRY RUN
- Iterate until all 20 fixtures pass expected output

### Phase 2 — Shadow Mode (Week 2)

**Step 2.1** — Create SHADOW Airtable base
- Duplicate schema of production base
- Base ID: `appSHADOW_ID` (create in Airtable → Duplicate Base)

**Step 2.2** — Set `VACA_MODE=shadow` in Worker env

**Step 2.3** — Update ONE Make.com scenario to route through MCP Worker
- Start with Artwork Inquiry (lowest risk — lowest volume)
- Change Airtable write step to: HTTP POST to Worker URL instead
- Existing scenario becomes: webhook → Worker → Worker writes to SHADOW base

**Step 2.4** — Validate shadow writes for 48 hours
- Check SHADOW base: records correct? Enums clean? No missing fields?
- Compare record count: Make.com logs show same count as SHADOW base records

**Step 2.5** — Extend SHADOW mode to all 5 scenarios
- Update remaining 4 webhooks to route through Worker
- Run 48 hours of shadow verification

### Phase 3 — Production Rollout (Week 3)

**Step 3.1** — Switch `VACA_MODE=production` in Worker env

**Step 3.2** — Monitor first 24 hours in production
- Check Airtable Leads for correct records
- Check Dead Letter queue for any rejected payloads
- Check Telegram alerts firing correctly

**Step 3.3** — Build Contact Form and Portrait Inquiry scenarios
- New Make.com scenarios for BRK-01 and BRK-02
- These should be built during Phase 2 and tested in SHADOW before Phase 3

### Phase 4 — Verification & Hardening

**Step 4.1** — Run load test (100 synthetic POSTs across all lead types)
- Verify no data corruption
- Verify rate limit handling (Airtable 5 req/sec per base)

**Step 4.2** — Enable structured audit logging
- Every processed lead generates an audit log record in Airtable
- Provides full observability: what came in, what was written, why

**Step 4.3** — Set up Cloudflare Worker alerts
- Error rate spike → Telegram alert
- Dead letter count spike → Telegram alert

---

## 8. Input → Output Transformation Samples

### 20 Test Fixture Dataset

#### VALID LEADS — Expected to Pass

**Fixture 01 — WhatsApp Hot Lead (artwork context)**
```json
INPUT:
{
  "lead_type": "WhatsApp Lead",
  "lead_source": "WhatsApp",
  "interaction_type": "WhatsApp Click",
  "artwork_context": "The Sovereign",
  "intent_score": 8,
  "incoming_message": "Hello VaCa Marquetry, I'm interested in the artwork \"The Sovereign\".",
  "source_page": "https://vacamarquetry.shop/artworks/the-sovereign.html",
  "submitted_at": "2026-06-29T10:00:00.000Z"
}

EXPECTED OUTPUT:
{
  "validation": { "valid": true, "errors": [], "warnings": [] },
  "normalized": {
    "lead_type": "WhatsApp Lead",
    "lead_source": "WhatsApp",
    "interaction_type": "WhatsApp Click",
    "status": "New",
    "artwork_title": "The Sovereign",
    "incoming_message": "Hello VaCa Marquetry...",
    "source_page": "https://vacamarquetry.shop/artworks/the-sovereign.html",
    "submitted_at": "2026-06-29T10:00:00.000Z"
  },
  "scored": {
    "intent_score_scaled": 8,
    "lead_score": 4,
    "lead_heat": "🔥 Hot"
  },
  "routing": {
    "destination": "leads_crm",
    "alert": true,
    "reason": "Score 8 ≥ 7 — Hot lead"
  }
}
```

**Fixture 02 — Artwork Inquiry (valid)**
```json
INPUT:
{
  "name": "Marco Rossi",
  "email": "marco@example.com",
  "message": "I am very interested in this piece for my Milan apartment.",
  "artwork_title": "King of Ararat",
  "artwork_slug": "king-of-ararat",
  "artwork_url": "https://vacamarquetry.shop/artworks/king-of-ararat.html",
  "source_url": "https://vacamarquetry.shop/artworks/king-of-ararat.html"
}

EXPECTED OUTPUT:
{
  "validation": { "valid": true },
  "normalized": {
    "name": "Marco Rossi",
    "email": "marco@example.com",
    "message": "I am very interested...",
    "artwork_title": "King of Ararat",
    "artwork_slug": "king-of-ararat",
    "artwork_page_url": "https://vacamarquetry.shop/artworks/king-of-ararat.html",
    "source_page": "https://vacamarquetry.shop/artworks/king-of-ararat.html",
    "lead_type": "Artwork Inquiry",
    "lead_source": "Artwork Page",
    "interaction_type": "Form Submit",
    "status": "New",
    "submitted_at": "2026-06-29T10:01:00.000Z"
  },
  "scored": { "intent_score_scaled": 3, "lead_score": 2, "lead_heat": "🟡 Warm" },
  "routing": { "destination": "leads_crm", "alert": false }
}
```

**Fixture 03 — Portrait Inquiry (full data)**
```json
INPUT:
{
  "name": "Sophie Laurent",
  "email": "sophie.laurent@example.com",
  "subject_type": "Family portrait — 4 people",
  "portrait_size": "Large (90×120cm)",
  "budget": "3500",
  "occasion": "Wedding anniversary gift",
  "customer_notes": "We would like the portrait in the style of The Sovereign.",
  "source_page": "https://vacamarquetry.shop/custom-portraits.html"
}

EXPECTED OUTPUT:
{
  "validation": { "valid": true },
  "normalized": {
    "lead_type": "Portrait Inquiry",
    "lead_source": "Portrait Page",
    "interaction_type": "Form Submit",
    "status": "New",
    ...all fields...
  },
  "scored": {
    "intent_score_scaled": 7,   // +3 portrait bonus, +2 budget
    "lead_score": 4,
    "lead_heat": "🔥 Hot"
  },
  "routing": {
    "destination": "collector_crm",
    "also_write": "leads_crm",
    "alert": true,
    "alert_level": "🎨 Portrait Inquiry",
    "reason": "Portrait inquiries always go to Collector CRM"
  }
}
```

**Fixture 04 — Contact Form (clean)**
```json
INPUT:
{
  "name": "David Chen",
  "email": "david.chen@gallery.com",
  "message": "I represent a gallery in Hong Kong and would like to discuss a potential exhibition partnership.",
  "source_url": "https://vacamarquetry.shop/contact.html"
}

EXPECTED OUTPUT:
{
  "validation": { "valid": true },
  "routing": { "destination": "leads_crm", "alert": false },
  "scored": { "lead_score": 1, "lead_heat": "❄️ Cold" }
}
```

**Fixture 05 — Cookie Consent (high intent)**
```json
INPUT:
{
  "visitor_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "session_id": "s9s8s7s6-a1b2-c3d4-e5f6-789012345678",
  "device_type": "Desktop",
  "os": "macOS",
  "browser": "Safari",
  "pages_visited": 6,
  "time_on_site": 485,
  "scroll_depth": 78,
  "intent_score": 5,
  "event_type": "Cookie Accept",
  "source_page": "https://vacamarquetry.shop/artworks/king-of-ararat.html",
  "timestamp": "2026-06-29T09:55:00.000Z"
}

EXPECTED OUTPUT:
{
  "validation": { "valid": true },
  "normalized": {
    "lead_type": "Website Visitor",      // "Cookie Accept" → "Website Visitor"
    "lead_source": "Organic",
    "interaction_type": "Cookie Accept",
    // country, city, timezone STRIPPED
  },
  "routing": {
    "destination": "leads_crm",
    "reason": "High-intent visitor (score 5)"
  }
}
```

#### ENUM FIX CASES — Normalization Required

**Fixture 06 — Artwork Inquiry with wrong Interaction Type**
```json
INPUT: { ..., "interaction_type": "Contact Form", "lead_source": "Collection" }

NORMALIZATION APPLIED:
  interaction_type: "Contact Form" → "Form Submit"   (BRK-04 fix)
  lead_source: "Collection" → "Organic"              (enum map)

OUTPUT: { ..., "interaction_type": "Form Submit", "lead_source": "Artwork Page" }
```

**Fixture 07 — Cookie with Lead Type "Cookie Accept"**
```json
INPUT: { ..., "lead_type": "Cookie Accept" }

NORMALIZATION APPLIED:
  lead_type: "Cookie Accept" → "Website Visitor"     (BRK-05 fix)
```

#### FAILURE CASES — Expected to Reject

**Fixture 08 — Missing email (Artwork Inquiry)**
```json
INPUT: { "name": "Test", "artwork_title": "The Sovereign", "message": "test" }
// email missing

EXPECTED: { "validation": { "valid": false, "errors": [{ "field": "email", "msg": "email is required" }] } }
EXPECTED ACTION: Dead letter — no Airtable write
```

**Fixture 09 — Invalid email format**
```json
INPUT: { "name": "Test", "email": "notanemail", "message": "test", "source_page": "..." }

EXPECTED: { "validation": { "valid": false, "errors": [{ "field": "email", "msg": "Invalid email address" }] } }
```

**Fixture 10 — Missing required artwork_slug (Artwork Inquiry)**
```json
INPUT: { "name": "Test", "email": "t@t.com", "artwork_title": "King of Ararat" }
// artwork_slug missing

EXPECTED: validation error on artwork_slug
```

**Fixture 11 — Intent score out of range**
```json
INPUT: { ..., "intent_score": 15 }

EXPECTED: { "errors": [{ "field": "intent_score", "msg": "intent_score must be 0–10" }] }
```

**Fixture 12 — Empty name**
```json
INPUT: { "name": "   ", "email": "test@test.com", ... }

EXPECTED: error on name — 'Name must be at least 2 characters'
```

**Fixture 13 — Cookie consent missing visitor_id**
```json
INPUT: { "session_id": "abc", "timestamp": "..." }
// visitor_id missing

EXPECTED: validation error — routes to dead_letter
```

**Fixture 14 — Unknown lead_source value (untranslatable)**
```json
INPUT: { ..., "lead_source": "TikTok Campaign" }

NORMALIZATION: no map entry → replaced with leadSource default for type
No rejection — normalize gracefully with warning
EXPECTED: { "normalized": { "lead_source": "Organic" }, "warnings": [{ "field": "lead_source", "msg": "Unknown value 'TikTok Campaign' — replaced with 'Organic'" }] }
```

**Fixture 15 — Portrait inquiry missing subject_type**
```json
INPUT: { "name": "Test", "email": "t@t.com" }
// subject_type missing

EXPECTED: { "valid": true, "warnings": [{ "field": "subject_type", "msg": "subject_type missing — portrait subject unknown" }] }
// Still writes — portrait with no subject is unusual but not invalid
```

#### DRY RUN MODE CASES

**Fixture 16 — Valid payload, DRY RUN**
```json
HEADER: X-VaCa-Mode: dry_run
INPUT: [valid artwork inquiry]

EXPECTED:
{
  "status": "accepted",
  "mode": "dry_run",
  "result": {
    "success": true,
    "record_id": null,
    "message": "DRY RUN: No Airtable write performed.",
    "would_write_to": "leads_crm",
    "normalized_payload": { ... }
  }
}
```

**Fixture 17 — Valid payload, SHADOW**
```json
HEADER: X-VaCa-Mode: shadow

EXPECTED:
{
  "status": "accepted",
  "mode": "shadow",
  "result": { "success": true, "record_id": "recABC123TEST", "base": "appSHADOW_ID" }
}
```

**Fixture 18 — Hot Lead, PRODUCTION**
```json
HEADER: X-VaCa-Mode: production
INPUT: [WA lead score 8, artwork_context present]

EXPECTED:
{
  "routing": { "destination": "leads_crm", "alert": true },
  "result": { "record_id": "recXXXPROD", "base": "appgaZWpeSTTkjoUa", "telegram_sent": true }
}
```

**Fixture 19 — Portrait Hot Lead, PRODUCTION**
```json
INPUT: [portrait inquiry, budget=5000]

EXPECTED:
{
  "routing": { "destination": "collector_crm", "also_write": "leads_crm" },
  "result": {
    "collector_record_id": "recCOLLECTOR",
    "leads_record_id": "recLEAD",
    "telegram_sent": true,
    "alert_level": "🎨 Portrait Inquiry"
  }
}
```

**Fixture 20 — Cookie, low intent, PRODUCTION**
```json
INPUT: { "visitor_id": "abc", "session_id": "def", "intent_score": 1, "timestamp": "..." }

EXPECTED:
{
  "routing": { "destination": "analytics_only", "reason": "Low-intent visitor (score 1)" },
  "result": { "table": "Analytics", "record_id": "recANALYTICS" }
}
```

---

## Implementation Notes for Make.com Integration

If deploying as a **hybrid** (Worker validates, existing Make.com does the Airtable write):

1. Add HTTP module at **top** of each scenario (before any Airtable step)
2. Call Worker in `dry_run` mode for validation only
3. If `{ valid: false }` returned → use Error Handler → stop scenario + log to Dead Letter
4. If `{ valid: true }` returned → use normalized_payload from response (not original webhook data) for all downstream steps

If deploying as **full replacement**:

1. Update all 5 webhook URLs to point to Worker
2. Make.com scenarios become write-only: receive validated payload from Worker → write to Airtable → done
3. No routing logic in Make.com — Worker handles all decisions
4. Make.com "write" scenarios are dumb leaf nodes, not the brain

The Worker-as-brain approach is strongly preferred: it provides a single audit trail, mode switching without touching Make.com, and language-level validation (JS is far more expressive than Make.com's formula language).
