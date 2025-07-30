# Todo Microservice

A production-ready Todo microservice built with Node.js, Express, MySQL, Knex.js, and Objection.js. This microservice demonstrates best practices for building scalable, maintainable APIs with comprehensive logging, validation, error handling, and containerization.

## 🚀 Features

- **RESTful API** with full CRUD operations
- **Database Integration** with MySQL using Knex.js and Objection.js
- **Input Validation** with Joi schemas
- **Comprehensive Logging** with Winston
- **Error Handling** with custom error classes and middleware
- **Rate Limiting** to prevent abuse
- **Health Checks** with detailed system information
- **Docker Support** with multi-stage builds
- **Database Migrations** and seeding
- **Bulk Operations** for efficient data manipulation
- **Filtering, Sorting, and Pagination**
- **Request Validation** and sanitization
- **Security** with Helmet.js and CORS
- **Graceful Shutdown** handling

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MySQL (if running without Docker)

## 🛠️ Installation

### Option 1: Docker Compose (Recommended)

1. Clone the repository
2. Navigate to the microservice directory
3. Copy environment variables:
   ```bash
   cp env.example .env
   ```
4. Start the services:
   ```bash
   docker-compose up -d
   ```

### Option 2: Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. Set up MySQL database and update connection details in `.env`

4. Run database migrations:
   ```bash
   npm run migrate
   ```

5. Seed the database (optional):
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health information
- `GET /health/ready` - Readiness probe for Kubernetes
- `GET /health/live` - Liveness probe for Kubernetes

### Todo Management
- `GET /api/v1/todos` - Get all todos with filtering and pagination
- `POST /api/v1/todos` - Create a new todo
- `GET /api/v1/todos/:id` - Get todo by ID
- `PUT /api/v1/todos/:id` - Update todo by ID
- `DELETE /api/v1/todos/:id` - Delete todo by ID
- `PATCH /api/v1/todos/:id/toggle` - Toggle todo completion status

### Statistics and Bulk Operations
- `GET /api/v1/todos/stats` - Get todo statistics
- `GET /api/v1/todos/due-soon` - Get todos due soon
- `PATCH /api/v1/todos/bulk` - Bulk update todos
- `DELETE /api/v1/todos/bulk` - Bulk delete todos

## 📊 API Documentation

### Create Todo
```bash
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the todo microservice implementation",
    "priority": "high",
    "dueDate": "2024-12-25T00:00:00.000Z",
    "tags": ["work", "project"]
  }'
```

### Get Todos with Filtering
```bash
curl "http://localhost:3000/api/v1/todos?status=pending&priority=high&page=1&limit=10&sortBy=dueDate&sortOrder=asc"
```

### Update Todo
```bash
curl -X PUT http://localhost:3000/api/v1/todos/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "completed": true
  }'
```

### Bulk Operations
```bash
# Bulk update
curl -X PATCH http://localhost:3000/api/v1/todos/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2", "id3"],
    "updateData": {"priority": "high"}
  }'

# Bulk delete
curl -X DELETE http://localhost:3000/api/v1/todos/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["id1", "id2", "id3"]
  }'
```

## 🗂️ Project Structure

```
example-microservice/
├── src/
│   ├── config/
│   │   ├── database.js      # Database configuration
│   │   ├── logger.js        # Logging configuration
│   │   └── index.js         # Application configuration
│   ├── controllers/
│   │   └── todoController.js # Request handlers
│   ├── middleware/
│   │   ├── errorHandler.js  # Error handling middleware
│   │   └── validation.js    # Validation middleware
│   ├── models/
│   │   └── Todo.js          # Objection.js model
│   ├── routes/
│   │   ├── todoRoutes.js    # Todo API routes
│   │   ├── healthRoutes.js  # Health check routes
│   │   └── index.js         # Route aggregation
│   ├── services/
│   │   └── todoService.js   # Business logic layer
│   ├── validations/
│   │   └── todoValidation.js # Joi schemas
│   ├── app.js               # Express application setup
│   └── index.js             # Application entry point
├── database/
│   ├── migrations/          # Database migrations
│   └── seeds/               # Database seeds
├── logs/                    # Log files (generated)
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── knexfile.js            # Knex configuration
├── healthcheck.js         # Docker health check
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_NAME` | Database name | `todoapp` |
| `DB_USER` | Database user | `todouser` |
| `DB_PASSWORD` | Database password | `todopass123` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📈 Monitoring and Logging

### Logging Levels
- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `http`: HTTP access logs
- `debug`: Debugging information

### Health Monitoring
- Basic health check: `/health`
- Detailed health with database status: `/health/detailed`
- Kubernetes probes: `/health/ready` and `/health/live`

### Log Files
- `logs/error-YYYY-MM-DD.log`: Error logs only
- `logs/combined-YYYY-MM-DD.log`: All logs

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t todo-microservice .

# Run container
docker run -p 3000:3000 --env-file .env todo-microservice
```

### Kubernetes
```yaml
# Example deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todo-microservice
spec:
  replicas: 3
  selector:
    matchLabels:
      app: todo-microservice
  template:
    metadata:
      labels:
        app: todo-microservice
    spec:
      containers:
      - name: todo-microservice
        image: todo-microservice:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request throttling
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries with Knex
- **Error Handling**: No sensitive information exposure

## 🔄 Database Operations

### Migrations
```bash
# Create new migration
npm run migrate:make create_new_table

# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback
```

### Seeds
```bash
# Run seeds
npm run seed
```

## ⚡ Performance Features

- **Connection Pooling**: Optimized database connections
- **Compression**: Gzip compression for responses
- **Pagination**: Efficient data retrieval
- **Indexes**: Database indexes for query optimization
- **Bulk Operations**: Efficient mass operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `http://localhost:3000/api/v1`