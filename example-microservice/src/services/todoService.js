const Todo = require('../models/Todo');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const config = require('../config');

class TodoService {
  /**
   * Create a new todo
   * @param {Object} todoData - Todo data
   * @returns {Promise<Object>} Created todo
   */
  async createTodo(todoData) {
    try {
      logger.info('Creating new todo:', { title: todoData.title });

      // Process tags if provided
      if (todoData.tags && Array.isArray(todoData.tags)) {
        todoData.tags = JSON.stringify(todoData.tags);
      }

      const todo = await Todo.query().insert(todoData);
      
      logger.info('Todo created successfully:', { id: todo.id });
      return todo;
    } catch (error) {
      logger.error('Error creating todo:', error);
      throw new ApiError(500, 'Failed to create todo');
    }
  }

  /**
   * Get all todos with filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated todos with metadata
   */
  async getAllTodos(options = {}) {
    try {
      const {
        page = 1,
        limit = config.pagination.defaultLimit,
        status = 'all',
        priority,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        tag,
      } = options;

      logger.debug('Fetching todos with options:', options);

      let query = Todo.query();

      // Apply filters
      if (status === 'completed') {
        query = query.where('completed', true);
      } else if (status === 'pending') {
        query = query.where('completed', false);
      }

      if (priority) {
        query = query.where('priority', priority);
      }

      if (search) {
        query = query.where((builder) => {
          builder
            .where('title', 'like', `%${search}%`)
            .orWhere('description', 'like', `%${search}%`);
        });
      }

      if (tag) {
        query = query.where('tags', 'like', `%"${tag}"%`);
      }

      // Get total count before pagination
      const totalQuery = query.clone();
      const totalResult = await totalQuery.count('* as count').first();
      const total = parseInt(totalResult.count);

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const todos = await query;

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const result = {
        data: todos,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          status,
          priority,
          search,
          tag,
        },
        sorting: {
          sortBy,
          sortOrder,
        },
      };

      logger.debug('Todos fetched successfully:', {
        count: todos.length,
        total,
        page,
      });

      return result;
    } catch (error) {
      logger.error('Error fetching todos:', error);
      throw new ApiError(500, 'Failed to fetch todos');
    }
  }

  /**
   * Get todo by ID
   * @param {string} id - Todo ID
   * @returns {Promise<Object>} Todo object
   */
  async getTodoById(id) {
    try {
      logger.debug('Fetching todo by ID:', { id });

      const todo = await Todo.query().findById(id);

      if (!todo) {
        throw new ApiError(404, 'Todo not found');
      }

      logger.debug('Todo fetched successfully:', { id });
      return todo;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error fetching todo by ID:', error);
      throw new ApiError(500, 'Failed to fetch todo');
    }
  }

  /**
   * Update todo by ID
   * @param {string} id - Todo ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated todo
   */
  async updateTodo(id, updateData) {
    try {
      logger.info('Updating todo:', { id, updateData });

      // Check if todo exists
      const existingTodo = await Todo.query().findById(id);
      if (!existingTodo) {
        throw new ApiError(404, 'Todo not found');
      }

      // Process tags if provided
      if (updateData.tags && Array.isArray(updateData.tags)) {
        updateData.tags = JSON.stringify(updateData.tags);
      }

      const updatedTodo = await Todo.query()
        .patchAndFetchById(id, updateData);

      logger.info('Todo updated successfully:', { id });
      return updatedTodo;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error updating todo:', error);
      throw new ApiError(500, 'Failed to update todo');
    }
  }

  /**
   * Delete todo by ID
   * @param {string} id - Todo ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTodo(id) {
    try {
      logger.info('Deleting todo:', { id });

      const deletedCount = await Todo.query().deleteById(id);

      if (deletedCount === 0) {
        throw new ApiError(404, 'Todo not found');
      }

      logger.info('Todo deleted successfully:', { id });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error deleting todo:', error);
      throw new ApiError(500, 'Failed to delete todo');
    }
  }

  /**
   * Toggle todo completion status
   * @param {string} id - Todo ID
   * @returns {Promise<Object>} Updated todo
   */
  async toggleTodoStatus(id) {
    try {
      logger.info('Toggling todo status:', { id });

      const todo = await Todo.query().findById(id);
      if (!todo) {
        throw new ApiError(404, 'Todo not found');
      }

      const updatedTodo = await Todo.query()
        .patchAndFetchById(id, { completed: !todo.completed });

      logger.info('Todo status toggled successfully:', {
        id,
        completed: updatedTodo.completed,
      });

      return updatedTodo;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('Error toggling todo status:', error);
      throw new ApiError(500, 'Failed to toggle todo status');
    }
  }

  /**
   * Get todos statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getTodoStatistics() {
    try {
      logger.debug('Fetching todo statistics');

      const stats = await Todo.getStatistics();

      logger.debug('Todo statistics fetched successfully:', stats);
      return stats;
    } catch (error) {
      logger.error('Error fetching todo statistics:', error);
      throw new ApiError(500, 'Failed to fetch todo statistics');
    }
  }

  /**
   * Get todos due soon
   * @param {number} days - Number of days to look ahead
   * @returns {Promise<Array>} Todos due soon
   */
  async getTodosDueSoon(days = 7) {
    try {
      logger.debug('Fetching todos due soon:', { days });

      const todos = await Todo.findDueSoon(days);

      logger.debug('Due soon todos fetched successfully:', {
        count: todos.length,
      });

      return todos;
    } catch (error) {
      logger.error('Error fetching todos due soon:', error);
      throw new ApiError(500, 'Failed to fetch todos due soon');
    }
  }

  /**
   * Bulk update todos
   * @param {Array} ids - Array of todo IDs
   * @param {Object} updateData - Update data
   * @returns {Promise<number>} Number of updated todos
   */
  async bulkUpdateTodos(ids, updateData) {
    try {
      logger.info('Bulk updating todos:', { ids, updateData });

      // Process tags if provided
      if (updateData.tags && Array.isArray(updateData.tags)) {
        updateData.tags = JSON.stringify(updateData.tags);
      }

      const updatedCount = await Todo.query()
        .patch(updateData)
        .whereIn('id', ids);

      logger.info('Bulk update completed:', { updatedCount });
      return updatedCount;
    } catch (error) {
      logger.error('Error in bulk update:', error);
      throw new ApiError(500, 'Failed to bulk update todos');
    }
  }

  /**
   * Bulk delete todos
   * @param {Array} ids - Array of todo IDs
   * @returns {Promise<number>} Number of deleted todos
   */
  async bulkDeleteTodos(ids) {
    try {
      logger.info('Bulk deleting todos:', { ids });

      const deletedCount = await Todo.query().delete().whereIn('id', ids);

      logger.info('Bulk delete completed:', { deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error in bulk delete:', error);
      throw new ApiError(500, 'Failed to bulk delete todos');
    }
  }
}

module.exports = new TodoService();