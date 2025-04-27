const { Tray, Menu, app } = require('electron');
const path = require('path');
const windowService = require('./window');

let tray = null;

function createTray() {
  tray = new Tray(path.join(__dirname, '..', 'assets/icon_16.png'));
  tray.setToolTip('Spellbound');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide',
      click: () => {
        const mainWindow = windowService.getMainWindow();
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => app.quit() 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

function getTray() {
  return tray;
}

module.exports = {
  createTray,
  getTray
}; 