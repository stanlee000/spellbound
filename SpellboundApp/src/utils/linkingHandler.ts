import { Linking } from 'react-native';
import { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

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
 * Custom hook to handle deep linking
 * @param onReceiveText - Callback for when text is received from a deep link
 */
export const useLinkingHandler = (onReceiveText?: (text: string) => void) => {
  const { 
    checkGrammar, 
    enhanceText, 
    translateText, 
    setActiveTab 
  } = useAppContext();

  // Handle deep links
  const handleDeepLink = (url: string) => {
    const route = url.replace(/.*?:\/\//g, '');
    const routeParts = route.split('/');
    
    if (routeParts[0] === 'grammar') {
      setActiveTab(0);
      // Extract text from link if available
      if (routeParts.length > 1) {
        const text = decodeURIComponent(routeParts[1]);
        checkGrammar(text);
        if (onReceiveText) onReceiveText(text);
      }
    } else if (routeParts[0] === 'enhance') {
      setActiveTab(1);
      // Extract text and preset if available
      if (routeParts.length > 1) {
        const text = decodeURIComponent(routeParts[1]);
        const preset = routeParts.length > 2 ? routeParts[2] : 'general';
        enhanceText(text, preset);
        if (onReceiveText) onReceiveText(text);
      }
    } else if (routeParts[0] === 'translate') {
      setActiveTab(2);
      // Extract text and target language if available
      if (routeParts.length > 1) {
        const text = decodeURIComponent(routeParts[1]);
        const targetLanguage = routeParts.length > 2 ? routeParts[2] : 'English';
        translateText(text, targetLanguage);
        if (onReceiveText) onReceiveText(text);
      }
    } else if (routeParts[0] === 'text') {
      // Generic text sharing
      if (routeParts.length > 1) {
        const text = decodeURIComponent(routeParts[1]);
        if (onReceiveText) onReceiveText(text);
      }
    }
  };

  useEffect(() => {
    // Handle deep link when app is already open
    const linkingEventListener = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep link when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      linkingEventListener.remove();
    };
  }, []);
}; 