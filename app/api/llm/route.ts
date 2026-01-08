import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' });

export async function POST(req: NextRequest) {
  const { model, messages } = await req.json();
  const completion = await openai.chat.completions.create({ model, messages });
  return NextResponse.json(completion.choices[0].message);
}
