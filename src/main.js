const { app } = require('electron');
const path = require('path');

// Import our services and handlers
const openaiService = require('./services/openai');
const settingsService = require('./services/settings');
const shortcutService = require('./services/shortcut');
const windowManager = require('./ui/window');
const trayManager = require('./ui/tray');
const ipcHandlers = require('./handlers/ipc');
const textHandler = require('./handlers/text');

console.log('Starting Spellbound app...');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));

// Initialize OpenAI client
const initResult = openaiService.initOpenAI();
console.log('OpenAI initialization result:', initResult);

// Setup app event handlers
function handleTranslationShortcut() {
  console.log('Translation shortcut triggered');
  
  const mainWindow = windowManager.getMainWindow();
  if (!mainWindow) return;

  // Show window and position it near cursor
  const position = shortcutService.getWindowPositionFromCursor();
  windowManager.showWindowAtPosition(position);

  if (!openaiService.openaiClient) {
    console.log('No OpenAI client - prompting for API key');
    mainWindow.webContents.send('show-settings');
    return;
  }
  
  // Get text from clipboard
  const clipboardService = require('./services/clipboard');
  const selection = clipboardService.getClipboardText().trim();
  
  // Always notify about the text status
  if (!selection) {
    console.log('No text in clipboard');
    mainWindow.webContents.send('show-notification', 'Please select some text first');
    return;
  }

  // Switch to translation tab and show language selector
  mainWindow.webContents.send('set-active-tab', 2); // Index 2 for translation tab
  mainWindow.webContents.send('show-language-selector');
}

function handleGrammarCheckShortcut() {
  // Position the window near the cursor
  const position = shortcutService.getWindowPositionFromCursor();
  const mainWindow = windowManager.getMainWindow();
  
  if (mainWindow && !windowManager.isWindowFocused()) {
    windowManager.showWindowAtPosition(position);
  }
  
  // Check the text regardless of window visibility
  textHandler.checkSelectedText(false);
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  
  // Create main window
  windowManager.createWindow();
  console.log('Window created');
  
  // Create tray
  trayManager.createTray(() => app.quit());
  console.log('Tray created');
  
  // Set up window events
  windowManager.setupWindowEvents({
    onBlur: () => {
      const settings = settingsService.loadSettings();
      if (settings.hasSeenInstructions) {
        windowManager.hideWindow();
      }
    }
  });
  
  // Set up shortcut callbacks
  const shortcutCallbacks = {
    grammarCheck: handleGrammarCheckShortcut,
    translation: handleTranslationShortcut
  };
  
  // Register shortcuts
  shortcutService.registerShortcuts(shortcutCallbacks);
  console.log('Shortcuts registered');
  
  // Set up IPC handlers
  ipcHandlers.setupIpcHandlers(textHandler.checkSelectedText);
  console.log('IPC handlers registered');
  
  // Show window when clicking the dock icon (macOS)
  app.on('activate', () => {
    windowManager.showWindow();
  });
  
}).catch(error => {
  console.error('Error during app startup:', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!windowManager.isWindowAvailable()) {
    windowManager.createWindow();
  }
});

// Clean up on app quit
app.on('will-quit', () => {
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
}); 