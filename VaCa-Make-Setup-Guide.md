# VaCa — Make.com WhatsApp Scenario Setup Guide

## Overview

The webhook at `https://hook.eu2.make.com/enneb60q3m64izxwj0r5ae3t5mgp91m7`  
is already **receiving data correctly** from the website.  
This guide wires Airtable to it so leads are saved.

---

## Payload shape arriving at the webhook

```json
{
  "lead_type":        "WhatsApp Lead",
  "lead_source":      "WhatsApp",
  "interaction_type": "WhatsApp Click",
  "artwork_context":  "Frida Kahlo – Portrait in Walnut",
  "intent_score":     8,
  "incoming_message": "Hello VaCa Marquetry, I'm interested in the artwork...",
  "source_page":      "https://vacamarquetry.shop/artworks/frida.html",
  "submitted_at":     "2026-06-27T10:30:00.000Z"
}
```

**intent_score logic (calculated in the browser):**
- `crm_score = (session_score × 2) + artwork_bonus`
- Browsed + artwork viewed + WA click → score 8 → **HOT**
- Artwork viewed + WA click (cold session) → score 4 → **WARM**
- Direct WA click, no prior browsing → score 2 → **COLD**

---

## Step 1 — Open the existing scenario

1. Go to [eu2.make.com](https://eu2.make.com)
2. Open the scenario that owns the webhook `enneb60q3m64izxwj0r5ae3t5mgp91m7`
3. If you don't see it, go to **Webhooks** in the left sidebar, find that URL, and click the scenario name next to it

---

## Step 2 — Run the webhook once to get sample data

1. In the scenario editor, click **Run once** (bottom left)
2. On the website, click the WhatsApp button
3. Come back to Make.com — the webhook module should show a green bubble with "1"
4. Click it to inspect the data — confirm all 8 fields are visible

---

## Step 3 — Add a Router

1. Click the **+** after the webhook module
2. Search for **Router** → select it
3. You will see 3 route paths appear (default is 2 — click **Add route** to add a 3rd)

---

## Step 4 — Route 1: HOT LEAD (top route)

### Filter settings (click the wrench on the route line)

**Filter name:** HOT LEAD  
**Condition logic:** OR across all conditions below

| Field | Operator | Value |
|-------|----------|-------|
| `{{1.intent_score}}` | Greater than or equal to (numeric) | `7` |
| `{{1.incoming_message}}` | Contains (text) | `price` |
| `{{1.incoming_message}}` | Contains (text) | `buy` |
| `{{1.incoming_message}}` | Contains (text) | `commission` |
| `{{1.incoming_message}}` | Contains (text) | `order` |
| `{{1.incoming_message}}` | Contains (text) | `how much` |
| `{{1.incoming_message}}` | Contains (text) | `cost` |

Set the toggle between conditions to **OR**.

### Airtable module (after the HOT filter)

- Module: **Airtable → Create a Record**
- Connection: your Airtable connection
- Base ID: `appgaZWpeSTTkjoUa`
- Table ID: `tblCOVYuKMZq28Usi`

**Field mappings:**

| Airtable Field | Field ID | Value to map |
|----------------|----------|--------------|
| Lead Type | `fld4W3TE9wPeg4WWA` | `WhatsApp Lead` *(type literal)* |
| Status | `fldqHNgvHnC4DNORq` | `New` *(type literal)* |
| Lead Source | `fldwk0CgCYqw8s51V` | `{{1.lead_source}}` |
| Interaction Type | `fldRN40zMJuQ3tGzY` | `{{1.interaction_type}}` |
| Artwork Title | `fldDbFmHJI1yWOGOK` | `{{1.artwork_context}}` |
| Lead Score | `fldENjUV5MUonr2p8` | `{{if(1.intent_score > 5; 5; 1.intent_score)}}` |
| Incoming Message | `fldLikiOEnMDXp3a5` | `{{1.incoming_message}}` |
| Source Page | `fldQjvWaXDKHJ651y` | `{{1.source_page}}` |
| Submitted At | `fldvsie6oEf4ySLqI` | `{{1.submitted_at}}` |
| 🌡 Lead Heat | `flddnkMm9vFJIu5jk` | `🔥 Hot` *(type literal)* |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | `{{executionId}}` |

---

## Step 5 — Route 2: WARM LEAD (middle route)

### Filter settings

**Filter name:** WARM LEAD  
**Condition logic:** AND

| Field | Operator | Value |
|-------|----------|-------|
| `{{1.intent_score}}` | Greater than or equal to (numeric) | `3` |
| `{{1.intent_score}}` | Less than (numeric) | `7` |

### Airtable module — same as HOT but change one field:

| Airtable Field | Field ID | Value |
|----------------|----------|-------|
| 🌡 Lead Heat | `flddnkMm9vFJIu5jk` | `🟡 Warm` *(type literal)* |

*(All other fields identical to HOT route above)*

---

## Step 6 — Route 3: COLD LEAD (bottom route)

### Filter settings

**Filter name:** COLD LEAD  
**Condition logic:** AND

| Field | Operator | Value |
|-------|----------|-------|
| `{{1.intent_score}}` | Less than (numeric) | `3` |

### Airtable module — same as HOT but change one field:

| Airtable Field | Field ID | Value |
|----------------|----------|-------|
| 🌡 Lead Heat | `flddnkMm9vFJIu5jk` | `❄️ Cold` *(type literal)* |

*(All other fields identical to HOT route above)*

---

## Step 7 — Activate and test

1. Click **Save** (top right)
2. Toggle the scenario **ON** (bottom left switch)
3. Click the WhatsApp button on the website
4. Check Airtable — a new row should appear within ~5 seconds with Lead Heat populated

---

## Manual steps still required in Airtable

1. **Add "WhatsApp Lead" to Lead Type field options**  
   — In Airtable, click any cell in the Lead Type column → Edit field → add the option `WhatsApp Lead`

2. **Create filtered views** (optional but recommended):
   - **Hot Leads** — filter: 🌡 Lead Heat = 🔥 Hot
   - **Warm Leads** — filter: 🌡 Lead Heat = 🟡 Warm  
   - **WhatsApp Leads** — filter: Interaction Type = WhatsApp Click
   - **All Leads** — no filter, sorted by Submitted At descending

---

## Airtable field ID reference

| Field Name | Field ID | Type |
|---|---|---|
| Lead Type | `fld4W3TE9wPeg4WWA` | singleSelect |
| Status | `fldqHNgvHnC4DNORq` | singleSelect |
| Lead Source | `fldwk0CgCYqw8s51V` | singleSelect |
| Interaction Type | `fldRN40zMJuQ3tGzY` | singleSelect |
| Artwork Title | `fldDbFmHJI1yWOGOK` | singleLineText |
| Lead Score | `fldENjUV5MUonr2p8` | rating (max 5) |
| 🌡 Lead Heat | `flddnkMm9vFJIu5jk` | singleSelect |
| Incoming Message | `fldLikiOEnMDXp3a5` | multilineText |
| Source Page | `fldQjvWaXDKHJ651y` | url |
| Submitted At | `fldvsie6oEf4ySLqI` | dateTime |
| Make Run ID | `fldlNCz7JYyvhQ8Xi` | singleLineText |
