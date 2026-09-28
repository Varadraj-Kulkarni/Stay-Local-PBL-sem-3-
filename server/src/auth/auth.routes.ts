import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service.ts';
import { authenticate } from '../http/middleware.ts';

const authService = new AuthService();

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/register', async (req, reply) => {
    const result = await authService.register(req.body as any);
    reply.status(201).send(result);
  });

  app.post('/login', async (req, reply) => {
    const result = await authService.login(req.body as any);
    reply.status(200).send(result);
  });

  app.get('/me', { preHandler: [authenticate] }, async (req, reply) => {
    const user = await authService.getCurrentUser(req.user!.id);
    reply.status(200).send(user);
  });

  app.post('/logout', { preHandler: [authenticate] }, async (_req, reply) => {
    reply.status(200).send({ message: 'Successfully logged out.' });
  });
};
