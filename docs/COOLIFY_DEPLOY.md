# 🚀 Deploy no Coolify - FitOS

Este guia explica como fazer deploy da aplicação FitOS no Coolify.

## 📋 Pré-requisitos

- Conta no Coolify
- Servidor com Docker instalado
- Repositório público no GitHub (já configurado)

## 🔧 Configuração do Coolify

### 1. Criar Nova Aplicação

1. Acesse seu painel do Coolify
2. Clique em "New Application"
3. Selecione "Docker Compose"
4. Configure:
   - **Repository**: `https://github.com/harrissondutra/fitOS.git`
   - **Branch**: `main`
   - **Docker Compose File**: `docker-compose.coolify.yml`
   - **Dockerfile**: `Dockerfile.coolify`

### 2. Configurar Variáveis de Ambiente

Configure as seguintes variáveis no Coolify:

#### Obrigatórias:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key-here
```

#### Opcionais:
```bash
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
DEFAULT_DOMAIN=fitos.com
```

### 3. Configurar Banco de Dados

O Coolify pode provisionar automaticamente:
- PostgreSQL
- Redis

Ou você pode usar bancos externos.

### 4. Configurar Domínio

1. Adicione seu domínio no Coolify
2. Configure DNS apontando para o servidor
3. O Coolify irá configurar SSL automaticamente

## 🚀 Deploy

### **Opção 1: Webhook do GitHub (Recomendado)**

#### **1.1. Configurar Webhook no Coolify**

1. **Acesse seu projeto no Coolify**
2. **Vá em Settings > Webhooks**
3. **Clique em "Add Webhook"**
4. **Configure:**
   - **Name**: `GitHub Deploy`
   - **URL**: `https://api.github.com/repos/harrissondutra/fitOS/hooks`
   - **Events**: `push`, `pull_request`
   - **Secret**: (opcional, mas recomendado)

#### **1.2. Configurar Webhook no GitHub**

1. **Vá para**: `https://github.com/harrissondutra/fitOS/settings/hooks`
2. **Clique em "Add webhook"**
3. **Configure:**
   - **Payload URL**: `https://SEU-COOLIFY.com/api/v1/webhooks/github`
   - **Content type**: `application/json`
   - **Events**: `Just the push event`
   - **Active**: ✅

### **Opção 2: GitHub Actions (Mais Controle)**

#### **2.1. Configurar Secrets no GitHub**

1. **Vá para**: `https://github.com/harrissondutra/fitOS/settings/secrets/actions`
2. **Adicione os secrets:**
   - `COOLIFY_WEBHOOK_URL`: `https://SEU-COOLIFY.com/api/v1/applications/SEU_APP_ID/deploy`
   - `COOLIFY_TOKEN`: `seu_token_api_do_coolify`

#### **2.2. Obter Token do Coolify**

1. **Acesse seu Coolify**
2. **Settings > API Tokens**
3. **Create New Token**
4. **Copie o token gerado**

#### **2.3. Workflow do GitHub Actions**

O arquivo `.github/workflows/coolify-deploy.yml` já está configurado:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Deploy to Coolify
      run: |
        curl --request GET "${COOLIFY_WEBHOOK_URL}" \
             --header "Authorization: Bearer ${COOLIFY_TOKEN}" \
             --header "Content-Type: application/json"
             
    env:
      COOLIFY_WEBHOOK_URL: ${{ secrets.COOLIFY_WEBHOOK_URL }}
      COOLIFY_TOKEN: ${{ secrets.COOLIFY_TOKEN }}
```

### **Opção 3: Auto-Deploy no Coolify**

#### **3.1. Habilitar Auto-Deploy**

1. **No seu projeto Coolify**
2. **Settings > Git**
3. **Habilite "Auto Deploy"**
4. **Configure:**
   - **Branch**: `main`
   - **Auto Deploy**: ✅
   - **Deploy on PR**: ✅ (opcional)

### **Script de Configuração**

Execute o script para ver as instruções detalhadas:

```bash
./scripts/setup-auto-deploy.sh
```

### Deploy Manual
1. Acesse a aplicação no Coolify
2. Clique em "Deploy"
3. Aguarde o build e deploy

## 📊 Monitoramento

### Health Check
- **Endpoint**: `/api/health`
- **Porta**: 3001
- **Timeout**: 10s

### Logs
- Acesse a aba "Logs" no Coolify
- Logs em tempo real disponíveis

### Métricas
- CPU e Memória
- Requisições por segundo
- Tempo de resposta

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Build Falha
```bash
# Verificar logs de build
# Verificar se todas as dependências estão corretas
# Verificar se o Dockerfile está correto
```

#### 2. Aplicação Não Inicia
```bash
# Verificar variáveis de ambiente
# Verificar se o banco de dados está acessível
# Verificar logs da aplicação
```

#### 3. Health Check Falha
```bash
# Verificar se a aplicação está rodando na porta 3001
# Verificar se o endpoint /api/health está funcionando
# Verificar logs para erros
```

### Comandos Úteis

#### Verificar Status
```bash
docker ps
docker logs fitos-app
```

#### Acessar Container
```bash
docker exec -it fitos-app sh
```

#### Verificar Logs
```bash
docker logs -f fitos-app
```

## 📈 Otimizações

### Performance
- Configure recursos adequados (CPU/Memória)
- Use cache Redis para sessões
- Configure CDN para assets estáticos

### Segurança
- Use HTTPS (configurado automaticamente pelo Coolify)
- Configure rate limiting
- Use secrets para variáveis sensíveis

### Backup
- Configure backup automático do banco
- Configure backup dos uploads
- Teste restauração regularmente

## 🔄 Atualizações

### Deploy de Atualizações
1. Faça push para o repositório
2. O Coolify fará deploy automático
3. Monitore os logs durante o deploy

### Rollback
1. Acesse a aplicação no Coolify
2. Vá para "Deployments"
3. Selecione uma versão anterior
4. Clique em "Redeploy"

## 📞 Suporte

- **Documentação Coolify**: https://coolify.io/docs
- **Issues GitHub**: https://github.com/harrissondutra/fitOS/issues
- **Discord FitOS**: https://discord.gg/fitos

---

**Nota**: Este guia assume que você já tem o Coolify configurado e funcionando. Para instalação do Coolify, consulte a documentação oficial.
