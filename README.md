# VaCa Marquetry — V2 Website

A luxury, commission-first website for VaCa Marquetry, built as a static site so it can be deployed to **Hostinger** (static hosting / subfolder) or **Vercel** with zero build step.

This is a parallel V2 build. **The live WordPress site at vacamarquetry.shop is untouched** — this repo is a from-scratch rebuild, ready to deploy independently once content and real photography are in place.

---

## Project Structure

```
VacaMarquetry/
├── index.html              Home
├── custom-portraits.html   Primary revenue page — commission funnel
├── collection.html         Gallery of existing artworks
├── the-artist.html         Artist bio / studio story
├── the-craft.html          Marquetry process explainer
├── trade.html               Trade / interior designer page
├── contact.html             General contact
├── assets/
│   ├── css/style.css        Design system (tokens, components, layout)
│   ├── js/main.js           Nav toggle, FAQ accordion, upload feedback
│   └── images/              Place real photography here (see below)
└── README.md
```

No build tools, no framework, no npm install required. Open `index.html` directly in a browser, or serve the folder with any static file server.

---

## Design System

Defined as CSS custom properties at the top of `assets/css/style.css`:

| Token | Value | Use |
|---|---|---|
| `--bone` | `#F5F1EA` | Page background |
| `--walnut` | `#2B1D14` | Headlines, primary text |
| `--charcoal` | `#33312E` | Body copy |
| `--brass` | `#B08D57` | Accent, buttons, icons |
| `--forest` | `#1F2520` | Contrast section backgrounds |

**Typography:** Playfair Display (headlines) + Inter (body/UI), loaded via Google Fonts in each page's `<head>`.

**Signature element:** the "seam" divider (`.seam` class) — a hairline with a brass tick mark, echoing a marquetry seam line. Used between content sections on The Artist page and as a quiet structural motif.

All section spacing, button styles, and form styles are tokenized — change a CSS variable once, it updates everywhere.

---

## Placeholder Content — What Still Needs to Be Added

Every page currently uses **labeled placeholder blocks** instead of real photography (e.g. "Before / after split — photo to finished portrait"). This was intentional: the structure, copy, and conversion logic are ready to review now, without waiting on a photo shoot.

**Before going live, replace:**
1. All `.hero-media` / `.art-media` / `.timeline-media` placeholder `<div>` blocks with real `<img>` tags pointing to `assets/images/`
2. Pricing placeholders (`€[X]`, `€[Y]`, `€[Z]`) with confirmed pricing
3. The embedded process video placeholder on The Artist and The Craft pages
4. Collection page product cards with real artwork photos and final titles/categories
5. Trade page case study placeholders once real project photography exists

A dedicated photo shoot list (before/after pairs, process shots, COA flat-lay, studio shots) was covered in an earlier planning pass — reference that list when scheduling the shoot.

---

## Forms

All forms (`Custom Portrait Inquiry`, `Trade Inquiry`, `General Contact`) are currently plain HTML forms with `action="#"` — they do not submit anywhere yet. Before launch, connect them to one of:

- **A form backend** (e.g., Formspree, Basin, or a serverless function) if deploying to Vercel
- **WPForms-style hosted form action** if you want submissions to flow into the same Airtable/Make.com automation pipeline planned for the WordPress site
- A custom serverless endpoint (Vercel Functions) that forwards submissions to your Make.com webhook

The field structure (names, types, required attributes) already matches the inquiry form specs from the broader implementation plan, so whichever backend you choose, the front-end fields shouldn't need to change.

---

## Deployment

### Option A — Vercel
1. Push this repo to GitHub (see below)
2. Import the repo in Vercel as a new project
3. Framework preset: **Other** (static site, no build command needed)
4. Output directory: `/` (root)
5. Deploy

### Option B — Hostinger
1. Zip the contents of this folder
2. Upload via Hostinger's File Manager or FTP into `public_html` (or a subfolder if testing alongside the existing WordPress install, e.g. `public_html/v2/`)
3. Ensure `index.html` sits at the root of whichever folder you point the domain/subdomain at

---

## Pushing This Project to GitHub

This folder is already a git repository (`git init` has been run, no commits yet). To push it to the existing empty repo at `sargsyann1/VacaMarquetry`:

```bash
cd VacaMarquetry
git add .
git commit -m "Initial V2 build: home, custom portraits, collection, artist, craft, trade, contact"
git branch -M main
git remote add origin https://github.com/sargsyann1/VacaMarquetry.git
git push -u origin main
```

To open this as a pull request instead of pushing directly to `main` (recommended for review before going live):

```bash
git checkout -b v2-initial-build
git add .
git commit -m "Initial V2 build: home, custom portraits, collection, artist, craft, trade, contact"
git push -u origin v2-initial-build
```

Then open a pull request from `v2-initial-build` into `main` on GitHub (via the GitHub web UI, or with the `gh` CLI: `gh pr create --base main --head v2-initial-build --title "V2 Initial Build" --fill`).

---

## Next Steps

1. Review the structure and copy in a browser locally
2. Schedule the photo shoot and swap in real imagery
3. Confirm final pricing and replace placeholders
4. Connect forms to a backend / automation pipeline
5. Push to GitHub and open the PR for review
6. Deploy to a staging URL (Vercel preview deploy is automatic per-PR) before pointing the live domain at it
