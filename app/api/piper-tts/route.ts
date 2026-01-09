// app/api/piper-tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface PiperTTSRequest {
  text: string;
  voice?: string; // e.g., 'en_US-libritts-high'
}

/**
 * GET /api/piper-tts/voices
 * Returns list of available Piper voices
 */
export async function GET(req: NextRequest) {
  try {
    const voiceDir = path.join(os.homedir(), '.piper', 'models');

    // Check if voice directory exists
    if (!fs.existsSync(voiceDir)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Voice directory not found. Install Piper models first.',
          voiceDir
        },
        { status: 404 }
      );
    }

    // List all .onnx files (voice models)
    const files = fs.readdirSync(voiceDir);
    const voices = files
      .filter(f => f.endsWith('.onnx'))
      .map(f => f.replace('.onnx', ''));

    return NextResponse.json({
      success: true,
      voices,
      count: voices.length,
      voiceDir
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to list voices: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/piper-tts
 * Body: { text: string, voice?: string }
 * Returns: Audio blob in mp3 format
 *
 * Uses Piper TTS via Python CLI (python3 -m piper)
 * Voice models stored in ~/.piper/models/
 */
export async function POST(req: NextRequest) {
  let tempOutputFile: string | null = null;

  try {
    const { text, voice = 'en_US-libritts-high' } = await req.json() as PiperTTSRequest;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text cannot be empty' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const voiceDir = path.join(os.homedir(), '.piper', 'models');
    const modelPath = path.join(voiceDir, `${voice}.onnx`);

    // Verify voice model exists
    if (!fs.existsSync(modelPath)) {
      return NextResponse.json(
        {
          error: `Voice model not found: ${voice}`,
          availableAt: voiceDir,
          modelPath
        },
        { status: 404 }
      );
    }

    // Create temporary output file in /tmp
    const tempDir = os.tmpdir();
    tempOutputFile = path.join(tempDir, `piper-${Date.now()}.wav`);

    // Execute Piper via Python
    // Using: echo "text" | python3 -m piper --model /path/to/model.onnx --output_file /tmp/output.wav
    return new Promise((resolve) => {
      try {
        // Spawn Python process with piper, forcing ARM64 architecture
        const piperProcess = spawn('arch', [
          '-arm64',
          'python3',
          '-m',
          'piper',
          '--model',
          modelPath,
          '--output_file',
          tempOutputFile as string
        ]);

        let stderrOutput = '';

        // Write text to stdin
        piperProcess.stdin.write(text);
        piperProcess.stdin.end();

        // Capture stderr for debugging
        piperProcess.stderr.on('data', (data) => {
          stderrOutput += data.toString();
        });

        // Handle process completion
        piperProcess.on('close', (code) => {
          if (code !== 0) {
            console.error('Piper error:', stderrOutput);
            resolve(
              NextResponse.json(
                { error: `Piper TTS failed: ${stderrOutput}` },
                { status: 500 }
              )
            );
            return;
          }

          // Read the generated audio file
          if (!fs.existsSync(tempOutputFile as string)) {
            resolve(
              NextResponse.json(
                { error: 'Audio file was not generated' },
                { status: 500 }
              )
            );
            return;
          }

          try {
            const audioBuffer = fs.readFileSync(tempOutputFile as string);

            // Clean up temp file
            fs.unlinkSync(tempOutputFile as string);
            tempOutputFile = null;

            // Return audio as WAV blob
            const response = new NextResponse(audioBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length.toString(),
                'Cache-Control': 'no-cache'
              }
            });

            resolve(response);
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            resolve(
              NextResponse.json(
                { error: `Failed to read audio file: ${errorMsg}` },
                { status: 500 }
              )
            );
          }
        });

        // Handle process errors
        piperProcess.on('error', (err) => {
          console.error('Failed to start Piper process:', err);
          resolve(
            NextResponse.json(
              { error: `Failed to start Piper: ${err.message}` },
              { status: 500 }
            )
          );
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (piperProcess.exitCode === null) {
            piperProcess.kill();
            resolve(
              NextResponse.json(
                { error: 'Piper TTS timeout' },
                { status: 504 }
              )
            );
          }
        }, 30000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Piper error:', errorMessage);
        resolve(
          NextResponse.json(
            { error: `TTS failed: ${errorMessage}` },
            { status: 500 }
          )
        );
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Request error:', errorMessage);

    // Clean up temp file on error
    if (tempOutputFile && fs.existsSync(tempOutputFile)) {
      try {
        fs.unlinkSync(tempOutputFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      { error: `Request failed: ${errorMessage}` },
      { status: 400 }
    );
  }
}