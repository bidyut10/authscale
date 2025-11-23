/**
 * Application Message Constants
 * Centralized messages for consistent API responses
 */
export const MESSAGES = {
  // Success
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',

  // Errors
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_ERROR: 'Validation error',
  BAD_REQUEST: 'Bad request',

  // User
  USER_CREATED: 'User created successfully',
  USER_NOT_FOUND: 'User not found',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_EXISTS: 'User already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',

  // Auth
  TOKEN_REQUIRED: 'Authentication token required',
  TOKEN_INVALID: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
};

