# Microservices Overview

<!-- what are called microservices and what are not microservices? -->

## What are Microservices and What are NOT Microservices?

### What ARE Microservices?

Microservices are a software architecture pattern where applications are built as a collection of small, independent services that:

- **Single Responsibility**: Each service focuses on one business capability
- **Independently Deployable**: Can be deployed without affecting other services
- **Decentralized**: Own their data and business logic
- **Communication via APIs**: Typically REST, gRPC, or message queues
- **Technology Agnostic**: Each service can use different tech stacks
- **Failure Isolation**: One service failure doesn't bring down the entire system

**Key Characteristics:**
- Small team ownership (2-pizza rule)
- Autonomous development lifecycle
- Bounded contexts from Domain-Driven Design
- Infrastructure automation friendly

### What are NOT Microservices?

**❌ Distributed Monolith**: Services that are tightly coupled and must be deployed together

*Example: E-commerce Platform Gone Wrong*
```
┌─────────────────┐    ┌─────────────────┐
│   EC2 Instance  │    │   EC2 Instance  │
│   User Service  │◄───┤  Order Service  │
│  52.123.45.67   │    │  52.123.45.68   │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Shared RDS DB│ │    │ │Shared RDS DB│ │
│ │PostgreSQL   │ │    │ │PostgreSQL   │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
         ▲                       ▲
         └───────┬───────────────┘
                 │
    ┌─────────────────┐
    │   React UI      │
    │  CloudFront     │
    │ calls both APIs │
    │  simultaneously │
    └─────────────────┘
```

**Why this is NOT microservices:**
- Both services share the same database schema
- User Service must be deployed whenever Order Service changes
- Database migrations require coordinated downtime
- UI becomes unresponsive if either service fails

**❌ Nano-services**: Overly granular services that create more complexity than value

*Example: Over-engineered User Management*
```
AWS Infrastructure:
├── EC2 (52.10.1.10): UserValidation Service
├── EC2 (52.10.1.11): UserEmail Service  
├── EC2 (52.10.1.12): UserPassword Service
├── EC2 (52.10.1.13): UserProfile Service
└── EC2 (52.10.1.14): UserPreferences Service

Frontend Flow:
React App → API Gateway → 5 different service calls
                       → 5 database queries
                       → 5 network round trips
```

**Problems:**
- Simple user registration requires 5 API calls
- Network latency multiplied by 5x
- 5 EC2 instances for what should be 1 service
- Debugging spans across 5 different logs

**❌ Shared Database Services**: Multiple services sharing the same database

*Example: Multi-Service Single Database*
```yaml
# AWS Infrastructure
RDS Instance: ecommerce-db.cluster-xyz.us-east-1.rds.amazonaws.com

Services accessing same DB:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EC2 Instance  │    │   EC2 Instance  │    │   EC2 Instance  │
│ Product Service │    │ Order Service   │    │ User Service    │
│  (Port 3001)    │    │  (Port 3002)    │    │  (Port 3003)    │
│  EIP: 52.1.1.10 │    │  EIP: 52.1.1.11 │    │  EIP: 52.1.1.12 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Shared PostgreSQL    │
                    │   Tables: users,        │
                    │   products, orders,     │
                    │   inventory, payments   │
                    └─────────────────────────┘
```

**React Frontend Code (Anti-pattern):**
```javascript
// Frontend making calls to different services using same data
const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // All services query the same user table
    fetch('http://52.1.1.12:3003/api/users/123')
      .then(res => res.json())
      .then(setUser);
    
    fetch('http://52.1.1.11:3002/api/orders/user/123')
      .then(res => res.json())
      .then(setOrders);
    
    fetch('http://52.1.1.10:3001/api/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  return (
    <div>
      <UserProfile user={user} />
      <OrderHistory orders={orders} />
      <ProductCatalog products={products} />
    </div>
  );
};
```

**Why this fails:**
- Schema changes affect all services
- Data consistency nightmares
- Service coupling through database
- Can't scale services independently

**❌ Synchronous Chain Dependencies**: Services that rely heavily on synchronous calls to other services

*Example: Synchronous Service Chain*
```
User places order in React UI:
        │
        ▼
┌─────────────────┐
│ Order Service   │ POST /orders
│  EIP: 52.1.2.10 │
└─────────┬───────┘
          │ GET /users/123
          ▼
┌─────────────────┐
│ User Service    │
│  EIP: 52.1.2.11 │
└─────────┬───────┘
          │ GET /inventory/item-456
          ▼
┌─────────────────┐
│Inventory Service│
│  EIP: 52.1.2.12 │
└─────────┬───────┘
          │ POST /payments
          ▼
┌─────────────────┐
│Payment Service  │
│  EIP: 52.1.2.13 │
└─────────────────┘
```

**Frontend waiting for cascading calls:**
```javascript
const PlaceOrder = () => {
  const [loading, setLoading] = useState(false);
  
  const handleOrder = async (orderData) => {
    setLoading(true);
    try {
      // This single call triggers a chain of 4 synchronous calls
      // If any service in the chain fails, entire order fails
      const response = await fetch('http://52.1.2.10:8080/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
      
      // User waits for: Order → User → Inventory → Payment
      // Total latency = sum of all service latencies
      const result = await response.json();
      
    } catch (error) {
      // Any service failure breaks the entire flow
      console.error('Order failed:', error);
    } finally {
      setLoading(false);
    }
  };
};
```

**Problems:**
- Single point of failure in the chain
- Latency compounds (200ms + 150ms + 300ms + 250ms = 900ms)
- UI freezes during long operations
- Error handling becomes complex

**❌ SOA with New Labels**: Simply renaming existing SOA services as microservices

*Example: Legacy SOA Renamed*
```
Before: "SOA Services"          After: "Microservices" 
┌─────────────────┐            ┌─────────────────┐
│   EC2 Instance  │            │   EC2 Instance  │
│ CustomerService │     →      │ CustomerService │
│   (SOAP/XML)    │            │   (REST/JSON)   │
│  EIP: 52.1.3.10 │            │  EIP: 52.1.3.10 │
└─────────────────┘            └─────────────────┘

Same problems:
- Still 200MB WAR files
- Still requires app server restart for deployment
- Still shared enterprise database
- Still 6-month release cycles
```

**❌ Container = Microservice**: Just putting existing code in containers doesn't make it a microservice

*Example: Monolith in Docker*
```yaml
# docker-compose.yml - NOT microservices
version: '3.8'
services:
  legacy-app:
    image: legacy-ecommerce:latest
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=legacy-db
    deploy:
      replicas: 2
    
  legacy-db:
    image: postgres:13
    volumes:
      - ./full-ecommerce-schema.sql:/docker-entrypoint-initdb.d/init.sql

# Deployed on 2 EC2 instances with Elastic IPs:
# EC2-1 (52.2.1.10): legacy-app container
# EC2-2 (52.2.1.11): legacy-app container
# RDS: legacy-db
```

**React Frontend still calls monolith:**
```javascript
// Frontend code doesn't change - still calling monolith
const EcommerceApp = () => {
  const loadBalancer = ['52.2.1.10:8080', '52.2.1.11:8080'];
  
  const apiCall = async (endpoint, data) => {
    // Random load balancing between containers
    const server = loadBalancer[Math.floor(Math.random() * loadBalancer.length)];
    return fetch(`http://${server}/api${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  // Same monolithic endpoints
  const getProducts = () => apiCall('/products');
  const getOrders = () => apiCall('/orders');
  const getUsers = () => apiCall('/users');
  
  // Still one massive application, just containerized
};
```

**Still NOT microservices because:**
- Single deployable unit (one container image)
- Shared database and business logic
- Can't scale individual features
- Technology stack is locked
- Team can't work independently

### ✅ **What PROPER Microservices Look Like**

*Example: True Microservices Architecture*
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EKS Cluster   │    │   EKS Cluster   │    │   EKS Cluster   │
│ User Service    │    │ Order Service   │    │Product Service  │
│ Node.js + Redis │    │ Java + MySQL    │    │ Python + Mongo  │
│ Team: Identity  │    │ Team: Commerce  │    │ Team: Catalog   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
    ┌─────────────────────────────────────────────────────────┐
    │              API Gateway (AWS ALB)                      │
    │            Single endpoint for React UI                 │
    └─────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │     (CloudFront)        │
                    │  Calls unified API      │
                    └─────────────────────────┘
```

**React Frontend with proper microservices:**
```javascript
// Clean frontend code - doesn't know about service boundaries
const EcommerceApp = () => {
  const API_BASE = 'https://api.mystore.com';
  
  const getUser = (id) => 
    fetch(`${API_BASE}/users/${id}`);
    
  const getOrders = (userId) => 
    fetch(`${API_BASE}/orders?userId=${userId}`);
    
  const getProducts = () => 
    fetch(`${API_BASE}/products`);

  // API Gateway routes to appropriate microservices
  // Frontend doesn't manage multiple endpoints
  // Services can be deployed independently
  // Each team owns their service completely
};
```

<!-- explain what could go wrong if prematurely chosen micros services? -->

## What Could Go Wrong with Premature Microservices?

### Common Pitfalls

**1. Distributed System Complexity**
- Network latency and failures
- Data consistency challenges
- Distributed debugging nightmares
- Complex deployment orchestration

**2. Organizational Overhead**
- Need for DevOps maturity
- Multiple team coordination
- Service discovery and monitoring complexity
- Security across service boundaries

**3. Performance Issues**
- Network calls instead of in-process calls
- Serialization/deserialization overhead
- Cascade failures
- Transaction management across services

**4. Development Complexity**
- Local development environment setup
- Integration testing challenges
- Contract management between services
- Versioning and backward compatibility

**5. Operational Nightmare**
- Log aggregation across services
- Monitoring and alerting complexity
- Troubleshooting distributed transactions
- Data backup and recovery strategies

### When Premature is Problematic

- **Small Teams**: Lack expertise to handle distributed systems
- **Unclear Domain Boundaries**: Don't understand the business well enough
- **Monolith Works Fine**: Current system meets performance and scalability needs
- **Limited DevOps Maturity**: No CI/CD, monitoring, or automation practices

<!-- Questions to be asked before making a decision to go ahead with developing micro services? -->

## Pre-Microservices Decision Framework

### Organizational Readiness

**Team Structure & Culture**
- [ ] Do we have teams that can own services end-to-end?
- [ ] Is there a DevOps culture with automation practices?
- [ ] Can teams make independent technology choices?
- [ ] Is there organizational support for distributed system complexity?

**Technical Maturity**
- [ ] Do we have robust CI/CD pipelines?
- [ ] Is monitoring and observability infrastructure in place?
- [ ] Do we have experience with containerization and orchestration?
- [ ] Are there established API design and versioning practices?

### Business & Technical Drivers

**Scale Requirements**
- [ ] Are there specific scalability bottlenecks in current system?
- [ ] Do different parts of the system have different scaling needs?
- [ ] Is the team size growing beyond what a monolith can support?

**Domain Understanding**
- [ ] Are business domain boundaries well-defined?
- [ ] Is the system mature enough to identify stable service boundaries?
- [ ] Are there clear data ownership patterns?

**Risk Assessment**
- [ ] Can the business tolerate distributed system complexities?
- [ ] Is there budget for increased operational overhead?
- [ ] Are there compliance or security requirements that complicate distributed systems?

### Technical Prerequisites

- **Infrastructure as Code**
- **Automated Testing Strategy**
- **Service Mesh or API Gateway**
- **Centralized Logging and Monitoring**
- **Container Orchestration Platform**
- **Database per Service Strategy**

<!-- How to split an app in to various micro services? -->

## How to Split Applications into Microservices

### Domain-Driven Design Approach

**1. Identify Bounded Contexts**
```
User Management Context
├── User Registration
├── Authentication
├── Profile Management
└── User Preferences

Order Management Context
├── Cart Management
├── Order Processing
├── Payment Processing
└── Order History

Inventory Context
├── Product Catalog
├── Stock Management
├── Pricing
└── Supplier Management
```

**2. Apply Strategic Patterns**
- **Context Mapping**: Understand relationships between contexts
- **Anti-Corruption Layer**: Protect services from external dependencies
- **Shared Kernel**: Common models shared between related services

### Service Decomposition Strategies

**By Business Capability**
```
E-commerce Platform
├── Customer Service (registration, profiles, preferences)
├── Product Catalog Service (products, categories, search)
├── Order Service (cart, checkout, order management)
├── Payment Service (payment processing, billing)
├── Inventory Service (stock, warehousing)
├── Notification Service (emails, SMS, push notifications)
└── Recommendation Service (ML-based recommendations)
```

**By Data Model**
- Each service owns its data
- No shared databases between services
- Clear data access patterns

**By Team Structure (Conway's Law)**
- Service boundaries align with team boundaries
- Teams that communicate well can share service boundaries
- Independent teams should own separate services

### Decomposition Patterns

**1. Strangler Fig Pattern**
- Gradually replace monolith functionality
- Route traffic between old and new systems
- Incremental migration approach

**2. Database-per-Service**
- Each service has its own database
- Use event sourcing for cross-service data consistency
- Implement saga pattern for distributed transactions

**3. API-First Design**
- Define service contracts before implementation
- Use OpenAPI/Swagger specifications
- Implement contract testing

### Service Sizing Guidelines

**Right-Sized Service Characteristics:**
- Can be rewritten in 2-4 weeks
- Managed by a team of 2-8 people
- Has a single reason to change
- Can be deployed independently
- Owns its data completely

<!-- Micro service architectures and explanations?  -->

## Microservice Architecture Patterns

### Core Architectural Patterns

**1. API Gateway Pattern**
```
Client Applications
        ↓
    API Gateway
        ↓
┌─────────────────────┐
│  Service Mesh       │
│  ┌─────┐ ┌─────┐   │
│  │Svc A│ │Svc B│   │
│  └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐   │
│  │Svc C│ │Svc D│   │
│  └─────┘ └─────┘   │
└─────────────────────┘
```

**Benefits:**
- Single entry point for clients
- Cross-cutting concerns (auth, rate limiting, caching)
- Request routing and composition
- Protocol translation

**2. Service Mesh Architecture**
```
┌──────────────────────────────────┐
│           Control Plane          │
│     (Istio, Linkerd, Consul)     │
└──────────────────┬───────────────┘
                   │
┌──────────────────▼───────────────┐
│            Data Plane            │
│  ┌─────┐    ┌─────┐    ┌─────┐  │
│  │Svc A│◄──►│Svc B│◄──►│Svc C│  │
│  │+Proxy│   │+Proxy│   │+Proxy│ │
│  └─────┘    └─────┘    └─────┘  │
└──────────────────────────────────┘
```

**Features:**
- Service-to-service communication
- Load balancing and circuit breaking
- Security policies and encryption
- Observability and metrics

**3. Event-Driven Architecture**
```
┌─────────┐    Events    ┌──────────────┐
│Service A│──────────────►│Event Broker  │
└─────────┘               │(Kafka/RabbitMQ)│
                          └──────┬───────┘
┌─────────┐                      │
│Service B│◄─────────────────────┘
└─────────┘                      │
┌─────────┐                      │
│Service C│◄─────────────────────┘
└─────────┘
```

**Patterns:**
- **Event Sourcing**: Store events instead of current state
- **CQRS**: Separate read and write models
- **Saga Pattern**: Manage distributed transactions
- **Event Store**: Centralized event storage

### Communication Patterns

**Synchronous Communication**
- **REST APIs**: HTTP-based, stateless, resource-oriented
- **GraphQL**: Flexible query language, single endpoint
- **gRPC**: High-performance, binary protocol, schema-first

**Asynchronous Communication**
- **Message Queues**: Point-to-point communication
- **Publish/Subscribe**: Event broadcasting
- **Event Streaming**: Real-time event processing

### Data Management Patterns

**1. Database per Service**
```
┌─────────────┐    ┌─────────────┐
│  Service A  │    │  Service B  │
│             │    │             │
│ ┌─────────┐ │    │ ┌─────────┐ │
│ │Database │ │    │ │Database │ │
│ │   A     │ │    │ │   B     │ │
│ └─────────┘ │    │ └─────────┘ │
└─────────────┘    └─────────────┘
```

**2. Shared Database Anti-Pattern**
```
❌ AVOID THIS:
┌─────────────┐    ┌─────────────┐
│  Service A  │    │  Service B  │
└──────┬──────┘    └──────┬──────┘
       │                  │
       └─────────┬────────┘
                 ▼
         ┌─────────────┐
         │   Shared    │
         │  Database   │
         └─────────────┘
```

**3. Event Sourcing Pattern**
```
Commands → [Service] → Events → Event Store
                  ↓
              Read Models ← Event Projections
```

### Resilience Patterns

**1. Circuit Breaker**
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
```

**2. Bulkhead Pattern**
- Isolate resources for different types of requests
- Separate thread pools for different services
- Prevent cascading failures

**3. Retry with Exponential Backoff**
```python
def retry_with_backoff(func, max_retries=3, base_delay=1):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            delay = base_delay * (2 ** attempt)
            time.sleep(delay)
```

<!-- How properly deploy micro services?  -->

## Microservices Deployment Best Practices

### Containerization Strategy

**Docker Best Practices**
```dockerfile
# Multi-stage build for smaller images
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Container Security:**
- Use minimal base images (Alpine, Distroless)
- Run as non-root user
- Scan images for vulnerabilities
- Use specific version tags, not 'latest'

### Orchestration with Kubernetes

**Deployment Configuration**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:v1.2.3
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service Configuration**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
```

### CI/CD Pipeline Strategy

**Pipeline Stages**
```yaml
stages:
  - build
  - test
  - security-scan
  - package
  - deploy-staging
  - integration-tests
  - deploy-production

build-service:
  stage: build
  script:
    - docker build -t $SERVICE_NAME:$CI_COMMIT_SHA .
    - docker push $REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA

test-service:
  stage: test
  script:
    - npm run test:unit
    - npm run test:integration
    - npm run test:contract

security-scan:
  stage: security-scan
  script:
    - trivy image $REGISTRY/$SERVICE_NAME:$CI_COMMIT_SHA
    - sonar-scanner

deploy-staging:
  stage: deploy-staging
  script:
    - helm upgrade --install $SERVICE_NAME ./helm-chart
      --set image.tag=$CI_COMMIT_SHA
      --namespace staging
```

### Deployment Patterns

**1. Blue-Green Deployment**
```
Production Traffic
        ↓
   Load Balancer
    ↙      ↘
Blue Env   Green Env
(Current)  (New Version)
```

**2. Canary Deployment**
```
Traffic Split:
├── 90% → Current Version
└── 10% → New Version (Canary)

Gradually increase canary traffic:
10% → 25% → 50% → 100%
```

**3. Rolling Update**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 1
```

### Environment Management

**Configuration Management**
```yaml
# ConfigMap for non-sensitive config
apiVersion: v1
kind: ConfigMap
metadata:
  name: user-service-config
data:
  DATABASE_URL: "postgresql://db:5432/users"
  LOG_LEVEL: "info"

---
# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: user-service-secrets
data:
  DATABASE_PASSWORD: <base64-encoded>
  JWT_SECRET: <base64-encoded>
```

**Environment Promotion**
```
Development → Staging → Production

Each environment:
- Isolated namespaces
- Environment-specific configurations
- Automated testing gates
- Approval processes for production
```

### Monitoring and Observability

**Health Checks**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK'
  };
  
  try {
    // Check database connectivity
    await database.ping();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'ERROR';
    res.status(503);
  }
  
  res.json(health);
});
```

**Readiness vs Liveness**
- **Liveness**: Is the service running? (restart if fails)
- **Readiness**: Is the service ready to receive traffic? (remove from load balancer if fails)

<!-- explain best practices like 12factorApp or something ?  -->

## Microservices Best Practices

### The Twelve-Factor App Methodology

**I. Codebase**
- One codebase per service tracked in version control
- Multiple deployments (dev, staging, prod) from same codebase

**II. Dependencies**
- Explicitly declare and isolate dependencies
- Use package managers (npm, pip, maven)
- Never rely on system-wide packages

**III. Config**
- Store configuration in environment variables
- Separate config from code
- Never commit secrets to version control

```javascript
// ✅ Good: Environment-based config
const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
    password: process.env.DB_PASSWORD
  },
  redis: {
    url: process.env.REDIS_URL
  }
};

// ❌ Bad: Hardcoded config
const config = {
  port: 3000,
  database: {
    url: "postgresql://localhost:5432/mydb",
    password: "hardcoded-password"
  }
};
```

**IV. Backing Services**
- Treat backing services as attached resources
- Database, message queues, caching services as external resources
- Switch between local and third-party services without code changes

**V. Build, Release, Run**
- Strictly separate build and run stages
- Build: Convert code to executable bundle
- Release: Combine build with config
- Run: Execute the application

**VI. Processes**
- Execute as one or more stateless processes
- Share nothing between processes
- Store session state in stateful backing services

**VII. Port Binding**
- Export services via port binding
- Self-contained, don't rely on runtime injection

**VIII. Concurrency**
- Scale out via the process model
- Handle different workload types with different process types

**IX. Disposability**
- Fast startup and graceful shutdown
- Handle SIGTERM signals properly
- Robust against sudden death

```javascript
// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Stop accepting new requests
  server.close(async () => {
    // Close database connections
    await database.close();
    
    // Close other resources
    await redis.quit();
    
    console.log('Process terminated');
    process.exit(0);
  });
});
```

**X. Dev/Prod Parity**
- Keep development, staging, and production as similar as possible
- Use same backing services across environments
- Continuous deployment

**XI. Logs**
- Treat logs as event streams
- Never manage log files directly
- Write to stdout/stderr

**XII. Admin Processes**
- Run admin tasks as one-off processes
- Database migrations, data cleanup scripts
- Same environment and codebase as application

### Additional Microservices Best Practices

**API Design Principles**

**1. RESTful API Design**
```
Resources:
GET    /users          # List users
GET    /users/123      # Get specific user
POST   /users          # Create user
PUT    /users/123      # Update user
DELETE /users/123      # Delete user
```

**2. API Versioning**
```
# URL Versioning
GET /api/v1/users/123
GET /api/v2/users/123

# Header Versioning
GET /api/users/123
Accept: application/vnd.api+json;version=1
```

**3. Error Handling**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456"
  }
}
```

**Security Best Practices**

**1. Authentication & Authorization**
```javascript
// JWT-based authentication
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

**2. Service-to-Service Communication**
- Use mTLS for service mesh
- Implement service authentication
- Apply principle of least privilege

**3. Input Validation**
```javascript
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(100)
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    });
  }
  next();
};
```

**Data Consistency Patterns**

**1. Saga Pattern**
```javascript
class OrderSaga {
  async execute(orderData) {
    const saga = new Saga();
    
    saga
      .addStep(
        () => this.reserveInventory(orderData),
        () => this.cancelInventoryReservation(orderData)
      )
      .addStep(
        () => this.processPayment(orderData),
        () => this.refundPayment(orderData)
      )
      .addStep(
        () => this.createOrder(orderData),
        () => this.cancelOrder(orderData)
      );
    
    return await saga.execute();
  }
}
```

**2. Event Sourcing**
```javascript
class EventStore {
  async saveEvent(streamId, event) {
    const eventData = {
      stream_id: streamId,
      event_type: event.type,
      event_data: JSON.stringify(event.data),
      version: await this.getNextVersion(streamId),
      created_at: new Date()
    };
    
    await this.db.events.insert(eventData);
    await this.publishEvent(eventData);
  }
  
  async getEvents(streamId, fromVersion = 0) {
    return await this.db.events.find({
      stream_id: streamId,
      version: { $gte: fromVersion }
    }).sort({ version: 1 });
  }
}
```

**Testing Strategies**

**1. Testing Pyramid**
```
        /\
       /  \
      / UI \
     /______\
    /        \
   /Integration\
  /__________\
 /            \
/    Unit      \
/______________\
```

**2. Contract Testing**
```javascript
// Producer contract test
const { Pact } = require('@pact-foundation/pact');

const provider = new Pact({
  consumer: 'UserService',
  provider: 'OrderService',
  port: 1234
});

describe('User Service', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('should get user orders', async () => {
    await provider.addInteraction({
      state: 'user has orders',
      uponReceiving: 'a request for user orders',
      withRequest: {
        method: 'GET',
        path: '/users/123/orders'
      },
      willRespondWith: {
        status: 200,
        body: { orders: [] }
      }
    });

    const response = await getUserOrders('123');
    expect(response.orders).toBeDefined();
  });
});
```

<!-- Explain the need for tools like log analysers(splunk/kibana), APIGateway   -->

## Essential Microservices Tools and Infrastructure

### Log Analysis and Monitoring Tools

**Why Log Analyzers are Critical**

In a microservices architecture, a single user request might traverse multiple services, making traditional logging inadequate. You need centralized logging to:

- **Correlate logs across services** using trace IDs
- **Debug distributed transactions** and find bottlenecks
- **Monitor system health** and detect anomalies
- **Analyze user behavior** across the entire system
- **Comply with audit requirements** and security policies

**ELK Stack (Elasticsearch, Logstash, Kibana)**

```yaml
# Docker Compose for ELK Stack
version: '3.7'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch
```

**Structured Logging Example**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Structured log with correlation ID
logger.info('User order processed', {
  userId: '12345',
  orderId: 'ord_67890',
  correlationId: req.headers['x-correlation-id'],
  service: 'order-service',
  duration: 250,
  status: 'success'
});
```

**Splunk for Enterprise**

Splunk provides advanced features for enterprise environments:

```splunk
# Search for errors across all services in the last hour
index=microservices level=ERROR earliest=-1h
| stats count by service_name, error_type
| sort -count

# Track request flow across services
index=microservices correlation_id="abc123"
| sort _time
| table _time, service_name, operation, duration
```

**Modern Alternatives: Fluentd + OpenSearch**

```yaml
# Fluentd configuration
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

<match microservices.**>
  @type opensearch
  host opensearch
  port 9200
  index_name microservices-logs
  type_name _doc
  
  <buffer>
    @type file
    path /var/log/fluentd-buffers/kubernetes.system.buffer
    flush_mode interval
    retry_type exponential_backoff
    flush_thread_count 2
    flush_interval 5s
    retry_forever
    retry_max_interval 30
    chunk_limit_size 2M
    queue_limit_length 8
    overflow_action block
  </buffer>
</match>
```

### API Gateway Solutions

**Why API Gateways are Essential**

API Gateways serve as the single entry point for all client requests and provide:

**Core Functions:**
- **Request Routing**: Direct requests to appropriate microservices
- **Load Balancing**: Distribute load across service instances
- **Authentication/Authorization**: Central security enforcement
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Request/Response Transformation**: Protocol translation and data transformation
- **Caching**: Improve performance by caching responses
- **Analytics**: Monitor API usage and performance

**Popular API Gateway Solutions**

**1. Kong**
```yaml
# Kong configuration
services:
  kong:
    image: kong:3.0.0-alpine
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/declarative/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    volumes:
      - ./kong.yml:/kong/declarative/kong.yml
    ports:
      - "8000:8000"
      - "8001:8001"
```

```yaml
# Kong declarative configuration
_format_version: "3.0"
services:
  - name: user-service
    url: http://user-service:3000
    routes:
      - name: user-route
        paths:
          - /api/users
        methods:
          - GET
          - POST
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: jwt
        config:
          key_claim_name: iss
```

**2. Ambassador (Emissary-ingress)**
```yaml
apiVersion: getambassador.io/v3alpha1
kind: Mapping
metadata:
  name: user-service-mapping
spec:
  hostname: api.mycompany.com
  prefix: /api/users/
  service: user-service:80
  timeout_ms: 5000
  retry_policy:
    retry_on: "5xx"
    num_retries: 3
```

**3. AWS API Gateway**
```yaml
# Serverless Framework configuration
service: microservices-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  userProxy:
    handler: handlers/userProxy.handler
    events:
      - http:
          path: /users/{proxy+}
          method: ANY
          cors: true
          authorizer:
            name: jwtAuthorizer
            type: TOKEN

  orderProxy:
    handler: handlers/orderProxy.handler
    events:
      - http:
          path: /orders/{proxy+}
          method: ANY
          cors: true

resources:
  Resources:
    ApiGatewayRestApi:
      Type: AWS::ApiGateway::RestApi
      Properties:
        Name: microservices-api
        EndpointConfiguration:
          Types:
            - EDGE
```

**4. Envoy Proxy**
```yaml
static_resources:
  listeners:
  - name: listener_0
    address:
      socket_address:
        protocol: TCP
        address: 0.0.0.0
        port_value: 10000
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
          stat_prefix: ingress_http
          route_config:
            name: local_route
            virtual_hosts:
            - name: local_service
              domains: ["*"]
              routes:
              - match:
                  prefix: "/api/users"
                route:
                  cluster: user_service
              - match:
                  prefix: "/api/orders"
                route:
                  cluster: order_service
          http_filters:
          - name: envoy.filters.http.router

  clusters:
  - name: user_service
    connect_timeout: 30s
    type: LOGICAL_DNS
    dns_lookup_family: V4_ONLY
    load_assignment:
      cluster_name: user_service
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: user-service
                port_value: 3000
```

### Service Discovery and Configuration

**Service Discovery Tools**

**1. Consul**
```hcl
# Consul service definition
service {
  name = "user-service"
  id   = "user-service-1"
  port = 3000
  tags = ["v1.2.0", "production"]
  
  check {
    http     = "http://localhost:3000/health"
    interval = "10s"
    timeout  = "3s"
  }
}
```

**2. etcd for Kubernetes**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
  labels:
    app: user-service
    version: v1.2.0
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 3000
    name: http
```

### Distributed Tracing

**Jaeger Tracing**
```yaml
# Jaeger deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.40
        ports:
        - containerPort: 16686
        - containerPort: 14268
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
```

**OpenTelemetry Integration**
```javascript
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  serviceName: 'user-service',
});

sdk.start();

// Instrument your code
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('user-service');

app.get('/users/:id', async (req, res) => {
  const span = tracer.startSpan('get-user');
  
  try {
    const user = await getUserById(req.params.id);
    span.setStatus({ code: trace.SpanStatusCode.OK });
    res.json(user);
  } catch (error) {
    span.setStatus({ 
      code: trace.SpanStatusCode.ERROR,
      message: error.message 
    });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});
```

### Metrics and Alerting

**Prometheus + Grafana**
```yaml
# Prometheus configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'microservices'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
```

**Application Metrics**
```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

This comprehensive microservices documentation covers all the essential aspects from architecture decisions to deployment and monitoring. Each section provides practical examples and real-world guidance for implementing microservices successfully.
