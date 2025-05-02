import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

const GrammarTab: React.FC = () => {
  const {
    originalText,
    corrections,
    isProcessing,
    languageInfo,
    languageSpecificSuggestions,
    copyToClipboard
  } = useAppContext();

  // Function to render text with correction highlights
  const renderCorrectedText = () => {
    if (!originalText) {
      return (
        <Text style={styles.emptyText}>
          No text to check. Select text and use the grammar check function.
        </Text>
      );
    }

    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Checking your text...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.instructionText}>
          Click on the highlighted text below to apply each suggestion. The corrected text will be automatically copied to your clipboard.
        </Text>
        
        <TouchableOpacity
          style={styles.textContainer}
          onPress={() => copyToClipboard(originalText)}
        >
          {corrections.length === 0 ? (
            <Text style={styles.correctedText}>{originalText}</Text>
          ) : (
            renderTextWithCorrections()
          )}
          
          <Text style={styles.copyHint}>
            Click anywhere to copy the entire text
          </Text>
        </TouchableOpacity>
        
        {languageSpecificSuggestions && languageSpecificSuggestions.length > 0 && (
          <View style={styles.languageSpecificContainer}>
            <Text style={styles.languageSpecificTitle}>
              Language-Specific Suggestions
            </Text>
            {languageSpecificSuggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };
  
  const renderTextWithCorrections = () => {
    // Simplified rendering of text with corrections
    // In a real implementation, you'd need to handle this more carefully,
    // potentially using a custom Text component that can handle inline styling
    return (
      <View style={styles.correctionContainer}>
        {corrections.map((correction, index) => (
          <TouchableOpacity
            key={index}
            style={styles.correctionItem}
            onPress={() => {
              // Replace the text and copy to clipboard
              const newText = originalText.replace(correction.original, correction.suggestion);
              copyToClipboard(newText);
            }}
          >
            <Text style={styles.correctionOriginal}>{correction.original}</Text>
            <Text style={styles.correctionArrow}>→</Text>
            <Text style={styles.correctionSuggestion}>{correction.suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return renderCorrectedText();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  correctedText: {
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
  correctionContainer: {
    marginBottom: 16,
  },
  correctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  correctionOriginal: {
    fontSize: 16,
    color: '#EF4444',
    flex: 1,
    textDecorationLine: 'line-through',
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.5)',
  },
  correctionArrow: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  correctionSuggestion: {
    fontSize: 16,
    color: '#4ADE80',
    flex: 1,
    fontWeight: '500',
  },
  languageSpecificContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  languageSpecificTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    flex: 1,
  },
});

export default GrammarTab; 