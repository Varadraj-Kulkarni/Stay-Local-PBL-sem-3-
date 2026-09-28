import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { PropertiesService } from './properties.service.ts';
import { authenticate, requireRole } from '../http/middleware.ts';

const propertiesService = new PropertiesService();

export const propertiesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Public property search
  app.get('/', async (req, reply) => {
    const q = req.query as any;
    const filters = {
      destinationId: q.destinationId,
      search: q.search,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      locationVerified: q.locationVerified,
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 20,
    };
    const result = await propertiesService.search(filters);
    reply.status(200).send(result);
  });

  // Host creates property
  app.post('/', { preHandler: [requireRole('HOST', 'ADMIN')] }, async (req, reply) => {
    const result = await propertiesService.create(req.body as any, req.user!);
    reply.status(201).send(result);
  });

  // Get single property (supports public and preview for host/admin)
  app.get('/:propertyId', async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    // Optionally check if auth header exists to allow host preview
    try {
      await authenticate(req, reply);
    } catch {
      // unauthenticated public user
    }
    const prop = await propertiesService.getById(propertyId, req.user);
    reply.status(200).send(prop);
  });

  // Update property
  app.patch('/:propertyId', { preHandler: [requireRole('HOST', 'ADMIN')] }, async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const prop = await propertiesService.update(propertyId, req.body as any, req.user!);
    reply.status(200).send(prop);
  });

  // Attach property photo
  app.post('/:propertyId/photos', { preHandler: [requireRole('HOST', 'ADMIN')] }, async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const photo = await propertiesService.attachPhoto(propertyId, req.body as any, req.user!);
    reply.status(201).send(photo);
  });
};
