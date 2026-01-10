// app/api/dl-codegen/train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import DLCodeGen from '../../../lib/dl-codegen';

export async function POST(req: NextRequest) {
  try {
    const { datasetPath } = await req.json();

    const dl = DLCodeGen.getInstance();
    const metrics = await dl.train(datasetPath);

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('DL Train Error:', error);
    return NextResponse.json(
      { error: 'Training failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
