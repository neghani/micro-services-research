const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { testConnection } = require('../config/database');
const config = require('../config');
const logger = require('../config/logger');
const { version } = require('../../package.json');

const router = express.Router();

/**
 * Basic health check
 * @route GET /health
 */
router.get('/', asyncHandler(async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
    environment: config.app.env,
  };

  res.status(200).json({
    success: true,
    ...healthData,
  });
}));

/**
 * Detailed health check
 * @route GET /health/detailed
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database connection
  const dbStatus = await testConnection();
  const dbResponseTime = Date.now() - startTime;

  // Memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  // CPU usage (simplified)
  const cpuUsage = process.cpuUsage();

  const healthData = {
    status: dbStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version,
    environment: config.app.env,
    uptime: {
      seconds: Math.floor(process.uptime()),
      human: formatUptime(process.uptime()),
    },
    database: {
      status: dbStatus ? 'connected' : 'disconnected',
      responseTime: `${dbResponseTime}ms`,
    },
    memory: {
      usage: memoryUsageMB,
      unit: 'MB',
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid,
  };

  const statusCode = dbStatus ? 200 : 503;
  
  logger.debug('Detailed health check performed:', {
    status: healthData.status,
    dbStatus,
    responseTime: dbResponseTime,
  });

  res.status(statusCode).json({
    success: dbStatus,
    ...healthData,
  });
}));

/**
 * Readiness probe
 * @route GET /health/ready
 */
router.get('/ready', asyncHandler(async (req, res) => {
  // Check if the service is ready to accept traffic
  const dbStatus = await testConnection();
  
  if (dbStatus) {
    res.status(200).json({
      success: true,
      status: 'ready',
      message: 'Service is ready to accept traffic',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'not ready',
      message: 'Service is not ready - database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * Liveness probe
 * @route GET /health/live
 */
router.get('/live', asyncHandler(async (req, res) => {
  // Simple liveness check - if this endpoint responds, the service is alive
  res.status(200).json({
    success: true,
    status: 'alive',
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

/**
 * Format uptime in human-readable format
 * @param {number} seconds 
 * @returns {string}
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ') || '0s';
}

module.exports = router;