const React = require('react');
const { Dialog, DialogContent, DialogActions, Button, Box, Typography, IconButton, TextField, FormControl, InputLabel, Select, MenuItem, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } = require('@mui/material');
const { Close: CloseIcon, Keyboard: KeyboardIcon, Translate: TranslateIcon } = require('@mui/icons-material');
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
  onRecordHotkeyClick, 
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
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>Shortcut Key</Typography>
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
                  primary={`${platform === 'Mac' ? 'Cmd' : 'Ctrl'}+Shift+C`}
                  secondary="For grammar & style use"
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem>
                <ListItemIcon>
                  <TranslateIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={`${platform === 'Mac' ? 'Cmd' : 'Ctrl'}+Shift+T`}
                  secondary="Translations shortcut"
                />
              </ListItem>
            </List>
          </Paper>
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