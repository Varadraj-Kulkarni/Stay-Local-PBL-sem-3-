import { createServer } from './http/app.ts';
import { getDb } from './db/index.ts';

async function main() {
  const port = Number(process.env['PORT'] || 8787);
  const host = process.env['HOST'] || '0.0.0.0';

  console.log(`[StayLocal API] Initializing database in ${process.env['STAYLOCAL_DATABASE_MODE'] || 'sqlite'} mode...`);
  await getDb();

  const server = await createServer();
  await server.listen({ port, host });

  console.log(`[StayLocal API] Server listening on http://localhost:${port}`);
  console.log(`[StayLocal API] Base API path: http://localhost:${port}/api/v1`);
}

main().catch((err) => {
  console.error('[StayLocal API] Fatal startup error:', err);
  process.exit(1);
});
