import * as SQLite from 'expo-sqlite';
import { AuditAction, AuditEvent } from '../types/core';

export class AuditService {
  private static instance: AuditService;
  private db: SQLite.SQLiteDatabase | null = null;

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mongars_audit.db');
      
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          detail TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
      `);
    } catch (error) {
      console.error('Failed to initialize audit database:', error);
    }
  }

  async log(action: AuditAction | string, detail: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const id = this.generateId();
      const timestamp = Date.now();
      
      await this.db!.runAsync(
        'INSERT INTO audit_log (id, action, detail, timestamp) VALUES (?, ?, ?, ?)',
        [id, action, detail, timestamp]
      );
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  async getAllEvents(): Promise<AuditEvent[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM audit_log ORDER BY timestamp DESC'
      );
      
      return result.map((row: any) => ({
        id: row.id,
        action: row.action as AuditAction,
        detail: row.detail,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }
  }

  async getRecentEvents(limit: number = 50): Promise<AuditEvent[]> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      const result = await this.db!.getAllAsync(
        'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );
      
      return result.map((row: any) => ({
        id: row.id,
        action: row.action as AuditAction,
        detail: row.detail,
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get recent audit events:', error);
      return [];
    }
  }

  async clearAll(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      await this.db!.runAsync('DELETE FROM audit_log');
      await this.log(AuditAction.PANIC_WIPE, 'All audit logs cleared');
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}