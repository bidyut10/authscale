// Database connection - handles MongoDB connection with automatic retries
// Uses settings from the centralized config file
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

// Connect to MongoDB - will retry if connection fails
export const connectDB = async (retries = env.MONGO_MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const options = {
        maxPoolSize: env.MONGO_MAX_POOL_SIZE,
        serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT,
        socketTimeoutMS: env.MONGO_SOCKET_TIMEOUT,
      };

      await mongoose.connect(env.MONGO_URL, options);
      logger.info('MongoDB connected successfully');
      return;
    } catch (err) {
      logger.error(`MongoDB connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        const delay = (i + 1) * env.MONGO_RETRY_DELAY_MS;
        logger.info(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('Failed to connect to MongoDB after multiple attempts');
  process.exit(1);
};

// Listen for connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Close database connection gracefully
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB connection:', err);
  }
};

