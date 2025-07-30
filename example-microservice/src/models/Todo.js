const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class Todo extends Model {
  static get tableName() {
    return 'todos';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['title'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string', minLength: 1, maxLength: 255 },
        description: { type: ['string', 'null'], maxLength: 1000 },
        completed: { type: 'boolean', default: false },
        priority: { 
          type: 'string', 
          enum: ['low', 'medium', 'high'],
          default: 'medium'
        },
        dueDate: { type: ['string', 'null'], format: 'date-time' },
        tags: { type: ['array', 'null'], items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    };
  }

  // Hooks for automatic timestamps and UUID generation
  $beforeInsert() {
    this.id = uuidv4();
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }

  // Instance methods
  markCompleted() {
    this.completed = true;
    this.updatedAt = new Date().toISOString();
  }

  markIncomplete() {
    this.completed = false;
    this.updatedAt = new Date().toISOString();
  }

  // Static methods for common queries
  static async findByStatus(completed = false) {
    return this.query().where('completed', completed);
  }

  static async findByPriority(priority) {
    return this.query().where('priority', priority);
  }

  static async findDueSoon(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.query()
      .where('dueDate', '<=', futureDate.toISOString())
      .where('completed', false)
      .orderBy('dueDate', 'asc');
  }

  static async getStatistics() {
    const total = await this.query().count('* as count').first();
    const completed = await this.query().where('completed', true).count('* as count').first();
    const pending = await this.query().where('completed', false).count('* as count').first();
    const overdue = await this.query()
      .where('dueDate', '<', new Date().toISOString())
      .where('completed', false)
      .count('* as count')
      .first();

    return {
      total: parseInt(total.count),
      completed: parseInt(completed.count),
      pending: parseInt(pending.count),
      overdue: parseInt(overdue.count),
    };
  }

  // Virtual properties
  get isOverdue() {
    if (!this.dueDate || this.completed) return false;
    return new Date(this.dueDate) < new Date();
  }

  // Custom serialization
  $formatJson(json) {
    json = super.$formatJson(json);
    
    // Add virtual properties
    json.isOverdue = this.isOverdue;
    
    // Parse tags if they're stored as JSON string
    if (typeof json.tags === 'string') {
      try {
        json.tags = JSON.parse(json.tags);
      } catch (e) {
        json.tags = null;
      }
    }
    
    return json;
  }
}

module.exports = Todo;