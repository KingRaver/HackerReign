// app/api/stt/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * STT API - Speech-to-Text transcription
 *
 * This implementation relies on client-side Web Speech API for STT.
 * The browser's built-in speech recognition is used directly in useVoiceInput hook.
 *
 * This endpoint can be extended in the future with:
 * - Ollama with Whisper model support
 * - OpenAI Whisper API
 * - Other STT services (Deepgram, AssemblyAI, etc.)
 *
 * For now, it serves as a placeholder/future extension point.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // For now, return a message indicating client-side STT should be used
    return NextResponse.json({
      success: false,
      message: 'Server-side STT not implemented. Use Web Speech API on client.',
      recommendation: 'The useVoiceInput hook already implements browser-based STT'
    }, { status: 501 }); // 501 Not Implemented

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('STT error:', errorMessage);

    return NextResponse.json(
      { error: `STT failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
