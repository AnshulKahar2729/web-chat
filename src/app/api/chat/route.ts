import { createOpenAI, openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { GITHUB_ENDPOINT, GITHUB_MODEL_NAME, GITHUB_TOKEN } from '@/utils/config';
import { OpenAIChatModelId } from '@ai-sdk/openai/internal';
import { z } from 'zod';
import { performWebSearch } from '@/lib/exaSearch';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const githubProvider = createOpenAI({
        baseURL: GITHUB_ENDPOINT,
        apiKey: GITHUB_TOKEN,
    });

    const systemMessage = {
        role: 'system',
        content: `You are a helpful assistant with access to web search capabilities.
    When answering questions, use the provided search results when necessary.
    Always cite your sources with the URL when using information from the search results.
    Be concise and helpful.`
    };

    // Add system message if not present
    const messagesWithSystem = messages.some((msg: any) => msg.role === 'system')
        ? messages
        : [systemMessage, ...messages];

    
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
                    const results = await performWebSearch(query);

                    if (results.length === 0) {
                        return {
                            results: [],
                            message: "No relevant information found for your query."
                        };
                    }

                    return {
                        results,
                        message: `Found ${results.length} results for "${query}"`
                    };
                },
            }),

        },

    });

    return result.toDataStreamResponse();
}