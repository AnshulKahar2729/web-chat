// @/utils/config.ts

// Google AI API key
export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Eleven Labs API key
export const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY || '';

// Google AI models
export const GOOGLE_MODELS = {
  GEMINI_PRO: 'gemini-2.0-flash',
};

// Default model to use
export const DEFAULT_GOOGLE_MODEL = GOOGLE_MODELS.GEMINI_PRO;