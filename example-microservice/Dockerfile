# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install system dependencies for native modules and dumb-init
RUN apk add --no-cache \
    dumb-init \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Create app directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm ci && npm cache clean --force
COPY . .
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]

# Production dependencies stage
FROM base AS dependencies
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy dependencies
COPY --from=dependencies --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE 3000

# Start application
CMD ["dumb-init", "node", "src/index.js"]