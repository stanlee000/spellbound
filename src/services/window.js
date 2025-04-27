const { BrowserWindow, app, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { WINDOW_CONFIG } = require('../config/constants');

const store = new Store();
let mainWindow = null;

function createWindow() {
  try {
    console.log('Creating main window...');
    mainWindow = new BrowserWindow({
      ...WINDOW_CONFIG,
      icon: path.join(__dirname, 'assets/icon_256.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
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

    // Show window when clicking the dock icon (macOS)
    app.on('activate', () => {
      mainWindow.show();
    });

    // Only hide window when it loses focus if we're not showing instructions
    mainWindow.on('blur', () => {
      const settings = store.get('settings') || {};
      if (settings.hasSeenInstructions) {
        mainWindow.hide();
      }
    });

    // Add error handler for window creation
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('crashed', (event) => {
      console.error('Window crashed:', event);
    });

    console.log('Main window created successfully');
  } catch (error) {
    console.error('Error creating window:', error);
  }
}

function getMainWindow() {
  return mainWindow;
}

function showWindow() {
  if (mainWindow && !mainWindow.isVisible()) {
    // Position the window in the center of the primary display
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    mainWindow.setPosition(
      Math.floor(width / 2 - WINDOW_CONFIG.width / 2),
      Math.floor(height / 2 - WINDOW_CONFIG.height / 2)
    );
    
    mainWindow.show();
  }
}

function hideWindow() {
  if (mainWindow) {
    mainWindow.hide();
  }
}

function focusWindow() {
  if (mainWindow) {
    mainWindow.focus();
  }
}

function isWindowVisible() {
  return mainWindow && mainWindow.isVisible();
}

module.exports = {
  createWindow,
  getMainWindow,
  showWindow,
  hideWindow,
  focusWindow,
  isWindowVisible
}; 