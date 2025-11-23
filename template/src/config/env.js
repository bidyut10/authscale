// Centralized configuration - change values here and they'll reflect everywhere
// This is the single source of truth for all app configuration
import dotenv from 'dotenv';

dotenv.config();

// Required env vars - app won't start without these
const requiredEnvVars = [
  'MONGO_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
];

// Validate that we have everything we need before starting
export const validateEnv = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
};

// All configuration in one place - makes it easy to manage and update
// Calculate PORT first so we can use it in other defaults
const PORT = parseInt(process.env.PORT || '4000', 10);
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

export const env = {
  // Server settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT,
  API_PREFIX,

  // Database connection
  MONGO_URL: process.env.MONGO_URL,
  MONGO_MAX_POOL_SIZE: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
  MONGO_SERVER_SELECTION_TIMEOUT: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '5000', 10),
  MONGO_SOCKET_TIMEOUT: parseInt(process.env.MONGO_SOCKET_TIMEOUT || '45000', 10),

  // JWT tokens
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h', // Access token expires in 24 hours
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d', // Refresh token expires in 30 days

  // CORS - who can access the API
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [`http://localhost:${PORT}`, 'http://localhost:5173'],

  // Security settings
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  BODY_PARSER_LIMIT: process.env.BODY_PARSER_LIMIT || '10kb',
  COMPRESSION_THRESHOLD: parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10),
  COMPRESSION_LEVEL: parseInt(process.env.COMPRESSION_LEVEL || '6', 10),

  // Rate limiting - prevent abuse
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  RATE_LIMIT_AUTH_WINDOW_MS: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_AUTH_MAX: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10),
  RATE_LIMIT_SLOW_DOWN_DELAY_AFTER: parseInt(process.env.RATE_LIMIT_SLOW_DOWN_DELAY_AFTER || '50', 10),
  RATE_LIMIT_SLOW_DOWN_MAX_DELAY: parseInt(process.env.RATE_LIMIT_SLOW_DOWN_MAX_DELAY || '20000', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),

  // Frontend URL (if needed for redirects, etc)
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.VITE_BACKEND_URL || 'http://localhost:5173',

  // Database retry settings
  MONGO_MAX_RETRIES: parseInt(process.env.MONGO_MAX_RETRIES || '5', 10),
  MONGO_RETRY_DELAY_MS: parseInt(process.env.MONGO_RETRY_DELAY_MS || '2000', 10),

  // Test settings
  TEST_BASE_URL: process.env.TEST_BASE_URL || `http://localhost:${PORT}${API_PREFIX}`,
  TEST_TIMEOUT_MS: parseInt(process.env.TEST_TIMEOUT_MS || '5000', 10),
  TEST_REQUEST_DELAY_MS: parseInt(process.env.TEST_REQUEST_DELAY_MS || '100', 10),
  TEST_RATE_LIMIT_MAX_ATTEMPTS: parseInt(process.env.TEST_RATE_LIMIT_MAX_ATTEMPTS || '6', 10),
};

