import { NextRequest } from 'next/server';
import { GOOGLE_API_KEY, DEFAULT_GOOGLE_MODEL } from '@/utils/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), {
      status: 400,
    });
  }

  try {
    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: DEFAULT_GOOGLE_MODEL });

    // Convert messages to Gemini format
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    // Get the last message
    const lastMessage = messages[messages.length - 1];
    
    // Log the request (for debugging)
    console.log('Request to Gemini:', JSON.stringify({
      model: DEFAULT_GOOGLE_MODEL,
      messages: messages,
    }, null, 2));

    // Send the message and get the response
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    // Return the response as a stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the response as a single chunk
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err: any) {
    console.error('Chat API error:', err);
    
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal Server Error',
      stack: err.stack,
      details: 'Please check your Google AI API key and model availability'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}