import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { MediaService } from './media.service.ts';
import { authenticate } from '../http/middleware.ts';

const mediaService = new MediaService();

export const mediaRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Init upload endpoint
  app.post('/uploads/init', { preHandler: [authenticate] }, async (req, reply) => {
    const result = await mediaService.initUpload(req.body as any);
    reply.status(201).send(result);
  });

  // Direct raw buffer upload endpoint (PUT or POST)
  app.put('/uploads/raw/:assetId', async (req, reply) => {
    const { assetId } = req.params as { assetId: string };
    const contentType = req.headers['content-type'] as string;
    const buffer = req.body as Buffer;
    const result = await mediaService.saveUploadedBytes(assetId, buffer, contentType);
    reply.status(200).send(result);
  });

  // Multipart form upload fallback
  app.post('/uploads/direct', { preHandler: [authenticate] }, async (req, reply) => {
    const data = await req.file();
    if (!data) {
      reply.status(400).send({ code: 'BAD_REQUEST', message: 'No file uploaded.' });
      return;
    }
    const buffer = await data.toBuffer();
    const init = await mediaService.initUpload({
      fileName: data.filename,
      contentType: data.mimetype,
      sizeBytes: buffer.length,
    });
    const result = await mediaService.saveUploadedBytes(init.assetId, buffer, data.mimetype);
    reply.status(201).send({ ...init, ...result });
  });

  // Serve media files
  app.get('/media/:filename', async (req, reply) => {
    const { filename } = req.params as { filename: string };
    const { buffer, contentType } = await mediaService.getFile(filename);
    reply.header('Content-Type', contentType).send(buffer);
  });
};
