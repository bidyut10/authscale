// User service - contains all the business logic for user operations
// This is where the actual work happens - database operations, password hashing, token generation, etc.
import User from '../models/user-model.js';
import mongoose from 'mongoose';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { MESSAGES } from '../constants/messages.js';

// Create a new user account
export const createUser = async (userData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, name, password } = userData;

    logger.info(`Starting user creation transaction for: ${email}`);

    // Check if user already exists (including deleted users)
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser && !existingUser.isDeleted) {
      logger.warn(`User creation failed - user already exists: ${email}`);
      const error = new Error(MESSAGES.USER_EXISTS);
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user first to get the ID
    const user = new User({
      email,
      name,
      password: hashedPassword,
      isUpdated: false,
      isDeleted: false,
    });

    await user.save({ session });

    // Generate tokens with actual user ID
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Update user with tokens
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    await user.save({ session });

    await session.commitTransaction();
    logger.info(`User created successfully: ${email} (ID: ${user._id})`);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error(`Error creating user ${userData?.email}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Login user - verify credentials and generate tokens
export const loginUser = async (email, password) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Starting login transaction for: ${email}`);

    // Find user with password (exclude deleted users)
    const user = await User.findOne({ email, isDeleted: false }).select('+password').session(session);

    if (!user) {
      logger.warn(`Login failed - user not found: ${email}`);
      const error = new Error(MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn(`Login failed - user inactive: ${email}`);
      const error = new Error('User account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      logger.warn(`Login failed - invalid password for: ${email}`);
      const error = new Error(MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = 401;
      throw error;
    }

    // Generate new tokens
    const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

    // Update user tokens and last login
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ session });

    await session.commitTransaction();
    logger.info(`User logged in successfully: ${email} (ID: ${user._id})`);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error(`Error logging in user ${email}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Get user by their ID
export const getUserById = async (userId) => {
  try {
    logger.debug(`Fetching user by ID: ${userId}`);

    // Exclude deleted users
    const user = await User.findOne({ _id: userId, isDeleted: false });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      const error = new Error(MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    logger.debug(`User found: ${userId}`);
    return user;
  } catch (error) {
    logger.error(`Error getting user ${userId}:`, error.message);
    throw error;
  }
};

// Get user by their email address
export const getUserByEmail = async (email) => {
  try {
    logger.debug(`Fetching user by email: ${email}`);

    // Exclude deleted users
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      logger.warn(`User not found by email: ${email}`);
      const error = new Error(MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    logger.debug(`User found by email: ${email}`);
    return user;
  } catch (error) {
    logger.error(`Error getting user by email ${email}:`, error.message);
    throw error;
  }
};

// Update user information
export const updateUser = async (userId, updateData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Starting update transaction for user: ${userId}`);

    // Don't allow updating sensitive fields
    delete updateData.password;
    delete updateData.email;
    delete updateData.accessToken;
    delete updateData.refreshToken;
    delete updateData.isDeleted;
    delete updateData.deletedAt;

    // Add update tracking
    updateData.isUpdated = true;
    updateData.lastUpdatedAt = new Date();

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true, session }
    );

    if (!user) {
      logger.warn(`Update failed - user not found: ${userId}`);
      const error = new Error(MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    logger.info(`User updated successfully: ${userId}`);

    return user;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error(`Error updating user ${userId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Logout user - clear their tokens from the database
export const logoutUser = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Starting logout transaction for user: ${userId}`);

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      {
        $set: {
          accessToken: null,
          refreshToken: null,
        },
      },
      { new: true, session }
    );

    if (!user) {
      logger.warn(`Logout failed - user not found: ${userId}`);
      const error = new Error(MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    logger.info(`User logged out successfully: ${userId}`);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error(`Error logging out user ${userId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

// Soft delete user - marks user as deleted without removing from database
export const deleteUser = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Starting soft delete transaction for user: ${userId}`);

    const user = await User.findOneAndUpdate(
      { _id: userId, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          accessToken: null,
          refreshToken: null,
          isActive: false,
        },
      },
      { new: true, session }
    );

    if (!user) {
      logger.warn(`Delete failed - user not found or already deleted: ${userId}`);
      const error = new Error(MESSAGES.USER_NOT_FOUND);
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    logger.info(`User soft deleted successfully: ${userId} (Email: ${user.email})`);

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      deletedAt: user.deletedAt,
      message: 'User account deleted successfully',
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error(`Error deleting user ${userId}:`, error.message);
    throw error;
  } finally {
    session.endSession();
  }
};

