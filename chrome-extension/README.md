# Spellbound Chrome Extension

Spellbound brings powerful AI text assistance directly into your Chrome browser. Check grammar, enhance your writing for different platforms, and translate text seamlessly using OpenAI's models, all without leaving your current webpage.

## Key Features

*   **Floating Action Menu**: Select text on any page, and a discreet menu appears nearby for quick actions.
*   **Grammar & Style Check**:
    *   Identifies spelling, grammar, and style issues.
    *   Provides explanations on hover.
    *   Click suggestions to toggle corrections individually.
    *   Includes language-specific suggestions.
    *   Results are cached per session for the same text.
*   **Enhance & Rewrite**:
    *   Adapt text using presets (Twitter, LinkedIn, Instagram, Hacker News, Reddit, Academic, Prompt Builder).
    *   Define custom tones and provide additional context.
    *   Results automatically scroll into view.
*   **Translation**:
    *   Translate text between common languages.
    *   Includes optional translation notes for context.
    *   Set a default translation language in settings.
    *   Translations are cached per session for the same text and language.
*   **Customizable Settings**:
    *   Securely store your OpenAI API key locally.
    *   Select your preferred GPT-4 model (options fetched dynamically).
    *   Configure default translation language.
*   **Privacy Focused**: Your API key and selected text are processed locally or sent directly to OpenAI, never to third-party servers. Cache is stored locally.

## Installation

### From Local Source (Development)

1.  Download or clone this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle in the top right corner.
4.  Click "Load unpacked" and select the `chrome-extension` directory from the cloned repository.
5.  The Spellbound icon should appear in your extensions toolbar. Pin it for easy access.

### From Chrome Web Store (Planned)

*   Once published, you will be able to install directly from the Chrome Web Store. (Link TBD)

## Usage

### Initial Setup

1.  Click the Spellbound extension icon in your toolbar.
2.  If prompted, enter your OpenAI API key and click "Save API Key". You only need to do this once.
3.  Optionally, configure your preferred OpenAI model and default translation language via the Settings (⚙️) icon in the popup.

### Using Spellbound

1.  **Select Text**: Highlight the text you want to work with on any webpage.
2.  **Activate**:
    *   **Floating Menu**: A small Spellbound menu (logo + actions) will appear near your selection. Click an action (Grammar, Enhance, Translate).
    *   **Context Menu** (Optional): Right-click on the selected text, navigate to the "Spellbound" menu item, and choose your desired action.
3.  **Interact**: The Spellbound popup will open with the results for your chosen action:
    *   **Grammar**: Hover over highlights for explanations, click to toggle corrections. Click the text area to copy the (potentially modified) result.
    *   **Enhance**: Select a preset, add context if needed, and click "Apply Style". The result will appear and scroll into view. Click the result to copy.
    *   **Translate**: Click a language chip. The translation appears. Click the result to copy.

## Preparing for Chrome Web Store Publication

Publishing requires several steps beyond the code itself:

1.  **Manifest V3 Compliance**: Ensure `manifest.json` adheres to all V3 requirements (this version appears to be targeting V3).
2.  **Store Listing Assets**:
    *   **Icons**: Provide icons in required sizes (e.g., 16x16, 32x32, 48x48, 128x128) for the store listing and extension toolbar. Ensure these are declared correctly in `manifest.json`.
    *   **Screenshots**: Create high-quality screenshots (1280x800 or 640x400) showcasing key features (e.g., floating menu in action, grammar corrections, enhance presets, translation tab, settings dialog).
    *   **Promotional Tiles**: Optional, but recommended (small 440x280, large 920x680, marquee 1400x560).
    *   **Compelling Description**: Write clear, concise, and keyword-rich descriptions for the store listing (short and full).
3.  **Privacy Policy**:
    *   Create a publicly accessible URL hosting a clear privacy policy.
    *   This policy must detail:
        *   What data is collected (e.g., API key, selected text temporarily, settings).
        *   How data is stored (locally using `chrome.storage.local`).
        *   How data is used (sent directly to OpenAI API, not stored/shared elsewhere).
        *   Compliance with Chrome Web Store policies, especially regarding user data privacy.
    *   Add the URL to the designated field in the Chrome Developer Dashboard during submission.
4.  **Testing**: Thoroughly test the extension across different websites and scenarios to catch bugs.
5.  **Packaging**: Create a `.zip` file containing only the contents of the `chrome-extension` directory (do not zip the parent folder).
6.  **Developer Account**: Register for a Chrome Web Store developer account (requires a one-time fee).
7.  **Submission**: Upload the `.zip` file via the Chrome Developer Dashboard, fill in all listing details (description, assets, privacy policy URL, category, etc.), and submit for review. Review times can vary.

## Development & Customization

### File Structure

```
chrome-extension/
│
├── manifest.json         # Extension configuration (Manifest V3)
├── background.js         # Service worker: context menus, message handling, popup opening
├── contentScript.js      # Injects into pages: text selection handling, floating menu logic
├── contentScript.css     # Styles specific to the floating menu injected into pages
├── popup.html            # UI structure for the extension's popup window
├── popup.js              # UI logic for the popup, API calls, settings management
├── popup.css             # Styles for the popup window UI
├── README.md             # This file
└── icons/                # Extension icons (ensure required sizes are present)
```

### Building

No explicit build step is required for local loading. For distribution, simply zip the contents of the `chrome-extension` directory.

### Maintenance Considerations

*   **Updates**: Once published, updates are pushed by uploading a new version (with an incremented `version` in `manifest.json`) to the Developer Dashboard. Chrome handles automatic updates for users.
*   **Feedback**: Monitor user reviews on the Chrome Web Store. Consider setting up a public issue tracker (e.g., GitHub Issues) and linking to it from the store listing or a support URL for bug reports and feature requests.
*   **API Changes**: Keep track of changes to the OpenAI API and Chrome Extension APIs (especially Manifest V3) and update the extension accordingly.
*   **Documentation**: Keep this README updated with new features or changes.

## Privacy

*   Your OpenAI API key is stored securely in your browser's local storage (`chrome.storage.local`) and is **only** sent directly to the OpenAI API when you use a feature.
*   Text you select is temporarily stored in local storage to be passed to the popup and sent directly to the OpenAI API for processing.
*   Settings (selected model, default language) are stored in local storage.
*   Session caches for grammar and translation results are stored in variables within the popup's JavaScript environment and are cleared when the popup closes.
*   **This extension does not send your API key or selected text to any third-party servers other than OpenAI.** No user analytics or tracking are performed by the extension itself.

## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (You should add a LICENSE file with the MIT text). 