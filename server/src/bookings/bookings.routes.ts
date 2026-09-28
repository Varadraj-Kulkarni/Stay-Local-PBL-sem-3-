import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { BookingsService } from './bookings.service.ts';
import { authenticate } from '../http/middleware.ts';

const bookingsService = new BookingsService();

export const bookingsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.addHook('preHandler', authenticate);

  app.get('/', async (req, reply) => {
    const list = await bookingsService.listBookings(req.user!);
    reply.status(200).send(list);
  });

  app.post('/', async (req, reply) => {
    const booking = await bookingsService.createBooking(req.body as any, req.user!);
    reply.status(201).send(booking);
  });

  app.get('/:bookingId', async (req, reply) => {
    const { bookingId } = req.params as { bookingId: string };
    const booking = await bookingsService.getBookingById(bookingId, req.user!);
    reply.status(200).send(booking);
  });

  app.post('/:bookingId/confirm', async (req, reply) => {
    const { bookingId } = req.params as { bookingId: string };
    const booking = await bookingsService.confirmBooking(bookingId, req.user!);
    reply.status(200).send(booking);
  });

  app.get('/:bookingId/voucher', async (req, reply) => {
    const { bookingId } = req.params as { bookingId: string };
    const voucher = await bookingsService.getVoucher(bookingId, req.user!);
    reply.status(200).send(voucher);
  });
};
