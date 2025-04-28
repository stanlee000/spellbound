const openaiService = require('../services/openai');
const clipboardService = require('../services/clipboard');
const windowManager = require('../ui/window');

/**
 * Check selected text for grammar, spelling and style issues
 * @param {boolean} shouldShowWindow - Whether to show the window
 */
async function checkSelectedText(shouldShowWindow = false) {
  try {
    console.log('Checking selected text...');
    
    const mainWindow = windowManager.getMainWindow();
    if (!mainWindow) return;
    
    // Check if we have an OpenAI client
    try {
      // Force client re-init to make sure we have the latest state
      openaiService.initOpenAI();
      
      if (!openaiService.openaiClient) {
        console.log('No OpenAI client available after initialization check');
        mainWindow.show();
        mainWindow.webContents.send('show-settings');
        return;
      }
    } catch (error) {
      console.error('Error checking OpenAI client:', error);
      mainWindow.show();
      mainWindow.webContents.send('show-settings');
      mainWindow.webContents.send('show-notification', 'Error connecting to OpenAI. Please check your API key.');
      return;
    }
    
    // Switch to Grammar & Style tab
    mainWindow.webContents.send('set-active-tab', 0); // Index 0 for Grammar & Style tab
    
    // Get text from clipboard
    const selection = clipboardService.getClipboardText().trim();
    
    // Always notify about the text status
    if (!selection) {
      console.log('No text in clipboard');
      mainWindow.webContents.send('show-notification', 'Please select some text first');
      return;
    }

    // Notify about checking start
    mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: true });

    console.log('Checking text:', selection);
    
    // Use the OpenAI service for checking
    try {
      const response = await openaiService.checkText(selection);
      if (response.corrections && Array.isArray(response.corrections)) {
        if (response.corrections.length === 0) {
          mainWindow.webContents.send('show-notification', 'Perfect! No corrections needed ✨');
          mainWindow.webContents.send('check-text-reply', { 
            text: selection, 
            corrections: [], 
            isChecking: false 
          });
        } else {
          mainWindow.webContents.send('check-text-reply', {
            text: selection,
            corrections: response.corrections,
            language: response.language,
            languageSpecific: response.languageSpecific || [],
            isChecking: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking text with OpenAI:', error);
      mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
      mainWindow.webContents.send('show-notification', 'Error checking text. Please try again.');
    }
  } catch (error) {
    console.error('Error checking text:', error);
    const mainWindow = windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('check-text-reply', { text: '', corrections: [], isChecking: false });
      mainWindow.webContents.send('show-notification', 'Error checking text. Please try again.');
    }
  }
}

module.exports = {
  checkSelectedText
}; 