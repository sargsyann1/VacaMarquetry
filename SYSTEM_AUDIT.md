# VaCa Marquetry — Full System Audit
**Date:** 2026-06-29  
**Scope:** Make.com scenarios · Airtable Leads CRM · Frontend tracking · WhatsApp flow · Cookie system

---

## 1. Full Architecture Map

### Entry Points → Webhooks → Scenarios → Airtable

```
VISITOR ACTION               JS FILE             WEBHOOK URL (hook.eu2.make.com/)          SCENARIO ID / NAME                  AIRTABLE TABLE
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
WhatsApp button click      main.js §2          enneb60q3m64izxwj0r5ae3t5mgp91m7   →   9449734 "Watssapp Webhook leed"   →   Leads (tblCOVYuKMZq28Usi)
                                                                                         + Telegram alert to chat 7890260331

Cookie banner accept       main.js §3          pj775ngcim51f24g9v7m1mrr06xbrac5   →   9450025 "Cookies CRM save"        →   Leads (tblCOVYuKMZq28Usi)

Artwork inquiry form       artwork-loader.js   0fw3v3txv385q8e4olynxkjypujvjs3p   →   9452945 "VaCa Artwork Inquiry CRM" →  Leads (tblCOVYuKMZq28Usi)

Contact form               contact.html        8w5nlujfrfsdya2kgr56d1c4okucenw1   →   ⚠️  NO SCENARIO — DATA LOST
Portrait inquiry form      custom-portraits    vm1odajacsqc1wezmxc56lmx0q4cbmry   →   ⚠️  NO SCENARIO — DATA LOST
```

### Payload Field Map — What JS Sends vs What Make.com Writes to Airtable

#### WhatsApp (9449734)
| JS payload key       | Airtable field           | Field ID              | Status   |
|----------------------|--------------------------|-----------------------|----------|
| (hardcoded)          | Lead Type = "WhatsApp Lead" | fld4W3TE9wPeg4WWA  | ✅       |
| artwork_context      | Artwork Title            | fldDbFmHJI1yWOGOK     | ✅       |
| intent_score         | Lead Score (capped 1–5)  | fldENjUV5MUonr2p8     | ✅       |
| incoming_message     | Incoming Message         | fldLikiOEnMDXp3a5     | ✅       |
| source_page          | Source Page              | fldQjvWaXDKHJ651y     | ✅       |
| interaction_type     | Interaction Type         | fldRN40zMJuQ3tGzY     | ✅       |
| (formula)            | 🌡 Lead Heat (Hot/Warm/Cold) | flddnkMm9vFJIu5jk | ✅       |
| (hardcoded)          | Status = "New"           | fldqHNgvHnC4DNORq     | ✅       |
| submitted_at         | Submitted At             | fldvsie6oEf4ySLqI     | ✅       |
| lead_source          | Lead Source              | fldwk0CgCYqw8s51V     | ✅       |
| —                    | Name                     | fldThfotMzUA4FQ2N     | ❌ NOT SENT (WA has no form) |
| —                    | Email                    | flducnT9WKNjz4M4s     | ❌ NOT SENT (expected)       |

#### Cookie Consent (9450025)
| JS payload key    | Airtable field          | Field ID              | Status   |
|-------------------|-------------------------|-----------------------|----------|
| browser           | Browser                 | fld0HqmLnAZwNqG1D     | ✅       |
| os                | OS                      | fld5SCqvLkPCQGKIP     | ✅       |
| scroll_depth      | Scroll Depth (%)        | fldBU17bogiu6bdwZ     | ✅       |
| session_id        | Session ID              | fldPWSnfJdINjeeLH     | ✅       |
| source_page       | Source Page             | fldQjvWaXDKHJ651y     | ✅       |
| time_on_site      | Time on Site (s)        | fldeuiljIhWzSqCgA     | ✅       |
| visitor_id        | Visitor ID              | fldl7bGeHPpsaNrWL     | ✅       |
| intent_score      | Lead Score              | fldENjUV5MUonr2p8     | ✅       |
| pages_visited     | Pages Visited           | fldqKi9jwjhjHlStO     | ✅       |
| device_type       | Device Type             | flduiMbSFhowqiuLW     | ✅       |
| timestamp         | Submitted At            | fldvsie6oEf4ySLqI     | ✅       |
| (hardcoded)       | Make Run ID             | fldlNCz7JYyvhQ8Xi     | ✅       |
| (hardcoded)       | Status = "New"          | fldqHNgvHnC4DNORq     | ✅       |
| (hardcoded "Cookie Accept") | Lead Type    | fld4W3TE9wPeg4WWA     | ⚠️ "Cookie Accept" not in Lead Type enum |
| (hardcoded "Cookie Accept") | Event Type  | fldgs5Q9eTwngqfIM     | ✅ (Event Type accepts freetext) |
| **2.country**     | Country                 | fldBvcrby4nc8xzmn     | ❌ NOT IN JS PAYLOAD — always blank |
| **2.city**        | City                    | fldDmVcKvPhDxiZG3     | ❌ NOT IN JS PAYLOAD — always blank |
| timezone          | —                       | —                     | ⚠️ Sent by JS, not mapped in Make.com |

#### Artwork Inquiry (9452945)
| JS payload key    | Airtable field          | Field ID              | Status   |
|-------------------|-------------------------|-----------------------|----------|
| name              | Name                    | fldThfotMzUA4FQ2N     | ✅       |
| email             | Email                   | flducnT9WKNjz4M4s     | ✅       |
| message           | Message                 | fldCpq4OtSTctW0ck     | ✅       |
| artwork_title     | Artwork Title           | fldDbFmHJI1yWOGOK     | ✅       |
| artwork_slug      | Artwork Slug            | fldxWXVQpdQ1cyNMt     | ✅       |
| artwork_url       | Artwork Page URL        | fldPGil8DnymnH6Gh     | ✅       |
| source_url        | Source Page             | fldQjvWaXDKHJ651y     | ✅       |
| (hardcoded)       | Lead Type = "Artwork Inquiry" | fld4W3TE9wPeg4WWA | ✅     |
| (hardcoded)       | Status = "New"          | fldqHNgvHnC4DNORq     | ✅       |
| (hardcoded "Artwork Page") | Lead Source   | fldwk0CgCYqw8s51V     | ⚠️ "Artwork Page" not in Lead Source enum |
| (hardcoded "Contact Form") | Interaction Type | fldRN40zMJuQ3tGzY | ⚠️ Should be "Form Submit" |
| (executionId)     | Make Run ID             | fldlNCz7JYyvhQ8Xi     | ✅       |
| (now)             | Submitted At            | fldvsie6oEf4ySLqI     | ✅       |

#### Contact Form (NO SCENARIO)
JS sends: `name`, `email`, `message`, `source_url`  
Destination: `8w5nlujfrfsdya2kgr56d1c4okucenw1`  
**Result: POST fires, 200 response from Make.com hook, data silently discarded. Every contact form submission is lost.**

#### Portrait Inquiry (NO SCENARIO)
JS sends: FormData with `name`, `email`, `source_url`, plus all portrait-specific fields (subject_type, portrait_size, budget, occasion, notes, photos attachment)  
Destination: `vm1odajacsqc1wezmxc56lmx0q4cbmry`  
**Result: Same — data silently discarded. Every portrait inquiry is lost.**

---

### Non-VaCa Scenarios in Team 753832

The remaining 25 scenarios are separate projects sharing the account:
- **Content intelligence pipeline** (Sc0–Sc11 series): Telegram bot command router, RSS ingest, OpenAI relevance gate, Google Drive upload, content approval, audience intelligence, Facebook Likes tracker
- **Telegram bots**: Various Armenian-language bots ("Sasuni Բոt", "Grandstrategy", etc.)
- **Instagram automation**: Webhook listeners for Instagram events

These do not touch VaCa data at all. No overlap or interference.

---

## 2. Duplicate Scenarios

**None found among VaCa scenarios.** The 3 active VaCa scenarios cover distinct entry points with no overlap.

The 25 non-VaCa scenarios are entirely separate projects with different Airtable bases and Telegram connections.

---

## 3. Broken Data Flows

### CRITICAL — Data Loss

**BRK-01: Contact Form has no Make.com scenario**
- Webhook `8w5nlujfrfsdya2kgr56d1c4okucenw1` exists in Make.com but is attached to no scenario
- Every contact form submission (name, email, message) fires and returns 200 — the submitter sees "success" — but no record is created in Airtable and no notification is sent
- **Impact: 100% of contact leads lost**

**BRK-02: Portrait Inquiry has no Make.com scenario**
- Webhook `vm1odajacsqc1wezmxc56lmx0q4cbmry` same situation
- Portrait form sends FormData including photo attachments — these are the highest-intent leads on the site
- **Impact: 100% of portrait leads lost**

### HIGH — Field Mismatches

**BRK-03: Cookie scenario maps Country and City fields that JS never sends**
- Make.com maps `{{2.country}}` → Country field and `{{2.city}}` → City field
- The cookie consent JS payload does not include `country` or `city` — it has no geolocation logic
- These fields will always be blank for every cookie consent record
- Fix: either add geolocation to the JS payload (IP-based via a free API call in Make.com) or remove the field mappings

**BRK-04: Artwork inquiry sets wrong enum values for Lead Source and Interaction Type**
- `Lead Source` hardcoded as "Artwork Page" — enum options are: WhatsApp, Collection, Contact Form → no match, typecast creates ad-hoc value
- `Interaction Type` hardcoded as "Contact Form" — enum options are: WhatsApp Click, Artwork Zoom, Form Submit → should be "Form Submit"
- Result: Leads table has inconsistent Lead Source values mixing "Artwork Page" and "Contact Form" etc.

**BRK-05: Cookie scenario sets Lead Type to "Cookie Accept" — not in enum**
- Lead Type enum: Portrait Inquiry, Artwork Inquiry, Contact, WhatsApp Lead
- "Cookie Accept" is typecast-created ad-hoc — inconsistent with the defined taxonomy
- Cookie consent records are analytics fingerprints, not leads; using a non-standard type pollutes lead-type filters

### MEDIUM — Logic Bugs

**BRK-06: WA Telegram notification shows Lead Source instead of Lead Score**
- Scenario 9449734, Telegram module, text field:
  `Intent Score: {{3.\`Lead Source\`}}`  
- `3.Lead Source` resolves to "WhatsApp" (a string) — always shows "WhatsApp" regardless of score
- Should be: `{{3.\`Lead Score\`}}` or `{{3.\`🌡 Lead Heat\`}}`

**BRK-07: The Sovereign Schema.org availability is incorrect**
- `artworks/the-sovereign.html` JSON-LD sets `"availability": "https://schema.org/InStock"` 
- Artwork is `not_for_sale` (Private Collection) — correct value is `"https://schema.org/OutOfStock"`
- SEO impact: Google may index this as a purchasable product

**BRK-08: WA intent score cap asymmetry**
- JS crm_score formula: `(session_score × 2) + (artwork_bonus 2)` → max = 8
- Make.com caps at 5: `if(2.intent_score > 5; 5; ...)`
- Hot threshold in Telegram notification: `>= 7` → score 8 capped to 5 → never reaches HOT via Airtable field, though Telegram heat label is set correctly via the `>= 3 → Warm` branch
- Minor: the 🌡 Lead Heat field (Hot/Warm/Cold) is correct; only the numeric Lead Score field in Airtable is under-represented for very high-intent leads

---

## 4. Missing CRM Fields

### Fields Sent by JS but Never Reaching Airtable

| Field               | Sent By                     | Missing Because                        | Priority |
|---------------------|-----------------------------|----------------------------------------|----------|
| name                | contact.html                | No scenario for contact form           | CRITICAL |
| email               | contact.html                | No scenario for contact form           | CRITICAL |
| message             | contact.html                | No scenario for contact form           | CRITICAL |
| name                | custom-portraits.html       | No scenario for portrait inquiry       | CRITICAL |
| email               | custom-portraits.html       | No scenario for portrait inquiry       | CRITICAL |
| photos (attachment) | custom-portraits.html       | No scenario for portrait inquiry       | CRITICAL |
| subject_type        | custom-portraits.html form  | No scenario + not in Leads schema      | CRITICAL |
| portrait_size       | custom-portraits.html form  | No scenario + not in Leads schema      | CRITICAL |
| budget              | custom-portraits.html form  | No scenario + not in Leads schema      | CRITICAL |
| occasion            | custom-portraits.html form  | No scenario + not in Leads schema      | CRITICAL |
| customer_notes      | custom-portraits.html form  | No scenario + not in Leads schema      | CRITICAL |
| country             | (nowhere — JS doesn't send) | Make.com maps it but JS has no geo     | HIGH     |
| city                | (nowhere — JS doesn't send) | Make.com maps it but JS has no geo     | HIGH     |
| timezone            | main.js §3 cookie payload   | Not mapped in Make.com scenario        | LOW      |
| artwork_slug        | artwork-loader.js           | Mapped ✅ (fldxWXVQpdQ1cyNMt)          | OK       |

### Leads Table Fields Never Populated by Any Flow

These Leads table fields exist but no scenario currently writes to them on ingest:

| Field                   | Populated By              | Notes                                              |
|-------------------------|---------------------------|----------------------------------------------------|
| Phone                   | Nothing                   | WA leads have no form; could add to portrait/contact forms |
| Auto-Reply Sent         | Nothing                   | No auto-reply scenario exists                      |
| Studio Notification Sent| Nothing (only Telegram)   | Telegram alert exists for WA only; no email notification |
| Urgency Level           | Nothing                   | Computed field — fill manually or via formula      |
| ⚡ Urgency              | Nothing                   | Formula field in Airtable — fires on its own       |
| 🕐 Response Window      | Nothing                   | Formula field — auto-computes                      |
| COLLECTORS CRM (link)   | Nothing                   | Link to tblDDk6J6iqHh3A6n — no automation promotes leads |

---

## 5. Optimization Plan

### Priority 1 — Fix Data Loss (Implement Immediately)

**OPT-01: Build Make.com scenario for Contact Form**
- Create webhook scenario on hook `8w5nlujfrfsdya2kgr56d1c4okucenw1`
- Write to Leads: Name, Email, Message, Source Page, Lead Type="Contact", Lead Source="Contact Form", Interaction Type="Form Submit", Status="New"
- Add Telegram notification

**OPT-02: Build Make.com scenario for Portrait Inquiry**  
- Create webhook scenario on hook `vm1odajacsqc1wezmxc56lmx0q4cbmry`
- Write to Leads: Name, Email, Message, Source Page, Subject Type, Portrait Size, Budget, Occasion, Customer Notes, Lead Type="Portrait Inquiry", Lead Source="Portrait Page", Status="New"
- Attach uploaded photos to Airtable record (Make.com supports multipart/form-data)
- Telegram notification with portrait details

### Priority 2 — Fix Field Bugs (Quick Fixes in Make.com)

**OPT-03: Fix Artwork Inquiry Lead Source and Interaction Type enum values**
- Change Lead Source: "Artwork Page" → "Collection" (closest match in enum)  
- Change Interaction Type: "Contact Form" → "Form Submit"  
- OR add "Artwork Page" and keep it consistent — but standardise the enum in Airtable first

**OPT-04: Fix WA Telegram notification text**
- In scenario 9449734, Telegram module, change:  
  `Intent Score: {{3.\`Lead Source\`}}`  
  → `Heat: {{3.\`🌡 Lead Heat\`}} | Score: {{3.\`Lead Score\`}}`

**OPT-05: Fix Cookie Lead Type**
- Change hardcoded "Cookie Accept" to "Website Visitor" and add that option to the Lead Type enum in Airtable
- Or: create a separate Airtable table for visitor fingerprints and route cookie data there instead of Leads (cleaner separation of CRM leads vs anonymous analytics)

**OPT-06: Fix Country/City field mismatch in Cookie scenario**  
Two options:
  - A. Add an IP geolocation step in Make.com (HTTP module → `ip-api.com/json` — free, no key) before the Airtable write, then map country and city from the API response
  - B. Remove Country and City from the cookie scenario's Airtable write — these fields will be populated accurately when a lead actually submits a form

### Priority 3 — Schema and SEO Fixes

**OPT-07: Fix The Sovereign Schema.org availability**
- `artworks/the-sovereign.html` line 104:  
  Change `"https://schema.org/InStock"` → `"https://schema.org/OutOfStock"`

### Priority 4 — Enhancements

**OPT-08: Add Telegram notification to Artwork Inquiry scenario (9452945)**
- Currently the scenario only writes to Airtable — no studio alert
- Add Telegram SendMessage step matching the WA scenario pattern

**OPT-09: Add Telegram notification to Cookie Consent scenario (9450025)**
- Optional: only alert on high-intent cookie accepts (intent_score ≥ 3)
- Useful for seeing active high-value sessions in real time

**OPT-10: Auto-reply email on form submissions**
- Neither Contact nor Artwork Inquiry send an auto-reply to the customer
- Add an email step (Gmail or SMTP module) after the Airtable write confirming receipt

**OPT-11: Raise WA intent score cap to 10**
- Change Make.com formula from `if(2.intent_score > 5; 5; ...)` to `if(2.intent_score > 10; 10; ...)` to preserve the full HOT scoring range

**OPT-12: Deduplicate cookie consent records by visitor_id**
- Currently each cookie accept creates a new Leads record, even if the same visitor returns on a new session
- Add a Search Records step before Create: if visitor_id exists, update that record instead of creating a new one

---

## Scenario Inventory — All VaCa Scenarios

| ID      | Name                       | Status  | Hook ID | Packages              | Executions | Last Edited |
|---------|----------------------------|---------|---------|-----------------------|------------|-------------|
| 9449734 | Watssapp Webhook leed      | ACTIVE  | 4225771 | gateway, airtable, telegram | —     | 2026-06-27  |
| 9450025 | Cookies CRM save           | ACTIVE  | 4225885 | gateway, airtable     | 6          | 2026-06-27  |
| 9452945 | VaCa Artwork Inquiry CRM   | ACTIVE  | 4226992 | gateway, airtable     | —          | 2026-06-28  |
| —       | Contact Form               | MISSING | 8w5nl…  | —                     | —          | —           |
| —       | Portrait Inquiry           | MISSING | vm1od…  | —                     | —          | —           |

## Airtable Base Inventory

| Table                 | ID                   | Purpose                          |
|-----------------------|----------------------|----------------------------------|
| ARTWORKS              | tblDWbVRiNC49RAxf    | Artwork catalog                  |
| SALES PLATFORMS       | tblbcXlj6ondjBDvd    | Platform list                    |
| PLATFORM PRICING      | tblDDk6J6iqHh3A6n    | Platform-level pricing           |
| COLLECTORS CRM        | tbltxJzIzrSzLWc3m    | High-value collector pipeline    |
| CONTENT LIBRARY       | tblWGSFg1h77JSgHo    | Social content management        |
| SALES                 | tblTfEsdmJP6VtMv2    | Revenue tracking                 |
| Media Library         | tbln51pI52RrF3QYV    | Media assets                     |
| Content Ideas         | tbl8dGeB0ttyIKPbg    | Content ideation                 |
| Performance           | tblpMcn0o8xd5HKzo    | Analytics                        |
| 🤖 TELEGRAM INBOX     | tblU4kBCGc1HUqVoH    | Telegram bot inbox               |
| **Leads**             | **tblCOVYuKMZq28Usi** | **VaCa CRM — primary**          |

**Leads table**: 80+ fields covering full funnel from first touch (cookie accept) through inquiry, quote, payment, production, shipping, review. Well-structured. Key gap: no automation promotes a Lead to COLLECTORS CRM when a sale converts.
