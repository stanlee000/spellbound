import OpenAI from 'openai';
import * as Keychain from 'react-native-keychain';

// OpenAI API service
class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;
  private model = 'gpt-4o';
  
  // Common languages for translation
  private languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'sv', name: 'Swedish', native: 'Svenska' },
  ];

  /**
   * Initialize the OpenAI service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Try to get API key from secure storage
      const credentials = await Keychain.getGenericPassword({ service: 'openai-api' });
      if (credentials && credentials.password) {
        this.apiKey = credentials.password;
        this.setupClient();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing OpenAI service:', error);
      return false;
    }
  }

  /**
   * Set the OpenAI API key
   */
  public async setApiKey(key: string): Promise<boolean> {
    try {
      // Save API key in secure storage
      await Keychain.setGenericPassword('openai-api-key', key, { service: 'openai-api' });
      this.apiKey = key;
      this.setupClient();
      
      // Verify API key is valid by making a simple request
      try {
        await this.getAvailableModels();
        return true;
      } catch (error) {
        console.error('Error validating API key:', error);
        await Keychain.resetGenericPassword({ service: 'openai-api' });
        this.apiKey = null;
        this.client = null;
        return false;
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }

  /**
   * Set the AI model to use
   */
  public setModel(model: string): void {
    this.model = model;
  }

  /**
   * Setup the OpenAI client
   */
  private setupClient(): void {
    if (!this.apiKey) return;
    
    this.client = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true // Required for React Native
    });
  }

  /**
   * Get available OpenAI models
   */
  public async getAvailableModels(): Promise<Array<{ id: string, name: string }>> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => 
          model.id.startsWith('gpt-') && 
          !model.id.includes('instruct') &&
          !model.id.includes('0301') &&
          !model.id.includes('0314')
        )
        .map(model => ({
          id: model.id,
          name: model.id
        }))
        .sort((a, b) => {
          if (a.id.includes('4') && !b.id.includes('4')) return -1;
          if (!a.id.includes('4') && b.id.includes('4')) return 1;
          return a.id.localeCompare(b.id);
        });
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Get common languages for translation
   */
  public getCommonLanguages() {
    return this.languages;
  }

  /**
   * Detect language of text
   */
  private async detectLanguage(text: string): Promise<{ code: string, name: string, confidence: number }> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `Identify the language of the following text and return a JSON object with "code" (ISO 639-1 language code), "name" (language name in English), and "confidence" (number between 0 and 1):

Text: "${text}"

Response (JSON only):`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error detecting language:', error);
      // Default to English if detection fails
      return { code: 'en', name: 'English', confidence: 0.5 };
    }
  }

  /**
   * Check text for grammar and style issues
   */
  public async checkText(text: string) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const languageInfo = await this.detectLanguage(text);

    const prompt = `Review the following text in ${languageInfo.name} for grammar, spelling, and style issues. Return a JSON object with the following structure:
    {
      "corrections": [
        {
          "original": "text with issue",
          "suggestion": "corrected text"
        }
      ],
      "languageSpecific": [
        "suggestion specific to ${languageInfo.name} (e.g., idioms, formal/informal usage)"
      ]
    }

    Text: "${text}"
    
    Response (JSON only):`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      return {
        language: {
          ...languageInfo,
          native: this.languages.find(lang => lang.code === languageInfo.code)?.native || languageInfo.name
        },
        corrections: result.corrections || [],
        languageSpecific: result.languageSpecific || []
      };
    } catch (error) {
      console.error('Error checking text:', error);
      throw error;
    }
  }

  /**
   * Enhance text with specified style or preset
   */
  public async enhanceText({ text, preset, customTone, additionalContext }: {
    text: string,
    preset: string,
    customTone?: string,
    additionalContext?: string
  }) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    let instructions = '';
    switch (preset) {
      case 'twitter':
        instructions = 'Transform the text into an engaging tweet format with appropriate hashtags. Keep it under 280 characters.';
        break;
      case 'linkedin':
        instructions = 'Rewrite the text as a professional LinkedIn post focused on business value and insights. Use an appropriate tone for professional networking.';
        break;
      case 'instagram':
        instructions = 'Adapt the text for an Instagram post that feels authentic and engaging. Include suggested hashtags at the end.';
        break;
      case 'reddit':
        instructions = 'Format the text as a clear Reddit post with good structure, readability, and an engaging style that invites discussion.';
        break;
      case 'hackernews':
        instructions = 'Optimize the text for a Hacker News audience with technical accuracy, depth, and a straightforward style.';
        break;
      case 'promptBuilder':
        instructions = 'Structure the text as a well-crafted prompt for an AI language model, with clear instructions, context, and format specifications.';
        break;
      case 'custom':
        instructions = `Rewrite the text in a ${customTone || 'clear and professional'} tone.`;
        break;
      default:
        instructions = 'Enhance the text by improving clarity, engagement, and flow while maintaining the original meaning.';
    }

    if (additionalContext) {
      instructions += ` Additional context: ${additionalContext}`;
    }

    const prompt = `${instructions}

Original text: "${text}"

Return a JSON object with:
{
  "enhancedText": "the enhanced text"
}

Response (JSON only):`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw error;
    }
  }

  /**
   * Translate text to a target language
   */
  public async translateText({ text, targetLanguage }: {
    text: string,
    targetLanguage: string
  }) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    const sourceLanguageInfo = await this.detectLanguage(text);

    const prompt = `Translate the following text from ${sourceLanguageInfo.name} to ${targetLanguage}.

Original text: "${text}"

Return a JSON object with:
{
  "translation": "the translated text",
  "notes": "any relevant translation notes or alternative phrasings (if applicable)"
}

Response (JSON only):`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }
}

// Export as singleton
export default new OpenAIService(); 