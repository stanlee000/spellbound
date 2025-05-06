import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

const ApiKeyScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { setApiKey, availableModels, selectedModel, setSelectedModel } = useAppContext();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSetApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setErrorMessage('Please enter your OpenAI API key');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const success = await setApiKey(apiKeyInput.trim());
      if (success) {
        onComplete();
      } else {
        setErrorMessage('Failed to set API key. Please check that it is valid.');
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      setErrorMessage('An error occurred while setting the API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAIWebsite = () => {
    Linking.openURL('https://platform.openai.com/api-keys');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Spellbound</Text>
        
        <Text style={styles.subtitle}>
          To get started, we need your OpenAI API key
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Spellbound uses OpenAI's powerful AI models to enhance your text, correct grammar, 
            and provide translations. Your API key is stored securely on your device only.
          </Text>
          
          <TouchableOpacity onPress={handleOpenAIWebsite} style={styles.linkButton}>
            <Text style={styles.linkText}>Get an API key from OpenAI →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>OpenAI API Key</Text>
          <TextInput
            style={styles.input}
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            placeholder="sk-..."
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
        
        {availableModels.length > 0 && (
          <View style={styles.modelsContainer}>
            <Text style={styles.inputLabel}>AI Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelsScroll}>
              {availableModels.map(model => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelButton,
                    selectedModel === model.id && styles.selectedModelButton
                  ]}
                  onPress={() => setSelectedModel(model.id)}
                >
                  <Text
                    style={[
                      styles.modelButtonText,
                      selectedModel === model.id && styles.selectedModelText
                    ]}
                  >
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleSetApiKey}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.privacyText}>
          Your API key is stored securely on your device and is only used to communicate with OpenAI's services.
          We never store or transmit your API key to our servers.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 12,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e53935',
    marginTop: 8,
    fontSize: 14,
  },
  modelsContainer: {
    marginBottom: 24,
  },
  modelsScroll: {
    flexDirection: 'row',
  },
  modelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedModelButton: {
    backgroundColor: '#6200ee',
  },
  modelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedModelText: {
    color: '#fff',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  privacyText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ApiKeyScreen; 