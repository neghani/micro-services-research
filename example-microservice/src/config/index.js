// Load environment variables
require('dotenv').config();

const config = {
  // Application settings
  app: {
    name: 'Todo Microservice',
    version: process.env.API_VERSION || 'v1',
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // Database settings
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'todoapp',
    user: process.env.DB_USER || 'todouser',
    password: process.env.DB_PASSWORD || 'todopass123',
  },

  // Logging settings
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: process.env.LOG_FILE_ENABLED !== 'false',
    consoleEnabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
  },

  // Security settings
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Health check settings
  healthCheck: {
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000,
  },

  // Pagination settings
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
};

module.exports = config;