#!/bin/bash

# Todo Microservice Setup Script

set -e

echo "🚀 Setting up Todo Microservice..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from env.example..."
    cp env.example .env
    print_status ".env file created. Please update it with your configuration."
else
    print_status ".env file already exists."
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir -p logs
    print_status "Created logs directory."
fi

# Install dependencies if package-lock.json exists and node_modules doesn't
if [ -f "package-lock.json" ] && [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm ci
fi

# Build and start services with Docker Compose
print_status "Building and starting services with Docker Compose..."
docker-compose up -d --build

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if MySQL is ready
print_status "Checking MySQL connection..."
docker-compose exec -T mysql mysqladmin ping -h localhost -u todouser -ptodopass123 --silent

if [ $? -eq 0 ]; then
    print_status "MySQL is ready!"
    
    # Run migrations
    print_status "Running database migrations..."
    docker-compose exec -T todo-service npm run migrate
    
    # Run seeds
    print_status "Seeding database with sample data..."
    docker-compose exec -T todo-service npm run seed
    
    print_status "Setup completed successfully! 🎉"
    echo ""
    echo "Services are running:"
    echo "  - Todo API: http://localhost:3000"
    echo "  - Health Check: http://localhost:3000/health"
    echo "  - Adminer (DB UI): http://localhost:8080"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop services: docker-compose down"
    echo "To run tests: docker-compose exec todo-service npm test"
    
else
    print_error "MySQL is not ready. Please check the logs:"
    echo "docker-compose logs mysql"
    exit 1
fi