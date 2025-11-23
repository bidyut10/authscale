// Password utilities - hash and compare passwords
// Uses bcrypt with configurable salt rounds from the config
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

// Hash a password before storing it
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Compare a plain password with a hash
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

