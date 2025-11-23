// Global error handler - catches all errors and returns proper responses
// This is the last middleware in the chain, so it catches everything
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { MESSAGES } from '../constants/messages.js';
import { env } from '../config/env.js';

// Handles all types of errors and returns appropriate status codes
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    requestId: req.id,
    error: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // CORS Error
  if (err.message.includes('CORS')) {
    return sendError(res, 'CORS policy violation', HTTP_STATUS.FORBIDDEN);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return sendError(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors);
  }

  // Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid data format', HTTP_STATUS.BAD_REQUEST);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, `${field} already exists`, HTTP_STATUS.CONFLICT);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  // Custom application errors
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode);
  }

  // Default error
  return sendError(
    res,
    err.message || MESSAGES.INTERNAL_ERROR,
    err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};

