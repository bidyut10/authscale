// Main Express app setup - this is where everything comes together
// All middleware and routes are configured here
import express from 'express';
import bodyParser from 'body-parser';
import { validateEnv, env } from './config/env.js';
import { configureSecurity, configureRateLimiting } from './middlewares/security.js';
import { configureLogging } from './middlewares/logging.js';
import { requestId } from './middlewares/request-id.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

// Make sure we have all required environment variables
validateEnv();

// Create the Express app
const app = express();

// Fix for Express 5 - make req.query writable
app.use((req, res, next) => {
  const originalQuery = req.query;
  Object.defineProperty(req, 'query', {
    ...Object.getOwnPropertyDescriptor(req, 'query'),
    value: originalQuery,
    writable: true,
    configurable: true,
  });
  next();
});

// Request ID - add unique ID to every request for tracking
app.use(requestId);

// Security - CORS, Helmet, XSS protection, etc.
configureSecurity(app);

// Body parser - limit size to prevent large payload attacks
app.use(bodyParser.json({ limit: env.BODY_PARSER_LIMIT }));
app.use(bodyParser.urlencoded({ extended: true, limit: env.BODY_PARSER_LIMIT }));

// Rate limiting - prevent abuse
configureRateLimiting(app);

// Logging - track all requests
configureLogging(app);

// API routes - all endpoints are under /api/v1
app.use(env.API_PREFIX, routes);

// 404 handler - catch routes that don't exist
app.use(notFound);

// Error handler - catch all errors and return proper responses
app.use(errorHandler);

logger.info('Express app configured successfully');

export default app;

