// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { GITHUB_ENDPOINT, GITHUB_MODEL_NAME, GITHUB_TOKEN } from '@/utils/config';
import { z } from 'zod';
import { performWebSearch } from '@/lib/exaSearch';
import { OpenAIChatModelId } from '@ai-sdk/openai/internal';
import { exaCategory } from '@/lib/types';

export const maxDuration = 60; // Increased for more complex operations

export async function POST(req: Request) {
    const { messages, searchCategory } = await req.json();
    console.log("Received messages:", messages);
    console.log("Search category:", searchCategory);
    

    const githubProvider = createOpenAI({
        baseURL: GITHUB_ENDPOINT,
        apiKey: GITHUB_TOKEN,
    });

    const systemMessage = {
        role: 'system',
        content: `You are a helpful assistant with access to web search capabilities.
When answering questions, use the provided search results when necessary.
Always cite your sources with the URL when using information from the search results.
${searchCategory ? `Focus on ${searchCategory} when searching and in your responses.` : ''}
Be concise and helpful.`
    };

    // Add system message if not present
    const messagesWithSystem = messages.some((msg: any) => msg.role === 'system')
        ? messages
        : [systemMessage, ...messages];

    console.log("Processing with messages:", messagesWithSystem);
    
    const result = streamText({
        model: githubProvider(GITHUB_MODEL_NAME as OpenAIChatModelId),
        messages: messagesWithSystem,
        tools: {
            webSearch: tool({
                description: 'Search the web for information',
                parameters: z.object({
                    query: z.string().describe('The search query to find information on the web'),
                }),
                execute: async ({ query }) => {
                    console.log("Executing web search for:", query);
                    // Pass the search category to the search function
                    const results = await performWebSearch(query, 5, searchCategory as exaCategory);
                    console.log("Search results:", results);

                    if (results.length === 0) {
                        return {
                            results: [],
                            message: "No relevant information found for your query."
                        };
                    }

                    const categoryInfo = searchCategory ? ` in category '${searchCategory}'` : '';
                    return {
                        results,
                        message: `Found ${results.length} results${categoryInfo} for "${query}"`
                    };
                },
            }),
        },
        // Ensures the conversation continues and doesn't end after a tool call
        toolChoice: "auto",
        maxSteps: 4
    });

    return result.toDataStreamResponse();
}