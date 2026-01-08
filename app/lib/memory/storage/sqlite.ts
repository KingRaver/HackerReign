// app/lib/memory/storage/sqlite.ts
// Production-grade SQLite wrapper using better-sqlite3

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import {
  Message,
  Conversation,
  UserPreference,
  EmbeddingMetadata,
  Session,
} from '../schemas';

/**
 * SQLite Storage Implementation
 * Handles all database operations with prepared statements
 * Thread-safe and optimized for Next.js
 */
export class SQLiteStorage {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const schemaPath = path.join(process.cwd(), 'app/lib/memory/migrations/init.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    statements.forEach(statement => {
      try {
        this.db.exec(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!(error instanceof Error) || !error.message.includes('already exists')) {
          throw error;
        }
      }
    });

    this.initialized = true;
    console.log('[SQLite] Database initialized successfully');
  }

  /**
   * CREATE: Save a new conversation
   */
  saveConversation(conversation: Omit<Conversation, 'created_at' | 'updated_at'>): Conversation {
    const id = conversation.id || this.generateId('conv');
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, title, created_at, updated_at, model_used, total_tokens, summary, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      conversation.title,
      now,
      now,
      conversation.model_used || null,
      conversation.total_tokens,
      conversation.summary || null,
      conversation.tags ? JSON.stringify(conversation.tags) : null
    );

    return {
      ...conversation,
      id,
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * READ: Get conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `);

    const row = stmt.get(conversationId) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at,
      model_used: row.model_used,
      total_tokens: row.total_tokens,
      summary: row.summary,
      tags: row.tags ? JSON.parse(row.tags) : [],
    };
  }

  /**
   * READ: Get all conversations (with pagination)
   */
  getAllConversations(limit: number = 50, offset: number = 0): Conversation[] {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limit, offset) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      created_at: row.created_at,
      updated_at: row.updated_at,
      model_used: row.model_used,
      total_tokens: row.total_tokens,
      summary: row.summary,
      tags: row.tags ? JSON.parse(row.tags) : [],
    }));
  }

  /**
   * CREATE: Save a message
   */
  saveMessage(message: Omit<Message, 'created_at'>): Message {
    const id = message.id || this.generateId('msg');
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO messages 
      (id, conversation_id, role, content, created_at, tokens_used, tool_calls, tool_results, model_used, temperature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      message.conversation_id,
      message.role,
      message.content,
      now,
      message.tokens_used || null,
      message.tool_calls ? JSON.stringify(message.tool_calls) : null,
      message.tool_results ? JSON.stringify(message.tool_results) : null,
      message.model_used || null,
      message.temperature || null
    );

    return {
      ...message,
      id,
      created_at: now,
    };
  }

  /**
   * READ: Get message by ID
   */
  getMessage(messageId: string): Message | null {
    const stmt = this.db.prepare(`
      SELECT * FROM messages WHERE id = ?
    `);

    const row = stmt.get(messageId) as any;
    if (!row) return null;

    return {
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      tokens_used: row.tokens_used,
      tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      tool_results: row.tool_results ? JSON.parse(row.tool_results) : undefined,
      model_used: row.model_used,
      temperature: row.temperature,
    };
  }

  /**
   * READ: Get all messages in a conversation
   */
  getConversationMessages(conversationId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `);

    const rows = stmt.all(conversationId) as any[];
    return rows.map(row => ({
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      tokens_used: row.tokens_used,
      tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      tool_results: row.tool_results ? JSON.parse(row.tool_results) : undefined,
      model_used: row.model_used,
      temperature: row.temperature,
    }));
  }

  /**
   * READ: Search messages by role and date range
   */
  searchMessages(
    conversationId: string,
    role?: 'user' | 'assistant',
    fromDate?: Date,
    toDate?: Date
  ): Message[] {
    let query = `SELECT * FROM messages WHERE conversation_id = ?`;
    const params: any[] = [conversationId];

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (fromDate) {
      query += ` AND created_at >= ?`;
      params.push(fromDate.toISOString());
    }

    if (toDate) {
      query += ` AND created_at <= ?`;
      params.push(toDate.toISOString());
    }

    query += ` ORDER BY created_at ASC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      conversation_id: row.conversation_id,
      role: row.role,
      content: row.content,
      created_at: row.created_at,
      tokens_used: row.tokens_used,
      tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : undefined,
      tool_results: row.tool_results ? JSON.parse(row.tool_results) : undefined,
      model_used: row.model_used,
      temperature: row.temperature,
    }));
  }

  /**
   * UPDATE: Update conversation
   */
  updateConversation(conversationId: string, updates: Partial<Conversation>): void {
    const now = new Date().toISOString();
    const allowedFields = ['title', 'model_used', 'total_tokens', 'summary', 'tags'];
    const setClauses: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        if (key === 'tags' && Array.isArray(value)) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    values.push(conversationId);

    const stmt = this.db.prepare(`
      UPDATE conversations 
      SET ${setClauses.join(', ')} 
      WHERE id = ?
    `);

    stmt.run(...values);
  }

  /**
   * DELETE: Delete a conversation and all its messages
   */
  deleteConversation(conversationId: string): void {
    const stmt = this.db.prepare(`DELETE FROM conversations WHERE id = ?`);
    stmt.run(conversationId);
  }

  /**
   * PREFERENCES: Set or update a user preference
   */
  setPreference(key: string, value: string | number | boolean | object, dataType?: string): void {
    const now = new Date().toISOString();
    let valueStr = String(value);
    let type = dataType || 'string';

    if (typeof value === 'object') {
      valueStr = JSON.stringify(value);
      type = 'json';
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    }

    const stmt = this.db.prepare(`
      INSERT INTO user_preferences (key, value, data_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        data_type = excluded.data_type,
        updated_at = excluded.updated_at
    `);

    stmt.run(key, valueStr, type, now, now);
  }

  /**
   * PREFERENCES: Get a user preference
   */
  getPreference(key: string): UserPreference | null {
    const stmt = this.db.prepare(`SELECT * FROM user_preferences WHERE key = ?`);
    const row = stmt.get(key) as any;

    if (!row) return null;

    return {
      key: row.key,
      value: row.value,
      data_type: row.data_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * PREFERENCES: Get all user preferences
   */
  getAllPreferences(): Record<string, any> {
    const stmt = this.db.prepare(`SELECT * FROM user_preferences`);
    const rows = stmt.all() as any[];

    const result: Record<string, any> = {};
    rows.forEach(row => {
      if (row.data_type === 'json') {
        result[row.key] = JSON.parse(row.value);
      } else if (row.data_type === 'number') {
        result[row.key] = Number(row.value);
      } else if (row.data_type === 'boolean') {
        result[row.key] = row.value === 'true';
      } else {
        result[row.key] = row.value;
      }
    });

    return result;
  }

  /**
   * EMBEDDING METADATA: Track embedding status
   */
  saveEmbeddingMetadata(metadata: Omit<EmbeddingMetadata, 'created_at'>): EmbeddingMetadata {
    const id = metadata.id || this.generateId('emb');
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO embedding_metadata 
      (id, message_id, conversation_id, chroma_id, created_at, embedding_status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      metadata.message_id,
      metadata.conversation_id,
      metadata.chroma_id || null,
      now,
      metadata.embedding_status,
      metadata.error_message || null
    );

    return {
      ...metadata,
      id,
      created_at: now,
    };
  }

  /**
   * EMBEDDING METADATA: Get pending embeddings
   */
  getPendingEmbeddings(limit: number = 100): EmbeddingMetadata[] {
    const stmt = this.db.prepare(`
      SELECT * FROM embedding_metadata 
      WHERE embedding_status = 'pending'
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      message_id: row.message_id,
      conversation_id: row.conversation_id,
      chroma_id: row.chroma_id,
      created_at: row.created_at,
      embedding_status: row.embedding_status,
      error_message: row.error_message,
    }));
  }

  /**
   * EMBEDDING METADATA: Update embedding status
   */
  updateEmbeddingStatus(
    embeddingId: string,
    status: 'success' | 'failed',
    chromaId?: string,
    errorMessage?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE embedding_metadata 
      SET embedding_status = ?, chroma_id = ?, error_message = ?
      WHERE id = ?
    `);

    stmt.run(status, chromaId || null, errorMessage || null, embeddingId);
  }

  /**
   * ANALYTICS: Log a search query
   */
  logSearchQuery(
    query: string,
    retrievedCount: number,
    topSimilarity: number,
    responsTimeMs: number
  ): void {
    const id = this.generateId('search');
    const stmt = this.db.prepare(`
      INSERT INTO search_queries 
      (id, query, retrieved_messages_count, top_similarity_score, created_at, response_time_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, query, retrievedCount, topSimilarity, new Date().toISOString(), responsTimeMs);
  }

  /**
   * UTILITY: Get database statistics
   */
  getStats(): {
    total_conversations: number;
    total_messages: number;
    pending_embeddings: number;
    total_tokens: number;
    oldest_message: string | null;
    newest_message: string | null;
  } {
    const conversationCount = (
      this.db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any
    ).count;

    const messageCount = (this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as any)
      .count;

    const pendingCount = (
      this.db.prepare('SELECT COUNT(*) as count FROM embedding_metadata WHERE embedding_status = ?').get('pending') as any
    ).count;

    const totalTokens = (
      this.db.prepare('SELECT SUM(tokens_used) as total FROM messages').get() as any
    ).total || 0;

    const oldestMsg = (
      this.db.prepare('SELECT created_at FROM messages ORDER BY created_at ASC LIMIT 1').get() as any
    )?.created_at || null;

    const newestMsg = (
      this.db.prepare('SELECT created_at FROM messages ORDER BY created_at DESC LIMIT 1').get() as any
    )?.created_at || null;

    return {
      total_conversations: conversationCount,
      total_messages: messageCount,
      pending_embeddings: pendingCount,
      total_tokens: totalTokens,
      oldest_message: oldestMsg,
      newest_message: newestMsg,
    };
  }

  /**
   * UTILITY: Close database connection
   */
  close(): void {
    this.db.close();
    console.log('[SQLite] Database closed');
  }

  /**
   * UTILITY: Generate unique IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}