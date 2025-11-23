// JWT utilities - handle token generation and verification
// Uses settings from the centralized config
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Generate an access token (short-lived)
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  });
};

// Generate a refresh token (long-lived)
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE,
  });
};

// Verify an access token - throws error if invalid
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify a refresh token - throws error if invalid
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Decode token without verification (useful for debugging)
export const decodeToken = (token) => {
  return jwt.decode(token);
};

