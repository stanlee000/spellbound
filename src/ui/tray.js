const { Tray, Menu } = require('electron');
const path = require('path');
const windowManager = require('./window');

let tray = null;

/**
 * Create the application tray icon
 * @param {Function} quitApp - Function to quit the app
 * @returns {Tray} The created tray
 */
function createTray(quitApp) {
  tray = new Tray(path.join(__dirname, '../assets/icon_16.png'));
  tray.setToolTip('Spellbound');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide',
      click: () => {
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow.isVisible()) {
          windowManager.hideWindow();
        } else {
          windowManager.showWindow();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => quitApp() 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  return tray;
}

/**
 * Get the tray object
 * @returns {Tray} The tray object
 */
function getTray() {
  return tray;
}

module.exports = {
  createTray,
  getTray
}; 