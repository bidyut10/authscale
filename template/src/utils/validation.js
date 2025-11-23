// Validation utilities - use these anywhere you need to validate data
// All functions return { valid: boolean, message?: string } for consistency

// Check if email format is valid
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validate password strength - customizable rules
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters long` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true, message: 'Password is valid' };
};

// Check if required fields are present
export const validateRequired = (data, requiredFields) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, missing: requiredFields };
  }

  const missing = requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === '' || 
           (typeof value === 'string' && value.trim() === '');
  });

  return {
    valid: missing.length === 0,
    missing,
  };
};

// Validate string length
export const validateLength = (value, min, max) => {
  if (typeof value !== 'string') {
    return { valid: false, message: 'Value must be a string' };
  }

  const length = value.trim().length;

  if (min !== undefined && length < min) {
    return { valid: false, message: `Must be at least ${min} characters` };
  }

  if (max !== undefined && length > max) {
    return { valid: false, message: `Must be no more than ${max} characters` };
  }

  return { valid: true };
};

// Validate number range
export const validateNumber = (value, min, max) => {
  const num = Number(value);

  if (isNaN(num)) {
    return { valid: false, message: 'Must be a valid number' };
  }

  if (min !== undefined && num < min) {
    return { valid: false, message: `Must be at least ${min}` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, message: `Must be no more than ${max}` };
  }

  return { valid: true };
};

// Validate URL format
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate phone number (basic - adjust regex for your needs)
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Basic phone validation - digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[\d\s\-+()]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

// Validate date format
export const isValidDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Validate enum/choice value
export const isValidEnum = (value, allowedValues) => {
  if (!Array.isArray(allowedValues)) return false;
  return allowedValues.includes(value);
};

// Validate array
export const isValidArray = (value, minLength, maxLength) => {
  if (!Array.isArray(value)) {
    return { valid: false, message: 'Must be an array' };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { valid: false, message: `Must have at least ${minLength} items` };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { valid: false, message: `Must have no more than ${maxLength} items` };
  }

  return { valid: true };
};

// Validate object structure
export const isValidObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Validate boolean
export const isValidBoolean = (value) => {
  return typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0;
};

// Sanitize string - remove dangerous characters
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Validate alphanumeric
export const isAlphanumeric = (value, allowSpaces = false) => {
  if (typeof value !== 'string') return false;
  const regex = allowSpaces ? /^[a-zA-Z0-9\s]+$/ : /^[a-zA-Z0-9]+$/;
  return regex.test(value);
};

// Validate UUID format
export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

