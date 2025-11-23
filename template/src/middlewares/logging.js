// Logging middleware - uses Morgan to log all requests
// Different log levels for dev vs production
import morgan from 'morgan';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Set up request logging
export const configureLogging = (app) => {
  if (env.NODE_ENV === 'production') {
    // Production: log only errors
    app.use(
      morgan('combined', {
        skip: (req, res) => res.statusCode < 400,
        stream: {
          write: (message) => logger.error(message.trim()),
        },
      })
    );
  } else {
    // Development: log all requests
    app.use(
      morgan('dev', {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      })
    );
  }
};

