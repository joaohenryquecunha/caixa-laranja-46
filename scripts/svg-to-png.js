import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve(process.cwd(), 'public', 'social-preview.svg');
const outPath = path.resolve(process.cwd(), 'public', 'social-preview.png');

async function run() {
  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found at', svgPath);
    process.exit(1);
  }

  try {
    await sharp(svgPath)
      .resize(1200, 630, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(outPath);

    console.log('Generated PNG at', outPath);
  } catch (err) {
    console.error('Error generating PNG:', err);
    process.exit(1);
  }
}

run();
