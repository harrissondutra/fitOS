#!/bin/bash
# FitOS - Automated Deploy Script
# Este script é executado pelo GitHub Actions

set -e

# Configurações
APP_NAME="fitos"
DEPLOY_DIR="/opt/fitos"
BACKUP_DIR="/opt/fitos/backups"
LOG_FILE="/var/log/fitos-deploy.log"

echo "🚀 Iniciando deploy automático do FitOS..." | tee -a $LOG_FILE

# Função para logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Função para rollback
rollback() {
    log "❌ Deploy falhou, iniciando rollback..."
    
    # Parar containers atuais
    cd $DEPLOY_DIR
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurar imagem anterior
    if [ -f "$BACKUP_DIR/last-image" ]; then
        LAST_IMAGE=$(cat $BACKUP_DIR/last-image)
        log "🔄 Restaurando imagem: $LAST_IMAGE"
        docker tag $LAST_IMAGE fitos:production-latest
    fi
    
    # Restaurar .env anterior
    if [ -f "$BACKUP_DIR/.env.backup" ]; then
        cp $BACKUP_DIR/.env.backup $DEPLOY_DIR/.env.production
        log "🔄 Restaurando configurações anteriores"
    fi
    
    # Iniciar com imagem anterior
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Rollback concluído"
    exit 1
}

# Capturar erro para rollback
trap rollback ERR

# Criar diretórios se não existirem
mkdir -p $BACKUP_DIR
mkdir -p $DEPLOY_DIR

# Backup da imagem atual
log "💾 Fazendo backup da imagem atual..."
cd $DEPLOY_DIR
if docker images | grep -q "fitos:production-latest"; then
    BACKUP_TAG="fitos:backup-$(date +%Y%m%d-%H%M%S)"
    docker tag fitos:production-latest $BACKUP_TAG
    echo $BACKUP_TAG > $BACKUP_DIR/last-image
    log "✅ Backup criado: $BACKUP_TAG"
fi

# Backup do .env atual
if [ -f ".env.production" ]; then
    cp .env.production $BACKUP_DIR/.env.backup
    log "✅ Backup do .env criado"
fi

# Parar containers atuais
log "🛑 Parando containers atuais..."
docker-compose -f docker-compose.prod.yml down

# Pull da nova imagem
log "📥 Baixando nova imagem..."
docker pull fitos:production-latest

# Atualizar variáveis de ambiente
log "⚙️ Atualizando configurações..."
if [ ! -z "$APP_VERSION" ]; then
    echo "APP_VERSION=$APP_VERSION" >> .env.production
fi
if [ ! -z "$DEPLOY_DATE" ]; then
    echo "DEPLOY_DATE=$DEPLOY_DATE" >> .env.production
fi

# Executar migrações de banco (se necessário)
log "🗄️ Executando migrações de banco..."
if [ -f "migrations/pending.sql" ]; then
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 10
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U fitos -d fitos -f /docker-entrypoint-initdb.d/pending.sql
    log "✅ Migrações executadas"
fi

# Iniciar novos containers
log "🚀 Iniciando novos containers..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem prontos
log "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Health check
log "🏥 Executando health check..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log "✅ Health check passou"
        break
    fi
    if [ $i -eq 10 ]; then
        log "❌ Health check falhou após 10 tentativas"
        rollback
    fi
    log "⏳ Tentativa $i/10 - aguardando..."
    sleep 10
done

# Limpeza de imagens antigas
log "🧹 Limpando imagens antigas..."
docker image prune -f
docker system prune -f

# Notificar sucesso
log "✅ Deploy concluído com sucesso!"
log "🌐 Aplicação disponível em: http://localhost:3000"
log "🔧 API disponível em: http://localhost:3001"

# Enviar notificação de sucesso (opcional)
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ FitOS deploy concluído com sucesso! Versão: $APP_VERSION\"}" \
        $SLACK_WEBHOOK
fi

echo "🎉 Deploy automático finalizado com sucesso!"
