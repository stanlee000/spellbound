const React = require('react');
const { useEffect, useState } = React;
const { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Typography, Box } = require('@mui/material');
const { KeyboardCommandKey: KeyboardCommandKeyIcon } = require('@mui/icons-material');
const { styled } = require('@mui/material/styles');

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    width: '400px',
    maxWidth: '90vw',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '8px',
  }
}));

const ShortcutText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginLeft: theme.spacing(1),
  display: 'flex', 
  alignItems: 'center',
  padding: '2px 6px',
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  borderRadius: '4px',
  fontSize: '0.85rem',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lineHeight: 1.6
}));

const languages = {
  'E': { code: 'en', name: 'English', native: 'English' },
  'P': { code: 'pl', name: 'Polish', native: 'Polski' },
  'C': { code: 'zh', name: 'Chinese', native: '中文' },
  'G': { code: 'de', name: 'German', native: 'Deutsch' },
  'F': { code: 'fr', name: 'French', native: 'Français' },
  'S': { code: 'es', name: 'Spanish', native: 'Español' },
  'R': { code: 'ru', name: 'Russian', native: 'Русский' },
  'I': { code: 'it', name: 'Italian', native: 'Italiano' },
  'J': { code: 'ja', name: 'Japanese', native: '日本語' },
  'H': { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  'A': { code: 'ar', name: 'Arabic', native: 'العربية' },
  'T': { code: 'pt', name: 'Portuguese', native: 'Português' },
};

function LanguageSelector({ open, onClose }) {
  const [timeLeft, setTimeLeft] = useState(3);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? <KeyboardCommandKeyIcon sx={{ fontSize: 14 }}/> : 'Ctrl';

  const handleTranslation = async (language) => {
    try {
      // Ensure we're on the translation tab
      window.electron.ipcRenderer.invoke('set-active-tab', 2);
      
      // Trigger translation
      await window.electron.ipcRenderer.invoke('translate-with-language', {
        language
      });
      
      onClose();
      onClose();
    } catch (error) {
      console.error('Translation error:', error);
    }
  };

  useEffect(() => {
    if (!open) return;

    setTimeLeft(10);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if ((e.metaKey || e.ctrlKey) && languages.hasOwnProperty(key)) {
        e.preventDefault();
        handleTranslation(languages[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <StyledDialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { 
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Select Target Language ({cmdKey} + Key)
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Closes in {timeLeft}s
        </Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          {Object.entries(languages).map(([key, language]) => (
            <ListItem 
              key={key} 
              onClick={() => handleTranslation(language)}
              sx={{
                py: 1,
                px: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: 1,
                }
              }}
            >
              <ListItemText 
                primary={language.name}
                sx={{ '& .MuiTypography-root': { fontWeight: 500 } }}
              />
              <ShortcutText>
                {cmdKey} + {key}
              </ShortcutText>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </StyledDialog>
  );
}

module.exports = LanguageSelector; 