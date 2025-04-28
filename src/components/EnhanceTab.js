const React = require('react');
const { Box, Typography, Paper, TextField, Card, CardContent, CardActions, Button, Chip, CircularProgress } = require('@mui/material');
const { Twitter: TwitterIcon, LinkedIn: LinkedInIcon, Reddit: RedditIcon, Instagram: InstagramIcon, Code: CodeIcon, Create: CreateIcon, AutoFixHigh: MagicIcon, Language: LanguageIcon } = require('@mui/icons-material');
const { styled, useTheme } = require('@mui/material/styles');

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

const EnhanceTab = ({ 
  originalText,
  enhancedText, 
  isEnhancing, 
  selectedPreset, 
  customTone, 
  additionalContext, 
  detectedLanguage, 
  handlePresetSelect, 
  handleCopyEnhancedText, 
  setCustomTone, 
  setAdditionalContext,
  setNotification
}) => {
  const theme = useTheme();

  console.log('Rendering EnhanceTab');
  console.log('Props:', {
    originalText,
    enhancedText, 
    isEnhancing, 
    selectedPreset, 
    customTone, 
    additionalContext, 
    detectedLanguage
  });

  // Simple check for a potentially problematic prop
  if (typeof additionalContext !== 'object' || additionalContext === null) {
    console.error('EnhanceTab received invalid additionalContext prop:', additionalContext);
    // Return a fallback UI or null to prevent crashing
    return <Box><Typography color="error">Error: Invalid context data.</Typography></Box>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
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
              disabled={!originalText}
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
              disabled={!originalText}
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
              disabled={!originalText}
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
              disabled={!originalText}
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
              disabled={!originalText}
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
              disabled={!originalText}
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
              disabled={!customTone || !originalText}
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
  );
};

module.exports = EnhanceTab; 