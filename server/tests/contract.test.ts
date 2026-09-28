import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/http/app.ts';
import { getDb } from '../src/db/index.ts';

let app: FastifyInstance;

beforeAll(async () => {
  process.env['STAYLOCAL_DATABASE_MODE'] = 'sqlite';
  await getDb();
  app = await createServer();
});

describe('Contract Schema & Error Invariants', () => {
  it('StandardError schema: 404 returns { code, message, requestId, details }', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/properties/non-existent-prop-9999',
    });

    expect(res.statusCode).toBe(404);
    const err = JSON.parse(res.body);
    expect(err).toHaveProperty('code');
    expect(err).toHaveProperty('message');
    expect(err).toHaveProperty('requestId');
    expect(err).toHaveProperty('details');
    expect(typeof err.code).toBe('string');
    expect(typeof err.message).toBe('string');
    expect(typeof err.requestId).toBe('string');
  });

  it('StandardError schema: 401 returns { code, message, requestId, details }', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      // no auth header
    });

    expect(res.statusCode).toBe(401);
    const err = JSON.parse(res.body);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.requestId).toBeDefined();
  });

  it('Destination schema conformance', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/destinations/dest-bhimashankar',
    });

    expect(res.statusCode).toBe(200);
    const dest = JSON.parse(res.body);
    expect(dest.id).toBe('dest-bhimashankar');
    expect(typeof dest.name).toBe('string');
    expect(typeof dest.tagline).toBe('string');
    expect(typeof dest.description).toBe('string');
    expect(typeof dest.imageUrl).toBe('string');
    expect(typeof dest.latitude).toBe('number');
    expect(typeof dest.longitude).toBe('number');
  });

  it('Property schema conformance', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/properties/prop-1001',
    });

    expect(res.statusCode).toBe(200);
    const p = JSON.parse(res.body);
    expect(p.id).toBe('prop-1001');
    expect(p.destinationId).toBe('dest-bhimashankar');
    expect(typeof p.title).toBe('string');
    expect(typeof p.pricePerNight).toBe('number');
    expect(typeof p.maxGuests).toBe('number');
    expect(Array.isArray(p.amenities)).toBe(true);
    expect(Array.isArray(p.photos)).toBe(true);
    expect(typeof p.locationVerified).toBe('boolean');
    expect(p.status).toBe('APPROVED');
  });
});
