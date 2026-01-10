import { NextRequest, NextResponse } from 'next/server';
import { strategyManager } from '@/app/lib/strategy/manager';
import { patternRecognizer } from '@/app/lib/learning/patternRecognition';
import { parameterTuner } from '@/app/lib/learning/parameterTuner';
import { qualityPredictor } from '@/app/lib/learning/qualityPredictor';

/**
 * Feedback API Endpoint
 * Captures user feedback for continuous learning and adaptation
 */

export async function POST(req: NextRequest) {
  try {
    const {
      messageId,
      decisionId,
      feedback,
      content,
      timestamp,
      // Additional learning context
      theme,
      complexity,
      temperature,
      maxTokens,
      toolsEnabled,
      modelUsed,
      responseTime,
      tokensUsed,
      userMessage
    } = await req.json();

    if (!decisionId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: decisionId and feedback' },
        { status: 400 }
      );
    }

    // Calculate quality score based on feedback
    const qualityScore = feedback === 'positive' ? 0.95 : feedback === 'negative' ? 0.3 : 0.7;

    // Update the strategy outcome with user feedback
    await strategyManager.logOutcome(decisionId, {
      decisionId,
      responseQuality: qualityScore,
      responseTime: responseTime || 0,
      tokensUsed: tokensUsed || 0,
      errorOccurred: false,
      retryCount: 0,
      userFeedback: feedback
    });

    // Record pattern recognition feedback for theme learning
    if (theme && userMessage) {
      await patternRecognizer.recordThemeFeedback(
        theme,
        userMessage,
        modelUsed || 'unknown',
        qualityScore,
        feedback,
        complexity
      );
    }

    // Record parameter tuning experiment for dynamic learning
    if (theme && complexity !== undefined && temperature !== undefined) {
      await parameterTuner.recordExperiment(
        decisionId,
        theme,
        complexity,
        temperature,
        maxTokens || 8000,
        toolsEnabled || false,
        qualityScore,
        feedback,
        responseTime,
        tokensUsed
      );
    }

    // Record outcome for quality prediction model
    if (theme && complexity !== undefined && modelUsed && temperature !== undefined) {
      await qualityPredictor.recordOutcome(
        theme,
        complexity,
        modelUsed,
        temperature,
        maxTokens || 8000,
        toolsEnabled || false,
        qualityScore,
        feedback,
        responseTime,
        tokensUsed
      );
    }

    console.log(`[Feedback] User ${feedback} feedback recorded for decision ${decisionId} (theme: ${theme}, quality: ${qualityScore})`);

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded and learning updated',
      decisionId,
      feedback,
      qualityScore,
      learningUpdated: {
        themePattern: !!theme,
        parameterTuning: !!(theme && complexity !== undefined),
        qualityPrediction: !!(theme && complexity !== undefined && modelUsed)
      }
    });

  } catch (error: any) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
