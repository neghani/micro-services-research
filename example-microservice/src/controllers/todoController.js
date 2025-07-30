const todoService = require('../services/todoService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

/**
 * Create a new todo
 * @route POST /api/v1/todos
 */
const createTodo = asyncHandler(async (req, res) => {
  const todo = await todoService.createTodo(req.body);

  logger.info('Todo created via API:', {
    id: todo.id,
    title: todo.title,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    message: 'Todo created successfully',
    data: todo,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get all todos with filtering and pagination
 * @route GET /api/v1/todos
 */
const getAllTodos = asyncHandler(async (req, res) => {
  const result = await todoService.getAllTodos(req.query);

  logger.debug('Todos fetched via API:', {
    count: result.data.length,
    page: result.pagination.currentPage,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Todos fetched successfully',
    ...result,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get todo by ID
 * @route GET /api/v1/todos/:id
 */
const getTodoById = asyncHandler(async (req, res) => {
  const todo = await todoService.getTodoById(req.params.id);

  logger.debug('Todo fetched by ID via API:', {
    id: req.params.id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Todo fetched successfully',
    data: todo,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Update todo by ID
 * @route PUT /api/v1/todos/:id
 */
const updateTodo = asyncHandler(async (req, res) => {
  const todo = await todoService.updateTodo(req.params.id, req.body);

  logger.info('Todo updated via API:', {
    id: req.params.id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Todo updated successfully',
    data: todo,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Delete todo by ID
 * @route DELETE /api/v1/todos/:id
 */
const deleteTodo = asyncHandler(async (req, res) => {
  await todoService.deleteTodo(req.params.id);

  logger.info('Todo deleted via API:', {
    id: req.params.id,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Todo deleted successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Toggle todo completion status
 * @route PATCH /api/v1/todos/:id/toggle
 */
const toggleTodoStatus = asyncHandler(async (req, res) => {
  const todo = await todoService.toggleTodoStatus(req.params.id);

  logger.info('Todo status toggled via API:', {
    id: req.params.id,
    completed: todo.completed,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Todo marked as ${todo.completed ? 'completed' : 'pending'}`,
    data: todo,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get todo statistics
 * @route GET /api/v1/todos/stats
 */
const getTodoStatistics = asyncHandler(async (req, res) => {
  const stats = await todoService.getTodoStatistics();

  logger.debug('Todo statistics fetched via API:', {
    stats,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: 'Todo statistics fetched successfully',
    data: stats,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get todos due soon
 * @route GET /api/v1/todos/due-soon
 */
const getTodosDueSoon = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const todos = await todoService.getTodosDueSoon(days);

  logger.debug('Due soon todos fetched via API:', {
    count: todos.length,
    days,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Todos due in the next ${days} days`,
    data: todos,
    meta: {
      days,
      count: todos.length,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Bulk update todos
 * @route PATCH /api/v1/todos/bulk
 */
const bulkUpdateTodos = asyncHandler(async (req, res) => {
  const { ids, updateData } = req.body;
  const updatedCount = await todoService.bulkUpdateTodos(ids, updateData);

  logger.info('Bulk update completed via API:', {
    updatedCount,
    totalIds: ids.length,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `${updatedCount} todos updated successfully`,
    data: {
      updatedCount,
      totalRequested: ids.length,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Bulk delete todos
 * @route DELETE /api/v1/todos/bulk
 */
const bulkDeleteTodos = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const deletedCount = await todoService.bulkDeleteTodos(ids);

  logger.info('Bulk delete completed via API:', {
    deletedCount,
    totalIds: ids.length,
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `${deletedCount} todos deleted successfully`,
    data: {
      deletedCount,
      totalRequested: ids.length,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  toggleTodoStatus,
  getTodoStatistics,
  getTodosDueSoon,
  bulkUpdateTodos,
  bulkDeleteTodos,
};