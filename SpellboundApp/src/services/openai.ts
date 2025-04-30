import { OpenAI } from 'openai';
import Keychain from 'react-native-keychain';

class OpenAIService {
  private openaiClient: OpenAI | null = null;
  private selectedModel: string = 'gpt-4o';

  /**
   * Test direct URL access instead of using the SDK
   */
  async testDirectAccess(): Promise<{ success: boolean, message: string }> {
    try {
      console.log('Testing direct access to OpenAI API without SDK');
      // First get the API key
      const credentials = await Keychain.getGenericPassword({ service: 'openai-api-key' });
      
      if (!credentials) {
        return { 
          success: false, 
          message: 'No API key found in keychain' 
        };
      }
      
      const apiKey = credentials.password;
      
      console.log('Attempting direct fetch to OpenAI API...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // Try to connect to OpenAI API with manual fetch
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'SpellboundApp/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Log full response details for debugging
      console.log('Direct fetch response status:', response.status);
      console.log('Direct fetch response headers:', JSON.stringify(Array.from(response.headers.entries())));
      
      const responseText = await response.text();
      console.log('Direct fetch response (first 100 chars):', responseText.substring(0, 100));
      
      let parsedData;
      try {
        // Try to parse as JSON if possible
        parsedData = JSON.parse(responseText);
        console.log('Response parsed as JSON successfully');
      } catch (parseError) {
        console.log('Response is not valid JSON');
        // If it's HTML, return differently
        if (responseText.includes('<html>')) {
          return {
            success: false,
            message: `Received HTML instead of JSON API response. This suggests network interference or proxy issues. Status: ${response.status}`
          };
        }
      }
      
      if (response.ok) {
        return { 
          success: true, 
          message: `Direct fetch successful: Status ${response.status}` 
        };
      } else {
        return { 
          success: false, 
          message: `Direct fetch failed: Status ${response.status} - ${responseText.substring(0, 100)}...` 
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timeout after 15 seconds'
        };
      }
      return { 
        success: false, 
        message: `Direct fetch error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Test connectivity to OpenAI API
   * @returns {Promise<boolean>} Whether the connection test was successful
   */
  async testConnectivity(): Promise<{ success: boolean, message: string }> {
    try {
      // First get the API key
      const credentials = await Keychain.getGenericPassword({ service: 'openai-api-key' });
      
      if (!credentials) {
        return { 
          success: false, 
          message: 'No API key found in keychain' 
        };
      }
      
      const apiKey = credentials.password;
      
      // Try to connect to OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Connection successful: ${response.status}, Models available: ${data.data.length}` 
        };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          message: `Connection reached server but returned error: ${response.status} - ${errorText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Try connecting through a public CORS proxy
   * This is a workaround for networks that block direct access to OpenAI
   */
  async testProxyConnection(): Promise<{ success: boolean, message: string }> {
    try {
      console.log('Testing connection through CORS proxy');
      // First get the API key
      const credentials = await Keychain.getGenericPassword({ service: 'openai-api-key' });
      
      if (!credentials) {
        return { 
          success: false, 
          message: 'No API key found in keychain' 
        };
      }
      
      const apiKey = credentials.password;
      
      // Use a public CORS proxy (note: for production use, you should set up your own proxy)
      // This is just for testing connectivity
      const corsProxyUrl = 'https://corsproxy.io/?';
      const targetUrl = encodeURIComponent('https://api.openai.com/v1/models');
      
      console.log('Attempting connection through CORS proxy...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const response = await fetch(`${corsProxyUrl}${targetUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'SpellboundApp/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('CORS proxy response status:', response.status);
      
      const responseText = await response.text();
      console.log('CORS proxy response (first 100 chars):', responseText.substring(0, 100));
      
      if (response.ok) {
        return { 
          success: true, 
          message: `CORS proxy connection successful. This confirms your API key works, but your network may be blocking direct connections to OpenAI.` 
        };
      } else {
        return { 
          success: false, 
          message: `CORS proxy connection failed: Status ${response.status}` 
        };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'CORS proxy connection timeout after 20 seconds'
        };
      }
      return { 
        success: false, 
        message: `CORS proxy error: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Initialize the OpenAI client with the stored API key
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'openai-api-key' });
      
      if (!credentials) {
        console.log('No API key found in keychain');
        this.openaiClient = null;
        return false;
      }
      
      const apiKey = credentials.password;
      
      // Create new OpenAI client instance with improved configuration
      this.openaiClient = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.openai.com',
        timeout: 30000, // 30 second timeout
        maxRetries: 3,
        dangerouslyAllowBrowser: true, // Required for React Native
        defaultHeaders: {
          'User-Agent': 'SpellboundApp/1.0'
        },
        defaultQuery: {
          // Add timestamp to prevent caching
          '_': Date.now().toString()
        }
      });
      
      console.log('OpenAI client initialized with config:', { 
        baseURL: 'https://api.openai.com',
        timeout: 30000,
        maxRetries: 3
      });
      return true;
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      this.openaiClient = null;
      return false;
    }
  }

  /**
   * Check if the OpenAI client is available and initialized
   * @returns {boolean} Whether the client is available
   */
  isClientAvailable(): boolean {
    if (!this.openaiClient) {
      console.error('OpenAI client is not initialized');
      return false;
    }
    return true;
  }

  /**
   * Set the API key for OpenAI
   * @param {string} apiKey - The OpenAI API key
   * @returns {Promise<boolean>} Whether the key was set successfully
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      await Keychain.setGenericPassword('openai', apiKey, { service: 'openai-api-key' });
      
      this.openaiClient = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.openai.com',
        timeout: 30000, // 30 second timeout
        maxRetries: 3,
        dangerouslyAllowBrowser: true, // Required for React Native
        defaultHeaders: {
          'User-Agent': 'SpellboundApp/1.0'
        },
        defaultQuery: {
          // Add timestamp to prevent caching
          '_': Date.now().toString()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error setting API key:', error);
      return false;
    }
  }

  /**
   * Set the model to use for OpenAI requests
   * @param {string} model - The model ID to use
   */
  setModel(model: string): void {
    this.selectedModel = model;
  }

  /**
   * Get available OpenAI models
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    if (!this.isClientAvailable() || !this.openaiClient) {
      throw new Error('OpenAI API key not set');
    }
    
    try {
      const response = await this.openaiClient.models.list();
      // Filter for relevant models (GPT-4)
      const relevantModels = response.data.filter(model => 
        model.id.startsWith('gpt-4')
      );
      
      return relevantModels.map(model => ({
        id: model.id,
        name: model.id
      }));
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw error;
    }
  }

  /**
   * Check text for spelling, grammar and style issues
   * @param {string} text - Text to check
   * @returns {Promise<Object>} Corrections, language info and the text
   */
  async checkText(text: string) {
    if (!this.isClientAvailable() || !this.openaiClient) {
      throw new Error('OpenAI API key not set');
    }

    try {
      console.log('Starting language detection API call');
      // First, detect the language
      const langResponse = await this.openaiClient.chat.completions.create({
        model: this.selectedModel,
        messages: [
          {
            role: "system",
            content: "You are a language detection expert. Return a JSON object with: 1) 'code': ISO language code (e.g., 'en', 'es'), 2) 'name': full language name in English, 3) 'native': language name in its native form. Do NOT format the response as markdown or a code block."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      });

      const languageContent = langResponse.choices[0].message.content?.trim() || '';
      console.log('Language detection response:', languageContent);
      const languageInfo = this.parseJsonResponse(languageContent);

      console.log('Starting corrections API call');
      // Then check for corrections
      const response = await this.openaiClient.chat.completions.create({
        model: this.selectedModel,
        messages: [
          {
            role: "system",
            content: `You are a professional proofreader. The text is in ${languageInfo.name} (${languageInfo.code}). 
            Identify spelling, grammar, and style issues. Return a JSON object with:
            1) 'corrections': array of {original, suggestion} pairs
            2) 'languageSpecific': array of language-specific improvement suggestions
            For example, if the text is in English and uses British spelling but could be made more consistent with American English, note that.
            If no corrections are needed, return { "corrections": [], "languageSpecific": [] }
            IMPORTANT: Return ONLY the raw JSON without any markdown formatting, code blocks, or additional text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const correctionsContent = response.choices[0].message.content?.trim() || '';
      console.log('Corrections response:', correctionsContent);
      const corrections = this.parseJsonResponse(correctionsContent);
      
      return {
        ...corrections,
        language: languageInfo,
        text
      };
    } catch (error) {
      console.error('Error checking text:', error);
      throw error;
    }
  }

  /**
   * Enhance text with a specific preset
   * @param {Object} params - Enhancement parameters
   * @returns {Promise<Object>} Enhanced text and detected language
   */
  async enhanceText({ text, preset, customTone, additionalContext }: {
    text: string,
    preset: string,
    customTone?: string,
    additionalContext?: string
  }) {
    if (!this.isClientAvailable() || !this.openaiClient) {
      throw new Error('OpenAI API key not set');
    }

    try {
      console.log('Starting language detection for enhancement');
      // First, detect the language
      const langResponse = await this.openaiClient.chat.completions.create({
        model: this.selectedModel,
        messages: [
          {
            role: "system",
            content: "You are a language detection expert. Analyze the provided text and return ONLY the ISO language code (e.g., 'en', 'es', 'fr', etc.) of the primary language used. Do not include any explanations, markdown formatting, or additional text."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      const detectedLang = langResponse.choices[0].message.content?.trim() || 'en';
      console.log('Detected language:', detectedLang);

      // Define preset prompts
      const presetPrompts: {[key: string]: string} = {
        twitter: `Rewrite this ${detectedLang} text as an engaging X (Twitter) post. Make it concise, impactful. You can divide the text into multiple posts if need to engage the audience (each post should be 280 characters or less). ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
        
        linkedin: `Rewrite this ${detectedLang} text as a professional LinkedIn post. Focus on business value, insights, and professional tone. Add relevant hashtags. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
        
        instagram: `Rewrite this ${detectedLang} text as an engaging Instagram post. Make it relatable, authentic, and add relevant hashtags. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
        
        hackernews: `Rewrite this ${detectedLang} text in a style suitable for Hacker News. Focus on technical accuracy, intellectual depth, and objective analysis. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
        
        reddit: `Rewrite this ${detectedLang} text as a Reddit post. Make it informative yet conversational, with good formatting. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`,
        
        promptBuilder: `Transform this ${detectedLang} text into a well-structured LLM prompt following best practices:
        1. Be specific and clear about the desired outcome
        2. Break down complex tasks into steps
        3. Include relevant context and constraints
        4. Specify the format of the expected response
        5. Use examples if helpful
        ${additionalContext ? `Additional context to consider: ${additionalContext}.` : ''}
        Return ONLY the final prompt without any markdown formatting or additional notes:`,
        
        custom: `Rewrite this ${detectedLang} text with the following tone: ${customTone}. ${additionalContext ? `Additional context: ${additionalContext}.` : ''} Return ONLY the final text without any markdown formatting or additional notes:`
      };

      const prompt = preset in presetPrompts ? presetPrompts[preset] : presetPrompts.custom;
      console.log('Starting text enhancement API call');
      console.log('Using preset:', preset);

      const response = await this.openaiClient.chat.completions.create({
        model: this.selectedModel,
        messages: [
          {
            role: "system",
            content: `You are an expert content writer who specializes in adapting text for different platforms while maintaining the core message. Return ONLY the enhanced text without any additional formatting, markdown, code blocks, or additional notes. ${prompt}`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        enhancedText: response.choices[0].message.content?.trim(),
        detectedLanguage: detectedLang
      };
    } catch (error) {
      console.error('Error enhancing text:', error);
      throw error;
    }
  }

  /**
   * Translate text to a target language
   * @param {Object} params - Translation parameters
   * @returns {Promise<Object>} Translation results
   */
  async translateText({ text, targetLanguage }: { text: string, targetLanguage: string }) {
    if (!this.isClientAvailable() || !this.openaiClient) {
      throw new Error('OpenAI API key not set');
    }

    try {
      console.log('Starting translation API call');
      console.log('Target language:', targetLanguage);
      
      const response = await this.openaiClient.chat.completions.create({
        model: this.selectedModel,
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the provided text to ${targetLanguage}. 
            Return a JSON object with:
            1) 'translation': the translated text
            2) 'notes': any relevant notes about the translation (idioms, cultural references, etc.)
            IMPORTANT: Return ONLY the raw JSON without any markdown formatting, code blocks, or additional text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const translationContent = response.choices[0].message.content?.trim() || '';
      return this.parseJsonResponse(translationContent);
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  }

  /**
   * Parse a potentially markdown-wrapped JSON response
   * @param {string} content - Response content from OpenAI
   * @returns {Object} Parsed JSON object
   */
  private parseJsonResponse(content: string): any {
    let jsonStr = content.trim();
    
    // Check if the response is wrapped in markdown code blocks
    if (jsonStr.startsWith('```') && jsonStr.endsWith('```')) {
      // Extract the JSON content from the code block
      jsonStr = jsonStr.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    }
    
    // Handle other potential markdown formatting
    if (jsonStr.includes('```json')) {
      const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonStr = jsonMatch[1].trim();
      }
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('JSON parsing error with content:', jsonStr);
      throw error;
    }
  }

  /**
   * Get common languages for translation
   * @returns {Array} List of common languages
   */
  getCommonLanguages() {
    return [
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
      { code: 'bn', name: 'Bengali', native: 'বাংলা' },
      { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
      { code: 'tr', name: 'Turkish', native: 'Türkçe' }
    ];
  }

  /**
   * Test general internet connectivity
   * This helps determine if the issue is specific to OpenAI or a general network problem
   */
  async testGeneralConnectivity(): Promise<{ success: boolean, results: Array<{site: string, status: string}> }> {
    const sitesToTest = [
      'https://www.google.com',
      'https://www.apple.com',
      'https://www.github.com',
      'https://www.microsoft.com'
    ];
    
    console.log('Testing general internet connectivity...');
    
    const results = [];
    let overallSuccess = true;
    
    for (const site of sitesToTest) {
      try {
        console.log(`Testing connectivity to ${site}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(site, {
          method: 'GET',
          headers: {
            'User-Agent': 'SpellboundApp/1.0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        results.push({
          site,
          status: `OK (${response.status})`
        });
        
        console.log(`Connection to ${site} successful with status ${response.status}`);
      } catch (error: any) {
        overallSuccess = false;
        
        results.push({
          site,
          status: error.name === 'AbortError' 
            ? 'Timeout after 10s' 
            : `Error: ${error.message}`
        });
        
        console.log(`Connection to ${site} failed: ${error.message}`);
      }
    }
    
    return {
      success: overallSuccess,
      results
    };
  }
}

// Export as a singleton
export default new OpenAIService(); 