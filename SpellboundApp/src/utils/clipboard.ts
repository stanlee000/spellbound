import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Utility class for handling clipboard operations
 */
class ClipboardManager {
  /**
   * Get text from clipboard
   * @returns {Promise<string>} Clipboard content
   */
  async getClipboardText(): Promise<string> {
    try {
      return await Clipboard.getString();
    } catch (error) {
      console.error('Error getting clipboard text:', error);
      return '';
    }
  }

  /**
   * Set text to clipboard
   * @param {string} text - Text to copy to clipboard
   * @returns {Promise<boolean>} Success status
   */
  async setClipboardText(text: string): Promise<boolean> {
    try {
      Clipboard.setString(text);
      return true;
    } catch (error) {
      console.error('Error setting clipboard text:', error);
      return false;
    }
  }
}

// Export as singleton
export default new ClipboardManager(); 