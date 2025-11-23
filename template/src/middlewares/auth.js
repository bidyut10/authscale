// Authentication middleware - protects routes that require login
// Checks for JWT token in the Authorization header and verifies it
import { verifyAccessToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { MESSAGES } from '../constants/messages.js';
import User from '../models/user-model.js';
import { logger } from '../utils/logger.js';

// Use this middleware on routes that need authentication
// It will check for a valid JWT token and attach user info to the request
export const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, MESSAGES.TOKEN_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Extract just the token part (remove "Bearer ")
    const token = authHeader.substring(7);

    if (!token) {
      return sendError(res, MESSAGES.TOKEN_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify the token is valid
    const decoded = verifyAccessToken(token);

    // Get userId from token
    const tokenUserId = decoded.userId || decoded.id;
    
    if (!tokenUserId) {
      logger.warn('Token missing userId');
      return sendError(res, MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify user exists and is not deleted
    const user = await User.findById(tokenUserId);
    
    if (!user) {
      logger.warn(`User not found for token: ${tokenUserId}`);
      return sendError(res, MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify token userId matches user _id
    if (user._id.toString() !== tokenUserId) {
      logger.warn(`Token userId mismatch: token=${tokenUserId}, user=${user._id}`);
      return sendError(res, MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.isDeleted) {
      logger.warn(`Deleted user attempted access: ${user._id}`);
      return sendError(res, 'User account has been deleted', HTTP_STATUS.UNAUTHORIZED);
    }

    if (!user.isActive) {
      logger.warn(`Inactive user attempted access: ${user._id}`);
      return sendError(res, 'User account is deactivated', HTTP_STATUS.FORBIDDEN);
    }

    // Verify token matches user's stored token
    if (user.accessToken !== token) {
      logger.warn(`Token mismatch for user: ${user._id}`);
      return sendError(res, MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
    }

    // Attach user info to the request so controllers can use it
    req.user = decoded;
    req.userId = user._id.toString();
    req.userEmail = user.email;

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return sendError(res, error.message || MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }
};

// Middleware to ensure user can only access their own account
export const ensureOwnAccount = async (req, res, next) => {
  try {
    const requestedUserId = req.params.userId || req.params.id;
    const authenticatedUserId = req.userId;

    // If no userId in params, assume it's the authenticated user's own request
    if (!requestedUserId) {
      return next();
    }

    // Verify the requested user ID matches the authenticated user ID
    if (requestedUserId !== authenticatedUserId) {
      logger.warn(`User ${authenticatedUserId} attempted to access account ${requestedUserId}`);
      return sendError(res, 'You can only access your own account', HTTP_STATUS.FORBIDDEN);
    }

    next();
  } catch (error) {
    logger.error('Own account verification error:', error.message);
    return sendError(res, MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }
};

