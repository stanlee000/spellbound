const openaiService = require('../../services/openai');
const windowService = require('../../services/window');

function setupTextHandlers(ipcMain) {
  // Handle text enhancement with presets
  ipcMain.handle('enhance-text', async (event, { text, preset, customTone, additionalContext }) => {
    try {
      return await openaiService.enhanceText(text, preset, customTone, additionalContext);
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw error;
    }
  });

  // Handle text checking
  ipcMain.handle('check-text', async (event, text) => {
    try {
      return await openaiService.checkText(text);
    } catch (error) {
      console.error('Error checking text:', error);
      throw error;
    }
  });

  // Handle translation
  ipcMain.handle('translate-text', async (event, { text, targetLanguage }) => {
    try {
      return await openaiService.translateText(text, targetLanguage);
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  });

  // Handle translation with language
  ipcMain.handle('translate-with-language', async (event, { language }) => {
    try {
      const mainWindow = windowService.getMainWindow();
      if (!mainWindow) {
        throw new Error('Main window not available');
      }

      const selectedText = clipboard.readText().trim();
      if (!selectedText) {
        mainWindow.webContents.send('show-notification', 'Please select some text first');
        return;
      }

      console.log(`Translating to ${language.name}: ${selectedText.substring(0, 50)}...`);
      
      mainWindow.webContents.send('translate-text', {
        text: selectedText,
        targetLanguage: language
      });
      
      return true;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  });
}

module.exports = {
  setupTextHandlers
}; 