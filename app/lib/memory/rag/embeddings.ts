// app/lib/memory/rag/embeddings.ts
// Ollama embeddings - converts text to dense vectors

import { EmbeddingRequest, EmbeddingResponse } from '../schemas';

/**
 * Ollama Embeddings Manager
 * Handles conversion of text to embeddings using Ollama's API
 *
 * Normalization note: Ollama embeddings are typically already normalized (L2),
 * but we normalize again to ensure consistent similarity calculations
 */
export class OllamaEmbeddings {
  private ollamaHost: string;
  private embeddingModel: string;
  private cache: Map<string, number[]> = new Map();

  constructor(
    ollamaHost: string = process.env.OLLAMA_EMBED_HOST || 'http://localhost:11434',
    embeddingModel: string = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
  ) {
    this.ollamaHost = ollamaHost;
    this.embeddingModel = embeddingModel;
  }

  /**
   * Embed a single text string
   * Returns a normalized vector (unit length)
   */
  async embed(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const payload: EmbeddingRequest = {
        model: this.embeddingModel,
        input: text,
      };

      const response = await fetch(`${this.ollamaHost}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama embedding failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as EmbeddingResponse;

      if (!data.embeddings || data.embeddings.length === 0) {
        throw new Error('No embeddings returned from Ollama');
      }

      // Get first embedding and normalize it
      let embedding = data.embeddings[0];
      embedding = this.normalize(embedding);

      // Cache the result
      this.cache.set(cacheKey, embedding);

      return embedding;
    } catch (error) {
      console.error('[OllamaEmbeddings] Error embedding text:', error);
      throw error;
    }
  }

  /**
   * Embed multiple texts at once
   * More efficient than calling embed() multiple times
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const payload: EmbeddingRequest = {
        model: this.embeddingModel,
        input: texts,
      };

      const response = await fetch(`${this.ollamaHost}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Ollama batch embedding failed: ${response.status} ${response.statusText}`
        );
      }

      const data = (await response.json()) as EmbeddingResponse;

      if (!data.embeddings) {
        throw new Error('No embeddings returned from Ollama');
      }

      // Normalize all embeddings and cache them
      const normalized = data.embeddings.map((emb, idx) => {
        const norm = this.normalize(emb);
        const cacheKey = this.getCacheKey(texts[idx]);
        this.cache.set(cacheKey, norm);
        return norm;
      });

      return normalized;
    } catch (error) {
      console.error('[OllamaEmbeddings] Error embedding batch:', error);
      throw error;
    }
  }

  /**
   * Check if the embedding model is available in Ollama
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaHost}/api/tags`);
      if (!response.ok) return false;

      const data = (await response.json()) as { models: Array<{ name: string }> };
      return data.models.some(m => m.name.startsWith(this.embeddingModel));
    } catch (error) {
      console.error('[OllamaEmbeddings] Error checking model availability:', error);
      return false;
    }
  }

  /**
   * Calculate cosine similarity between two normalized vectors
   * Result is between -1 and 1, where 1 is identical
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }

    return dotProduct;
  }

  /**
   * Normalize a vector to unit length (L2 normalization)
   * This makes similarity calculations consistent and accurate
   *
   * Formula: v' = v / ||v|| where ||v|| = sqrt(sum(v_i^2))
   */
  private normalize(vector: number[]): number[] {
    let magnitude = 0;

    // Calculate magnitude (L2 norm)
    for (const value of vector) {
      magnitude += value * value;
    }

    magnitude = Math.sqrt(magnitude);

    // Avoid division by zero
    if (magnitude === 0) {
      console.warn('[OllamaEmbeddings] Warning: zero-magnitude vector detected');
      return vector;
    }

    // Normalize by dividing by magnitude
    return vector.map(v => v / magnitude);
  }

  /**
   * Get embedding dimensions (lazy-loaded)
   * Caches the dimension count after first embed
   */
  private embeddingDimension: number | null = null;

  async getEmbeddingDimension(): Promise<number> {
    if (this.embeddingDimension !== null) {
      return this.embeddingDimension;
    }

    // Get dimension by embedding a simple test string
    const testEmbed = await this.embed('test');
    this.embeddingDimension = testEmbed.length;
    return this.embeddingDimension;
  }

  /**
   * Clear embedding cache (if memory is a concern)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: number } {
    return {
      size: this.cache.size,
      keys: this.cache.size,
    };
  }

  /**
   * Internal: Generate cache key (simple hash of text)
   */
  private getCacheKey(text: string): string {
    // Simple hash: use first 50 chars + length
    return `${text.substring(0, 50)}_${text.length}`;
  }
}