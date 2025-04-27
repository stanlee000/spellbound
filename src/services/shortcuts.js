const { globalShortcut } = require('electron');
const { screen } = require('electron');
const { DEFAULT_HOTKEY, TRANSLATION_HOTKEY, LANGUAGE_SHORTCUTS } = require('../config/constants');
const Store = require('electron-store');

const store = new Store();

function registerHotkey(hotkey, callback) {
  try {
    // Unregister any existing shortcuts first
    globalShortcut.unregisterAll();
    
    // Register the new shortcut
    const registered = globalShortcut.register(hotkey, callback);
    
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

function registerLanguageShortcuts(mainWindow) {
  Object.keys(LANGUAGE_SHORTCUTS).forEach(key => {
    globalShortcut.register(`CommandOrControl+${key}`, () => {
      if (mainWindow) {
        mainWindow.webContents.send('translate-with-language', { language: LANGUAGE_SHORTCUTS[key] });
      }
    });
  });
}

function unregisterLanguageShortcuts() {
  console.log('Unregistering language shortcuts');
  Object.keys(LANGUAGE_SHORTCUTS).forEach(key => {
    globalShortcut.unregister(`CommandOrControl+${key}`);
  });
}

function getValidHotkeys() {
  return {
    modifiers: ['CommandOrControl', 'Alt', 'Shift', 'Super'],
    keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
  };
}

function getDefaultHotkey() {
  return DEFAULT_HOTKEY;
}

function getTranslationHotkey() {
  return TRANSLATION_HOTKEY;
}

module.exports = {
  registerHotkey,
  registerLanguageShortcuts,
  unregisterLanguageShortcuts,
  getValidHotkeys,
  getDefaultHotkey,
  getTranslationHotkey
}; 