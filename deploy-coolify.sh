#!/bin/bash
# Script para deploy no Coolify via API
# Substitua as variáveis pelos seus valores reais

# Configurações do Coolify
COOLIFY_URL="https://coolify.example.com"
API_TOKEN="YOUR_API_TOKEN"

# Configurações da aplicação
PROJECT_UUID="proj_abc123"
SERVER_UUID="srv_xyz789"
DESTINATION_UUID="dest_123abc"
GIT_REPOSITORY="https://github.com/harrissondutra/fitOS.git"
GIT_BRANCH="main"
APP_NAME="FitOS - Fitness Operating System"

echo "🚀 Iniciando deploy do FitOS no Coolify..."

# Fazer deploy via API
curl -X POST "$COOLIFY_URL/api/v1/applications/dockercompose" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_uuid\": \"$PROJECT_UUID\",
    \"server_uuid\": \"$SERVER_UUID\",
    \"environment_name\": \"production\",
    \"git_repository\": \"$GIT_REPOSITORY\",
    \"git_branch\": \"$GIT_BRANCH\",
    \"destination_uuid\": \"$DESTINATION_UUID\",
    \"docker_compose_location\": \"docker-compose.coolify.yml\",
    \"name\": \"$APP_NAME\",
    \"instant_deploy\": true
  }"

echo ""
echo "✅ Deploy iniciado! Verifique o painel do Coolify para acompanhar o progresso."
echo "📊 Acesse: $COOLIFY_URL"
