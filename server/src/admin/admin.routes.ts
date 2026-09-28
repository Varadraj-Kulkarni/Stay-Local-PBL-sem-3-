import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AdminService } from './admin.service.ts';
import { requireRole } from '../http/middleware.ts';

const adminService = new AdminService();

export const adminRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', requireRole('ADMIN'));

  app.get('/hosts', async (_req, reply) => {
    const hosts = await adminService.listHosts();
    reply.status(200).send(hosts);
  });

  app.patch('/hosts/:hostId/status', async (req, reply) => {
    const { hostId } = req.params as { hostId: string };
    const { approvalStatus, rejectionNote } = req.body as { approvalStatus: 'APPROVED' | 'REJECTED'; rejectionNote?: string };
    const host = await adminService.updateHostStatus(hostId, approvalStatus, rejectionNote);
    reply.status(200).send(host);
  });

  app.get('/properties', async (req, reply) => {
    const { status } = req.query as { status?: string };
    const properties = await adminService.listProperties(status);
    reply.status(200).send(properties);
  });

  app.patch('/properties/:propertyId/status', async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const { status } = req.body as { status: any };
    const property = await adminService.updatePropertyStatus(propertyId, status);
    reply.status(200).send(property);
  });
};
