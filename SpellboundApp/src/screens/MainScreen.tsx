import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  StatusBar
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import GrammarTab from '../components/GrammarTab';
import EnhanceTab from '../components/EnhanceTab';
import TranslateTab from '../components/TranslateTab';
import { useLinkingHandler } from '../utils/linkingHandler';
import openaiService from '../services/openai';
import AppIcon from '../assets/icon';

// Icons (you would normally use a library like react-native-vector-icons)
const TabIconGrammar = () => <Text style={styles.tabIcon}>✓</Text>;
const TabIconEnhance = () => <Text style={styles.tabIcon}>✨</Text>;
const TabIconTranslate = () => <Text style={styles.tabIcon}>🌐</Text>;
const TabIconSettings = () => <Text style={styles.tabIcon}>⚙️</Text>;

const MainScreen: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    originalText,
    setOriginalText,
    clipboardText,
    refreshClipboard,
    checkGrammar,
    isProcessing,
    isApiKeySet,
    selectedModel,
    setApiKey,
    languageInfo
  } = useAppContext();

  const [textInput, setTextInput] = useState('');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showIntroScreen, setShowIntroScreen] = useState(false);

  // Initialize with clipboard text if available
  useEffect(() => {
    if (clipboardText && !originalText) {
      setTextInput(clipboardText);
    }
    
    // If no text is processed yet, show the intro screen
    setShowIntroScreen(!originalText);
  }, [clipboardText, originalText]);

  // Handle text received from share extension
  useLinkingHandler((sharedText: string) => {
    if (sharedText) {
      setTextInput(sharedText);
      // Optionally process the text immediately
      // checkGrammar(sharedText);
    }
  });

  const handleTabPress = (index: number) => {
    setActiveTab(index);
  };

  const handleRefreshClipboard = async () => {
    await refreshClipboard();
    if (clipboardText) {
      setTextInput(clipboardText);
    }
  };

  const handleProcessText = () => {
    if (!textInput.trim()) {
      Alert.alert('Error', 'Please enter or paste some text first.');
      return;
    }

    switch (activeTab) {
      case 0:
        checkGrammar(textInput);
        break;
      case 1:
        // The enhanceText function will be called from the EnhanceTab component
        setOriginalText(textInput);
        break;
      case 2:
        // The translateText function will be called from the TranslateTab component
        setOriginalText(textInput);
        break;
    }
    
    setShowIntroScreen(false);
  };

  const handleChangeApiKey = async () => {
    if (!newApiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key.');
      return;
    }

    try {
      const success = await setApiKey(newApiKey.trim());
      if (success) {
        Alert.alert('Success', 'API key has been updated.');
        setIsChangingApiKey(false);
        setNewApiKey('');
      } else {
        Alert.alert('Error', 'Failed to update API key. Please check that it is valid.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating the API key.');
    }
  };

  const renderTabContent = () => {
    if (showIntroScreen) {
      return renderIntroScreen();
    }
    
    switch (activeTab) {
      case 0:
        return <GrammarTab />;
      case 1:
        return <EnhanceTab />;
      case 2:
        return <TranslateTab />;
      default:
        return <GrammarTab />;
    }
  };
  
  const renderIntroScreen = () => (
    <View style={styles.introContainer}>
      <AppIcon size={48} />
      <Text style={styles.introTitle}>Welcome to Spellbound</Text>
      <Text style={styles.introSubtitle}>
        Your AI-powered writing assistant that helps perfect your text in seconds
      </Text>
      
      <View style={styles.introStepsContainer}>
        <Text style={styles.introStepsTitle}>Get Started in 3 Simple Steps</Text>
        
        <View style={styles.introStep}>
          <Text style={styles.introStepText}>
            1. Select and copy text using: 
            <Text style={styles.introStepHighlight}> ⌘ + C</Text>
          </Text>
        </View>
        
        <View style={styles.introStep}>
          <Text style={styles.introStepText}>
            2. For grammar & style use: 
            <Text style={styles.introStepHighlight}> ⌘ + Shift + C</Text>
          </Text>
        </View>
        
        <View style={styles.introStep}>
          <Text style={styles.introStepText}>
            3. Need translation? Use: 
            <Text style={styles.introStepHighlight}> ⌘ + Shift + C</Text>
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.configButton}
        onPress={() => setIsSettingsVisible(true)}
      >
        <Text style={styles.configButtonText}>Configure Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <View style={styles.headerLogoContainer}>
          <AppIcon size={32} />
          <Text style={styles.headerTitle}>Spellbound</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {/* Minimize function would go here */}}
          >
            <Text style={styles.headerMinimizeIcon}>—</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsSettingsVisible(!isSettingsVisible)}
          >
            <TabIconSettings />
          </TouchableOpacity>
        </View>
      </View>

      {isSettingsVisible && (
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsPanelTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setIsSettingsVisible(false)}>
              <Text style={styles.settingsCloseButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>OpenAI API Key</Text>
            {!isChangingApiKey ? (
              <>
                <Text style={styles.settingsValue}>
                  {isApiKeySet ? '••••••••••••••••' : 'Not set'}
                </Text>
                <TouchableOpacity 
                  style={styles.settingsActionButton}
                  onPress={() => setIsChangingApiKey(true)}
                >
                  <Text style={styles.settingsActionButtonText}>Change API Key</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.apiKeyInputContainer}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={newApiKey}
                  onChangeText={setNewApiKey}
                  placeholder="Enter your OpenAI API key"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <Text style={styles.settingsHelpText}>
                  To get your API key, visit your OpenAI account settings. Your API key will be used securely.
                </Text>
                <View style={styles.apiKeyButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.apiKeyButton, styles.cancelButton]}
                    onPress={() => {
                      setIsChangingApiKey(false);
                      setNewApiKey('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.apiKeyButton, styles.saveButton]}
                    onPress={handleChangeApiKey}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Model</Text>
            <Text style={styles.settingsValue}>{selectedModel}</Text>
            <Text style={styles.settingsHelpText}>
              Recommended: gpt-4o or gpt-4.1
            </Text>
          </View>
          
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Available Hotkeys</Text>
            <View style={styles.hotkeyContainer}>
              <Text style={styles.hotkeyName}>⌘+Shift+C</Text>
              <Text style={styles.hotkeyDescription}>For grammar & style use</Text>
            </View>
            <View style={styles.hotkeyContainer}>
              <Text style={styles.hotkeyName}>⌘+Shift+T</Text>
              <Text style={styles.hotkeyDescription}>Translations shortcut</Text>
            </View>
          </View>
        </View>
      )}

      {!showIntroScreen && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={textInput}
            onChangeText={setTextInput}
            placeholder="Enter or paste text here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={styles.inputActionButton}
              onPress={handleRefreshClipboard}
            >
              <Text style={styles.inputActionText}>Paste</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.processButton, isProcessing && styles.disabledButton]}
              onPress={handleProcessText}
              disabled={isProcessing}
            >
              <Text style={styles.processButtonText}>
                {isProcessing ? 'Processing...' : 'Process Text'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {languageInfo && !showIntroScreen && (
        <View style={styles.languageInfoContainer}>
          <Text style={styles.languageInfoText}>
            Detected Language: {languageInfo.name}
          </Text>
        </View>
      )}

      {!showIntroScreen && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 0 && styles.activeTab]}
            onPress={() => handleTabPress(0)}
          >
            <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
              Grammar & Style
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 1 && styles.activeTab]}
            onPress={() => handleTabPress(1)}
          >
            <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
              Enhance & Rewrite
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 2 && styles.activeTab]}
            onPress={() => handleTabPress(2)}
          >
            <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
              Translate
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    height: 60,
  },
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerMinimizeIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  settingsPanel: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  settingsCloseButton: {
    fontSize: 24,
    color: '#999',
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  settingsValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  settingsHelpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  settingsActionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  settingsActionButtonText: {
    color: '#6B46C1',
    fontWeight: '500',
    fontSize: 14,
  },
  hotkeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  hotkeyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
    backgroundColor: 'rgba(107, 70, 193, 0.05)',
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  hotkeyDescription: {
    fontSize: 14,
    color: '#555',
  },
  apiKeyInputContainer: {
    marginTop: 8,
  },
  apiKeyInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  apiKeyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  apiKeyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#6B46C1',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputActionButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  inputActionText: {
    color: '#555',
    fontWeight: '500',
  },
  processButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9F7AEA',
  },
  processButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  languageInfoContainer: {
    backgroundColor: '#6B46C1',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6B46C1',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Intro screen styles
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  introLogo: {
    width: 48,
    height: 48,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  introStepsContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 32,
  },
  introStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  introStep: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  introStepText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  introStepHighlight: {
    backgroundColor: 'rgba(107, 70, 193, 0.05)',
    color: '#6B46C1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  configButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  configButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 14,
  },
  tabIcon: {
    fontSize: 18,
    color: '#666',
  },
});

export default MainScreen; 