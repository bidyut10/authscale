// Security middleware - protects the API from common attacks
// All settings come from the centralized config file
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import { env } from '../config/env.js';

// Set up all security measures
export const configureSecurity = (app) => {
  // Trust proxy - needed if running behind nginx or cloudflare
  app.set('trust proxy', 1);

  // Helmet adds security headers to responses
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // CORS - control who can access the API
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        if (!env.ALLOWED_ORIGINS.includes(origin)) {
          const msg = `CORS policy blocked request from: ${origin}`;
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['Content-Length', 'X-Request-ID'],
      maxAge: 600, // Cache preflight requests for 10 minutes
    })
  );

  // Compression - reduces response size
  app.use(
    compression({
      level: env.COMPRESSION_LEVEL,
      threshold: env.COMPRESSION_THRESHOLD,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

  // Prevent NoSQL injection attacks
  app.use(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }) => {
        console.warn(`Sanitized potentially dangerous input: ${key}`);
      },
    })
  );

  // Prevent XSS attacks
  app.use(xss());
};

// Rate limiting - prevents abuse and DDoS attacks
export const configureRateLimiting = (app) => {
  // Global rate limiter for all API routes
  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
      status: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Don't rate limit health checks
      return req.path === `${env.API_PREFIX}/health`;
    },
    handler: (req, res) => {
      res.status(429).json({
        status: false,
        message: 'Too many requests, please slow down.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  });

  app.use(env.API_PREFIX + '/', globalLimiter);

  // Stricter limits for login/register to prevent brute force
  const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
    max: env.RATE_LIMIT_AUTH_MAX,
    message: {
      status: false,
      message: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(`${env.API_PREFIX}/users/login`, authLimiter);
  app.use(`${env.API_PREFIX}/users/register`, authLimiter);

  // Slow down middleware - gradually increases delay after threshold
  const speedLimiter = slowDown({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    delayAfter: env.RATE_LIMIT_SLOW_DOWN_DELAY_AFTER,
    delayMs: (hits) => hits * 100,
    maxDelayMs: env.RATE_LIMIT_SLOW_DOWN_MAX_DELAY,
  });

  app.use(env.API_PREFIX + '/', speedLimiter);
};

