const React = require('react');
const { Box, Typography, Paper, Button } = require('@mui/material');
const { Settings: SettingsIcon, KeyboardCommandKey: KeyboardCommandKeyIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');

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

const InstructionScreen = ({ settings, onSettingsClick }) => {
  const theme = useTheme();
  
  // Format shortcut text for display
  const formatShortcut = (shortcutString) => {
    if (!shortcutString) return null;
    
    // For Mac, replace CommandOrControl with the Command key icon
    if (navigator.platform.includes('Mac') && shortcutString.includes('CommandOrControl')) {
      const parts = shortcutString.split('+');
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
          {parts.slice(1).map((part, index) => (
            <React.Fragment key={index}>
              <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
              {part.trim()}
            </React.Fragment>
          ))}
        </Box>
      );
    }
    
    // For non-Mac, replace CommandOrControl with Ctrl
    return shortcutString.replace('CommandOrControl', 'Ctrl').replace(/\+/g, ' + ');
  };
  
  // Get grammar shortcut or use default
  const grammarShortcut = settings && settings.hotkey ? 
    formatShortcut(settings.hotkey) : 
    navigator.platform.includes('Mac') ? 
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
        Shift
        <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
        C
      </Box> : 
      'Ctrl + Shift + C';
      
  // Get translation shortcut or use default
  const translationShortcut = settings && settings.translationHotkey ? 
    formatShortcut(settings.translationHotkey) : 
    navigator.platform.includes('Mac') ? 
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
        Shift
        <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
        T
      </Box> : 
      'Ctrl + Shift + T';
  
  return (
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
            1. Select and copy text using{' '}:
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
              {navigator.platform.includes('Mac') ? 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <KeyboardCommandKeyIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                  <span style={{ marginLeft: 4, marginRight: 4 }}>+</span>
                  C
                </Box> : 
                'Ctrl + C'
              }
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
            2. For grammar & style use{' '}:
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
              {grammarShortcut}
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
            3. Need translation? Use{' '}:
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
              {translationShortcut}
            </Box>
          </Typography>
        </Paper>
      </Box>

      <Button
        variant="outlined"
        onClick={onSettingsClick}
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
  );
};

module.exports = InstructionScreen; 