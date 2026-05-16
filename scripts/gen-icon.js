const fs = require('fs');
const path = require('path');

// Generate a simple 128x128 PNG icon using raw PNG bytes
// We'll create it as a simple colored square with a whiteboard symbol

const { createCanvas } = (() => {
  try { return require('canvas'); } catch { return null; }
})() || {};

if (!createCanvas) {
  // Fallback: copy a minimal valid PNG (1x1 transparent)
  // Real icon should be replaced before publishing
  const minPNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000800000008008020000004b6d29580000' +
    '00097048597300000b1300000b1301009a9c180000000774494d4507e60101000000' +
    '2a4c92890000001d74455874436f6d6d656e74004372656174656420776974682047' +
    '494d50642e650d0000004f4944415478016354f8cfc0c0c0c000' +
    'c4800008000000ff1900' +
    '0000000049454e44ae426082',
    'hex'
  );
  fs.writeFileSync(path.join(__dirname, '../media/icon.png'), minPNG);
  console.log('Placeholder icon written');
}
