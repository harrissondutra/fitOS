#!/bin/bash

# FitOS - Deploy to Staging Script
# This script deploys the application to staging environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fitos"
STAGING_HOST="${STAGING_HOST:-staging.fitOS.com}"
STAGING_USER="${STAGING_USER:-deploy}"
STAGING_PATH="/opt/fitos"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_IMAGE="${DOCKER_REGISTRY}/${APP_NAME}"

echo -e "${BLUE}🚀 Starting FitOS Staging Deploy${NC}"
echo "=================================="

# Check if required environment variables are set
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    echo -e "${RED}❌ Error: DOCKER_USERNAME and DOCKER_PASSWORD must be set${NC}"
    exit 1
fi

if [ -z "$STAGING_SSH_KEY" ]; then
    echo -e "${RED}❌ Error: STAGING_SSH_KEY must be set${NC}"
    exit 1
fi

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Build and push Docker image
print_status "Building and pushing Docker image..."

# Login to Docker registry
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Build image
docker build -t "${DOCKER_IMAGE}:latest" -t "${DOCKER_IMAGE}:${GITHUB_SHA:-latest}" .

# Push image
docker push "${DOCKER_IMAGE}:latest"
if [ -n "$GITHUB_SHA" ]; then
    docker push "${DOCKER_IMAGE}:${GITHUB_SHA}"
fi

print_success "Docker image built and pushed successfully"

# Step 2: Deploy to staging server
print_status "Deploying to staging server..."

# Create temporary SSH key file
SSH_KEY_FILE=$(mktemp)
echo "$STAGING_SSH_KEY" > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"

# Deploy to staging
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
    set -e
    
    echo "📁 Navigating to application directory..."
    cd $STAGING_PATH
    
    echo "📥 Pulling latest Docker image..."
    docker-compose pull
    
    echo "🔄 Stopping existing containers..."
    docker-compose down --remove-orphans
    
    echo "🚀 Starting new containers..."
    docker-compose up -d
    
    echo "🧹 Cleaning up unused Docker resources..."
    docker system prune -f
    
    echo "📊 Checking container status..."
    docker-compose ps
    
    echo "📝 Checking application logs..."
    docker-compose logs --tail=50
EOF

# Clean up SSH key file
rm -f "$SSH_KEY_FILE"

print_success "Deployment to staging completed successfully"

# Step 3: Health check
print_status "Performing health check..."

# Wait for application to start
sleep 30

# Check if application is responding
if curl -f -s "http://$STAGING_HOST/api/health" > /dev/null; then
    print_success "Health check passed - application is running"
else
    print_error "Health check failed - application may not be running properly"
    exit 1
fi

# Step 4: Run database migrations
print_status "Running database migrations..."

ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$STAGING_USER@$STAGING_HOST" << EOF
    cd $STAGING_PATH
    docker-compose exec -T backend npm run migrate:prod
EOF

print_success "Database migrations completed"

# Step 5: Send notification
print_status "Sending deployment notification..."

# Create deployment summary
DEPLOYMENT_SUMMARY="🚀 FitOS Staging Deployment Completed

📅 Date: $(date)
🔧 Version: ${GITHUB_SHA:-latest}
🌐 Environment: Staging
🔗 URL: http://$STAGING_HOST
📊 Status: ✅ Success

📋 Changes:
- Multi-tenant architecture implemented
- Tenant service with caching
- JWT authentication middleware
- Comprehensive test suite
- Automated CI/CD pipeline

🔍 Next Steps:
- Test tenant creation and management
- Verify authentication flow
- Check API endpoints
- Monitor application logs"

echo "$DEPLOYMENT_SUMMARY"

print_success "Deployment completed successfully! 🎉"

echo ""
echo "🌐 Staging URL: http://$STAGING_HOST"
echo "📊 Health Check: http://$STAGING_HOST/api/health"
echo "📚 API Docs: http://$STAGING_HOST/api/docs"
echo ""
echo "🔍 To check logs:"
echo "   ssh $STAGING_USER@$STAGING_HOST"
echo "   cd $STAGING_PATH"
echo "   docker-compose logs -f"
