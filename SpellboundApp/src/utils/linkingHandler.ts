import { Linking } from 'react-native';
import { useEffect } from 'react';

/**
 * Parse URL parameters from a deep link URL
 * @param url URL string to parse
 * @returns Object with parsed parameters
 */
export const parseUrlParams = (url: string): { [key: string]: string } => {
  const params: { [key: string]: string } = {};
  try {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  } catch (error) {
    console.error('Error parsing URL parameters:', error);
  }
  
  return params;
};

/**
 * Custom hook to handle app linking
 * @param onReceiveText Callback to handle received text from deep link
 */
export const useLinkingHandler = (onReceiveText: (text: string) => void) => {
  // Handle initial URL that launched the app
  useEffect(() => {
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleUrl(initialUrl);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };
    
    getInitialURL();
    
    // Listen for new URLs while the app is running
    const linkingListener = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });
    
    return () => {
      linkingListener.remove();
    };
  }, []);
  
  // Process URL and extract text
  const handleUrl = (url: string) => {
    if (url.startsWith('spellbound://')) {
      const params = parseUrlParams(url);
      
      if (params.text) {
        onReceiveText(decodeURIComponent(params.text));
      }
    }
  };
}; 