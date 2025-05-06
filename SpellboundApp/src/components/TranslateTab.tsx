import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useAppContext } from '../contexts/AppContext';

const TranslateTab: React.FC = () => {
  const {
    originalText,
    isProcessing,
    languageInfo,
    translation,
    targetLanguage,
    setTargetLanguage,
    commonLanguages,
    translateText,
    copyToClipboard
  } = useAppContext();

  const handleLanguageSelect = (language: { code: string, name: string, native: string }) => {
    setTargetLanguage(language);
    if (originalText) {
      translateText(originalText, language.name);
    }
  };

  const renderLanguageSelector = () => {
    return (
      <View style={styles.languageSelectorContainer}>
        <Text style={styles.sectionTitle}>Select a language to translate your text:</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.languageChipsContainer}
          contentContainerStyle={styles.languageChipsContent}
        >
          {commonLanguages.map(language => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageChip,
                targetLanguage?.code === language.code && styles.selectedLanguageChip,
                languageInfo?.code === language.code && styles.disabledLanguageChip
              ]}
              onPress={() => handleLanguageSelect(language)}
              disabled={languageInfo?.code === language.code || isProcessing}
            >
              <Text
                style={[
                  styles.languageChipText,
                  targetLanguage?.code === language.code && styles.selectedLanguageChipText,
                  languageInfo?.code === language.code && styles.disabledLanguageChipText
                ]}
              >
                {language.name} ({language.native})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTranslationResult = () => {
    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>
            Translating to {targetLanguage?.name}...
          </Text>
        </View>
      );
    }

    if (!translation) {
      return (
        <View style={styles.emptyResultContainer}>
          <Text style={styles.emptyResultText}>
            Select a language above to translate your text.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.resultContainer}>
        <TouchableOpacity 
          style={styles.translationContainer}
          onPress={() => copyToClipboard(translation.translation)}
        >
          <Text style={styles.translationText}>{translation.translation}</Text>
          
          {translation.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesIcon}>ℹ️</Text>
              <View style={styles.notesTextContainer}>
                <Text style={styles.notesLabel}>Translation Notes:</Text>
                <Text style={styles.notesText}>{translation.notes}</Text>
              </View>
            </View>
          )}
          
          <Text style={styles.copyHint}>
            Click to copy the translation
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!originalText ? (
        <Text style={styles.emptyText}>
          No text available. Copy text to your clipboard and use the translate function.
        </Text>
      ) : (
        <>
          {renderLanguageSelector()}
          {renderTranslationResult()}
        </>
      )}
    </View>
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
  languageSelectorContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  languageChipsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  languageChipsContent: {
    paddingVertical: 4,
  },
  languageChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  selectedLanguageChip: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  disabledLanguageChip: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  languageChipText: {
    fontSize: 14,
    color: '#555',
  },
  selectedLanguageChipText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  disabledLanguageChipText: {
    color: '#999',
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
    marginTop: 20,
  },
  emptyResultText: {
    color: '#666',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
  },
  translationContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(107, 70, 193, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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

export default TranslateTab; 