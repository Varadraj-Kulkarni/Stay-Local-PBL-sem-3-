import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { SQLITE_SCHEMA } from './schema.ts';

export interface DatabaseAdapter {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | null>;
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (db: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export class SqliteAdapter implements DatabaseAdapter {
  private db: DatabaseSync;

  constructor(filePath: string) {
    if (filePath !== ':memory:') {
      mkdirSync(dirname(filePath), { recursive: true });
    }
    this.db = new DatabaseSync(filePath);
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async init(): Promise<void> {
    this.db.exec(SQLITE_SCHEMA);
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    return (result as T) ?? null;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const stmt = this.db.prepare(sql);
    const res = stmt.run(...params);
    return {
      changes: Number(res.changes),
      lastInsertRowid: res.lastInsertRowid,
    };
  }

  async transaction<T>(fn: (db: DatabaseAdapter) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN IMMEDIATE;');
    try {
      const result = await fn(this);
      this.db.exec('COMMIT;');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // ignore rollback error
      }
      throw err;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
