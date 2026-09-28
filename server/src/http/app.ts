import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { attachRequestId } from './middleware.ts';
import { AppError } from './errors.ts';
import { generateUuid } from '../shared/id.ts';

// Routes
import { authRoutes } from '../auth/auth.routes.ts';
import { destinationsRoutes } from '../destinations/destinations.routes.ts';
import { propertiesRoutes } from '../properties/properties.routes.ts';
import { verificationRoutes } from '../verification/verification.routes.ts';
import { bookingsRoutes } from '../bookings/bookings.routes.ts';
import { rewardsRoutes, couponValidateRoute } from '../rewards/rewards.routes.ts';
import { propertyReviewsRoutes } from '../reviews/reviews.routes.ts';
import { adminRoutes } from '../admin/admin.routes.ts';
import { mediaRoutes } from '../media/media.routes.ts';

export async function createServer() {
  const app = Fastify({
    logger: false,
    bodyLimit: 15 * 1024 * 1024, // 15 MiB for image uploads
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  // Raw body parser for PUT /api/v1/uploads/raw/:assetId
  app.addContentTypeParser(
    ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'],
    { parseAs: 'buffer' },
    (_req, body, done) => {
      done(null, body);
    }
  );

  // Request ID hook
  app.addHook('onRequest', attachRequestId);

  // Error Handler strictly following contract:
  // { code, message, requestId, details }
  app.setErrorHandler((error: any, req, reply) => {
    const requestId = req.requestId || generateUuid();

    if (error instanceof AppError || error?.statusCode || error?.name === 'AppError') {
      const statusCode = error.statusCode || 500;
      const code = error.code || 'APP_ERROR';
      reply.status(statusCode).send({
        code,
        message: error.message || 'An error occurred',
        requestId,
        details: error.details || {},
      });
      return;
    }

    // Fastify validation errors
    if (error?.validation) {
      reply.status(400).send({
        code: 'BAD_REQUEST',
        message: error.message || 'Request validation failed.',
        requestId,
        details: { validation: error.validation },
      });
      return;
    }

    // Default 500 error - never leak stack traces or SQL details
    reply.status(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      requestId,
      details: {},
    });
  });

  // Not found handler
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      code: 'NOT_FOUND',
      message: `Path '${req.url}' not found.`,
      requestId: req.requestId || generateUuid(),
      details: {},
    });
  });

  // Register API Routes under /api/v1
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(destinationsRoutes, { prefix: '/api/v1/destinations' });
  await app.register(propertiesRoutes, { prefix: '/api/v1/properties' });
  await app.register(verificationRoutes, { prefix: '/api/v1/properties' });
  await app.register(propertyReviewsRoutes, { prefix: '/api/v1/properties' });
  await app.register(bookingsRoutes, { prefix: '/api/v1/bookings' });
  await app.register(rewardsRoutes, { prefix: '/api/v1/rewards' });
  await app.register(couponValidateRoute, { prefix: '/api/v1/coupons' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(mediaRoutes, { prefix: '/api/v1' });

  // Health check endpoint
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
