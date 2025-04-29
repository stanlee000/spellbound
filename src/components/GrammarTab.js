const React = require('react');
const { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, CircularProgress, Tooltip } = require('@mui/material');
const { Info: InfoIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');

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

const GrammarTab = ({ 
  isChecking, 
  correctedText, 
  corrections, 
  renderTextWithCorrections, 
  handleCopyCorrectedText, 
  languageInfo, 
  languageSpecific, 
  handleCorrection 
}) => {
  const theme = useTheme();

  return (
    <Box>
      
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
              {renderTextWithCorrections(correctedText, corrections, handleCorrection)}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                Click anywhere to copy the entire text
              </Typography>
            </>
          )}
        </Paper>
      </Box>

      {/* Language-specific suggestions */}
      {languageSpecific.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'white', mt: 2, borderRadius: 2 }}>
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
    </Box>
  );
};

module.exports = GrammarTab; 