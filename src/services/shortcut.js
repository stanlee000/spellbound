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

// Track registered shortcuts
const registeredShortcuts = [];

/**
 * Register the main hotkey for the app
 * @param {string} hotkey - The hotkey to register
 * @param {Function} callback - The callback to execute
 * @returns {boolean} Success status
 */
function registerHotkey(hotkey, callback) {
  try {
    // Check if hotkey already registered
    if (registeredShortcuts.includes(hotkey)) {
      // Unregister just this specific hotkey
      globalShortcut.unregister(hotkey);
      // Remove from tracking
      const index = registeredShortcuts.indexOf(hotkey);
      if (index > -1) {
        registeredShortcuts.splice(index, 1);
      }
    }
    
    // Register the new shortcut
    const registered = globalShortcut.register(hotkey, () => {
      callback();
    });
    
    if (!registered) {
      console.error(`Failed to register hotkey: ${hotkey}`);
      return false;
    }
    
    // Add to tracked shortcuts
    registeredShortcuts.push(hotkey);
    
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
    // Get the translation shortcut from settings or use default
    const settings = settingsService.loadSettings();
    const translationHotkey = settings.translationHotkey || 'CommandOrControl+Shift+T';
    
    // Register the translation shortcut
    const success = registerHotkey(translationHotkey, () => {
      console.log('Translation shortcut triggered');
      callback();
    });
    
    if (!success) {
      console.error(`Failed to register translation shortcut: ${translationHotkey}`);
      return false;
    }
    
    console.log(`Translation shortcut registered: ${translationHotkey}`);
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
  // First unregister all shortcuts to start clean
  globalShortcut.unregisterAll();
  registeredShortcuts.length = 0;

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
    const shortcut = `CommandOrControl+${key}`;
    globalShortcut.unregister(shortcut);
    
    // Remove from tracked shortcuts
    const index = registeredShortcuts.indexOf(shortcut);
    if (index > -1) {
      registeredShortcuts.splice(index, 1);
    }
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