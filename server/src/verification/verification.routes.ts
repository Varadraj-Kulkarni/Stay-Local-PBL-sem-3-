import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { VerificationService } from './verification.service.ts';
import { requireRole } from '../http/middleware.ts';

const verificationService = new VerificationService();

export const verificationRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/:propertyId/verification', { preHandler: [requireRole('HOST', 'ADMIN')] }, async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const result = await verificationService.verifyProperty(propertyId, req.body as any, req.user!);
    reply.status(200).send(result);
  });
};
