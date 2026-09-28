import pg from 'pg';
import type { DatabaseAdapter } from './sqlite.ts';
import { POSTGRES_SCHEMA } from './schema.ts';

const { Pool } = pg;

export class PostgresAdapter implements DatabaseAdapter {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async init(): Promise<void> {
    await this.exec(POSTGRES_SCHEMA);
  }

  private transformSql(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.pool.query(this.transformSql(sql), params);
    return res.rows as T[];
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const res = await this.pool.query(this.transformSql(sql), params);
    return (res.rows[0] as T) ?? null;
  }

  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const res = await this.pool.query(this.transformSql(sql), params);
    return {
      changes: res.rowCount ?? 0,
    };
  }

  async transaction<T>(fn: (db: DatabaseAdapter) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txAdapter: DatabaseAdapter = {
        query: async <R = any>(sql: string, params: any[] = []) => {
          let index = 1;
          const transformed = sql.replace(/\?/g, () => `$${index++}`);
          const res = await client.query(transformed, params);
          return res.rows as R[];
        },
        get: async <R = any>(sql: string, params: any[] = []) => {
          let index = 1;
          const transformed = sql.replace(/\?/g, () => `$${index++}`);
          const res = await client.query(transformed, params);
          return (res.rows[0] as R) ?? null;
        },
        run: async (sql: string, params: any[] = []) => {
          let index = 1;
          const transformed = sql.replace(/\?/g, () => `$${index++}`);
          const res = await client.query(transformed, params);
          return { changes: res.rowCount ?? 0 };
        },
        exec: async (sql: string) => {
          await client.query(sql);
        },
        transaction: async <SubT>(subFn: (db: DatabaseAdapter) => Promise<SubT>) => {
          return subFn(txAdapter);
        },
        close: async () => {},
      };
      const result = await fn(txAdapter);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
