#!/bin/bash

# Script para configurar deploy automático no Coolify
# Execute: chmod +x scripts/setup-auto-deploy.sh && ./scripts/setup-auto-deploy.sh

echo "🚀 Configurando Deploy Automático no Coolify"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${2}${1}${NC}"
}

log "📋 Instruções para configurar deploy automático:" "BLUE"
echo ""

log "1️⃣  CONFIGURAR WEBHOOK NO COOLIFY:" "YELLOW"
echo "   • Acesse seu projeto no Coolify"
echo "   • Vá em Settings > Webhooks"
echo "   • Clique em 'Add Webhook'"
echo "   • Configure:"
echo "     - Name: GitHub Deploy"
echo "     - URL: https://api.github.com/repos/harrissondutra/fitOS/hooks"
echo "     - Events: push, pull_request"
echo ""

log "2️⃣  CONFIGURAR WEBHOOK NO GITHUB:" "YELLOW"
echo "   • Vá para: https://github.com/harrissondutra/fitOS/settings/hooks"
echo "   • Clique em 'Add webhook'"
echo "   • Configure:"
echo "     - Payload URL: https://SEU-COOLIFY.com/api/v1/webhooks/github"
echo "     - Content type: application/json"
echo "     - Events: Just the push event"
echo "     - Active: ✅"
echo ""

log "3️⃣  CONFIGURAR SECRETS NO GITHUB (para GitHub Actions):" "YELLOW"
echo "   • Vá para: https://github.com/harrissondutra/fitOS/settings/secrets/actions"
echo "   • Adicione os secrets:"
echo "     - COOLIFY_WEBHOOK_URL: https://SEU-COOLIFY.com/api/v1/applications/SEU_APP_ID/deploy"
echo "     - COOLIFY_TOKEN: seu_token_api_do_coolify"
echo "     - COOLIFY_HEALTH_URL: https://SEU-COOLIFY.com/api/health"
echo "     - COOLIFY_APP_URL: https://SEU-COOLIFY.com"
echo ""

log "4️⃣  OBTER TOKEN DO COOLIFY:" "YELLOW"
echo "   • Acesse seu Coolify"
echo "   • Settings > API Tokens"
echo "   • Create New Token"
echo "   • Copie o token gerado"
echo ""

log "5️⃣  HABILITAR AUTO-DEPLOY NO COOLIFY:" "YELLOW"
echo "   • No seu projeto Coolify"
echo "   • Settings > Git"
echo "   • Habilite 'Auto Deploy'"
echo "   • Configure:"
echo "     - Branch: main"
echo "     - Auto Deploy: ✅"
echo ""

log "✅ Após configurar, cada push na branch main irá fazer deploy automático!" "GREEN"
echo ""

log "🔗 Links úteis:" "BLUE"
echo "   • GitHub Webhooks: https://github.com/harrissondutra/fitOS/settings/hooks"
echo "   • GitHub Secrets: https://github.com/harrissondutra/fitOS/settings/secrets/actions"
echo "   • Coolify API: https://docs.coolify.io/api"
echo ""

log "💡 Dica: Use a Opção 1 (Webhook) para simplicidade ou Opção 2 (GitHub Actions) para mais controle" "BLUE"
