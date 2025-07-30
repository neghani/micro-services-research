const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { testConnection } = require('./config/database');

// Start server function
const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(config.app.port, () => {
      logger.info(`🚀 ${config.app.name} started successfully!`, {
        port: config.app.port,
        environment: config.app.env,
        version: config.app.version,
        nodeVersion: process.version,
        pid: process.pid,
      });

      // Log available endpoints
      logger.info('Available endpoints:', {
        api: `http://localhost:${config.app.port}/api/${config.app.version}`,
        health: `http://localhost:${config.app.port}/health`,
        healthDetailed: `http://localhost:${config.app.port}/health/detailed`,
        todos: `http://localhost:${config.app.port}/api/${config.app.version}/todos`,
      });
    });

    // Store server reference for graceful shutdown
    app.server = server;

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.app.port === 'string'
        ? 'Pipe ' + config.app.port
        : 'Port ' + config.app.port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();