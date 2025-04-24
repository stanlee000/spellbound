const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: async (channel, ...args) => {
      const validChannels = [
        'get-clipboard-text',
        'set-clipboard-text',
        'save-settings',
        'load-settings',
        'get-api-key',
        'set-api-key',
        'check-text',
        'apply-correction',
        'minimize-window',
        'show-window',
        'get-available-models',
        'set-model',
        'get-current-model',
        'enhance-text',
        'translate-text',
        'get-common-languages',
        'get-valid-hotkeys',
        'translate-with-language'
      ];
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, ...args);
      }
    },
    on: (channel, func) => {
      const validChannels = [
        'shortcut-triggered',
        'check-text-reply',
        'show-settings',
        'show-notification',
        'show-language-selector',
        'translate-text',
        'set-active-tab'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = [
        'shortcut-triggered',
        'check-text-reply',
        'show-settings',
        'show-notification',
        'show-language-selector',
        'translate-text',
        'set-active-tab'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
}); 