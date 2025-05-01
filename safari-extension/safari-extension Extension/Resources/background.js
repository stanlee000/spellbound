// Initialize the extension when installed
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'spellbound',
    title: 'Spellbound',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'spellbound-grammar',
    title: 'Check Grammar & Style',
    contexts: ['selection'],
    parentId: 'spellbound'
  });
  
  chrome.contextMenus.create({
    id: 'spellbound-enhance',
    title: 'Enhance & Rewrite',
    contexts: ['selection'],
    parentId: 'spellbound'
  });
  
  chrome.contextMenus.create({
    id: 'spellbound-translate',
    title: 'Translate',
    contexts: ['selection'],
    parentId: 'spellbound'
  });

  // Initialize storage with default settings if needed
  chrome.storage.local.get(['apiKey', 'settings'], (result) => {
    // Check if settings object exists, initialize if not or if apiKey is missing
    if (!result.settings || !result.hasOwnProperty('apiKey')) {
      chrome.storage.local.set({
        apiKey: result.apiKey || '', // Keep existing API key if present
        settings: {
          hasSeenInstructions: false,
          selectedModel: 'gpt-4o',
          showIndicatorIcon: false // Default: disabled
        },
        // Ensure other top-level settings are initialized if needed
        defaultTranslationLanguage: result.defaultTranslationLanguage || 'en',
        menuSettings: result.menuSettings || { disabledPages: [], globallyDisabled: false }
      });
    } else {
      // If settings exist, ensure the new key is added if missing
      if (result.settings.showIndicatorIcon === undefined) {
        result.settings.showIndicatorIcon = false; // Add default if missing
        chrome.storage.local.set({ settings: result.settings });
      }
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  if (!selectedText) return;
  
  let action;
  switch(info.menuItemId) {
    case 'spellbound-grammar':
      action = 'grammar';
      break;
    case 'spellbound-enhance':
      action = 'enhance';
      break;
    case 'spellbound-translate':
      action = 'translate';
      break;
    default:
      return;
  }
  
  // Store the selected text and active tab in storage
  chrome.storage.local.set({ 
    selectedText: selectedText,
    activeTab: action
  }, () => {
    // Open the popup programmatically
    chrome.action.openPopup();
  });
  
  // Also send message to content script (for compatibility)
  chrome.tabs.sendMessage(tab.id, {
    action: 'processText',
    text: selectedText,
    tabType: action
  });
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  // Get the active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || tabs.length === 0) return;
  
  const activeTab = tabs[0];
  
  // Execute script to get selected text
  const results = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    function: () => window.getSelection().toString().trim()
  });
  
  const selectedText = results[0].result;
  if (!selectedText) {
    // If no text is selected, just open the popup
    chrome.action.openPopup();
    return;
  }
  
  let tabType;
  switch (command) {
    case 'check_grammar':
      tabType = 'grammar';
      break;
    case 'enhance_text':
      tabType = 'enhance';
      break;
    case 'translate_text':
      tabType = 'translate';
      break;
    default:
      // Default command just opens the popup
      chrome.action.openPopup();
      return;
  }
  
  // Store the selected text and active tab type
  chrome.storage.local.set({ selectedText, activeTab: tabType }, () => {
    chrome.action.openPopup();
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkApiKey') {
    chrome.storage.local.get(['apiKey', 'settings', 'defaultTranslationLanguage'], (result) => {
      sendResponse({ 
        hasApiKey: !!result.apiKey, 
        apiKey: result.apiKey,
        settings: result.settings || { selectedModel: 'gpt-4o' },
        defaultTranslationLanguage: result.defaultTranslationLanguage
      });
    });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'setApiKey') {
    chrome.storage.local.set({ apiKey: message.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'saveSettings') {
    // Store settings and handle default translation language
    let settingsToSave = message.settings || {};
    
    // Extract defaultTranslationLanguage if present
    let defaultLang = null;
    if (settingsToSave.defaultTranslationLanguage !== undefined) {
      defaultLang = settingsToSave.defaultTranslationLanguage;
      delete settingsToSave.defaultTranslationLanguage;
    }
    
    // Update storage based on what we have
    const storageUpdate = { settings: settingsToSave };
    if (defaultLang !== null) {
      storageUpdate.defaultTranslationLanguage = defaultLang;
    }
    
    chrome.storage.local.set(storageUpdate, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Consolidated handler for floating menu clicks
  if (message.action === 'handleTextSelection') {
    console.log(`[Background] Received handleTextSelection for tab: ${message.tabType}`);
    
    // 1. Store the necessary data
    chrome.storage.local.set({ 
      selectedText: message.selectedText || '',
      activeTab: message.tabType || 'grammar'
    }, () => {
      console.log('[Background] Data stored. Attempting to open popup.');
      
      // 2. Attempt to open the popup
      chrome.action.openPopup((popupWindow) => {
        if (chrome.runtime.lastError) {
          // Log error if opening failed
          console.error('[Background] Error opening popup via action API:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else if (popupWindow) {
          // Popup opened successfully
          console.log('[Background] Popup opened successfully.');
          sendResponse({ success: true });
        } else {
          // No window returned, might be blocked or already open
          console.warn('[Background] chrome.action.openPopup did not return a window. Might be blocked/already open.');
          // Send update message just in case it is already open
          chrome.runtime.sendMessage({
              action: 'setTabAndProcess',
              tabType: message.tabType,
              selectedText: message.selectedText
          });
          sendResponse({ success: false, reason: 'No popup window returned.' });
        }
      });
    });
    
    return true; // Indicate async response
  }

  // Handler for updating an already open popup (if needed)
  if (message.action === 'setTabAndProcess') {
     console.log(`[Background] Received setTabAndProcess for tab: ${message.tabType}`);
     // This message is primarily for the popup.js to handle
     // We just acknowledge it here.
     sendResponse({ success: true });
     return false; // No further async work needed here
  }
  
  // Handler for getting suggestion count
  if (message.action === 'getSuggestionCount') {
    console.log('[Background] Received getSuggestionCount');
    const text = message.text;
    if (!text || text.trim().length === 0) {
      sendResponse({ count: 0 });
      return false;
    }

    chrome.storage.local.get(['apiKey', 'settings'], async (result) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error getting apiKey/settings for count:', chrome.runtime.lastError.message);
        sendResponse({ error: 'Could not retrieve API key.' });
        return;
      }
      
      const apiKey = result.apiKey;
      const settings = result.settings || { selectedModel: 'gpt-4o' };
      const model = settings.selectedModel || 'gpt-4o'; // Fallback model

      if (!apiKey) {
        console.warn('[Background] No API key found for suggestion count.');
        sendResponse({ error: 'API key not set.' });
        return;
      }

      // Construct a prompt specifically asking for a list of errors
      const prompt = `You are a professional proofreader. Analyze the following text and identify spelling, grammar, and style issues based on that language. 
      Also take into account the context of the text and tone.
       Do not correct the text. Instead, return just a integer count of the exact number of issues found. Do not add any unneeded text or comments. 
       If no issues are found, respond with "No issues found.".
       Return without any markdown formatting, code blocks, or additional text.
Text:
"""
${text}
"""

Issues found:`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2, // Lower temperature for more deterministic counting
            max_tokens: 150 // Limit tokens as we only need the list
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Background] OpenAI API error for count:', response.status, errorData);
          sendResponse({ error: `API Error: ${errorData?.error?.message || response.statusText}` });
          return;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        console.log('[Background] API response:', content);

        if (!content || content.trim().toLowerCase() === 'no issues found.') {
          console.log('[Background] No issues found by API.');
          sendResponse({ count: 0 });
        } else {
          // Count the number of lines starting with "- "
          // const lines = content.trim().split('\n');
          // const count = lines.filter(line => line.trim().startsWith('- ')).length;
          const count = parseInt(content.trim());

          sendResponse({ count: count });
        }

      } catch (error) {
        console.error('[Background] Network or fetch error getting suggestion count:', error);
        sendResponse({ error: 'Network error or failed to fetch count.' });
      }
    });

    return true; // Indicate asynchronous response
  }
  
  // Keep original setActiveTab for compatibility if needed elsewhere
  if (message.action === 'setActiveTab') {
    console.log('[Background] Received legacy setActiveTab for tab:', message.tabType);
    chrome.runtime.sendMessage({
      action: 'setTabAndProcess',
      tabType: message.tabType,
      selectedText: message.selectedText
    });
    sendResponse({ success: true });
    return true;
  }
  
  console.warn('[Background] Received unknown message action:', message.action);
  return false; // Indicate message was not handled
}); 