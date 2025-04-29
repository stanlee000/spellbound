const { clipboard } = require('electron');

let lastClipboardContent = '';
let lastCheckTime = 0;

/**
 * Get the text from the clipboard
 * @returns {string} Text from clipboard
 */
function getClipboardText() {
  const text = clipboard.readText();
  lastClipboardContent = text;
  return text;
}

/**
 * Set text to the clipboard
 * @param {string} text - Text to set to clipboard
 * @returns {boolean} Success status
 */
function setClipboardText(text) {
  clipboard.writeText(text);
  lastClipboardContent = text;
  return true;
}

/**
 * Apply a correction to text
 * @param {Object} correction - Correction object with original and suggestion
 * @returns {boolean} Success status
 */
function applyCorrection(correction) {
  try {
    // Get current text from clipboard
    const currentText = clipboard.readText();
    
    // Create a new string with the correction applied
    const newText = currentText.replace(
      new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
      correction.suggestion
    );
    
    // Only update if the text actually changed
    if (newText !== currentText) {
      clipboard.writeText(newText);
    }
    
    return true;
  } catch (error) {
    console.error('Error applying correction:', error);
    throw error;
  }
}

module.exports = {
  getClipboardText,
  setClipboardText,
  applyCorrection,
  lastClipboardContent,
  lastCheckTime
}; 