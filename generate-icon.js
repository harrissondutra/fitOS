const fs = require('fs');
const path = require('path');

const imagePath = path.join(process.cwd(), 'src/frontend/public/images/logomarca.png');
const iconPath = path.join(process.cwd(), 'src/frontend/public/icons/fitos-icon.svg');

try {
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Image}`;

  const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <filter id="shadow" x="-50" y="-50" width="612" height="612">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#000" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect x="0" y="0" width="512" height="512" fill="white" rx="100" />
  
  <!-- Embedded Logo -->
  <image x="86" y="40" width="340" height="340" xlink:href="${dataUri}" />

  <!-- Text -->
  <text x="50%" y="470" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="bold" font-size="80" fill="#1f2937" letter-spacing="-1">FitOS</text>
</svg>`;

  fs.writeFileSync(iconPath, svgContent);
  console.log('SVG updated successfully with embedded logo.');
} catch (error) {
  console.error('Error generating SVG:', error);
  process.exit(1);
}
