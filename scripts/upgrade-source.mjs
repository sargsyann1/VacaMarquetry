// upgrade-source.mjs — upgrades existing single-WebP <source> tags to a
// responsive srcset + sizes, on pages that already use <picture>.
// Only rewrites the srcset value and appends sizes; nothing else changes.
//
// Usage:  node scripts/upgrade-source.mjs index.html collection.html custom-portraits.html not-for-sale.html

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const files = process.argv.slice(2);
const RESP_WIDTHS = [480, 800, 1200];

function sizesFor(ctx) {
  if (/hero-image-wrap/.test(ctx))  return '(max-width: 960px) 100vw, 50vw';   // homepage split hero
  if (/page-hero-image/.test(ctx))  return '(max-width: 900px) 100vw, 50vw';   // inner page hero
  if (/wall-feature|lifestyle-feature|wall-section/.test(ctx)) return '100vw'; // full-bleed features
  if (/feature-media|feature-split/.test(ctx)) return '(max-width: 840px) 100vw, 50vw';
  if (/detail-pair|detail-frame/.test(ctx)) return '(max-width: 600px) 100vw, 50vw';
  if (/gallery-editorial/.test(ctx)) return '(max-width: 500px) 100vw, (max-width: 860px) 50vw, 33vw';
  if (/nfs-thumb|nfs-grid/.test(ctx)) return '(max-width: 700px) 100vw, 50vw';
  // index featured grid & any other art-thumb grid
  return '(max-width: 600px) 100vw, (max-width: 960px) 50vw, 33vw';
}

async function buildSrcset(webpRel) {
  const dir  = path.posix.dirname(webpRel);
  const base = path.posix.basename(webpRel).replace(/\.webp$/i, '');
  const parts = [];
  for (const w of RESP_WIDTHS) {
    const rel = `${dir}/${base}-${w}.webp`;
    if (existsSync(rel)) parts.push(`${rel} ${w}w`);
  }
  if (existsSync(webpRel)) {
    const meta = await sharp(webpRel).metadata();
    if (meta.width) parts.push(`${webpRel} ${meta.width}w`);
  }
  return parts.join(', ');
}

for (const file of files) {
  let html = await readFile(file, 'utf8');
  // Match a single-WebP source (srcset first, no commas, then type=webp)
  const re = /<source\s+srcset="([^"]+\.webp)"\s+type="image\/webp">/g;
  let out = '', last = 0, count = 0, m;

  while ((m = re.exec(html)) !== null) {
    const webpRel = m[1];
    const ctx = html.slice(Math.max(0, m.index - 420), m.index);
    const sizes = sizesFor(ctx);
    const srcset = await buildSrcset(webpRel);
    if (!srcset) continue;
    const replacement = `<source type="image/webp" srcset="${srcset}" sizes="${sizes}">`;
    out += html.slice(last, m.index) + replacement;
    last = m.index + m[0].length;
    count++;
  }
  out += html.slice(last);
  await writeFile(file, out, 'utf8');
  console.log(`${file} — upgraded ${count} <source>`);
}
