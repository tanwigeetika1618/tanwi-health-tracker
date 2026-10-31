const { createCanvas } = (() => { try { return require('canvas'); } catch { return { createCanvas: null }; } })();
const fs = require('fs');

function generateIcon(size, filename) {
  // Generate a simple SVG-based PNG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#6d28d9"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
    <text x="50%" y="45%" text-anchor="middle" dy=".1em" font-size="${size * 0.4}" fill="white">💪</text>
    <text x="50%" y="78%" text-anchor="middle" font-size="${size * 0.1}" fill="white" font-family="Arial" font-weight="bold">HEALTH</text>
  </svg>`;
  
  fs.writeFileSync(filename.replace('.png', '.svg'), svg);
  console.log(`Generated ${filename.replace('.png', '.svg')}`);
}

generateIcon(192, 'public/icons/icon-192.png');
generateIcon(512, 'public/icons/icon-512.png');
