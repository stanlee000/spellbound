/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppProvider, useAppContext } from './src/contexts/AppContext';
import ApiKeyScreen from './src/screens/ApiKeyScreen';
import MainScreen from './src/screens/MainScreen';

// Main app component that determines which screen to show
const AppContent = () => {
  const { isApiKeySet } = useAppContext();
  const [isReady, setIsReady] = useState(false);
  const [showApiKeyScreen, setShowApiKeyScreen] = useState(true);

  // Short delay to ensure context is fully initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // If API key is set, don't show the API key screen
  useEffect(() => {
    if (isApiKeySet) {
      setShowApiKeyScreen(false);
    }
  }, [isApiKeySet]);

  if (!isReady) {
    return null; // Show nothing while initializing
  }

  // Show API Key screen if key is not set or showApiKeyScreen is true, otherwise show main app
  if (!isApiKeySet && showApiKeyScreen) {
    return <ApiKeyScreen onComplete={() => setShowApiKeyScreen(false)} />;
  }

  return <MainScreen />;
};

// Root component with context provider
const App = () => {
  return (
    <AppProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppContent />
    </AppProvider>
  );
};

export default App;
