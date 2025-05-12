# <div align="center"><img width="32px" src="https://github.com/user-attachments/assets/6518bc67-bfe5-484b-ad5f-ed8beca1f2e1"> Spellbound's Google Chrome Extension <img width="30px" src="https://github.com/user-attachments/assets/9ed5b5ef-3f75-428b-a771-f054fc11336c">
</div>

<div align="center" style="border: 1px solid black; border-radius: 15px;">
  <p>Spellbound brings AI-powered multilingual text assistance directly into your Chrome browser. Check grammar, enhance your writing for different platforms, and translate text seamlessly, all without leaving your current webpage. 
</p>
     <p> <strong>AI writing power, everywhere you type</strong></p>

  <kbd>
    <img width="600px" src="https://github.com/user-attachments/assets/95809133-2609-4b7f-94e1-a1d784cbe4af" alt="spellbound_into"/>
  </kbd>
</div>

## Features

*   **✨ Floating action menu**: Highlight any text, and a menu pops up instantly for lightning-fast actions
*   **⌨️ Shortcut first**
*   **📝 Grammar & style check**:
    *   Spot spelling, grammar & style slip-ups right where you type
    *   Hover for language-specific tips & explanations
    *   Click to toggle fixes one by one
    *   Multilingual & always ready—no limits
    *   Language detection
*   **🔄 Enhance & rewrite**:
    *   Transform text for Twitter, LinkedIn, Instagram, Reddit & more
    *   Convert & build LLM prompt from selected text
    *   Create custom tones & add context
*   **🌍 Translation made simple**:
    *   Translate between popular languages with ease
    *   Optional notes for perfect context
    *   Set your go-to translation language
*   **⚙️ Customizable & secure**:
    *   Store your OpenAI API key locally & safely 
    *   Choose your favorite model on the fly
    *   Privacy-first: all data stays local or with OpenAI—no third parties
*   **💻 Cross-platform**: Available across platforms, including desktop applications for Mac, Windows, and Linux. Check it out [here](https://github.com/stanlee000/spellbound)

<details open><summary>
  
### 👇 Spellbound in Chrome — just toggle
</summary>
  <table>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/499cd112-db43-4600-a06e-0ec9ee9b5e6d" alt="Spellbound chrome floating action menu" width="400">
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/6c4466cd-3d7e-4889-9e9b-bf2546986031" alt="Spellbound grammar fixing" width="400">
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/cef9c03f-2843-4804-a80b-e088ee55650a" alt="Spellbound chrome floating actions counter" width="400">
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/02e23b6d-fa4c-4180-81c4-0562934224fb" alt="Spellbound grammar fixing showcase 2" width="400">
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/15002aab-9f34-485b-ae8a-4c220c176646" alt="Spellbound text enhancing" width="400">
      </td>
       <td align="center">
        <img src="https://github.com/user-attachments/assets/f8f2d724-73fd-43fe-af06-236e0a80af6c" alt="Spellbound text translation" width="400">
      </td>
    </tr>
     <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/6482dbde-32f7-44f9-b28b-e7c0edc3cf2c" alt="Spellbound Chinese translation" width="400">
      </td>
       <td align="center">
        <img src="https://github.com/user-attachments/assets/420b65da-8a70-4b25-82ec-43ffcb9f99c6" alt="Spellbound Chinese text grammar fixing" width="400">
      </td>
    </tr>
  </table>
</details>

## Installation

### From Chrome Web Store

*   [Spellbound's Google Chrome Extension](https://chromewebstore.google.com/detail/spellbound-ai-writing-ass/macnlhnblbpdidolbgehengekhnkeebb)

### From Local Source (Development)

1.  Download or clone this repository.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle in the top right corner.
4.  Click "Load unpacked" and select the `chrome-extension` directory from the cloned repository.
5.  The Spellbound icon should appear in your extensions toolbar. Pin it for easy access.
6.  Set up your shortcuts here: `chrome://extensions/shortcuts`

## Usage

### Initial Setup

1.  Click the Spellbound extension icon in your toolbar.
2.  If prompted, enter your OpenAI API key and click "Save API Key". You only need to do this once.
3.  Optionally, configure your preferred OpenAI model and default translation language via the Settings (⚙️) icon in the popup.

### Using Spellbound

1.  **Select Text**: Highlight the text you want to work with on any webpage.
2.  **Activate**:
    *   **Floating Menu**: A small Spellbound menu (logo + actions) will appear near your selection. Click an action (Grammar, Enhance, Translate).
    *   **Using Shortcuts**: Hit ```Cmd+Shift+O (Mac)``` or ```Ctrl+Shift+O (Windows/Linux)``` to open Spellbound
    *   **Context Menu** (Optional): Right-click on the selected text, navigate to the "Spellbound" menu item, and choose your desired action.
3.  **Interact**: The Spellbound popup will open with the results for your chosen action:
    *   **Grammar**: Hover over highlights for explanations, click to toggle corrections. Click the text area to copy the (potentially modified) result.
    *   **Enhance**: Select a preset, add context if needed, and click "Apply Style". The result will appear and scroll into view. Click the result to copy.
    *   **Translate**: Click a language chip. The translation appears. Click the result to copy.

## Privacy

*   Your OpenAI API key is stored securely in your browser's local storage (`chrome.storage.local`) and is **only** sent directly to the OpenAI API when you use a feature.
*   Text you select is temporarily stored in local storage to be passed to the popup and sent directly to the OpenAI API for processing.
*   Settings (selected model, default language) are stored in local storage.
*   Session caches for grammar and translation results are stored in variables within the popup's JavaScript environment and are cleared when the popup closes.
*   **This extension does not send your API key or selected text to any third-party servers other than OpenAI.** No user analytics or tracking are performed by the extension itself.
*   

## 📬 Support

Having issues? Check out our [Issues](../../issues) page or create a new issue. Add label `chrome-extension`.


## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request and add label `chrome-extension`

---

<p align="center">
Made with ❤️
</p>

<p align="center">
<a href="https://github.com/sponsors/stanlee000">Support this project</a> •
<a href="../../issues">Report Bug</a> •
<a href="../../issues">Request Feature</a>
</p>
