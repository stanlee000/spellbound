const React = require('react');
const { useState, useEffect } = React;
const { Box, Typography, Paper, List, ListItem, ListItemText, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert, CircularProgress, Tab, Tabs, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardActions, Tooltip, Chip, ListItemIcon, Divider, ToggleButton, ToggleButtonGroup, Fade, Stack, Checkbox } = require('@mui/material');
const { Settings: SettingsIcon, Check: CheckIcon, Close: CloseIcon, Keyboard: KeyboardIcon, KeyboardCommandKey: KeyboardCommandKeyIcon, ContentPaste: PasteIcon, AutoFixHigh: MagicIcon, Remove: MinimizeIcon, Twitter: TwitterIcon, LinkedIn: LinkedInIcon, Reddit: RedditIcon, Instagram: InstagramIcon, Code: CodeIcon, Create: CreateIcon, Refresh: RefreshIcon, Language: LanguageIcon, Translate: TranslateIcon, Info: InfoIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');
const LanguageSelector = require('./LanguageSelector');

// Import new components
const TitleBarComponent = require('./TitleBarComponent');
const InstructionScreen = require('./InstructionScreen');
const GrammarTab = require('./GrammarTab');
const EnhanceTab = require('./EnhanceTab');
const TranslateTab = require('./TranslateTab');
const SettingsDialogComponent = require('./SettingsDialogComponent');

const ContentBox = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'auto',
  padding: theme.spacing(3),
  backgroundColor: '#FFFFFF',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#F8F9FA',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#E2E8F0',
    borderRadius: '4px',
    '&:hover': {
      background: '#CBD5E1',
    },
  },
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '1rem',
  minHeight: 48,
  padding: '6px 24px',
  borderRadius: 24,
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.text.primary,
    fontWeight: 600,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .Mui-selected': {
    backgroundColor: '#F5F5F5',
  },
  borderBottom: 'none',
  marginBottom: theme.spacing(2),
}));

const App = () => {
  const theme = useTheme();
  const [corrections, setCorrections] = useState([]);
  const [originalText, setOriginalText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [hasSeenInstructions, setHasSeenInstructions] = useState(false);
  const [settings, setSettings] = useState({
    apiKey: '',
    model: 'gpt-4.1', // default model
    hotkey: '',
    translationHotkey: ''
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [enhancedText, setEnhancedText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customTone, setCustomTone] = useState('');
  const [additionalContext, setAdditionalContext] = useState({
    twitter: '',
    linkedin: '',
    instagram: '',
    hackernews: '',
    reddit: '',
    promptBuilder: '',
    custom: ''
  });
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [pasteDialog, setPasteDialog] = useState({ open: false, text: '' });
  const [languageInfo, setLanguageInfo] = useState(null);
  const [languageSpecific, setLanguageSpecific] = useState([]);
  const [commonLanguages, setCommonLanguages] = useState([]);
  const [selectedTargetLang, setSelectedTargetLang] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [availableHotkeys, setAvailableHotkeys] = useState({ modifiers: [], keys: [] });
  const [isRecordingHotkey, setIsRecordingHotkey] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [translationTarget, setTranslationTarget] = useState('');
  const [platform, setPlatform] = useState('Windows');
  const [isRecordingTranslationHotkey, setIsRecordingTranslationHotkey] = useState(false);

  useEffect(() => {
    // Detect platform
    if (navigator.platform.includes('Mac')) {
      setPlatform('Mac');
    }
    
    // Load saved API key and check if user has seen instructions
    window.electron.ipcRenderer.invoke('get-api-key').then(apiKey => {
      if (apiKey) {
        setSettings(prev => ({ ...prev, apiKey }));
        // Load available models when API key is set
        loadAvailableModels();
      }
    });

    window.electron.ipcRenderer.invoke('get-current-model').then(model => {
      if (model) {
        setSettings(prev => ({ ...prev, model }));
      } else {
        // Set default model if none is saved
        handleModelChange(settings.model);
      }
    });

    window.electron.ipcRenderer.invoke('load-settings').then(savedSettings => {
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...savedSettings }));
        if (savedSettings.hasSeenInstructions) {
        setHasSeenInstructions(true);
        }
      } else {
        // Save default settings if none exist
        window.electron.ipcRenderer.invoke('save-settings', settings);
      }
    });

    // If first time, show the window
    if (!hasSeenInstructions) {
      window.electron.ipcRenderer.invoke('show-window');
    }

    // Load common languages
    window.electron.ipcRenderer.invoke('get-common-languages').then(languages => {
      setCommonLanguages(languages);
    });

    // Store listener functions so we can remove them later
    const checkTextReplyListener = (result) => {
      console.log('check-text-reply received:', result);
      if (result.text) {
        setOriginalText(result.text);
        setCorrectedText(result.text);
        setEnhancedText('');
        setTranslation(null);
      }
      // Updated check to handle both direct corrections array and nested structure
      if (result.corrections) {
        const correctionArray = Array.isArray(result.corrections) 
          ? result.corrections 
          : (result.corrections.corrections || []);
        setCorrections(correctionArray);
        // Ensure languageSpecific is always an array
        setLanguageSpecific(result.languageSpecific || (result.corrections && result.corrections.languageSpecific) || []);
      }
      if (result.language) {
        setLanguageInfo(result.language);
      }
      setIsChecking(result.isChecking || false);
    };

    const showSettingsListener = () => {
      setSettingsOpen(true);
    };

    const showNotificationListener = (message) => {
      setNotification(message);
    };

    const showLanguageSelectorListener = () => {
      setActiveTab(2);
      setShowLanguageSelector(true);
    };

    const translateTextListener = async ({ text, targetLanguage }) => {
      setOriginalText(text);
      setCorrectedText(text);
      setEnhancedText('');
      setTranslation(null);
      setIsTranslating(true);
      setTranslationTarget(targetLanguage.name);
      setSelectedTargetLang(targetLanguage);
      setActiveTab(2);

      try {
        const result = await window.electron.ipcRenderer.invoke('translate-text', {
          text: text,
          targetLanguage: targetLanguage.name
        });
        setTranslation(result);
      } catch (error) {
        console.error('Error translating:', error);
        setNotification(`Failed to translate text: ${error.message}`);
      } finally {
        setIsTranslating(false);
      }
    };

    const setActiveTabListener = (tabIndex) => {
      setActiveTab(tabIndex);
    };

    // Add listeners
    window.electron.ipcRenderer.on('check-text-reply', checkTextReplyListener);
    window.electron.ipcRenderer.on('show-settings', showSettingsListener);
    window.electron.ipcRenderer.on('show-notification', showNotificationListener);
    window.electron.ipcRenderer.on('show-language-selector', showLanguageSelectorListener);
    window.electron.ipcRenderer.on('translate-text', translateTextListener);
    window.electron.ipcRenderer.on('set-active-tab', setActiveTabListener);

    // Load available hotkeys
    window.electron.ipcRenderer.invoke('get-valid-hotkeys').then(hotkeys => {
      setAvailableHotkeys(hotkeys);
    });

    // Cleanup function
    return () => {
      window.electron.ipcRenderer.removeListener('check-text-reply', checkTextReplyListener);
      window.electron.ipcRenderer.removeListener('show-settings', showSettingsListener);
      window.electron.ipcRenderer.removeListener('show-notification', showNotificationListener);
      window.electron.ipcRenderer.removeListener('show-language-selector', showLanguageSelectorListener);
      window.electron.ipcRenderer.removeListener('translate-text', translateTextListener);
      window.electron.ipcRenderer.removeListener('set-active-tab', setActiveTabListener);
    };
  }, []); // Removed hasSeenInstructions dependency

  const loadAvailableModels = async () => {
    try {
      const models = await window.electron.ipcRenderer.invoke('get-available-models');
      setAvailableModels(models);
      // If current model is not in available models, reset to default
      if (models.length > 0 && !models.find(m => m.id === settings.model)) {
        const defaultModel = models.find(m => m.id === 'gpt-4o') || models[0];
        handleModelChange(defaultModel.id);
      }
    } catch (error) {
      console.error('Error loading models:', error);
      setNotification(`Failed to load models: ${error.message}`);
    }
  };

  const handleModelChange = async (modelId) => {
    try {
      await window.electron.ipcRenderer.invoke('set-model', modelId);
      setSettings(prev => ({ ...prev, model: modelId }));
      setNotification('Model updated successfully');
    } catch (error) {
      console.error('Error setting model:', error);
      setNotification(`Failed to update model: ${error.message}`);
    }
  };

  const handlePresetSelect = (preset) => {
    if (!originalText) {
      setNotification('No text to enhance. Please select some text first.');
      return;
    }
    setSelectedPreset(preset);
    if (preset !== 'custom') {
      setCustomTone('');
    }
    handleEnhanceText(preset);
  };

  const handleEnhanceText = async (presetToUse = null) => {
    const preset = presetToUse || selectedPreset;
    if (!preset && !customTone) {
      setNotification('Please select a preset or enter a custom tone');
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await window.electron.ipcRenderer.invoke('enhance-text', {
        text: originalText,
        preset: preset || selectedPreset,
        customTone,
        additionalContext: additionalContext[preset || selectedPreset] || ''
      });

      setEnhancedText(result.enhancedText);
      setDetectedLanguage(result.detectedLanguage);
      setNotification('Text enhanced successfully! Click to copy.');
    } catch (error) {
      console.error('Error enhancing text:', error);
      setNotification(`Failed to enhance text: ${error.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyCorrectedText = async () => {
    if (correctedText) {
      await window.electron.ipcRenderer.invoke('set-clipboard-text', correctedText);
      setNotification('Corrected text copied to clipboard!');
    }
  };

  const handleCopyEnhancedText = async () => {
    if (enhancedText) {
      await window.electron.ipcRenderer.invoke('set-clipboard-text', enhancedText);
      setNotification('Enhanced text copied to clipboard!');
    }
  };

  const handleCorrection = async (correction) => {
    try {
      // Get current text from clipboard
      const currentText = await window.electron.ipcRenderer.invoke('get-clipboard-text');
      
      // Apply the correction
      await window.electron.ipcRenderer.invoke('apply-correction', correction);
      
      // Update the corrected text in the UI
      const newText = currentText.replace(
        new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        correction.suggestion
      );
      setCorrectedText(newText);
      
      // Remove the applied correction from the list
      setCorrections(prev => prev.filter(c => c.original !== correction.original));
      
      // Show notification about pasting
      if (corrections.length <= 1) {
        // This was the last correction
        setNotification('All corrections applied! The corrected text is in your clipboard - press Ctrl+V (Cmd+V on Mac) to paste it wherever you need.');
      } else {
        setNotification('Correction applied and copied to clipboard! Click the next highlighted text to continue.');
      }
    } catch (error) {
      console.error('Error applying correction:', error);
      setNotification(`Failed to apply correction: ${error.message}`);
    }
  };

  const handleGotItClick = async () => {
    setHasSeenInstructions(true);
    await window.electron.ipcRenderer.invoke('save-settings', { ...settings, hasSeenInstructions: true });
    window.electron.ipcRenderer.invoke('minimize-window');
  };

  const handleMinimize = () => {
    window.electron.ipcRenderer.invoke('minimize-window');
  };

  const handleTranslate = async (targetLang) => {
    if (!targetLang || !originalText) return;

    setIsTranslating(true);
    setSelectedTargetLang(targetLang);
    setTranslationTarget(targetLang.name);
    try {
      const result = await window.electron.ipcRenderer.invoke('translate-text', {
        text: originalText,
        targetLanguage: targetLang.name
      });
      setTranslation(result);
    } catch (error) {
      console.error('Error translating:', error);
      setNotification(`Failed to translate text: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyTranslation = async () => {
    if (translation?.translation) {
      await window.electron.ipcRenderer.invoke('set-clipboard-text', translation.translation);
      setNotification('Translation copied to clipboard!');
    }
  };

  const handleSettingsSave = async () => {
    try {
      // Save settings first
      await window.electron.ipcRenderer.invoke('save-settings', {
        ...settings,
        hasSeenInstructions: true
      });
      
      // Call update-shortcuts explicitly with the current settings
      console.log('Updating shortcuts immediately with:', settings.hotkey, settings.translationHotkey);
      let shortcutsUpdated = false;
      
      try {
        const result = await window.electron.ipcRenderer.invoke('update-shortcuts', {
          grammarHotkey: settings.hotkey,
          translationHotkey: settings.translationHotkey
        });
        
        shortcutsUpdated = result && (typeof result === 'object' ? result.success : result);
        
        if (result && typeof result === 'object') {
          if (result.success) {
            setNotification('Settings saved and shortcuts updated successfully');
          } else {
            let message = 'Settings saved but some shortcuts could not be updated:';
            if (result.grammar && !result.grammar.success) {
              message += ` Grammar shortcut (${settings.hotkey}) failed.`;
            }
            if (result.translation && !result.translation.success) {
              message += ` Translation shortcut (${settings.translationHotkey}) failed.`;
            }
            if (result.error) {
              message += ` Error: ${result.error}`;
            }
            setNotification(message);
          }
        } else {
          setNotification(shortcutsUpdated ? 
            'Settings saved successfully' : 
            'Settings saved but shortcuts could not be updated - restart may be required');
        }
      } catch (shortcutError) {
        console.error('Error updating shortcuts:', shortcutError);
        setNotification('Settings saved but shortcuts could not be updated: ' + shortcutError.message);
      }
      
      setSettingsOpen(false);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setNotification('Error saving settings: ' + error.message);
    }
  };

  const handleApiKeyChange = async (e) => {
    const newApiKey = e.target.value;
    setSettings(prev => ({ ...prev, apiKey: newApiKey }));
    
    // Clear models immediately
    setAvailableModels([]);
    
    // If API key is not empty, try to validate it and load models
    if (newApiKey.trim()) {
      try {
        // Try setting and validating the API key
        await window.electron.ipcRenderer.invoke('set-api-key', newApiKey);
        setNotification('API key verified successfully!');
        loadAvailableModels(); // Load models on success
      } catch (error) {
        console.error('Error setting/validating API key:', error);
        setNotification(`Invalid API key: ${error.message || 'Please check and try again.'}`);
        // Optionally clear the invalid key from UI state if desired
        // setSettings(prev => ({ ...prev, apiKey: '' }));
      }
    } else {
      // Clear the API key in the main process if input is empty
      await window.electron.ipcRenderer.invoke('set-api-key', '');
    }
  };

  const handleRecordHotkey = () => {
    if (isRecordingTranslationHotkey) return; // Don't allow multiple recordings at once
    
    setIsRecordingHotkey(true);
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      
      // Get valid hotkeys
      window.electron.ipcRenderer.invoke('get-valid-hotkeys').then(validHotkeys => {
        const { modifiers, keys } = validHotkeys;
        
        // Check if required modifiers and key are pressed
        const pressedModifiers = [];
        if (e.ctrlKey) pressedModifiers.push('Control');
        if (e.metaKey) pressedModifiers.push('Command');
        if (e.shiftKey) pressedModifiers.push('Shift');
        if (e.altKey) pressedModifiers.push('Alt');
        
        const key = e.key.toUpperCase();
        
        // Validate that at least one modifier and one key are pressed
        if (pressedModifiers.length > 0 && keys.includes(key)) {
          // Format the hotkey
          let hotkey = '';
          
          // Use CommandOrControl for cross-platform compatibility
          if (pressedModifiers.includes('Control') || pressedModifiers.includes('Command')) {
            hotkey += 'CommandOrControl';
          } else if (pressedModifiers.includes('Alt')) {
            hotkey += 'Alt';
          }
          
          if (pressedModifiers.includes('Shift')) {
            hotkey += hotkey.length > 0 ? '+Shift' : 'Shift';
          }
          
          hotkey += `+${key}`;
          
          // Update settings
          setSettings(prev => ({ ...prev, hotkey: hotkey }));
          setIsRecordingHotkey(false);
          
          // Remove event listener
          window.removeEventListener('keydown', handleKeyDown);
        }
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Timeout to cancel recording after 5 seconds
    setTimeout(() => {
      if (isRecordingHotkey) {
        setIsRecordingHotkey(false);
        window.removeEventListener('keydown', handleKeyDown);
      }
    }, 5000);
  };

  const handleRecordTranslationHotkey = () => {
    if (isRecordingHotkey) return; // Don't allow multiple recordings at once
    
    setIsRecordingTranslationHotkey(true);
    
    const handleKeyDown = (e) => {
      e.preventDefault();
      
      // Get valid hotkeys
      window.electron.ipcRenderer.invoke('get-valid-hotkeys').then(validHotkeys => {
        const { modifiers, keys } = validHotkeys;
        
        // Check if required modifiers and key are pressed
        const pressedModifiers = [];
        if (e.ctrlKey) pressedModifiers.push('Control');
        if (e.metaKey) pressedModifiers.push('Command');
        if (e.shiftKey) pressedModifiers.push('Shift');
        if (e.altKey) pressedModifiers.push('Alt');
        
        const key = e.key.toUpperCase();
        
        // Validate that at least one modifier and one key are pressed
        if (pressedModifiers.length > 0 && keys.includes(key)) {
          // Format the hotkey
          let hotkey = '';
          
          // Use CommandOrControl for cross-platform compatibility
          if (pressedModifiers.includes('Control') || pressedModifiers.includes('Command')) {
            hotkey += 'CommandOrControl';
          } else if (pressedModifiers.includes('Alt')) {
            hotkey += 'Alt';
          }
          
          if (pressedModifiers.includes('Shift')) {
            hotkey += hotkey.length > 0 ? '+Shift' : 'Shift';
          }
          
          hotkey += `+${key}`;
          
          // Update settings
          setSettings(prev => ({ ...prev, translationHotkey: hotkey }));
          setIsRecordingTranslationHotkey(false);
          
          // Remove event listener
          window.removeEventListener('keydown', handleKeyDown);
        }
      });
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Timeout to cancel recording after 5 seconds
    setTimeout(() => {
      if (isRecordingTranslationHotkey) {
        setIsRecordingTranslationHotkey(false);
        window.removeEventListener('keydown', handleKeyDown);
      }
    }, 5000);
  };

  const renderTextWithCorrections = (text, correctionsList, onCorrectionClick) => {
    if (!text || !correctionsList || correctionsList.length === 0) {
      return <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>;
    }

    let lastIndex = 0;
    const elements = [];
    const sortedCorrections = [...correctionsList].sort((a, b) => {
      // Handle cases where original might not be found
      const indexA = text.indexOf(a.original);
      const indexB = text.indexOf(b.original);
      if (indexA === -1) return 1; // Move items not found to the end
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    sortedCorrections.forEach((correction, i) => {
      if (!correction || !correction.original || !correction.suggestion) {
        console.warn('Invalid correction object found:', correction);
        return; // Skip invalid correction objects
      }
      const index = text.indexOf(correction.original);
      if (index === -1) {
        console.warn(`Original text not found for correction: ${correction.original}`);
        return; // Skip if original text is not found
      }

      // Add text before the correction
      if (index > lastIndex) {
        elements.push(
          <Typography key={`text-${i}`} component="span">
            {text.slice(lastIndex, index)}
          </Typography>
        );
      }

      // Add the correction with Tooltip
      elements.push(
        <Tooltip
          key={`correction-${i}`}
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="white" gutterBottom>
                Suggestion:
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#4ADE80',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  p: 1,
                  borderRadius: 1,
                  fontWeight: 500
                }}
              >
                {correction.suggestion}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                Click to apply
              </Typography>
            </Box>
          }
          arrow
          placement="bottom"
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: '#1F2937',
                '& .MuiTooltip-arrow': {
                  color: '#1F2937'
                },
                maxWidth: 'none'
              }
            }
          }}
        >
          <Box
            component="span"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
              cursor: 'pointer',
              padding: '2px 1px',
              borderRadius: '2px',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderBottomColor: 'rgba(239, 68, 68, 0.7)',
              },
            }}
            onClick={(e) => { 
              e.stopPropagation(); // Prevent click bubbling to parent Paper
              onCorrectionClick(correction);
            }}
          >
            {correction.original}
          </Box>
        </Tooltip>
      );

      lastIndex = index + correction.original.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <Typography key="text-end" component="span">
          {text.slice(lastIndex)}
        </Typography>
      );
    }

    return <Box sx={{ whiteSpace: 'pre-wrap' }}>{elements}</Box>;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7FAFC' }}>
      <TitleBarComponent 
        handleMinimize={handleMinimize} 
        onSettingsClick={() => setSettingsOpen(true)} 
      />

      <ContentBox>
        {!originalText ? (
          <InstructionScreen 
            settings={settings} 
            onSettingsClick={() => setSettingsOpen(true)} 
          />
        ) : (
          <Box>
            <Box sx={{ borderBottom: 'none', mb: 3 }}>
              <StyledTabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <StyledTab label="Grammar & Style" />
                <StyledTab label="Enhance & Rewrite" />
                <StyledTab label="Translate" />
              </StyledTabs>
            </Box>

            {/* Language Info Banner */}
            {languageInfo && (
                    <Chip
                      icon={<LanguageIcon />}
                label={`Detected Language: ${languageInfo.name}`}
                      color="primary"
                      sx={{ mb: 2 }}
                    />
                  )}

            {activeTab === 0 && (
              <GrammarTab 
                isChecking={isChecking}
                correctedText={correctedText}
                corrections={corrections}
                renderTextWithCorrections={renderTextWithCorrections}
                handleCopyCorrectedText={handleCopyCorrectedText}
                languageInfo={languageInfo}
                languageSpecific={languageSpecific}
                handleCorrection={handleCorrection}
              />
            )}
            {activeTab === 1 && (
              <EnhanceTab
                originalText={originalText}
                enhancedText={enhancedText}
                isEnhancing={isEnhancing}
                selectedPreset={selectedPreset}
                customTone={customTone}
                additionalContext={additionalContext}
                detectedLanguage={detectedLanguage}
                handlePresetSelect={handlePresetSelect}
                handleCopyEnhancedText={handleCopyEnhancedText}
                setCustomTone={setCustomTone}
                setAdditionalContext={setAdditionalContext}
                setNotification={setNotification}
              />
            )}
            {activeTab === 2 && (
              <TranslateTab 
                commonLanguages={commonLanguages}
                selectedTargetLang={selectedTargetLang}
                isTranslating={isTranslating}
                translationTarget={translationTarget}
                translation={translation}
                languageInfo={languageInfo}
                handleTranslate={handleTranslate}
                handleCopyTranslation={handleCopyTranslation}
              />
            )}
          </Box>
        )}
      </ContentBox>

      <SettingsDialogComponent
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onApiKeyChange={handleApiKeyChange}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        isRecordingHotkey={isRecordingHotkey}
        isRecordingTranslationHotkey={isRecordingTranslationHotkey}
        onRecordHotkeyClick={handleRecordHotkey}
        onRecordTranslationHotkeyClick={handleRecordTranslationHotkey}
        onSave={handleSettingsSave}
        platform={platform}
      />

      {/* Keep Paste Dialog and Snackbar here as they are global */}
      <Dialog 
        open={pasteDialog.open} 
        onClose={() => setPasteDialog({ open: false, text: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PasteIcon sx={{ mr: 1, color: '#6B46C1' }} />
            Ready to Paste Correction
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            The correction has been copied to your clipboard. To apply it:
          </Typography>
          <Typography variant="body1" paragraph>
            1. Click where you want to replace the text
          </Typography>
          <Typography variant="body1" paragraph>
            2. Press Cmd/Ctrl + V to paste
          </Typography>
          <Paper sx={{ p: 2, mt: 2, backgroundColor: '#F7FAFC', border: '1px solid #E2E8F0' }}>
            <Typography variant="body2" color="success.main">
              {pasteDialog.text}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasteDialog({ open: false, text: '' })} 
            sx={{
              background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #553C9A 0%, #805AD5 100%)',
              },
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notification}
        autoHideDuration={4000} // Slightly longer duration
        onClose={() => setNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification('')} 
          severity={notification.includes('Failed') || notification.includes('Error') || notification.includes('Invalid') ? 'error' : 'info'} 
          sx={{ width: '100%' }}
        >
          {notification}
        </Alert>
      </Snackbar>

      <LanguageSelector
        open={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </Box>
  );
};

module.exports = App; 