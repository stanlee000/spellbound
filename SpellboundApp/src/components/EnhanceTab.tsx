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
  { id: 'twitter', name: 'Twitter/X', description: 'Short, engaging posts' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Professional tone' },
  { id: 'instagram', name: 'Instagram', description: 'Visual, authentic' },
  { id: 'reddit', name: 'Reddit', description: 'Conversational' },
  { id: 'hackernews', name: 'Hacker News', description: 'Technical focus' },
  { id: 'promptBuilder', name: 'Prompt Builder', description: 'AI prompt design' },
  { id: 'custom', name: 'Custom Tone', description: 'Define your own style' }
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
  const [showOptions, setShowOptions] = useState(false);

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
        <Text style={styles.sectionTitle}>Choose an enhancement style:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                selectedPreset === preset.id && styles.selectedPreset
              ]}
              onPress={() => {
                setSelectedPreset(preset.id);
                setShowOptions(preset.id === 'custom');
              }}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  selectedPreset === preset.id && styles.selectedPresetText
                ]}
              >
                {preset.name}
              </Text>
              <Text
                style={[
                  styles.presetDescription,
                  selectedPreset === preset.id && styles.selectedPresetDescription
                ]}
              >
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPreset === 'custom' && showOptions && (
          <View style={styles.customOptions}>
            <Text style={styles.optionLabel}>Custom Tone:</Text>
            <TextInput
              style={styles.textInput}
              value={customTone}
              onChangeText={setCustomTone}
              placeholder="e.g., Professional, Friendly, Academic..."
              placeholderTextColor="#999"
            />
          </View>
        )}

        {selectedPreset && (
          <View style={styles.additionalOptionsContainer}>
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowOptions(!showOptions)}
            >
              <Text style={styles.expandButtonText}>
                {showOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </Text>
            </TouchableOpacity>

            {showOptions && (
              <View style={styles.advancedOptions}>
                <Text style={styles.optionLabel}>Additional Context:</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={additionalContext}
                  onChangeText={setAdditionalContext}
                  placeholder="Add context to improve enhancement quality..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.enhanceButton}
              onPress={handleEnhance}
              disabled={isProcessing}
            >
              <Text style={styles.enhanceButtonText}>
                {isProcessing ? 'Enhancing...' : 'Enhance Text'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderResultSection = () => {
    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Enhancing your text...</Text>
        </View>
      );
    }

    if (!enhancedText) {
      return (
        <View style={styles.emptyResultContainer}>
          <Text style={styles.emptyResultText}>
            Select a style above and click "Enhance Text" to transform your text.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Enhanced Result:</Text>
        <ScrollView style={styles.enhancedTextContainer}>
          <Text style={styles.enhancedText}>{enhancedText}</Text>
        </ScrollView>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => copyToClipboard(enhancedText)}
        >
          <Text style={styles.copyButtonText}>Copy Enhanced Text</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetButton: {
    padding: 12,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  selectedPreset: {
    backgroundColor: '#6200ee',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedPresetText: {
    color: '#fff',
  },
  presetDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedPresetDescription: {
    color: '#e0e0e0',
  },
  customOptions: {
    marginTop: 8,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  additionalOptionsContainer: {
    marginTop: 12,
  },
  expandButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  expandButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  advancedOptions: {
    marginBottom: 16,
  },
  enhanceButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enhanceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  emptyResultContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyResultText: {
    color: '#666',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  enhancedTextContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  enhancedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EnhanceTab; 