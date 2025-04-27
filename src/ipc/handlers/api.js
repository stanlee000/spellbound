const Store = require('electron-store');
const openaiService = require('../../services/openai');

const store = new Store();

function setupApiHandlers(ipcMain) {
  // Handle API key updates
  ipcMain.handle('get-api-key', () => {
    return store.get('openai-api-key');
  });

  ipcMain.handle('set-api-key', async (event, apiKey) => {
    try {
      // Store the API key
      store.set('openai-api-key', apiKey);
      
      // Reinitialize OpenAI client
      if (!openaiService.initOpenAI()) {
        throw new Error('Failed to initialize OpenAI client');
      }
      
      // Test the API key by making a simple API call
      await openaiService.getClient().models.list();
      
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      // Clear the invalid API key
      store.delete('openai-api-key');
      openaiService.setClient(null);
      throw error;
    }
  });

  // Handle getting available models
  ipcMain.handle('get-available-models', async () => {
    try {
      if (!openaiService.getClient()) {
        throw new Error('OpenAI API key not set');
      }
      return await openaiService.getAvailableModels();
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  });

  // Handle model selection
  ipcMain.handle('set-model', (event, modelId) => {
    store.set('selected-model', modelId);
    return true;
  });

  ipcMain.handle('get-current-model', () => {
    return store.get('selected-model') || "gpt-4";
  });
}

module.exports = {
  setupApiHandlers
}; 