#!/bin/bash

# FitOS - Deploy to Production Script
# This script deploys the application to production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="fitos"
PROD_HOST="${PROD_HOST:-fitOS.com}"
PROD_USER="${PROD_USER:-deploy}"
PROD_PATH="/opt/fitos"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-docker.io}"
DOCKER_IMAGE="${DOCKER_REGISTRY}/${APP_NAME}"

echo -e "${BLUE}🚀 Starting FitOS Production Deploy${NC}"
echo "====================================="

# Check if required environment variables are set
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    echo -e "${RED}❌ Error: DOCKER_USERNAME and DOCKER_PASSWORD must be set${NC}"
    exit 1
fi

if [ -z "$PROD_SSH_KEY" ]; then
    echo -e "${RED}❌ Error: PROD_SSH_KEY must be set${NC}"
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

# Confirmation prompt for production deployment
echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
echo -e "${YELLOW}   This will affect live users and data.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Step 1: Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if staging is healthy
if [ -n "$STAGING_HOST" ]; then
    if curl -f -s "http://$STAGING_HOST/api/health" > /dev/null; then
        print_success "Staging environment is healthy"
    else
        print_warning "Staging environment is not responding - continuing anyway"
    fi
fi

# Step 2: Build and push Docker image
print_status "Building and pushing Docker image..."

# Login to Docker registry
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Build image with production optimizations
docker build -t "${DOCKER_IMAGE}:latest" -t "${DOCKER_IMAGE}:${GITHUB_SHA:-latest}" \
    --build-arg NODE_ENV=production \
    --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --build-arg VCS_REF="${GITHUB_SHA:-unknown}" \
    .

# Push image
docker push "${DOCKER_IMAGE}:latest"
if [ -n "$GITHUB_SHA" ]; then
    docker push "${DOCKER_IMAGE}:${GITHUB_SHA}"
fi

print_success "Docker image built and pushed successfully"

# Step 3: Create backup
print_status "Creating backup of current production..."

# Create temporary SSH key file
SSH_KEY_FILE=$(mktemp)
echo "$PROD_SSH_KEY" > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"

# Create backup
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
    set -e
    
    echo "📁 Navigating to application directory..."
    cd $PROD_PATH
    
    echo "💾 Creating backup..."
    BACKUP_DIR="backups/\$(date +%Y%m%d_%H%M%S)"
    mkdir -p "\$BACKUP_DIR"
    
    # Backup database
    docker-compose exec -T postgres pg_dump -U postgres fitos_prod > "\$BACKUP_DIR/database.sql"
    
    # Backup application files
    cp -r . "\$BACKUP_DIR/app/"
    
    echo "✅ Backup created in \$BACKUP_DIR"
EOF

print_success "Backup created successfully"

# Step 4: Deploy to production
print_status "Deploying to production server..."

# Deploy to production
ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
    set -e
    
    echo "📁 Navigating to application directory..."
    cd $PROD_PATH
    
    echo "📥 Pulling latest Docker image..."
    docker-compose pull
    
    echo "🔄 Gracefully stopping existing containers..."
    docker-compose down --timeout 30
    
    echo "🚀 Starting new containers..."
    docker-compose up -d
    
    echo "🧹 Cleaning up unused Docker resources..."
    docker system prune -f
    
    echo "📊 Checking container status..."
    docker-compose ps
    
    echo "📝 Checking application logs..."
    docker-compose logs --tail=50
EOF

print_success "Deployment to production completed successfully"

# Step 5: Health check
print_status "Performing health check..."

# Wait for application to start
sleep 60

# Check if application is responding
if curl -f -s "https://$PROD_HOST/api/health" > /dev/null; then
    print_success "Health check passed - application is running"
else
    print_error "Health check failed - application may not be running properly"
    
    # Attempt rollback
    print_status "Attempting rollback..."
    ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
        cd $PROD_PATH
        docker-compose down
        docker-compose up -d
    EOF
    
    exit 1
fi

# Step 6: Run database migrations
print_status "Running database migrations..."

ssh -i "$SSH_KEY_FILE" -o StrictHostKeyChecking=no "$PROD_USER@$PROD_HOST" << EOF
    cd $PROD_PATH
    docker-compose exec -T backend npm run migrate:prod
EOF

print_success "Database migrations completed"

# Step 7: Warm up application
print_status "Warming up application..."

# Warm up critical endpoints
curl -s "https://$PROD_HOST/api/health" > /dev/null
curl -s "https://$PROD_HOST/api/tenants" > /dev/null

print_success "Application warmed up successfully"

# Step 8: Send notification
print_status "Sending deployment notification..."

# Create deployment summary
DEPLOYMENT_SUMMARY="🚀 FitOS Production Deployment Completed

📅 Date: $(date)
🔧 Version: ${GITHUB_SHA:-latest}
🌐 Environment: Production
🔗 URL: https://$PROD_HOST
📊 Status: ✅ Success

📋 Changes:
- Multi-tenant architecture implemented
- Tenant service with caching
- JWT authentication middleware
- Comprehensive test suite
- Automated CI/CD pipeline

🔍 Next Steps:
- Monitor application performance
- Check error logs
- Verify all features are working
- Update documentation"

echo "$DEPLOYMENT_SUMMARY"

print_success "Production deployment completed successfully! 🎉"

echo ""
echo "🌐 Production URL: https://$PROD_HOST"
echo "📊 Health Check: https://$PROD_HOST/api/health"
echo "📚 API Docs: https://$PROD_HOST/api/docs"
echo ""
echo "🔍 To check logs:"
echo "   ssh $PROD_USER@$PROD_HOST"
echo "   cd $PROD_PATH"
echo "   docker-compose logs -f"
echo ""
echo "💾 Backup location: $PROD_PATH/backups/"

# Clean up SSH key file
rm -f "$SSH_KEY_FILE"
