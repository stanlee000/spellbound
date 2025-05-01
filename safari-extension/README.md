# Spellbound Safari Extension

This is the Safari version of the Spellbound AI Writing Assistant, converted from the Chrome extension.

## Features

Identical to the Chrome version, Spellbound for Safari offers:

* **✨ Floating action menu**: Highlight any text, and a menu pops up instantly for lightning-fast actions
* **⌨️ Shortcut first** approach for efficient workflow
* **📝 Grammar & style check**
* **🔄 Enhance & rewrite**
* **🌍 Translation**
* **⚙️ Customizable & secure**

## Installation Instructions

### Local Development (No Apple Developer Account)

1. Clone this repository
2. Open the `spellbound-safari.xcodeproj` file in Xcode
3. In the Xcode project settings:
   - Select both the app and extension targets
   - Go to "Signing & Capabilities"
   - Check "Automatically manage signing"
   - For local testing: Select "Sign to Run Locally" or your Personal Team
4. Build and run the project (⌘+R)
5. Safari will launch with the extension
6. In Safari, open Preferences > Extensions and enable "Spellbound Safari"

### Distribution with Apple Developer Account

If you have an Apple Developer account ($99/year):

1. Open the project in Xcode
2. Configure both targets with your Developer Team
3. Build an archive (Product > Archive)
4. Distribute through App Store Connect

## Browser Compatibility

This extension is specifically built for Safari on macOS. 

## Differences from Chrome Version

* The extension is packaged as a native macOS app
* The `clipboardRead` permission has been removed as it's not supported in Safari
* A fallback clipboard method is used when the Clipboard API isn't available

## Development Notes

This extension was converted from the Chrome version using Apple's `safari-web-extension-converter` tool:

```bash
xcrun safari-web-extension-converter /path/to/chrome-extension --macos-only --swift --app-name spellbound-safari --copy-resources
```

## Troubleshooting

### Common Issues

* **Code signing errors**: Make sure both the app and extension targets use the same signing identity
* **Extension not appearing in Safari**: Check Safari > Preferences > Extensions to ensure it's enabled
* **Permission warnings**: Some Chrome permissions don't have direct equivalents in Safari

## License

Same license as the Chrome version of Spellbound. 