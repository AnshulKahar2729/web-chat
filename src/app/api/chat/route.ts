import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { EXA_BASE_URL, EXA_API_KEY } from '@/utils/config';

export const runtime = 'edge';

const client = new OpenAI({
  baseURL: EXA_BASE_URL,
  apiKey: EXA_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), {
      status: 400,
    });
  }

  try {
    const stream = await client.chat.completions.create({
      model: 'exa',
      messages,
      stream: true,
    });

    // Prepare a text encoder stream for SSE (Server-Sent Events)
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err: any) {
    console.error('Chat API error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
