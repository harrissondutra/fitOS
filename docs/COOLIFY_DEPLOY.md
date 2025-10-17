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

### Deploy Automático
- Push para `main` = Deploy automático
- Push para outras branches = Deploy de preview

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
