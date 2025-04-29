const { globalShortcut, screen } = require('electron');
const settingsService = require('./settings');

// Add language shortcuts mapping
const LANGUAGE_SHORTCUTS = {
  'e': 'English',
  'p': 'Polish',
  'c': 'Chinese',
  'g': 'German',
  'f': 'French',
  's': 'Spanish',
  'r': 'Russian',
  'i': 'Italian',
  'j': 'Japanese',
  'h': 'Hindi',
  'a': 'Arabic',
  't': 'Portuguese',
};

let isLanguageSelectorActive = false;

/**
 * Register the main hotkey for the app
 * @param {string} hotkey - The hotkey to register
 * @param {Function} callback - The callback to execute
 * @returns {boolean} Success status
 */
function registerHotkey(hotkey, callback) {
  try {
    // Unregister any existing shortcuts first
    globalShortcut.unregisterAll();
    
    // Register the new shortcut
    const registered = globalShortcut.register(hotkey, () => {
      callback();
    });
    
    if (!registered) {
      console.error(`Failed to register hotkey: ${hotkey}`);
      return false;
    }
    
    console.log(`Successfully registered hotkey: ${hotkey}`);
    return true;
  } catch (error) {
    console.error('Error registering hotkey:', error);
    return false;
  }
}

/**
 * Register translation shortcut
 * @param {Function} callback - The callback to execute
 * @returns {boolean} Success status
 */
function registerTranslationShortcut(callback) {
  try {
    // Register the translation shortcut (Cmd+Shift+T)
    const registered = globalShortcut.register('CommandOrControl+Shift+T', () => {
      console.log('Translation shortcut triggered');
      callback();
    });
    
    if (!registered) {
      console.error('Failed to register translation shortcut');
      return false;
    }
    
    console.log('Translation shortcut registered: CommandOrControl+Shift+T');
    return true;
  } catch (error) {
    console.error('Error registering translation shortcut:', error);
    return false;
  }
}

/**
 * Register all shortcuts
 * @param {Object} callbacks - Callbacks for different shortcuts
 */
function registerShortcuts(callbacks) {
  const settings = settingsService.loadSettings();
  const hotkey = settings.hotkey || 'CommandOrControl+Shift+C';
  
  // Register grammar check shortcut
  registerHotkey(hotkey, callbacks.grammarCheck);
  
  // Register translation shortcut
  registerTranslationShortcut(callbacks.translation);
}

/**
 * Unregister language shortcuts
 */
function unregisterLanguageShortcuts() {
  console.log('Unregistering language shortcuts');
  Object.keys(LANGUAGE_SHORTCUTS).forEach(key => {
    globalShortcut.unregister(`CommandOrControl+${key}`);
  });
}

/**
 * Get cursor position and calculate window position
 * @returns {Object} Window position coordinates
 */
function getWindowPositionFromCursor() {
  // Position the window near the cursor
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
  
  return { x, y };
}

module.exports = {
  registerHotkey,
  registerTranslationShortcut,
  registerShortcuts,
  unregisterLanguageShortcuts,
  getWindowPositionFromCursor,
  LANGUAGE_SHORTCUTS,
  isLanguageSelectorActive
}; 