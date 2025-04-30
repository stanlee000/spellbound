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

    if (corrections.length === 0 && !isProcessing) {
      return (
        <View style={styles.resultContainer}>
          <Text style={styles.goodText}>✓ No grammar or spelling issues found.</Text>
          {languageInfo && (
            <Text style={styles.languageInfo}>
              Language detected: {languageInfo.name} ({languageInfo.native})
            </Text>
          )}
          <Text style={styles.originalText}>{originalText}</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.sectionTitle}>Corrections ({corrections.length})</Text>
        <ScrollView style={styles.correctionsContainer}>
          {corrections.map((correction, index) => (
            <TouchableOpacity
              key={index}
              style={styles.correctionItem}
              onPress={() => {
                // In a more complete implementation, this would apply the correction
                console.log('Apply correction:', correction);
              }}
            >
              <Text style={styles.originalTextHighlight}>{correction.original}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.suggestionText}>{correction.suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => copyToClipboard(originalText)}
        >
          <Text style={styles.copyButtonText}>Copy Text</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {isProcessing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Checking grammar and spelling...</Text>
        </View>
      ) : (
        renderCorrectedText()
      )}
    </View>
  );
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
  resultContainer: {
    flex: 1,
  },
  goodText: {
    fontSize: 16,
    color: '#4caf50',
    marginBottom: 16,
    fontWeight: '600',
  },
  languageInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  originalText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  correctionsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  correctionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  originalTextHighlight: {
    fontSize: 16,
    color: '#e53935',
    textDecorationLine: 'line-through',
    flex: 1,
  },
  arrow: {
    fontSize: 18,
    color: '#666',
    marginHorizontal: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '500',
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GrammarTab; 