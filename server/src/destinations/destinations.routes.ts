import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { DestinationsService } from './destinations.service.ts';

const destinationsService = new DestinationsService();

export const destinationsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/', async (_req, reply) => {
    const list = await destinationsService.getAll();
    reply.status(200).send(list);
  });

  app.get('/:destinationId', async (req, reply) => {
    const { destinationId } = req.params as { destinationId: string };
    const destination = await destinationsService.getById(destinationId);
    reply.status(200).send(destination);
  });
};
