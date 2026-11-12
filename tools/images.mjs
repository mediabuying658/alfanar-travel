#!/usr/bin/env node
/* Responsive image pipeline for APPROVED, LICENSED photos only.
   1. Put originals in images-src/<page>/<slot>.(jpg|jpeg|png|webp), using the slot names in docs/IMAGE_MAP.md
      e.g. images-src/hotels/hero-room.jpg
   2. npm i -D sharp && node tools/images.mjs
   3. node build.mjs  → the build detects the files and swaps the placeholders for <picture> elements.
   Output per slot: <slot>.jpg (1600w fallback) + <slot>-800/-1600 in .avif, .webp, .jpg  */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'images-src');
const outDir = path.join(root, 'public/assets/img');
let sharp;
try { sharp = (await import('sharp')).default; } catch { console.error('Install sharp first: npm i -D sharp'); process.exit(1); }

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = fs.existsSync(srcDir) ? walk(srcDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];
if (!files.length) { console.log('No source images in images-src/'); process.exit(0); }
const manifestPath = path.join(srcDir, '.manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch {}

for (const f of files) {
  const rel = path.relative(srcDir, f).replace(/\.[^.]+$/, '');
  const base = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(base), { recursive: true });
  // skip images whose source has not changed (content hash) and whose outputs exist
  const hash = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
  const outs = [`${base}.jpg`, ...[800, 1600].flatMap((w) => ['avif', 'webp', 'jpg'].map((e) => `${base}-${w}.${e}`))];
  if (!process.argv.includes('--force') && manifest[rel] === hash && outs.every((o) => fs.existsSync(o))) { console.log('·', rel, '(up to date)'); continue; }
  const img = sharp(f).rotate();
  const meta = await img.metadata();
  if (meta.width < 1600) console.warn(`⚠ ${rel}: only ${meta.width}px wide — supply at least 1600px (2400px for heroes).`);
  for (const w of [800, 1600]) {
    const r = img.clone().resize({ width: w, withoutEnlargement: true });
    await r.clone().avif({ quality: 50 }).toFile(`${base}-${w}.avif`);
    await r.clone().webp({ quality: 72 }).toFile(`${base}-${w}.webp`);
    await r.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${base}-${w}.jpg`);
  }
  await img.clone().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(`${base}.jpg`);
  manifest[rel] = hash;
  console.log('✓', rel);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
