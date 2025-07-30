/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('todos', function(table) {
    // Primary key
    table.uuid('id').primary().notNullable();
    
    // Core fields
    table.string('title', 255).notNullable().index();
    table.text('description').nullable();
    table.boolean('completed').defaultTo(false).notNullable().index();
    
    // Additional fields
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium').notNullable().index();
    table.datetime('dueDate').nullable().index();
    table.json('tags').nullable();
    
    // Timestamps
    table.datetime('createdAt').notNullable().defaultTo(knex.fn.now());
    table.datetime('updatedAt').notNullable().defaultTo(knex.fn.now());
    
    // Indexes for better query performance
    table.index(['completed', 'priority']);
    table.index(['completed', 'dueDate']);
    table.index(['createdAt']);
    table.index(['updatedAt']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('todos');
};