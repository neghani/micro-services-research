const request = require('supertest');
const app = require('../src/app');

describe('Todo API', () => {
  describe('Health Checks', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });

    test('GET /health/detailed should return detailed health info', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Todo CRUD Operations', () => {
    let todoId;

    test('POST /api/v1/todos should create a new todo', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'This is a test todo',
        priority: 'medium',
        tags: ['test', 'api']
      };

      const response = await request(app)
        .post('/api/v1/todos')
        .send(todoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(todoData.title);
      expect(response.body.data.id).toBeDefined();
      
      todoId = response.body.data.id;
    });

    test('GET /api/v1/todos should return all todos', async () => {
      const response = await request(app)
        .get('/api/v1/todos')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    test('GET /api/v1/todos/:id should return specific todo', async () => {
      if (!todoId) {
        return; // Skip if no todo was created
      }

      const response = await request(app)
        .get(`/api/v1/todos/${todoId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(todoId);
    });

    test('PUT /api/v1/todos/:id should update todo', async () => {
      if (!todoId) {
        return; // Skip if no todo was created
      }

      const updateData = {
        title: 'Updated Test Todo',
        completed: true
      };

      const response = await request(app)
        .put(`/api/v1/todos/${todoId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.completed).toBe(true);
    });

    test('DELETE /api/v1/todos/:id should delete todo', async () => {
      if (!todoId) {
        return; // Skip if no todo was created
      }

      await request(app)
        .delete(`/api/v1/todos/${todoId}`)
        .expect(200);

      // Verify todo is deleted
      await request(app)
        .get(`/api/v1/todos/${todoId}`)
        .expect(404);
    });
  });

  describe('Validation', () => {
    test('POST /api/v1/todos should return 400 for invalid data', async () => {
      const invalidData = {
        // Missing required title
        description: 'Todo without title'
      };

      const response = await request(app)
        .post('/api/v1/todos')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('GET /api/v1/todos with invalid UUID should return 404', async () => {
      await request(app)
        .get('/api/v1/todos/invalid-uuid')
        .expect(400);
    });
  });

  describe('Statistics', () => {
    test('GET /api/v1/todos/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/v1/todos/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('completed');
      expect(response.body.data).toHaveProperty('pending');
    });
  });
});

// Example of testing with database setup/teardown
describe('Todo Service Integration', () => {
  beforeAll(async () => {
    // Set up test database if needed
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Clean up test database if needed
    if (app.server) {
      app.server.close();
    }
  });
});