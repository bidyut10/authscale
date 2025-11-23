// Request validation middleware - handles all types of validation
// Use this to validate request body, query params, or route params
// Supports email, password, required fields, length, numbers, URLs, and more

import { sendError } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { MESSAGES } from '../constants/messages.js';
import {
  validateRequired,
  isValidEmail,
  validatePassword,
  validateLength,
  validateNumber,
  isValidUrl,
  isValidPhone,
  isValidDate,
  isValidEnum,
  isValidArray,
  isValidObject,
  isValidBoolean,
  isAlphanumeric,
  isValidUUID,
  isValidObjectId,
} from '../utils/validation.js';

/**
 * Main validation middleware
 * @param {Object} schema - Validation schema
 * @param {string} source - 'body', 'query', or 'params' (default: 'body')
 * @returns {Function} - Express middleware
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    // Validate required fields
    if (schema.required && Array.isArray(schema.required)) {
      const validation = validateRequired(data, schema.required);
      if (!validation.valid) {
        errors.push(`Missing required fields: ${validation.missing.join(', ')}`);
      }
    }

    // Validate each field in the schema
    if (schema.fields) {
      Object.keys(schema.fields).forEach((fieldName) => {
        const fieldRules = schema.fields[fieldName];
        const fieldValue = data[fieldName];

        // Skip if field is optional and not provided
        if (fieldValue === undefined || fieldValue === null) {
          if (!fieldRules.required) return;
        }

        // Required check
        if (fieldRules.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
          errors.push(`${fieldName} is required`);
          return;
        }

        // Type validation
        if (fieldRules.type) {
          const typeMap = {
            string: typeof fieldValue === 'string',
            number: typeof fieldValue === 'number' || !isNaN(Number(fieldValue)),
            boolean: typeof fieldValue === 'boolean' || fieldValue === 'true' || fieldValue === 'false',
            array: Array.isArray(fieldValue),
            object: typeof fieldValue === 'object' && !Array.isArray(fieldValue) && fieldValue !== null,
          };

          if (!typeMap[fieldRules.type]) {
            errors.push(`${fieldName} must be of type ${fieldRules.type}`);
            return;
          }
        }

        // String validations
        if (typeof fieldValue === 'string') {
          // Email validation
          if (fieldRules.email && !isValidEmail(fieldValue)) {
            errors.push(`${fieldName} must be a valid email address`);
          }

          // URL validation
          if (fieldRules.url && !isValidUrl(fieldValue)) {
            errors.push(`${fieldName} must be a valid URL`);
          }

          // Phone validation
          if (fieldRules.phone && !isValidPhone(fieldValue)) {
            errors.push(`${fieldName} must be a valid phone number`);
          }

          // UUID validation
          if (fieldRules.uuid && !isValidUUID(fieldValue)) {
            errors.push(`${fieldName} must be a valid UUID`);
          }

          // ObjectId validation
          if (fieldRules.objectId && !isValidObjectId(fieldValue)) {
            errors.push(`${fieldName} must be a valid ObjectId`);
          }

          // Alphanumeric validation
          if (fieldRules.alphanumeric) {
            if (!isAlphanumeric(fieldValue, fieldRules.allowSpaces)) {
              errors.push(`${fieldName} must contain only alphanumeric characters${fieldRules.allowSpaces ? ' and spaces' : ''}`);
            }
          }

          // Length validation
          if (fieldRules.minLength || fieldRules.maxLength) {
            const lengthValidation = validateLength(fieldValue, fieldRules.minLength, fieldRules.maxLength);
            if (!lengthValidation.valid) {
              errors.push(`${fieldName}: ${lengthValidation.message}`);
            }
          }
        }

        // Password validation
        if (fieldRules.password) {
          const passwordOptions = {
            minLength: fieldRules.minLength || 8,
            requireUppercase: fieldRules.requireUppercase !== false,
            requireLowercase: fieldRules.requireLowercase !== false,
            requireNumbers: fieldRules.requireNumbers !== false,
            requireSpecialChars: fieldRules.requireSpecialChars || false,
          };
          const passwordValidation = validatePassword(fieldValue, passwordOptions);
          if (!passwordValidation.valid) {
            errors.push(`${fieldName}: ${passwordValidation.message}`);
          }
        }

        // Number validations
        if (fieldRules.type === 'number' || !isNaN(Number(fieldValue))) {
          if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
            const numberValidation = validateNumber(fieldValue, fieldRules.min, fieldRules.max);
            if (!numberValidation.valid) {
              errors.push(`${fieldName}: ${numberValidation.message}`);
            }
          }
        }

        // Date validation
        if (fieldRules.date && !isValidDate(fieldValue)) {
          errors.push(`${fieldName} must be a valid date`);
        }

        // Enum validation
        if (fieldRules.enum && !isValidEnum(fieldValue, fieldRules.enum)) {
          errors.push(`${fieldName} must be one of: ${fieldRules.enum.join(', ')}`);
        }

        // Array validation
        if (Array.isArray(fieldValue)) {
          if (fieldRules.arrayMinLength || fieldRules.arrayMaxLength) {
            const arrayValidation = isValidArray(fieldValue, fieldRules.arrayMinLength, fieldRules.arrayMaxLength);
            if (!arrayValidation.valid) {
              errors.push(`${fieldName}: ${arrayValidation.message}`);
            }
          }
        }

        // Object validation
        if (fieldRules.object && !isValidObject(fieldValue)) {
          errors.push(`${fieldName} must be an object`);
        }

        // Boolean validation
        if (fieldRules.boolean && !isValidBoolean(fieldValue)) {
          errors.push(`${fieldName} must be a boolean value`);
        }

        // Custom validation function
        if (fieldRules.custom && typeof fieldRules.custom === 'function') {
          const customResult = fieldRules.custom(fieldValue, data);
          if (customResult !== true) {
            errors.push(`${fieldName}: ${customResult || 'Validation failed'}`);
          }
        }
      });
    }

    // Legacy support - simple email/password validation
    if (schema.email && data.email) {
      if (!isValidEmail(data.email)) {
        errors.push('Invalid email format');
      }
    }

    if (schema.password && data.password) {
      const passwordValidation = validatePassword(data.password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.message);
      }
    }

    // Return errors if any
    if (errors.length > 0) {
      return sendError(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.BAD_REQUEST, errors);
    }

    next();
  };
};

// Convenience functions for common validation patterns
export const validateBody = (schema) => validateRequest(schema, 'body');
export const validateQuery = (schema) => validateRequest(schema, 'query');
export const validateParams = (schema) => validateRequest(schema, 'params');
