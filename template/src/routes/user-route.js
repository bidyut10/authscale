// User routes - handles all user-related endpoints
import express from 'express';
import * as userController from '../controllers/user-controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate-request.js';

const router = express.Router();

// Register new user
router.post(
  '/register',
  validateBody({
    required: ['email', 'name', 'password'],
    fields: {
      email: {
        required: true,
        type: 'string',
        email: true,
        minLength: 5,
        maxLength: 255,
      },
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        alphanumeric: true,
        allowSpaces: true,
      },
      password: {
        required: true,
        type: 'string',
        password: true,
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
      },
    },
  }),
  userController.register
);

// User login
router.post(
  '/login',
  validateBody({
    required: ['email', 'password'],
    fields: {
      email: {
        required: true,
        type: 'string',
        email: true,
      },
      password: {
        required: true,
        type: 'string',
        minLength: 1,
      },
    },
  }),
  userController.login
);

// Get user profile (requires authentication)
router.get('/profile', authenticate, userController.getProfile);

// Update user profile (requires authentication)
router.put(
  '/profile',
  authenticate,
  validateBody({
    fields: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        alphanumeric: true,
        allowSpaces: true,
      },
    },
  }),
  userController.updateProfile
);

// Logout user (requires authentication)
router.post('/logout', authenticate, userController.logout);

// Delete user account (requires authentication - soft delete)
router.delete('/account', authenticate, userController.deleteAccount);

export default router;
