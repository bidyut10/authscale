// Request ID middleware - adds a unique ID to every request
// Useful for tracking requests in logs
import { randomUUID } from 'crypto';

// Generate a unique ID for each request
export const requestId = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

