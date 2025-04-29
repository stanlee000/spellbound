// Global variables
let activeTab = 'grammar';
let selectedPreset = null;
let originalText = '';
let selectedTargetLang = null;
let openaiApiKey = '';
let selectedModel = 'gpt-3.5-turbo';
let defaultTranslationLanguage = '';
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

// Common languages for translation
const commonLanguages = [
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
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
      
      // Load settings if available
      if (response.settings) {
        selectedModel = response.settings.selectedModel || 'gpt-3.5-turbo';
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

// Setup settings dialog
function setupSettingsDialog() {
  const settingsButton = document.getElementById('settingsButton');
  const settingsDialog = document.getElementById('settings-dialog');
  const closeDialog = document.querySelector('.close-dialog');
  const updateSettingsButton = document.getElementById('updateSettings');
  const modelSelector = document.getElementById('modelSelector');
  const defaultLangSelector = document.getElementById('defaultLanguageSelector');
  
  // Add scrollable style to dialog content
  const dialogContent = document.querySelector('.dialog-content');
  if (dialogContent) {
    dialogContent.style.maxHeight = '80vh';
    dialogContent.style.overflowY = 'auto';
  }
  
  settingsButton.addEventListener('click', () => {
    // Populate the API key field and model selector
    document.getElementById('apiKeySettings').value = openaiApiKey;
    
    // Set the current model
    modelSelector.value = selectedModel;
    
    // Load default translation language setting
    chrome.storage.local.get(['defaultTranslationLanguage'], (result) => {
      console.log('Current default language setting:', result.defaultTranslationLanguage);
      if (result.defaultTranslationLanguage && defaultLangSelector) {
        defaultLangSelector.value = result.defaultTranslationLanguage;
      }
    });
    
    settingsDialog.classList.remove('hidden');
  });
  
  closeDialog.addEventListener('click', () => {
    settingsDialog.classList.add('hidden');
  });
  
  updateSettingsButton.addEventListener('click', () => {
    const newApiKey = document.getElementById('apiKeySettings').value.trim();
    const newModel = modelSelector.value;
    const newDefaultLang = defaultLangSelector ? defaultLangSelector.value : '';
    
    if (!newApiKey) {
      showNotification('Please enter a valid API key', 'error');
      return;
    }
    
    // Save API key if changed
    if (newApiKey !== openaiApiKey) {
      chrome.runtime.sendMessage({ action: 'setApiKey', apiKey: newApiKey }, (response) => {
        if (response && response.success) {
          openaiApiKey = newApiKey;
        } else {
          showNotification('Failed to update API key', 'error');
          return;
        }
      });
    }
    
    // Save default translation language directly
    chrome.storage.local.set({ defaultTranslationLanguage: newDefaultLang }, () => {
      defaultTranslationLanguage = newDefaultLang;
      console.log('Saved default translation language:', newDefaultLang);
    });
    
    // Save model selection
    chrome.runtime.sendMessage({ 
      action: 'saveSettings', 
      settings: { selectedModel: newModel }
    }, (response) => {
      if (response && response.success) {
        selectedModel = newModel;
        settingsDialog.classList.add('hidden');
        showNotification('Settings saved successfully', 'success');
      } else {
        showNotification('Failed to save settings', 'error');
      }
    });
  });
}

// Setup preset selection and apply buttons
function setupPresetSelection() {
  const presetCards = document.querySelectorAll('.preset-card');
  const contextInputs = document.querySelectorAll('.context-input');
  const applyButtons = document.querySelectorAll('.preset-apply-button');

  // Handle card selection
  presetCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't select if clicking the button inside the card
      if (e.target.closest('.preset-apply-button')) {
        return;
      }
      
      // Remove selected class from all cards
      presetCards.forEach(c => c.classList.remove('selected'));
      
      // Add selected class to clicked card
      card.classList.add('selected');
      
      // Set selected preset - DO NOT enhance automatically
      selectedPreset = card.getAttribute('data-preset');
      console.log('Preset selected:', selectedPreset);
    });
  });
  
  // Handle apply button clicks
  applyButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent card click listener
      const card = button.closest('.preset-card');
      if (card) {
        const preset = card.getAttribute('data-preset');
        // Ensure this preset is marked as selected before applying
        if(selectedPreset !== preset) {
          presetCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedPreset = preset; 
        }
        console.log('Apply button clicked for preset:', selectedPreset);
        // Now enhance the text
        if (originalText) {
          enhanceText(); 
        } else {
          showNotification('No text found to enhance.', 'info');
        }
      }
    });
  });

  // Handle context inputs
  contextInputs.forEach(input => {
    input.addEventListener('input', () => {
      const contextType = input.getAttribute('data-context');
      if (contextValues.hasOwnProperty(contextType)) {
         contextValues[contextType] = input.value;
      } else {
          console.warn('Input has unknown data-context:', contextType);
      }
    });
  });
}

// Load initial text from selection
function loadInitialText() {
  chrome.storage.local.get(['selectedText', 'activeTab'], (result) => {
    if (result.selectedText) {
      originalText = result.selectedText;
      
      // Set active tab based on context menu selection
      if (result.activeTab) {
        const tab = document.querySelector(`.tab[data-tab="${result.activeTab}"]`);
        if (tab) {
          tab.click();
        }
      }
      
      // Process the text immediately after loading, regardless of tab selection
      setTimeout(() => {
        processActiveTab();
      }, 100);
    }
  });
}

// Process text based on the active tab
function processActiveTab() {
  if (!originalText) return;
  
  switch (activeTab) {
    case 'grammar':
      checkGrammar();
      break;
    case 'enhance':
      if (!selectedPreset) {
        // Auto-select the first preset if none is selected
        const firstPresetCard = document.querySelector('.preset-card');
        if (firstPresetCard) {
          firstPresetCard.click();
        } else {
          enhanceText();
        }
      } else {
        enhanceText();
      }
      break;
    case 'translate':
      populateLanguageChips();
      // Auto-select Spanish as default if no language is selected
      setTimeout(() => {
        if (!selectedTargetLang) {
          const firstLangChip = document.querySelector('.language-chip');
          if (firstLangChip) {
            firstLangChip.click();
          }
        }
      }, 100);
      break;
  }
}

// API calls to OpenAI
async function callOpenAI(prompt, model = null) {
  // Use the selected model or the provided one
  const modelToUse = model || selectedModel;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Always respond with valid JSON when asked for JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
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

// Check grammar
async function checkGrammar() {
  if (!originalText || !openaiApiKey) return;
  
  const loadingElement = document.querySelector('#grammar-result .loading');
  const resultTextElement = document.querySelector('#grammar-result .result-text');
  
  // Reset correction state
  currentCorrections = [];
  revertedCorrectionIds.clear();
  
  // Show loading indicator
  loadingElement.classList.remove('hidden');
  document.getElementById('grammar-result').classList.remove('hidden');
  resultTextElement.innerHTML = '';
  
  // Create prompt for grammar check
  const prompt = `
    Please check the following text for grammar, spelling, and style errors. 
    Format your response as a JSON object with the following structure:
    {
      "correctedText": "The full corrected text",
      "corrections": [
        { "original": "incorrect text", "corrected": "correct text", "explanation": "brief explanation" }
      ],
      "languageSpecific": ["any language-specific suggestions"]
    }
    
    Text to check:
    ${originalText}
  `;
  
  const result = await callOpenAI(prompt);
  
  // Hide loading indicator
  loadingElement.classList.add('hidden');
  
  if (result) {
    try {
      const jsonResult = safeJsonParse(result);
      
      if (!jsonResult || !jsonResult.correctedText) { // Check for correctedText too
        resultTextElement.textContent = 'Error processing grammar check result.';
        return;
      }
      
      // Store corrections and ensure it's an array
      currentCorrections = (jsonResult.corrections && Array.isArray(jsonResult.corrections)) ? jsonResult.corrections : [];
      
      // Highlight corrections in the text
      const highlightedText = highlightCorrections(jsonResult.correctedText, currentCorrections);
      resultTextElement.innerHTML = highlightedText;
      
      // Setup click handlers for corrections
      setupCorrectionHandlers();
      
      // Show language-specific suggestions if any
      if (jsonResult.languageSpecific && jsonResult.languageSpecific.length > 0) {
        const languageSpecificElement = document.getElementById('language-specific');
        const listElement = document.getElementById('language-specific-list');
        
        listElement.innerHTML = '';
        jsonResult.languageSpecific.forEach(suggestion => {
          const li = document.createElement('li');
          li.textContent = suggestion;
          listElement.appendChild(li);
        });
        
        languageSpecificElement.classList.remove('hidden');
      }
      
      // Setup copy handler (will be modified later)
      setupGrammarCopyHandler(jsonResult.correctedText); // Pass original corrected text
    } catch (error) {
      console.error('Error processing grammar check result:', error);
      resultTextElement.textContent = 'Error processing grammar check result.';
    }
  } else {
    resultTextElement.textContent = 'Failed to check grammar. Please try again.';
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
let grammarResultClickListener = null; // Keep track of listener

function setupCorrectionHandlers() {
  const resultTextElement = document.querySelector('#grammar-result .result-text');
  if (!resultTextElement) return;

  // Remove previous listener if it exists
  if (grammarResultClickListener) {
    resultTextElement.removeEventListener('click', grammarResultClickListener);
  }

  // Define the new listener
  grammarResultClickListener = (event) => {
    const target = event.target;
    const correctionSpan = target.closest('.correction');

    if (correctionSpan) {
      event.stopPropagation(); // Prevent the copy-all listener
      
      const correctionId = parseInt(correctionSpan.getAttribute('data-correction-id'));
      const explanation = correctionSpan.getAttribute('data-explanation');
      const originalText = correctionSpan.getAttribute('data-original');
      const correctedText = correctionSpan.textContent;

      // Show explanation
      showNotification(`${explanation}\n(Original: "${originalText}")`, 'info');

      // Toggle reverted state
      if (revertedCorrectionIds.has(correctionId)) {
        // Re-apply correction
        revertedCorrectionIds.delete(correctionId);
        correctionSpan.classList.remove('reverted');
        correctionSpan.textContent = currentCorrections[correctionId]?.corrected || correctedText; // Restore corrected text
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

  // Attach the new listener
  resultTextElement.addEventListener('click', grammarResultClickListener);
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
  
  // Show loading indicator
  loadingElement.classList.remove('hidden');
  resultContainer.classList.remove('hidden');
  resultTextElement.innerHTML = '';
  
  // Get context values based on selected preset
  let context = '';
  let tone = '';
  
  switch (selectedPreset) {
    case 'twitter':
      context = contextValues.twitter || '';
      tone = 'concise, engaging, and optimized for social media with appropriate hashtags';
      break;
    case 'linkedin':
      context = contextValues.linkedin || '';
      tone = 'professional, insightful, and appropriate for a business networking platform';
      break;
    case 'instagram':
      context = contextValues.instagram || '';
      tone = 'authentic, engaging, suitable for Instagram captions';
      break;
    case 'hackernews':
      context = contextValues.hackernews || '';
      tone = 'analytical, technically accurate, objective, suitable for Hacker News discussion';
      break;
    case 'reddit':
      context = contextValues.reddit || '';
      tone = 'conversational, clear, well-structured, suitable for Reddit comments/posts';
      break;  
    case 'promptBuilder':
      context = contextValues.promptBuilder || '';
      tone = 'structured as a clear, effective LLM prompt, following best practices';
      break;
    case 'academic':
      context = contextValues.academic || '';
      tone = 'formal, scholarly, and well-structured with appropriate terminology';
      break;
    case 'custom':
      context = contextValues.customContext || '';
      tone = contextValues.customTone || 'clear and well-written';
      break;
    default:
        console.error('Unknown selected preset:', selectedPreset);
        showNotification('Unknown preset selected.', 'error');
        loadingElement.classList.add('hidden');
        return;
  }
  
  // Create prompt for text enhancement
  const prompt = `
    Please rewrite the following text in a ${tone} tone.
    ${context ? `Additional context or requirements: ${context}` : ''}
    
    Original text:
    ${originalText}
    
    Provide ONLY the enhanced text in your response, with no additional comments or explanations. Do NOT format as JSON.
  `;
  
  const rawResult = await callOpenAI(prompt);
  
  // Hide loading indicator
  loadingElement.classList.add('hidden');
  
  if (rawResult) {
    let finalText = rawResult.trim();
    
    // Attempt to parse as JSON in case the AI ignored the instruction
    try {
      const jsonResult = safeJsonParse(rawResult);
      // Use text property if available (flexible key names)
      if (jsonResult && (jsonResult.text || jsonResult.enhancedText || jsonResult.rewrittenText)) {
        finalText = jsonResult.text || jsonResult.enhancedText || jsonResult.rewrittenText;
      }
    } catch (e) {
      // Parsing failed, likely just plain text. Clean potential fences.
      finalText = rawResult.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    }
    
    resultTextElement.textContent = finalText;
    
    // Setup copy handler
    resultContainer.addEventListener('click', () => {
      copyToClipboard(finalText);
      showNotification('Copied to clipboard!', 'success');
    });
  } else {
    resultTextElement.textContent = 'Failed to enhance text. Please try again.';
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
  
  const loadingElement = document.querySelector('#translate-result .loading');
  const resultTextElement = document.querySelector('#translate-result .result-text');
  const resultContainer = document.getElementById('translate-result');
  const targetLanguageSpan = document.getElementById('target-language');
  
  // Show loading indicator
  targetLanguageSpan.textContent = currentTargetLang.name;
  loadingElement.classList.remove('hidden');
  resultContainer.classList.remove('hidden');
  resultTextElement.innerHTML = '';
  
  // Create prompt for translation
  const prompt = `
    Please translate the following text to ${currentTargetLang.name} (${currentTargetLang.native}).
    Format your response as a JSON object with the following structure:
    {
      "translation": "The translated text",
      "notes": "Any relevant notes about the translation (cultural context, idioms, etc.)"
    }
    
    Text to translate:
    ${originalText}
  `;
  
  const result = await callOpenAI(prompt);
  
  // Hide loading indicator
  loadingElement.classList.add('hidden');
  
  if (result) {
    try {
      const jsonResult = safeJsonParse(result);
      
      if (!jsonResult) {
        resultTextElement.textContent = 'Error processing translation result.';
        return;
      }
      
      // Display the translation
      resultTextElement.innerHTML = `
        <div>${escapeHtml(jsonResult.translation)}</div>
        ${jsonResult.notes ? `<div class="translation-notes"><span class="material-icons">info</span><strong>Translation Notes:</strong> ${escapeHtml(jsonResult.notes)}</div>` : ''}
      `;
      
      // Setup copy handler
      resultContainer.addEventListener('click', () => {
        copyToClipboard(jsonResult.translation);
        showNotification('Copied to clipboard!', 'success');
      });
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
function showNotification(message, type = 'info') {
  let notificationElement = document.getElementById('notification');
  let timeoutId = null;
  
  if (!notificationElement) {
    notificationElement = document.createElement('div');
    notificationElement.id = 'notification';
    document.body.appendChild(notificationElement);
  }
  
  // Clear existing timeout if exists
  if (notificationElement.dataset.timeoutId) {
    clearTimeout(parseInt(notificationElement.dataset.timeoutId));
  }
  
  // Set background color based on type
  let bgColor = 'var(--text-primary)'; // Default info color
  switch (type) {
    case 'success':
      bgColor = 'var(--success-color)';
      break;
    case 'error':
      bgColor = 'var(--error-color)';
      break;
  }
  notificationElement.style.backgroundColor = bgColor;
  
  // Set message
  notificationElement.textContent = message;
  
  // Set data-type attribute for styling
  notificationElement.setAttribute('data-type', type);
  
  // Add 'show' class to trigger animation
  requestAnimationFrame(() => {
      notificationElement.classList.add('show');
  });

  // Set timeout to remove 'show' class and hide
  timeoutId = setTimeout(() => {
    notificationElement.classList.remove('show');
    // Optional: Remove element after transition if desired
    // setTimeout(() => { 
    //   if (document.body.contains(notificationElement)) { 
    //     document.body.removeChild(notificationElement); 
    //   }
    // }, 300); // Match transition duration
  }, 3000);
  
  // Store timeout ID on the element
  notificationElement.dataset.timeoutId = timeoutId.toString();
} 