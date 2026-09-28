import { describe, it, expect } from 'vitest';
import { calculateHaversineDistanceMeters, VERIFICATION_THRESHOLD_METERS } from '../src/shared/haversine.ts';
import { generateRewardCode, generateShortId, generateVerificationCode } from '../src/shared/id.ts';

describe('Haversine Unit Tests', () => {
  it('returns 0 for identical coordinates', () => {
    const d = calculateHaversineDistanceMeters(19.0729, 73.5358, 19.0729, 73.5358);
    expect(d).toBe(0);
    expect(d <= VERIFICATION_THRESHOLD_METERS).toBe(true);
  });

  it('accepts locations within the 50m threshold', () => {
    // Offset by ~0.0002 degrees (~22 meters)
    const d = calculateHaversineDistanceMeters(19.0729, 73.5358, 19.0731, 73.5358);
    expect(d).toBeLessThanOrEqual(50);
    expect(d).toBeGreaterThan(0);
  });

  it('rejects locations beyond the 50m threshold', () => {
    // Bhimashankar to Visapur Fort is ~40 km
    const d = calculateHaversineDistanceMeters(19.0729, 73.5358, 18.7237, 73.4881);
    expect(d).toBeGreaterThan(50);
    expect(d).toBeGreaterThan(30000);
  });
});

describe('ID & Code Generation Unit Tests', () => {
  it('generates coupon code in STAY100-XXXXXX format', () => {
    const code = generateRewardCode();
    expect(code).toMatch(/^STAY100-[A-Z0-9]{6}$/);
  });

  it('generates verification code in VCH-XXXXXX format', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^VCH-[A-Z0-9]{6}$/);
  });

  it('generates prefixed IDs', () => {
    const propId = generateShortId('prop');
    expect(propId).toMatch(/^prop-[A-Z0-9]{6}$/);
  });
});

describe('Booking Overlap Invariant Logic', () => {
  function isOverlapping(
    existingIn: string,
    existingOut: string,
    requestedIn: string,
    requestedOut: string
  ): boolean {
    return existingIn < requestedOut && existingOut > requestedIn;
  }

  it('allows adjacent stays (A: Oct 10 -> Oct 12, B: Oct 12 -> Oct 14)', () => {
    const overlap = isOverlapping('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-14');
    expect(overlap).toBe(false);
  });

  it('rejects overlapping stay (A: Oct 10 -> Oct 12, B: Oct 11 -> Oct 13)', () => {
    const overlap = isOverlapping('2026-10-10', '2026-10-12', '2026-10-11', '2026-10-13');
    expect(overlap).toBe(true);
  });

  it('rejects completely enclosed stay (A: Oct 10 -> Oct 15, B: Oct 11 -> Oct 13)', () => {
    const overlap = isOverlapping('2026-10-10', '2026-10-15', '2026-10-11', '2026-10-13');
    expect(overlap).toBe(true);
  });
});
