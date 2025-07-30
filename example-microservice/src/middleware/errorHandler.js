const logger = require('../config/logger');
const config = require('../config');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Convert error to ApiError instance
 * @param {Error} err 
 * @returns {ApiError}
 */
const handleError = (err) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose/Objection validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    error = new ApiError(400, message);
  }

  // Mongoose/Objection duplicate key error
  if (err.code === '23000' || err.errno === 1062) {
    const message = 'Duplicate field value entered';
    error = new ApiError(400, message);
  }

  // Database connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    const message = 'Database connection failed';
    error = new ApiError(503, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }

  return error;
};

/**
 * Send error response
 * @param {ApiError} err 
 * @param {Object} res 
 */
const sendErrorResponse = (err, res) => {
  const { statusCode, message } = err;

  const response = {
    success: false,
    error: {
      code: getErrorCode(statusCode),
      message,
    },
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (config.app.env === 'development') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Get error code based on status code
 * @param {number} statusCode 
 * @returns {string}
 */
const getErrorCode = (statusCode) => {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };

  return errorCodes[statusCode] || 'UNKNOWN_ERROR';
};

/**
 * Global error handling middleware
 * @param {Error} err 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const errorHandler = (err, req, res, next) => {
  let error = handleError(err);

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // If error doesn't have a status code, it's an unexpected error
  if (!error.statusCode) {
    error = new ApiError(500, 'Something went wrong');
  }

  sendErrorResponse(error, res);
};

/**
 * Handle 404 errors
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Handle async errors
 * @param {Function} fn 
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};