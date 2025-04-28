const React = require('react');
const { Box, Typography, Paper, Chip, Stack, CircularProgress, Fade } = require('@mui/material');
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

const TranslateTab = ({ 
  commonLanguages, 
  selectedTargetLang, 
  isTranslating, 
  translationTarget, 
  translation, 
  languageInfo, 
  handleTranslate, 
  handleCopyTranslation 
}) => {
  const theme = useTheme();

  return (
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
  );
};

module.exports = TranslateTab; 