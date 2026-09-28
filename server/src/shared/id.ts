import { randomUUID } from 'node:crypto';

export function generateUuid(): string {
  return randomUUID();
}

export function generateShortId(prefix: string): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${rand}`;
}

export function generateRewardCode(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `STAY100-${rand}`;
}

export function generateVerificationCode(): string {
  return generateShortId('VCH');
}
