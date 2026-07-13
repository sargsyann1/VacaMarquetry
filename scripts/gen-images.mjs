// gen-images.mjs — VaCa Marquetry image pipeline
// Generates WebP twins + responsive-width WebP renditions for every source JPG
// under assets/images/. Idempotent: skips existing outputs, NEVER touches or
// deletes originals. Non-WebP browsers keep the original JPG as fallback.
//
// Usage:  node scripts/gen-images.mjs
//
// Output per source  foo.jpg:
//   foo.webp          full-size WebP (visual twin of the original)
//   foo-1200.webp     responsive widths (only when the source is wider)
//   foo-800.webp
//   foo-480.webp

import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('assets/images');
const WIDTHS = [1200, 800, 480];
const WEBP_QUALITY = 80;

// Skip files that are already a generated width rendition (e.g. foo-800.jpg)
const WIDTH_SUFFIX = /-(?:480|800|1200)$/;

let made = 0, skipped = 0, errors = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { await walk(full); continue; }
    if (!/\.jpe?g$/i.test(e.name)) continue;
    const base = e.name.replace(/\.jpe?g$/i, '');
    if (WIDTH_SUFFIX.test(base)) continue; // don't re-process our own outputs
    await process(dir, base, full);
  }
}

async function process(dir, base, srcPath) {
  let meta;
  try { meta = await sharp(srcPath).metadata(); }
  catch (err) { console.warn('  ! unreadable:', srcPath, err.message); errors++; return; }

  const srcWidth = meta.width || 0;

  // 1) Full-size WebP twin
  const fullWebp = path.join(dir, `${base}.webp`);
  await emit(srcPath, fullWebp, null);

  // 2) Responsive-width WebP renditions (never upscale)
  for (const w of WIDTHS) {
    if (srcWidth && srcWidth <= w) continue; // source already <= target width
    await emit(srcPath, path.join(dir, `${base}-${w}.webp`), w);
  }
}

async function emit(srcPath, outPath, width) {
  if (existsSync(outPath)) { skipped++; return; }
  try {
    let pipe = sharp(srcPath);
    if (width) pipe = pipe.resize({ width, withoutEnlargement: true });
    await pipe.webp({ quality: WEBP_QUALITY }).toFile(outPath);
    const { size } = await stat(outPath);
    console.log(`  + ${path.relative(ROOT, outPath)}  (${(size / 1024).toFixed(0)} KB)`);
    made++;
  } catch (err) {
    console.warn('  ! failed:', outPath, err.message); errors++;
  }
}

console.log('Scanning', ROOT, '\n');
await walk(ROOT);
console.log(`\nDone. ${made} created, ${skipped} skipped (already existed), ${errors} errors.`);
