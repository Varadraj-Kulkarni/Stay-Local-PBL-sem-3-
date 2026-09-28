import bcrypt from 'bcryptjs';
import { getDb } from '../db/index.ts';
import { generateUuid, generateShortId } from '../shared/id.ts';
import { generateToken } from '../http/middleware.ts';
import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from '../http/errors.ts';
import type { AppRole, User } from '../shared/types.ts';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  accessToken: string;
  expiresInSeconds: number;
  user: User;
}

export class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    if (input.role !== 'TOURIST' && input.role !== 'HOST') {
      throw new ValidationError('Role must be either TOURIST or HOST for public registration.');
    }
    if (!input.password || input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }
    if (!input.email || !input.email.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!input.fullName || input.fullName.trim().length < 2) {
      throw new ValidationError('Full name is required (at least 2 characters).');
    }

    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [input.email.toLowerCase()]);
    if (existing) {
      throw new ConflictError('DUPLICATE_EMAIL', 'A user with this email address already exists.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(input.password, salt);
    const userId = generateUuid();
    const now = new Date().toISOString();
    const role = input.role as AppRole;

    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, input.email.toLowerCase(), passwordHash, input.fullName.trim(), input.phone || null, role, now, now]
    );

    if (role === 'HOST') {
      const hostProfileId = generateShortId('host');
      await db.run(
        `INSERT INTO host_profiles (id, user_id, display_name, bio, approval_status, verified_at, rejection_note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hostProfileId, userId, input.fullName.trim(), null, 'PENDING', null, null, now, now]
      );
    }

    const user: User = {
      id: userId,
      email: input.email.toLowerCase(),
      fullName: input.fullName.trim(),
      phone: input.phone || null,
      role,
      createdAt: now,
    };

    const token = generateToken(user);
    return {
      accessToken: token,
      expiresInSeconds: 7 * 24 * 3600,
      user,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    if (!input.email || !input.password) {
      throw new ValidationError('Email and password are required.');
    }

    const db = await getDb();
    const row = await db.get<any>('SELECT * FROM users WHERE email = ?', [input.email.toLowerCase()]);
    if (!row) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const valid = bcrypt.compareSync(input.password, row.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const user: User = {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role as AppRole,
      createdAt: row.created_at,
    };

    const token = generateToken(user);
    return {
      accessToken: token,
      expiresInSeconds: 7 * 24 * 3600,
      user,
    };
  }

  async getCurrentUser(userId: string): Promise<User> {
    const db = await getDb();
    const row = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!row) {
      throw new NotFoundError('User not found.');
    }
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role as AppRole,
      createdAt: row.created_at,
    };
  }
}
