// Global variables
let activeTab = 'grammar';
let selectedPreset = null;
let originalText = '';
let selectedTargetLang = null;
let openaiApiKey = '';
let selectedModel = 'gpt-4o';
let defaultTranslationLanguage = '';
let showIndicatorIcon = false; // New setting global variable
let contextValues = {
  twitter: '',
  linkedin: '',
  instagram: '',
  hackernews: '',
  reddit: '',
  promptBuilder: '',
  academic: '',
  customTone: '',
  customContext: ''
};
let currentCorrections = []; // Store grammar corrections
let revertedCorrectionIds = new Set(); // Track reverted corrections
let grammarCache = {}; // Cache for grammar results { originalText: jsonResult }
let translationCache = {}; // Cache for translation results { "originalText_langCode": jsonResult }
let currentLanguageInfo = null; // Store detected language info

// Common languages for translation
const commonLanguages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' }
];

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
  checkApiKey();
  setupTabNavigation();
  setupSettingsDialog();
  setupPresetSelection();
  loadInitialText();
  
  // Load default translation language
  chrome.storage.local.get(['defaultTranslationLanguage'], (result) => {
    if (result.defaultTranslationLanguage) {
      defaultTranslationLanguage = result.defaultTranslationLanguage;
      console.log('Loaded default translation language:', defaultTranslationLanguage);
    }
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'setTabAndProcess' && message.tabType) {
      // Set active tab and process text
      const tab = document.querySelector(`.tab[data-tab="${message.tabType}"]`);
      if (tab) {
        tab.click();
      }
      sendResponse({ success: true });
    } else if (message.action === 'setActiveTab' && message.tabType) {
      // Just set the active tab without processing
      const tab = document.querySelector(`.tab[data-tab="${message.tabType}"]`);
      if (tab) {
        tab.click();
        activeTab = message.tabType;
      }
      sendResponse({ success: true });
    }
  });
});

// Check if API key exists
function checkApiKey() {
  chrome.runtime.sendMessage({ action: 'checkApiKey' }, (response) => {
    if (response && response.hasApiKey) {
      openaiApiKey = response.apiKey;
      
      // Load settings if available, default model to gpt-4o
      if (response.settings) {
        selectedModel = response.settings.selectedModel || 'gpt-4o';
        showIndicatorIcon = response.settings.showIndicatorIcon === true; // Explicitly check for true
      }
      
      document.getElementById('api-key-setup').classList.add('hidden');
      document.getElementById('main-content').classList.remove('hidden');
    } else {
      document.getElementById('api-key-setup').classList.remove('hidden');
      document.getElementById('main-content').classList.add('hidden');
      
      // Setup API key save button
      document.getElementById('saveApiKey').addEventListener('click', saveApiKey);
    }
  });
}

// Save API key
function saveApiKey() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showNotification('Please enter a valid API key', 'error');
    return;
  }
  
  chrome.runtime.sendMessage({ action: 'setApiKey', apiKey }, (response) => {
    if (response && response.success) {
      openaiApiKey = apiKey;
      document.getElementById('api-key-setup').classList.add('hidden');
      document.getElementById('main-content').classList.remove('hidden');
    } else {
      showNotification('Failed to save API key', 'error');
    }
  });
}

// Setup tab navigation
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding tab panel
      const tabId = tab.getAttribute('data-tab');
      activeTab = tabId;
      
      tabPanels.forEach(panel => {
        panel.classList.add('hidden');
      });
      
      document.getElementById(`${tabId}-tab`).classList.remove('hidden');
      
      // Process text immediately when changing tabs if we have original text
      if (originalText) {
        processActiveTab();
      }
    });
  });
  
  // Set the initial active tab
  document.querySelector(`.tab[data-tab="${activeTab}"]`).classList.add('active');
  document.getElementById(`${activeTab}-tab`).classList.remove('hidden');
}

// Function to fetch available GPT-4 models from OpenAI
async function fetchAvailableModels() {
  if (!openaiApiKey) {
    console.warn('Cannot fetch models without API key.');
    return null;
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    // Filter for models containing 'gpt-4' and sort them (optional)
    const gpt4Models = data.data
      .filter(model => model.id.includes('gpt-4'))
      .sort((a, b) => a.id.localeCompare(b.id)); // Sort alphabetically
      
    console.log('Fetched GPT-4 models:', gpt4Models);
    return gpt4Models;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    showNotification('Could not fetch models from OpenAI. Using defaults.', 'error');
    return null; // Return null on error
  }
}

// Populate model selector dropdown
function populateModelSelector(models) {
  const modelSelector = document.getElementById('modelSelector');
  if (!modelSelector) return;
  
  // Clear existing options except maybe a placeholder
  modelSelector.innerHTML = '<option value="" disabled>Select a model...</option>'; 

  // Default list in case fetching fails or returns nothing
  const defaultModels = [
    { id: 'gpt-4o', name: 'GPT-4o (Default)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    // Add other common fallbacks if needed
  ];

  const modelsToUse = models && models.length > 0 ? models : defaultModels;

  modelsToUse.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    // Use provided name or format the ID if name isn't available
    option.textContent = model.name || model.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); 
    modelSelector.appendChild(option);
  });
  
  // Set the current selection
  modelSelector.value = selectedModel;
  // Ensure the default 'gpt-4o' is selected if the saved model isn't in the list
  if (!modelSelector.value && modelsToUse.some(m => m.id === 'gpt-4o')) {
      modelSelector.value = 'gpt-4o';
      selectedModel = 'gpt-4o'; // Update the global variable too
  }
}

// Function to load settings from storage
function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings', 'apiKey', 'defaultTranslationLanguage'], (result) => {
      if (result.settings) {
        selectedModel = result.settings.selectedModel || 'gpt-4o';
        showIndicatorIcon = result.settings.showIndicatorIcon === true; // Explicitly check for true
        // Add any other settings loading here
      } else {
        // Default values if settings object is missing
        selectedModel = 'gpt-4o';
        showIndicatorIcon = false;
      }
      if (result.apiKey) {
        openaiApiKey = result.apiKey;
      }
      if (result.defaultTranslationLanguage) {
          defaultTranslationLanguage = result.defaultTranslationLanguage;
      }
      
      console.log('Loaded Settings:', { selectedModel, showIndicatorIcon, defaultTranslationLanguage });
      resolve();
    });
  });
}

// Function to save settings to storage
function saveSettings() {
  const apiKeyToSave = document.getElementById('apiKeySettings').value.trim();
  const selectedModelToSave = document.getElementById('modelSelector').value;
  const defaultLangToSave = document.getElementById('defaultLanguageSelector').value;
  const showIndicatorIconToSave = document.getElementById('indicatorIconToggle').checked;

  const settingsToSave = {
    selectedModel: selectedModelToSave,
    showIndicatorIcon: showIndicatorIconToSave
    // Add any other settings here
  };
  
  // Save API Key separately if it has changed
  if (apiKeyToSave !== openaiApiKey) {
      chrome.runtime.sendMessage({ action: 'setApiKey', apiKey: apiKeyToSave }, (response) => {
        if (response && response.success) {
          openaiApiKey = apiKeyToSave; // Update global on successful save
          console.log('API Key updated and saved.');
        } else {
           showNotification('Failed to save API key update', 'error');
        }
      });
  }
  
  // Save other settings and default language
  const storageUpdate = {
      settings: settingsToSave,
      defaultTranslationLanguage: defaultLangToSave
  };

  chrome.storage.local.set(storageUpdate, () => {
     if (chrome.runtime.lastError) {
         console.error('Error saving settings:', chrome.runtime.lastError);
         showNotification('Error saving settings', 'error');
     } else {
         console.log('Settings saved:', storageUpdate);
         // Update global variables immediately
         selectedModel = selectedModelToSave;
         showIndicatorIcon = showIndicatorIconToSave;
         defaultTranslationLanguage = defaultLangToSave;
         showNotification('Settings saved successfully', 'success');
         closeSettingsDialog();
         
         // Inform content script about the setting change
         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
           if (tabs[0] && tabs[0].id) {
             chrome.tabs.sendMessage(tabs[0].id, { action: 'updateIndicatorSettings', enabled: showIndicatorIconToSave });
           }
         });
     }
  });
}

// Close settings dialog
function closeSettingsDialog() {
    document.getElementById('settings-dialog').classList.add('hidden');
}

// Setup settings dialog
async function setupSettingsDialog() { // Made async
  const settingsButton = document.getElementById('settingsButton');
  const settingsDialog = document.getElementById('settings-dialog');
  // Get specific buttons for save/cancel
  const saveButton = document.getElementById('saveSettingsButton'); 
  const cancelButton = document.getElementById('cancelSettingsButton');
  const closeIcon = settingsDialog.querySelector('.dialog-header .close-dialog'); // Get the close icon

  const modelSelector = document.getElementById('modelSelector');
  const defaultLangSelector = document.getElementById('defaultLanguageSelector');
  const indicatorToggle = document.getElementById('indicatorIconToggle');
  
  // Load current settings when dialog opens
  settingsButton.addEventListener('click', async () => {
    await loadSettings(); // Ensure settings are loaded before populating
    
    document.getElementById('apiKeySettings').value = openaiApiKey;
    defaultLangSelector.value = defaultTranslationLanguage;
    indicatorToggle.checked = showIndicatorIcon;
    
    modelSelector.innerHTML = '<option value="" disabled selected>Loading models...</option>';
    settingsDialog.classList.remove('hidden'); // Show dialog first
    
    try {
      const availableModels = await fetchAvailableModels();
      populateModelSelector(availableModels);
    } catch (error) {
      console.error("Error fetching/populating models:", error);
      populateModelSelector(null); // Populate with defaults on error
    }
  });

  // Event listeners for buttons
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }
  if (cancelButton) {
    cancelButton.addEventListener('click', closeSettingsDialog);
  }
  if (closeIcon) {
    closeIcon.addEventListener('click', closeSettingsDialog);
  }
}

// Setup preset selection and apply buttons
function setupPresetSelection() {
  const presetCards = document.querySelectorAll('.preset-card');
  const contextInputs = document.querySelectorAll('.context-input');
  const applyButtons = document.querySelectorAll('.preset-apply-button');

  // Handle apply button clicks
  applyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const card = button.closest('.preset-card');
      if (card) {
        const preset = card.getAttribute('data-preset');
        selectedPreset = preset; 
        console.log('Apply button clicked for preset:', selectedPreset);
        if (originalText) {
          enhanceText(); 
        } else {
          showNotification('No text found to enhance.', 'info');
        }
      }
    });
  });

  // Handle context inputs (value storage and Shift+Enter trigger)
  contextInputs.forEach(input => {
    // Store value on input change
    input.addEventListener('input', () => {
      const contextType = input.getAttribute('data-context');
      if (contextValues.hasOwnProperty(contextType)) {
         contextValues[contextType] = input.value;
      } else {
          console.warn('Input has unknown data-context:', contextType);
      }
    });
    
    // Add Shift+Enter listener
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault(); // Prevent potential newline or other default actions
            const card = input.closest('.preset-card');
            if (card) {
                const applyButton = card.querySelector('.preset-apply-button');
                if (applyButton) {
                    console.log('Shift+Enter detected in context field, triggering apply button.');
                    applyButton.click(); // Simulate click on the button
                }
            }
        }
    });
  });
}

// Load initial text from selection
function loadInitialText() {
  chrome.storage.local.get(['selectedText', 'activeTab'], (result) => {
    const guidanceBox = document.getElementById('no-text-info');
    
    if (result.selectedText) {
      originalText = result.selectedText;
      guidanceBox?.classList.add('hidden'); // Hide guidance if text exists
      
      // Set active tab based on context menu selection
      if (result.activeTab) {
        const tab = document.querySelector(`.tab[data-tab="${result.activeTab}"]`);
        if (tab) {
          tab.click();
        }
      }
      
      // Process the text immediately after loading
      setTimeout(() => {
        processActiveTab();
      }, 100);
    } else {
      // No text selected, show guidance only if on grammar tab initially
      originalText = ''; 
      if (activeTab === 'grammar') {
          guidanceBox?.classList.remove('hidden'); 
      }
    }
  });
}

// Process text based on the active tab
function processActiveTab() {
  const guidanceBox = document.getElementById('no-text-info');
  
  // Always hide guidance box when processing text
  guidanceBox?.classList.add('hidden');
  
  if (!originalText) {
      // If called without text (e.g., tab switch before load), show guidance on grammar tab
      if (activeTab === 'grammar') {
          guidanceBox?.classList.remove('hidden');
      }
      return; 
  }
  
  switch (activeTab) {
    case 'grammar':
      checkGrammar();
      break;
    case 'enhance':
      // Enhance only triggers on button click now
      // Maybe select the first preset visually if none is selected?
      if (!selectedPreset) {
        const firstPresetCard = document.querySelector('.preset-card');
        if (firstPresetCard) {
            // Don't add 'selected' class automatically, wait for user click
            // firstPresetCard.classList.add('selected'); 
            // selectedPreset = firstPresetCard.getAttribute('data-preset');
        }
      } 
      // Clear previous enhance result if text changed?
      // document.getElementById('enhance-result').classList.add('hidden');
      break;
    case 'translate':
      console.log('Activating translate tab, populating chips...');
      populateLanguageChips();
      // DO NOT automatically translate here. 
      // populateLanguageChips handles clicking the default chip if set.
      // Translation only happens when a chip is clicked (manually or automatically by default setting).
      break;
  }
}

// API calls to OpenAI
async function callOpenAI(userPrompt, model = null, systemPrompt = null, expectJson = false) {
  // Use the selected model or the provided one
  const modelToUse = model || selectedModel;
  
  // Construct messages array
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  } else {
    // Default system prompt if none provided
    messages.push({ role: 'system', content: 'You are a helpful assistant.' }); // Simpler default
  }
  messages.push({ role: 'user', content: userPrompt });

  // Construct payload
  const payload = {
      model: modelToUse,
      messages: messages,
      temperature: 0.7 // Adjust temperature per function if needed later
  };

  // Add response_format if JSON is expected
  if (expectJson) {
      payload.response_format = { type: "json_object" };
      // Lower temperature might help consistency for JSON
      payload.temperature = 0.3; 
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(payload) // Use the constructed payload
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to get error details
      console.error('OpenAI API Error Data:', errorData);
      throw new Error(
        errorData.error?.message || 
        `OpenAI API responded with status ${response.status}`
      );
    }
    
    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    showNotification('Error calling OpenAI: ' + error.message, 'error');
    return null;
  }
}

// Try to parse JSON with error handling
function safeJsonParse(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    console.error('Invalid input to safeJsonParse:', jsonString);
    return createFallbackResponse('Invalid JSON input');
  }
  
  try {
    // Attempt 1: Direct parsing
    return JSON.parse(jsonString);
  } catch (e1) {
    console.warn('Direct JSON parsing failed:', e1.message);
    
    // Attempt 2: Remove markdown code fences (```json ... ``` or ``` ... ```)
    const cleanedString = jsonString.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    
    try {
      return JSON.parse(cleanedString);
    } catch (e2) {
      console.warn('Parsing after removing fences failed:', e2.message);
      
      // Attempt 3: Find first { and last }
      const firstBrace = cleanedString.indexOf('{');
      const lastBrace = cleanedString.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonCandidate = cleanedString.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch (e3) {
          console.error('Parsing substring failed:', e3.message);
        }
      }
    }
    
    // If all attempts fail, return a fallback
    console.error('All JSON parsing attempts failed for string:', jsonString);
    return createFallbackResponse(jsonString); // Pass original string for context
  }
}

// Create fallback JSON for failed parsing
function createFallbackResponse(text) {
  if (activeTab === 'grammar') {
    return {
      languageInfo: null, // Add null languageInfo
      correctedText: text,
      corrections: [],
      languageSpecific: []
    };
  } else if (activeTab === 'translate') {
    return {
      translation: text,
      notes: "Error parsing the AI response. This is the raw text returned."
    };
  }
  return null;
}

// Function to display detected language
function displayLanguageInfo(langInfo) {
  const langInfoBox = document.getElementById('detected-language-info');
  const langNameElement = document.getElementById('detected-language-name');
  if (langInfoBox && langNameElement && langInfo && langInfo.name) {
    langNameElement.textContent = langInfo.name;
    langInfoBox.classList.remove('hidden');
    currentLanguageInfo = langInfo; // Store globally for potential later use
  } else if (langInfoBox) {
    langInfoBox.classList.add('hidden'); // Hide if no info
    currentLanguageInfo = null;
  }
}

// Check grammar
async function checkGrammar() {
  if (!originalText || !openaiApiKey) return;
  
  const loadingElement = document.querySelector('#grammar-result .loading');
  const resultTextElement = document.querySelector('#grammar-result .result-text');
  
  // Reset correction state
  currentCorrections = [];
  revertedCorrectionIds.clear();
  // Hide language info initially
  displayLanguageInfo(null); 
  
  // --- Caching Logic --- 
  if (grammarCache[originalText]) {
    console.log('Using cached grammar result for:', originalText.substring(0, 30) + '...');
    const jsonResult = grammarCache[originalText];
    try {
        // Display language info from cache
        displayLanguageInfo(jsonResult.languageInfo); 
        
        currentCorrections = (jsonResult.corrections && Array.isArray(jsonResult.corrections)) ? jsonResult.corrections : [];
        const highlightedText = highlightCorrections(jsonResult.correctedText, currentCorrections);
        resultTextElement.innerHTML = highlightedText;
        setupCorrectionHandlers();
        
        // Display language specific suggestions from cache
        if (jsonResult.languageSpecific && jsonResult.languageSpecific.length > 0) {
           const languageSpecificElement = document.getElementById('language-specific');
           const listElement = document.getElementById('language-specific-list');
           listElement.innerHTML = '';
           jsonResult.languageSpecific.forEach(suggestion => {
             const li = document.createElement('li');
             li.innerHTML = `<span class="material-icons">info</span>${escapeHtml(suggestion)}`; 
             listElement.appendChild(li);
           });
           languageSpecificElement.classList.remove('hidden');
        } else {
             document.getElementById('language-specific').classList.add('hidden');
        }
        setupGrammarCopyHandler(jsonResult.correctedText);
        document.getElementById('grammar-result').classList.remove('hidden');
        loadingElement.classList.add('hidden'); // Ensure loading is hidden
    } catch (error) {
      console.error('Error processing cached grammar result:', error);
      resultTextElement.textContent = 'Error displaying cached result.';
    } finally {
       document.getElementById('grammar-result').classList.remove('hidden'); // Ensure result container is visible even on error
       loadingElement.classList.add('hidden');
    }
    return; // Exit function after using cache
  }
  // --- End Caching Logic ---
  
  console.log('No cache hit, fetching grammar result...');
  // Show loading indicator
  loadingElement.classList.remove('hidden');
  document.getElementById('grammar-result').classList.remove('hidden');
  resultTextElement.innerHTML = ''; // Clear previous result
  document.getElementById('language-specific').classList.add('hidden'); // Hide language specific section
  
  // Create prompt for grammar check - Aligned with openai.js structure + correctedText + languageInfo
  const systemPrompt = `
    You are a professional proofreader.
    First, detect the language of the provided text.
    Then, identify spelling, grammar, and style issues based on that language. Also take into account the context of the text and tone.
    Return a JSON object with the following structure:
    {
      "languageInfo": { "code": "ISO code", "name": "English Name", "native": "Native Name" },
      "correctedText": "The full corrected text, incorporating all suggestions",
      "corrections": [
        { "original": "incorrect segment", "corrected": "suggested correction", "explanation": "brief explanation" }
      ],
      "languageSpecific": ["any language-specific improvement suggestions related to the detected language"]
    }
    If no corrections are needed, return the original text in correctedText and empty arrays for corrections and languageSpecific, but still include the languageInfo.
    IMPORTANT: Return ONLY the raw JSON without any markdown formatting, code blocks, or additional text.
  `;
  const userPrompt = originalText;
  
  // Pass expectJson = true
  const result = await callOpenAI(userPrompt, null, systemPrompt, true); 
  
  // Hide loading indicator
  loadingElement.classList.add('hidden');
  
  if (result) {
    try {
      const jsonResult = safeJsonParse(result);
      
      // Check for essential fields (correctedText is primary)
      if (!jsonResult || typeof jsonResult.correctedText === 'undefined') { 
        console.error('Invalid grammar check result structure:', jsonResult);
        resultTextElement.textContent = 'Error processing grammar check result.';
        return;
      }
      
      // Store successful result in cache
      grammarCache[originalText] = jsonResult;
      console.log('Cached new grammar result.');

      // Display language info
      displayLanguageInfo(jsonResult.languageInfo);

      // Process new result
      currentCorrections = (jsonResult.corrections && Array.isArray(jsonResult.corrections)) ? jsonResult.corrections : [];
      const highlightedText = highlightCorrections(jsonResult.correctedText, currentCorrections);
      resultTextElement.innerHTML = highlightedText;
      setupCorrectionHandlers(); 
      
      // Display language specific suggestions
      if (jsonResult.languageSpecific && jsonResult.languageSpecific.length > 0) {
        const languageSpecificElement = document.getElementById('language-specific');
        const listElement = document.getElementById('language-specific-list');
        listElement.innerHTML = '';
        jsonResult.languageSpecific.forEach(suggestion => {
          const li = document.createElement('li');
           li.innerHTML = `<span class="material-icons">info</span>${escapeHtml(suggestion)}`; 
           listElement.appendChild(li);
        });
        languageSpecificElement.classList.remove('hidden');
      } else {
         document.getElementById('language-specific').classList.add('hidden');
      }
      setupGrammarCopyHandler(jsonResult.correctedText);

    } catch (error) {
      console.error('Error processing new grammar result:', error);
      resultTextElement.textContent = 'Error processing grammar check result.';
    } finally {
      // Ensure result container is visible even on error, loading hidden
      document.getElementById('grammar-result').classList.remove('hidden');
      loadingElement.classList.add('hidden');
    }
  } else {
    resultTextElement.textContent = 'Failed to check grammar. Please try again.';
    document.getElementById('grammar-result').classList.remove('hidden'); // Show container with error
    loadingElement.classList.add('hidden');
  }
}

// Highlight corrections in text
function highlightCorrections(text, corrections) {
  if (!text || !corrections || !Array.isArray(corrections) || corrections.length === 0) {
    return escapeHtml(text || '');
  }
  
  let highlightedText = escapeHtml(text);
  
  // Apply corrections cumulatively, using placeholders to avoid index shifts
  const placeholders = [];
  corrections.forEach((correction, index) => {
    const original = correction.original || '';
    const corrected = correction.corrected || '';
    const explanation = correction.explanation || '';
    
    // Skip if corrected text is empty or same as original
    if (!corrected || original === corrected) return;
    
    const placeholder = `__CORRECTION_${index}__`;
    placeholders.push({ placeholder, index, original, corrected, explanation });
    
    // Be careful with replacement if corrected text might appear elsewhere
    // This simple replace might fail on complex overlaps. A more robust solution
    // might involve diffing or index-based replacement.
    try {
        // Try replacing the corrected text segment with the placeholder
        highlightedText = highlightedText.replace(escapeHtml(corrected), placeholder);
    } catch(e) {
        console.error(`Error replacing text for correction ${index}:`, corrected, e);
    }
  });

  // Now replace placeholders with interactive spans
  placeholders.forEach(p => {
    const correctionSpan = 
      `<span class="correction" 
             data-correction-id="${p.index}" 
             data-original="${escapeHtml(p.original)}" 
             data-explanation="${escapeHtml(p.explanation)}"
             title="Click to revert to: ${escapeHtml(p.original)}"
       >${escapeHtml(p.corrected)}</span>`;
    highlightedText = highlightedText.replace(p.placeholder, correctionSpan);
  });

  return highlightedText;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Setup click handlers for corrections
let grammarResultClickListener = null; // Keep track of click listener
let grammarResultMouseOverListener = null; // Keep track of mouseover listener
let grammarResultMouseOutListener = null; // Keep track of mouseout listener

function setupCorrectionHandlers() {
  const resultTextElement = document.querySelector('#grammar-result .result-text');
  if (!resultTextElement) return;

  // --- Click Listener (Toggle Reversion) --- 
  // Remove previous click listener if it exists
  if (grammarResultClickListener) {
    resultTextElement.removeEventListener('click', grammarResultClickListener);
  }
  // Define the new click listener
  grammarResultClickListener = (event) => {
    const target = event.target;
    const correctionSpan = target.closest('.correction');

    if (correctionSpan) {
      event.stopPropagation(); // Prevent the copy-all listener
      
      const correctionId = parseInt(correctionSpan.getAttribute('data-correction-id'));
      const originalText = correctionSpan.getAttribute('data-original');
      const correctedText = currentCorrections[correctionId]?.corrected || correctionSpan.textContent; // Get full corrected text

      // Toggle reverted state
      if (revertedCorrectionIds.has(correctionId)) {
        // Re-apply correction
        revertedCorrectionIds.delete(correctionId);
        correctionSpan.classList.remove('reverted');
        correctionSpan.textContent = correctedText; // Restore corrected text
        correctionSpan.setAttribute('title', `Click to revert to: ${originalText}`);
      } else {
        // Revert correction
        revertedCorrectionIds.add(correctionId);
        correctionSpan.classList.add('reverted');
        correctionSpan.textContent = originalText; // Show original text
        correctionSpan.setAttribute('title', `Click to apply: ${correctedText}`);
      }
    }
  };
  // Attach the new click listener
  resultTextElement.addEventListener('click', grammarResultClickListener);

  // --- MouseOver Listener (Show Explanation) ---
  if (grammarResultMouseOverListener) {
    resultTextElement.removeEventListener('mouseover', grammarResultMouseOverListener);
  }
  grammarResultMouseOverListener = (event) => {
    const target = event.target;
    const correctionSpan = target.closest('.correction');
    if (correctionSpan) {
      const explanation = correctionSpan.getAttribute('data-explanation');
      const originalText = correctionSpan.getAttribute('data-original');
      const message = explanation 
                      ? `${explanation}\n(Original: \"${originalText}\")` 
                      : `Original: \"${originalText}\"`;
      // Show notification with duration 0 AND pass the event for positioning
      showNotification(message, 'info', 0, event); 
    }
  };
  resultTextElement.addEventListener('mouseover', grammarResultMouseOverListener);

  // --- MouseOut Listener (Hide Explanation) ---
  if (grammarResultMouseOutListener) {
    resultTextElement.removeEventListener('mouseout', grammarResultMouseOutListener);
  }
  grammarResultMouseOutListener = (event) => {
    const target = event.target;
    // Check if the mouse is leaving a correction span specifically
    if (target.classList.contains('correction')) { 
        const notificationElement = document.getElementById('notification');
        if (notificationElement && notificationElement.classList.contains('show')) {
          // Immediately remove the 'show' class to hide it
          notificationElement.classList.remove('show');
          // Clear any potential lingering timeout (though duration=0 should prevent this)
          const existingTimeoutId = notificationElement.dataset.timeoutId;
          if (existingTimeoutId) {
            clearTimeout(parseInt(existingTimeoutId));
            notificationElement.removeAttribute('data-timeout-id');
          }
        }
      }
  };
  resultTextElement.addEventListener('mouseout', grammarResultMouseOutListener);
}

// Setup handler for copying grammar result
let grammarCopyListener = null; // Keep track of listener

function setupGrammarCopyHandler(originalCorrectedText) {
    const resultContainer = document.getElementById('grammar-result');
    if (!resultContainer) return;

    // Remove previous listener
    if (grammarCopyListener) {
        resultContainer.removeEventListener('click', grammarCopyListener);
    }

    // Define new listener
    grammarCopyListener = (event) => {
        // Only trigger copy if the click is NOT on a specific correction span
        if (!event.target.closest('.correction')) {
            let textToCopy = originalCorrectedText;
            
            // Apply reversions based on the revertedCorrectionIds set
            // Iterate through corrections in reverse order of ID (index) to avoid index issues during replacement
            const sortedRevertedIds = Array.from(revertedCorrectionIds).sort((a, b) => b - a);
            
            sortedRevertedIds.forEach(id => {
                if (id >= 0 && id < currentCorrections.length) {
                    const correction = currentCorrections[id];
                    const correctedSegment = correction.corrected || '';
                    const originalSegment = correction.original || '';
                    if (correctedSegment) {
                        // Basic replacement - might be fragile if corrected text appears multiple times
                        textToCopy = textToCopy.replace(correctedSegment, originalSegment);
                    } else {
                        console.warn(`Correction ID ${id} has empty corrected text.`);
                    }
                } else {
                    console.warn(`Invalid correction ID found in reverted set: ${id}`);
                }
            });
            
            copyToClipboard(textToCopy);
            showNotification('Copied adjusted text to clipboard!', 'success');
        }
    };

    // Attach new listener
    resultContainer.addEventListener('click', grammarCopyListener);
}

// Enhance text based on selected preset
async function enhanceText() {
  if (!originalText || !openaiApiKey) {
    showNotification('Original text or API key missing.', 'error');
    return;
  }
  if (!selectedPreset) {
      showNotification('Please select a preset first.', 'info');
      return;
  }
  
  console.log(`Enhancing text for preset: ${selectedPreset} with context:`, contextValues);
  
  const loadingElement = document.querySelector('#enhance-result .loading');
  const resultTextElement = document.querySelector('#enhance-result .result-text');
  const resultContainer = document.getElementById('enhance-result');
  
  // Show loading indicator and the container
  loadingElement.classList.remove('hidden');
  resultContainer.classList.remove('hidden');
  resultTextElement.innerHTML = ''; // Clear previous result

  // Optionally scroll the container into view when loading starts
  // resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Determine tone and context based on preset (as before)
  let context = '';
  let toneInstruction = ''; // Store the specific rewrite instruction
  
  switch (selectedPreset) {
    case 'twitter':
      context = contextValues.twitter || '';
      toneInstruction = `Rewrite this text as an engaging X (Twitter) post. Make it concise, impactful. You can divide the text into multiple posts if need to engage the audience (each post should be 280 characters or less). ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'linkedin':
      context = contextValues.linkedin || '';
      toneInstruction = `Rewrite this text as a professional LinkedIn post. Focus on business value, insights, and professional tone. Add relevant hashtags. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'instagram':
      context = contextValues.instagram || '';
       toneInstruction = `Rewrite this text as an engaging Instagram post. Make it relatable, authentic, and add relevant hashtags. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'hackernews':
       context = contextValues.hackernews || '';
       toneInstruction = `Rewrite this text in a style suitable for Hacker News. Focus on technical accuracy, intellectual depth, and objective analysis. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'reddit':
      context = contextValues.reddit || '';
       toneInstruction = `Rewrite this text as a Reddit post. Make it informative yet conversational, with good formatting. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'promptBuilder':
      context = contextValues.promptBuilder || '';
      toneInstruction = `Transform this text into a well-structured LLM prompt following best practices:
        1. Be specific and clear about the desired outcome
        2. Break down complex tasks into steps
        3. Include relevant context and constraints
        4. Specify the format of the expected response
        5. Use examples if helpful
        ${context ? `Additional context to consider: ${context}.` : ''}`;
      break;
    case 'academic':
      context = contextValues.academic || '';
      toneInstruction = `Rewrite this text in a formal, scholarly, and well-structured tone with appropriate terminology. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    case 'custom':
      context = contextValues.customContext || '';
      toneInstruction = `Rewrite this text with the following tone: ${contextValues.customTone || 'clear and well-written'}. ${context ? `Additional context: ${context}.` : ''}`;
      break;
    default:
      console.error('Unknown selected preset:', selectedPreset);
      showNotification('Unknown preset selected.', 'error');
      loadingElement.classList.add('hidden');
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // Ensure scroll on error
      return;
  }
  
  // Create prompt for text enhancement - Aligned with openai.js structure
  const systemPrompt = `
    You are an expert content writer who specializes in adapting text for different platforms while maintaining the core message.
    ${toneInstruction}
    Return ONLY the enhanced text without any additional formatting, markdown, code blocks, or additional notes.
  `;
  const userPrompt = originalText;
  
  // Do NOT pass expectJson = true
  const rawResult = await callOpenAI(userPrompt, null, systemPrompt); 
  
  // Hide loading indicator
  loadingElement.classList.add('hidden');
  
  if (rawResult) {
    let finalText = rawResult.trim();
    
    // Since the prompt asks for plain text, just use the raw result directly after trimming.
    // We assume the AI followed the instruction to NOT return JSON.
    finalText = rawResult.trim();

    resultTextElement.textContent = finalText;
    
    // Setup copy handler
    const copyHandler = () => {
        copyToClipboard(finalText);
        showNotification('Copied to clipboard!', 'success');
    };
    // Remove previous listener before adding new one
    resultContainer.replaceWith(resultContainer.cloneNode(true)); // Clone node to remove listeners
    document.getElementById('enhance-result').addEventListener('click', copyHandler);

    // Scroll the result container into view after displaying the text
    document.getElementById('enhance-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } else {
    resultTextElement.textContent = 'Failed to enhance text. Please try again.';
    // Also scroll into view if there was an error
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Populate language chips for translation
function populateLanguageChips() {
  const languageChipsElement = document.querySelector('.language-chips');
  
  // Clear existing chips
  languageChipsElement.innerHTML = '';
  
  // Track if we've already selected a language in this session
  let hasSelectedLanguage = false;
  
  // Add chips for each language
  commonLanguages.forEach(language => {
    const chip = document.createElement('div');
    chip.className = 'language-chip';
    chip.textContent = `${language.name} (${language.native})`;
    chip.setAttribute('data-language-code', language.code);
    
    chip.addEventListener('click', () => {
      // Remove selected class from all chips
      document.querySelectorAll('.language-chip').forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked chip
      chip.classList.add('selected');
      
      // Set selected target language
      selectedTargetLang = language;
      
      // Translate the text
      translateText(language);
    });
    
    languageChipsElement.appendChild(chip);
  });
  
  console.log('Looking for default language:', defaultTranslationLanguage);
  
  // Check if there's a default translation language set
  if (defaultTranslationLanguage && !hasSelectedLanguage) {
    console.log('Found default language:', defaultTranslationLanguage);
    // Find the language object that corresponds to the saved code
    const defaultLang = commonLanguages.find(lang => lang.code === defaultTranslationLanguage);
    if (defaultLang) {
      console.log('Found matching language object:', defaultLang);
      // Find and click the chip for this language
      setTimeout(() => {
        const defaultLangChip = document.querySelector(`.language-chip[data-language-code="${defaultTranslationLanguage}"]`);
        if (defaultLangChip) {
          console.log('Clicking default language chip');
          defaultLangChip.click();
          hasSelectedLanguage = true;
        }
      }, 100);
    }
  } else if (!hasSelectedLanguage) {
    // If no default is set, try loading from storage
    chrome.storage.local.get(['defaultTranslationLanguage'], (result) => {
      if (result.defaultTranslationLanguage && !hasSelectedLanguage) {
        defaultTranslationLanguage = result.defaultTranslationLanguage;
        console.log('Loaded default translation language from storage:', defaultTranslationLanguage);
        
        // Find and click the chip for this language
        setTimeout(() => {
          const defaultLangChip = document.querySelector(`.language-chip[data-language-code="${defaultTranslationLanguage}"]`);
          if (defaultLangChip) {
            console.log('Clicking default language chip from storage');
            defaultLangChip.click();
            hasSelectedLanguage = true;
          }
        }, 100);
      }
    });
  }
}

// Translate text to selected language
async function translateText(targetLanguage) {
  if (!originalText || !openaiApiKey || !targetLanguage) return;

  // Store the current target language to prevent automatic changes
  const currentTargetLang = targetLanguage;
  const cacheKey = `${originalText}_${currentTargetLang.code}`; // Unique key for text + language

  const loadingElement = document.querySelector('#translate-result .loading');
  const resultTextElement = document.querySelector('#translate-result .result-text');
  const resultContainer = document.getElementById('translate-result');
  const targetLanguageSpan = document.getElementById('target-language');

  // --- Caching Logic ---
  if (translationCache[cacheKey]) {
    console.log(`Using cached translation for language: ${currentTargetLang.code}`);
    const jsonResult = translationCache[cacheKey];
    try {
      targetLanguageSpan.textContent = currentTargetLang.name;
      resultTextElement.innerHTML = `
        <div>${escapeHtml(jsonResult.translation)}</div>
        ${jsonResult.notes ? `<div class="translation-notes"><span class="material-icons">info</span><strong>Translation Notes:</strong> ${escapeHtml(jsonResult.notes)}</div>` : ''}
      `;
      resultContainer.classList.remove('hidden');
      loadingElement.classList.add('hidden'); // Ensure loading is hidden

      // Setup copy handler for cached result
      const copyHandler = () => {
        copyToClipboard(jsonResult.translation);
        showNotification('Copied to clipboard!', 'success');
        resultContainer.removeEventListener('click', copyHandler); // Remove listener after copy
      };
      // Remove any previous listeners before adding a new one
      resultContainer.replaceWith(resultContainer.cloneNode(true)); // Simple way to remove all listeners
      document.getElementById('translate-result').addEventListener('click', copyHandler);


    } catch (error) {
       console.error('Error displaying cached translation:', error);
       resultTextElement.textContent = 'Error displaying cached translation.';
    }
    return; // Exit function after using cache
  }
  // --- End Caching Logic ---

  console.log(`No cache hit, fetching translation for language: ${currentTargetLang.code}`);
  // Show loading indicator
  targetLanguageSpan.textContent = currentTargetLang.name;
  loadingElement.classList.remove('hidden');
  resultContainer.classList.remove('hidden');
  resultTextElement.innerHTML = '';

  // Create prompt for translation - Aligned with openai.js structure
  const systemPrompt = `
    You are a professional translator. Translate the following text to ${currentTargetLang.name} (${currentTargetLang.native}).
    Before translating, proofread the text and improve wording if needed for the target language.
    Maintain the tone and style of the original text. Return a JSON object with:
    {
      "translation": "The translated text (without any markdown or special formatting)",
      "notes": "Any relevant notes about cultural context or idioms (optional)"
    }
    IMPORTANT: Return ONLY the raw JSON without any markdown formatting, code blocks, or additional text.
  `;
  const userPrompt = originalText;
  
  // Pass expectJson = true
  const result = await callOpenAI(userPrompt, null, systemPrompt, true);

  // Hide loading indicator
  loadingElement.classList.add('hidden');

  if (result) {
    try {
      const jsonResult = safeJsonParse(result);

      if (!jsonResult || typeof jsonResult.translation === 'undefined') { // Check for translation property
        resultTextElement.textContent = 'Error processing translation result.';
        return;
      }

      // Store successful result in cache
      translationCache[cacheKey] = jsonResult;
      console.log(`Cached new translation for language: ${currentTargetLang.code}`);

      // Display the translation
      resultTextElement.innerHTML = `
        <div>${escapeHtml(jsonResult.translation)}</div>
        ${jsonResult.notes ? `<div class="translation-notes"><span class="material-icons">info</span><strong>Translation Notes:</strong> ${escapeHtml(jsonResult.notes)}</div>` : ''}
      `;

      // Setup copy handler for new result
      const copyHandler = () => {
        copyToClipboard(jsonResult.translation);
        showNotification('Copied to clipboard!', 'success');
        resultContainer.removeEventListener('click', copyHandler); // Remove listener after copy
      };
      // Remove any previous listeners before adding a new one
      resultContainer.replaceWith(resultContainer.cloneNode(true)); // Simple way to remove all listeners
      document.getElementById('translate-result').addEventListener('click', copyHandler);


    } catch (error) {
      console.error('Error processing translation result:', error);
      resultTextElement.textContent = 'Error processing translation result.';
    }
  } else {
    resultTextElement.textContent = 'Failed to translate text. Please try again.';
  }
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Show notification
function showNotification(message, type = 'info', duration = 3000, event = null) {
  let notificationElement = document.getElementById('notification');
  
  if (!notificationElement) {
    notificationElement = document.createElement('div');
    notificationElement.id = 'notification';
    document.body.appendChild(notificationElement);
  }
  
  // Clear existing timeout if exists
  const existingTimeoutId = notificationElement.dataset.timeoutId;
  if (existingTimeoutId) {
    clearTimeout(parseInt(existingTimeoutId));
    notificationElement.removeAttribute('data-timeout-id'); // Remove old ID
  }
  
  // --- Style and Content ---
  // Set background color based on type
  let bgColor = 'var(--text-primary)'; // Default info color
  switch (type) {
    case 'success': bgColor = 'var(--success-color)'; break;
    case 'error': bgColor = 'var(--error-color)'; break;
  }
  notificationElement.style.backgroundColor = bgColor;
  notificationElement.textContent = message;
  notificationElement.setAttribute('data-type', type);

  // --- Positioning --- 
  if (event) {
    // Position near cursor
    notificationElement.style.bottom = 'auto'; // Reset bottom/transform
    notificationElement.style.left = 'auto';
    notificationElement.style.transform = 'none';
    
    const offsetX = 10; // Offset from cursor X
    const offsetY = 15; // Offset from cursor Y
    let posX = event.clientX + offsetX;
    let posY = event.clientY + offsetY;
    
    // Temporarily show to measure dimensions
    notificationElement.style.visibility = 'hidden';
    notificationElement.style.display = 'block'; 
    notificationElement.classList.add('show'); // Needs opacity 1 for getBoundingClientRect
    
    const rect = notificationElement.getBoundingClientRect();
    const popupWidth = window.innerWidth;
    const popupHeight = window.innerHeight;
    
    // Keep within popup bounds
    if (posX + rect.width > popupWidth - 10) { // Adjust if overflows right
      posX = event.clientX - rect.width - offsetX; 
    }
    if (posY + rect.height > popupHeight - 10) { // Adjust if overflows bottom
      posY = event.clientY - rect.height - offsetY;
    }
    // Ensure it doesn't go off top/left either
    posX = Math.max(10, posX);
    posY = Math.max(10, posY);

    notificationElement.style.left = `${posX}px`;
    notificationElement.style.top = `${posY}px`;
    
    // Make visible again
    notificationElement.style.visibility = 'visible';

  } else {
    // Position at bottom-center (fallback)
    notificationElement.style.left = '50%';
    notificationElement.style.bottom = '16px';
    notificationElement.style.top = 'auto'; // Reset top
    notificationElement.style.transform = 'translateX(-50%)';
    notificationElement.style.display = 'block'; // Ensure display is block
    notificationElement.classList.add('show'); // Show it
  }

  // --- Auto-hide Timeout --- 
  if (duration > 0) {
      const timeoutId = setTimeout(() => {
        notificationElement.classList.remove('show');
        notificationElement.removeAttribute('data-timeout-id');
        // Optional: Remove element after transition if desired
        // setTimeout(() => { 
        //   if (document.body.contains(notificationElement)) { 
        //     document.body.removeChild(notificationElement); 
        //   }
        // }, 300); // Match transition duration
      }, duration);
      
      // Store timeout ID on the element
      notificationElement.dataset.timeoutId = timeoutId.toString();
  } else {
    notificationElement.removeAttribute('data-timeout-id');
  }
} 