# Complete Guide to Building Cheap and Reliable CD Pipelines

## Table of Contents
1. [Introduction](#introduction)
2. [Overview of CD Pipeline Options](#overview-of-cd-pipeline-options)
3. [Cost-Effective Infrastructure Options](#cost-effective-infrastructure-options)
4. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
5. [Security Best Practices](#security-best-practices)
6. [Environment Configuration Management](#environment-configuration-management)
7. [Rollback Strategies](#rollback-strategies)
8. [Monitoring and Optimization](#monitoring-and-optimization)
9. [Example Configurations](#example-configurations)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Introduction

This comprehensive guide covers everything you need to know about setting up a cost-effective, reliable Continuous Deployment (CD) pipeline. Whether you're a startup, small team, or individual developer, this guide will help you implement professional-grade automation without breaking the bank.

### What You'll Learn
- How to choose the right CD tools for your budget
- Setting up infrastructure for under $10/month
- Implementing secure deployment strategies
- Best practices for reliability and scalability
- Troubleshooting and optimization techniques

## Overview of CD Pipeline Options

### Free and Low-Cost CI/CD Platforms

#### GitHub Actions (Recommended for GitHub users)
- **Cost**: Free for public repos, 2,000 minutes/month for private repos
- **Pros**: Native GitHub integration, extensive marketplace, easy setup
- **Cons**: Limited to GitHub ecosystem, can get expensive at scale
- **Best for**: Teams already using GitHub

#### GitLab CI/CD
- **Cost**: Free tier with 400 minutes/month, Premium at $29/user/month
- **Pros**: Integrated DevSecOps, comprehensive features, self-hosted option
- **Cons**: Can be resource-intensive
- **Best for**: Teams wanting all-in-one solution

#### Jenkins (Open Source)
- **Cost**: Free (hosting costs apply)
- **Pros**: Highly customizable, extensive plugins, large community
- **Cons**: Requires maintenance, complex setup
- **Best for**: Teams needing maximum flexibility

#### CircleCI
- **Cost**: Free tier with 6,000 minutes/month, paid from $15/month
- **Pros**: Fast execution, Docker support, easy GitHub integration
- **Cons**: Limited free tier, complex pricing
- **Best for**: Docker-heavy workflows

### Budget-Friendly Hosting Options

#### VPS Providers (Under $10/month)
1. **DigitalOcean Droplets**: $4/month for 1GB RAM, 1 vCPU, 25GB SSD
2. **Vultr**: $2.50/month for 512MB RAM, 1 vCPU, 10GB SSD
3. **Linode**: $5/month for 1GB RAM, 1 vCPU, 25GB SSD
4. **Hetzner Cloud**: €3.29/month for 2GB RAM, 1 vCPU, 20GB SSD

#### Cloud Platform Free Tiers
1. **AWS Free Tier**: 
   - 750 hours/month EC2 t2.micro
   - One free CodePipeline/month
   - 100 CodeBuild minutes/month

2. **Google Cloud**: $300 credit for 90 days + always-free tier
3. **Azure**: $200 credit for 30 days + free services

## Cost-Effective Infrastructure Options

### Budget Infrastructure Setup ($5-10/month)

#### Option 1: Single VPS Setup
**Cost**: $5-10/month
**Components**:
- 1x VPS (DigitalOcean/Linode/Vultr)
- Docker for containerization
- NGINX as reverse proxy
- GitHub Actions for CI/CD

**Pros**: Simple, cost-effective, good for small projects
**Cons**: Single point of failure, limited scalability

#### Option 2: AWS Free Tier Setup
**Cost**: $0-5/month (after free tier)
**Components**:
- EC2 t2.micro instance
- AWS CodePipeline (1 free)
- S3 for artifacts
- CloudFormation for IaC

**Pros**: Scales well, professional services
**Cons**: Can get expensive quickly

#### Option 3: Multi-Cloud Hybrid
**Cost**: $5-15/month
**Components**:
- GitHub Actions for CI
- DigitalOcean VPS for deployment
- CloudFlare for CDN (free tier)

**Pros**: Best of both worlds, redundancy
**Cons**: More complex setup

### Infrastructure Specifications

#### Minimum Requirements
- **RAM**: 1GB (2GB recommended)
- **CPU**: 1 vCPU
- **Storage**: 20GB SSD
- **Bandwidth**: 1TB/month

#### Recommended for Production
- **RAM**: 2-4GB
- **CPU**: 2 vCPU
- **Storage**: 40-80GB SSD
- **Bandwidth**: Unmetered

## Step-by-Step Implementation Guide

### Phase 1: Infrastructure Setup

#### Setting Up Your VPS

1. **Choose Your Provider**
   ```bash
   # Example: DigitalOcean setup
   # Create droplet via web interface or CLI
   doctl compute droplet create my-app-server \
     --image ubuntu-22-04-x64 \
     --size s-1vcpu-1gb \
     --region nyc3 \
     --ssh-keys your-ssh-key-id
   ```

2. **Initial Server Configuration**
   ```bash
   # Connect to your server
   ssh root@your-server-ip

   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose

   # Create non-root user
   adduser deployer
   usermod -aG sudo deployer
   usermod -aG docker deployer
   ```

3. **Security Hardening**
   ```bash
   # Disable root login
   sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   
   # Change SSH port (optional)
   sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
   
   # Setup UFW firewall
   ufw allow 2222/tcp  # SSH
   ufw allow 80/tcp    # HTTP
   ufw allow 443/tcp   # HTTPS
   ufw --force enable
   
   systemctl restart ssh
   ```

### Phase 2: Application Setup

#### Basic Application Structure
```
my-app/
├── app/
│   ├── src/
│   └── package.json
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   ├── deploy.sh
│   └── health-check.sh
├── .github/workflows/
│   └── deploy.yml
└── README.md
```

#### Sample Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

#### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Phase 3: CI/CD Pipeline Setup

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/my-app:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          port: ${{ secrets.PORT }}
          script: |
            cd /home/deployer/my-app
            docker-compose pull
            docker-compose up -d
            docker system prune -f
```

#### Deployment Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "Starting deployment..."

# Pull latest images
docker-compose pull

# Stop current containers
docker-compose down

# Start new containers
docker-compose up -d

# Health check
sleep 10
if curl -f http://localhost:3000/health; then
    echo "Deployment successful!"
    
    # Clean up old images
    docker system prune -f
else
    echo "Health check failed! Rolling back..."
    docker-compose down
    docker-compose up -d --force-recreate
    exit 1
fi
```

### Phase 4: Environment Configuration

#### Environment Variables Management
```bash
# .env.example
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
LOG_LEVEL=info
```

#### Secret Management with GitHub
1. Go to repository Settings → Secrets and variables → Actions
2. Add required secrets:
   - `DOCKER_USERNAME`
   - `DOCKER_TOKEN`
   - `HOST` (server IP)
   - `USERNAME` (deployer)
   - `PRIVATE_KEY` (SSH private key)
   - `PORT` (SSH port)

### Phase 5: Monitoring Setup

#### Basic Health Check Endpoint
```javascript
// health.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});
```

#### Simple Monitoring with Uptime Robot
- Sign up for free account (50 monitors)
- Monitor your health endpoint
- Set up alerts via email/Slack

## Security Best Practices

### 1. Access Control
- Use SSH keys instead of passwords
- Implement least privilege principle
- Regular access audits
- Multi-factor authentication where possible

### 2. Secrets Management
```yaml
# Never commit secrets to code
# Use environment variables
- name: Use secrets safely
  run: echo "API_KEY=${{ secrets.API_KEY }}"
  
# Use secret scanning tools
- name: Run secret scan
  uses: trufflesecurity/trufflehog@main
```

### 3. Container Security
```dockerfile
# Use specific versions, not 'latest'
FROM node:18.17.0-alpine

# Don't run as root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Scan for vulnerabilities
RUN npm audit
```

### 4. Network Security
```bash
# Configure firewall
ufw allow from 10.0.0.0/8 to any port 22
ufw allow 80
ufw allow 443
ufw --force enable

# Use fail2ban for intrusion prevention
apt install fail2ban
```

### 5. Pipeline Security
- Scan code for vulnerabilities
- Validate all inputs
- Use signed images
- Regular dependency updates

```yaml
# Security scanning in pipeline
- name: Run security audit
  run: npm audit --audit-level moderate

- name: Scan Docker image
  uses: anchore/scan-action@v3
  with:
    image: "my-app:latest"
```

## Environment Configuration Management

### 1. Configuration Structure
```
config/
├── base.json
├── development.json
├── staging.json
├── production.json
└── secrets/
    ├── dev.env
    ├── staging.env
    └── prod.env
```

### 2. Environment-Specific Settings
```javascript
// config/index.js
const config = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      name: 'myapp_dev'
    },
    cache: {
      enabled: false
    },
    logging: {
      level: 'debug'
    }
  },
  production: {
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME
    },
    cache: {
      enabled: true,
      ttl: 3600
    },
    logging: {
      level: 'info'
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

### 3. Configuration Validation
```javascript
// Validate environment configuration
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required()
});

const { error, value } = schema.validate(process.env);
if (error) {
  throw new Error(`Configuration error: ${error.message}`);
}
```

### 4. Configuration Management Tools
- **Docker Compose**: Environment files
- **Kubernetes**: ConfigMaps and Secrets
- **HashiCorp Vault**: Advanced secret management
- **AWS Parameter Store**: AWS-native solution

## Rollback Strategies

### 1. Blue-Green Deployment
```bash
#!/bin/bash
# Blue-Green deployment script

BLUE_CONTAINER="app-blue"
GREEN_CONTAINER="app-green"
CURRENT=$(docker ps --format "table {{.Names}}" | grep -E "(app-blue|app-green)" | head -1)

if [ "$CURRENT" == "$BLUE_CONTAINER" ]; then
    NEW_CONTAINER=$GREEN_CONTAINER
    OLD_CONTAINER=$BLUE_CONTAINER
else
    NEW_CONTAINER=$BLUE_CONTAINER
    OLD_CONTAINER=$GREEN_CONTAINER
fi

echo "Deploying to $NEW_CONTAINER..."

# Deploy new version
docker run -d --name $NEW_CONTAINER -p 3001:3000 my-app:latest

# Health check
sleep 10
if curl -f http://localhost:3001/health; then
    echo "Health check passed. Switching traffic..."
    
    # Update nginx to point to new container
    sed -i "s/$OLD_CONTAINER/$NEW_CONTAINER/g" /etc/nginx/sites-available/default
    nginx -s reload
    
    # Stop old container
    docker stop $OLD_CONTAINER
    docker rm $OLD_CONTAINER
    
    echo "Deployment successful!"
else
    echo "Health check failed. Rolling back..."
    docker stop $NEW_CONTAINER
    docker rm $NEW_CONTAINER
    exit 1
fi
```

### 2. Rolling Update Strategy
```yaml
# docker-compose.yml for rolling updates
version: '3.8'

services:
  app:
    image: my-app:${IMAGE_TAG:-latest}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
```

### 3. Feature Flag Rollback
```javascript
// Feature flag implementation
const featureFlags = {
  newPaymentSystem: process.env.ENABLE_NEW_PAYMENT === 'true',
  betaUI: process.env.ENABLE_BETA_UI === 'true'
};

function useNewPayment() {
  return featureFlags.newPaymentSystem;
}

// Usage
if (useNewPayment()) {
  return newPaymentProcessor.process(payment);
} else {
  return legacyPaymentProcessor.process(payment);
}
```

### 4. Database Migration Rollbacks
```sql
-- Migration with rollback capability
-- Up migration
CREATE TABLE users_new (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Copy data
INSERT INTO users_new (email, created_at) 
SELECT email, created_at FROM users;

-- Down migration (rollback)
-- DROP TABLE users_new;
-- (Keep original table intact during transition)
```

### 5. Automated Rollback Triggers
```yaml
# Automated rollback based on metrics
- name: Check application health
  run: |
    sleep 60  # Wait for app to stabilize
    ERROR_RATE=$(curl -s http://my-app/metrics | grep error_rate | cut -d' ' -f2)
    if (( $(echo "$ERROR_RATE > 5" | bc -l) )); then
      echo "Error rate too high, triggering rollback"
      exit 1
    fi
  continue-on-error: false

- name: Rollback on failure
  if: failure()
  run: |
    kubectl rollout undo deployment/my-app
```

## Monitoring and Optimization

### 1. Essential Metrics to Track
```javascript
// metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status']
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Application health metrics
const deploymentCounter = new prometheus.Counter({
  name: 'deployments_total',
  help: 'Total number of deployments'
});
```

### 2. Cost Monitoring
```bash
#!/bin/bash
# cost-monitor.sh - Track resource usage

# Monitor disk usage
df -h | grep -E "(/$|/var)"

# Monitor memory usage
free -m

# Monitor Docker resource usage
docker stats --no-stream

# Monitor bandwidth (if applicable)
vnstat -i eth0
```

### 3. Performance Optimization
```yaml
# Optimized GitHub Actions workflow
name: Optimized Deploy

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Cache dependencies
      - uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      
      # Use build cache for Docker
      - name: Build with cache
        uses: docker/build-push-action@v5
        with:
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Example Configurations

### Complete Example: Node.js Application

#### Project Structure
```
my-node-app/
├── src/
│   ├── index.js
│   ├── routes/
│   └── middleware/
├── test/
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/
│   └── ci-cd.yml
├── scripts/
│   ├── deploy.sh
│   └── health-check.sh
├── nginx.conf
└── package.json
```

#### Complete CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: docker.io
  IMAGE_NAME: my-node-app

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Run security audit
        run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    outputs:
      image: ${{ steps.image.outputs.image }}
      digest: ${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Output image
        id: image
        run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.PRIVATE_KEY }}
          port: ${{ secrets.PORT }}
          script: |
            cd /home/deployer/my-node-app
            echo "IMAGE_TAG=latest" > .env
            docker-compose pull
            docker-compose up -d
            
            # Wait for service to be ready
            timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
            
            if [ $? -eq 0 ]; then
              echo "Deployment successful"
              docker system prune -f
            else
              echo "Deployment failed, rolling back"
              docker-compose down
              exit 1
            fi
```

#### Production Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: my-node-app:${IMAGE_TAG:-latest}
    container_name: my-node-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup

networks:
  app-network:
    driver: bridge
```

## Troubleshooting Common Issues

### 1. Deployment Failures

#### Issue: Container fails to start
```bash
# Debug steps
docker logs container-name
docker inspect container-name
docker exec -it container-name sh

# Common fixes
# Check environment variables
# Verify port mappings
# Check file permissions
# Validate configuration files
```

#### Issue: Health checks failing
```javascript
// Improve health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    diskSpace: await checkDiskSpace()
  };
  
  const isHealthy = checks.database && checks.redis && checks.diskSpace;
  res.status(isHealthy ? 200 : 503).json(checks);
});
```

### 2. Performance Issues

#### Issue: Slow deployments
```yaml
# Optimize build process
- name: Use build cache
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max

# Parallelize jobs
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20]
  
  # Use faster runners for critical jobs
  deploy:
    runs-on: ubuntu-latest-4-cores
```

#### Issue: High resource usage
```bash
# Monitor and optimize
htop
iotop
docker stats

# Optimize container resources
docker run --memory=512m --cpus=1 my-app
```

### 3. Security Issues

#### Issue: Exposed secrets
```bash
# Remove secrets from git history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch secrets.txt' \
  --prune-empty --tag-name-filter cat -- --all

# Use secret scanning
npm install --save-dev @trufflesecurity/trufflehog
```

#### Issue: Vulnerable dependencies
```bash
# Regular security audits
npm audit
npm audit fix

# Use automated updates
# Dependabot configuration
echo 'version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"' > .github/dependabot.yml
```

### 4. Rollback Issues

#### Issue: Database migration conflicts
```sql
-- Safe migration pattern
BEGIN;

-- Create new column with default
ALTER TABLE users ADD COLUMN new_field VARCHAR(255) DEFAULT 'default_value';

-- Populate new field
UPDATE users SET new_field = old_field WHERE condition;

-- Verify data
SELECT COUNT(*) FROM users WHERE new_field IS NULL;

-- Only if verification passes
-- DROP COLUMN old_field;

COMMIT;
```

#### Issue: Service discovery problems
```yaml
# Use health checks and graceful shutdown
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 5. Cost Optimization

#### Issue: Unexpected charges
```bash
# Monitor resource usage
# Set up billing alerts
aws budgets create-budget --account-id 123456789012 \
  --budget file://budget.json

# Use spot instances for non-critical workloads
# Implement auto-scaling policies
# Regular resource audits
```

## Conclusion

This guide provides a comprehensive foundation for implementing cost-effective CD pipelines. Remember to:

1. Start small and iterate
2. Prioritize security from day one
3. Monitor everything
4. Plan for rollbacks
5. Optimize continuously

For questions or improvements to this guide, please open an issue or submit a pull request.

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NGINX Configuration Guide](https://nginx.org/en/docs/)
- [SSL/TLS Certificate Setup](https://letsencrypt.org/)
- [Monitoring with Prometheus](https://prometheus.io/docs/introduction/overview/)

## Contributing

Feel free to contribute to this guide by:
- Adding new examples
- Improving existing configurations
- Sharing cost optimization tips
- Reporting issues or corrections

---

*Last updated: January 2025*
