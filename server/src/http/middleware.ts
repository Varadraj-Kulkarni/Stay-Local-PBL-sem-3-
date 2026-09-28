import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errors.ts';
import type { AppRole, User } from '../shared/types.ts';
import { generateUuid } from '../shared/id.ts';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    requestId: string;
  }
}

export function getJwtSecret(): string {
  return process.env['STAYLOCAL_JWT_SECRET'] || 'staylocal-super-secret-jwt-key-2026';
}

export function generateToken(user: User): string {
  const secret = getJwtSecret();
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

export async function attachRequestId(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  req.requestId = (req.headers['x-request-id'] as string) || generateUuid();
}

export async function authenticate(req: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      id: string;
      email: string;
      fullName: string;
      role: AppRole;
    };
    req.user = {
      id: payload.id,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      createdAt: '',
    };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function requireRole(...allowedRoles: AppRole[]) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    await authenticate(req, _reply);
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Action restricted to roles: ${allowedRoles.join(', ')}`);
    }
  };
}
