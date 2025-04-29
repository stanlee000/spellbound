document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.local.get([
    'apiKey',
    'customModels',
    'selectedModel',
    'temperature',
    'disableFloatingMenu',
    'defaultTranslationLanguage'
  ], function(data) {
    if (data.apiKey) {
      document.getElementById('api-key').value = data.apiKey;
    }
    
    if (data.customModels) {
      document.getElementById('custom-models').value = data.customModels;
    }
    
    if (data.selectedModel) {
      document.getElementById('model-select').value = data.selectedModel;
    }
    
    if (data.temperature) {
      document.getElementById('temperature').value = data.temperature;
      document.getElementById('temperature-value').textContent = data.temperature;
    }
    
    if (data.disableFloatingMenu !== undefined) {
      document.getElementById('disable-floating-menu').checked = data.disableFloatingMenu;
    }
    
    if (data.defaultTranslationLanguage) {
      document.getElementById('default-language').value = data.defaultTranslationLanguage;
    }
    
    // Update custom models in the dropdown
    updateCustomModelsInDropdown();
  });
  
  // Save settings when form is submitted
  document.getElementById('settings-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const apiKey = document.getElementById('api-key').value;
    const customModels = document.getElementById('custom-models').value;
    const selectedModel = document.getElementById('model-select').value;
    const temperature = document.getElementById('temperature').value;
    const disableFloatingMenu = document.getElementById('disable-floating-menu').checked;
    const defaultTranslationLanguage = document.getElementById('default-language').value;
    
    chrome.storage.local.set({
      apiKey: apiKey,
      customModels: customModels,
      selectedModel: selectedModel,
      temperature: temperature,
      disableFloatingMenu: disableFloatingMenu,
      defaultTranslationLanguage: defaultTranslationLanguage
    }, function() {
      // Update status to let user know settings were saved
      const status = document.getElementById('status');
      status.textContent = 'Settings saved.';
      status.style.display = 'block';
      
      setTimeout(function() {
        status.textContent = '';
        status.style.display = 'none';
      }, 2000);
      
      // Update custom models in dropdown
      updateCustomModelsInDropdown();
    });
  });
  
  // Update temperature value display when slider is moved
  document.getElementById('temperature').addEventListener('input', function() {
    document.getElementById('temperature-value').textContent = this.value;
  });
  
  // Function to update custom models in the dropdown
  function updateCustomModelsInDropdown() {
    const customModelsText = document.getElementById('custom-models').value;
    const modelSelect = document.getElementById('model-select');
    
    // Clear existing custom options
    Array.from(modelSelect.options).forEach(option => {
      if (option.dataset.custom === 'true') {
        modelSelect.removeChild(option);
      }
    });
    
    // Add new custom options
    if (customModelsText.trim()) {
      const customModels = customModelsText.split('\n').filter(line => line.trim());
      
      customModels.forEach(model => {
        const modelParts = model.split(',').map(part => part.trim());
        if (modelParts.length >= 2) {
          const option = document.createElement('option');
          option.value = modelParts[1];
          option.textContent = modelParts[0];
          option.dataset.custom = 'true';
          modelSelect.appendChild(option);
        }
      });
    }
  }
}); 