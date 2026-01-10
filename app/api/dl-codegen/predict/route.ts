// app/api/dl-codegen/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
import DLCodeGen from '../../../lib/dl-codegen';

export async function POST(req: NextRequest) {
  try {
    const { prompt, context = [] } = await req.json();

    const dl = DLCodeGen.getInstance();
    const prediction = await dl.predict(prompt, context);

    return NextResponse.json({
      success: true,
      prediction,
      confidence: prediction.confidence > 0.7 ? 'high' : 'medium'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Prediction failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
