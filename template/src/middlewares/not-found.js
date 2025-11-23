// 404 handler - catches routes that don't exist
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { MESSAGES } from '../constants/messages.js';

// Return 404 for any route that wasn't matched
export const notFound = (req, res, next) => {
  return sendError(res, `${MESSAGES.NOT_FOUND}: ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND);
};

