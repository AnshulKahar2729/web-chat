import { NextRequest } from 'next/server';
import { PERPLEXITY_API_KEY, DEFAULT_PERPLEXITY_MODEL } from '@/utils/config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), {
      status: 400,
    });
  }

  try {
    // Perplexity API endpoint
    const perplexityEndpoint = 'https://api.perplexity.ai/chat/completions';
    
    // Log the messages being sent (for debugging)
    console.log('Request to Perplexity:', JSON.stringify({
      model: DEFAULT_PERPLEXITY_MODEL, 
      messages: messages,
      stream: true
    }, null, 2));
    
    // Make a request to Perplexity API
    const perplexityResponse = await fetch(perplexityEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: DEFAULT_PERPLEXITY_MODEL,
        messages: messages,
        stream: true,
        // For sonar models, optionally enable these search parameters:
        options: {
          temperature: 0.7,
          max_tokens: 1024,
          // These options are specifically for the sonar models with web search
          search_priority: "high", // Controls the priority of search results
          include_citations: true, // Include citations for search results
          include_answer_source: true // Include the source of the answer
        }
      })
    });

    if (!perplexityResponse.ok) {
      // Try to get more detailed error information
      const errorData = await perplexityResponse.text();
      console.error('Perplexity API error:', {
        status: perplexityResponse.status,
        statusText: perplexityResponse.statusText,
        body: errorData
      });
      throw new Error(`Perplexity API error: ${perplexityResponse.statusText} - ${errorData}`);
    }

    // Forward the stream from Perplexity to the client
    return new Response(perplexityResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (err: any) {
    console.error('Chat API error:', err);
    
    // Return more detailed error information to help debug
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal Server Error',
      stack: err.stack,
      details: 'Please check your Perplexity API key and model availability'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}