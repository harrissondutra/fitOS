#!/bin/bash
# FitOS - Deploy Script para VPS Oracle
# Este script faz build da imagem e prepara para deploy no Portainer

set -e

# Configurações
IMAGE_NAME="fitos"
IMAGE_TAG="latest"
REGISTRY_URL="${REGISTRY_URL:-your-registry.com}"
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-ubuntu}"

echo "🚀 Iniciando deploy do FitOS..."

# Verificar se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker primeiro."
    exit 1
fi

# Build da imagem
echo "📦 Fazendo build da imagem Docker..."
docker build -f docker/Dockerfile -t ${IMAGE_NAME}:${IMAGE_TAG} .

# Tag para registry (se configurado)
if [ ! -z "$REGISTRY_URL" ]; then
    echo "🏷️ Tagging para registry..."
    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}
fi

# Salvar imagem como tar para transferência
echo "💾 Salvando imagem como arquivo..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${IMAGE_NAME}-${IMAGE_TAG}.tar.gz

# Transferir para VPS (opcional - se não usar registry)
if [ ! -z "$VPS_HOST" ] && [ ! -z "$VPS_USER" ]; then
    echo "📤 Transferindo para VPS..."
    scp ${IMAGE_NAME}-${IMAGE_TAG}.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/
    
    echo "📥 Carregando imagem no VPS..."
    ssh ${VPS_USER}@${VPS_HOST} "docker load < /tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar.gz"
fi

# Criar docker-compose para produção
echo "📝 Criando docker-compose para produção..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  fitos-app:
    image: ${IMAGE_NAME}:${IMAGE_TAG}
    container_name: fitos-app
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: \${DATABASE_URL}
      REDIS_URL: \${REDIS_URL}
      OPENAI_API_KEY: \${OPENAI_API_KEY}
      JWT_SECRET: \${JWT_SECRET}
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    container_name: fitos-postgres
    environment:
      POSTGRES_DB: fitos
      POSTGRES_USER: fitos
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: fitos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF

# Criar arquivo .env de exemplo
echo "📄 Criando arquivo .env de exemplo..."
cat > .env.example << EOF
# Database
DATABASE_URL=postgresql://fitos:password@postgres:5432/fitos
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_URL=redis://redis:6379

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# JWT
JWT_SECRET=your-super-secret-jwt-key

# External APIs
APPLE_HEALTH_API_URL=https://api.apple.com/health
GOOGLE_FIT_API_URL=https://www.googleapis.com/fitness/v1
EOF

echo "✅ Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Copie o arquivo .env.example para .env e configure as variáveis"
echo "2. No Portainer, crie um novo stack com o conteúdo do docker-compose.prod.yml"
echo "3. Configure as variáveis de ambiente no Portainer"
echo "4. Deploy o stack"
echo ""
echo "🌐 Acesse: http://${VPS_HOST:-localhost}:3000"
echo "🔧 API: http://${VPS_HOST:-localhost}:3001"
