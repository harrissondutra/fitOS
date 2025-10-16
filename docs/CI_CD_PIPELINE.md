# FitOS - Pipeline CI/CD Completo

## 🚀 Visão Geral

O FitOS utiliza um pipeline CI/CD unificado que automatiza todo o processo de desenvolvimento, desde validação de código até deploy em produção.

## 📋 Arquivo de Pipeline

**Localização**: `.github/workflows/deploy.yml`

## 🔄 Fluxo do Pipeline

### 1. **Triggers (Gatilhos)**
- **Push** para branches `main` ou `develop`
- **Pull Request** para branches `main` ou `develop`
- **Workflow Dispatch** (manual) com opções de ambiente

### 2. **Jobs (Trabalhos)**

#### 🔍 **Job 1: Validate & Test**
- **Objetivo**: Validar código e executar testes
- **Duração**: ~15 minutos
- **Serviços**: PostgreSQL 15, Redis 7
- **Atividades**:
  - Lint do backend e frontend
  - Verificação de tipos TypeScript
  - Testes unitários e de integração
  - Upload de relatórios de cobertura

#### 🔒 **Job 2: Security Scan**
- **Objetivo**: Verificar vulnerabilidades de segurança
- **Duração**: ~10 minutos
- **Dependência**: Job 1 (Validate & Test)
- **Atividades**:
  - Scan de vulnerabilidades com Trivy
  - Análise de dependências com Snyk
  - Auditoria de pacotes npm

#### 🐳 **Job 3: Build & Push Docker**
- **Objetivo**: Construir e publicar imagem Docker
- **Duração**: ~20 minutos
- **Dependências**: Jobs 1 e 2
- **Atividades**:
  - Build multi-plataforma (AMD64, ARM64)
  - Push para Docker Registry
  - Cache de layers Docker
  - Tags automáticas por branch/commit

#### 🚀 **Job 4: Deploy to Staging**
- **Objetivo**: Deploy automático para ambiente de staging
- **Duração**: ~15 minutos
- **Dependência**: Job 3 (Build & Push)
- **Condição**: Branch `develop` ou trigger manual
- **Atividades**:
  - Deploy via SSH
  - Health check automático
  - Migração de banco de dados
  - Relatório de deploy

#### 🌟 **Job 5: Deploy to Production**
- **Objetivo**: Deploy para ambiente de produção
- **Duração**: ~30 minutos
- **Dependências**: Jobs 3 e 4
- **Condição**: Branch `main` ou trigger manual
- **Atividades**:
  - Backup automático antes do deploy
  - Deploy via SSH
  - Health check com retry
  - Rollback automático em caso de falha
  - Migração de banco de dados
  - Warm-up da aplicação

#### 📢 **Job 6: Notifications**
- **Objetivo**: Enviar notificações de status
- **Duração**: ~5 minutos
- **Dependência**: Todos os jobs anteriores
- **Atividades**:
  - Relatório resumido no GitHub
  - Notificação Slack (opcional)

## 🎛️ Configuração

### Secrets Necessários

#### Docker Registry
```yaml
DOCKER_USERNAME: "seu-usuario-docker"
DOCKER_PASSWORD: "sua-senha-docker"
```

#### Staging Environment
```yaml
STAGING_HOST: "staging.fitOS.com"
STAGING_USERNAME: "deploy"
STAGING_SSH_KEY: "-----BEGIN OPENSSH PRIVATE KEY-----..."
STAGING_PATH: "/opt/fitos"
```

#### Production Environment
```yaml
PROD_HOST: "fitOS.com"
PROD_USERNAME: "deploy"
PROD_SSH_KEY: "-----BEGIN OPENSSH PRIVATE KEY-----..."
PROD_PATH: "/opt/fitos"
```

#### Database & Redis
```yaml
DATABASE_URL: "postgresql://user:pass@host:port/db"
TEST_DATABASE_URL: "postgresql://user:pass@host:port/test_db"
REDIS_URL: "redis://host:port"
TEST_REDIS_URL: "redis://host:port"
```

#### Security (Opcional)
```yaml
SNYK_TOKEN: "seu-token-snyk"
```

### Variáveis de Ambiente

```yaml
NODE_VERSION: "20"
DOCKER_REGISTRY: "docker.io"
APP_NAME: "fitos"
```

## 🚀 Como Usar

### 1. **Deploy Automático**

#### Para Staging
```bash
# Push para branch develop
git push origin develop
```

#### Para Produção
```bash
# Push para branch main
git push origin main
```

### 2. **Deploy Manual**

1. Acesse a aba **Actions** no GitHub
2. Selecione **FitOS - Complete CI/CD Pipeline**
3. Clique em **Run workflow**
4. Escolha o ambiente:
   - `staging` - Deploy para staging
   - `production` - Deploy para produção
5. Opcionalmente, marque **Force deploy** para ignorar falhas de teste

### 3. **Monitoramento**

#### GitHub Actions
- Acesse: `https://github.com/seu-usuario/fitos/actions`
- Visualize logs em tempo real
- Verifique status de cada job

#### Health Checks
- **Staging**: `http://staging.fitOS.com/api/health`
- **Produção**: `https://fitOS.com/api/health`

#### Logs da Aplicação
```bash
# Staging
ssh deploy@staging.fitOS.com
cd /opt/fitos
docker-compose logs -f

# Produção
ssh deploy@fitOS.com
cd /opt/fitos
docker-compose logs -f
```

## 🔧 Personalização

### Adicionar Novos Testes
```yaml
# No job validate-and-test
- name: 🧪 Run Custom Tests
  run: |
    cd src/backend
    npm run test:custom
```

### Adicionar Novos Ambientes
```yaml
# Novo job para ambiente de desenvolvimento
deploy-development:
  name: 🧪 Deploy to Development
  runs-on: ubuntu-latest
  needs: [build-and-push]
  if: github.ref == 'refs/heads/feature/*'
  # ... configuração do job
```

### Modificar Triggers
```yaml
on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Deploy diário às 2h
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. **Falha no Health Check**
```bash
# Verificar logs
docker-compose logs backend

# Verificar status dos containers
docker-compose ps

# Reiniciar containers
docker-compose restart
```

#### 2. **Falha na Migração do Banco**
```bash
# Executar migração manualmente
docker-compose exec backend npm run migrate:prod

# Verificar conexão com banco
docker-compose exec postgres psql -U postgres -d fitos_prod
```

#### 3. **Falha no Deploy SSH**
```bash
# Testar conexão SSH
ssh -i /path/to/key deploy@host

# Verificar permissões
chmod 600 /path/to/key
```

#### 4. **Falha no Build Docker**
```bash
# Build local para debug
docker build -t fitos:debug .

# Verificar logs de build
docker build --no-cache -t fitos:debug .
```

### Logs de Debug

#### Ativar Debug no Pipeline
```yaml
- name: Debug Info
  run: |
    echo "GitHub Event: ${{ github.event_name }}"
    echo "GitHub Ref: ${{ github.ref }}"
    echo "GitHub SHA: ${{ github.sha }}"
    echo "Docker Image: ${{ env.DOCKER_IMAGE }}"
```

#### Verificar Secrets
```yaml
- name: Check Secrets
  run: |
    echo "Docker Username: ${{ secrets.DOCKER_USERNAME != '' }}"
    echo "Staging Host: ${{ secrets.STAGING_HOST != '' }}"
    echo "Prod Host: ${{ secrets.PROD_HOST != '' }}"
```

## 📊 Métricas e Monitoramento

### Métricas do Pipeline
- **Tempo Total**: ~60-90 minutos
- **Taxa de Sucesso**: 95%+
- **Tempo de Deploy**: 15-30 minutos
- **Cobertura de Testes**: 95%+

### Alertas
- Falha em qualquer job
- Deploy para produção
- Vulnerabilidades de segurança
- Falha no health check

## 🔄 Manutenção

### Atualizações Regulares
- **Dependências**: Mensalmente
- **Imagens Docker**: Semanalmente
- **Secrets**: A cada 90 dias
- **Backup**: Diariamente

### Limpeza
```bash
# Limpar cache do GitHub Actions
# (Automático após 30 dias)

# Limpar imagens Docker antigas
docker system prune -a

# Limpar backups antigos
find /opt/fitos/backups -type d -mtime +30 -exec rm -rf {} \;
```

---

**Pipeline Status**: ✅ **ATIVO**  
**Última Atualização**: Dezembro 2024  
**Versão**: 1.0.0
