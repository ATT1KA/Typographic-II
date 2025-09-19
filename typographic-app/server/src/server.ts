import http from 'http';
import app from './app';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT || 5174);

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info({ port: PORT }, `Server listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
