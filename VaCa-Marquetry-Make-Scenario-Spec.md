# VaCa Marquetry — Make.com Scenario Build Specification
**Version:** 1.0  
**Date:** June 2026  
**Base ID:** `appgaZWpeSTTkjoUa`  
**Leads Table ID:** `tblCOVYuKMZq28Usi`  
**Studio email:** `vacamarquetry@vacamarquetry.shop`

---

## Confirmed Airtable Field ID Reference

Use these IDs when Make.com asks you to map fields in Airtable modules.  
In the Make.com UI, fields appear by name — the IDs are shown here for verification.

| Field Name | Field ID | Used in Scenario |
|---|---|---|
| Name | `fldThfotMzUA4FQ2N` | All |
| Email | `flducnT9WKNjz4M4s` | All |
| Phone | `fldACJlpGGoeWwalv` | Portrait |
| Lead Type | `fld4W3TE9wPeg4WWA` | All |
| Status | `fldqHNgvHnC4DNORq` | All |
| Lead Score | `fldENjUV5MUonr2p8` | — (not set by Make) |
| Submitted At | `fldvsie6oEf4ySLqI` | All |
| Needed By | `fldJqXv40FwRjuW0w` | Portrait |
| Follow-up Date | `fldpjkes6CU2R5HJ7` | — (not set by Make) |
| Subject Type | `fldvj1s2LxhQkYRVj` | Portrait |
| Portrait Size | `fldH1r7dvwOiqouF3` | Portrait |
| Budget | `fld7GKzxNohy8Alnh` | Portrait |
| Occasion | `fldTSUUPTSk7hbMzx` | Portrait |
| Customer Notes | `fldQUfUcmm5PC4VWq` | Portrait |
| Photos | `fldNQyW1ZsdSZj85r` | Portrait |
| Artwork Title | `fldDbFmHJI1yWOGOK` | Artwork |
| Artwork Slug | `fldxWXVQpdQ1cyNMt` | Artwork |
| Artwork Page URL | `fldPGil8DnymnH6Gh` | Artwork |
| Message | `fldCpq4OtSTctW0ck` | Contact, Artwork |
| Quoted Amount | `fldZz8rQQYkaoeoYZ` | — (manual) |
| Deposit Amount | `fldhYmQxlbbqAfull` | — (manual) |
| Final Amount | `fldpo79nMnF3uhIph` | — (manual) |
| Source Page | `fldQjvWaXDKHJ651y` | All |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | All |
| Auto-Reply Sent | `fldThHZndq1RayxTK` | All |
| Studio Notification Sent | `flddPlPAmyjNOp9wv` | All |
| Studio Notes | `fld9O3UBs2LtgXC9E` | — (manual) |
| Days Since Submitted | `fldBm33mWdxTd7vuX` | — (formula, auto) |

**Single select choice names** (pass as plain text strings in Make.com):

Lead Type: `Portrait Inquiry` / `Artwork Inquiry` / `Contact`  
Status default: `New`

---

## Prerequisites

Before building any scenario:

1. **Make.com account** — free tier supports 1,000 operations/month (sufficient for start)
2. **Airtable connection** — In Make.com → Connections → Add → Airtable → authorise with your Airtable account
3. **Gmail connection** — In Make.com → Connections → Add → Gmail → authorise with `vacamarquetry@vacamarquetry.shop`
4. **Three empty scenarios created** — name them exactly as below before adding modules

---

## Global Scenario Settings

Apply to all three scenarios:

| Setting | Value |
|---|---|
| Time zone | Europe/Rome |
| Sequential processing | ON (prevents duplicate records if two submissions arrive simultaneously) |
| Auto commit | ON |
| Max errors | 3 (before scenario deactivates itself) |
| Error notification email | `vacamarquetry@vacamarquetry.shop` |

---

---

# SCENARIO 1 — Portrait Inquiry

**Scenario name:** `VaCa — Portrait Inquiry`  
**Trigger:** Webhooks — Custom webhook  
**Total modules:** 7  
**Operations per run:** ~6–8 (varies by photo count)

---

## Module 1 — Webhook Trigger

**App:** Webhooks  
**Module type:** Custom webhook

**Configuration:**
| Setting | Value |
|---|---|
| Webhook name | `VaCa Portrait Inquiry` |
| Data structure | Parse automatically on first test submission |
| IP restrictions | None |

**After creating the webhook:**
- Make.com gives you a URL like `https://hook.eu2.make.com/xxxxxxxxxxxxxxxxx`
- Copy this URL — it goes into the website JS as `PORTRAIT_WEBHOOK_URL`
- Click "Run once" in Make.com, then submit the portrait form on the website to capture the data structure

**Expected incoming fields from website:**

| Field name | Type | Notes |
|---|---|---|
| `name` | text | |
| `email` | text | |
| `phone` | text | Optional |
| `needed_by` | text | ISO date string `YYYY-MM-DD` or empty |
| `subject_type` | text | Matches select option name |
| `size` | text | Matches Portrait Size option name |
| `budget` | text | Matches Budget option name |
| `occasion` | text | Optional |
| `notes` | text | Optional |
| `source_url` | text | Full page URL |
| `photos` | file array | Binary, multipart/form-data |

---

## Module 2 — Create Airtable Lead Record

**App:** Airtable  
**Module type:** Create a Record

**Configuration:**
| Setting | Value |
|---|---|
| Connection | Your Airtable connection |
| Base | `appgaZWpeSTTkjoUa` (VaCa Marquetry CRM) |
| Table | `tblCOVYuKMZq28Usi` (Leads) |

**Field mappings:**

| Airtable Field | Field ID | Map to |
|---|---|---|
| Name | `fldThfotMzUA4FQ2N` | `{{1.name}}` |
| Email | `flducnT9WKNjz4M4s` | `{{1.email}}` |
| Phone | `fldACJlpGGoeWwalv` | `{{1.phone}}` |
| Lead Type | `fld4W3TE9wPeg4WWA` | `Portrait Inquiry` *(hardcoded text)* |
| Status | `fldqHNgvHnC4DNORq` | `New` *(hardcoded text)* |
| Submitted At | `fldvsie6oEf4ySLqI` | `{{formatDate(now; "YYYY-MM-DDTHH:mm:ss")}}` |
| Needed By | `fldJqXv40FwRjuW0w` | `{{1.needed_by}}` *(leave blank if empty)* |
| Subject Type | `fldvj1s2LxhQkYRVj` | `{{1.subject_type}}` |
| Portrait Size | `fldH1r7dvwOiqouF3` | `{{1.size}}` |
| Budget | `fld7GKzxNohy8Alnh` | `{{1.budget}}` |
| Occasion | `fldTSUUPTSk7hbMzx` | `{{1.occasion}}` |
| Customer Notes | `fldQUfUcmm5PC4VWq` | `{{1.notes}}` |
| Source Page | `fldQjvWaXDKHJ651y` | `{{1.source_url}}` |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | `{{executionId}}` |

> **Do not map Photos here.** Photos are attached in Module 5 after the record exists.  
> **Do not map Lead Score, Follow-up Date, Studio Notes** — these are set manually.

**Output used in later modules:** `{{2.id}}` — the new Airtable record ID.

**Add error handler to this module:**
Right-click Module 2 → Add error handler → Break.  
This stores the failed bundle in Make.com's incomplete executions queue rather than silently dropping it.

---

## Module 3 — Iterator (loop over uploaded photos)

**App:** Flow Control  
**Module type:** Iterator

**Configuration:**
| Setting | Value |
|---|---|
| Array | `{{1.photos[]}}` |

This creates one bundle per uploaded photo. If the customer uploaded 3 photos, modules 4 and 5 run 3 times. If no photos were uploaded (empty array), modules 4 and 5 are skipped entirely.

---

## Module 4 — Upload Photo to Airtable

**App:** Airtable  
**Module type:** Update a Record

**Configuration:**
| Setting | Value |
|---|---|
| Connection | Your Airtable connection |
| Base | `appgaZWpeSTTkjoUa` |
| Table | `tblCOVYuKMZq28Usi` |
| Record ID | `{{2.id}}` *(record created in Module 2)* |

**Field mappings:**

| Airtable Field | Field ID | Map to |
|---|---|---|
| Photos | `fldNQyW1ZsdSZj85r` | `{{3.value}}` |

> `{{3.value}}` is the current file bundle from the Iterator.  
> Make.com's Airtable module handles binary-to-attachment conversion automatically.  
> Each run of this module appends one more file to the Photos attachment field.

---

## Module 5 — Send Studio Notification (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| Connection | Gmail connection for `vacamarquetry@vacamarquetry.shop` |
| To | `vacamarquetry@vacamarquetry.shop` |
| Subject | `New Portrait Inquiry — {{1.name}} — {{1.size}}` |
| Reply-To | `{{1.email}}` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:600px;color:#261608;">
  <h2 style="color:#A87C45;border-bottom:1px solid #DDD3BC;padding-bottom:12px;">
    New Portrait Inquiry
  </h2>
  <p style="color:#888;font-size:13px;">Received: {{formatDate(now; "D MMM YYYY [at] HH:mm")}} (Rome time)</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;width:140px;color:#888;font-size:13px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;font-weight:600;">{{1.name}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;"><a href="mailto:{{1.email}}" style="color:#A87C45;">{{1.email}}</a></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;">{{if(1.phone; 1.phone; "—")}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Size</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;font-weight:600;">{{1.size}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Budget</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;">{{1.budget}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Subject</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;">{{1.subject_type}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Occasion</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;">{{if(1.occasion; 1.occasion; "—")}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Needed By</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;">{{if(1.needed_by; 1.needed_by; "—")}}</td></tr>
  </table>

  {{if(1.notes)}}
  <div style="margin-top:20px;padding:16px;background:#F7F3EC;border-left:3px solid #A87C45;">
    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Notes from customer</p>
    <p style="margin:0;">{{1.notes}}</p>
  </div>
  {{end}}

  <div style="margin-top:24px;">
    <a href="https://airtable.com/appgaZWpeSTTkjoUa/tblCOVYuKMZq28Usi/{{2.id}}"
       style="background:#A87C45;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-size:13px;display:inline-block;">
      View in Airtable →
    </a>
  </div>

  <p style="margin-top:32px;font-size:11px;color:#aaa;">
    Run ID: {{executionId}} · Photos stored in Airtable record
  </p>
</div>
```

> **Run once trigger note:** Because Module 5 is after the Iterator, it runs once per photo bundle. Add a **Router** before Module 5 if you want the email sent only once. See §Router note at end of Scenario 1.

---

## Module 6 — Send Customer Auto-Reply (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| Connection | Gmail connection for `vacamarquetry@vacamarquetry.shop` |
| To | `{{1.email}}` |
| Subject | `Thank you, {{1.name}} — VaCa Marquetry` |
| From name | `VaCa Marquetry` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:560px;color:#261608;line-height:1.7;">
  <p style="font-size:22px;color:#A87C45;margin-bottom:4px;">VaCa Marquetry</p>
  <div style="width:40px;height:1px;background:#A87C45;margin-bottom:28px;"></div>

  <p>Dear {{1.name}},</p>

  <p>Thank you for reaching out to VaCa Marquetry.</p>

  <p>We have received your enquiry and your photograph{{if(gt(length(1.photos); 1); "s"; "")}}, and will prepare your free portrait preview within <strong>24 hours</strong>. No payment or commitment is required at this stage.</p>

  <p style="font-weight:600;margin-top:24px;">What happens next:</p>
  <ol style="padding-left:20px;">
    <li style="margin-bottom:8px;">We study your photograph and compose your preview</li>
    <li style="margin-bottom:8px;">We send the preview to this email address within 24 hours</li>
    <li style="margin-bottom:8px;">If you wish to proceed, a 50% deposit confirms your commission</li>
  </ol>

  <p>If you have any questions in the meantime, simply reply to this email.</p>

  <p style="margin-top:32px;">With warm regards,</p>
  <p style="color:#A87C45;font-weight:600;">VaCa Marquetry</p>
  <p style="font-size:13px;color:#888;margin-top:4px;">
    Italy &nbsp;·&nbsp; vacamarquetry@vacamarquetry.shop<br>
    instagram.com/vacamarquetry
  </p>
</div>
```

---

## Module 7 — Update Airtable Record (set confirmation flags)

**App:** Airtable  
**Module type:** Update a Record

**Configuration:**
| Setting | Value |
|---|---|
| Connection | Your Airtable connection |
| Base | `appgaZWpeSTTkjoUa` |
| Table | `tblCOVYuKMZq28Usi` |
| Record ID | `{{2.id}}` |

**Field mappings:**

| Airtable Field | Field ID | Value |
|---|---|---|
| Auto-Reply Sent | `fldThHZndq1RayxTK` | `true` |
| Studio Notification Sent | `flddPlPAmyjNOp9wv` | `true` |

---

## Router Note — Preventing Duplicate Emails

Because the Iterator (Module 3) runs once per photo, Modules 5 and 6 will fire once per photo without a Router. To send the emails only once:

**Option A (recommended): Move emails before the Iterator**
Reorder modules: 1 → 2 → 5 (Studio email) → 6 (Auto-reply) → 3 (Iterator) → 4 (Upload) → 7 (Update flags).
Emails fire once after record creation. Iterator and upload run after.

**Option B: Use an Aggregator after the Iterator**
Add a "Numeric aggregator" after Module 4 to collapse all bundles back into one, then continue with emails and flag update. More complex but keeps sequential order.

**Recommended build order: Option A.** Reorder to: 1 → 2 → Studio email → Customer email → Iterator → Photo upload → Update flags.

---

---

# SCENARIO 2 — Contact

**Scenario name:** `VaCa — Contact`  
**Trigger:** Webhooks — Custom webhook  
**Total modules:** 4  
**Operations per run:** 4

---

## Module 1 — Webhook Trigger

**App:** Webhooks  
**Module type:** Custom webhook

**Configuration:**
| Setting | Value |
|---|---|
| Webhook name | `VaCa Contact` |
| Data structure | Parse automatically on first test submission |

**Expected incoming fields:**

| Field name | Type |
|---|---|
| `name` | text |
| `email` | text |
| `message` | text |
| `source_url` | text |

---

## Module 2 — Create Airtable Lead Record

**App:** Airtable  
**Module type:** Create a Record

**Configuration:**
| Setting | Value |
|---|---|
| Base | `appgaZWpeSTTkjoUa` |
| Table | `tblCOVYuKMZq28Usi` |

**Field mappings:**

| Airtable Field | Field ID | Map to |
|---|---|---|
| Name | `fldThfotMzUA4FQ2N` | `{{1.name}}` |
| Email | `flducnT9WKNjz4M4s` | `{{1.email}}` |
| Lead Type | `fld4W3TE9wPeg4WWA` | `Contact` *(hardcoded)* |
| Status | `fldqHNgvHnC4DNORq` | `New` *(hardcoded)* |
| Message | `fldCpq4OtSTctW0ck` | `{{1.message}}` |
| Submitted At | `fldvsie6oEf4ySLqI` | `{{formatDate(now; "YYYY-MM-DDTHH:mm:ss")}}` |
| Source Page | `fldQjvWaXDKHJ651y` | `{{1.source_url}}` |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | `{{executionId}}` |

---

## Module 3 — Send Studio Notification (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| To | `vacamarquetry@vacamarquetry.shop` |
| Subject | `New Contact — {{1.name}}` |
| Reply-To | `{{1.email}}` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:600px;color:#261608;">
  <h2 style="color:#A87C45;border-bottom:1px solid #DDD3BC;padding-bottom:12px;">
    New Contact Message
  </h2>
  <p style="color:#888;font-size:13px;">Received: {{formatDate(now; "D MMM YYYY [at] HH:mm")}} (Rome time)</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;width:140px;color:#888;font-size:13px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;font-weight:600;">{{1.name}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;"><a href="mailto:{{1.email}}" style="color:#A87C45;">{{1.email}}</a></td></tr>
  </table>

  <div style="margin-top:20px;padding:16px;background:#F7F3EC;border-left:3px solid #A87C45;">
    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Message</p>
    <p style="margin:0;">{{1.message}}</p>
  </div>

  <div style="margin-top:24px;">
    <a href="https://airtable.com/appgaZWpeSTTkjoUa/tblCOVYuKMZq28Usi/{{2.id}}"
       style="background:#A87C45;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-size:13px;display:inline-block;">
      View in Airtable →
    </a>
  </div>
</div>
```

---

## Module 4 — Send Customer Auto-Reply (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| To | `{{1.email}}` |
| Subject | `Thank you, {{1.name}} — VaCa Marquetry` |
| From name | `VaCa Marquetry` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:560px;color:#261608;line-height:1.7;">
  <p style="font-size:22px;color:#A87C45;margin-bottom:4px;">VaCa Marquetry</p>
  <div style="width:40px;height:1px;background:#A87C45;margin-bottom:28px;"></div>

  <p>Dear {{1.name}},</p>

  <p>Thank you for contacting VaCa Marquetry. We will reply within <strong>48 hours</strong>.</p>

  <p>If your enquiry is urgent, you are also welcome to reach us directly at <a href="mailto:vacamarquetry@vacamarquetry.shop" style="color:#A87C45;">vacamarquetry@vacamarquetry.shop</a>.</p>

  <p style="margin-top:32px;">With warm regards,</p>
  <p style="color:#A87C45;font-weight:600;">VaCa Marquetry</p>
  <p style="font-size:13px;color:#888;margin-top:4px;">
    Italy &nbsp;·&nbsp; vacamarquetry@vacamarquetry.shop<br>
    instagram.com/vacamarquetry
  </p>
</div>
```

> **Note:** No Module 5 "update flags" is strictly necessary for the Contact scenario since there are no photos and the flow is linear. However, if you want flag tracking, add an Airtable Update Record module mapping `Auto-Reply Sent` → `true` and `Studio Notification Sent` → `true`.

---

---

# SCENARIO 3 — Artwork Inquiry

**Scenario name:** `VaCa — Artwork Inquiry`  
**Trigger:** Webhooks — Custom webhook  
**Total modules:** 4  
**Operations per run:** 4

---

## Module 1 — Webhook Trigger

**App:** Webhooks  
**Module type:** Custom webhook

**Configuration:**
| Setting | Value |
|---|---|
| Webhook name | `VaCa Artwork Inquiry` |
| Data structure | Parse automatically on first test submission |

**Expected incoming fields:**

| Field name | Type | Source |
|---|---|---|
| `name` | text | Customer input |
| `email` | text | Customer input |
| `message` | text | Customer input |
| `artwork_title` | text | Injected by artwork-loader.js from JSON data |
| `artwork_slug` | text | Injected by artwork-loader.js from body data-slug |
| `artwork_url` | text | Injected by JS — current page URL |
| `source_url` | text | Same as artwork_url |

---

## Module 2 — Create Airtable Lead Record

**App:** Airtable  
**Module type:** Create a Record

**Configuration:**
| Setting | Value |
|---|---|
| Base | `appgaZWpeSTTkjoUa` |
| Table | `tblCOVYuKMZq28Usi` |

**Field mappings:**

| Airtable Field | Field ID | Map to |
|---|---|---|
| Name | `fldThfotMzUA4FQ2N` | `{{1.name}}` |
| Email | `flducnT9WKNjz4M4s` | `{{1.email}}` |
| Lead Type | `fld4W3TE9wPeg4WWA` | `Artwork Inquiry` *(hardcoded)* |
| Status | `fldqHNgvHnC4DNORq` | `New` *(hardcoded)* |
| Message | `fldCpq4OtSTctW0ck` | `{{1.message}}` |
| Artwork Title | `fldDbFmHJI1yWOGOK` | `{{1.artwork_title}}` |
| Artwork Slug | `fldxWXVQpdQ1cyNMt` | `{{1.artwork_slug}}` |
| Artwork Page URL | `fldPGil8DnymnH6Gh` | `{{1.artwork_url}}` |
| Submitted At | `fldvsie6oEf4ySLqI` | `{{formatDate(now; "YYYY-MM-DDTHH:mm:ss")}}` |
| Source Page | `fldQjvWaXDKHJ651y` | `{{1.source_url}}` |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | `{{executionId}}` |

---

## Module 3 — Send Studio Notification (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| To | `vacamarquetry@vacamarquetry.shop` |
| Subject | `New Artwork Inquiry — {{1.name}} — {{1.artwork_title}}` |
| Reply-To | `{{1.email}}` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:600px;color:#261608;">
  <h2 style="color:#A87C45;border-bottom:1px solid #DDD3BC;padding-bottom:12px;">
    New Artwork Inquiry
  </h2>
  <p style="color:#888;font-size:13px;">Received: {{formatDate(now; "D MMM YYYY [at] HH:mm")}} (Rome time)</p>

  <table style="width:100%;border-collapse:collapse;margin-top:16px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;width:140px;color:#888;font-size:13px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;font-weight:600;">{{1.name}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Email</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;"><a href="mailto:{{1.email}}" style="color:#A87C45;">{{1.email}}</a></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Artwork</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;font-weight:600;">{{1.artwork_title}}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;color:#888;font-size:13px;">Artwork page</td><td style="padding:8px 0;border-bottom:1px solid #EDE7D9;"><a href="{{1.artwork_url}}" style="color:#A87C45;">{{1.artwork_url}}</a></td></tr>
  </table>

  <div style="margin-top:20px;padding:16px;background:#F7F3EC;border-left:3px solid #A87C45;">
    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Message from customer</p>
    <p style="margin:0;">{{1.message}}</p>
  </div>

  <div style="margin-top:24px;">
    <a href="https://airtable.com/appgaZWpeSTTkjoUa/tblCOVYuKMZq28Usi/{{2.id}}"
       style="background:#A87C45;color:#fff;padding:12px 24px;text-decoration:none;font-family:sans-serif;font-size:13px;display:inline-block;">
      View in Airtable →
    </a>
  </div>
</div>
```

---

## Module 4 — Send Customer Auto-Reply (Gmail)

**App:** Gmail  
**Module type:** Send an Email

**Configuration:**
| Setting | Value |
|---|---|
| To | `{{1.email}}` |
| Subject | `Your enquiry about "{{1.artwork_title}}" — VaCa Marquetry` |
| From name | `VaCa Marquetry` |
| Content type | HTML |

**Body (HTML):**
```html
<div style="font-family:Georgia,serif;max-width:560px;color:#261608;line-height:1.7;">
  <p style="font-size:22px;color:#A87C45;margin-bottom:4px;">VaCa Marquetry</p>
  <div style="width:40px;height:1px;background:#A87C45;margin-bottom:28px;"></div>

  <p>Dear {{1.name}},</p>

  <p>Thank you for your interest in <em>{{1.artwork_title}}</em>.</p>

  <p>We will confirm current availability and pricing privately within <strong>48 hours</strong>. Every original is offered on an exclusive basis and will not be publicly listed once reserved.</p>

  <p>If you have any questions in the meantime, simply reply to this email.</p>

  <p style="margin-top:32px;">With warm regards,</p>
  <p style="color:#A87C45;font-weight:600;">VaCa Marquetry</p>
  <p style="font-size:13px;color:#888;margin-top:4px;">
    Italy &nbsp;·&nbsp; vacamarquetry@vacamarquetry.shop<br>
    instagram.com/vacamarquetry
  </p>
</div>
```

---

---

# Testing Checklist

Complete this for each scenario before going live.

### For each scenario:
- [ ] Scenario is saved and **Active** (toggle in top-right of scenario editor)
- [ ] Webhook URL is copied and confirmed as correct
- [ ] Ran "Run once" and captured a live test submission from the website form
- [ ] Airtable record was created with correct field values
- [ ] `Lead Type` is correct (not blank, not mismatched)
- [ ] `Status` = "New"
- [ ] `Submitted At` contains a date/time (not empty)
- [ ] `Make Run ID` is populated
- [ ] Studio notification email arrived at `vacamarquetry@vacamarquetry.shop`
- [ ] Studio email "Reply-To" → clicking Reply addresses the customer's email
- [ ] Customer auto-reply arrived at the test email address
- [ ] Customer email "From" shows "VaCa Marquetry"
- [ ] Airtable "View in Airtable" link in studio email opens the correct record

### Portrait Inquiry only:
- [ ] Photos uploaded to Airtable `Photos` field (visible as thumbnails in record)
- [ ] Correct number of photo files stored (test with 2 images)
- [ ] `Auto-Reply Sent` = ✓ in Airtable record
- [ ] `Studio Notification Sent` = ✓ in Airtable record

### After all three pass:
- [ ] Test back-to-back submissions within 30 seconds to confirm sequential processing works
- [ ] Check Make.com scenario history — all runs show green (no errors)
- [ ] Set Make.com scenario error notification email to `vacamarquetry@vacamarquetry.shop` in scenario settings

---

# Make.com Operation Count Estimate

| Scenario | Modules | Runs/month (estimate) | Operations/month |
|---|---|---|---|
| Portrait Inquiry | 7 modules × avg 4 photos | 10 submissions | ~280 |
| Contact | 4 modules | 15 submissions | ~60 |
| Artwork Inquiry | 4 modules | 15 submissions | ~60 |
| **Total** | | | **~400 / 1,000 free tier** |

Free tier (1,000 ops/month) is sufficient. Upgrade to the Core plan (10,000 ops) only if monthly leads exceed ~70 combined.

---

# Webhook URLs — Where to Paste Them

Once you create the three webhooks in Make.com, copy the three URLs and give them to the website implementation step:

| Variable name (in website JS) | Make.com webhook |
|---|---|
| `PORTRAIT_WEBHOOK_URL` | Scenario 1 webhook URL |
| `CONTACT_WEBHOOK_URL` | Scenario 2 webhook URL |
| `ARTWORK_WEBHOOK_URL` | Scenario 3 webhook URL |

---

*End of Make.com scenario specification.*  
*Next step: Website implementation — form JS, artwork inquiry form, webhook integration.*

---

---

# SCENARIO 4 — WhatsApp Lead

**Scenario name:** `VaCa — WhatsApp Lead`  
**Trigger:** Webhooks — Custom webhook  
**Total modules:** 2  
**Operations per run:** 2  

> **Why this exists:** When a visitor clicks the WhatsApp button, the website fires a
> JSON POST to this webhook *before* opening WhatsApp. No form is submitted — the lead
> is anonymous but carries page, artwork interest, and intent score.

---

## Step 1 — Create the webhook in Make.com

1. Open Make.com → Create a new scenario
2. Add module: **Webhooks → Custom webhook**
3. Click **Add** → name it `VaCa WhatsApp Lead`
4. Click **Save** — Make.com gives you a URL like:  
   `https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxxx`
5. Copy that URL

## Step 2 — Paste the URL into main.js

Open `assets/js/main.js` and find line 61:

```js
var WA_WEBHOOK_URL = '';  /* ← PASTE MAKE.COM WA SCENARIO WEBHOOK URL */
```

Replace `''` with your URL:

```js
var WA_WEBHOOK_URL = 'https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxxx';
```

Save and redeploy.

## Step 3 — Capture the data structure

1. In Make.com, click **Run once** on the scenario
2. Click the WhatsApp button on the live website
3. Make.com captures the incoming payload:

```json
{
  "lead_type":        "WhatsApp Lead",
  "lead_source":      "WhatsApp",
  "interaction_type": "WhatsApp Click",
  "artwork_context":  "Black Woman",
  "intent_score":     3,
  "source_page":      "https://vacamarquetry.shop/artworks/black-woman.html",
  "submitted_at":     "2026-06-27T14:32:00.000Z"
}
```

4. Click **OK** to confirm the data structure

---

## Module 1 — Webhook Trigger

**App:** Webhooks  
**Module type:** Custom webhook

**Expected incoming fields:**

| Field name | Type | Example |
|---|---|---|
| `lead_type` | text | `WhatsApp Lead` |
| `lead_source` | text | `WhatsApp` |
| `interaction_type` | text | `WhatsApp Click` |
| `artwork_context` | text | `Black Woman` *(empty string if no artwork viewed)* |
| `intent_score` | number | `1–3` |
| `source_page` | text | Full page URL |
| `submitted_at` | text | ISO 8601 datetime |
| `incoming_message` | text | Pre-filled WhatsApp message text |

---

## Module 2 — Create Airtable Lead Record

**App:** Airtable  
**Module type:** Create a Record

**Configuration:**

| Setting | Value |
|---|---|
| Base | `appgaZWpeSTTkjoUa` |
| Table | `tblCOVYuKMZq28Usi` (Leads) |

**Field mappings:**

| Airtable Field | Field ID | Map to |
|---|---|---|
| Lead Type | `fld4W3TE9wPeg4WWA` | `WhatsApp Lead` *(hardcoded — add this option first — see note)* |
| Status | `fldqHNgvHnC4DNORq` | `New` *(hardcoded)* |
| Lead Source | `fldwk0CgCYqw8s51V` | `WhatsApp` |
| Interaction Type | `fldRN40zMJuQ3tGzY` | `WhatsApp Click` |
| Artwork Title | `fldDbFmHJI1yWOGOK` | `{{1.artwork_context}}` |
| Source Page | `fldQjvWaXDKHJ651y` | `{{1.source_page}}` |
| Lead Score | `fldENjUV5MUonr2p8` | `{{1.intent_score}}` |
| Incoming Message | `fldLikiOEnMDXp3a5` | `{{1.incoming_message}}` |
| Submitted At | `fldvsie6oEf4ySLqI` | `{{formatDate(now; "YYYY-MM-DDTHH:mm:ss")}}` |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | `{{executionId}}` |

> **⚠️ Note — Add "WhatsApp Lead" to Lead Type field:**  
> The `Lead Type` singleSelect currently has: Portrait Inquiry, Artwork Inquiry, Contact.  
> Before activating this scenario, open Airtable → Leads table → click the `Lead Type`
> field header → Edit field → add a new option: **WhatsApp Lead** (colour: greenBright).

---

## Testing checklist

- [ ] Scenario is **Active**
- [ ] `WA_WEBHOOK_URL` is set in `main.js` and deployed
- [ ] Clicked WhatsApp button on live site
- [ ] Airtable record created with `Lead Type = WhatsApp Lead`
- [ ] `Lead Source = WhatsApp`, `Interaction Type = WhatsApp Click`
- [ ] `Artwork Title` populated when clicking from an artwork page
- [ ] `Incoming Message` contains the pre-filled WhatsApp text
- [ ] `Lead Score` reflects session intent (1–3)
- [ ] `Source Page` shows the correct URL

---

# Airtable — Filtered Views Setup

The MCP cannot create views programmatically. Set these up manually in Airtable.

Go to: **Leads table → + Add view → Grid view**

### View 1 — 🔥 Hot Leads
- **Filter:** `🌡 Lead Heat` is `🔥 Hot`
- **Sort:** `Submitted At` → newest first
- **Hidden fields:** remove Photos, Portrait Size, Deposit Amount, etc. — keep: Name, Email, Lead Type, Artwork Title, Lead Score, Source Page, Status, Studio Notes

### View 2 — 🟡 Warm Leads
- **Filter:** `🌡 Lead Heat` is `🟡 Warm`
- **Sort:** `Days Since Submitted` → descending (oldest warm leads need attention)

### View 3 — 📱 WhatsApp Leads
- **Filter:** `Lead Source` is `WhatsApp`
- **Sort:** `Submitted At` → newest first
- **Colour rows by:** `🌡 Lead Heat`

### View 4 — 🖼 Collection Leads
- **Filter:** `Lead Source` is `Collection` OR `Lead Type` is `Artwork Inquiry`
- **Sort:** `Lead Score` → highest first
- **Group by:** `Artwork Title`

