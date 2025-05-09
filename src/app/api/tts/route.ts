import { NextRequest } from 'next/server';
import { ELEVEN_LABS_API_KEY } from '@/utils/config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
    });
  }

  try {
    // Eleven Labs API endpoint for text-to-speech
    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Default voice ID
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    console.log(response);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Eleven Labs API error: ${response.statusText} - ${errorData}`);
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();

    // Return the audio data with appropriate headers
    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('TTS API error:', err);
    return new Response(JSON.stringify({ 
      error: err.message || 'Internal Server Error',
      details: 'Please check your Eleven Labs API key'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 