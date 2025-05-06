const React = require('react');
const { Dialog, DialogContent, DialogActions, Button, Box, Typography, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } = require('@mui/material');
const { Close: CloseIcon, Keyboard: KeyboardIcon, Translate: TranslateIcon, KeyboardCommandKey: KeyboardCommandKeyIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');

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

const SettingsDialogComponent = ({ 
  open, 
  onClose, 
  settings, 
  onApiKeyChange, 
  availableModels, 
  onModelChange, 
  isRecordingHotkey,
  isRecordingTranslationHotkey,
  onRecordHotkeyClick,
  onRecordTranslationHotkeyClick, 
  onSave, 
  platform 
}) => {
  const theme = useTheme();

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Settings</Typography>
        <IconButton onClick={onClose} size="small">
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
            onChange={onApiKeyChange}
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
              onChange={(e) => onModelChange(e.target.value)}
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Grammar & Style Shortcut</Typography>
          <Button
            variant="outlined"
            onClick={onRecordHotkeyClick}
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
            {isRecordingHotkey ? 'Recording...' : (settings.hotkey ? 
              settings.hotkey.replace('CommandOrControl', platform === 'Mac' ? 'Cmd' : 'Ctrl').replace(/\+/g, ' + ') : 
              (platform === 'Mac' ? 'Cmd + Shift + C' : 'Ctrl + Shift + C'))}
          </Button>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Translation Shortcut</Typography>
          <Button
            variant="outlined"
            onClick={onRecordTranslationHotkeyClick}
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
            {isRecordingTranslationHotkey ? 'Recording...' : (settings.translationHotkey ? 
              settings.translationHotkey.replace('CommandOrControl', platform === 'Mac' ? 'Cmd' : 'Ctrl').replace(/\+/g, ' + ') : 
              (platform === 'Mac' ? 'Cmd + Shift + T' : 'Ctrl + Shift + T'))}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 0, mt: 4 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            color: theme.palette.text.secondary,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
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
  );
};

module.exports = SettingsDialogComponent; 