import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import openaiService from '../services/openai';
import clipboardManager from '../utils/clipboard';

// Define types for our context state
type AppContextType = {
  apiKey: string | null;
  setApiKey: (key: string) => Promise<boolean>;
  isApiKeySet: boolean;
  availableModels: Array<{ id: string, name: string }>;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  originalText: string;
  setOriginalText: (text: string) => void;
  processedText: string;
  setProcessedText: (text: string) => void;
  isProcessing: boolean;
  clipboardText: string;
  refreshClipboard: () => Promise<void>;
  copyToClipboard: (text: string) => Promise<boolean>;
  activeTab: number;
  setActiveTab: (index: number) => void;
  languageInfo: any;
  setLanguageInfo: (info: any) => void;
  corrections: Array<{ original: string, suggestion: string }>;
  setCorrections: (corrections: Array<{ original: string, suggestion: string }>) => void;
  languageSpecificSuggestions: Array<string>;
  setLanguageSpecificSuggestions: (suggestions: Array<string>) => void;
  enhancedText: string;
  setEnhancedText: (text: string) => void;
  selectedPreset: string | null;
  setSelectedPreset: (preset: string | null) => void;
  translation: { translation: string, notes: string } | null;
  setTranslation: (translation: { translation: string, notes: string } | null) => void;
  targetLanguage: { code: string, name: string, native: string } | null;
  setTargetLanguage: (language: { code: string, name: string, native: string } | null) => void;
  commonLanguages: Array<{ code: string, name: string, native: string }>;
  checkGrammar: (text: string) => Promise<void>;
  enhanceText: (text: string, preset: string, customTone?: string, additionalContext?: string) => Promise<void>;
  translateText: (text: string, targetLanguage: string) => Promise<void>;
};

// Create context with default values
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [originalText, setOriginalText] = useState<string>('');
  const [processedText, setProcessedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [clipboardText, setClipboardText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [languageInfo, setLanguageInfo] = useState<any>(null);
  const [corrections, setCorrections] = useState<Array<{ original: string, suggestion: string }>>([]);
  const [languageSpecificSuggestions, setLanguageSpecificSuggestions] = useState<Array<string>>([]);
  const [enhancedText, setEnhancedText] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [translation, setTranslation] = useState<{ translation: string, notes: string } | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<{ code: string, name: string, native: string } | null>(null);
  const [commonLanguages, setCommonLanguages] = useState<Array<{ code: string, name: string, native: string }>>(
    openaiService.getCommonLanguages()
  );

  // Initialize app state on mount
  useEffect(() => {
    initializeApp();
    refreshClipboard();
  }, []);

  // Update OpenAI model when selected model changes
  useEffect(() => {
    openaiService.setModel(selectedModel);
  }, [selectedModel]);

  // Initialize app state
  const initializeApp = async () => {
    const isInitialized = await openaiService.initialize();
    setIsApiKeySet(isInitialized);
    
    if (isInitialized) {
      try {
        const models = await openaiService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    }
  };

  // Set API key
  const setApiKey = async (key: string): Promise<boolean> => {
    const success = await openaiService.setApiKey(key);
    if (success) {
      setApiKeyState(key);
      setIsApiKeySet(true);
      
      try {
        const models = await openaiService.getAvailableModels();
        setAvailableModels(models);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    }
    return success;
  };

  // Get clipboard text
  const refreshClipboard = async () => {
    const text = await clipboardManager.getClipboardText();
    setClipboardText(text);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    return await clipboardManager.setClipboardText(text);
  };

  // Check grammar and style
  const checkGrammar = async (text: string) => {
    try {
      setIsProcessing(true);
      const result = await openaiService.checkText(text);
      setOriginalText(text);
      setProcessedText(text);
      setLanguageInfo(result.language);
      setCorrections(result.corrections || []);
      setLanguageSpecificSuggestions(result.languageSpecific || []);
      setActiveTab(0);
    } catch (error) {
      console.error('Error checking grammar:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhance text
  const enhanceText = async (text: string, preset: string, customTone?: string, additionalContext?: string) => {
    try {
      setIsProcessing(true);
      const result = await openaiService.enhanceText({ 
        text, 
        preset, 
        customTone, 
        additionalContext 
      });
      setOriginalText(text);
      setEnhancedText(result.enhancedText || '');
      setSelectedPreset(preset);
      setActiveTab(1);
    } catch (error) {
      console.error('Error enhancing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Translate text
  const translateText = async (text: string, targetLanguageName: string) => {
    try {
      setIsProcessing(true);
      const result = await openaiService.translateText({ 
        text, 
        targetLanguage: targetLanguageName 
      });
      setOriginalText(text);
      setTranslation(result);
      setActiveTab(2);
    } catch (error) {
      console.error('Error translating text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const value = {
    apiKey,
    setApiKey,
    isApiKeySet,
    availableModels,
    selectedModel,
    setSelectedModel,
    originalText,
    setOriginalText,
    processedText,
    setProcessedText,
    isProcessing,
    clipboardText,
    refreshClipboard,
    copyToClipboard,
    activeTab,
    setActiveTab,
    languageInfo,
    setLanguageInfo,
    corrections,
    setCorrections,
    languageSpecificSuggestions,
    setLanguageSpecificSuggestions,
    enhancedText,
    setEnhancedText,
    selectedPreset,
    setSelectedPreset,
    translation,
    setTranslation,
    targetLanguage,
    setTargetLanguage,
    commonLanguages,
    checkGrammar,
    enhanceText,
    translateText
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 