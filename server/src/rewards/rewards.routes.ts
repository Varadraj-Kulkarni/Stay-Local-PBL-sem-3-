import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RewardsService } from './rewards.service.ts';
import { authenticate } from '../http/middleware.ts';

const rewardsService = new RewardsService();

export const rewardsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authenticate);

  app.get('/', async (req, reply) => {
    const rewards = await rewardsService.getUserRewards(req.user!);
    reply.status(200).send(rewards);
  });
};

export const couponValidateRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post('/validate', { preHandler: [authenticate] }, async (req, reply) => {
    const { couponCode, subtotal } = req.body as { couponCode: string; subtotal: number };
    const result = await rewardsService.validateCoupon(couponCode, subtotal, req.user!);
    reply.status(200).send(result);
  });
};
