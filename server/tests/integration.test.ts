import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/http/app.ts';
import { getDb } from '../src/db/index.ts';

let app: FastifyInstance;
let touristToken: string;
let hostToken: string;
let adminToken: string;
let testPropertyId: string;
let testBookingId: string;

beforeAll(async () => {
  process.env['STAYLOCAL_DATABASE_MODE'] = 'sqlite';
  process.env['STAYLOCAL_ALLOW_SIMULATION'] = 'true';
  const db = await getDb();
  
  // Clean up any previous test runs
  await db.run("DELETE FROM bookings WHERE check_in LIKE '2026-11-%'");
  await db.run("DELETE FROM properties WHERE title = 'Misty Ridge Homestay'");
  await db.run("UPDATE rewards SET status = 'AVAILABLE', redeemed_on_booking_id = null WHERE code = 'STAY100-AB12CD'");

  app = await createServer();

  // Login as demo tourist
  const tRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'tourist@staylocal.demo',
      password: 'DemoPass123!',
    },
  });
  expect(tRes.statusCode).toBe(200);
  touristToken = JSON.parse(tRes.body).accessToken;

  // Login as demo host
  const hRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'host@staylocal.demo',
      password: 'DemoPass123!',
    },
  });
  expect(hRes.statusCode).toBe(200);
  hostToken = JSON.parse(hRes.body).accessToken;

  // Login as demo admin
  const aRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: 'admin@staylocal.demo',
      password: 'DemoPass123!',
    },
  });
  expect(aRes.statusCode).toBe(200);
  adminToken = JSON.parse(aRes.body).accessToken;
});

describe('StayLocal Integration Flow', () => {
  it('GET /api/v1/destinations returns 4 seeded destinations', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/destinations' });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.length).toBe(4);
    const names = data.map((d: any) => d.name);
    expect(names).toContain('Bhimashankar');
    expect(names).toContain('Visapur Fort');
    expect(names).toContain('Lonavala');
    expect(names).toContain('Pune');
  });

  it('GET /api/v1/properties lists approved properties', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/properties' });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items.every((p: any) => p.status === 'APPROVED')).toBe(true);
  });

  it('Host creates a new property -> status is PENDING', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/properties',
      headers: { authorization: `Bearer ${hostToken}` },
      payload: {
        destinationId: 'dest-lonavala',
        title: 'Misty Ridge Homestay',
        description: 'Cozy retreat with forest views.',
        pricePerNight: 1500,
        maxGuests: 4,
        amenities: ['Wi-Fi', 'Breakfast', 'Hot water'],
        latitude: 18.7557,
        longitude: 73.4091,
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.body);
    expect(data.id).toMatch(/^prop-/);
    expect(data.status).toBe('PENDING');
    expect(data.locationVerified).toBe(false);
    testPropertyId = data.id;
  });

  it('Host verifies location using SIMULATED_AT_PROPERTY -> VERIFIED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${testPropertyId}/verification`,
      headers: { authorization: `Bearer ${hostToken}` },
      payload: {
        photoAssetId: 'asset-test-cam-01',
        capturedLatitude: 18.7557,
        capturedLongitude: 73.4091,
        verificationMode: 'SIMULATED_AT_PROPERTY',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.status).toBe('VERIFIED');
    expect(data.distanceMeters).toBeLessThanOrEqual(50);
    expect(data.disclaimer).toContain('GPS proximity verifies device location at capture time');
  });

  it('Host verifies location using SIMULATED_AWAY -> REJECTED', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${testPropertyId}/verification`,
      headers: { authorization: `Bearer ${hostToken}` },
      payload: {
        photoAssetId: 'asset-test-cam-02',
        capturedLatitude: 18.7557,
        capturedLongitude: 73.4091,
        verificationMode: 'SIMULATED_AWAY',
      },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.status).toBe('REJECTED');
    expect(data.distanceMeters).toBeGreaterThan(50);
  });

  it('Admin approves the property', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/properties/${testPropertyId}/status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: 'APPROVED' },
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.status).toBe('APPROVED');
  });

  it('Tourist books property with coupon -> ₹100 discount applied & reward issued', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        propertyId: testPropertyId,
        checkIn: '2026-11-01',
        checkOut: '2026-11-03',
        guests: 2,
        couponCode: 'STAY100-AB12CD',
        paymentMethod: 'UPI_QR',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.body);
    expect(data.subtotal).toBe(3000); // 2 nights * 1500
    expect(data.discount).toBe(100);
    expect(data.total).toBe(2900);
    expect(data.status).toBe('CONFIRMED');
    testBookingId = data.id;

    // Check reward issuance for this booking
    const rewardsRes = await app.inject({
      method: 'GET',
      url: '/api/v1/rewards',
      headers: { authorization: `Bearer ${touristToken}` },
    });
    expect(rewardsRes.statusCode).toBe(200);
    const rewards = JSON.parse(rewardsRes.body);
    const issuedReward = rewards.find((r: any) => r.issuedForBookingId === testBookingId);
    expect(issuedReward).toBeDefined();
    expect(issuedReward.amount).toBe(100);
    expect(issuedReward.code).toMatch(/^STAY100-[A-Z0-9]{6}$/);
  });

  it('Re-attempting to use the already redeemed coupon is rejected', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        propertyId: testPropertyId,
        checkIn: '2026-11-05',
        checkOut: '2026-11-07',
        guests: 2,
        couponCode: 'STAY100-AB12CD',
        paymentMethod: 'DEMO_CARD',
      },
    });

    expect([409, 422]).toContain(res.statusCode);
    const data = JSON.parse(res.body);
    expect(data.code).toBeDefined();
    expect(data.requestId).toBeDefined();
  });

  it('Double booking overlap is rejected with 409 BOOKING_CONFLICT', async () => {
    // Book same dates (Nov 01 - Nov 03)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        propertyId: testPropertyId,
        checkIn: '2026-11-02',
        checkOut: '2026-11-04',
        guests: 2,
        paymentMethod: 'PAY_AT_STAY',
      },
    });

    expect(res.statusCode).toBe(409);
    const data = JSON.parse(res.body);
    expect(data.code).toBe('BOOKING_CONFLICT');
  });

  it('Adjacent stay is permitted (Nov 03 - Nov 05)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        propertyId: testPropertyId,
        checkIn: '2026-11-03',
        checkOut: '2026-11-05',
        guests: 2,
        paymentMethod: 'PAY_AT_STAY',
      },
    });

    expect(res.statusCode).toBe(201);
    const data = JSON.parse(res.body);
    expect(data.status).toBe('CONFIRMED');
  });

  it('GET /api/v1/bookings/:id/voucher returns printable voucher with QR payload', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/bookings/${testBookingId}/voucher`,
      headers: { authorization: `Bearer ${touristToken}` },
    });

    expect(res.statusCode).toBe(200);
    const voucher = JSON.parse(res.body);
    expect(voucher.bookingId).toBe(testBookingId);
    expect(voucher.qrPayload).toContain(`STAYLOCAL:${testBookingId}`);
    expect(voucher.pricing.total).toBe(2900);
    expect(voucher.rewardCoupon).toBeDefined();
  });

  it('Tourist submits review for completed booking', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${testPropertyId}/reviews`,
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        bookingId: testBookingId,
        rating: 5,
        comment: 'Absolutely serene experience and lovely local hosts.',
      },
    });

    expect(res.statusCode).toBe(201);
    const review = JSON.parse(res.body);
    expect(review.rating).toBe(5);

    // Verify duplicate review is rejected
    const dupRes = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${testPropertyId}/reviews`,
      headers: { authorization: `Bearer ${touristToken}` },
      payload: {
        bookingId: testBookingId,
        rating: 4,
        comment: 'Second attempt.',
      },
    });
    expect(dupRes.statusCode).toBe(409);
  });
});
