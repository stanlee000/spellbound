const { app, ipcMain } = require('electron');
const path = require('path');

// Import services
const openaiService = require('./services/openai');
const windowService = require('./services/window');
const trayService = require('./services/tray');
const shortcutsService = require('./services/shortcuts');

// Import IPC handlers
const apiHandlers = require('./ipc/handlers/api');
const textHandlers = require('./ipc/handlers/text');
const settingsHandlers = require('./ipc/handlers/settings');
const clipboardHandlers = require('./ipc/handlers/clipboard');

console.log('Starting Spellbound app...');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));

// Initialize OpenAI client
openaiService.initOpenAI();

// Setup IPC handlers
apiHandlers.setupApiHandlers(ipcMain);
textHandlers.setupTextHandlers(ipcMain);
settingsHandlers.setupSettingsHandlers(ipcMain);
clipboardHandlers.setupClipboardHandlers(ipcMain);

// Handle window show request
ipcMain.handle('show-window', () => {
  windowService.showWindow();
});

// Handle window minimization
ipcMain.handle('minimize-window', () => {
  windowService.hideWindow();
});

// Common languages for translation
ipcMain.handle('get-common-languages', () => {
  return [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
  ];
});

// App lifecycle events
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  windowService.createWindow();
  console.log('Window created');
  trayService.createTray();
  console.log('Tray created');
  shortcutsService.registerLanguageShortcuts(windowService.getMainWindow());
  console.log('Shortcuts registered');
}).catch(error => {
  console.error('Error during app startup:', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (windowService.getMainWindow() === null) {
    windowService.createWindow();
  }
});

// Clean up on app quit
app.on('will-quit', () => {
  shortcutsService.unregisterLanguageShortcuts();
}); 