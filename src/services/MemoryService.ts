import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { MemoryEntry } from '../types/core';
import { AuditService } from './AuditService';

export class MemoryService {
  private static instance: MemoryService;
  private db: SQLite.SQLiteDatabase | null = null;

  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mongars_memory.db');
      
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          metadata TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_memory_created ON memories(created_at);
        CREATE INDEX IF NOT EXISTS idx_memory_content ON memories(content);
      `);
    } catch (error) {
      console.error('Failed to initialize memory database:', error);
    }
  }

  async saveMemory(content: string, metadata: Record<string, any> = {}): Promise<string> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content + Date.now().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      const createdAt = Date.now();
      const metadataJson = JSON.stringify(metadata);
      
      await this.db!.runAsync(
        'INSERT INTO memories (id, content, metadata, created_at) VALUES (?, ?, ?, ?)',
        [id, content, metadataJson, createdAt]
      );

      AuditService.getInstance().log('memory_write', `Memory saved: ${id.substring(0, 8)}...`);
      return id;
    } catch (error) {
      console.error('Failed to save memory:', error);
      throw error;
    }
  }

  async getMemories(query?: string, limit: number = 100): Promise<MemoryEntry[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      let sql = 'SELECT * FROM memories';
      const params: any[] = [];

      if (query && query.trim()) {
        sql += ' WHERE content LIKE ?';
        params.push(`%${query}%`);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const result = await this.db!.getAllAsync(sql, params);
      
      return result.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Failed to get memories:', error);
      return [];
    }
  }

  async getMemoryById(id: string): Promise<MemoryEntry | null> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT * FROM memories WHERE id = ?',
        [id]
      );

      if (!result) return null;

      return {
        id: (result as any).id,
        content: (result as any).content,
        metadata: JSON.parse((result as any).metadata || '{}'),
        createdAt: new Date((result as any).created_at)
      };
    } catch (error) {
      console.error('Failed to get memory by id:', error);
      return null;
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.runAsync('DELETE FROM memories WHERE id = ?', [id]);
      AuditService.getInstance().log('memory_delete', `Memory deleted: ${id.substring(0, 8)}...`);
      return true;
    } catch (error) {
      console.error('Failed to delete memory:', error);
      return false;
    }
  }

  async clearAllMemories(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.runAsync('DELETE FROM memories');
      AuditService.getInstance().log('panic_wipe', 'All memories cleared');
    } catch (error) {
      console.error('Failed to clear memories:', error);
      throw error;
    }
  }

  async getMemoryStats(): Promise<{ totalMemories: number; totalSize: number }> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.getFirstAsync(
        'SELECT COUNT(*) as count, SUM(LENGTH(content)) as size FROM memories'
      ) as any;

      return {
        totalMemories: result?.count || 0,
        totalSize: result?.size || 0
      };
    } catch (error) {
      console.error('Failed to get memory stats:', error);
      return { totalMemories: 0, totalSize: 0 };
    }
  }
}