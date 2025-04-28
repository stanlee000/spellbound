const React = require('react');
const { Box, Typography, IconButton } = require('@mui/material');
const { Settings: SettingsIcon, Remove: MinimizeIcon } = require('@mui/icons-material');
const { styled } = require('@mui/material/styles');

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

const TitleBarComponent = ({ handleMinimize, onSettingsClick }) => {
  return (
    <TitleBar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="img" src="assets/icon_32.png" sx={{ width: 32, height: 32 }} />
        <Typography variant="h6">Spellbound</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TitleBarButton size="small" onClick={handleMinimize}>
          <MinimizeIcon />
        </TitleBarButton>
        <TitleBarButton size="small" onClick={onSettingsClick}>
          <SettingsIcon />
        </TitleBarButton>
      </Box>
    </TitleBar>
  );
};

module.exports = TitleBarComponent; 