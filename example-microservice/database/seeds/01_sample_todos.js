const { v4: uuidv4 } = require('uuid');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('todos').del();

  const now = new Date().toISOString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Sample todos
  const todos = [
    {
      id: uuidv4(),
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the todo microservice including API docs and deployment guide',
      completed: false,
      priority: 'high',
      dueDate: tomorrow.toISOString(),
      tags: JSON.stringify(['work', 'documentation', 'urgent']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Review pull requests',
      description: 'Review and approve pending pull requests from team members',
      completed: true,
      priority: 'medium',
      dueDate: null,
      tags: JSON.stringify(['work', 'code-review']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Buy groceries',
      description: 'Weekly grocery shopping - milk, bread, eggs, vegetables',
      completed: false,
      priority: 'low',
      dueDate: nextWeek.toISOString(),
      tags: JSON.stringify(['personal', 'shopping']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Implement user authentication',
      description: 'Add JWT-based authentication to the todo API with proper middleware',
      completed: false,
      priority: 'high',
      dueDate: nextWeek.toISOString(),
      tags: JSON.stringify(['work', 'backend', 'security']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Schedule dentist appointment',
      description: 'Book routine dental checkup and cleaning',
      completed: false,
      priority: 'medium',
      dueDate: nextMonth.toISOString(),
      tags: JSON.stringify(['personal', 'health']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Set up monitoring and alerts',
      description: 'Configure Prometheus, Grafana, and alerting for the microservice',
      completed: false,
      priority: 'high',
      dueDate: nextWeek.toISOString(),
      tags: JSON.stringify(['work', 'devops', 'monitoring']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Learn React hooks',
      description: 'Complete online course on React hooks and implement in side project',
      completed: true,
      priority: 'medium',
      dueDate: null,
      tags: JSON.stringify(['learning', 'frontend', 'react']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Plan weekend trip',
      description: 'Research and book accommodation for weekend getaway',
      completed: false,
      priority: 'low',
      dueDate: nextMonth.toISOString(),
      tags: JSON.stringify(['personal', 'travel', 'planning']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Optimize database queries',
      description: 'Profile and optimize slow database queries, add necessary indexes',
      completed: false,
      priority: 'medium',
      dueDate: nextWeek.toISOString(),
      tags: JSON.stringify(['work', 'database', 'performance']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: 'Write unit tests',
      description: 'Achieve 90% code coverage with comprehensive unit and integration tests',
      completed: false,
      priority: 'high',
      dueDate: nextWeek.toISOString(),
      tags: JSON.stringify(['work', 'testing', 'quality']),
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Insert sample todos
  await knex('todos').insert(todos);
};