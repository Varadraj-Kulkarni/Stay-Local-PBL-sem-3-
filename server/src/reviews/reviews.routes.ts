import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ReviewsService } from './reviews.service.ts';
import { authenticate } from '../http/middleware.ts';

const reviewsService = new ReviewsService();

export const propertyReviewsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/:propertyId/reviews', async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const list = await reviewsService.getReviewsForProperty(propertyId);
    reply.status(200).send(list);
  });

  app.post('/:propertyId/reviews', { preHandler: [authenticate] }, async (req, reply) => {
    const { propertyId } = req.params as { propertyId: string };
    const review = await reviewsService.createReview(propertyId, req.body as any, req.user!);
    reply.status(201).send(review);
  });
};
