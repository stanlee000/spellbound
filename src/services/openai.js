const { OpenAI } = require('openai');
const Store = require('electron-store');

const store = new Store();
let openaiClient = null;

function initOpenAI() {
  const apiKey = store.get('openai-api-key');
  if (apiKey) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
    });
    return true;
  }
  openaiClient = null;
  return false;
}

async function getAvailableModels() {
  if (!openaiClient) {
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

async function checkText(text) {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  // First, detect the language
  const langResponse = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a language detection expert. Return a JSON object with: 1) 'code': ISO language code (e.g., 'en', 'es'), 2) 'name': full language name in English, 3) 'native': language name in its native form."
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.1,
    max_tokens: 50
  });

  const languageInfo = JSON.parse(langResponse.choices[0].message.content);

  // Then check for corrections
  const response = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional proofreader. The text is in ${languageInfo.name} (${languageInfo.code}). 
        Identify spelling, grammar, and style issues. Return a JSON object with:
        1) 'corrections': array of {original, suggestion} pairs
        2) 'languageSpecific': array of language-specific improvement suggestions
        For example, if the text is in English and uses British spelling but could be made more consistent with American English, note that.
        If no corrections are needed, return { "corrections": [], "languageSpecific": [] }`
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const corrections = JSON.parse(response.choices[0].message.content);
  return {
    ...corrections,
    language: languageInfo,
    text
  };
}

async function translateText(text, targetLanguage) {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  const response = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. 
        Before translating, proofread the text and improve wording if needed for the target language.
        Maintain the tone and style of the original text. Return a JSON object with:
        1) 'translation': the translated text (without any markdown or special formatting)
        2) 'notes': any relevant notes about cultural context or idioms (optional)`
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  });

  return JSON.parse(response.choices[0].message.content);
}

async function enhanceText(text, preset, customTone, additionalContext) {
  if (!openaiClient) {
    throw new Error('OpenAI API key not set');
  }

  // First, detect the language
  const langResponse = await openaiClient.chat.completions.create({
    model: store.get('selected-model') || "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a language detection expert. Analyze the provided text and return ONLY the ISO language code (e.g., 'en', 'es', 'fr', etc.) of the primary language used."
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
    model: store.get('selected-model') || "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert content writer who specializes in adapting text for different platforms while maintaining the core message. Return ONLY the enhanced text without any additional formatting, markdown, or notes. ${prompt}`
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

module.exports = {
  initOpenAI,
  getAvailableModels,
  checkText,
  translateText,
  enhanceText,
  getClient: () => openaiClient,
  setClient: (client) => { openaiClient = client; }
}; 