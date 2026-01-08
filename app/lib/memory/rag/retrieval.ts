// app/lib/memory/rag/retrieval.ts
// Chroma vector database integration for semantic search

import { ChromaClient } from 'chromadb';
import { RetrievalResult, Message } from '../schemas';
import { OllamaEmbeddings } from './embeddings';
import { getStorage } from '../storage';

/**
 * Chroma Retrieval Engine
 * Manages vector storage and semantic search
 */
export class ChromaRetrieval {
  private client: ChromaClient;
  private collectionName: string;
  private embeddings: OllamaEmbeddings;
  private topK: number;
  private similarityThreshold: number;

  constructor(
    embeddingModel: OllamaEmbeddings,
    collectionName: string = 'hackerreign_conversations',
    topK: number = 5,
    similarityThreshold: number = 0.3
  ) {
    // Initialize Chroma client with host/port (HTTP connection)
    const chromaHost = process.env.CHROMA_HOST || 'localhost';
    const chromaPort = process.env.CHROMA_PORT || '8000';

    this.client = new ChromaClient({
      path: `http://${chromaHost}:${chromaPort}`,
    });

    this.collectionName = collectionName;
    this.embeddings = embeddingModel;
    this.topK = topK;
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * Initialize Chroma collection
   */
  async initialize(): Promise<void> {
    try {
      // Get or create collection
      await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: {
          hnsw_space: 'cosine', // Use cosine similarity
          description: 'Hacker Reign conversation embeddings',
        },
      });

      console.log(`[ChromaRetrieval] Collection '${this.collectionName}' ready`);
    } catch (error) {
      console.error('[ChromaRetrieval] Error initializing collection:', error);
      throw error;
    }
  }

  /**
   * Add message embedding to Chroma
   * Stores both user and assistant messages
   */
  async addMessageEmbedding(message: Message): Promise<void> {
    try {
      // Generate embedding for the message content
      const embedding = await this.embeddings.embed(message.content);

      // Get collection
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      // Add to collection with metadata
      await collection.add({
        ids: [message.id],
        embeddings: [embedding],
        documents: [message.content],
        metadatas: [
          {
            conversation_id: message.conversation_id,
            role: message.role,
            created_at: message.created_at,
            model_used: message.model_used || 'unknown',
            message_length: message.content.length,
          },
        ],
      });

      console.log(`[ChromaRetrieval] Added message ${message.id} to Chroma`);
    } catch (error) {
      console.error('[ChromaRetrieval] Error adding message embedding:', error);
      throw error;
    }
  }

  /**
   * Add multiple message embeddings in batch
   * More efficient than adding one at a time
   */
  async addMessageEmbeddingsBatch(messages: Message[]): Promise<void> {
    try {
      if (messages.length === 0) return;

      // Generate embeddings for all messages
      const contents = messages.map(m => m.content);
      const embeddings = await this.embeddings.embedBatch(contents);

      // Prepare data for Chroma
      const ids = messages.map(m => m.id);
      const documents = messages.map(m => m.content);
      const metadatas = messages.map(m => ({
        conversation_id: m.conversation_id,
        role: m.role,
        created_at: m.created_at,
        model_used: m.model_used || 'unknown',
        message_length: m.content.length,
      }));

      // Get collection
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      // Add to collection
      await collection.add({
        ids,
        embeddings,
        documents,
        metadatas,
      });

      console.log(`[ChromaRetrieval] Added ${messages.length} messages to Chroma`);
    } catch (error) {
      console.error('[ChromaRetrieval] Error adding batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Search for semantically similar messages
   * Returns top-k messages with similarity scores
   */
  async search(
    query: string,
    topK?: number,
    filters?: Record<string, any>
  ): Promise<RetrievalResult[]> {
    try {
      const k = topK || this.topK;
      const startTime = Date.now();

      // Generate query embedding
      const queryEmbedding = await this.embeddings.embed(query);

      // Get collection
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      // Query collection
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k,
        where: filters, // Optional metadata filtering
        include: ['embeddings', 'distances', 'documents', 'metadatas'],
      });

      const responseTime = Date.now() - startTime;

      // Log search for analytics
      const storage = getStorage();
      const topScore = (results.distances?.[0]?.[0] || 0);
      storage.logSearchQuery(
        query,
        results.ids?.[0]?.length || 0,
        topScore,
        responseTime
      );

      // Transform results
      if (!results.ids?.[0] || results.ids[0].length === 0) {
        console.log('[ChromaRetrieval] No results found for query');
        return [];
      }

      const retrievalResults: RetrievalResult[] = [];

      for (let i = 0; i < results.ids[0].length; i++) {
        const messageId = results.ids[0][i];
        const distance = results.distances?.[0]?.[i] || 0;
        const document = results.documents?.[0]?.[i] || '';
        const metadata = results.metadatas?.[0]?.[i] as any || {};

        // Chroma uses distance (lower is better), convert to similarity (0-1)
        // For cosine: similarity = 1 - distance
        const similarity = Math.max(0, 1 - distance);

        // Filter by threshold
        if (similarity < this.similarityThreshold) {
          continue;
        }

        // Fetch full message from database
        const storage = getStorage();
        const fullMessage = storage.getMessage(messageId);

        if (fullMessage) {
          retrievalResults.push({
            message: fullMessage,
            similarity_score: similarity,
            conversation_summary: metadata.conversation_id,
          });
        }
      }

      console.log(
        `[ChromaRetrieval] Found ${retrievalResults.length} results (${responseTime}ms)`
      );

      return retrievalResults;
    } catch (error) {
      console.error('[ChromaRetrieval] Error searching:', error);
      throw error;
    }
  }

  /**
   * Search with metadata filters
   * Example: Find only messages from a specific conversation or role
   */
  async searchWithFilters(
    query: string,
    filters: {
      conversation_id?: string;
      role?: 'user' | 'assistant';
      dateRange?: { from: Date; to: Date };
    },
    topK?: number
  ): Promise<RetrievalResult[]> {
    const chromaFilters: Record<string, any> = {};

    if (filters.conversation_id) {
      chromaFilters.conversation_id = { $eq: filters.conversation_id };
    }

    if (filters.role) {
      chromaFilters.role = { $eq: filters.role };
    }

    // Note: Chroma doesn't have direct date range support in filters
    // We'll filter on the client side after retrieval

    return this.search(query, topK, chromaFilters);
  }

  /**
   * Delete message from Chroma
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      await collection.delete({ ids: [messageId] });
      console.log(`[ChromaRetrieval] Deleted message ${messageId}`);
    } catch (error) {
      console.error('[ChromaRetrieval] Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Delete all embeddings for a conversation
   */
  async deleteConversationEmbeddings(conversationId: string): Promise<void> {
    try {
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      // Query to find all messages in this conversation
      const results = await collection.get({
        where: { conversation_id: { $eq: conversationId } },
      });

      if (results.ids && results.ids.length > 0) {
        await collection.delete({ ids: results.ids });
        console.log(
          `[ChromaRetrieval] Deleted ${results.ids.length} embeddings for conversation ${conversationId}`
        );
      }
    } catch (error) {
      console.error('[ChromaRetrieval] Error deleting conversation embeddings:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    count: number;
    name: string;
  }> {
    try {
      const collection = await this.client.getCollection({
        name: this.collectionName,
      });

      const count = await collection.count();

      return {
        count,
        name: this.collectionName,
      };
    } catch (error) {
      console.error('[ChromaRetrieval] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Clear entire collection
   */
  async clear(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      await this.initialize();
      console.log(`[ChromaRetrieval] Collection cleared and reinitialized`);
    } catch (error) {
      console.error('[ChromaRetrieval] Error clearing collection:', error);
      throw error;
    }
  }
}