# VaCa Marquetry — Airtable CRM Build Specification
**Version:** 1.0  
**Date:** June 2026  
**Scope:** Lead capture, pipeline management, and inquiry tracking for VaCa Marquetry  
**Integration target:** Make.com webhook → Airtable → Gmail

---

## 1. Base Setup

| Setting | Value |
|---|---|
| Base name | `VaCa Marquetry CRM` |
| Workspace | Your personal workspace (or create one named "VaCa Studio") |
| Currency | EUR (€) |
| Time zone | Europe/Rome |
| Date format | DD/MM/YYYY |

---

## 2. Table: `Leads`

One unified table for all three inquiry types. Type-specific fields are blank for non-applicable rows — this is intentional. At boutique volume (under 100 leads/month), a single table is easier to manage, query, and automate than three linked tables.

---

## 3. Fields — Complete Specification

Build fields in this order. The order here matches the recommended left-to-right column layout in Airtable.

---

### Block A — Identity

| # | Field Name | Airtable Type | Configuration | Notes |
|---|---|---|---|---|
| 1 | `Lead #` | Autonumber | — | Primary reference. Airtable sets this automatically. |
| 2 | `Lead Ref` | Formula | `"VCM-" & YEAR({Submitted At}) & "-" & IF(LEN(TEXT({Lead #},"0"))=1,"000",IF(LEN(TEXT({Lead #},"0"))=2,"00",IF(LEN(TEXT({Lead #},"0"))=3,"0",""))) & TEXT({Lead #},"0")` | Produces `VCM-2026-0001`. Use in emails and invoices. |
| 3 | `Name` | Single line text | Required | Customer full name |
| 4 | `Email` | Email | — | Customer email. Make.com maps to this. |
| 5 | `Phone` | Phone number | Default country: IT | Portrait inquiries only. Blank for others. |

---

### Block B — Lead Classification

| # | Field Name | Airtable Type | Options | Notes |
|---|---|---|---|---|
| 6 | `Lead Type` | Single select | See §3.1 | Set by Make.com on record creation. Never blank. |
| 7 | `Status` | Single select | See §3.2 | Pipeline stage. Default: New. |
| 8 | `Lead Score` | Rating | Max: 5 stars | Manually set after reviewing inquiry. Helps prioritise follow-up. |

#### §3.1 — Lead Type options

| Option | Colour | When used |
|---|---|---|
| Portrait Inquiry | Blue | Submitted via custom-portraits.html form |
| Artwork Inquiry | Purple | Submitted via artwork detail page |
| Contact | Grey | Submitted via contact.html |

#### §3.2 — Status options (pipeline stages)

| Stage | Colour | Meaning |
|---|---|---|
| New | Red | Just arrived. Not yet reviewed by studio. |
| In Review | Orange | Studio has opened and is assessing the inquiry. |
| Preview Sent | Yellow | Free portrait preview sent to customer. (Portrait only.) |
| Quote Sent | Yellow | Price and timeline shared with customer. |
| Deposit Received | Green | Customer confirmed. Commission is live. |
| In Production | Green | Active — artwork being made. |
| Shipped | Blue | Artwork dispatched. Awaiting delivery confirmation. |
| Complete | Grey | Delivered, closed, customer satisfied. |
| Not Interested | Grey | Customer declined or went silent after follow-up. |
| Unqualified | Grey | Spam, test submission, or clearly out of scope. |

---

### Block C — Dates and Timing

| # | Field Name | Airtable Type | Configuration | Notes |
|---|---|---|---|---|
| 9 | `Submitted At` | Date | Include time: ON, 24h format, Time zone: Europe/Rome | Set by Make.com at webhook receipt. |
| 10 | `Needed By` | Date | Include time: OFF | Portrait inquiries only. Customer deadline. |
| 11 | `Follow-up Date` | Date | Include time: OFF | Manually set. Drives the Follow-up view and automation. |
| 12 | `Days Since Submitted` | Formula | `DATETIME_DIFF(NOW(), {Submitted At}, 'days')` | Shows age of lead in days. Useful for spotting stale records. |

---

### Block D — Portrait-specific Fields

Blank for Artwork Inquiry and Contact rows.

| # | Field Name | Airtable Type | Options | Notes |
|---|---|---|---|---|
| 13 | `Subject Type` | Single select | See §3.3 | What the portrait depicts. |
| 14 | `Portrait Size` | Single select | See §3.4 | Commission tier selected on form. |
| 15 | `Budget` | Single select | See §3.5 | Customer's stated budget range. |
| 16 | `Occasion` | Single select | See §3.6 | Reason for the commission. Optional. |
| 17 | `Customer Notes` | Long text | Enable rich text: OFF | Verbatim from the form "notes" field. |
| 18 | `Photos` | Attachment | — | Portrait inquiry photos. Make.com uploads files here. See §6. |

#### §3.3 — Subject Type options

| Option | Colour |
|---|---|
| Person | Default |
| Pet | Default |
| Family | Default |
| Landmark or Home | Default |
| Other | Default |

#### §3.4 — Portrait Size options

| Option | Colour | Approx. price |
|---|---|---|
| Intimate | Default | From €690 |
| Signature | Blue | From €1,290 |
| Masterwork | Purple | Price on Request |
| Not Sure Yet | Grey | — |

#### §3.5 — Budget options

| Option |
|---|
| Under €700 |
| €700–€1,300 |
| €1,300–€2,500 |
| €2,500+ |
| Prefer to Discuss |

#### §3.6 — Occasion options

| Option |
|---|
| Personal Collection |
| Gift |
| Anniversary |
| Memorial |
| Other |

---

### Block E — Artwork Inquiry Fields

Blank for Portrait Inquiry and Contact rows.

| # | Field Name | Airtable Type | Notes |
|---|---|---|---|
| 19 | `Artwork Title` | Single line text | e.g. "The Sovereign" |
| 20 | `Artwork Slug` | Single line text | e.g. "the-sovereign". For building direct links. |
| 21 | `Artwork Page URL` | URL | Full URL of the artwork detail page. |

---

### Block F — Contact and General Message

| # | Field Name | Airtable Type | Notes |
|---|---|---|---|
| 22 | `Message` | Long text | Enable rich text: OFF. Used for Contact and Artwork Inquiry messages. |

---

### Block G — Commercial Tracking

Manually filled by studio after quoting.

| # | Field Name | Airtable Type | Configuration | Notes |
|---|---|---|---|---|
| 23 | `Quoted Amount` | Currency | Symbol: €, Precision: 2 decimal places | Enter after quote is sent. |
| 24 | `Deposit Amount` | Currency | Symbol: €, Precision: 2 decimal places | Enter when deposit received (50% of quoted). |
| 25 | `Final Amount` | Currency | Symbol: €, Precision: 2 decimal places | Enter on completion. May differ from quote. |

---

### Block H — Source and System

| # | Field Name | Airtable Type | Notes |
|---|---|---|---|
| 26 | `Source Page` | URL | Which page the form was on. Set by Make.com. |
| 27 | `Make Run ID` | Single line text | Make.com execution ID. For debugging failed submissions. |
| 28 | `Auto-Reply Sent` | Checkbox | Set by Make.com after customer confirmation email fires. |
| 29 | `Studio Notification Sent` | Checkbox | Set by Make.com after studio notification email fires. |
| 30 | `Last Modified` | Last modified time | Configure to track all fields. Shows when record was last touched. |

---

### Block I — Internal Studio Notes

| # | Field Name | Airtable Type | Notes |
|---|---|---|---|
| 31 | `Studio Notes` | Long text | Enable rich text: ON. Private internal notes — never sent to customer. Separate from Customer Notes. |

---

## 4. Field Order in Grid View

Recommended left-to-right column order for the default "All Leads" grid:

```
Lead Ref · Name · Email · Lead Type · Status · Lead Score · Submitted At ·
Days Since Submitted · Follow-up Date · Portrait Size · Budget · Quoted Amount ·
Auto-Reply Sent · Studio Notification Sent
```

All remaining fields accessible by scrolling right or in the record detail panel.

---

## 5. Views — Complete Specification

Create all views listed below. Each view is a saved filter + sort + hidden fields configuration within the same `Leads` table.

---

### View 1: All Leads *(default grid)*

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | None |
| Sort | Submitted At → Descending (newest first) |
| Group by | None |
| Visible fields | Lead Ref, Name, Email, Lead Type, Status, Submitted At, Days Since Submitted |
| Row height | Short |

---

### View 2: Pipeline Board

| Setting | Value |
|---|---|
| Type | Kanban |
| Stack by | Status |
| Card title | Name |
| Card fields shown | Lead Type, Email, Portrait Size (if applicable) |
| Filter | Status is not "Unqualified" |
| Sort | Submitted At → Ascending (oldest first per column) |

This is the primary daily-operations view. Drag cards between columns to advance pipeline stage.

---

### View 3: Portrait Inquiries

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Lead Type = "Portrait Inquiry" |
| Sort | Submitted At → Descending |
| Group by | Status |
| Visible fields | Lead Ref, Name, Email, Status, Portrait Size, Budget, Needed By, Lead Score, Photos, Quoted Amount |

---

### View 4: Artwork Inquiries

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Lead Type = "Artwork Inquiry" |
| Sort | Submitted At → Descending |
| Group by | Status |
| Visible fields | Lead Ref, Name, Email, Status, Artwork Title, Message, Lead Score |

---

### View 5: Contact Inbox

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Lead Type = "Contact" |
| Sort | Submitted At → Descending |
| Visible fields | Lead Ref, Name, Email, Status, Message, Submitted At |

---

### View 6: New Today

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Submitted At is within the last 1 day |
| Sort | Submitted At → Descending |
| Visible fields | Lead Ref, Name, Email, Lead Type, Status, Submitted At, Auto-Reply Sent, Studio Notification Sent |
| Purpose | Morning review. Confirm all new leads received notifications correctly. |

---

### View 7: Needs Follow-up

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Follow-up Date is on or before today AND Status is not "Complete" AND Status is not "Not Interested" AND Status is not "Unqualified" |
| Sort | Follow-up Date → Ascending |
| Visible fields | Lead Ref, Name, Email, Lead Type, Status, Follow-up Date, Studio Notes |
| Purpose | Action list. Any record appearing here needs a reply or update today. |

---

### View 8: Active Commissions

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Status is one of: "Deposit Received", "In Production", "Shipped" |
| Sort | Needed By → Ascending (most urgent first) |
| Visible fields | Lead Ref, Name, Email, Portrait Size, Needed By, Status, Quoted Amount, Deposit Amount, Studio Notes |
| Purpose | Production dashboard. Shows all live commissions ordered by deadline. |

---

### View 9: Revenue Calendar

| Setting | Value |
|---|---|
| Type | Calendar |
| Date field | Needed By |
| Filter | Status is one of: "Deposit Received", "In Production" |
| Card title | Name |
| Card fields | Portrait Size, Quoted Amount |
| Purpose | Visualise production deadlines on a calendar. |

---

### View 10: Closed Revenue

| Setting | Value |
|---|---|
| Type | Grid |
| Filter | Status = "Complete" |
| Sort | Submitted At → Descending |
| Visible fields | Lead Ref, Name, Lead Type, Submitted At, Portrait Size, Quoted Amount, Final Amount |
| Summary bar | Final Amount → SUM (total revenue at bottom of column) |
| Purpose | Revenue tracking. Enable the summary bar on Final Amount to see total. |

---

## 6. Attachment Configuration — Photos Field

| Setting | Value |
|---|---|
| Field name | `Photos` |
| Field type | Attachment |
| Table | Leads |

**How Make.com populates this field:**

Make.com receives photo files as binary items from the webhook. The module chain is:

1. Webhook trigger receives `multipart/form-data` — files parsed automatically by Make.com
2. Iterator module loops over the array of uploaded files
3. Airtable "Update a Record" module — maps each binary item to the `Photos` field as an attachment

Each file is stored natively in Airtable. No external storage service required. Airtable supports up to 2 GB per base on the free tier; each attachment can be up to 5 GB on paid plans.

**What you see in Airtable after submission:**
- Thumbnail previews of each uploaded photo directly in the `Photos` cell
- Click any thumbnail to open full-size in Airtable's viewer
- Download individual files from the record detail panel

**Client-side constraint (website JS will enforce):**
- Max 5 files per submission
- Max 8 MB per file (enforced before upload begins)
- Accepted formats: JPG, PNG, HEIC, WEBP

---

## 7. Lead Pipeline Stages — Detailed Definition

| Stage | Who sets it | When | Typical next action |
|---|---|---|---|
| **New** | Make.com (automatic) | On record creation | Studio reviews within 24h |
| **In Review** | Studio (manual) | When you open and read the inquiry | Assess requirements, set Lead Score |
| **Preview Sent** | Studio (manual) | After free portrait preview emailed | Wait for customer response |
| **Quote Sent** | Studio (manual) | After pricing and timeline sent | Follow up in 3–5 days if no response |
| **Deposit Received** | Studio (manual) | After payment confirmed | Set Needed By, begin production |
| **In Production** | Studio (manual) | Active work underway | Update Studio Notes with progress |
| **Shipped** | Studio (manual) | Artwork dispatched | Send tracking details to customer |
| **Complete** | Studio (manual) | Delivery confirmed | Enter Final Amount, request testimonial |
| **Not Interested** | Studio (manual) | Customer declines or goes silent after 2 follow-ups | Archive — no further action |
| **Unqualified** | Studio (manual) | Spam, test, or out-of-scope submission | Archive immediately |

---

## 8. Airtable Automations — Complete Specification

All automations are built inside Airtable (Automations tab in the base). These are internal to Airtable and supplement the Make.com email scenarios.

---

### Automation 1: Flag Stale New Leads

**Purpose:** Alert if a new lead sits unreviewed for more than 24 hours.

| Setting | Value |
|---|---|
| Trigger | At a scheduled time — every day at 08:00 Rome time |
| Condition | Find records where: Status = "New" AND Submitted At is before 24 hours ago |
| Action | Send an email to `vacamarquetry@vacamarquetry.shop` |
| Subject | `⚠️ Unreviewed leads — action required` |
| Body | List of matching records: Lead Ref, Name, Lead Type, Submitted At |

---

### Automation 2: Follow-up Reminder

**Purpose:** Daily reminder of any leads with a Follow-up Date set to today.

| Setting | Value |
|---|---|
| Trigger | At a scheduled time — every day at 09:00 Rome time |
| Condition | Find records where: Follow-up Date = today AND Status is not "Complete", "Not Interested", or "Unqualified" |
| Action | Send an email to `vacamarquetry@vacamarquetry.shop` |
| Subject | `📋 Follow-up today — [count] lead(s)` |
| Body | For each record: Lead Ref, Name, Email, Status, Studio Notes (last 200 chars) |

---

### Automation 3: Deposit Received — Production Start Checklist

**Purpose:** When a deposit is confirmed, prompt the studio to complete setup tasks.

| Setting | Value |
|---|---|
| Trigger | When a record is updated — Status changes to "Deposit Received" |
| Action | Send email to `vacamarquetry@vacamarquetry.shop` |
| Subject | `🎨 Commission confirmed — [Name] — [Portrait Size]` |
| Body | Lead Ref, Name, Email, Portrait Size, Quoted Amount, Deposit Amount, Needed By. Checklist: ☐ Invoice sent ☐ Needed By confirmed ☐ Photo approved for production ☐ Production start date logged |

---

### Automation 4: Approaching Deadline Alert

**Purpose:** Alert when an active commission's Needed By date is within 10 days.

| Setting | Value |
|---|---|
| Trigger | At a scheduled time — every day at 08:30 Rome time |
| Condition | Find records where: Status is one of "In Production" AND Needed By is within 10 days from today |
| Action | Send email to `vacamarquetry@vacamarquetry.shop` |
| Subject | `⏰ Deadline in 10 days — [Name]` |
| Body | Lead Ref, Name, Needed By, Portrait Size, Studio Notes |

---

### Automation 5: Commission Shipped — Notify Studio to Request Testimonial

**Purpose:** Remind studio to follow up after shipping.

| Setting | Value |
|---|---|
| Trigger | When a record is updated — Status changes to "Shipped" |
| Action | Send email to `vacamarquetry@vacamarquetry.shop` |
| Subject | `📦 Shipped — [Name] — remember to request a testimonial` |
| Body | Lead Ref, Name, Email, Artwork title or Portrait Size. Reminder: set a Follow-up Date 7 days from now to confirm delivery and request a review. |

---

## 9. Make.com Field Mapping Reference

This table is used when building Make.com Airtable modules. Match the webhook field name (left) to the exact Airtable field name (right).

### Portrait Inquiry webhook → Airtable fields

| Webhook field | Airtable field | Notes |
|---|---|---|
| *(hardcoded)* | `Lead Type` | Set to "Portrait Inquiry" |
| *(hardcoded)* | `Status` | Set to "New" |
| `name` | `Name` | |
| `email` | `Email` | |
| `phone` | `Phone` | |
| `needed_by` | `Needed By` | |
| `subject_type` | `Subject Type` | |
| `size` | `Portrait Size` | |
| `budget` | `Budget` | |
| `occasion` | `Occasion` | |
| `notes` | `Customer Notes` | |
| `photos` *(files)* | `Photos` | Via iterator + update record |
| `source_url` | `Source Page` | |
| *(Make.com executionId)* | `Make Run ID` | From Make.com system variable |
| *(timestamp)* | `Submitted At` | Use Make.com `now` variable |

### Contact webhook → Airtable fields

| Webhook field | Airtable field |
|---|---|
| *(hardcoded)* | `Lead Type` → "Contact" |
| *(hardcoded)* | `Status` → "New" |
| `name` | `Name` |
| `email` | `Email` |
| `message` | `Message` |
| `source_url` | `Source Page` |
| *(Make.com executionId)* | `Make Run ID` |
| *(timestamp)* | `Submitted At` |

### Artwork Inquiry webhook → Airtable fields

| Webhook field | Airtable field |
|---|---|
| *(hardcoded)* | `Lead Type` → "Artwork Inquiry" |
| *(hardcoded)* | `Status` → "New" |
| `name` | `Name` |
| `email` | `Email` |
| `message` | `Message` |
| `artwork_title` | `Artwork Title` |
| `artwork_slug` | `Artwork Slug` |
| `artwork_url` | `Artwork Page URL` |
| `source_url` | `Source Page` |
| *(Make.com executionId)* | `Make Run ID` |
| *(timestamp)* | `Submitted At` |

---

## 10. Build Sequence — Step-by-Step Checklist

Complete these steps in order.

### Step 1 — Create the Base
- [ ] Create a new Airtable base named `VaCa Marquetry CRM`
- [ ] Delete the default "Table 1" and any sample fields
- [ ] Rename the first table to `Leads`
- [ ] Set base currency to EUR in base settings

### Step 2 — Build Block A (Identity fields)
- [ ] Add `Lead #` — Autonumber
- [ ] Add `Lead Ref` — Formula (paste formula from §3)
- [ ] Add `Name` — Single line text
- [ ] Add `Email` — Email
- [ ] Add `Phone` — Phone number (default country: Italy)

### Step 3 — Build Block B (Classification)
- [ ] Add `Lead Type` — Single select (add all options from §3.1 with colours)
- [ ] Add `Status` — Single select (add all 10 options from §3.2 with colours)
- [ ] Add `Lead Score` — Rating (1–5 stars)

### Step 4 — Build Block C (Dates)
- [ ] Add `Submitted At` — Date, enable time, set timezone Rome
- [ ] Add `Needed By` — Date
- [ ] Add `Follow-up Date` — Date
- [ ] Add `Days Since Submitted` — Formula

### Step 5 — Build Block D (Portrait fields)
- [ ] Add `Subject Type` — Single select (§3.3)
- [ ] Add `Portrait Size` — Single select (§3.4)
- [ ] Add `Budget` — Single select (§3.5)
- [ ] Add `Occasion` — Single select (§3.6)
- [ ] Add `Customer Notes` — Long text
- [ ] Add `Photos` — Attachment

### Step 6 — Build Block E (Artwork fields)
- [ ] Add `Artwork Title` — Single line text
- [ ] Add `Artwork Slug` — Single line text
- [ ] Add `Artwork Page URL` — URL

### Step 7 — Build Block F (Message)
- [ ] Add `Message` — Long text

### Step 8 — Build Block G (Commercial)
- [ ] Add `Quoted Amount` — Currency (EUR)
- [ ] Add `Deposit Amount` — Currency (EUR)
- [ ] Add `Final Amount` — Currency (EUR)

### Step 9 — Build Block H (System)
- [ ] Add `Source Page` — URL
- [ ] Add `Make Run ID` — Single line text
- [ ] Add `Auto-Reply Sent` — Checkbox
- [ ] Add `Studio Notification Sent` — Checkbox
- [ ] Add `Last Modified` — Last modified time (track all fields)

### Step 10 — Build Block I (Internal)
- [ ] Add `Studio Notes` — Long text, enable rich text

### Step 11 — Create Views
- [ ] All Leads (existing default grid — configure per §5)
- [ ] Pipeline Board (Kanban)
- [ ] Portrait Inquiries (Grid)
- [ ] Artwork Inquiries (Grid)
- [ ] Contact Inbox (Grid)
- [ ] New Today (Grid)
- [ ] Needs Follow-up (Grid)
- [ ] Active Commissions (Grid)
- [ ] Revenue Calendar (Calendar)
- [ ] Closed Revenue (Grid)

### Step 12 — Configure Automations
- [ ] Stale New Leads alert
- [ ] Follow-up reminder
- [ ] Deposit received checklist
- [ ] Approaching deadline alert
- [ ] Shipped — testimonial reminder

### Step 13 — Get Base and Table IDs for Make.com
- Open the `Leads` table
- The URL will be: `https://airtable.com/appXXXXXXXX/tblYYYYYYYY/...`
- Copy the Base ID (`appXXXXXXXX`) and Table ID (`tblYYYYYYYY`)
- Paste both into Make.com Airtable modules when building scenarios

---

*End of Airtable build specification.*  
*Next document: Make.com scenario build specification.*  
*Next after that: Website implementation (form JS, artwork inquiry form, webhook integration).*
