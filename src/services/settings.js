const Store = require('electron-store');

const store = new Store();

/**
 * Get the stored API key
 * @returns {string|null} The API key or null if not set
 */
function getApiKey() {
  const apiKey = store.get('openai-api-key');
  console.log('Getting API key from store. Key exists:', !!apiKey);
  return apiKey;
}

/**
 * Set the API key
 * @param {string} apiKey - The API key to store
 */
function setApiKey(apiKey) {
  console.log('Setting API key in store:', apiKey ? 'API key provided' : 'No key provided');
  if (apiKey) {
    store.set('openai-api-key', apiKey);
    console.log('API key stored successfully');
  } else {
    store.delete('openai-api-key');
    console.log('API key deleted from store');
  }
}

/**
 * Get the current model
 * @returns {string} The selected model ID or default
 */
function getCurrentModel() {
  return store.get('selected-model') || "gpt-4o";
}

/**
 * Set the model to use
 * @param {string} modelId - The model ID
 */
function setCurrentModel(modelId) {
  store.set('selected-model', modelId);
}

/**
 * Load user settings
 * @returns {Object} The user settings
 */
function loadSettings() {
  const settings = store.get('settings') || {};
  // Set default hotkeys if not set
  if (!settings.hotkey) {
    settings.hotkey = 'CommandOrControl+Shift+C';
    store.set('settings', settings);
  }
  if (!settings.translationHotkey) {
    settings.translationHotkey = 'CommandOrControl+Shift+T';
    store.set('settings', settings);
  }
  console.log('Loaded settings:', JSON.stringify(settings));
  return settings;
}

/**
 * Save user settings
 * @param {Object} settings - The settings to save
 */
function saveSettings(settings) {
  store.set('settings', settings);
  console.log('Saved settings:', JSON.stringify(settings));
}

/**
 * Get valid hotkey modifiers and keys
 * @returns {Object} Object with modifiers and keys arrays
 */
function getValidHotkeys() {
  return {
    modifiers: ['CommandOrControl', 'Alt', 'Shift', 'Super'],
    keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
  };
}

module.exports = {
  getApiKey,
  setApiKey,
  getCurrentModel, 
  setCurrentModel,
  loadSettings,
  saveSettings,
  getValidHotkeys,
  store
}; 