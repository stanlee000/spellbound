# <div align="center"><img width="32px" src="https://github.com/user-attachments/assets/6518bc67-bfe5-484b-ad5f-ed8beca1f2e1"> Spellbound's Safari Extension <img width="50px" src="https://github.com/user-attachments/assets/1e1fcd4d-8c37-4ec8-ab64-498af7fd292d"></div>

<div align="center" style="border: 1px solid black; border-radius: 15px;">
  <p>Spellbound brings AI-powered multilingual text assistance directly into your Safari browser. Check grammar, enhance your writing for different platforms, and translate text seamlessly, all without leaving your current webpage.
</p>
  <p><strong>AI writing power, everywhere you type in Safari</strong></p>

  <kbd>
    <img width="600px" src="https://github.com/user-attachments/assets/95809133-2609-4b7f-94e1-a1d784cbe4af" alt="spellbound_intro"/>
  </kbd>
</div>

## Features

*   **✨ Floating action menu**: Highlight any text, and a menu pops up instantly for lightning-fast actions
*   **⌨️ Shortcut first** approach for maximum efficiency
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
*   **💻 Cross-platform**: Available across platforms, including desktop applications for Mac, Windows, and Linux and browser extensions. Check out the [main project](https://github.com/stanlee000/spellbound) or [Chrome extension](https://github.com/stanlee000/spellbound/tree/main/chrome-extension).

<details open><summary>
  
### 👇 Spellbound in Chrome — just toggle
</summary>
  <table>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/499cd112-db43-4600-a06e-0ec9ee9b5e6d" alt="Spellbound chrome floating action menu" width="400">
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/cef9c03f-2843-4804-a80b-e088ee55650a" alt="Spellbound chrome floating actions counter" width="400">
      </td>
    </tr>
    <tr>
       <td align="center">
        <img src="https://github.com/user-attachments/assets/e3eec8ca-13df-413e-ae7f-fcfa7dfa4acd" alt="Spellbound grammar fixing" width="400">
      </td>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/a9f28afc-0568-41c8-887e-cc34a8015eee" alt="Spellbound grammar fixing showcase 2" width="400">
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/3ccdc8e0-846e-4a27-93b7-25f55085707f" alt="Spellbound text enhancing" width="400">
      </td>
       <td align="center">
        <img src="https://github.com/user-attachments/assets/664c45e7-2fb4-46df-af5d-484e326db1f2" alt="Spellbound text translation" width="400">
      </td>
    </tr>
     <tr>
      <td align="center">
        <img src="https://github.com/user-attachments/assets/f1a062e4-3825-400a-9878-7020e5881d03" alt="Spellbound Chinese translation" width="400">
      </td>
       <td align="center">
        <img src="https://github.com/user-attachments/assets/5d924df6-6f9f-42c3-849a-f5af802d4300" alt="Spellbound Chinese text grammar fixing" width="400">
      </td>
    </tr>
  </table>
</details>

## Installation

### Installing the Safari Extension

1. **Download the Extension**:
   - Download the latest `spellbound-safari-extension_{version}.app` file from the [Releases](../../releases) section.

2. **Install the App**:
   - Open the downloaded file.
   - Drag the app to your Applications folder.
   - Launch the app.

3. **Enable in Safari**:
   - When prompted, click "Enable Safari Extension"
   - Or go to Safari → Preferences → Extensions and enable "Spellbound"
   - Give the required permissions when prompted

4. **Pin the Extension** (Optional):
   - In Safari, click the Extensions button in the toolbar
   - Pin Spellbound for easy access

### Building from Source (For Developers)

If you prefer to build the extension yourself:

1. Clone this repository
2. Open the `.xcodeproj` file in Xcode
3. Build and run the project
4. Enable the extension in Safari's preferences

## Usage

### Initial Setup

1. Click the Spellbound extension icon in your Safari toolbar.
2. Enter your OpenAI API key and click "Save API Key". You only need to do this once.
3. Optionally, configure your preferred OpenAI model and default translation language via the Settings (⚙️) icon.

### Using Spellbound

1. **Select Text**: Highlight any text on a webpage.
2. **Activate**:
   - **Floating Menu**: A small Spellbound menu will appear near your selection. Click an action (Grammar, Enhance, Translate).
   - **Using Shortcuts**: Hit `Cmd+Shift+O` to open Spellbound
   - **Context Menu**: Right-click on selected text, navigate to the "Spellbound" menu, and choose your action.
   
3. **Interact** with the results:
   - **Grammar**: Hover over highlights for explanations, click to toggle corrections. Click the text area to copy.
   - **Enhance**: Select a preset, add context if needed, and click "Apply Style". Click the result to copy.
   - **Translate**: Click a language chip to translate. Click the result to copy.

## Safari-Specific Notes

- This extension works exclusively on macOS with Safari.
- The extension is packaged as a macOS app that contains the Safari extension.

## Privacy

- Your OpenAI API key is stored securely in your browser's local storage and is **only** sent directly to the OpenAI API.
- Text you select is temporarily stored and processed only when you use the extension features.
- **No data is sent to third-party servers** other than OpenAI for processing.
- No user analytics or tracking are performed by the extension.

## 📬 Support

Having issues? Check out our [Issues](../../issues) page or create a new issue. Add label `safari-extension`.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request and add label `safari-extension`

---

<p align="center">
Made with ❤️
</p>

<p align="center">
<a href="https://github.com/sponsors/stanlee000">Support this project</a> •
<a href="../../issues">Report Bug</a> •
<a href="../../issues">Request Feature</a>
</p> 
