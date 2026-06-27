# VaCa Airtable CRM — Visual Setup Guide

## What's already done (via API)

Three formula fields were added automatically to the Leads table:

| Field | Formula result | Purpose |
|---|---|---|
| `⚡ Urgency` | 🚨 Act Now / 📞 Follow Up / 📋 Monitor | What to do with this lead right now |
| `🕐 Response Window` | < 2 hours / < 24 hours / < 72 hours | SLA per heat tier |
| `📋 Snapshot` | 🎨 Artwork · 🔥 Hot · ★5 | One-line at-a-glance summary |

These auto-update every time `🌡 Lead Heat` or `Artwork Title` changes.

---

## Step 1 — Add emoji options to Lead Type field

In Airtable, click any cell in the **Lead Type** column → **Edit field**:

Delete the existing options and add these (in order):

| Option name | Color |
|---|---|
| 🔥 WhatsApp Lead | Red / orangeBright |
| 🎨 Artwork Inquiry | Purple / purpleBright |
| 🖼 Collection Visitor | Blue / blueBright |
| 📩 Contact Form | Teal / tealBright |
| ❌ Cold Visitor | Gray / grayBright |

> Make.com sends `WhatsApp Lead` with `typecast: true` so it auto-creates the option — but once you rename it to `🔥 WhatsApp Lead` here, update the hardcoded value in Make.com scenario 9449734 → Airtable module → Lead Type field → change `WhatsApp Lead` to `🔥 WhatsApp Lead`.

---

## Step 2 — Update Status field options

Click any cell in the **Status** column → **Edit field**:

| Option name | Color |
|---|---|
| 🆕 New | Blue / blueLight1 |
| 🟡 Warm | Yellow / yellowBright |
| 🔥 Hot | Orange / orangeBright |
| 💎 Negotiation | Purple / purpleBright |
| ✅ Sold | Green / greenBright |
| ❄️ Cold | Gray / grayBright |
| ❌ Unqualified | Red / redBright |

> Update Make.com to send `🆕 New` instead of `New` — or leave Status as `New` and rename only the display label in Airtable (the stored value and the label can differ if you use the emoji as a prefix).

---

## Step 3 — Create Views

Go to the Views sidebar (left panel) → **+ Add a view** → **Grid view** for each:

### View 1: 🔥 Hot Collectors
- Filter: `🌡 Lead Heat` is `🔥 Hot`
- Sort: `Submitted At` → Newest first
- Fields to show: Snapshot, Urgency, Response Window, Artwork Title, Incoming Message, Source Page

### View 2: 🟡 Warm Leads
- Filter: `🌡 Lead Heat` is `🟡 Warm`
- Sort: `Lead Score` → High to low
- Fields to show: Snapshot, Urgency, Artwork Title, Incoming Message, Status

### View 3: ❄️ Cold Traffic
- Filter: `🌡 Lead Heat` is `❄️ Cold`
- Sort: `Submitted At` → Newest first

### View 4: 💬 WhatsApp Leads
- Filter: `Interaction Type` is `WhatsApp Click`
- Sort: `Submitted At` → Newest first
- Fields to show: Snapshot, 🌡 Lead Heat, Urgency, Incoming Message, Artwork Title

### View 5: 🎨 Artwork Interest
- Filter: `Artwork Title` is not empty
- Group by: `Artwork Title`
- Sort: `Lead Score` → High to low

### View 6: 🖼 Collection Visitors
- Filter: `Lead Source` is `Collection`
- Sort: `Submitted At` → Newest first

---

## Step 4 — UI polish per view

For each view (right-click the view name → Settings):

**Row height:** Set to **Large** (shows more of Incoming Message text)

**Color records by:** Status field (assigns row color based on pipeline stage)

**Hide fields:** Hide system/pipeline fields not relevant to that view. Recommended visible set for Hot/Warm:
- 📋 Snapshot
- ⚡ Urgency
- 🕐 Response Window
- 🌡 Lead Heat
- Artwork Title
- Incoming Message
- Submitted At
- Status

---

## Step 5 — Pin the most useful view

Right-click **🔥 Hot Collectors** → **Lock view** (prevents accidental filter changes).  
Drag it to the top of the views list so it's the default on open.

---

## Summary: what updates automatically vs. what's manual

| Feature | Auto (via Make.com) | Manual (Airtable UI) |
|---|---|---|
| Lead Heat tier | ✅ | — |
| ⚡ Urgency label | ✅ formula | — |
| 🕐 Response Window | ✅ formula | — |
| 📋 Snapshot | ✅ formula | — |
| Lead Score | ✅ | — |
| Option emoji labels | — | ✅ Step 1–2 above |
| Views | — | ✅ Step 3 above |
| Row height / colors | — | ✅ Step 4 above |
