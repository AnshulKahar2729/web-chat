// lib/exaSearch.ts
import { Exa } from 'exa-js';
import { EXA_API_KEY } from '@/utils/config';
import { exaCategory } from '@/lib/types';

/**
 * Performs a web search using the Exa API with category filtering
 *
 * @param query - The search query string
 * @param numResults - Number of results to return (default: 5)
 * @param category - Optional category to focus the search on
 * @returns A formatted string of top search results
 */
export async function performWebSearch(
  query: string,
  numResults: number = 5,
  category?: exaCategory
): Promise<string> {
  try {
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not defined');
    }

    const exa = new Exa(EXA_API_KEY);

    const searchOptions: any = {
      numResults,
      useAutoprompt: true,
    };

    if (category) {
      searchOptions.category = category;
    }

    console.log('Performing Exa search with options:', { query, ...searchOptions });

    const results = await exa.search(query, searchOptions);

    if (!results.results || results.results.length === 0) {
      return `No relevant information found for "${query}".`;
    }

    const formatted = results.results.map((result, idx) => {
      return `Result ${idx + 1}:\nTitle: ${result.title || 'Untitled'}\nURL: ${result.url}\nSnippet: ${result.text?.substring(0, 300) || 'No snippet.'}\n`;
    }).join('\n---\n');

    return `Here are the top search results for "${query}":\n\n${formatted}`;
  } catch (error) {
    console.error('Error performing web search:', error);
    return 'An error occurred while performing the web search.';
  }
}
