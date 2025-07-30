const express = require('express');
const todoController = require('../controllers/todoController');
const { validateBody, validateQuery, validateParams } = require('../middleware/validation');
const {
  createTodoSchema,
  updateTodoSchema,
  queryParamsSchema,
  uuidParamSchema,
} = require('../validations/todoValidation');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const router = express.Router();

// Rate limiting for todo routes
const todoRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bulk operations validation schemas
const bulkUpdateSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().uuid({ version: 'uuidv4' }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one ID is required',
      'array.max': 'Cannot update more than 50 todos at once',
      'any.required': 'IDs array is required',
    }),
  updateData: updateTodoSchema.required().messages({
    'any.required': 'Update data is required',
  }),
});

const bulkDeleteSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().uuid({ version: 'uuidv4' }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one ID is required',
      'array.max': 'Cannot delete more than 50 todos at once',
      'any.required': 'IDs array is required',
    }),
});

const dueSoonQuerySchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(7)
    .messages({
      'number.base': 'Days must be a number',
      'number.integer': 'Days must be an integer',
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 365',
    }),
});

// Apply rate limiting to all routes
router.use(todoRateLimit);

/**
 * @route   GET /api/v1/todos/stats
 * @desc    Get todo statistics
 * @access  Public
 */
router.get('/stats', todoController.getTodoStatistics);

/**
 * @route   GET /api/v1/todos/due-soon
 * @desc    Get todos due soon
 * @access  Public
 */
router.get(
  '/due-soon',
  validateQuery(dueSoonQuerySchema),
  todoController.getTodosDueSoon
);

/**
 * @route   PATCH /api/v1/todos/bulk
 * @desc    Bulk update todos
 * @access  Public
 */
router.patch(
  '/bulk',
  validateBody(bulkUpdateSchema),
  todoController.bulkUpdateTodos
);

/**
 * @route   DELETE /api/v1/todos/bulk
 * @desc    Bulk delete todos
 * @access  Public
 */
router.delete(
  '/bulk',
  validateBody(bulkDeleteSchema),
  todoController.bulkDeleteTodos
);

/**
 * @route   GET /api/v1/todos
 * @desc    Get all todos with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  validateQuery(queryParamsSchema),
  todoController.getAllTodos
);

/**
 * @route   POST /api/v1/todos
 * @desc    Create a new todo
 * @access  Public
 */
router.post(
  '/',
  validateBody(createTodoSchema),
  todoController.createTodo
);

/**
 * @route   GET /api/v1/todos/:id
 * @desc    Get todo by ID
 * @access  Public
 */
router.get(
  '/:id',
  validateParams(uuidParamSchema),
  todoController.getTodoById
);

/**
 * @route   PUT /api/v1/todos/:id
 * @desc    Update todo by ID
 * @access  Public
 */
router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validateBody(updateTodoSchema),
  todoController.updateTodo
);

/**
 * @route   DELETE /api/v1/todos/:id
 * @desc    Delete todo by ID
 * @access  Public
 */
router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  todoController.deleteTodo
);

/**
 * @route   PATCH /api/v1/todos/:id/toggle
 * @desc    Toggle todo completion status
 * @access  Public
 */
router.patch(
  '/:id/toggle',
  validateParams(uuidParamSchema),
  todoController.toggleTodoStatus
);

module.exports = router;