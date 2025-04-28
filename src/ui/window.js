const { BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

/**
 * Create the main application window
 * @returns {BrowserWindow} The created window
 */
function createWindow() {
  try {
    console.log('Creating main window...');
    mainWindow = new BrowserWindow({
      width: 800,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      icon: path.join(__dirname, '../assets/icon_256.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      },
      frame: false,
      transparent: true,
      backgroundColor: '#00FFFFFF'
    });

    // Load the app
    mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
      console.log('DevTools opened in development mode');
    }

    // Add error handler for window creation
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('crashed', (event) => {
      console.error('Window crashed:', event);
    });

    console.log('Main window created successfully');
    return mainWindow;
  } catch (error) {
    console.error('Error creating window:', error);
    throw error;
  }
}

/**
 * Check if window is available
 * @returns {boolean} Whether window exists and is not destroyed
 */
function isWindowAvailable() {
  return mainWindow && !mainWindow.isDestroyed();
}

/**
 * Show the window at the specified position
 * @param {Object} position - Position coordinates
 */
function showWindowAtPosition(position) {
  if (!isWindowAvailable()) return;

  if (!mainWindow.isFocused()) {
    mainWindow.setPosition(position.x, position.y);
    mainWindow.show();
    mainWindow.focus();
  }
  
  mainWindow.setPosition(position.x, position.y);
  showWindow();
}

/**
 * Show the window
 */
function showWindow() {
  if (!isWindowAvailable()) return;
  
  if (!mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * Hide/minimize the window
 */
function hideWindow() {
  if (!isWindowAvailable()) return;
  mainWindow.hide();
}

/**
 * Check if window is focused
 * @returns {boolean} Whether window is focused
 */
function isWindowFocused() {
  if (!isWindowAvailable()) return false;
  return mainWindow.isFocused();
}

/**
 * Get the main window
 * @returns {BrowserWindow} The main window
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * Set up window event handlers
 * @param {Object} params - Parameters for event handlers
 */
function setupWindowEvents({ onBlur, onActivate }) {
  if (!isWindowAvailable()) return;
  
  // Only hide window when it loses focus if we're not showing instructions
  mainWindow.on('blur', onBlur);
}

module.exports = {
  createWindow,
  showWindow,
  hideWindow,
  isWindowFocused,
  showWindowAtPosition,
  getMainWindow,
  setupWindowEvents,
  isWindowAvailable
}; 