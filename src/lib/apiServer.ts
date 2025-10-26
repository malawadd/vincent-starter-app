import * as Sentry from '@sentry/node';
import express from 'express';

import { env } from './env';
import { registerRoutes } from './express';
import { serviceLogger } from './logger';
import { getConvexClient } from './convex/client';

const app = express();

registerRoutes(app);

Sentry.setupExpressErrorHandler(app);

const { PORT } = env;

const startApiServer = async () => {
  getConvexClient();
  serviceLogger.info('Convex client initialized. Starting server...');

  await new Promise((resolve, reject) => {
    app.listen(PORT).once('listening', resolve).once('error', reject);
  });

  serviceLogger.info(`Server is listening on port ${PORT}`);
};

export { app, startApiServer };
