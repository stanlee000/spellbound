const { app, BrowserWindow, Tray, ipcMain, globalShortcut, clipboard, Menu, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { OpenAI } = require('openai');

const store = new Store();
let tray = null;
let mainWindow = null;
let openaiClient = null;
let lastClipboardContent = '';
let lastCheckTime = 0;

// Add language shortcuts mapping
const LANGUAGE_SHORTCUTS = {
  'e': 'English',
  'p': 'Polish',
  'c': 'Chinese',
  'g': 'German',
  'f': 'French',
  's': 'Spanish',
  'r': 'Russian',
  'i': 'Italian',
  'j': 'Japanese',
  'h': 'Hindi',
  'a': 'Arabic',
  't': 'Portuguese',
};

let isLanguageSelectorActive = false;

console.log('Starting Spellbound app...');
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));

function initOpenAI() {
  const apiKey = store.get('openai-api-key');
  if (apiKey) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    return true;
  }
  openaiClient = null;
  return false;
}

// Initialize OpenAI client
initOpenAI();

// Handle API key updates
ipcMain.handle('get-api-key', () => {
  return store.get('openai-api-key');
});

ipcMain.handle('set-api-key', async (event, apiKey) => {
  try {
    // Store the API key
    store.set('openai-api-key', apiKey);
    
    // Reinitialize OpenAI client
    if (!initOpenAI()) {
      throw new Error('Failed to initialize OpenAI client');
    }
    
    // Test the API key by making a simple API call
    await openaiClient.models.list();
    
    return true;
  } catch (error) {
    console.error('Error setting API key:', error);
    // Clear the invalid API key
    store.delete('openai-api-key');
    openaiClient = null;
    throw error;
  }
});

// Handle getting available models
ipcMain.handle('get-available-models', async () => {
  try {
    if (!openaiClient) {
      throw new Error('OpenAI API key not set');
    }
    const response = await openaiClient.models.list();
    // Filter for relevant models (GPT-4)
    const relevantModels = response.data.filter(model => 
      model.id.startsWith('gpt-4')
    );
    return relevantModels.map(model => ({
      id: model.id,
      name: model.id
    }));
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
});

// Handle text enhancement with presets
ipcMain.handle('enhance-text', async (event, { text, preset, customTone, additionalContext }) => {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  try {
    // First, detect the language
    const langResponse = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a language detection expert. Analyze the provided text and return ONLY the ISO language code (e.g., 'en', 'es', 'fr', etc.) of the primary language used."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const detectedLang = langResponse.choices[0].message.content.trim();

    // Define preset prompts
    const presetPrompts = {
      twitter: `Rewrite this ${detectedLang} text as an engaging X (Twitter) post. Make it concise, impactful. You can divide the text into multiple posts if need to engage the audience (each post should be 280 characters or less). ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
      
      linkedin: `Rewrite this ${detectedLang} text as a professional LinkedIn post. Focus on business value, insights, and professional tone. Add relevant hashtags. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
      
      instagram: `Rewrite this ${detectedLang} text as an engaging Instagram post. Make it relatable, authentic, and add relevant hashtags. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
      
      hackernews: `Rewrite this ${detectedLang} text in a style suitable for Hacker News. Focus on technical accuracy, intellectual depth, and objective analysis. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
      
      reddit: `Rewrite this ${detectedLang} text as a Reddit post. Make it informative yet conversational, with good formatting. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
      
      promptBuilder: `Transform this ${detectedLang} text into a well-structured LLM prompt following best practices:
      1. Be specific and clear about the desired outcome
      2. Break down complex tasks into steps
      3. Include relevant context and constraints
      4. Specify the format of the expected response
      5. Use examples if helpful
      ${additionalContext ? `Additional context to consider: ${additionalContext}.` : ''}
      Return ONLY the final prompt without any markdown formatting or additional notes:`,
      
      custom: `Rewrite this ${detectedLang} text with the following tone: ${customTone}. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`
    };

    const prompt = presetPrompts[preset] || presetPrompts.custom;

    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content writer who specializes in adapting text for different platforms while maintaining the core message. Return ONLY the enhanced text without any additional formatting, markdown, or notes. ${prompt}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      enhancedText: response.choices[0].message.content.trim(),
      detectedLanguage: detectedLang
    };
  } catch (error) {
    console.error('Error enhancing text:', error);
    throw error;
  }
});

// Handle model selection
ipcMain.handle('set-model', (event, modelId) => {
  store.set('selected-model', modelId);
  return true;
});

ipcMain.handle('get-current-model', () => {
  return store.get('selected-model') || "gpt-4o";
});

// Handle text checking
ipcMain.handle('check-text', async (event, text) => {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  try {
    // First, detect the language
    const langResponse = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a language detection expert. Return a JSON object with: 1) 'code': ISO language code (e.g., 'en', 'es'), 2) 'name': full language name in English, 3) 'native': language name in its native form."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    });

    const languageInfo = JSON.parse(langResponse.choices[0].message.content);

    // Then check for corrections
    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional proofreader. The text is in ${languageInfo.name} (${languageInfo.code}). 
          Identify spelling, grammar, and style issues. Return a JSON object with:
          1) 'corrections': array of {original, suggestion} pairs
          2) 'languageSpecific': array of language-specific improvement suggestions
          For example, if the text is in English and uses British spelling but could be made more consistent with American English, note that.
          If no corrections are needed, return { "corrections": [], "languageSpecific": [] }`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const corrections = JSON.parse(response.choices[0].message.content);
    return {
      ...corrections,
      language: languageInfo,
      text
    };
  } catch (error) {
    console.error('Error checking text:', error);
    throw error;
  }
});

// Handle translation
ipcMain.handle('translate-text', async (event, { text, targetLanguage }) => {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. 
          Before translating, proofread the text and improve wording if needed for the target language.
          Maintain the tone and style of the original text. Return a JSON object with:
          1) 'translation': the translated text (without any markdown or special formatting)
          2) 'notes': any relevant notes about cultural context or idioms (optional)`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
});

// Common languages for translation
ipcMain.handle('get-common-languages', () => {
  return [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
  ];
});

// Handle getting clipboard text
ipcMain.handle('get-clipboard-text', () => {
  return clipboard.readText();
});

// Handle setting clipboard text
ipcMain.handle('set-clipboard-text', (event, text) => {
  clipboard.writeText(text);
  return true;
});

// Update the shortcut handler to always show window
function registerHotkey(hotkey) {
  try {
    // Unregister any existing shortcuts first
    globalShortcut.unregisterAll();
    
    // Register the new shortcut
    const registered = globalShortcut.register(hotkey, () => {
      // Position the window near the cursor
      const { screen } = require('electron');
      const cursor = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(cursor);
      
      // Calculate position to avoid window going off screen
      let x = cursor.x + 20;
      let y = cursor.y + 20;
      
      // Adjust if window would go off screen
      if (x + 800 > display.bounds.width) {
        x = cursor.x - 820;
      }
      if (y + 600 > display.bounds.height) {
        y = cursor.y - 620;
      }
      
      // Ensure x and y are not negative
      x = Math.max(x, 0);
      y = Math.max(y, 0);

      if (!mainWindow.isFocused()) {
        mainWindow.setPosition(x, y);
        mainWindow.show();
        mainWindow.focus();
      }
      
      // Get the current clipboard content
      const text = clipboard.readText().trim();
      
      // Check the text regardless of window visibility
      checkSelectedText(false);
    });
    
    if (!registered) {
      console.error(`Failed to register hotkey: ${hotkey}`);
      return false;
    }
    
    console.log(`Successfully registered hotkey: ${hotkey}`);
    return true;
  } catch (error) {
    console.error('Error registering hotkey:', error);
    return false;
  }
}

// Update the save-settings handler
ipcMain.handle('save-settings', (event, settings) => {
  const oldSettings = store.get('settings') || {};
  
  // If hotkey changed, try to register the new one
  if (settings.hotkey && settings.hotkey !== oldSettings.hotkey) {
    const success = registerHotkey(settings.hotkey);
    if (!success) {
      // If registration failed, keep the old hotkey
      settings.hotkey = oldSettings.hotkey;
      if (mainWindow) {
        mainWindow.webContents.send('show-notification', 'Failed to register hotkey. Please try a different combination.');
      }
    }
  }
  
  store.set('settings', settings);
  return true;
});

ipcMain.handle('load-settings', () => {
  const settings = store.get('settings') || {};
  // Set default hotkey if not set
  if (!settings.hotkey) {
    settings.hotkey = 'CommandOrControl+Shift+C';
    store.set('settings', settings);
  }
  return settings;
});

// Add handler to get valid modifiers and keys
ipcMain.handle('get-valid-hotkeys', () => {
  return {
    modifiers: ['CommandOrControl', 'Alt', 'Shift', 'Super'],
    keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
  };
});

// Handle window show request
ipcMain.handle('show-window', () => {
  if (!mainWindow.isVisible()) {
    // Position the window in the center of the primary display
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    mainWindow.setPosition(
      Math.floor(width / 2 - 400 / 2),
      Math.floor(height / 2 - 600 / 2)
    );
    
    mainWindow.show();
  }
});

// Update checkSelectedText to handle window visibility separately
async function checkSelectedText(shouldShowWindow = false) {
  try {
    console.log('Checking selected text...');
    
    // Check if we have an OpenAI client
    if (!openaiClient) {
      console.log('No OpenAI client - prompting for API key');
      mainWindow.show();
      mainWindow.webContents.send('show-settings');
      return;
    }
    
    // Switch to Grammar & Style tab
    mainWindow.webContents.send('set-active-tab', 0); // Index 0 for Grammar & Style tab
    
    // Get text from clipboard
    const selection = clipboard.readText().trim();
    
    // Always notify about the text status
    if (!selection) {
      console.log('No text in clipboard');
      mainWindow.webContents.send('show-notification', 'Please select some text first');
      return;
    }

    // Notify about checking start
    mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: true });

    console.log('Checking text:', selection);
    
    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional proofreader. Analyze the text for spelling, grammar, and style issues.
          For each correction, provide the exact original text and its suggested improvement.
          Return ONLY a JSON array of corrections in this exact format, with no line breaks in suggestions:
          [
            {
              "original": "exact text to replace",
              "suggestion": "improved text"
            }
          ]
          If no corrections are needed, return an empty array: []`
        },
        {
          role: "user",
          content: selection
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content.trim();
    console.log('Got response from OpenAI:', content);
    
    try {
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions)) {
        if (suggestions.length === 0) {
          mainWindow.webContents.send('show-notification', 'Perfect! No corrections needed ✨');
          mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
        } else {
          // Validate each suggestion
          const validSuggestions = suggestions.filter(s => 
            s && typeof s === 'object' && 
            typeof s.original === 'string' && 
            typeof s.suggestion === 'string' &&
            s.original && s.suggestion
          );
          mainWindow.webContents.send('check-text-reply', {
            text: selection,
            corrections: validSuggestions,
            isChecking: false
          });
        }
      } else {
        console.error('Invalid response format:', content);
        mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      mainWindow.webContents.send('check-text-reply', { text: selection, corrections: [], isChecking: false });
    }
  } catch (error) {
    console.error('Error checking text:', error);
    mainWindow.webContents.send('check-text-reply', { text: '', corrections: [], isChecking: false });
    mainWindow.webContents.send('show-notification', 'Error checking text. Please try again.');
  }
}

// Handle correction application
ipcMain.handle('apply-correction', async (event, correction) => {
  try {
    const currentText = clipboard.readText();
    
    // Create a new string with the correction applied
    const newText = currentText.replace(new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correction.suggestion);
    
    // Only update if the text actually changed
    if (newText !== currentText) {
      clipboard.writeText(newText);
    }
    
    return true;
  } catch (error) {
    console.error('Error applying correction:', error);
    throw error;
  }
});

// Handle window minimization
ipcMain.handle('minimize-window', () => {
  mainWindow.hide();
});

// Add new IPC handler for translation with language
ipcMain.handle('translate-with-language', async (event, { language }) => {
  try {
    
    const selectedText = clipboard.readText().trim();
    if (!selectedText) {
      mainWindow.webContents.send('show-notification', 'Please select some text first');
      return;
    }


    console.log(`Translating to ${language.name}: ${selectedText.substring(0, 50)}...`);
    
    mainWindow.webContents.send('translate-text', {
      text: selectedText,
      targetLanguage: language
    });
    
    return true;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
});

function createWindow() {
  try {
    console.log('Creating main window...');
    mainWindow = new BrowserWindow({
      width: 800,
      height: 800,
      minWidth: 800,
      minHeight: 600,
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
    mainWindow.loadFile(path.join(__dirname, '..', 'src/index.html'));

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

function registerShortcuts() {
  // Register the main shortcut (Cmd+Shift+C)
  const settings = store.get('settings') || {};
  const hotkey = settings.hotkey || 'CommandOrControl+Shift+C';
  
  // Register grammar check shortcut
  registerHotkey(hotkey);
  
  // Register the translation shortcut (Cmd+Shift+T)
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    console.log('Translation shortcut triggered');
    if (!mainWindow) return;

    // Show window and position it near cursor
    const { screen } = require('electron');
    const cursor = screen.getCursorScreenPoint();
    const display = screen.getDisplayNearestPoint(cursor);
    
    // Calculate position to avoid window going off screen
    let x = cursor.x + 20;
    let y = cursor.y + 20;
    
    if (x + 800 > display.bounds.width) {
      x = cursor.x - 820;
    }
    if (y + 600 > display.bounds.height) {
      y = cursor.y - 620;
    }
    
    x = Math.max(x, 0);
    y = Math.max(y, 0);

    if (!mainWindow.isFocused()) {
      mainWindow.setPosition(x, y);
      mainWindow.show();
      mainWindow.focus();
    }

    if (!openaiClient) {
      console.log('No OpenAI client - prompting for API key');
      mainWindow.show();
      mainWindow.webContents.send('show-settings');
      return;
    }
    
    // Get text from clipboard
    const selection = clipboard.readText().trim();
    
    // Always notify about the text status
    if (!selection) {
      console.log('No text in clipboard');
      mainWindow.webContents.send('show-notification', 'Please select some text first');
      return;
    }

    // Switch to translation tab and show language selector
    mainWindow.webContents.send('set-active-tab', 2); // Index 2 for translation tab
    mainWindow.webContents.send('show-language-selector');
  });

  console.log('Translation shortcut registered: CommandOrControl+Shift+T');
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets/icon_16.png'));
  tray.setToolTip('Spellbound');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide',
      click: () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => app.quit() 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
  console.log('Window created');
  createTray();
  console.log('Tray created');
  registerShortcuts();
  console.log('Shortcuts registered');
}).catch(error => {
  console.error('Error during app startup:', error);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

function unregisterLanguageShortcuts() {
  console.log('Unregistering language shortcuts');
  Object.keys(LANGUAGE_SHORTCUTS).forEach(key => {
    globalShortcut.unregister(`CommandOrControl+${key}`);
  });
} 