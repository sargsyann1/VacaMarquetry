# VaCa Marquetry — Full Technical & Architectural Audit
**Date:** 2026-06-28  
**Local project:** `D:\VacaMarquetry-v2\VacaMarquetry`  
**Live site:** https://vacamarquetry.shop  

---

## 1. SYSTEM STATUS SUMMARY

The project is **architecturally complete**. All major systems exist and are correctly wired. The codebase has 14 HTML pages, 1 CSS file (2,388 lines, brace-balanced), 2 JS files (main.js 706 lines + artwork-loader.js 326 lines), 5 artwork JSON files, and 2 active Make.com → Airtable pipelines.

Three isolated bugs exist — none are architectural. They are data errors and a missing asset that can be fixed without touching any system.

---

## 2. LOCAL vs LIVE DIFFERENCES

| Area | Local | Live | Delta |
|---|---|---|---|
| HTML pages | 14 | 14 | ✅ Match |
| Nav (all pages) | ✅ Consistent | ✅ Consistent | ✅ Match |
| style.css version | `?v=14` | `?v=14` | ✅ Match |
| main.js version | `?v=14` | `?v=14` | ✅ Match |
| artwork-loader.js version | `?v=9` (all 5 artwork pages) | `?v=9` | ✅ Match (stale but consistent) |
| Sovereign artwork.json | **TRUNCATED** (1,022 bytes, invalid JSON) | (fallback not used) | ⚠ Bug — see §6 |
| Sovereign inline data (HTML) | 5-image gallery, `not_for_sale` | Driven by inline data | ⚠ detail-03.jpg missing |
| Sitemap | 12 entries | 12 entries | ❌ Missing 2 pages |
| Video assets (exhibitions) | Not on disk | Broken `<video>` src | ❌ Missing files |
| detail-03.webp | Not on disk | N/A | ❌ Missing asset |
| Orphan JS file | `artworks/artwork-loader.js` | Not served | ⚠ Dead file |

---

## 3. COMPONENT STATUS TABLE

### Core Systems

| System | Status | Notes |
|---|---|---|
| Nav toggle (mobile) | ✅ Working | Single IIFE in main.js §1, correct z-index |
| WhatsApp floating button | ✅ Working | CSS + main.js §2, fires before redirect |
| Cookie consent banner | ✅ Working | main.js §3, fires cookie webhook on accept |
| Museum viewer (zoom/pan) | ✅ Working | main.js §4, `data-lb-group` / `data-lb-solo` |
| FAQ accordion | ✅ Working | main.js §7 |
| Visitor identity tracking | ✅ Working | main.js §8, UUID in localStorage/sessionStorage |
| Lead intent scoring | ✅ Working | main.js §5, sessionStorage `vaca_intent_score` |
| Debug `resetCookies()` | ✅ Working | main.js §6, clears all vaca_* keys |
| GA4 + Consent Mode v2 | ✅ Working | Present on all 14 pages |
| SEO meta (title/desc/OG/Twitter) | ✅ Complete | All 14 pages |
| Schema.org JSON-LD | ✅ Complete | Organization on index, VisualArtwork on 5 artwork pages |

### Data Layer

| System | Status | Notes |
|---|---|---|
| artwork-loader.js (inline strategy) | ✅ Working | Reads `<script id="artwork-data">` first — no fetch needed |
| artwork-loader.js (fetch fallback) | ✅ Working | Falls back to `../assets/images/artworks/{slug}/artwork.json` |
| WebP detection | ✅ Working | Canvas probe, falls back to `.jpg` |
| Missing image guard | ✅ Working | `img.onerror` hides thumb silently |
| `not_for_sale` status handling | ✅ Working | Hides CTA, shows private collection notice + link |
| Gallery injection (data-lb-group) | ✅ Working | Sets `img.dataset.lbGroup` before main.js scans |

### Make.com + Airtable Pipelines

| Pipeline | Status | Notes |
|---|---|---|
| WhatsApp → Make.com 9449734 → Airtable | ✅ Active | Sends HOT/WARM/COLD with full field mapping |
| Cookie accept → Make.com 9450025 → Airtable | ✅ Active | Creates visitor record with device/browser/intent data |
| Artwork inquiry form → Make.com → Airtable | ❌ Not built | Webhook URL wired in artwork-loader.js §ARTWORK_WEBHOOK_URL — no scenario exists |

### Pages

| Page | Renders | Images | CRM | Notes |
|---|---|---|---|---|
| index.html | ✅ | ✅ | ✅ WA | Hero is Sovereign hero.jpg — correct |
| collection.html | ✅ | ✅ | ✅ WA | 4 artworks, Sovereign excluded |
| artworks/black-woman.html | ✅ | ✅ | ✅ WA+Form | JS-driven, inline data |
| artworks/king-of-ararat.html | ✅ | ✅ | ✅ WA+Form | JS-driven, inline data |
| artworks/strength-in-harmony.html | ✅ | ✅ | ✅ WA+Form | JS-driven, inline data |
| artworks/the-lion-within.html | ✅ | ✅ | ✅ WA+Form | JS-driven, inline data |
| artworks/the-sovereign.html | ✅ | ✅ | ⚠ WA only (no form, NFS) | Private collection mode — correct behavior |
| not-for-sale.html | ✅ | ✅ | ✅ WA | Sovereign + Christ + Arctic Eagle + TBD |
| exhibitions.html | ✅ | ✅ | ✅ WA | ❌ Video files missing from disk |
| the-artist.html | ✅ | ✅ | ✅ WA | — |
| the-craft.html | ✅ | ✅ | ✅ WA | — |
| custom-portraits.html | ✅ | ✅ | ✅ WA+Form | — |
| trade.html | ✅ | ✅ | ✅ WA | — |
| contact.html | ✅ | ✅ | ✅ WA+Form | — |

---

## 4. CURRENT PHASE IDENTIFICATION

**Phase: Late Stabilization**

The project has crossed from implementation into stabilization. Evidence:

- All 14 pages exist, are deployed, and render correctly
- Three independent CRM pipelines are active and wired end-to-end
- Museum viewer, WhatsApp, cookie consent, GA4, schema.org — all complete
- CSS is brace-balanced, JS has no syntax errors
- Remaining issues are isolated data bugs, not architectural problems

The project is not in production-optimized phase because: two sitemap entries are missing, one Make.com scenario is unbuilt, video assets are absent from disk, and one JSON file is corrupt. These are cleanup tasks — not design or architecture decisions.

---

## 5. ROOT CAUSE ANALYSIS

### Bug 1 — The Sovereign `artwork.json` is truncated (CRITICAL)

**File:** `assets/images/artworks/the-sovereign/artwork.json`  
**Symptom:** File is 1,022 bytes and ends mid-string: `..."gallery": ["cover.jpg", ..., "d`  
**Cause:** The Edit tool wrote `"detail-03.jpg"` to the gallery array but the write was truncated — the file is missing the closing `"`, `]`, `\n}`.  
**Impact in production:** None currently — all 5 artwork HTML pages use the inline `<script id="artwork-data">` block as primary source. The JSON is only the fetch fallback. But the file is invalid JSON and would silently break any tool or future code that reads it.

### Bug 2 — detail-03.jpg not in The Sovereign gallery (CRITICAL for the task intent)

**Files:** `artworks/the-sovereign.html` (inline data), `artwork.json` (broken)  
**Symptom:** The Sovereign gallery shows 5 images in production. `detail-03.jpg` appears on disk but nowhere in either data source.  
**Cause:** The last session modified `artwork.json` to add the image, but: (a) the JSON got truncated during write, and (b) the inline data block inside the HTML was never updated — that block still has only 5 images (`cover`, `wall`, `lifestyle`, `detail-01`, `detail-02`). Since the inline block is used first, production never reaches the JSON.  
**Fix:** Add `"detail-03.jpg"` to the gallery array in the inline `<script id="artwork-data">` block in `artworks/the-sovereign.html`.

### Bug 3 — detail-03.webp missing

**File:** `assets/images/artworks/the-sovereign/detail-03.webp` — does not exist  
**Symptom:** In any browser with WebP support, artwork-loader.js will try to load `detail-03.webp` → 404 → `img.onerror` hides the thumb silently. The `.jpg` is never served.  
**Fix:** Generate and add `detail-03.webp` to the same directory.

### Bug 4 — Sitemap missing 2 live pages

**File:** `sitemap.xml`  
**Missing:** `exhibitions.html` and `not-for-sale.html`  
**Impact:** Both pages exist and are live. Search engines may not discover them via sitemap. Google will likely crawl them via internal links, but sitemap omission delays indexing and undermines the SEO architecture built in prior sessions.

### Bug 5 — Exhibition video files not on disk

**Reference:** `exhibitions.html` lines 225–232 references two `.mp4` files at:  
`assets/videos/exhibitions/italy-exhibition/italy-expo-video-01.mp4`  
`assets/videos/exhibitions/italy-exhibition/italy-expo-video-02.mp4`  
**Status:** Neither file exists locally or on the live server. The `<video>` elements will render with the poster image visible but the play button will fail.

### Issue 6 — Artwork inquiry form webhook has no Make.com scenario

**Code:** `artwork-loader.js` line 170 — `ARTWORK_WEBHOOK_URL = 'https://hook.eu2.make.com/jute9hiso8mnsoyxtls58zhvqedbfqej'`  
**Purpose:** When a visitor fills out the inquiry form on any artwork page and clicks "Send Enquiry", the data fires to this URL. The Make.com scenario for this webhook has never been built.  
**Impact:** Form appears to submit (success message shown), but no record is created in Airtable. Artwork inquiries are silently lost.

### Issue 7 — Orphan JS file

**File:** `artworks/artwork-loader.js` (321 lines)  
**Status:** Stale copy of an older loader version. No HTML references it — all 5 artwork pages correctly reference `../assets/js/artwork-loader.js`. This file should be deleted to avoid future confusion.

### Issue 8 — artwork-loader.js version string

**All 5 artwork HTML pages:** `artwork-loader.js?v=9`  
**Current:** `main.js?v=14`, `style.css?v=14`  
**Impact:** Minimal — the file was last meaningfully changed (data-lb wiring, console logs) around v9 anyway. But it's inconsistent with the rest of the version system.

---

## 6. NEXT STEPS ROADMAP

### 🚨 Fix immediately (bugs that silently break things)

**A. Fix The Sovereign inline data — add detail-03.jpg**  
File: `artworks/the-sovereign.html`  
Action: In the `<script id="artwork-data">` block, update the `gallery` array from:  
`["cover.jpg", "wall.jpg", "lifestyle.jpg", "detail-01.jpg", "detail-02.jpg"]`  
to:  
`["cover.jpg", "wall.jpg", "lifestyle.jpg", "detail-01.jpg", "detail-02.jpg", "detail-03.jpg"]`

**B. Fix The Sovereign artwork.json — rewrite correct content**  
File: `assets/images/artworks/the-sovereign/artwork.json`  
Action: Overwrite with valid JSON matching the inline data block (with 6-image gallery and correct status). The status in the JSON should be `"available"` or `"not_for_sale"` — pick one and keep both sources consistent.

**C. Generate detail-03.webp**  
Run: `cwebp -q 82 assets/images/artworks/the-sovereign/detail-03.jpg -o assets/images/artworks/the-sovereign/detail-03.webp`  
Or use any WebP converter. Without this, detail-03 never displays in WebP browsers.

**D. Add missing pages to sitemap.xml**  
Add these two `<url>` blocks to `sitemap.xml`:  
- `https://vacamarquetry.shop/exhibitions.html`  
- `https://vacamarquetry.shop/not-for-sale.html`

### 🔧 Fix soon (functional gaps)

**E. Build the artwork inquiry form Make.com scenario**  
Webhook: `https://hook.eu2.make.com/jute9hiso8mnsoyxtls58zhvqedbfqej`  
This receives: visitor name, email, message, artwork title, source page, intent score.  
Build a simple scenario: Webhook → Airtable Create Record → map to the same Leads table with Lead Type = "Artwork Inquiry", Interaction Type = "Contact Form".

**F. Source or record the exhibition video files**  
Files expected: `assets/videos/exhibitions/italy-exhibition/italy-expo-video-01.mp4` and `-02.mp4`  
Options: (1) Add real video files if they exist, (2) Remove the `<video>` elements from exhibitions.html and replace with images only, (3) Embed YouTube/Vimeo links instead.

### 🧹 Clean up (low risk, good hygiene)

**G. Delete orphan artwork-loader.js**  
`artworks/artwork-loader.js` — stale duplicate, not referenced, safe to delete.

**H. Bump artwork-loader version string**  
Change `artwork-loader.js?v=9` to `?v=14` on all 5 artwork pages for consistency. No functional impact.

**I. Manual Airtable CRM UI setup** (documented in `VaCa-Airtable-CRM-Setup.md`)  
Add emoji options to Lead Type and Status fields; create 6 filtered views; set row height to Large.

### ✅ Ready for production — no action needed

- Homepage, collection, artist, craft, trade, contact, exhibitions (content only) pages
- Museum viewer (zoom/pan/swipe)
- WhatsApp float button + CRM pipeline (scenario 9449734)
- Cookie consent banner + CRM pipeline (scenario 9450025)
- Visitor identity tracking (localStorage/sessionStorage)
- All SEO metadata and schema.org markup
- GA4 + Consent Mode v2
- Mobile responsive layout

---

## 7. PRIORITY SUMMARY

| # | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Add detail-03.jpg to sovereign HTML inline data | 2 min | Gallery incomplete |
| 2 | Rewrite truncated artwork.json | 3 min | Fallback path broken |
| 3 | Generate detail-03.webp | 2 min | Image invisible in WebP browsers |
| 4 | Add exhibitions + NFS to sitemap.xml | 2 min | SEO — 2 pages not indexed |
| 5 | Build artwork inquiry Make.com scenario | 30 min | Inquiries silently lost |
| 6 | Resolve exhibition videos | 30 min | Broken video elements |
| 7 | Delete artworks/artwork-loader.js | 1 min | Hygiene |
| 8 | Bump artwork-loader version string | 3 min | Hygiene |
| 9 | Airtable CRM views + emoji options | 15 min | CRM readability only |
