import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import GrammarTab from '../components/GrammarTab';
import EnhanceTab from '../components/EnhanceTab';
import TranslateTab from '../components/TranslateTab';
import { useLinkingHandler } from '../utils/linkingHandler';
import openaiService from '../services/openai';

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
    setApiKey
  } = useAppContext();

  const [textInput, setTextInput] = useState('');
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isChangingApiKey, setIsChangingApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');

  // Initialize with clipboard text if available
  useEffect(() => {
    if (clipboardText && !originalText) {
      setTextInput(clipboardText);
    }
  }, [clipboardText, originalText]);

  // Handle text received from share extension
  useLinkingHandler((sharedText) => {
    setTextInput(sharedText);
    // Optionally process the text immediately
    // checkGrammar(sharedText);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Spellbound</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setIsSettingsVisible(!isSettingsVisible)}
        >
          <TabIconSettings />
        </TouchableOpacity>
      </View>

      {isSettingsVisible && (
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsPanelTitle}>Settings</Text>
          <Text style={styles.settingsLabel}>API Key: {isApiKeySet ? '••••••••••••••••' : 'Not set'}</Text>
          <Text style={styles.settingsLabel}>Model: {selectedModel}</Text>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={async () => {
              try {
                const result = await openaiService.testConnectivity();
                Alert.alert(
                  result.success ? 'Connection Test Successful' : 'Connection Test Failed',
                  result.message
                );
              } catch (error) {
                Alert.alert('Error', `Test failed: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Test API Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={async () => {
              try {
                const result = await openaiService.testDirectAccess();
                Alert.alert(
                  result.success ? 'Direct API Test Successful' : 'Direct API Test Failed',
                  result.message
                );
              } catch (error) {
                Alert.alert('Error', `Direct test failed: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Test Direct API Access</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={async () => {
              try {
                Alert.alert('Testing Proxy Connection', 'Attempting to connect through a CORS proxy. This may take up to 20 seconds...');
                const result = await openaiService.testProxyConnection();
                Alert.alert(
                  result.success ? 'Proxy Connection Test Successful' : 'Proxy Connection Test Failed',
                  result.message
                );
              } catch (error) {
                Alert.alert('Error', `Proxy test failed: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Test via CORS Proxy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              Alert.alert(
                'Network Troubleshooting',
                'If you\'re experiencing connection issues:\n\n' +
                '1. Try using a different network (e.g., mobile data)\n' +
                '2. Your network may be blocking OpenAI API access\n' +
                '3. Consider using a VPN to bypass network restrictions\n' +
                '4. Contact your network administrator if on a corporate network'
              );
            }}
          >
            <Text style={styles.settingsButtonText}>Network Troubleshooting</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={async () => {
              try {
                Alert.alert('Testing Internet Connectivity', 'Testing connection to several websites...');
                const result = await openaiService.testGeneralConnectivity();
                
                let resultMessage = 'Results:\n\n';
                result.results.forEach(siteResult => {
                  resultMessage += `${siteResult.site}: ${siteResult.status}\n`;
                });
                
                Alert.alert(
                  result.success ? 'General Internet Connectivity OK' : 'Some Connection Tests Failed',
                  resultMessage
                );
              } catch (error) {
                Alert.alert('Error', `Connectivity test failed: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
          >
            <Text style={styles.settingsButtonText}>Test Internet Connectivity</Text>
          </TouchableOpacity>
          
          {!isChangingApiKey ? (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setIsChangingApiKey(true)}
            >
              <Text style={styles.settingsButtonText}>Change API Key</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.apiKeyInputContainer}>
              <TextInput
                style={styles.apiKeyInput}
                value={newApiKey}
                onChangeText={setNewApiKey}
                placeholder="Enter new API key"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
              <View style={styles.apiKeyButtonsContainer}>
                <TouchableOpacity
                  style={[styles.apiKeyButton, styles.cancelButton]}
                  onPress={() => {
                    setIsChangingApiKey(false);
                    setNewApiKey('');
                  }}
                >
                  <Text style={styles.apiKeyButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.apiKeyButton, styles.saveButton]}
                  onPress={handleChangeApiKey}
                >
                  <Text style={styles.apiKeyButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

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

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 0 && styles.activeTab]}
          onPress={() => handleTabPress(0)}
        >
          <TabIconGrammar />
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
            Grammar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 1 && styles.activeTab]}
          onPress={() => handleTabPress(1)}
        >
          <TabIconEnhance />
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
            Enhance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 2 && styles.activeTab]}
          onPress={() => handleTabPress(2)}
        >
          <TabIconTranslate />
          <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>
            Translate
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
  },
  settingsPanel: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsPanelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  settingsButtonText: {
    color: '#6200ee',
    fontWeight: '500',
    fontSize: 14,
  },
  apiKeyInputContainer: {
    marginTop: 8,
  },
  apiKeyInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  apiKeyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  apiKeyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  apiKeyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
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
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  inputActionText: {
    color: '#555',
    fontWeight: '500',
  },
  processButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#b388ff',
  },
  processButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6200ee',
  },
  content: {
    flex: 1,
  },
});

export default MainScreen; 