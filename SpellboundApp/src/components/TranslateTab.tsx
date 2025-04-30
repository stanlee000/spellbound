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
    // Group languages into rows of 3 for better display
    const groupedLanguages = [];
    for (let i = 0; i < commonLanguages.length; i += 3) {
      groupedLanguages.push(commonLanguages.slice(i, i + 3));
    }

    return (
      <View style={styles.languageSelectorContainer}>
        <Text style={styles.sectionTitle}>Select target language:</Text>
        
        <View style={styles.languageGridContainer}>
          {groupedLanguages.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.languageRow}>
              {row.map(language => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageButton,
                    targetLanguage?.code === language.code && styles.selectedLanguage,
                    // Disable selection of the same language as the source
                    languageInfo?.code === language.code && styles.disabledLanguage
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                  disabled={languageInfo?.code === language.code || isProcessing}
                >
                  <Text
                    style={[
                      styles.languageName,
                      targetLanguage?.code === language.code && styles.selectedLanguageText,
                      languageInfo?.code === language.code && styles.disabledLanguageText
                    ]}
                  >
                    {language.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageNative,
                      targetLanguage?.code === language.code && styles.selectedLanguageText,
                      languageInfo?.code === language.code && styles.disabledLanguageText
                    ]}
                  >
                    {language.native}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTranslationResult = () => {
    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
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
        <Text style={styles.resultTitle}>Translation:</Text>
        <ScrollView style={styles.translationContainer}>
          <Text style={styles.translationText}>{translation.translation}</Text>
          
          {translation.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Translation Notes:</Text>
              <Text style={styles.notesText}>{translation.notes}</Text>
            </View>
          )}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => copyToClipboard(translation.translation)}
        >
          <Text style={styles.copyButtonText}>Copy Translation</Text>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  languageGridContainer: {
    marginBottom: 16,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  languageButton: {
    padding: 12,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    flex: 1,
  },
  selectedLanguage: {
    backgroundColor: '#6200ee',
  },
  disabledLanguage: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  languageNative: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedLanguageText: {
    color: '#fff',
  },
  disabledLanguageText: {
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
  translationContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  translationText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(98, 0, 238, 0.1)',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200ee',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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

export default TranslateTab; 