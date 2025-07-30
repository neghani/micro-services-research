# API Usage Examples

## Basic Operations

### Create a Todo
```bash
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete microservice documentation",
    "description": "Write comprehensive API docs and examples",
    "priority": "high",
    "dueDate": "2024-12-25T00:00:00.000Z",
    "tags": ["work", "documentation", "urgent"]
  }'
```

### Get All Todos with Filtering
```bash
# Get pending high-priority todos, sorted by due date
curl "http://localhost:3000/api/v1/todos?status=pending&priority=high&sortBy=dueDate&sortOrder=asc&page=1&limit=5"

# Search todos containing "project" in title or description
curl "http://localhost:3000/api/v1/todos?search=project"

# Get todos with specific tag
curl "http://localhost:3000/api/v1/todos?tag=work"
```

### Update a Todo
```bash
curl -X PUT http://localhost:3000/api/v1/todos/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "priority": "medium",
    "completed": true
  }'
```

### Toggle Todo Status
```bash
curl -X PATCH http://localhost:3000/api/v1/todos/123e4567-e89b-12d3-a456-426614174000/toggle
```

## Advanced Operations

### Get Statistics
```bash
curl http://localhost:3000/api/v1/todos/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "completed": 12,
    "pending": 13,
    "overdue": 3
  }
}
```

### Get Todos Due Soon
```bash
# Get todos due in next 3 days
curl "http://localhost:3000/api/v1/todos/due-soon?days=3"
```

### Bulk Update Todos
```bash
curl -X PATCH http://localhost:3000/api/v1/todos/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "123e4567-e89b-12d3-a456-426614174000",
      "987fcdeb-51a2-43d1-b789-123456789abc"
    ],
    "updateData": {
      "priority": "high",
      "tags": ["urgent", "review"]
    }
  }'
```

### Bulk Delete Todos
```bash
curl -X DELETE http://localhost:3000/api/v1/todos/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "123e4567-e89b-12d3-a456-426614174000",
      "987fcdeb-51a2-43d1-b789-123456789abc"
    ]
  }'
```

## Error Handling Examples

### Validation Error
```bash
# Request with invalid data
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Todo without title"
  }'
```

Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  },
  "timestamp": "2024-12-20T10:30:00.000Z"
}
```

### Not Found Error
```bash
curl http://localhost:3000/api/v1/todos/nonexistent-id
```

Response:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  },
  "timestamp": "2024-12-20T10:30:00.000Z"
}
```

## Filtering and Pagination

### Complex Filtering
```bash
# Get completed todos with high priority, containing "project" in title,
# with "work" tag, sorted by creation date, page 2 with 5 items per page
curl "http://localhost:3000/api/v1/todos?status=completed&priority=high&search=project&tag=work&sortBy=createdAt&sortOrder=desc&page=2&limit=5"
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "totalItems": 23,
    "itemsPerPage": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  },
  "filters": {
    "status": "completed",
    "priority": "high",
    "search": "project",
    "tag": "work"
  },
  "sorting": {
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

## Health Checks

### Basic Health Check
```bash
curl http://localhost:3000/health
```

### Detailed Health Check
```bash
curl http://localhost:3000/health/detailed
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development",
  "uptime": {
    "seconds": 3600,
    "human": "1h"
  },
  "database": {
    "status": "connected",
    "responseTime": "15ms"
  },
  "memory": {
    "usage": {
      "rss": 45,
      "heapTotal": 25,
      "heapUsed": 18,
      "external": 2
    },
    "unit": "MB"
  }
}
```

## Development and Testing

### Using with Postman
Import the endpoints into Postman and set base URL to `http://localhost:3000`

### Using with cURL scripts
Save frequently used commands in shell scripts:

```bash
#!/bin/bash
# create-todo.sh
curl -X POST http://localhost:3000/api/v1/todos \
  -H "Content-Type: application/json" \
  -d "$1"
```

Usage: `./create-todo.sh '{"title":"My Todo","priority":"high"}'`