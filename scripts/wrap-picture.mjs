// wrap-picture.mjs — wraps raw <img src="*.jpg"> in <picture> with a WebP
// <source> (responsive srcset + sizes). Original <img> is preserved untouched
// as the fallback, so non-WebP browsers and the existing CSS/JS keep working.
//
// Usage:  node scripts/wrap-picture.mjs the-artist.html exhibitions.html the-craft.html
//
// Safe by design:
//   * Only touches <img> whose src ends in .jpg/.jpeg.
//   * Refuses to run on a file that already contains <picture> (avoids double-wrap).
//   * srcset lists only WebP renditions that actually exist on disk.
//   * <img> attributes (alt, loading, fetchpriority, data-lb-group) are kept verbatim.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const files = process.argv.slice(2);
const RESP_WIDTHS = [480, 800, 1200];

function sizesFor(ctx) {
  if (/artist-hero-wrap/.test(ctx))     return '100vw';
  if (/aspect-ratio:16\/7/.test(ctx))   return '100vw';                                // exh banner
  if (/hero-media/.test(ctx))           return '(max-width: 860px) 100vw, 560px';
  if (/awards-wrap/.test(ctx))          return '(max-width: 700px) 100vw, 50vw';
  if (/packaging-pair/.test(ctx))       return '(max-width: 600px) 100vw, 50vw';
  if (/atm-[abcde]/.test(ctx))          return '(max-width: 480px) 100vw, (max-width: 840px) 50vw, 33vw';
  // process-cell, exh-thumb, and any other grid cell
  return '(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw';
}

async function buildSrcset(jpgRel) {
  // jpgRel is the src attribute value, e.g. assets/images/artist/.../foo.jpg
  const dir  = path.posix.dirname(jpgRel);
  const base = path.posix.basename(jpgRel).replace(/\.jpe?g$/i, '');
  const parts = [];
  for (const w of RESP_WIDTHS) {
    const rel = `${dir}/${base}-${w}.webp`;
    if (existsSync(rel)) parts.push(`${rel} ${w}w`);
  }
  const fullRel = `${dir}/${base}.webp`;
  if (existsSync(fullRel)) {
    const meta = await sharp(fullRel).metadata();
    if (meta.width) parts.push(`${fullRel} ${meta.width}w`);
    else parts.push(fullRel);
  }
  return parts.join(', ');
}

for (const file of files) {
  let html = await readFile(file, 'utf8');
  if (/<picture[\s>]/i.test(html)) {
    console.warn(`SKIP ${file} — already contains <picture>`);
    continue;
  }

  const imgRe = /<img\b[^>]*>/g;         // [^>] spans newlines — matches multi-line tags
  let out = '', last = 0, count = 0, m;

  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0];
    const srcM = /\bsrc\s*=\s*"([^"]+\.jpe?g)"/i.exec(tag);
    if (!srcM) continue;                 // not a jpg <img> — leave alone
    const jpgRel = srcM[1];

    const ctx = html.slice(Math.max(0, m.index - 260), m.index); // preceding container markup
    const sizes = sizesFor(ctx);
    const srcset = await buildSrcset(jpgRel);
    if (!srcset) { console.warn(`  ! no webp for ${jpgRel} — left as-is`); continue; }

    const replacement =
      `<picture>` +
      `<source type="image/webp" srcset="${srcset}" sizes="${sizes}">` +
      tag +
      `</picture>`;

    out += html.slice(last, m.index) + replacement;
    last = m.index + tag.length;
    count++;
  }
  out += html.slice(last);

  await writeFile(file, out, 'utf8');
  console.log(`${file} — wrapped ${count} image(s)`);
}
