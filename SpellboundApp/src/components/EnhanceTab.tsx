import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

// Define presets
const PRESETS = [
  { id: 'twitter', name: 'X (Twitter)', description: 'Transform your text into an engaging tweet with hashtags', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Craft a professional post focused on business value', icon: '💼' },
  { id: 'instagram', name: 'Instagram', description: 'Create an authentic and engaging post', icon: '📷' },
  { id: 'reddit', name: 'Reddit', description: 'Format with clear structure and readability', icon: '📱' },
  { id: 'hackernews', name: 'Hacker News', description: 'Optimize for technical accuracy and depth', icon: '💻' },
  { id: 'promptBuilder', name: 'Prompt Builder', description: 'Structure a well-crafted LLM prompt', icon: '✨' },
  { id: 'custom', name: 'Custom Style', description: 'Define your own tone and style', icon: '✏️' }
];

const EnhanceTab: React.FC = () => {
  const {
    originalText,
    enhancedText,
    isProcessing,
    selectedPreset,
    setSelectedPreset,
    enhanceText,
    copyToClipboard
  } = useAppContext();

  const [customTone, setCustomTone] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleEnhance = () => {
    if (!selectedPreset || !originalText) return;
    
    enhanceText(
      originalText,
      selectedPreset,
      selectedPreset === 'custom' ? customTone : undefined,
      additionalContext || undefined
    );
  };

  const renderPresetSelector = () => {
    return (
      <View style={styles.presetContainer}>
        <Text style={styles.sectionTitle}>
          Select a preset or customize how you want to enhance your text:
        </Text>
        
        <ScrollView style={styles.presetGrid} contentContainerStyle={styles.presetGridContent}>
          {PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetCard,
                selectedPreset === preset.id && styles.selectedPresetCard
              ]}
              onPress={() => setSelectedPreset(preset.id)}
            >
              <View style={styles.presetHeader}>
                <Text style={[
                  styles.presetIcon,
                  selectedPreset === preset.id && styles.selectedPresetIcon
                ]}>
                  {preset.icon}
                </Text>
                <Text style={[
                  styles.presetName,
                  selectedPreset === preset.id && styles.selectedPresetName
                ]}>
                  {preset.name}
                </Text>
              </View>
              
              <Text style={[
                styles.presetDescription,
                selectedPreset === preset.id && styles.selectedPresetDescription
              ]}>
                {preset.description}
              </Text>
              
              {preset.id === 'custom' && selectedPreset === 'custom' && (
                <TextInput
                  style={styles.customToneInput}
                  value={customTone}
                  onChangeText={setCustomTone}
                  placeholder="e.g., formal, casual"
                  placeholderTextColor="#999"
                />
              )}
              
              <View style={styles.additionalContextContainer}>
                <TextInput
                  style={styles.additionalContextInput}
                  value={selectedPreset === preset.id ? additionalContext : ''}
                  onChangeText={setAdditionalContext}
                  placeholder="Additional context (optional)"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                />
              </View>
              
              <TouchableOpacity
                style={[
                  styles.enhanceButton,
                  (selectedPreset !== preset.id || 
                   (preset.id === 'custom' && !customTone) || 
                   isProcessing
                  ) && styles.disabledButton
                ]}
                onPress={handleEnhance}
                disabled={selectedPreset !== preset.id || 
                         (preset.id === 'custom' && !customTone) || 
                         isProcessing}
              >
                <Text style={styles.enhanceButtonText}>
                  {isProcessing && selectedPreset === preset.id ? 
                    'Enhancing...' : 
                    preset.id === 'promptBuilder' ? 'Build Prompt' : 'Apply Style'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderResultSection = () => {
    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Enhancing your text...</Text>
        </View>
      );
    }

    if (!enhancedText) {
      return null;
    }

    return (
      <View style={styles.resultContainer}>
        <TouchableOpacity 
          style={styles.enhancedTextContainer}
          onPress={() => copyToClipboard(enhancedText)}
        >
          <Text style={styles.enhancedText}>{enhancedText}</Text>
          <Text style={styles.copyHint}>Click to copy the enhanced text</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {!originalText ? (
        <Text style={styles.emptyText}>
          No text available. Copy text to your clipboard and use the enhance function.
        </Text>
      ) : (
        <>
          {renderPresetSelector()}
          {renderResultSection()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  presetContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: '#333',
  },
  presetGrid: {
    width: '100%',
  },
  presetGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedPresetCard: {
    backgroundColor: '#F8F9FA',
    borderColor: '#6B46C1',
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  presetIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#555',
  },
  selectedPresetIcon: {
    color: '#6B46C1',
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedPresetName: {
    color: '#6B46C1',
  },
  presetDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    minHeight: 32,
  },
  selectedPresetDescription: {
    color: '#555',
  },
  customToneInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  additionalContextContainer: {
    marginTop: 'auto',
    marginBottom: 12,
  },
  additionalContextInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  enhanceButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9F7AEA',
    opacity: 0.6,
  },
  enhanceButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  resultContainer: {
    marginTop: 16,
  },
  enhancedTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  enhancedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  copyHint: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});

export default EnhanceTab; 