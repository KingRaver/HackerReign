// app/lib/strategy/workflows/ensemble.ts
import OpenAI from 'openai';
import { EnsembleConfig } from '../types';

/**
 * Ensemble Voting Workflow - COMPLETE IMPLEMENTATION
 * Parallel models → Weighted consensus
 */

export class EnsembleWorkflow {
  static async executeEnsemble(
    config: EnsembleConfig,
    messages: any[],
    question: string,
    options: {
      timeoutMs?: number;
      requireConsensus?: boolean;
    } = {}
  ): Promise<EnsembleResult> {
    const startTime = Date.now();
    const results = await Promise.allSettled(
      config.models.map(model => this.runModelVote(model, messages, question))
    );

    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<ModelVote> => r.status === 'fulfilled')
      .map(r => r.value);

    if (successfulResults.length === 0) {
      throw new Error('All ensemble models failed');
    }

    const votingResult = this.calculateWeightedVote(successfulResults, config);
    const executionTime = Date.now() - startTime;

    const consensusThreshold = config.minConsensusThreshold || 0.7;
    const finalVerdict = votingResult.confidence < consensusThreshold
      ? "NO CONSENSUS - needs human review"
      : votingResult.consensus;

    return {
      consensus: finalVerdict,
      confidence: votingResult.confidence,
      votes: successfulResults,
      voteBreakdown: votingResult.breakdown,
      executionTime,
      modelAgreement: successfulResults.length / config.models.length
    };
  }

  private static async runModelVote(
    model: string,
    messages: any[],
    question: string
  ): Promise<ModelVote> {
    const openai = new OpenAI({ baseURL: 'http://localhost:11434/v1', apiKey: 'ollama' });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `EXPERT VOTE MODE. Answer "${question}" with structured JSON:
{
  "verdict": "YES" | "NO" | "MAYBE",
  "confidence": 0.1-1.0,
  "reasoning": "brief explanation",
  "risk_level": "LOW" | "MEDIUM" | "HIGH"
}`
        },
        ...messages
      ],
      max_tokens: 300,
      temperature: 0.1  // High consistency
    });

    let verdictData: VerdictData;
    try {
      const content = response.choices[0].message.content || '{}';
      verdictData = JSON.parse(content);
    } catch {
      // Fallback parsing
      const textVerdict = response.choices[0].message.content || '';
      verdictData = {
        verdict: textVerdict.includes('yes') ? 'YES' : 'NO',
        confidence: 0.5,
        reasoning: textVerdict.slice(0, 200),
        risk_level: 'MEDIUM'
      };
    }

    return {
      model,
      tokensUsed: response.usage?.total_tokens || 0,
      ...verdictData
    };
  }

  private static calculateWeightedVote(
    votes: ModelVote[],
    config: EnsembleConfig
  ): VotingResult {
    const normalizedVotes: Record<string, WeightedVote> = {
      YES: { count: 0, totalWeight: 0, totalConf: 0 },
      NO: { count: 0, totalWeight: 0, totalConf: 0 },
      MAYBE: { count: 0, totalWeight: 0, totalConf: 0 }
    };

    votes.forEach(vote => {
      const weight = config.weights?.[vote.model] || 1.0;
      normalizedVotes[vote.verdict].count += 1;
      normalizedVotes[vote.verdict].totalWeight += weight;
      normalizedVotes[vote.verdict].totalConf += vote.confidence * weight;
    });

    // Find winner
    const weightedScores = Object.entries(normalizedVotes).map(([verdict, data]) => ({
      verdict,
      score: data.totalWeight * (data.totalConf / Math.max(data.count, 1))
    }));

    const winner = weightedScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    const maxScore = Math.max(...weightedScores.map(w => w.score));
    const avgConf = weightedScores.reduce((sum, w) => sum + w.score, 0) / weightedScores.length;
    const confidence = Math.min(1, maxScore / votes.length * avgConf);

    return {
      consensus: winner.verdict,
      confidence,
      breakdown: normalizedVotes,
      winningScore: winner.score
    };
  }
}

export interface ModelVote {
  model: string;
  verdict: 'YES' | 'NO' | 'MAYBE';
  confidence: number;
  reasoning: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  tokensUsed: number;
}

interface WeightedVote {
  count: number;
  totalWeight: number;
  totalConf: number;
}

interface VerdictData {
  verdict: 'YES' | 'NO' | 'MAYBE';
  confidence: number;
  reasoning: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface VotingResult {
  consensus: string;
  confidence: number;
  breakdown: Record<string, WeightedVote>;
  winningScore: number;
}

export interface EnsembleResult {
  consensus: string;
  confidence: number;
  votes: ModelVote[];
  voteBreakdown: Record<string, WeightedVote>;
  executionTime: number;
  modelAgreement: number;
}