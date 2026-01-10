// lib/dl-codegen/index.ts
// Production DL CodeGen orchestrator for Hacker Reign - integrates with LLM pipeline
import { preprocessCodeData } from './preprocess';
import { loadModel, predictCodeCompletion } from './model';
import { trainModel } from './train';
import type { CodeDataset, DLConfig, Prediction } from './types';

export class DLCodeGen {
  private modelPath = `${process.cwd()}/.data/dl-model.pt`;
  private config: DLConfig = {
    hiddenLayers: [512, 256, 128, 64],
    dropout: 0.2,
    lr: 0.001,
    epochs: 50,
    batchSize: 64,
    embeddingDim: 384, // Matches nomic-embed-text
  };

  async predict(prompt: string, context: string[] = []): Promise<Prediction> {
    // Combine prompt with context into a single input string
    const combinedInput = [prompt, ...context].join('\n');
    const data = await preprocessCodeData(combinedInput);
    const model = await loadModel(this.modelPath);
    return predictCodeCompletion(model, data);
  }

  async train(datasetPath: string): Promise<{ loss: number; accuracy: number }> {
    const dataset = await preprocessCodeData(datasetPath);
    return trainModel(dataset, this.modelPath, this.config);
  }

  static getInstance(): DLCodeGen {
    return new DLCodeGen();
  }
}

export default DLCodeGen;
