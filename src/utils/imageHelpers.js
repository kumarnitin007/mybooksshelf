/**
 * Image Helper Utilities
 * Functions for handling image placeholders and fallbacks
 */

/**
 * Generate a data URI placeholder image
 * @param {string} text - Text to display on placeholder
 * @param {number} width - Image width (default: 200)
 * @param {number} height - Image height (default: 300)
 * @param {string} bgColor - Background color hex (default: 4F46E5)
 * @param {string} textColor - Text color hex (default: FFFFFF)
 * @returns {string} Data URI string
 */
export const generatePlaceholderImage = (text = 'Book', width = 200, height = 300, bgColor = '4F46E5', textColor = 'FFFFFF') => {
  // Create a canvas to generate the image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = `#${bgColor}`;
  ctx.fillRect(0, 0, width, height);
  
  // Add text
  ctx.fillStyle = `#${textColor}`;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Wrap text if needed
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 40) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  // Draw text lines
  const lineHeight = 20;
  const startY = (height - (lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
  
  return canvas.toDataURL('image/png');
};

/**
 * Get a placeholder image URL (data URI or fallback)
 * @param {string} text - Text to display
 * @returns {string} Placeholder image data URI
 */
export const getPlaceholderImage = (text = 'Book') => {
  try {
    return generatePlaceholderImage(text);
  } catch (error) {
    console.warn('Error generating placeholder image:', error);
    // Fallback to a simple colored square
    return `data:image/svg+xml,${encodeURIComponent(`<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="300" fill="#4F46E5"/><text x="50%" y="50%" font-family="Arial" font-size="16" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`)}`;
  }
};

