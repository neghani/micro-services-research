const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');
const logger = require('./logger');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Initialize Knex
const db = knex(config);

// Give the connection to Objection
Model.knex(db);

// Database connection event handlers
db.on('query', (queryData) => {
  if (process.env.NODE_ENV === 'development' && process.env.LOG_LEVEL === 'debug') {
    logger.debug('Database Query:', {
      sql: queryData.sql,
      bindings: queryData.bindings,
    });
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

module.exports = {
  db,
  testConnection,
  closeConnection,
};