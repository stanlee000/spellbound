const { ipcMain } = require('electron');
const openaiService = require('../services/openai');
const settingsService = require('../services/settings');
const clipboardService = require('../services/clipboard');
const shortcutService = require('../services/shortcut');
const windowManager = require('../ui/window');

/**
 * Set up all IPC handlers
 * @param {Function} checkSelectedText - Function to check selected text
 */
function setupIpcHandlers(checkSelectedText) {
  // OpenAI API key handling
  ipcMain.handle('get-api-key', () => {
    return settingsService.getApiKey();
  });

  ipcMain.handle('set-api-key', async (event, apiKey) => {
    try {
      console.log('Setting API key:', apiKey ? '[Key provided]' : '[No key]');
      
      // Store the API key
      settingsService.setApiKey(apiKey);
      
      // Reinitialize OpenAI client
      const initResult = openaiService.initOpenAI();
      console.log('OpenAI client initialization result:', initResult);
      
      if (!initResult) {
        throw new Error('Failed to initialize OpenAI client');
      }
      
      // Test the API key by making a simple API call
      console.log('Testing API key with a models list request');
      const models = await openaiService.getAvailableModels();
      console.log('API key test successful, found models:', models.length);
      
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      // Clear the invalid API key
      settingsService.setApiKey(null);
      throw error;
    }
  });

  // Model handling
  ipcMain.handle('get-available-models', async () => {
    try {
      return await openaiService.getAvailableModels();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  });

  ipcMain.handle('set-model', (event, modelId) => {
    settingsService.setCurrentModel(modelId);
    return true;
  });

  ipcMain.handle('get-current-model', () => {
    return settingsService.getCurrentModel();
  });

  // Text enhancement
  ipcMain.handle('enhance-text', async (event, params) => {
    try {
      return await openaiService.enhanceText(params);
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw error;
    }
  });

  // Text checking
  ipcMain.handle('check-text', async (event, text) => {
    try {
      return await openaiService.checkText(text);
    } catch (error) {
      console.error('Error checking text:', error);
      throw error;
    }
  });

  // Translation
  ipcMain.handle('translate-text', async (event, params) => {
    try {
      return await openaiService.translateText(params);
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  });

  // Language handling
  ipcMain.handle('get-common-languages', () => {
    return openaiService.getCommonLanguages();
  });

  // Clipboard handling
  ipcMain.handle('get-clipboard-text', () => {
    return clipboardService.getClipboardText();
  });

  ipcMain.handle('set-clipboard-text', (event, text) => {
    return clipboardService.setClipboardText(text);
  });

  // Settings handling
  ipcMain.handle('save-settings', (event, settings) => {
    const oldSettings = settingsService.loadSettings();
    
    // If hotkey changed, try to register the new one
    if (settings.hotkey && settings.hotkey !== oldSettings.hotkey) {
      const success = shortcutService.registerHotkey(settings.hotkey, () => {
        checkSelectedText(false);
      });
      
      if (!success) {
        // If registration failed, keep the old hotkey
        settings.hotkey = oldSettings.hotkey;
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('show-notification', 'Failed to register hotkey. Please try a different combination.');
        }
      }
    }
    
    settingsService.saveSettings(settings);
    return true;
  });

  ipcMain.handle('load-settings', () => {
    return settingsService.loadSettings();
  });

  ipcMain.handle('get-valid-hotkeys', () => {
    return settingsService.getValidHotkeys();
  });

  // Window management
  ipcMain.handle('show-window', () => {
    windowManager.showWindow();
  });

  ipcMain.handle('minimize-window', () => {
    windowManager.hideWindow();
  });

  // Correction handling
  ipcMain.handle('apply-correction', async (event, correction) => {
    try {
      return await clipboardService.applyCorrection(correction);
    } catch (error) {
      console.error('Error applying correction:', error);
      throw error;
    }
  });

  // Translation with language
  ipcMain.handle('translate-with-language', async (event, { language }) => {
    try {
      const selectedText = clipboardService.getClipboardText().trim();
      const mainWindow = windowManager.getMainWindow();
      
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
  setupIpcHandlers
}; 