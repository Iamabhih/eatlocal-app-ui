/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icon sizes from the source SVG.
 *
 * Prerequisites:
 * npm install sharp
 *
 * Usage:
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not installed. Install with: npm install sharp');
  console.log('');
  console.log('Alternative: Use an online converter like:');
  console.log('- https://realfavicongenerator.net/');
  console.log('- https://www.pwabuilder.com/imageGenerator');
  console.log('');
  console.log('Upload public/icons/icon.svg to generate all sizes.');
  process.exit(0);
}

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_SVG = path.join(__dirname, '../public/icons/icon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Generating PWA icons...');

  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('Source SVG not found:', SOURCE_SVG);
    process.exit(1);
  }

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await sharp(SOURCE_SVG)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('');
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
