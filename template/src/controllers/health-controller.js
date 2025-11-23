// Health check controller - returns server status
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import mongoose from 'mongoose';
import { env } from '../config/env.js';

// Check if server and database are healthy
export const healthCheck = (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0',
  };

  // Return 503 if database is down, otherwise 200
  const statusCode = healthStatus.database === 'connected' 
    ? HTTP_STATUS.OK 
    : HTTP_STATUS.SERVICE_UNAVAILABLE;

  return sendSuccess(res, healthStatus, 'Server is running', statusCode);
};

