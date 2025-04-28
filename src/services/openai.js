const { OpenAI } = require('openai');
const Store = require('electron-store');

const store = new Store();
let openaiClient = null;

/**
 * Initialize the OpenAI client with the stored API key
 * @returns {boolean} Whether initialization was successful
 */
function initOpenAI() {
  try {
    const apiKey = store.get('openai-api-key');
    console.log('Initializing OpenAI client. API key exists:', !!apiKey);
    
    if (!apiKey) {
      console.log('No API key found in store');
      openaiClient = null;
      return false;
    }
    
    // Create new OpenAI client instance
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    
    console.log('OpenAI client initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    openaiClient = null;
    return false;
  }
}

/**
 * Check if the OpenAI client is available and initialized
 * @returns {boolean} Whether the client is available
 */
function isClientAvailable() {
  if (!openaiClient) {
    console.error('OpenAI client is not initialized');
    return false;
  }
  return true;
}

/**
 * Get available OpenAI models
 * @returns {Promise<Array>} List of available models
 */
async function getAvailableModels() {
  if (!isClientAvailable()) {
    throw new Error('OpenAI API key not set');
  }
  
  const response = await openaiClient.models.list();
  // Filter for relevant models (GPT-4)
  const relevantModels = response.data.filter(model => 
    model.id.startsWith('gpt-4')
  );
  
  return relevantModels.map(model => ({
    id: model.id,
    name: model.id
  }));
}

/**
 * Enhance text with a specific preset
 * @param {Object} params - Enhancement parameters
 * @returns {Promise<Object>} Enhanced text and detected language
 */
async function enhanceText({ text, preset, customTone, additionalContext }) {
  if (!isClientAvailable()) {
    throw new Error('OpenAI API key not set');
  }

  // First, detect the language
  const langResponse = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4",
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

  const detectedLang = langResponse.choices[0].message.content.trim();

  // Define preset prompts
  const presetPrompts = {
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

  const prompt = presetPrompts[preset] || presetPrompts.custom;

  const response = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4o",
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
    enhancedText: response.choices[0].message.content.trim(),
    detectedLanguage: detectedLang
  };
}

/**
 * Parse a potentially markdown-wrapped JSON response
 * @param {string} content - Response content from OpenAI
 * @returns {Object} Parsed JSON object
 */
function parseJsonResponse(content) {
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
 * Check text for spelling, grammar and style issues
 * @param {string} text - Text to check
 * @returns {Promise<Object>} Corrections, language info and the text
 */
async function checkText(text) {
  if (!isClientAvailable()) {
    throw new Error('OpenAI API key not set');
  }

  try {
    // First, detect the language
    const langResponse = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
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

    const languageContent = langResponse.choices[0].message.content.trim();
    console.log('Language detection response:', languageContent);
    const languageInfo = parseJsonResponse(languageContent);

    // Then check for corrections
    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
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

    const correctionsContent = response.choices[0].message.content.trim();
    console.log('Corrections response:', correctionsContent);
    const corrections = parseJsonResponse(correctionsContent);
    
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
 * Translate text to a target language
 * @param {Object} params - Translation parameters
 * @returns {Promise<Object>} Translation results
 */
async function translateText({ text, targetLanguage }) {
  if (!isClientAvailable()) {
    throw new Error('OpenAI API key not set');
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: store.get('selected-model') || "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}. 
          Before translating, proofread the text and improve wording if needed for the target language.
          Maintain the tone and style of the original text. Return a JSON object with:
          1) 'translation': the translated text (without any markdown or special formatting)
          2) 'notes': any relevant notes about cultural context or idioms (optional)
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

    const translationContent = response.choices[0].message.content.trim();
    console.log('Translation response received');
    return parseJsonResponse(translationContent);
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

/**
 * Get the common languages for translation
 * @returns {Array} Common languages with code, name and native name
 */
function getCommonLanguages() {
  return [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
  ];
}

// Export the functions and variables
module.exports = {
  initOpenAI,
  get openaiClient() { return openaiClient; },  // Use getter to always return current value
  getAvailableModels,
  enhanceText,
  checkText,
  translateText,
  getCommonLanguages
}; 