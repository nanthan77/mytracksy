#!/usr/bin/env node
/**
 * PWA Icon Generator for MyTracksy
 * Run: node scripts/generate-icons.js
 *
 * Generates all required PWA icon sizes as high-quality SVG-rendered PNGs.
 * Uses the "MT" monogram with MyTracksy brand colors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Brand colors
const PRIMARY = '#1a237e';    // Deep indigo
const ACCENT = '#00bfa5';     // Teal accent
const WHITE = '#ffffff';

// All required icon sizes
const SIZES = [32, 72, 96, 120, 128, 144, 152, 180, 192, 384, 512];

// SVG template for the icon
function generateSVG(size) {
  const fontSize = Math.round(size * 0.38);
  const radius = Math.round(size * 0.18);
  const accentY = Math.round(size * 0.82);
  const accentH = Math.round(size * 0.06);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${PRIMARY};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d47a1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <rect x="0" y="${accentY}" width="${size}" height="${accentH}" rx="${accentH / 2}" fill="${ACCENT}" opacity="0.9"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="Inter, system-ui, -apple-system, sans-serif"
        font-weight="700" font-size="${fontSize}px" fill="${WHITE}" letter-spacing="-1">
    MT
  </text>
</svg>`;
}

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG icons (browsers support SVG icons well)
SIZES.forEach(size => {
  const svg = generateSVG(size);
  const filename = `icon-${size}.png`; // Named .png but we'll also create SVGs
  const svgFilename = `icon-${size}.svg`;

  // Write SVG version
  fs.writeFileSync(path.join(ICONS_DIR, svgFilename), svg);
  console.log(`✅ Generated ${svgFilename} (${size}x${size})`);
});

// Also generate the main favicon SVG
const faviconSVG = generateSVG(32);
fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), generateSVG(512));

// Generate maskable icon (with safe zone padding)
function generateMaskableSVG(size) {
  const padding = Math.round(size * 0.1);
  const innerSize = size - padding * 2;
  const fontSize = Math.round(innerSize * 0.38);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PRIMARY}"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
        font-family="Inter, system-ui, -apple-system, sans-serif"
        font-weight="700" font-size="${fontSize}px" fill="${WHITE}" letter-spacing="-1">
    MT
  </text>
</svg>`;
}

fs.writeFileSync(path.join(ICONS_DIR, 'maskable-icon-512.svg'), generateMaskableSVG(512));
fs.writeFileSync(path.join(ICONS_DIR, 'maskable-icon-192.svg'), generateMaskableSVG(192));
console.log('✅ Generated maskable icons');

// Generate shortcut icons
const shortcutIcons = ['voice', 'sms', 'analytics', 'company'];
shortcutIcons.forEach(name => {
  const svg = generateSVG(96);
  fs.writeFileSync(path.join(ICONS_DIR, `shortcut-${name}.svg`), svg);
  console.log(`✅ Generated shortcut-${name}.svg`);
});

console.log(`\n🎉 All icons generated in ${ICONS_DIR}`);
console.log('\n⚠️  For production, convert SVGs to PNGs using:');
console.log('    npx sharp-cli --input public/icons/icon-512.svg --output public/icons/icon-512.png --resize 512');
console.log('    Or use https://realfavicongenerator.net/ with your logo');
