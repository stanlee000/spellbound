const React = require('react');
const { useState, useEffect } = React;
const { Box, Typography, Paper, List, ListItem, ListItemText, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert, CircularProgress, Tab, Tabs, Select, MenuItem, FormControl, InputLabel, Card, CardContent, CardActions, Tooltip, Chip, ListItemIcon, Divider, ToggleButton, ToggleButtonGroup, Fade, Stack, Checkbox } = require('@mui/material');
const { Settings: SettingsIcon, Check: CheckIcon, Close: CloseIcon, Keyboard: KeyboardIcon, KeyboardCommandKey: KeyboardCommandKeyIcon, ContentPaste: PasteIcon, AutoFixHigh: MagicIcon, Remove: MinimizeIcon, Twitter: TwitterIcon, LinkedIn: LinkedInIcon, Reddit: RedditIcon, Instagram: InstagramIcon, Code: CodeIcon, Create: CreateIcon, Refresh: RefreshIcon, Language: LanguageIcon, Translate: TranslateIcon, Info: InfoIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');
const LanguageSelector = require('./LanguageSelector');

const TitleBar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: '#FFFFFF',
  color: theme.palette.text.primary,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  WebkitAppRegion: 'drag',
  borderBottom: '1px solid #EAEAEA',
  height: '60px',
}));

const InstructionBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  gap: theme.spacing(2),
}));

const CorrectionPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: 'white',
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const MagicButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #6B46C1 0%, #9F7AEA 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(135deg, #553C9A 0%, #805AD5 100%)',
  },
}));

const HighlightedText = styled('div')(({ theme }) => ({
  '& .correction-highlight': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '0 2px',
    borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
    position: 'relative',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
    }
  },
  '& .suggestion': {
    color: theme.palette.success.main,
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: 'white',
    padding: '4px 8px',
    borderRadius: 4,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  '& .correction-highlight:hover .suggestion': {
    display: 'block',
  }
}));

const TitleBarButton = styled(IconButton)(({ theme }) => ({
  '-webkit-app-region': 'no-drag',
  color: theme.palette.text.primary,
  width: 32,
  height: 32,
  borderRadius: 16,
  '&:hover': {
    backgroundColor: '#F5F5F5',
  }
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  zIndex: 1,
  borderRadius: theme.shape.borderRadius,
  gap: theme.spacing(2)
}));

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

const PresetCard = styled(Card)(({ theme, selected }) => ({
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: selected ? '#F8F9FA' : '#FFFFFF',
  border: `1px solid ${selected ? theme.palette.primary.main : '#EAEAEA'}`,
  borderRadius: '12px',
  boxShadow: selected ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: selected ? '#F8F9FA' : '#FFFFFF',
  },
  '& .MuiCardContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiCardActions-root': {
    padding: theme.spacing(0, 2, 2),
  },
  '& .preset-icon': {
    color: selected ? theme.palette.primary.main : theme.palette.text.secondary,
    transition: 'color 0.2s ease-in-out',
    fontSize: '24px',
  },
  '& .preset-title': {
    color: selected ? theme.palette.primary.main : theme.palette.text.primary,
    transition: 'color 0.2s ease-in-out',
    fontSize: '1rem',
  },
  '& .MuiButton-root': {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 16px',
    boxShadow: 'none',
    '&:hover': {
      boxShadow: 'none',
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '& .MuiTextField-root': {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#F8F9FA',
      '&:hover': {
        backgroundColor: '#F0F2F5',
      },
      '&.Mui-focused': {
        backgroundColor: '#FFFFFF',
      },
    },
  },
}));

const ContextField = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiInputBase-root': {
    fontSize: '0.875rem',
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#F8F9FA',
    '&:hover': {
      backgroundColor: '#F0F2F5',
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px',
  },
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    padding: theme.spacing(3),
  },
}));

const StyledDialogTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
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
    model: 'gpt-4.1',
    hotkey: ''
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

  useEffect(() => {
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
      }
    });

    window.electron.ipcRenderer.invoke('load-settings').then(savedSettings => {
      if (savedSettings?.hasSeenInstructions) {
        setHasSeenInstructions(true);
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
      if (result.text) {
        setOriginalText(result.text);
        setCorrectedText(result.text);
        setEnhancedText('');
        setTranslation(null);
      }
      if (result.corrections) {
        const correctionArray = Array.isArray(result.corrections) 
          ? result.corrections 
          : (result.corrections.corrections || []);
        setCorrections(correctionArray);
        setLanguageSpecific(result.corrections.languageSpecific || []);
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
        setNotification('Failed to translate text', error);
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
  }, []);

  const loadAvailableModels = async () => {
    try {
      const models = await window.electron.ipcRenderer.invoke('get-available-models');
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
      setNotification('Failed to load available models');
    }
  };

  const handleModelChange = async (modelId) => {
    try {
      await window.electron.ipcRenderer.invoke('set-model', modelId);
      setSettings(prev => ({ ...prev, model: modelId }));
      setNotification('Model updated successfully');
    } catch (error) {
      console.error('Error setting model:', error);
      setNotification('Failed to update model');
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
      setNotification('Failed to enhance text');
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
      setCorrectedText(prev => 
        prev.replace(new RegExp(correction.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        correction.suggestion)
      );
      
      // Remove the applied correction from the list
      setCorrections(prev => prev.filter(c => c !== correction));
      
      // Show notification about pasting
      if (corrections.length <= 1) {
        // This was the last correction
        setNotification('All corrections applied! The corrected text is in your clipboard - press Ctrl+V (Cmd+V on Mac) to paste it wherever you need.');
      } else {
        setNotification('Correction applied and copied to clipboard! Click the next highlighted text to continue.');
      }
    } catch (error) {
      console.error('Error applying correction:', error);
      setNotification('Failed to apply correction');
    }
  };

  const handleGotItClick = async () => {
    setHasSeenInstructions(true);
    await window.electron.ipcRenderer.invoke('save-settings', { hasSeenInstructions: true });
    window.electron.ipcRenderer.invoke('minimize-window');
  };

  const handleDismissCorrection = (correction) => {
    setCorrections(prev => prev.filter(c => c !== correction));
  };

  const handleSettingsSave = async () => {
    await window.electron.ipcRenderer.invoke('set-api-key', settings.apiKey);
    setSettingsOpen(false);
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
      setNotification('Failed to translate text');
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

  const handleSaveSettings = async () => {
    await handleSettingsSave();
    setSettingsOpen(false);
  };

  const handleApiKeyChange = async (e) => {
    const newApiKey = e.target.value;
    setSettings(prev => ({ ...prev, apiKey: newApiKey }));
    
    // If API key is not empty, try to set it and load models
    if (newApiKey.trim()) {
      try {
        // First set the API key
        await window.electron.ipcRenderer.invoke('set-api-key', newApiKey);
        
        // Then try to load models
        const models = await window.electron.ipcRenderer.invoke('get-available-models');
        setAvailableModels(models);
        setNotification('API key verified successfully!');
      } catch (error) {
        console.error('Error loading models:', error);
        setAvailableModels([]);
        setNotification('Invalid API key. Please check and try again.');
      }
    } else {
      setAvailableModels([]);
      // Clear the API key in the main process
      await window.electron.ipcRenderer.invoke('set-api-key', '');
    }
  };

  const renderTextWithCorrections = () => {
    if (!correctedText || corrections.length === 0) {
      return <Typography variant="body1">{correctedText}</Typography>;
    }

    let lastIndex = 0;
    const elements = [];
    const sortedCorrections = [...corrections].sort((a, b) => {
      const indexA = correctedText.indexOf(a.original);
      const indexB = correctedText.indexOf(b.original);
      return indexA - indexB;
    });

    sortedCorrections.forEach((correction, i) => {
      const index = correctedText.indexOf(correction.original);
      if (index === -1) return;

      // Add text before the correction
      if (index > lastIndex) {
        elements.push(
          <Typography key={`text-${i}`} component="span">
            {correctedText.slice(lastIndex, index)}
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
            onClick={() => handleCorrection(correction)}
          >
            {correction.original}
          </Box>
        </Tooltip>
      );

      lastIndex = index + correction.original.length;
    });

    // Add remaining text
    if (lastIndex < correctedText.length) {
      elements.push(
        <Typography key="text-end" component="span">
          {correctedText.slice(lastIndex)}
        </Typography>
      );
    }

    return <Box sx={{ whiteSpace: 'pre-wrap' }}>{elements}</Box>;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F7FAFC' }}>
      <TitleBar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="img" src="assets/icon_32.png" sx={{ width: 32, height: 32 }} />
          <Typography variant="h6">Spellbound</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TitleBarButton size="small" onClick={handleMinimize}>
            <MinimizeIcon />
          </TitleBarButton>
          <TitleBarButton size="small" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon />
          </TitleBarButton>
        </Box>
      </TitleBar>

      <ContentBox>
        {!originalText ? (
          <InstructionBox>
            <Box sx={{ mb: 3 }}>
              <Box component="img" src="assets/icon_256.png" sx={{ width: 40, height: 40, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
                Welcome to Spellbound
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Your AI-powered writing assistant that helps perfect your text in seconds
              </Typography>
            </Box>
            
            <Box sx={{ width: '100%', maxWidth: 500 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  mb: 3,
                  fontSize: '1.1rem'
                }}
              >
                Get Started in 3 Simple Steps
              </Typography>
              
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 2.5, 
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #EAEAEA',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    lineHeight: 1.6
                  }}
                >
                  1. Select and copy text using{' '}
                  <Box 
                    sx={{ 
                      mx: 1,
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid',
                      borderColor: '#EAEAEA',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(107, 70, 193, 0.05)'
                    }}
                  >
                    {settings.hotkey || (navigator.platform.includes('Mac') ? 
                      <><KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }}/> + C</> : 
                      'Ctrl+C'
                    )}
                  </Box>
                </Typography>
              </Paper>
              
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 2.5,
                  backgroundColor: '#F8F9FA', 
                  border: '1px solid #EAEAEA',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    flexWrap: 'wrap',
                    gap: 0.5
                  }}
                >
                  2. For grammar & style use{' '}
                  <Box 
                    sx={{ 
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid',
                      borderColor: '#EAEAEA',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(107, 70, 193, 0.05)'
                    }}
                  >
                    {settings.hotkey || (navigator.platform.includes('Mac') ? 
                      <><KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }}/> + Shift + C</> : 
                      'Ctrl+Shift+C'
                    )}
                  </Box>
                </Typography>
              </Paper>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  mb: 2.5,
                  backgroundColor: '#F8F9FA', 
                  border: '1px solid #EAEAEA',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: theme.palette.text.primary,
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    flexWrap: 'wrap',
                    gap: 0.5
                  }}
                >
                  3. Need translation? Use{' '}
                  <Box 
                    sx={{ 
                      px: 1.5,
                      py: 0.5,
                      border: '1px solid',
                      borderColor: '#EAEAEA',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(107, 70, 193, 0.05)'
                    }}
                  >
                    {settings.hotkey || (navigator.platform.includes('Mac') ? 
                      <><KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }}/> + Shift + T</> : 
                      'Ctrl+Shift+T'
                    )}
                  </Box>
                </Typography>
              </Paper>
            </Box>

            <Button
              variant="outlined"
              onClick={() => setSettingsOpen(true)}
              startIcon={<SettingsIcon />}
              sx={{
                mt: 2,
                textTransform: 'none',
                borderRadius: 2,
                borderColor: '#EAEAEA',
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: '#F8F9FA',
                }
              }}
            >
              Configure Settings
            </Button>
          </InstructionBox>
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
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #EAEAEA',
                  borderRadius: 2,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2 
                }}
              >
                <LanguageIcon sx={{ color: '#6B46C1' }} />
                <Typography variant="body1" sx={{ color: '#1A1A1A', fontWeight: 500 }}>
                  {languageInfo.name} ({languageInfo.native})
                </Typography>
              </Paper>
            )}

            {activeTab === 0 ? (
              // Grammar & Style tab
              <Box>
                {/* Language-specific suggestions */}
                {languageSpecific.length > 0 && (
                  <Paper sx={{ p: 2, mb: 3, backgroundColor: 'white' }}>
                    <Typography variant="h6" gutterBottom>
                      Language-Specific Suggestions
                    </Typography>
                    <List>
                      {languageSpecific.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <InfoIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Corrections UI */}
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Click on the highlighted text below to apply each suggestion. The corrected text will be automatically copied to your clipboard.
                  </Typography>
                  <Paper 
                    sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, position: 'relative', cursor: 'pointer' }}
                    onClick={handleCopyCorrectedText}
                  >
                    {isChecking ? (
                      <LoadingOverlay>
                        <CircularProgress size={32} sx={{ color: theme.palette.text.primary }} />
                        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                          Checking your text...
                        </Typography>
                      </LoadingOverlay>
                    ) : (
                      <>
                        {renderTextWithCorrections()}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                          Click anywhere to copy the entire text
                        </Typography>
                      </>
                    )}
                  </Paper>
                </Box>
              </Box>
            ) : activeTab === 1 ? (
              // Enhance & Rewrite tab
              <Box>
                <Box sx={{ mb: 3 }}>
                  {detectedLanguage && (
                    <Chip
                      icon={<LanguageIcon />}
                      label={`Detected Language: ${detectedLanguage.toUpperCase()}`}
                      color="primary"
                      sx={{ mb: 2 }}
                    />
                  )}
                  <Typography variant="body1" gutterBottom>
                    Select a preset or customize how you want to enhance your text:
                  </Typography>
                </Box>

                {enhancedText && (
                  <Paper 
                    sx={{ 
                      p: 3, 
                      backgroundColor: 'white', 
                      borderRadius: 2, 
                      position: 'relative', 
                      mb: 3,
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#F8FAFC'
                      }
                    }}
                    onClick={handleCopyEnhancedText}
                  >
                    <Typography 
                      variant="body1" 
                      paragraph 
                      sx={{ 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      {enhancedText}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 2,
                        textAlign: 'center',
                        borderTop: '1px solid #E2E8F0',
                        pt: 2
                      }}
                    >
                      Click to copy the enhanced text
                    </Typography>
                  </Paper>
                )}


                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: 2, 
                  mb: 3 
                }}>
                  <PresetCard selected={selectedPreset === 'twitter'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <TwitterIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>X (Twitter)</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Transform your text into an engaging tweet with hashtags.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add requirements"
                        value={additionalContext.twitter}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          twitter: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('twitter')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Style
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'linkedin'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <LinkedInIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>LinkedIn</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Craft a professional post focused on business value and industry insights.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add industry focus"
                        value={additionalContext.linkedin}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          linkedin: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('linkedin')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Style
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'instagram'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <InstagramIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>Instagram</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Create an authentic and engaging post that resonates with your audience.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add content theme"
                        value={additionalContext.instagram}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          instagram: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('instagram')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Style
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'hackernews'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CodeIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>Hacker News</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Optimize for technical accuracy and analytical depth with objective analysis.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add technical focus"
                        value={additionalContext.hackernews}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          hackernews: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('hackernews')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Style
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'reddit'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <RedditIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>Reddit</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Format your text in a conversational style with clear structure and readability.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add subreddit context"
                        value={additionalContext.reddit}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          reddit: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('reddit')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Style
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'promptBuilder'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <MagicIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>Prompt Builder</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Transform your text into a well-structured LLM prompt following best practices.
                      </Typography>
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add requirements"
                        value={additionalContext.promptBuilder}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          promptBuilder: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('promptBuilder')}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Build Prompt
                      </Button>
                    </CardActions>
                  </PresetCard>

                  <PresetCard selected={selectedPreset === 'custom'}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <CreateIcon className="preset-icon" sx={{ mr: 1 }} />
                        <Typography variant="h6" className="preset-title" sx={{ fontWeight: 600 }}>Custom Style</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: '32px', fontSize: '0.8rem' }}>
                        Define your own tone and style for the text enhancement.
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        label="Desired tone"
                        placeholder="e.g., formal, casual"
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                      <ContextField
                        fullWidth
                        size="small"
                        label="Additional context"
                        placeholder="Add requirements"
                        value={additionalContext.custom}
                        onChange={(e) => setAdditionalContext(prev => ({
                          ...prev,
                          custom: e.target.value
                        }))}
                        multiline
                        rows={2}
                        InputProps={{
                          style: { fontSize: '0.8rem' }
                        }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={() => handlePresetSelect('custom')}
                        disabled={!customTone}
                        sx={{
                          fontSize: '0.8rem'
                        }}
                      >
                        Apply Custom Style
                      </Button>
                    </CardActions>
                  </PresetCard>
                </Box>

                {isEnhancing && (
                  <LoadingOverlay>
                    <CircularProgress size={32} sx={{ color: theme.palette.text.primary }} />
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                      Enhancing your text...
                    </Typography>
                  </LoadingOverlay>
                )}
              </Box>
            ) : (
              // Translation tab
              <Box>
                <Typography variant="body1" gutterBottom>
                  Select a language to translate your text:
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  {commonLanguages.map((lang) => (
                    <Chip
                      key={lang.code}
                      label={`${lang.name} (${lang.native})`}
                      onClick={() => handleTranslate(lang)}
                      color={selectedTargetLang?.code === lang.code ? "primary" : "default"}
                      disabled={isTranslating || lang.code === languageInfo?.code}
                    />
                  ))}
                </Stack>

                {isTranslating && (
                  <Box sx={{ textAlign: 'center', my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={32} sx={{ color: theme.palette.text.primary }} />
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                      Translating to {translationTarget}...
                    </Typography>
                  </Box>
                )}

                {translation && (
                  <Fade in>
                    <Box>
                      <Paper 
                        sx={{ 
                          p: 3, 
                          backgroundColor: 'white', 
                          borderRadius: 2, 
                          cursor: 'pointer',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: '#F8FAFC'
                          }
                        }}
                        onClick={handleCopyTranslation}
                      >
                        <Typography 
                          variant="body1" 
                          paragraph
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.8,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                          }}
                        >
                          {translation.translation}
                        </Typography>
                        {translation.notes && (
                          <Box sx={{ 
                            mt: 2, 
                            p: 2, 
                            backgroundColor: 'rgba(107, 70, 193, 0.1)', 
                            borderRadius: 1,
                            border: '1px solid rgba(107, 70, 193, 0.2)'
                          }}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1 
                              }}
                            >
                              <InfoIcon fontSize="small" color="primary" />
                              <strong>Translation Notes:</strong> {translation.notes}
                            </Typography>
                          </Box>
                        )}
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 2,
                            textAlign: 'center',
                            borderTop: '1px solid #E2E8F0',
                            pt: 2
                          }}
                        >
                          Click to copy the translation
                        </Typography>
                      </Paper>
                    </Box>
                  </Fade>
                )}
              </Box>
            )}
          </Box>
        )}
      </ContentBox>

      <StyledDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <StyledDialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Settings</Typography>
          <IconButton onClick={() => setSettingsOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>OpenAI API Key</Typography>
            <TextField
              fullWidth
              type="password"
              value={settings.apiKey}
              onChange={handleApiKeyChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#F8F9FA',
                }
              }}
            />
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              To get your API key, visit your{' '}
              <a href="https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key" target="_blank" rel="noopener noreferrer">OpenAI account settings</a>
              . Your API key will be used securely to access OpenAI's services.
            </Typography>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Select the AI model to use for text processing
            </Typography>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Model</InputLabel>
              <Select
                value={settings.model}
                onChange={(e) => handleModelChange(e.target.value)}
                label="Model"
              >
                {availableModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
                  </MenuItem>
                ))}
              </Select>
              <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ mt: 1, display: 'block' }}
            >
              Recommended: gpt-4o or gpt-4.1
            </Typography>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Shortcut Key</Typography>
            <Button
              variant="outlined"
              onClick={() => setIsRecordingHotkey(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                borderColor: '#EAEAEA',
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: '#F8F9FA',
                }
              }}
            >
              {isRecordingHotkey ? 'Recording...' : (settings.hotkey || 'Click to record')}
            </Button>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Available Hotkeys</Typography>
            <Paper sx={{ p: 2, backgroundColor: '#F8F9FA', borderRadius: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <KeyboardIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Shift+C`}
                    secondary="For grammar & style use"
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemIcon>
                    <TranslateIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Shift+T`}
                    secondary="Translations shortcut"
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 0, mt: 4 }}>
          <Button
            onClick={() => setSettingsOpen(false)}
            sx={{
              textTransform: 'none',
              color: theme.palette.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSettingsSave}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </StyledDialog>

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
          <MagicButton onClick={() => setPasteDialog({ open: false, text: '' })}>
            Got it
          </MagicButton>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotification('')} severity="info" sx={{ width: '100%' }}>
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