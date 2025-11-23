// User controller - handles all user-related HTTP requests
// These functions are called by the routes and use services to do the actual work
import * as userService from '../services/user-service.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { MESSAGES } from '../constants/messages.js';
import { logger } from '../utils/logger.js';

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    logger.info(`Registration request for email: ${email}`);
    const result = await userService.createUser({ email, name, password });

    logger.info(`User registered successfully: ${email}`);
    return sendSuccess(
      res,
      result,
      MESSAGES.USER_CREATED,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Error registering user ${req.body?.email}:`, error.message);
    next(error);
  }
};

// User login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login request for email: ${email}`);
    const result = await userService.loginUser(email, password);

    logger.info(`User logged in successfully: ${email}`);
    return sendSuccess(res, result, MESSAGES.LOGIN_SUCCESS, HTTP_STATUS.OK);
  } catch (error) {
    logger.error(`Error logging in user ${req.body?.email}:`, error.message);
    next(error);
  }
};

// Get the current user's profile
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    logger.debug(`Get profile request for user: ${userId}`);
    const user = await userService.getUserById(userId);

    logger.debug(`Profile retrieved successfully for user: ${userId}`);
    return sendSuccess(res, user, 'Profile retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    logger.error(`Error getting profile for user ${req.userId}:`, error.message);
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    logger.info(`Update profile request for user: ${userId}`);

    // Don't let users update sensitive fields directly
    delete updateData.password;
    delete updateData.email;
    delete updateData.accessToken;
    delete updateData.refreshToken;

    const user = await userService.updateUser(userId, updateData);

    logger.info(`Profile updated successfully for user: ${userId}`);
    return sendSuccess(res, user, MESSAGES.USER_UPDATED, HTTP_STATUS.OK);
  } catch (error) {
    logger.error(`Error updating profile for user ${req.userId}:`, error.message);
    next(error);
  }
};

// Logout user - clears their tokens
export const logout = async (req, res, next) => {
  try {
    const userId = req.userId;

    logger.info(`Logout request for user: ${userId}`);
    await userService.logoutUser(userId);

    logger.info(`User logged out successfully: ${userId}`);
    return sendSuccess(res, null, MESSAGES.LOGOUT_SUCCESS, HTTP_STATUS.OK);
  } catch (error) {
    logger.error(`Error logging out user ${req.userId}:`, error.message);
    next(error);
  }
};

// Delete user account (soft delete)
export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.userId;

    logger.info(`Delete account request for user: ${userId}`);
    
    const result = await userService.deleteUser(userId);

    logger.info(`Account deleted successfully for user: ${userId}`);
    return sendSuccess(res, result, MESSAGES.USER_DELETED, HTTP_STATUS.OK);
  } catch (error) {
    logger.error(`Error deleting account for user ${req.userId}:`, error.message);
    next(error);
  }
};
