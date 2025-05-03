// lib/exaSearch.ts
import { Exa } from 'exa-js';
import { exaCategory, SearchResult } from './types';
import { EXA_API_KEY } from '@/utils/config';

/**
 * Performs a web search using the Exa API with category filtering
 * 
 * @param query - The search query string
 * @param numResults - Number of results to return (default: 5)
 * @param category - Optional category to focus the search on
 * @returns Array of search results with title, URL, and snippet
 */
export async function performWebSearch(
  query: string, 
  numResults: number = 5,
  category?: exaCategory
): Promise<SearchResult[]> {
  try {
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not defined');
    }

    const exa = new Exa(EXA_API_KEY);
    
    // Configure search options
    const searchOptions: any = {
      numResults,
      useAutoprompt: true,
    };
    
    // Add category if specified
    if (category) {
      searchOptions.category = category;
    }
    
    console.log('Performing Exa search with options:', { query, ...searchOptions });
    
    // Perform the search with the specified options
    const results = await exa.search(query, searchOptions);

    // Transform and return the results
    return results.results.map(result => ({
      title: result.title || 'Untitled',
      url: result.url,
      snippet: result.text?.substring(0, 150) + '...' || '',
    }));
  } catch (error) {
    console.error('Error performing web search:', error);
    return [];
  }
}