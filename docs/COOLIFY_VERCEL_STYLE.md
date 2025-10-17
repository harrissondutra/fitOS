# 🚀 Coolify "Vercel-Style" - Deploy Automático Zero-Config

## 🎯 **Objetivo: Deploy Automático Igual ao Vercel**

Este guia te mostra como configurar o Coolify para funcionar **exatamente como o Vercel** - você conecta o repositório GitHub e pronto!

## 📋 **Passo 1: Criar Aplicação no Coolify**

### **1.1. Acesse o Coolify**
- Vá para seu painel do Coolify
- Clique em **"New Application"**

### **1.2. Selecione "Git Repository"**
- Escolha **"Git Repository"** (não Docker Compose)
- Cole: `https://github.com/harrissondutra/fitOS.git`
- Branch: `main`

### **1.3. Configuração Automática**
- **Build Pack**: `nixpacks` (detecção automática)
- **Port**: `3000` (frontend)
- **Auto Deploy**: ✅ **HABILITADO**

## 🔧 **Passo 2: Configurar Variáveis de Ambiente**

### **2.1. Variáveis Obrigatórias**
```
DATABASE_URL=postgresql://usuario:senha@host:5432/fitos
REDIS_URL=redis://host:6379
JWT_SECRET=sua_chave_secreta_aqui
```

### **2.2. Variáveis Opcionais**
```
OPENAI_API_KEY=sua_chave_openai
ANTHROPIC_API_KEY=sua_chave_anthropic
STRIPE_SECRET_KEY=sua_chave_stripe
DEFAULT_DOMAIN=seu-dominio.com
```

## 🚀 **Passo 3: Deploy Automático**

### **3.1. Push para GitHub**
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

### **3.2. Deploy Automático**
- ✅ Coolify detecta o push
- ✅ Inicia build automaticamente
- ✅ Deploy em produção
- ✅ Health check automático
- ✅ URL disponível instantaneamente

## 🌐 **Passo 4: Configurar Domínio (Opcional)**

### **4.1. Adicionar Domínio**
- Vá em **Settings > Domains**
- Adicione: `fitos.com`
- Coolify configura SSL automaticamente

### **4.2. DNS**
- Aponte seu domínio para o IP do Coolify
- SSL é configurado automaticamente

## 📊 **Monitoramento Automático**

### **4.1. Health Checks**
- **Endpoint**: `/api/health`
- **Intervalo**: 30s
- **Timeout**: 10s
- **Retry**: 3 tentativas

### **4.2. Logs em Tempo Real**
- Acesse a aba **"Logs"**
- Logs de build e runtime
- Filtros por tipo de log

### **4.3. Métricas**
- CPU e Memória
- Requisições por segundo
- Tempo de resposta
- Uptime

## 🔄 **Deploy de Preview (Igual Vercel)**

### **5.1. Branches de Preview**
- `develop` → Preview automático
- `staging` → Preview automático
- `feature/nova-funcionalidade` → Preview automático

### **5.2. URLs de Preview**
- `develop.fitOS.com`
- `staging.fitOS.com`
- `feature-nova-funcionalidade.fitOS.com`

## 🛠️ **Configurações Avançadas (Opcional)**

### **6.1. Build Hooks**
```bash
# Deploy manual via webhook
curl -X POST "https://coolify.com/api/v1/applications/APP_ID/deploy" \
  -H "Authorization: Bearer TOKEN"
```

### **6.2. Rollback Automático**
- Se health check falhar
- Rollback automático para versão anterior
- Notificação via email/Slack

### **6.3. Escalabilidade Automática**
- CPU > 80% → Escala horizontal
- CPU < 20% → Escala para baixo
- Configuração automática

## 🎉 **Resultado Final**

### **✅ O que você ganha:**
- **Deploy automático** a cada push
- **Zero configuração** de infraestrutura
- **SSL automático** para domínios
- **Health checks** automáticos
- **Rollback** automático se falhar
- **Logs** em tempo real
- **Métricas** de performance
- **Preview** de branches
- **Escalabilidade** automática

### **🚀 Igual ao Vercel:**
1. Conecta repositório GitHub
2. Configura variáveis de ambiente
3. Push = Deploy automático
4. Zero preocupação com infraestrutura

## 🔗 **Links Úteis**

- **Coolify Dashboard**: `https://seu-coolify.com`
- **GitHub Repository**: `https://github.com/harrissondutra/fitOS`
- **Documentação**: `https://docs.coolify.io`
- **Status Page**: `https://status.coolify.io`

## 💡 **Dicas Importantes**

1. **Use Nixpacks** para detecção automática
2. **Habilite Auto Deploy** sempre
3. **Configure health checks** adequadamente
4. **Monitore logs** regularmente
5. **Use preview branches** para testes

---

**🎯 Agora você tem deploy automático igual ao Vercel!** 🚀
