import React, { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { exaCategory } from '@/lib/types';
import { Message } from '@/lib/types';
import ExaCategorySelector from './ExaCategorySelector';

// Define proper types for our tool calls and search results
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchAnalysis {
  domain: string | null;
  category: string;
  cleanQuery: string;
}

interface WebSearchResult {
  results: SearchResult[];
  message: string;
  analysis?: SearchAnalysis;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: {
    query: string;
  };
}

interface ToolResponse {
  toolCallId: string;
  result: WebSearchResult;
}

const ChatInterface: React.FC = () => {
  const [searchEnabled, setSearchEnabled] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [searchDomain, setSearchDomain] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<exaCategory | undefined>(undefined);
  
  const {
    messages,
    append,
    status,
    error,
    data,
  } = useChat({
    api: '/api/chat',
    body: {
      searchEnabled,
      searchCategory: selectedCategory, // Pass the selected category to the API
    },
    onResponse: (response) => {
      console.log('Raw response:', response);
    },
    onFinish: (message) => {
      console.log('Chat finished:', message);
      setIsSearching(false);
    },
    onError: (error: Error) => {
      console.error('Chat error:', error);
      setIsSearching(false);
    },
  });

  // Process the stream data to extract search results
  useEffect(() => {
    if (!data || !Array.isArray(data)) return;
    
    // Look for tool calls in the data array
    for (const item of data) {
      if (typeof item !== 'object' || item === null) continue;
      
      // Check if this is a tool call with args
      if ('toolName' in item && item.toolName === 'webSearch' && 'args' in item) {
        try {
          const toolCall = item as unknown as ToolCall;
          if (toolCall.args && toolCall.args.query) {
            setLastSearchQuery(toolCall.args.query);
          }
        } catch (e) {
          console.error('Error processing tool call:', e);
        }
      }
      
      // Check if this is a tool response with results
      if ('result' in item && item.result) {
        try {
          const toolResponse = item as unknown as ToolResponse;
          if (toolResponse.result) {
            // Store search results
            if (toolResponse.result.results && Array.isArray(toolResponse.result.results)) {
              setSearchResults(toolResponse.result.results);
            }
            
            // Store analysis information if available
            if (toolResponse.result.analysis) {
              setSearchDomain(toolResponse.result.analysis.domain);
              
              // Only set the category from analysis if the user hasn't already selected one
              if (!selectedCategory && toolResponse.result.analysis.category && 
                  toolResponse.result.analysis.category !== 'general') {
                setSearchCategory(toolResponse.result.analysis.category);
              } else {
                setSearchCategory(selectedCategory || null);
              }
            }
          }
        } catch (e) {
          console.error('Error processing tool response:', e);
        }
      }
    }
  }, [data, selectedCategory]);

  const handleSendMessage = async (content: string) => {
    console.log('Sending message:', content);
    setIsSearching(true);
    // Clear previous search results when sending a new message
    setSearchResults([]);
    
    try {
      await append({
        role: 'user',
        content,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setIsSearching(false);
    }
  };

  const handleCategoryChange = (category: exaCategory) => {
    setSelectedCategory(category);
    console.log('Category changed to:', category);
  };

  const isLoading = status === 'streaming' || status === 'submitted' || isSearching;

  // Render a search result component
  const renderSearchResults = () => {
    if (!searchResults || searchResults.length === 0) return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {lastSearchQuery ? (
            <>
              Search Results for "{lastSearchQuery}"
              {searchDomain && <span className="ml-1 text-blue-600">from {searchDomain}</span>}
              {searchCategory && !selectedCategory && <span className="ml-1 text-blue-600">({searchCategory})</span>}
              {selectedCategory && <span className="ml-1 text-blue-600">({selectedCategory})</span>}
            </>
          ) : (
            'Search Results:'
          )}
        </h3>
        <ul className="space-y-2">
          {searchResults.map((result, index) => (
            <li key={index} className="text-xs">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {result.title || 'Untitled'}
              </a>
              <span className="text-xs text-gray-500 ml-1">
                ({new URL(result.url).hostname})
              </span>
              {result.snippet && (
                <p className="text-gray-600 mt-1">{result.snippet}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4 flex-1 overflow-y-auto mb-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          AI Chat with Smart Web Search
        </h1>
        
        {/* Add category selector */}
        <ExaCategorySelector 
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <p>Start a conversation by sending a message below.</p>
              <p className="mt-2 text-sm">
                {searchEnabled ? (
                  <>
                    <span className="font-medium">Pro tip:</span> You can search specific websites by mentioning them in your query.
                    <br />
                    <span className="text-xs text-gray-600">Example: "Find information about AI from MIT's website"</span>
                    {selectedCategory && (
                      <span className="block mt-1 text-blue-600">
                        Results will be filtered to: {selectedCategory}
                      </span>
                    )}
                  </>
                ) : (
                  'Web search is currently disabled.'
                )}
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={message.id || index}>
                <ChatMessage message={message as Message} />
                {message.role === 'user' && 
                 index < messages.length - 1 &&
                 messages[index + 1]?.role === 'assistant' &&
                 searchResults.length > 0 && 
                 renderSearchResults()}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="text-center text-gray-500">
              <div className="animate-pulse">Thinking...</div>
              {isSearching && (
                <div className="text-xs mt-1">
                  Searching the web for information
                  {searchDomain && <span> on {searchDomain}</span>}
                  {searchCategory && !selectedCategory && <span> in category: {searchCategory}</span>}
                  {selectedCategory && <span> in category: {selectedCategory}</span>}
                  ...
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 my-2">
              Error: {error.message || "Something went wrong"}
            </div>
          )}
        </div>
      </div>
      
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        searchEnabled={searchEnabled}
        setSearchEnabled={setSearchEnabled}
      />
    </div>
  );
};

export default ChatInterface;