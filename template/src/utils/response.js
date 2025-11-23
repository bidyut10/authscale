// Response helpers - standardize how we send responses
// All API responses follow the same format
import { HTTP_STATUS } from '../constants/http-status.js';

// Send a successful response
export const sendSuccess = (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    status: true,
    message,
    ...(data !== null && { data }),
  });
};

// Send an error response
export const sendError = (res, message = 'Internal server error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    status: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

