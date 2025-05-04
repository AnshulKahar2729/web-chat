// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { GITHUB_ENDPOINT, GITHUB_MODEL_NAME, GITHUB_TOKEN } from '@/utils/config';
import { z } from 'zod';
import { performWebSearch } from '@/lib/exaSearch';
import { OpenAIChatModelId } from '@ai-sdk/openai/internal';
import { exaCategory } from '@/lib/types';

export const maxDuration = 60; // allow long tool calls if needed

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

If a user's question requires up-to-date or external information, you may call the "webSearch" tool using a natural language query.

After receiving search results, use them to answer the user's question clearly and concisely. Always cite the source using its URL in your response.

${searchCategory ? `Focus your search on the "${searchCategory}" category when applicable.` : ''}
Be brief, helpful, and accurate.`
  };

  const messagesWithSystem = messages.some((msg: any) => msg.role === 'system')
    ? messages
    : [systemMessage, ...messages];

  const result = streamText({
    model: githubProvider(GITHUB_MODEL_NAME as OpenAIChatModelId),
    messages: messagesWithSystem,
    tools: {
      webSearch: tool({
        description: 'Search the web for real-time information',
        parameters: z.object({
          query: z.string().describe('The search query to find real-time information on the web'),
        }),
        execute: async ({ query }) => {
          console.log("Executing web search for:", query);
          const formattedResults = await performWebSearch(query, 5, searchCategory as exaCategory);
          console.log("Search results:", formattedResults);
          return {
            message: formattedResults
          };
        },
      }),
    },
    toolChoice: "auto",
    maxSteps: 4,
  });

  return result.toDataStreamResponse();
}
