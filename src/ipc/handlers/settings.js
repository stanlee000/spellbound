const Store = require('electron-store');
const shortcutsService = require('../../services/shortcuts');
const windowService = require('../../services/window');

const store = new Store();

function setupSettingsHandlers(ipcMain) {
  // Update the save-settings handler
  ipcMain.handle('save-settings', (event, settings) => {
    const oldSettings = store.get('settings') || {};
    
    // If hotkey changed, try to register the new one
    if (settings.hotkey && settings.hotkey !== oldSettings.hotkey) {
      const success = shortcutsService.registerHotkey(settings.hotkey, () => {
        const mainWindow = windowService.getMainWindow();
        if (mainWindow) {
          // Position the window near the cursor
          const { screen } = require('electron');
          const cursor = screen.getCursorScreenPoint();
          const display = screen.getDisplayNearestPoint(cursor);
          
          // Calculate position to avoid window going off screen
          let x = cursor.x + 20;
          let y = cursor.y + 20;
          
          // Adjust if window would go off screen
          if (x + 800 > display.bounds.width) {
            x = cursor.x - 820;
          }
          if (y + 600 > display.bounds.height) {
            y = cursor.y - 620;
          }
          
          // Ensure x and y are not negative
          x = Math.max(x, 0);
          y = Math.max(y, 0);

          if (!mainWindow.isFocused()) {
            mainWindow.setPosition(x, y);
            mainWindow.show();
            mainWindow.focus();
          }
          
          // Get the current clipboard content
          const text = clipboard.readText().trim();
          
          // Check the text regardless of window visibility
          checkSelectedText(false);
        }
      });
      
      if (!success) {
        // If registration failed, keep the old hotkey
        settings.hotkey = oldSettings.hotkey;
        const mainWindow = windowService.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('show-notification', 'Failed to register hotkey. Please try a different combination.');
        }
      }
    }
    
    store.set('settings', settings);
    return true;
  });

  ipcMain.handle('load-settings', () => {
    const settings = store.get('settings') || {};
    // Set default hotkey if not set
    if (!settings.hotkey) {
      settings.hotkey = shortcutsService.getDefaultHotkey();
      store.set('settings', settings);
    }
    return settings;
  });

  // Add handler to get valid modifiers and keys
  ipcMain.handle('get-valid-hotkeys', () => {
    return shortcutsService.getValidHotkeys();
  });
}

module.exports = {
  setupSettingsHandlers
}; 