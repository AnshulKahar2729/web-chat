// @/utils/config.ts

// Replace with your actual Perplexity API key
export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';

// Current Perplexity models as of May 2025
// Based on latest documentation at https://docs.perplexity.ai/guides/model-cards
export const PERPLEXITY_MODELS = {
  // Search-enabled models (with online capabilities)
  SONAR_SMALL: 'llama-3.1-sonar-small-128k-online',
  SONAR_LARGE: 'llama-3.1-sonar-large-128k-online',
  
  // Non-search models (for regular chat)
  SONAR_SMALL_CHAT: 'llama-3.1-sonar-small-128k-chat',
  SONAR_LARGE_CHAT: 'llama-3.1-sonar-large-128k-chat',
  
  // Base models
  LLAMA_8B: 'llama-3.1-8b-instruct',
  LLAMA_70B: 'llama-3.1-70b-instruct',
};

// Default model to use - using the small online model for search capabilities
export const DEFAULT_PERPLEXITY_MODEL = PERPLEXITY_MODELS.SONAR_SMALL;