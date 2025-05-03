import { Exa } from 'exa-js';
import { SearchResult } from './types';
import { EXA_API_KEY } from '@/utils/config';

export async function performWebSearch(query: string, numResults: number = 5): Promise<SearchResult[]> {
  try {
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not defined');
    }

    const exa = new Exa(EXA_API_KEY);
    
    const results = await exa.search(query, {
        numResults,
        useAutoprompt: true,
    });

    return results.results.map(result => ({
      title: result.title || 'Untitled',
      url: result.url || 'No URL',
      snippet: result.text?.substring(0, 150) + '...' || 'No snippet available',
    }));
  } catch (error) {
    console.error('Error performing web search:', error);
    return [];
  }
}