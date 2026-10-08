import type { DatabaseAdapter } from './sqlite.ts';
import { SqliteAdapter } from './sqlite.ts';
import { PostgresAdapter } from './postgres.ts';
import { seedDatabase } from './seed.ts';

let activeDb: DatabaseAdapter | null = null;

export async function getDb(): Promise<DatabaseAdapter> {
  if (activeDb) {
    return activeDb;
  }

  const mode = process.env['STAYLOCAL_DATABASE_MODE'] || 'sqlite';

  if (mode === 'postgres') {
    const url = process.env['STAYLOCAL_DATABASE_URL'];
    if (!url) {
      throw new Error('STAYLOCAL_DATABASE_URL is required when STAYLOCAL_DATABASE_MODE=postgres');
    }
    const pg = new PostgresAdapter(url);
    await pg.init();
    // await seedDatabase(pg); // Removed test/demo data
    activeDb = pg;
    return pg;
  } else {
    const sqlitePath = process.env['STAYLOCAL_SQLITE_PATH'] || './data/staylocal.sqlite';
    const sqlite = new SqliteAdapter(sqlitePath);
    await sqlite.init();
    // await seedDatabase(sqlite); // Removed test/demo data
    activeDb = sqlite;
    return sqlite;
  }
}

export type { DatabaseAdapter };
