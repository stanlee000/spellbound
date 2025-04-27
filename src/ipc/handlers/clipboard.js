const clipboardService = require('../../services/clipboard');

function setupClipboardHandlers(ipcMain) {
  // Handle getting clipboard text
  ipcMain.handle('get-clipboard-text', () => {
    return clipboardService.readText();
  });

  // Handle setting clipboard text
  ipcMain.handle('set-clipboard-text', (event, text) => {
    return clipboardService.writeText(text);
  });

  // Handle correction application
  ipcMain.handle('apply-correction', async (event, correction) => {
    try {
      const currentText = clipboardService.readText();
      
      // Create a new string with the correction applied
      const newText = currentText.replace(
        new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        correction.suggestion
      );
      
      // Only update if the text actually changed
      if (newText !== currentText) {
        clipboardService.writeText(newText);
      }
      
      return true;
    } catch (error) {
      console.error('Error applying correction:', error);
      throw error;
    }
  });
}

module.exports = {
  setupClipboardHandlers
}; 