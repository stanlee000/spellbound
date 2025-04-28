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
      // Check if window still exists before sending IPC messages
      if (windowManager.isWindowAvailable()) {
        mainWindow.show();
        mainWindow.webContents.send('show-settings');
        mainWindow.webContents.send('show-notification', 'Error connecting to OpenAI. Please check your API key.');
      }
      return;
    }
    
    // Check window availability before sending messages
    if (!windowManager.isWindowAvailable()) return;
    
    // Switch to Grammar & Style tab
    mainWindow.webContents.send('set-active-tab', 0); // Index 0 for Grammar & Style tab
    
    // Get text from clipboard
    const selection = clipboardService.getClipboardText().trim();
    
    // Always notify about the text status
    if (!selection) {
      console.log('No text in clipboard');
      // Check window availability again before sending notification
      if (windowManager.isWindowAvailable()) {
        mainWindow.webContents.send('show-notification', 'Please select some text first');
      }
      return;
    }

    // Notify about checking start
    // Check window availability before sending
    if (!windowManager.isWindowAvailable()) return;
    mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: true });

    console.log('Checking text:', selection);
    
    // Use the OpenAI service for checking
    try {
      const response = await openaiService.checkText(selection);
      // Check window availability before sending results
      if (!windowManager.isWindowAvailable()) return;
      
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
      } else {
        // Handle cases where response structure might be unexpected but not an error
        mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
        mainWindow.webContents.send('show-notification', 'Received an unexpected response format from OpenAI.');
      }
    } catch (error) {
      console.error('Error checking text with OpenAI:', error);
      // Check window availability before sending error notification
      if (windowManager.isWindowAvailable()) {
        mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
        mainWindow.webContents.send('show-notification', 'Error checking text. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error checking text (outer catch):', error);
    // Use the isWindowAvailable check here too
    if (windowManager.isWindowAvailable()) {
      const currentMainWindow = windowManager.getMainWindow(); // Re-get in case it changed
      currentMainWindow.webContents.send('check-text-reply', { text: '', corrections: [], isChecking: false });
      currentMainWindow.webContents.send('show-notification', 'An error occurred while checking text. Please try again.');
    }
  }
}

module.exports = {
  checkSelectedText
}; 