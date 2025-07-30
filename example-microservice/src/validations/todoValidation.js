const Joi = require('joi');

// Custom UUID validation
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' });

// Create todo validation schema
const createTodoSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high',
    }),

  dueDate: Joi.date()
    .iso()
    .min('now')
    .allow(null)
    .optional()
    .messages({
      'date.format': 'Due date must be a valid ISO date',
      'date.min': 'Due date cannot be in the past',
    }),

  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .max(10)
    .allow(null)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Tag must be at least 1 character long',
      'string.max': 'Tag cannot exceed 50 characters',
    }),

  completed: Joi.boolean()
    .default(false)
    .optional(),
});

// Update todo validation schema
const updateTodoSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character long',
      'string.max': 'Title cannot exceed 255 characters',
    }),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters',
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high',
    }),

  dueDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .messages({
      'date.format': 'Due date must be a valid ISO date',
    }),

  tags: Joi.array()
    .items(Joi.string().trim().min(1).max(50))
    .max(10)
    .allow(null)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Tag must be at least 1 character long',
      'string.max': 'Tag cannot exceed 50 characters',
    }),

  completed: Joi.boolean()
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

// Query parameters validation schema
const queryParamsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),

  status: Joi.string()
    .valid('completed', 'pending', 'all')
    .default('all')
    .messages({
      'any.only': 'Status must be one of: completed, pending, all',
    }),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'dueDate', 'priority', 'title')
    .default('createdAt')
    .messages({
      'any.only': 'SortBy must be one of: createdAt, updatedAt, dueDate, priority, title',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'SortOrder must be either asc or desc',
    }),

  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters',
    }),

  tag: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Tag cannot exceed 50 characters',
    }),
});

// UUID parameter validation schema
const uuidParamSchema = Joi.object({
  id: uuidSchema.required().messages({
    'any.required': 'Todo ID is required',
    'string.guid': 'Invalid todo ID format',
  }),
});

module.exports = {
  createTodoSchema,
  updateTodoSchema,
  queryParamsSchema,
  uuidParamSchema,
};