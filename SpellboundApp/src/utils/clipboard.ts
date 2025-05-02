import Clipboard from '@react-native-clipboard/clipboard';

/**
 * Utility class for handling clipboard operations
 */
const clipboardManager = {
  /**
   * Get text from clipboard
   * @returns {Promise<string>} Text from clipboard
   */
  getClipboardText: async (): Promise<string> => {
    try {
      const text = await Clipboard.getString();
      return text || '';
    } catch (error) {
      console.error('Error getting clipboard text:', error);
      return '';
    }
  },

  /**
   * Set text to clipboard
   * @param {string} text - Text to set to clipboard
   * @returns {Promise<boolean>} Success status
   */
  setClipboardText: async (text: string): Promise<boolean> => {
    try {
      Clipboard.setString(text);
      return true;
    } catch (error) {
      console.error('Error setting clipboard text:', error);
      return false;
    }
  }
};

export default clipboardManager; 