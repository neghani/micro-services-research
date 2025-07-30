const express = require('express');
const todoRoutes = require('./todoRoutes');
const healthRoutes = require('./healthRoutes');
const config = require('../config');

const router = express.Router();

// API version prefix
const apiVersion = `/api/${config.app.version}`;

// Health check routes (no version prefix)
router.use('/health', healthRoutes);

// API routes with version prefix
router.use(`${apiVersion}/todos`, todoRoutes);

// API documentation route
router.get(apiVersion, (req, res) => {
  res.json({
    success: true,
    message: `Todo Microservice API ${config.app.version}`,
    version: config.app.version,
    environment: config.app.env,
    endpoints: {
      todos: {
        'GET /todos': 'Get all todos with filtering and pagination',
        'POST /todos': 'Create a new todo',
        'GET /todos/:id': 'Get todo by ID',
        'PUT /todos/:id': 'Update todo by ID',
        'DELETE /todos/:id': 'Delete todo by ID',
        'PATCH /todos/:id/toggle': 'Toggle todo completion status',
        'GET /todos/stats': 'Get todo statistics',
        'GET /todos/due-soon': 'Get todos due soon',
        'PATCH /todos/bulk': 'Bulk update todos',
        'DELETE /todos/bulk': 'Bulk delete todos',
      },
      health: {
        'GET /health': 'Basic health check',
        'GET /health/detailed': 'Detailed health check',
        'GET /health/ready': 'Readiness probe',
        'GET /health/live': 'Liveness probe',
      },
    },
    documentation: {
      swagger: `${req.protocol}://${req.get('host')}/api-docs`,
      postman: 'Contact API team for Postman collection',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;