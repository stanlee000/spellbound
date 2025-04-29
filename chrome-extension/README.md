# Spellbound Chrome Extension

A Chrome extension that brings the functionality of the Spellbound desktop app to your browser, allowing you to easily check grammar, enhance text, and translate content from any webpage.

## Features

- **Grammar & Style Check**: Correct grammar errors and improve writing style
- **Enhance & Rewrite**: Transform text for different platforms and purposes using presets
- **Translation**: Translate text to multiple languages with contextual notes

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the `chrome-extension` directory
5. The Spellbound extension should now be installed and visible in your extensions toolbar

## Usage

### API Key Setup

1. When you first open the extension, you'll be prompted to enter your OpenAI API key
2. Enter your API key and click "Save API Key"
3. Your API key is stored locally and is only used to communicate with OpenAI

### Text Selection

There are two ways to use Spellbound:

1. **Context Menu**:
   - Select text on any webpage
   - Right-click and choose "Spellbound" 
   - Select the action you want to perform (Grammar check, Enhance, or Translate)

2. **Floating Button**:
   - Select text on any webpage
   - A small "S" button will appear near your selection
   - Click the button to open the Spellbound popup

### Features Usage

#### Grammar & Style

- After selecting text and opening the Grammar tab, your text will be automatically checked
- Click on highlighted suggestions to see more details
- Click anywhere on the corrected text to copy it to your clipboard

#### Enhance & Rewrite

- Select a preset (Twitter, LinkedIn, Academic, or Custom)
- Add any additional context if needed
- The enhanced text will be generated and displayed
- Click anywhere on the result to copy it to your clipboard

#### Translate

- Select a target language from the available chips
- The translation will be generated along with any relevant notes
- Click anywhere on the result to copy it to your clipboard

## Development

### File Structure

```
chrome-extension/
│
├── manifest.json         # Extension configuration
├── background.js         # Background script for context menu and message handling
├── contentScript.js      # Content script for text selection and floating button
├── contentScript.css     # Styles for the floating button
├── popup.html            # HTML structure for the extension popup
├── popup.js              # JavaScript for popup functionality and API calls
├── popup.css             # Styles for the popup UI
└── icons/                # Extension icons in various sizes
```

### Customization

You can customize the extension by:

- Modifying the presets in `popup.js`
- Adding more language options for translation
- Changing the UI themes in `popup.css`

## Privacy

- Your API key and text selections are stored locally and not transmitted to any servers other than OpenAI
- No user data is collected or shared with third parties 