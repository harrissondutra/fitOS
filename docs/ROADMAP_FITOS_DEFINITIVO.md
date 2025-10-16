# FitOS - Roadmap Definitivo de Implementação
## Fitness Operating System - SaaS Multi-Tenant

**Versão**: 2.0  
**Data**: Dezembro 2024  
**Status**: Pronto para Implementação  

---

## 📋 **RESUMO EXECUTIVO**

### **Conceito Central**
Um ecossistema completo que une gestão de academias + personal trainers + nutricionistas + nutrólogos + alunos em uma plataforma viva alimentada por IA, que não só gerencia, mas potencializa resultados através de inteligência contextual integrada para saúde e fitness.

### **Objetivo**
Desenvolver um SaaS completo de gestão de academias com IA integrada, deploy automatizado e arquitetura multi-tenant.

### **Diferenciais Únicos**
1. **IA Conversacional Multiagente** (Coach, Nutrition, Business)
2. **Integração com Wearables** (Apple Health, Google Fit)
3. **Dashboard Preditivo** (Churn, Receita, Otimização)
4. **Multi-Tenancy Completo** (Isolamento por academia)
5. **Deploy Automatizado** (CI/CD com GitHub Actions)
6. **PWA Offline-First** (Funciona sem internet)
7. **Ecossistema Integrado** (Fitness + Nutrição + Saúde)
8. **Marketplace de Profissionais** (Personal Trainers + Nutricionistas)
9. **Análise de Saúde Integrada** (Dados biométricos + alimentação + treino)
10. **Agendamento Unificado** (Consultas + Treinos em uma agenda)
11. **Análise de Bioimpedância com IA** (Composição corporal + CRUD profissional)
12. **Integração com Equipamentos** (Balanças inteligentes + analisadores corporais)
13. **Sistema de Agendamento Completo** (CRUD + Google Agenda + Histórico + Relatórios)
14. **Dashboard Profissional Avançado** (Agenda visual + Estatísticas + Exportação)
15. **Gamificação Social Brasileira** (Desafios culturais + Leaderboards regionais)
16. **Integração Cultural Nacional** (Festivais + Música brasileira + Regionalismo)
17. **Telemedicina Integrada** (Consultas online + Dados de saúde unificados)
18. **E-commerce de Suplementos** (Loja integrada + Recomendações personalizadas)
19. **Realidade Aumentada** (Guia AR para exercícios + Correção de postura)
20. **IA para Prevenção de Lesões** (Análise de movimento + Alertas preditivos)
21. **Sustentabilidade ESG** (Impacto ambiental + Desafios verdes)
22. **Integração Spotify** (Playlists automáticas + Música brasileira)
23. **Análise de Sentimento** (Detecção de desmotivação + Intervenção proativa)
24. **Blockchain para Certificações** (Certificados digitais + Histórico imutável)
25. **CRM Integrado para Profissionais** (Pipeline + Automação + Analytics)
26. **Automação de Follow-ups** (Campanhas inteligentes + Lembretes automáticos)
27. **Pagamentos Dual Gateway** (Stripe para recorrentes + Mercado Pago para PIX)
29. **Infraestrutura 100% Self-hosted** (Docker + VPS + Zero custos operacionais)
30. **IA Local com Ollama** (Substitui OpenAI/Claude + Economia de $100/mês)

### **Investimento Total**
- **Ciclo 1**: R$ 1.200.000 (24 semanas)
- **Custos Operacionais**: R$ 0/mês (self-hosted)
- **Break-even**: Mês 12-15
- **Receita Projetada**: R$ 500k/mês no ano 3

---

## 🔌 **APIS E SERVIÇOS EXTERNOS**

### **📊 Resumo de Custos (Desenvolvedor Solo)**

| Categoria | Serviço | Custo Mensal | Alternativa Gratuita |
|-----------|---------|--------------|---------------------|
| **IA** | OpenAI GPT-4 | $20-100 | Ollama (local) |
| **IA** | Anthropic Claude | $20-50 | Ollama (local) |
| **Pagamentos** | Stripe | 2.9% + $0.30 | - |
| **Pagamentos** | Mercado Pago | 2.99% | - |
| **Banco** | PostgreSQL | $0-25 | Supabase (free tier) |
| **Cache** | Redis | $0-15 | Upstash (free tier) |
| **Vector DB** | Pinecone | $70+ | Chroma (local) |
| **Monitoramento** | Sentry | $26+ | Self-hosted |
| **APM** | DataDog | $15+ | Self-hosted |
| **Cloud** | AWS | $50-200 | Oracle Cloud (free) |
| **Email** | SendGrid | $15+ | Resend (free tier) |
| **Storage** | AWS S3 | $5-20 | Cloudflare R2 (free) |

**Total Estimado**: $200-500/mês → **$0-50/mês** (com alternativas)

---

### **🤖 INTELIGÊNCIA ARTIFICIAL**

#### **1. OpenAI GPT-4**
```typescript
// Configuração
OPENAI_API_KEY=sk-your-openai-api-key

// Uso
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }]
});
```

**Custos:**
- GPT-4: $0.03/1K tokens (input), $0.06/1K tokens (output)
- GPT-3.5: $0.001/1K tokens (input), $0.002/1K tokens (output)

**Alternativa Gratuita:**
```bash
# Ollama (local)
npm install ollama
ollama run llama2
ollama run codellama
```

#### **2. Anthropic Claude**
```typescript
// Configuração
ANTHROPIC_API_KEY=your-anthropic-api-key

// Uso
const response = await anthropic.messages.create({
  model: "claude-3-sonnet-20240229",
  messages: [{ role: "user", content: prompt }]
});
```

**Custos:**
- Claude 3 Sonnet: $0.003/1K tokens (input), $0.015/1K tokens (output)

**Alternativa Gratuita:**
```bash
# Ollama com Claude
ollama run claude
```

#### **3. Vector Database (Pinecone)**
```typescript
// Configuração
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-environment

// Uso
const index = pinecone.Index('fitos-knowledge');
await index.upsert([{ id: '1', values: embedding }]);
```

**Custos:**
- Starter: $70/mês (100K vectors)
- Standard: $200/mês (1M vectors)

**Alternativa Gratuita:**
```bash
# Chroma (local)
npm install chromadb
# ou
# Weaviate (self-hosted)
npm install weaviate-ts-client
```

---

### **💳 PAGAMENTOS**

#### **1. Stripe (Assinaturas Recorrentes)**
```typescript
// Configuração
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

// Uso
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }]
});
```

**Custos:**
- 2.9% + $0.30 por transação
- Sem taxa mensal

#### **2. Mercado Pago (PIX + Pagamentos BR)**
```typescript
// Configuração
MERCADOPAGO_ACCESS_TOKEN=APP_USR_your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR_your-public-key

// Uso
const preference = await mercadopago.preferences.create({
  items: [{ title: 'Plano', unit_price: 99 }]
});
```

**Custos:**
- PIX: 2.99%
- Cartão: 3.99%
- Boleto: 3.99%

---

### **📱 WEARABLES E SAÚDE**

#### **1. Apple HealthKit**
```typescript
// iOS App (React Native)
import { HealthKit } from 'react-native-health';

const healthKit = new HealthKit();
await healthKit.requestPermissions(['steps', 'heartRate']);
const steps = await healthKit.getSteps();
```

**Custos:** Gratuito (requer iOS App)

#### **2. Google Fit API**
```typescript
// Configuração
GOOGLE_FIT_CLIENT_ID=your-client-id
GOOGLE_FIT_CLIENT_SECRET=your-client-secret

// Uso
const fit = google.fitness('v1');
const data = await fit.users.dataSources.list({
  userId: 'me'
});
```

**Custos:** Gratuito (com limites)

---

### **📅 AGENDAMENTO**

#### **1. Google Calendar API**
```typescript
// Configuração
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret

// Uso
const calendar = google.calendar('v3');
const event = await calendar.events.insert({
  calendarId: 'primary',
  resource: eventData
});
```

**Custos:** Gratuito (com limites)

---

### **🎵 MÚSICA E ENTRETENIMENTO**

#### **1. Spotify Web API**
```typescript
// Configuração
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

// Uso
const spotify = new SpotifyWebApi();
spotify.setAccessToken(accessToken);
const playlists = await spotify.getUserPlaylists();
```

**Custos:** Gratuito (com limites)

---

### **☁️ INFRAESTRUTURA**

#### **1. Banco de Dados**
```typescript
// PostgreSQL (Supabase - Gratuito)
DATABASE_URL=postgresql://user:pass@host:5432/db

// Alternativas gratuitas:
// - Supabase: 500MB, 2 projetos
// - PlanetScale: 1GB, 1 branch
// - Neon: 3GB, 1 projeto
```

#### **2. Cache Redis**
```typescript
// Upstash Redis (Gratuito)
REDIS_URL=redis://user:pass@host:6379

// Alternativas gratuitas:
// - Upstash: 10K requests/dia
// - Redis Cloud: 30MB
```

#### **3. Storage**
```typescript
// Cloudflare R2 (Gratuito)
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key

// Alternativas gratuitas:
// - Cloudflare R2: 10GB/mês
// - AWS S3: 5GB/mês (1 ano)
```

---

### **📧 COMUNICAÇÃO**

#### **1. Email (Resend)**
```typescript
// Configuração
RESEND_API_KEY=re_your-api-key

// Uso
await resend.emails.send({
  from: 'noreply@fitos.com.br',
  to: 'user@example.com',
  subject: 'Bem-vindo ao FitOS',
  html: '<h1>Olá!</h1>'
});
```

**Custos:** Gratuito (3K emails/mês)

#### **2. SMS (Twilio)**
```typescript
// Configuração
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

// Uso
await twilio.messages.create({
  body: 'Seu código de verificação: 123456',
  from: '+1234567890',
  to: '+0987654321'
});
```

**Custos:** $0.0075/SMS

---

### **📊 MONITORAMENTO**

#### **1. Sentry (Self-hosted)**
```typescript
// Configuração
SENTRY_DSN=your-sentry-dsn

// Uso
Sentry.captureException(error);
Sentry.captureMessage('User logged in');
```

**Alternativa Gratuita:**
```bash
# Self-hosted Sentry
docker run -d --name sentry sentry/sentry
```

#### **2. APM (Self-hosted)**
```typescript
// OpenTelemetry (Gratuito)
import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({
  serviceName: 'fitos-backend'
});
```

---

### **🔧 CONFIGURAÇÃO COMPLETA (.env) - SELF-HOSTED**

```bash
# IA Local (Self-hosted)
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_BASE_URL=http://localhost:8000

# Banco de Dados (Externo)
DATABASE_URL=postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db
REDIS_URL=redis://localhost:6379

# Storage (Self-hosted)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}

# Pagamentos (APIs Externas)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
MERCADOPAGO_ACCESS_TOKEN=APP_USR_your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR_your-public-key

# APIs Externas (Gratuitas)
GOOGLE_FIT_CLIENT_ID=your-client-id
GOOGLE_FIT_CLIENT_SECRET=your-client-secret
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret

# Monitoramento (Self-hosted)
SENTRY_DSN=http://localhost:9000
GRAFANA_URL=http://localhost:3001
PROMETHEUS_URL=http://localhost:9090
JAEGER_URL=http://localhost:16686

# Email (Self-hosted)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=noreply@fitos.com.br
SMTP_PASS=your-smtp-password

# App Config
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
```

---

### **💰 ESTRATÉGIA DE CUSTOS - SELF-HOSTED**

#### **Fase 1: MVP (0-3 meses) - $0/mês**
- ✅ Ollama (IA local)
- ✅ PostgreSQL (self-hosted)
- ✅ Redis (self-hosted)
- ✅ MinIO (storage local)
- ✅ Sentry (self-hosted)
- ✅ Grafana + Prometheus (self-hosted)

#### **Fase 2: Crescimento (3-6 meses) - $0/mês**
- ✅ Todos os serviços self-hosted
- ✅ Stripe + Mercado Pago (apenas taxas)
- ✅ APIs externas gratuitas

#### **Fase 3: Escala (6+ meses) - $0/mês**
- ✅ Infraestrutura completamente self-hosted
- ✅ Sem custos operacionais
- ✅ Economia de $296/mês vs SaaS

---

### **🚀 COMANDOS DE SETUP - SELF-HOSTED**

```bash
# 1. Instalar dependências
npm install ollama chromadb stripe mercadopago

# 2. Configurar Docker Compose
cp docker-compose.yml.example docker-compose.yml
cp .env.example .env
# Editar .env com suas configurações

# 3. Subir todos os serviços self-hosted
docker-compose up -d

# 4. Instalar modelos Ollama
docker exec -it ollama ollama pull llama2
docker exec -it ollama ollama pull codellama
docker exec -it ollama ollama pull mistral

# 5. Configurar banco de dados
# O banco PostgreSQL já está configurado externamente
# DATABASE_URL=postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db
npm run migrate:dev
npm run seed:dev

# 6. Verificar status dos serviços
docker-compose ps

# 7. Acessar interfaces
# Grafana: http://localhost:3001 (admin/senha)
# MinIO: http://localhost:9001 (minioadmin/senha)
# Jaeger: http://localhost:16686
# Chroma: http://localhost:8000
# Ollama: http://localhost:11434
```

---

### **📚 DOCUMENTAÇÃO DAS APIS - SELF-HOSTED**

- [Ollama](https://ollama.ai/docs) - IA Local
- [Chroma](https://docs.trychroma.com/) - Vector Database Local
- [Stripe API](https://stripe.com/docs/api) - Pagamentos Recorrentes
- [Mercado Pago API](https://www.mercadopago.com.br/developers/pt/docs) - PIX + Pagamentos BR
- [Google Fit API](https://developers.google.com/fit) - Wearables
- [Google Calendar API](https://developers.google.com/calendar) - Agendamento
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) - Música
- [PostgreSQL](https://www.postgresql.org/docs/) - Banco de Dados
- [Redis](https://redis.io/docs/) - Cache
- [MinIO](https://docs.min.io/) - Storage S3-compatible
- [Grafana](https://grafana.com/docs/) - Monitoramento
- [Prometheus](https://prometheus.io/docs/) - Métricas
- [Sentry](https://docs.sentry.io/) - Error Tracking
- [Docker](https://docs.docker.com/) - Containerização

---

## 🐳 **SELF-HOSTING VIA DOCKER (VPS)**

### **💰 Economia Total: $300-800/mês → $0/mês**

| Serviço | Custo SaaS | Custo Self-hosted | Economia |
|---------|------------|-------------------|----------|
| OpenAI GPT-4 | $100/mês | $0 (Ollama) | $100 |
| Pinecone | $70/mês | $0 (Chroma) | $70 |
| Sentry | $26/mês | $0 (Self-hosted) | $26 |
| DataDog | $15/mês | $0 (Grafana) | $15 |
| AWS RDS | $50/mês | $0 (PostgreSQL) | $50 |
| AWS S3 | $20/mês | $0 (MinIO) | $20 |
| SendGrid | $15/mês | $0 (Mailcow) | $15 |
| **TOTAL** | **$296/mês** | **$0/mês** | **$296/mês** |

---

### **🤖 INTELIGÊNCIA ARTIFICIAL (Self-hosted)**

#### **1. Ollama (Substitui OpenAI/Claude)**
```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    restart: unless-stopped

volumes:
  ollama_data:
```

```bash
# Setup
docker-compose up -d ollama

# Instalar modelos
docker exec -it ollama ollama pull llama2
docker exec -it ollama ollama pull codellama
docker exec -it ollama ollama pull mistral
```

**Uso:**
```typescript
// Configuração
OLLAMA_BASE_URL=http://localhost:11434

// Uso
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama2',
    prompt: 'Crie um treino para iniciante',
    stream: false
  })
});
```

#### **2. Chroma (Substitui Pinecone)**
```yaml
# docker-compose.yml
services:
  chroma:
    image: chromadb/chroma:latest
    container_name: chroma
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
    restart: unless-stopped

volumes:
  chroma_data:
```

```bash
# Setup
docker-compose up -d chroma
```

**Uso:**
```typescript
// Configuração
CHROMA_BASE_URL=http://localhost:8000

// Uso
import { ChromaClient } from 'chromadb';
const client = new ChromaClient({ path: 'http://localhost:8000' });
const collection = await client.createCollection({ name: 'fitos-knowledge' });
```

---

### **📊 MONITORAMENTO (Self-hosted)**

#### **1. Sentry (Error Tracking)**
```yaml
# docker-compose.yml
services:
  sentry-redis:
    image: redis:7-alpine
    container_name: sentry-redis
    restart: unless-stopped

  sentry-postgres:
    image: postgres:15
    container_name: sentry-postgres
    environment:
      POSTGRES_DB: sentry
      POSTGRES_USER: sentry
      POSTGRES_PASSWORD: sentry_password
    volumes:
      - sentry_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  sentry-worker:
    image: getsentry/sentry:latest
    container_name: sentry-worker
    depends_on:
      - sentry-redis
      - sentry-postgres
    environment:
      SENTRY_SECRET_KEY: your-secret-key
      SENTRY_POSTGRES_HOST: sentry-postgres
      SENTRY_REDIS_HOST: sentry-redis
    restart: unless-stopped

  sentry-web:
    image: getsentry/sentry:latest
    container_name: sentry-web
    ports:
      - "9000:9000"
    depends_on:
      - sentry-redis
      - sentry-postgres
    environment:
      SENTRY_SECRET_KEY: your-secret-key
      SENTRY_POSTGRES_HOST: sentry-postgres
      SENTRY_REDIS_HOST: sentry-redis
    restart: unless-stopped

volumes:
  sentry_postgres_data:
```

#### **2. Grafana + Prometheus (Métricas)**
```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

#### **3. Jaeger (Tracing)**
```yaml
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    restart: unless-stopped
```

---

### **☁️ INFRAESTRUTURA (Self-hosted)**

#### **1. PostgreSQL (Banco Principal)**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    container_name: fitos-postgres
    environment:
      POSTGRES_DB: fitos
      POSTGRES_USER: fitos
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### **2. Redis (Cache)**
```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: fitos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### **3. MinIO (Substitui AWS S3)**
```yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    container_name: fitos-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

volumes:
  minio_data:
```

---

### **📧 COMUNICAÇÃO (Self-hosted)**

#### **1. Mailcow (Email Completo)**
```yaml
# docker-compose.yml
services:
  mailcow:
    image: mailcow/mailcow-dockerized:latest
    container_name: mailcow
    ports:
      - "25:25"
      - "465:465"
      - "587:587"
      - "993:993"
      - "995:995"
      - "80:80"
      - "443:443"
    volumes:
      - mailcow_data:/var/lib/mailcow
    restart: unless-stopped

volumes:
  mailcow_data:
```

#### **2. Postal (SMTP Server)**
```yaml
# docker-compose.yml
services:
  postal:
    image: postalhq/postal:latest
    container_name: postal
    ports:
      - "25:25"
      - "587:587"
    environment:
      POSTAL_DATABASE_HOST: postgres
      POSTAL_REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
```

---

### **🔍 BUSCA E ANALYTICS (Self-hosted)**

#### **1. Elasticsearch (Busca Avançada)**
```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    restart: unless-stopped

volumes:
  elasticsearch_data:
```

#### **2. ClickHouse (Analytics)**
```yaml
# docker-compose.yml
services:
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: clickhouse
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    restart: unless-stopped

volumes:
  clickhouse_data:
```

---

### **🚀 DOCKER COMPOSE COMPLETO**

```yaml
# docker-compose.yml
version: '3.8'

services:
  # IA
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  chroma:
    image: chromadb/chroma:latest
    container_name: chroma
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    restart: unless-stopped

  # Infraestrutura
  # PostgreSQL será usado externamente: postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db

  redis:
    image: redis:7-alpine
    container_name: fitos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: fitos-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

  # Monitoramento
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: jaeger
    ports:
      - "16686:16686"
    restart: unless-stopped

volumes:
  ollama_data:
  chroma_data:
  redis_data:
  minio_data:
  prometheus_data:
  grafana_data:
```

---

### **🔧 CONFIGURAÇÃO DE VARIÁVEIS**

```bash
# .env
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=your-secure-minio-password
GRAFANA_PASSWORD=your-secure-grafana-password

# URLs Self-hosted
OLLAMA_BASE_URL=http://localhost:11434
CHROMA_BASE_URL=http://localhost:8000
DATABASE_URL=postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=${MINIO_ROOT_USER}
MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
```

---

### **📋 COMANDOS DE SETUP**

```bash
# 1. Clonar e configurar
git clone <repo>
cd fitos
cp .env.example .env
# Editar .env com suas senhas

# 2. Subir todos os serviços
docker-compose up -d

# 3. Instalar modelos Ollama
docker exec -it ollama ollama pull llama2
docker exec -it ollama ollama pull codellama
docker exec -it ollama ollama pull mistral

# 4. Verificar status
docker-compose ps

# 5. Acessar interfaces
# Grafana: http://localhost:3001 (admin/senha)
# MinIO: http://localhost:9001 (minioadmin/senha)
# Jaeger: http://localhost:16686
# Chroma: http://localhost:8000
```

---

### **💡 VANTAGENS DO SELF-HOSTING**

#### **💰 Econômicas:**
- **$0/mês** vs $300-800/mês
- **Sem limites** de uso
- **Controle total** dos dados

#### **🔒 Segurança:**
- **Dados locais** (não vão para terceiros)
- **Controle de acesso** total
- **Compliance** mais fácil

#### **⚡ Performance:**
- **Latência baixa** (local)
- **Sem throttling** de APIs
- **Recursos dedicados**

#### **🛠️ Controle:**
- **Customização** total
- **Updates** quando quiser
- **Backup** personalizado

---

### **⚠️ CONSIDERAÇÕES IMPORTANTES**

#### **🔧 Manutenção:**
- **Updates** manuais necessários
- **Backup** deve ser configurado
- **Monitoramento** de recursos

#### **📊 Recursos:**
- **RAM**: Mínimo 8GB (recomendado 16GB)
- **CPU**: Mínimo 4 cores
- **Storage**: Mínimo 100GB SSD

#### **🔄 Backup:**
```bash
# Script de backup para banco externo
#!/bin/bash
pg_dump "postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db" > backup_$(date +%Y%m%d).sql
docker-compose exec redis redis-cli BGSAVE
```

---

### **🗄️ CONFIGURAÇÃO DO BANCO DE DADOS**

#### **PostgreSQL Externo**
```bash
# String de conexão configurada
DATABASE_URL=postgresql://fitness_admin:Fitness@2025@150.136.97.194:5433/fitness_db

# Detalhes da conexão:
# Host: 150.136.97.194
# Porta: 5433
# Database: fitness_db
# Usuário: fitness_admin
# Senha: Fitness@2025
```

#### **Configuração do Prisma**
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### **Comandos de Migração**
```bash
# Gerar migração
npx prisma migrate dev --name init

# Aplicar migrações
npx prisma migrate deploy

# Reset do banco (cuidado!)
npx prisma migrate reset

# Visualizar banco
npx prisma studio
```

---

### **Stack Tecnológica**

#### **Backend**
```typescript
- Node.js 20+ + Express + TypeScript
- PostgreSQL 15+ (banco externo - 150.136.97.194:5433)
- Redis (self-hosted via Docker)
- Prisma (ORM)
- Ollama (IA local - substitui OpenAI/Claude)
- Chroma (vector database local - substitui Pinecone)
- Stripe (assinaturas recorrentes)
- Mercado Pago (PIX + pagamentos únicos brasileiros)
```

#### **Frontend**
```typescript
- Next.js 14 + React 18 + TypeScript
- ShadcnUI + Tailwind CSS
- Zustand (state management)
- React Query (server state)
- PWA (Service Workers)
```

#### **Infraestrutura**
```yaml
- Docker + Docker Compose (self-hosted)
- GitHub Actions (CI/CD)
- VPS Oracle (produção - gratuito)
- PostgreSQL (banco externo - 150.136.97.194:5433)
- Portainer (container management)
- Sentry (self-hosted via Docker)
- Grafana + Prometheus (self-hosted via Docker)
- MinIO (self-hosted - substitui AWS S3)
```

### **Estrutura do Projeto**
```
/fitOS
  /src
    /backend          # Express + TypeScript + Prisma
      /src
        /agents       # IA Multiagente
        /routes       # API Routes
        /services     # Business Logic
        /models       # Database Models
        /middleware   # Tenant resolution
    /frontend         # Next.js + React + ShadcnUI
      /app
        /page.tsx     # Homepage
        /chat         # Chat Interface
        /workout      # Workout Interface
        /admin        # Admin Dashboard
        /onboarding   # Self-service onboarding
      /components
        /ai-chat      # Chat Components
        /biometric    # Wearable Widgets
    /shared           # Tipos e utilitários compartilhados
  /docker
    Dockerfile        # Multi-stage build
    docker-compose.yml
    docker-compose.prod.yml
    portainer-stack.yml
  /.github
    /workflows
      ci.yml          # CI Pipeline
      cd.yml          # CD Pipeline
      security.yml    # Security Scanning
  /scripts
    build.sh          # Build script
    deploy.sh         # Deploy script
    auto-deploy.sh    # Automated deploy
    start.sh          # Startup script
  package.json        # Root package.json
```

---

## 🎯 **ROADMAP DE IMPLEMENTAÇÃO**

### **CICLO 1: MVP SAAS + CI/CD (Semanas 1-12)**

#### **Sprint 1: Setup CI/CD + Multi-Tenancy (Semanas 1-3)**

**Objetivos:**
- Configurar Git workflow e GitHub Actions
- Implementar arquitetura multi-tenant
- Setup de testes automatizados

**Entregáveis:**

1. **Git Workflow**
```bash
# Estrutura de branches
main          # Produção (deploy automático)
├── develop   # Desenvolvimento (deploy para staging)
├── feature/  # Features individuais
├── hotfix/   # Correções urgentes
└── release/  # Preparação de releases
```

2. **GitHub Actions CI Pipeline**
```yaml
# .github/workflows/ci.yml
- Testes automatizados (Unit, Integration, E2E)
- Linting (ESLint, Prettier, TypeScript)
- Security scanning (Snyk, Trivy, npm audit)
- Build Docker multi-stage
- Deploy automático para staging
```

3. **Arquitetura Multi-Tenant**
```typescript
// src/backend/src/models/Tenant.ts
export interface Tenant {
  id: string;
  name: string; // Nome da academia
  subdomain: string; // academia.fitOS.com
  customDomain?: string; // academia.com.br
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  billingEmail: string;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

4. **Middleware de Tenant Resolution**
```typescript
// src/backend/src/middleware/tenant.ts
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.get('host');
  const tenant = await resolveTenant(host);
  
  if (!tenant || tenant.status !== 'active') {
    return res.status(404).json({ error: 'Tenant not found or inactive' });
  }
  
  req.tenant = tenant;
  next();
}
```

**Tarefas Técnicas:**
- [ ] Configurar repositório GitHub
- [ ] Implementar GitHub Actions workflows
- [ ] Criar estrutura de banco multi-tenant
- [ ] Implementar middleware de tenant resolution
- [ ] Configurar testes automatizados
- [ ] Setup Docker multi-stage build

#### **Sprint 2: Billing + Deploy Automático (Semanas 4-6)**

**Objetivos:**
- Integrar Stripe para assinaturas recorrentes
- Integrar Mercado Pago para PIX e pagamentos brasileiros
- Implementar self-service onboarding
- Configurar deploy automático para produção

**Entregáveis:**

1. **Sistema de Billing Dual (Stripe + Mercado Pago)**
```typescript
// src/backend/src/services/billing.service.ts
export class BillingService {
  async createSubscription(tenantId: string, planId: string, paymentMethod: 'stripe' | 'mercadopago') {
    const tenant = await Tenant.findById(tenantId);
    const plan = await this.getPlanById(planId);
    
    if (paymentMethod === 'stripe') {
      return await this.createStripeSubscription(tenant, plan);
    } else {
      return await this.createMercadoPagoSubscription(tenant, plan);
    }
  }
  
  async createStripeSubscription(tenant: Tenant, plan: Plan) {
    const customer = await this.stripe.customers.create({
      email: tenant.billingEmail,
      metadata: { tenantId: tenant.id }
    });
    
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripePriceId }],
      metadata: { tenantId: tenant.id },
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent']
    });
    
    await Tenant.update(tenant.id, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      plan: plan.name,
      status: 'pending'
    });
    
    return {
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      paymentMethod: 'stripe'
    };
  }
  
  async createMercadoPagoSubscription(tenant: Tenant, plan: Plan) {
    // Para Mercado Pago, criamos uma preferência para pagamento único
    // e depois configuramos cobrança recorrente via webhook
    const preference = await this.mercadopago.preferences.create({
      items: [{
        id: plan.id,
        title: `${plan.name} - Assinatura Mensal`,
        description: `Plano ${plan.name} do FitOS`,
        quantity: 1,
        unit_price: plan.price,
        currency_id: 'BRL'
      }],
      payer: {
        email: tenant.billingEmail,
        name: tenant.name,
        identification: {
          type: 'CPF',
          number: tenant.cpf
        }
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: plan.price > 100 ? 12 : 1
      },
      notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
      external_reference: tenant.id,
      auto_return: 'approved',
      back_urls: {
        success: `${process.env.FRONTEND_URL}/billing/success`,
        failure: `${process.env.FRONTEND_URL}/billing/failure`,
        pending: `${process.env.FRONTEND_URL}/billing/pending`
      }
    });
    
    await PaymentPreference.create({
      tenantId: tenant.id,
      planId: plan.id,
      mercadopagoPreferenceId: preference.body.id,
      paymentMethod: 'mercadopago',
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    });
    
    return {
      preferenceId: preference.body.id,
      initPoint: preference.body.init_point,
      paymentMethod: 'mercadopago'
    };
  }
  
  async createPIXPayment(tenantId: string, planId: string) {
    const plan = await this.getPlanById(planId);
    
    const pixPayment = await this.mercadopago.payment.create({
      transaction_amount: plan.price,
      description: `Assinatura ${plan.name} - FitOS`,
      payment_method_id: 'pix',
      payer: {
        email: tenant.billingEmail,
        first_name: tenant.name.split(' ')[0],
        last_name: tenant.name.split(' ').slice(1).join(' ')
      },
      external_reference: tenantId
    });
    
    return {
      id: pixPayment.body.id,
      qrCode: pixPayment.body.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: pixPayment.body.point_of_interaction.transaction_data.qr_code_base64,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };
  }
  
  async processStripeWebhook(event: any) {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await this.handleSuccessfulPayment(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handleFailedPayment(event.data.object);
        break;
    }
  }
  
  async processMercadoPagoWebhook(webhookData: any) {
    const { type, data } = webhookData;
    
    if (type === 'payment') {
      const payment = await this.mercadopago.payment.findById(data.id);
      const preference = await PaymentPreference.findByMercadopagoId(payment.body.external_reference);
      
      if (payment.body.status === 'approved') {
        await this.activateSubscription(preference.tenantId, preference.planId);
        await PaymentPreference.update(preference.id, { status: 'approved' });
        
        // Configurar cobrança recorrente para próximo mês
        await this.scheduleNextPayment(preference.tenantId, preference.planId);
      }
    }
  }
}
```

2. **Interface de Pagamento Dual (Stripe + Mercado Pago)**
```typescript
// src/frontend/app/billing/payment/page.tsx
export default function PaymentPage() {
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'mercadopago'>('stripe');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('card');
  const [pixData, setPixData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePayment = async (planId: string) => {
    setIsLoading(true);
    try {
      if (paymentProvider === 'stripe') {
        await handleStripePayment(planId);
      } else {
        await handleMercadoPagoPayment(planId);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStripePayment = async (planId: string) => {
    const { clientSecret } = await api.createStripeSubscription(planId);
    
    // Usar Stripe Elements para processar cartão
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements();
    
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: user.name,
          email: user.email
        }
      }
    });
    
    if (error) {
      console.error('Erro no pagamento Stripe:', error);
    } else if (paymentIntent.status === 'succeeded') {
      router.push('/billing/success');
    }
  };
  
  const handleMercadoPagoPayment = async (planId: string) => {
    if (paymentMethod === 'pix') {
      const pixPayment = await api.createPIXPayment(planId);
      setPixData(pixPayment);
      
      // Polling para verificar status do pagamento
      const interval = setInterval(async () => {
        const status = await api.checkPaymentStatus(pixPayment.id);
        if (status === 'approved') {
          clearInterval(interval);
          router.push('/billing/success');
        } else if (status === 'rejected') {
          clearInterval(interval);
          router.push('/billing/failure');
        }
      }, 5000);
    } else {
      // Redirecionar para checkout Mercado Pago
      const { initPoint } = await api.createMercadoPagoSubscription(planId);
      window.location.href = initPoint;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Escolha a forma de pagamento</CardTitle>
            <CardDescription>
              Selecione o provedor de pagamento e método preferido
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Payment Provider Selection */}
            <div className="mb-6">
              <Label className="text-base font-semibold mb-4 block">Provedor de Pagamento</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={paymentProvider === 'stripe' ? 'default' : 'outline'}
                  onClick={() => setPaymentProvider('stripe')}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <CreditCard className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Stripe</span>
                  <span className="text-xs text-gray-500">Cartões internacionais</span>
                </Button>
                
                <Button
                  variant={paymentProvider === 'mercadopago' ? 'default' : 'outline'}
                  onClick={() => setPaymentProvider('mercadopago')}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <QrCode className="h-6 w-6 mb-2" />
                  <span className="font-semibold">Mercado Pago</span>
                  <span className="text-xs text-gray-500">PIX + Cartões BR</span>
                </Button>
              </div>
            </div>
            
            {/* Payment Method Selection (only for Mercado Pago) */}
            {paymentProvider === 'mercadopago' && (
              <div className="mb-6">
                <Label className="text-base font-semibold mb-4 block">Método de Pagamento</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <CreditCard className="h-8 w-8 mb-2" />
                    <span>Cartão</span>
                    <span className="text-xs text-gray-500">Débito/Crédito</span>
                  </Button>
                  
                  <Button
                    variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('pix')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <QrCode className="h-8 w-8 mb-2" />
                    <span>PIX</span>
                    <span className="text-xs text-gray-500">Instantâneo</span>
                  </Button>
                  
                  <Button
                    variant={paymentMethod === 'boleto' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('boleto')}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <FileText className="h-8 w-8 mb-2" />
                    <span>Boleto</span>
                    <span className="text-xs text-gray-500">Até 3 dias</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Stripe Card Form */}
            {paymentProvider === 'stripe' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Pagamento com Stripe</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Aceita cartões internacionais. Cobrança automática mensal.
                  </p>
                </div>
                
                <div>
                  <Label>Informações do Cartão</Label>
                  <div id="card-element" className="mt-2 p-3 border rounded-lg">
                    {/* Stripe Elements será montado aqui */}
                  </div>
                </div>
              </div>
            )}
            
            {/* Mercado Pago PIX */}
            {paymentProvider === 'mercadopago' && paymentMethod === 'pix' && pixData && (
              <div className="text-center space-y-4">
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
                  <h3 className="text-lg font-semibold mb-4">Escaneie o QR Code</h3>
                  <div className="flex justify-center">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Ou copie o código PIX:
                  </p>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <code className="text-xs break-all">{pixData.qrCode}</code>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Aguardando pagamento...</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Expira em: {new Date(pixData.expiresAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Mercado Pago Card/Boleto */}
            {paymentProvider === 'mercadopago' && paymentMethod !== 'pix' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <QrCode className="h-8 w-8 text-green-600" />
                    <span className="text-lg font-semibold text-green-800">Mercado Pago</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Você será redirecionado para o checkout seguro do Mercado Pago
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full mt-6" 
              onClick={() => handlePayment(selectedPlan.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar R$ ${selectedPlan.price.toFixed(2)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

3. **Self-Service Onboarding**
```typescript
// src/frontend/app/onboarding/page.tsx
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gymName: '',
    subdomain: '',
    ownerEmail: '',
    plan: 'starter'
  });
  
  // 4 steps: Gym Info → Owner Info → Plan Selection → Payment
}
```

3. **CD Pipeline**
```yaml
# .github/workflows/cd.yml
- Deploy automático para produção (branch main)
- Database migrations automáticas
- Health checks pós-deploy
- Rollback automático em caso de falha
- Notificações Slack
```

**Tarefas Técnicas:**
- [ ] Integrar Mercado Pago API
- [ ] Implementar webhooks de pagamento
- [ ] Criar interface de onboarding
- [ ] Configurar CD pipeline
- [ ] Implementar health checks
- [ ] Setup rollback automático

**Tarefas Técnicas Sprint 2:**
- [ ] Instalar e configurar Stripe SDK
- [ ] Instalar e configurar Mercado Pago SDK
- [ ] Implementar serviço de billing dual
- [ ] Criar endpoint para assinaturas Stripe
- [ ] Criar endpoint para PIX Mercado Pago
- [ ] Implementar webhooks Stripe e Mercado Pago
- [ ] Criar interface de escolha de provedor
- [ ] Implementar Stripe Elements para cartões
- [ ] Implementar polling para status PIX
- [ ] Adicionar validação de CPF/CNPJ
- [ ] Configurar URLs de retorno e notificação
- [ ] Implementar geração de boleto
- [ ] Adicionar suporte a parcelamento em cartão
- [ ] Testes de integração com ambos os sistemas
- [ ] Documentar configuração de credenciais

**Configuração Dual (Stripe + Mercado Pago):**
```bash
# .env
# Stripe (Assinaturas Recorrentes)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Mercado Pago (PIX + Pagamentos Brasileiros)
MERCADOPAGO_ACCESS_TOKEN=APP_USR_your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR_your-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# URLs
API_URL=https://api.fitos.com.br
FRONTEND_URL=https://app.fitos.com.br
```

**Instalação:**
```bash
npm install stripe mercadopago @stripe/stripe-js
```

**Documentação oficial:**
- Stripe Subscriptions: https://stripe.com/docs/billing/subscriptions/overview
- Mercado Pago PIX: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Mercado Pago Webhooks: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/notifications/webhooks

---

#### **Sprint 3: IA Multiagente + Limites (Semanas 7-9)**

**Objetivos:**
- Implementar agentes de IA especializados
- Sistema de limites por plano
- Integração com wearables

**Entregáveis:**

1. **Coach AI Agent**
```typescript
// src/backend/src/agents/coach-agent.ts
export class CoachAgent {
  async generateWorkout(tenantId: string, memberId: string, request: WorkoutRequest) {
    // Verificar limites do plano
    await this.planLimitsService.enforceLimits(tenantId, 'ai_requests');
    
    const prompt = `
    Como personal trainer da academia ${tenant.name}, crie um treino para:
    - Membro: ${member.name}
    - Objetivo: ${request.goal}
    - Experiência: ${request.experience}
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    return this.parseWorkoutResponse(response);
  }
}
```

2. **Nutrition AI Agent**
```typescript
// src/backend/src/agents/nutrition-agent.ts
export class NutritionAgent {
  async analyzeMeal(photoUrl: string, userGoals: UserGoals) {
    const analysis = await this.openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Analise esta refeição e calcule macros" },
          { type: "image_url", image_url: { url: photoUrl } }
        ]
      }]
    });
    
    return this.calculateMacros(analysis, userGoals);
  }
}
```

3. **Business AI Agent**
```typescript
// src/backend/src/agents/business-agent.ts
export class BusinessAgent {
  async predictChurn(gymId: string): Promise<ChurnPrediction[]> {
    const members = await this.getMemberData(gymId);
    const features = this.extractFeatures(members);
    
    const predictions = await this.mlModel.predict(features);
    
    return predictions.map(p => ({
      memberId: p.memberId,
      churnProbability: p.probability,
      riskFactors: p.factors,
      suggestedActions: this.generateActions(p)
    }));
  }
}
```

4. **Sistema de Limites**
```typescript
// src/backend/src/services/plan-limits.service.ts
export class PlanLimitsService {
  private planLimits = {
    starter: {
      maxMembers: 50,
      maxTrainers: 2,
      maxStorage: 1, // GB
      features: {
        aiAgents: true,
        wearables: false,
        computerVision: false,
        marketplace: false,
        whiteLabel: false
      }
    },
    professional: {
      maxMembers: 200,
      maxTrainers: 5,
      maxStorage: 10, // GB
      features: {
        aiAgents: true,
        wearables: true,
        computerVision: false,
        marketplace: true,
        whiteLabel: false
      }
    },
    enterprise: {
      maxMembers: -1, // Unlimited
      maxTrainers: -1, // Unlimited
      maxStorage: 100, // GB
      features: {
        aiAgents: true,
        wearables: true,
        computerVision: true,
        marketplace: true,
        whiteLabel: true
      }
    }
  };
}
```

**Tarefas Técnicas:**
- [ ] Implementar Coach AI Agent
- [ ] Implementar Nutrition AI Agent
- [ ] Implementar Business AI Agent
- [ ] Criar sistema de limites por plano
- [ ] Integrar Apple HealthKit
- [ ] Integrar Google Fit API

#### **Sprint 4: Integração Nutricional + Marketplace + Bioimpedância + Agendamento + CRM (Semanas 10-12)**

**Objetivos:**
- Dashboard para nutricionistas
- Marketplace de serviços nutricionais
- Integração de dados de saúde
- Agendamento unificado
- Sistema de bioimpedância completo
- CRM integrado para profissionais
- Automação de follow-ups

**Entregáveis:**

1. **Nutrition Professional Dashboard**
```typescript
// src/frontend/app/nutritionist/page.tsx
export default function NutritionistDashboard() {
  return (
    <div className="min-h-screen bg-green-50">
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard Nutricional</h1>
        
        {/* Client Management */}
        <NutritionClientsTable />
        
        {/* Meal Plan Creator */}
        <MealPlanCreator />
        
        {/* AI Nutrition Assistant */}
        <NutritionAIChat />
      </div>
    </div>
  );
}
```

2. **Marketplace de Serviços Nutricionais**
```typescript
// src/backend/src/services/nutrition-marketplace.service.ts
export class NutritionMarketplaceService {
  async createNutritionService(nutritionistId: string, service: NutritionService) {
    const listing = await NutritionServiceListing.create({
      nutritionistId,
      title: service.title,
      type: service.type, // 'consultation', 'meal_plan', 'follow_up'
      price: service.price,
      specialties: service.specialties
    });
    
    return listing;
  }
}
```

3. **Sistema de Agendamento Integrado**
```typescript
// src/backend/src/services/appointment.service.ts
export class AppointmentService {
  async getIntegratedSchedule(professionalId: string, date: Date) {
    const workouts = await this.getWorkoutSchedule(professionalId, date);
    const consultations = await this.getConsultationSchedule(professionalId, date);
    
    return this.mergeSchedules(workouts, consultations);
  }
}
```

**Tarefas Técnicas:**
- [ ] Implementar dashboard para nutricionistas
- [ ] Criar marketplace de serviços nutricionais
- [ ] **Sistema de agendamento completo para profissionais**
- [ ] **Integração com Google Agenda**
- [ ] **Histórico e relatórios de agendamentos**
- [ ] **Dashboard de agendamentos (dia/semana/mês)**
- [ ] Integração de dados de saúde
- [ ] AI Nutrition Professional Agent
- [ ] **Sistema de Bioimpedância com CRUD completo**
- [ ] **AI Analysis Agent para composição corporal**
- [ ] **Integração com equipamentos de bioimpedância**
- [ ] **Implementar CRM integrado para profissionais**
- [ ] **Dashboard de pipeline de clientes**
- [ ] **Sistema de automação de follow-ups**
- [ ] **Campanhas automáticas personalizáveis**
- [ ] **AI CRM Analytics Agent**
- [ ] Testes de integração

**Entregáveis Específicos de Agendamento:**

4. **Sistema de Agendamento Completo**
```typescript
// src/backend/src/services/scheduling.service.ts
export class SchedulingService {
  async createAppointment(tenantId: string, professionalId: string, appointment: AppointmentRequest) {
    // Verificar disponibilidade
    const isAvailable = await this.checkAvailability(professionalId, appointment.datetime);
    
    if (!isAvailable) {
      throw new Error('Horário não disponível');
    }
    
    // Criar agendamento
    const newAppointment = await Appointment.create({
      tenantId,
      professionalId,
      clientId: appointment.clientId,
      type: appointment.type, // 'consultation', 'training', 'nutrition', 'bioimpedance'
      title: appointment.title,
      description: appointment.description,
      scheduledAt: appointment.datetime,
      duration: appointment.duration || 60,
      status: 'scheduled',
      location: appointment.location,
      isVirtual: appointment.isVirtual,
      notes: appointment.notes,
      googleEventId: null // Será preenchido após sincronização
    });
    
    // Sincronizar com Google Agenda
    if (appointment.syncWithGoogle) {
      const googleEvent = await this.googleCalendarService.createEvent(professionalId, newAppointment);
      await Appointment.update(newAppointment.id, { googleEventId: googleEvent.id });
    }
    
    // Notificar cliente
    await this.notificationService.sendAppointmentConfirmation(appointment.clientId, newAppointment);
    
    return newAppointment;
  }
  
  async getProfessionalSchedule(professionalId: string, date: Date) {
    const appointments = await Appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      },
      include: {
        client: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });
    
    return appointments;
  }
  
  async getAppointmentHistory(professionalId: string, filters: HistoryFilters) {
    const appointments = await Appointment.findMany({
      where: {
        professionalId,
        scheduledAt: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        status: filters.status || undefined,
        type: filters.type || undefined
      },
      include: {
        client: {
          select: { name: true, email: true }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    });
    
    return this.formatAppointmentHistory(appointments);
  }
  
  async updateAppointment(appointmentId: string, professionalId: string, updates: Partial<AppointmentRequest>) {
    const appointment = await Appointment.findById(appointmentId);
    
    if (appointment.professionalId !== professionalId) {
      throw new Error('Sem permissão para editar este agendamento');
    }
    
    // Atualizar agendamento
    const updatedAppointment = await Appointment.update(appointmentId, {
      ...updates,
      updatedAt: new Date()
    });
    
    // Sincronizar com Google Agenda se necessário
    if (appointment.googleEventId && updates.scheduledAt) {
      await this.googleCalendarService.updateEvent(professionalId, appointment.googleEventId, updatedAppointment);
    }
    
    return updatedAppointment;
  }
  
  async cancelAppointment(appointmentId: string, professionalId: string, reason: string) {
    const appointment = await Appointment.findById(appointmentId);
    
    if (appointment.professionalId !== professionalId) {
      throw new Error('Sem permissão para cancelar este agendamento');
    }
    
    // Cancelar agendamento
    await Appointment.update(appointmentId, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date()
    });
    
    // Cancelar no Google Agenda
    if (appointment.googleEventId) {
      await this.googleCalendarService.cancelEvent(professionalId, appointment.googleEventId);
    }
    
    // Notificar cliente
    await this.notificationService.sendAppointmentCancellation(appointment.clientId, appointment, reason);
    
    return { success: true };
  }
}
```

5. **Integração com Google Agenda**
```typescript
// src/backend/src/services/google-calendar.service.ts
export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
  
  async authorizeProfessional(professionalId: string, authCode: string) {
    const { tokens } = await this.oauth2Client.getToken(authCode);
    
    // Salvar tokens do profissional
    await ProfessionalGoogleTokens.upsert({
      professionalId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });
    
    return { success: true };
  }
  
  async createEvent(professionalId: string, appointment: Appointment) {
    const tokens = await this.getProfessionalTokens(professionalId);
    this.oauth2Client.setCredentials(tokens);
    
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const event = {
      summary: appointment.title,
      description: appointment.description,
      start: {
        dateTime: appointment.scheduledAt.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: new Date(appointment.scheduledAt.getTime() + appointment.duration * 60000).toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      attendees: [
        { email: appointment.client.email }
      ],
      location: appointment.location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 30 }       // 30 min antes
        ]
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    return response.data;
  }
  
  async syncAppointments(professionalId: string) {
    const tokens = await this.getProfessionalTokens(professionalId);
    this.oauth2Client.setCredentials(tokens);
    
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    // Buscar eventos do Google Agenda
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const googleEvents = response.data.items || [];
    
    // Sincronizar com agendamentos locais
    for (const event of googleEvents) {
      await this.syncGoogleEvent(professionalId, event);
    }
    
    return { syncedEvents: googleEvents.length };
  }
}
```

6. **Dashboard de Agendamentos para Profissionais**
```typescript
// src/frontend/app/professional/schedule/page.tsx
export default function ProfessionalSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  
  const { data: appointments } = useQuery({
    queryKey: ['professional-schedule', selectedDate],
    queryFn: () => api.getProfessionalSchedule(selectedDate)
  });
  
  const { data: googleCalendarConnected } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: () => api.getGoogleCalendarStatus()
  });
  
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Minha Agenda</h1>
          
          <div className="flex gap-4">
            <GoogleCalendarSyncButton 
              connected={googleCalendarConnected}
              onConnect={handleGoogleConnect}
            />
            <Button onClick={() => setShowCreateModal(true)}>
              Novo Agendamento
            </Button>
          </div>
        </div>
        
        {/* Calendar View Controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button 
              variant={view === 'day' ? 'default' : 'outline'}
              onClick={() => setView('day')}
            >
              Dia
            </Button>
            <Button 
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button 
              variant={view === 'month' ? 'default' : 'outline'}
              onClick={() => setView('month')}
            >
              Mês
            </Button>
          </div>
          
          <DatePicker 
            selected={selectedDate}
            onChange={setSelectedDate}
          />
        </div>
        
        {/* Schedule Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ScheduleCalendar 
              appointments={appointments}
              view={view}
              selectedDate={selectedDate}
              onAppointmentClick={handleAppointmentClick}
            />
          </div>
          
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Hoje:</span>
                    <span className="font-semibold">{appointments?.today?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Esta semana:</span>
                    <span className="font-semibold">{appointments?.thisWeek?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de comparecimento:</span>
                    <span className="font-semibold">{appointments?.attendanceRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentList 
                  appointments={appointments?.upcoming}
                  onEdit={handleEditAppointment}
                  onCancel={handleCancelAppointment}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

7. **Histórico e Relatórios de Agendamentos**
```typescript
// src/frontend/app/professional/history/page.tsx
export default function AppointmentHistoryPage() {
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate: new Date(),
    status: 'all',
    type: 'all'
  });
  
  const { data: history } = useQuery({
    queryKey: ['appointment-history', filters],
    queryFn: () => api.getAppointmentHistory(filters)
  });
  
  const { data: reports } = useQuery({
    queryKey: ['appointment-reports', filters],
    queryFn: () => api.getAppointmentReports(filters)
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Histórico de Agendamentos</h1>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data Início</Label>
                <DatePicker 
                  selected={filters.startDate}
                  onChange={(date) => setFilters({...filters, startDate: date})}
                />
              </div>
              <div>
                <Label>Data Fim</Label>
                <DatePicker 
                  selected={filters.endDate}
                  onChange={(date) => setFilters({...filters, endDate: date})}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="no_show">Não compareceu</SelectItem>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="consultation">Consulta</SelectItem>
                  <SelectItem value="training">Treino</SelectItem>
                  <SelectItem value="nutrition">Nutrição</SelectItem>
                  <SelectItem value="bioimpedance">Bioimpedância</SelectItem>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reports */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total de Agendamentos"
            value={reports?.totalAppointments}
            change={`+${reports?.growthRate}%`}
          />
          <StatCard 
            title="Taxa de Comparecimento"
            value={`${reports?.attendanceRate}%`}
            change={`+${reports?.attendanceGrowth}%`}
          />
          <StatCard 
            title="Receita Total"
            value={`R$ ${reports?.totalRevenue}`}
            change={`+${reports?.revenueGrowth}%`}
          />
          <StatCard 
            title="Clientes Únicos"
            value={reports?.uniqueClients}
            change={`+${reports?.clientGrowth}%`}
          />
        </div>
        
        {/* History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentHistoryTable 
              appointments={history}
              onExport={handleExportHistory}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Entregáveis Específicos de Bioimpedância:**

8. **Sistema de Bioimpedância Completo**
```typescript
// src/backend/src/services/bioimpedance.service.ts
export class BioimpedanceService {
  async createMeasurement(tenantId: string, memberId: string, professionalId: string, data: BioimpedanceData) {
    const measurement = await BioimpedanceMeasurement.create({
      tenantId,
      memberId,
      professionalId,
      weight: data.weight,
      height: data.height,
      age: data.age,
      gender: data.gender,
      bodyFatPercentage: data.bodyFatPercentage,
      muscleMass: data.muscleMass,
      boneMass: data.boneMass,
      waterPercentage: data.waterPercentage,
      visceralFatLevel: data.visceralFatLevel,
      bmr: data.bmr,
      metabolicAge: data.metabolicAge,
      impedance: data.impedance,
      deviceModel: data.deviceModel,
      measuredAt: data.measuredAt,
      isManualEntry: data.isManualEntry,
      notes: data.notes
    });
    
    // Análise automática com IA
    const analysis = await this.aiService.analyzeBioimpedanceData(measurement);
    return { measurement, analysis };
  }
  
  async updateMeasurement(measurementId: string, professionalId: string, updates: Partial<BioimpedanceData>) {
    const measurement = await BioimpedanceMeasurement.findById(measurementId);
    if (measurement.professionalId !== professionalId) {
      throw new Error('Sem permissão para editar esta medição');
    }
    
    return await BioimpedanceMeasurement.update(measurementId, updates);
  }
  
  async deleteMeasurement(measurementId: string, professionalId: string) {
    const measurement = await BioimpedanceMeasurement.findById(measurementId);
    if (measurement.professionalId !== professionalId) {
      throw new Error('Sem permissão para deletar esta medição');
    }
    
    await BioimpedanceMeasurement.delete(measurementId);
    return { success: true };
  }
}
```

5. **AI Bioimpedance Analysis Agent**
```typescript
// src/backend/src/agents/bioimpedance-analysis-agent.ts
export class BioimpedanceAnalysisAgent {
  async analyzeBioimpedanceData(measurement: BioimpedanceMeasurement) {
    const prompt = `
    Como especialista em composição corporal, analise estes dados de bioimpedância:
    
    Paciente: ${measurement.age} anos, ${measurement.gender}
    Peso: ${measurement.weight} kg | Altura: ${measurement.height} cm
    
    Composição Corporal:
    - Gordura Corporal: ${measurement.bodyFatPercentage}%
    - Massa Muscular: ${measurement.muscleMass} kg
    - Massa Óssea: ${measurement.boneMass} kg
    - Água Corporal: ${measurement.waterPercentage}%
    - Gordura Visceral: Nível ${measurement.visceralFatLevel}
    
    Metabolismo:
    - TMB: ${measurement.bmr} kcal/dia
    - Idade Metabólica: ${measurement.metabolicAge} anos
    
    Forneça análise detalhada incluindo:
    1. Avaliação da composição corporal
    2. Identificação de riscos à saúde
    3. Recomendações específicas
    4. Comparação com padrões saudáveis
    5. Sugestões de intervenção
    `;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });
    
    return this.parseBioimpedanceAnalysis(response);
  }
}
```

6. **Interface de Bioimpedância para Profissionais**
```typescript
// src/frontend/components/bioimpedance-manager.tsx
export function BioimpedanceManager({ memberId }: { memberId: string }) {
  const [measurements, setMeasurements] = useState<BioimpedanceMeasurement[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de Bioimpedância</CardTitle>
        <Button onClick={() => setShowCreateForm(true)}>
          Nova Medição
        </Button>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <BioimpedanceForm 
            memberId={memberId}
            onSave={handleSaveMeasurement}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
        
        <BioimpedanceHistory 
          measurements={measurements}
          onEdit={handleEditMeasurement}
          onDelete={handleDeleteMeasurement}
        />
        
        <BioimpedanceChart measurements={measurements} />
      </CardContent>
    </Card>
  );
}
```

8. **CRM Integrado para Profissionais**
```typescript
// src/backend/src/services/professional-crm.service.ts
export class ProfessionalCRMService {
  async createClientProfile(professionalId: string, clientData: ClientProfile) {
    const client = await ClientProfile.create({
      professionalId,
      tenantId: clientData.tenantId,
      personalInfo: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        birthDate: clientData.birthDate,
        gender: clientData.gender,
        address: clientData.address
      },
      healthInfo: {
        medicalHistory: clientData.medicalHistory,
        medications: clientData.medications,
        allergies: clientData.allergies,
        injuries: clientData.injuries
      },
      fitnessInfo: {
        goals: clientData.goals,
        experience: clientData.experience,
        preferences: clientData.preferences,
        limitations: clientData.limitations
      },
      businessInfo: {
        leadSource: clientData.leadSource,
        acquisitionDate: new Date(),
        status: 'prospect', // prospect, active, inactive, churned
        lifetimeValue: 0,
        lastContact: new Date()
      }
    });
    
    await this.createOnboardingPipeline(client.id);
    return client;
  }
  
  async logInteraction(professionalId: string, interaction: ClientInteraction) {
    const log = await ClientInteraction.create({
      professionalId,
      clientId: interaction.clientId,
      type: interaction.type, // 'call', 'email', 'meeting', 'workout', 'nutrition'
      subject: interaction.subject,
      description: interaction.description,
      outcome: interaction.outcome,
      nextAction: interaction.nextAction,
      scheduledDate: interaction.scheduledDate,
      priority: interaction.priority,
      tags: interaction.tags,
      attachments: interaction.attachments,
      createdAt: new Date()
    });
    
    await ClientProfile.update(interaction.clientId, {
      lastContact: new Date(),
      status: this.determineClientStatus(interaction)
    });
    
    if (interaction.nextAction) {
      await this.createFollowUpTask(professionalId, interaction);
    }
    
    return log;
  }
  
  async getClientPipeline(professionalId: string) {
    const clients = await ClientProfile.findMany({
      where: { professionalId },
      include: {
        interactions: { orderBy: { createdAt: 'desc' }, take: 5 },
        appointments: { where: { status: 'scheduled' }, orderBy: { scheduledAt: 'asc' } }
      }
    });
    
    return {
      prospects: clients.filter(c => c.businessInfo.status === 'prospect'),
      active: clients.filter(c => c.businessInfo.status === 'active'),
      atRisk: clients.filter(c => c.businessInfo.status === 'at_risk'),
      inactive: clients.filter(c => c.businessInfo.status === 'inactive')
    };
  }
  
  async generateClientInsights(professionalId: string, clientId: string) {
    const client = await ClientProfile.findById(clientId);
    const interactions = await ClientInteraction.findMany({ where: { clientId } });
    const appointments = await Appointment.findMany({ where: { clientId } });
    
    const insights = await this.aiService.generateClientInsights({
      client,
      interactions,
      appointments,
      goals: client.fitnessInfo.goals
    });
    
    return {
      engagementScore: this.calculateEngagementScore(interactions),
      satisfactionLevel: this.calculateSatisfactionLevel(interactions),
      churnRisk: this.calculateChurnRisk(client, interactions),
      upsellOpportunities: this.identifyUpsellOpportunities(client),
      recommendations: insights.recommendations,
      nextActions: insights.nextActions
    };
  }
}
```

9. **Dashboard CRM para Profissionais**
```typescript
// src/frontend/app/professional/crm/page.tsx
export default function ProfessionalCRMPage() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [view, setView] = useState<'pipeline' | 'clients' | 'analytics'>('pipeline');
  
  const { data: pipeline } = useQuery({
    queryKey: ['client-pipeline'],
    queryFn: () => api.getClientPipeline()
  });
  
  const { data: clientInsights } = useQuery({
    queryKey: ['client-insights', selectedClient],
    queryFn: () => api.getClientInsights(selectedClient),
    enabled: !!selectedClient
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">CRM Profissional</h1>
          
          <div className="flex gap-4">
            <Button onClick={() => setShowNewClientModal(true)}>
              Novo Cliente
            </Button>
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              Importar Contatos
            </Button>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={view === 'pipeline' ? 'default' : 'outline'}
            onClick={() => setView('pipeline')}
          >
            Pipeline
          </Button>
          <Button 
            variant={view === 'clients' ? 'default' : 'outline'}
            onClick={() => setView('clients')}
          >
            Clientes
          </Button>
          <Button 
            variant={view === 'analytics' ? 'default' : 'outline'}
            onClick={() => setView('analytics')}
          >
            Analytics
          </Button>
        </div>
        
        {/* Pipeline View */}
        {view === 'pipeline' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <PipelineColumn 
              title="Prospects"
              clients={pipeline?.prospects}
              color="blue"
              onClientClick={setSelectedClient}
            />
            <PipelineColumn 
              title="Ativos"
              clients={pipeline?.active}
              color="green"
              onClientClick={setSelectedClient}
            />
            <PipelineColumn 
              title="Em Risco"
              clients={pipeline?.atRisk}
              color="yellow"
              onClientClick={setSelectedClient}
            />
            <PipelineColumn 
              title="Inativos"
              clients={pipeline?.inactive}
              color="red"
              onClientClick={setSelectedClient}
            />
          </div>
        )}
        
        {/* Client Details */}
        {selectedClient && (
          <ClientDetailsModal 
            clientId={selectedClient}
            insights={clientInsights}
            onClose={() => setSelectedClient(null)}
          />
        )}
      </div>
    </div>
  );
}
```

10. **Automação de Follow-ups e Campanhas**
```typescript
// src/backend/src/services/crm-automation.service.ts
export class CRMAutomationService {
  async createAutomatedCampaigns(professionalId: string) {
    const campaigns = [
      {
        name: 'Onboarding de Novos Clientes',
        trigger: 'new_client',
        steps: [
          { day: 0, type: 'email', template: 'welcome' },
          { day: 3, type: 'call', template: 'check-in' },
          { day: 7, type: 'email', template: 'first-week' },
          { day: 14, type: 'appointment', template: 'follow-up' }
        ]
      },
      {
        name: 'Reativação de Clientes Inativos',
        trigger: 'client_inactive_30_days',
        steps: [
          { day: 0, type: 'email', template: 'we-miss-you' },
          { day: 7, type: 'call', template: 'reactivation' },
          { day: 14, type: 'email', template: 'special-offer' }
        ]
      },
      {
        name: 'Upsell para Clientes Ativos',
        trigger: 'client_active_90_days',
        steps: [
          { day: 0, type: 'email', template: 'premium-services' },
          { day: 7, type: 'appointment', template: 'consultation' }
        ]
      }
    ];
    
    return campaigns;
  }
  
  async sendAutomatedFollowUp(taskId: string) {
    const task = await FollowUpTask.findById(taskId);
    const client = await ClientProfile.findById(task.clientId);
    const professional = await User.findById(task.professionalId);
    
    const emailTemplate = await this.generateEmailTemplate(task, client, professional);
    
    await this.emailService.sendEmail({
      to: professional.email,
      subject: `Lembrete: ${task.subject}`,
      template: 'follow-up-reminder',
      data: { task, client, professional, template: emailTemplate }
    });
    
    await FollowUpTask.update(taskId, { reminderSent: true });
  }
}
```

**Tarefas Técnicas CRM:**
- [ ] Implementar serviço de CRM para profissionais
- [ ] Criar dashboard de pipeline de clientes
- [ ] Desenvolver sistema de interações e histórico
- [ ] Implementar automação de follow-ups
- [ ] Criar campanhas automáticas personalizáveis
- [ ] AI CRM Analytics Agent
- [ ] Integração com dados existentes (agendamento, treinos, nutrição)
- [ ] Dashboard de analytics e insights
- [ ] Sistema de importação de contatos
- [ ] Testes de integração CRM

#### **Sprint 5: Admin Dashboard + Deploy Final (Semanas 13-15)**

**Objetivos:**
- Dashboard administrativo completo
- Deploy final para produção
- Monitoramento e observabilidade
- Documentação final

**Entregáveis:**

1. **Admin Dashboard Completo**
```typescript
// src/frontend/app/admin/dashboard/page.tsx
export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <AdminStats />
      <TenantManagement />
      <BillingOverview />
      <SystemHealth />
      <UserAnalytics />
    </div>
  );
}
```

2. **Sistema de Monitoramento**
```typescript
// src/backend/src/middleware/monitoring.ts
export const monitoringMiddleware = {
  healthCheck: '/api/health',
  metrics: '/api/metrics',
  logs: '/api/logs',
  alerts: '/api/alerts'
};
```

3. **Deploy Final**
```yaml
# .github/workflows/deploy-prod.yml
- Deploy automático para produção
- Health checks pós-deploy
- Rollback automático em caso de falha
- Notificações de status
```

**Tarefas Técnicas Sprint 5:**
- [ ] Implementar dashboard administrativo completo
- [ ] Configurar monitoramento e alertas
- [ ] Implementar sistema de logs centralizado
- [ ] Configurar deploy final para produção
- [ ] Implementar health checks e métricas
- [ ] Configurar backup automático
- [ ] Documentação técnica completa
- [ ] Testes de carga e performance
- [ ] Configuração de SSL e segurança
- [ ] Treinamento e handover

#### **Sprint 6: Funcionalidades Inovadoras Brasileiras (Semanas 16-20)**

**Objetivos:**
- Gamificação social brasileira
- Integração cultural nacional
- Telemedicina integrada
- E-commerce de suplementos
- Realidade aumentada para exercícios

**Entregáveis:**

1. **Gamificação Social Brasileira**
```typescript
// src/backend/src/services/gamification.service.ts
export class GamificationService {
  async createBrazilianChallenges() {
    const challenges = [
      {
        id: 'carnaval-fitness',
        name: 'Desafio Carnaval Fit',
        description: 'Complete 30 treinos em fevereiro',
        reward: 'Badge Carnaval + 20% desconto suplementos',
        startDate: '2024-02-01',
        endDate: '2024-02-29',
        requirements: { workouts: 30, type: 'any' }
      },
      {
        id: 'copa-do-mundo',
        name: 'Copa do Mundo Fitness',
        description: 'Treine como um jogador profissional',
        reward: 'Kit oficial da seleção',
        requirements: { duration: 90, intensity: 'high' }
      }
    ];
    
    return challenges;
  }
}
```

2. **Integração Cultural Nacional**
```typescript
// src/backend/src/services/brazilian-culture.service.ts
export class BrazilianCultureService {
  async getBrazilianHolidayWorkouts(holiday: string) {
    const holidayWorkouts = {
      'carnaval': {
        name: 'Treino de Carnaval',
        description: 'Prepare-se para dançar samba por horas',
        exercises: [
          { name: 'Agachamento com pulo', sets: 3, reps: 15 },
          { name: 'Elevação de pernas', sets: 3, reps: 20 },
          { name: 'Dança aeróbica', duration: 30 }
        ],
        music: ['samba', 'funk', 'pagode']
      }
    };
    
    return holidayWorkouts[holiday];
  }
}
```

3. **Telemedicina Integrada**
```typescript
// src/backend/src/services/telemedicine.service.ts
export class TelemedicineService {
  async scheduleTelemedicineAppointment(tenantId: string, appointment: TelemedicineAppointment) {
    const telemedicineAppointment = await TelemedicineAppointment.create({
      tenantId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      type: appointment.type,
      scheduledAt: appointment.scheduledAt,
      platform: 'zoom',
      meetingLink: await this.generateMeetingLink(),
      status: 'scheduled'
    });
    
    return telemedicineAppointment;
  }
}
```

4. **E-commerce de Suplementos**
```typescript
// src/backend/src/services/ecommerce.service.ts
export class EcommerceService {
  async createBrazilianSupplementsStore(tenantId: string) {
    const supplements = [
      {
        name: 'Whey Protein Nacional',
        brand: 'Growth',
        price: 89.90,
        category: 'protein',
        description: 'Proteína do soro do leite brasileira',
        inStock: true
      }
    ];
    
    return supplements;
  }
}
```

5. **Realidade Aumentada para Exercícios**
```typescript
// src/frontend/components/ar-workout-guide.tsx
export function ARWorkoutGuide({ exercise }: { exercise: Exercise }) {
  const [arActive, setArActive] = useState(false);
  
  const startARGuide = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const arToolkit = new ARToolkit({
      sourceType: 'webcam',
      onSourceReady: () => {
        setArActive(true);
        loadExerciseARModel(exercise);
      }
    });
  };
  
  return (
    <div className="ar-workout-guide">
      <Button onClick={startARGuide} className="ar-button">
        🥽 Iniciar Guia AR
      </Button>
    </div>
  );
}
```

**Tarefas Técnicas:**
- [ ] Implementar sistema de gamificação brasileira
- [ ] Criar integração cultural nacional
- [ ] Desenvolver telemedicina integrada
- [ ] Implementar e-commerce de suplementos
- [ ] Criar realidade aumentada para exercícios
- [ ] Integração com Spotify para música brasileira
- [ ] Sistema de análise de sentimento
- [ ] Blockchain para certificações
- [ ] IA para prevenção de lesões
- [ ] Sistema de sustentabilidade ESG

#### **Sprint 7: Admin Dashboard + Deploy Final (Semanas 21-24)**

**Objetivos:**
- Painel administrativo completo
- Deploy final para produção
- Monitoramento e alertas

**Entregáveis:**

1. **Admin Dashboard**
```typescript
// src/frontend/app/admin/page.tsx
export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.getAdminStats()
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Painel Administrativo FitOS</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total de Academias" value={stats?.totalTenants} />
          <StatCard title="Receita Mensal" value={`R$ ${stats?.monthlyRevenue}`} />
          <StatCard title="Usuários Ativos" value={stats?.activeUsers} />
          <StatCard title="Churn Rate" value={`${stats?.churnRate}%`} />
        </div>
        
        {/* Tenants Management */}
        <TenantsTable tenants={stats?.tenants} />
      </div>
    </div>
  );
}
```

2. **Deploy Automatizado**
```bash
# scripts/auto-deploy.sh
- Backup da imagem atual
- Pull da nova imagem
- Parar containers atuais
- Executar migrações de banco
- Iniciar novos containers
- Health check
- Rollback automático se falhar
```

3. **Monitoramento**
```yaml
# Configuração de monitoramento
- Health checks automáticos
- Alertas Slack/Email
- Métricas de performance
- Logs centralizados
- Uptime monitoring
```

**Tarefas Técnicas:**
- [ ] Implementar Admin Dashboard
- [ ] Configurar monitoramento
- [ ] Setup alertas automáticos
- [ ] Deploy final para produção
- [ ] Testes de carga
- [ ] Documentação final

---

## 🐳 **CONFIGURAÇÃO DOCKER**

### **Dockerfile Multi-Stage**
```dockerfile
# FitOS SaaS - Multi-Tenant Application
# Multi-stage build para Frontend + Backend + SaaS Features

# Stage 1: Build Frontend (Next.js)
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY src/frontend/package*.json ./src/frontend/
RUN npm ci --only=production
COPY src/frontend ./src/frontend
COPY src/shared ./src/shared
WORKDIR /app/src/frontend
RUN npm run build

# Stage 2: Build Backend (Node.js + Express + SaaS)
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY src/backend/package*.json ./src/backend/
RUN npm ci --only=production
COPY src/backend ./src/backend
COPY src/shared ./src/shared
WORKDIR /app/src/backend
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl postgresql-client
RUN addgroup -g 1001 -S nodejs && adduser -S fitos -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=frontend-builder /app/src/frontend/.next ./src/frontend/.next
COPY --from=frontend-builder /app/src/frontend/public ./src/frontend/public
COPY --from=backend-builder /app/src/backend/dist ./src/backend/dist
COPY src/shared ./src/shared
COPY scripts/start.sh ./start.sh
RUN chmod +x ./start.sh
RUN chown -R fitos:nodejs /app
USER fitos
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["./start.sh"]
```

### **Docker Compose Produção**
```yaml
version: '3.8'

services:
  fitos-app:
    image: fitos:production-latest
    container_name: fitos-app
    environment:
      DATABASE_URL: postgresql://fitos:${POSTGRES_PASSWORD}@postgres:5432/fitos
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      MERCADOPAGO_ACCESS_TOKEN: ${MERCADOPAGO_ACCESS_TOKEN}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - fitos_uploads:/app/uploads
      - fitos_logs:/app/logs
    networks:
      - fitos-network
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: fitos-postgres
    environment:
      POSTGRES_DB: fitos
      POSTGRES_USER: fitos
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fitos-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: fitos-redis
    volumes:
      - redis_data:/data
    networks:
      - fitos-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  fitos_uploads:
  fitos_logs:

networks:
  fitos-network:
    driver: bridge
```

---

## 🔄 **CI/CD PIPELINE**

### **GitHub Actions CI**
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [develop]

jobs:
  test-and-quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: fitos_test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: |
          npm ci
          cd src/backend && npm ci
          cd ../frontend && npm ci
      - name: Lint Backend
        run: cd src/backend && npm run lint
      - name: Lint Frontend
        run: cd src/frontend && npm run lint
      - name: Run Backend Tests
        run: cd src/backend && npm run test:coverage
      - name: Run Frontend Tests
        run: cd src/frontend && npm run test:coverage
      - name: Build Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile
          push: true
          tags: fitos:${{ github.sha }},fitos:latest
```

### **GitHub Actions CD**
```yaml
# .github/workflows/cd.yml
name: CD Pipeline - Production Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Build production image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile
          push: true
          tags: fitos:production-${{ github.sha }},fitos:production-latest
      - name: Deploy to Production VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USERNAME }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/fitos
            docker-compose down
            docker pull fitos:production-${{ github.sha }}
            docker tag fitos:production-${{ github.sha }} fitos:production-latest
            docker-compose up -d
            sleep 30
            curl -f http://localhost:3000/api/health || exit 1
```

---

## 💰 **MODELO DE NEGÓCIO**

### **Planos de Assinatura**
```typescript
const plans = {
  starter: {
    price: 99, // R$/mês
    maxMembers: 50,
    maxTrainers: 2,
    maxNutritionists: 1,
    maxCRMContacts: 100,
    features: [
      'Coach AI', 
      'Dashboard básico', 
      'Até 50 membros', 
      '1 nutricionista',
      'CRM básico (100 contatos)',
      'Agendamento integrado'
    ]
  },
  professional: {
    price: 299, // R$/mês
    maxMembers: 200,
    maxTrainers: 5,
    maxNutritionists: 3,
    maxCRMContacts: 500,
    features: [
      'Todos os AI Agents', 
      'Wearables', 
      'Marketplace', 
      'Até 200 membros', 
      'Até 3 nutricionistas',
      'CRM completo (500 contatos)',
      'Automação de follow-ups',
      'Pipeline de vendas',
      'Campanhas automáticas',
      'Analytics avançado'
    ]
  },
  enterprise: {
    price: 599, // R$/mês
    maxMembers: -1, // Unlimited
    maxTrainers: -1, // Unlimited
    maxNutritionists: -1, // Unlimited
    maxCRMContacts: -1, // Unlimited
    features: [
      'Computer Vision', 
      'White Label', 
      'Suporte 24/7', 
      'Membros ilimitados', 
      'Nutricionistas ilimitados',
      'CRM ilimitado',
      'AI CRM Analytics',
      'Integração API completa',
      'Campanhas personalizadas ilimitadas',
      'Relatórios customizados'
    ]
  }
};
```

### **Receitas Adicionais**
```typescript
const additionalRevenue = {
  marketplaceCommission: {
    nutritionServices: '15%', // Comissão em consultas nutricionais
    mealPlans: '10%', // Comissão em planos alimentares
    supplements: '5%' // Comissão em suplementos
  },
  premiumFeatures: {
    advancedAnalytics: 'R$ 49/mês',
    whiteLabelNutrition: 'R$ 99/mês',
    apiAccess: 'R$ 199/mês'
  }
};
```

### **Projeção de Receita Expandida**

**Receita Base (Planos):**
- **Ano 1**: 50 academias × R$ 250 médio = R$ 12.5k/mês
- **Ano 2**: 200 academias × R$ 350 médio = R$ 70k/mês
- **Ano 3**: 500 academias × R$ 450 médio = R$ 225k/mês

**Receitas Adicionais:**
- **Marketplace**: R$ 50k/mês (comissões em serviços nutricionais e suplementos)
- **CRM Premium** (upsell para planos superiores): R$ 30k/mês
  - 100 profissionais independentes × R$ 199/mês (CRM standalone)
  - 50 academias upgrade para plano superior pelo CRM

**Total Consolidado:**
- **Ano 1**: R$ 12.5k + R$ 5k (marketplace) = R$ 17.5k/mês
- **Ano 2**: R$ 70k + R$ 25k (marketplace) + R$ 15k (CRM) = R$ 110k/mês
- **Ano 3**: R$ 225k + R$ 50k (marketplace) + R$ 30k (CRM) = R$ 305k/mês

**Impacto do CRM:**
- Aumento da taxa de conversão de leads em 25%
- Redução de churn em 15% (melhor relacionamento com clientes)
- Aumento do ticket médio em 20% (upsell orientado por dados)

---

## 🚀 **COMANDOS DE DESENVOLVIMENTO - SELF-HOSTED**

### **Setup Inicial**
```bash
# Clone e setup
git clone <repo>
cd fitOS
npm install

# Configurar Docker Compose
cp docker-compose.yml.example docker-compose.yml
cp .env.example .env
# Editar .env com suas configurações

# Subir serviços self-hosted
docker-compose up -d

# Instalar modelos Ollama
docker exec -it ollama ollama pull llama2
docker exec -it ollama ollama pull codellama

# Setup banco de dados
npm run migrate:dev
npm run seed:dev
```

### **Desenvolvimento**
```bash
# Desenvolvimento local
npm run dev

# Verificar serviços
docker-compose ps

# Logs dos serviços
docker-compose logs -f ollama
docker-compose logs -f chroma
docker-compose logs -f postgres

# Restart de serviços
docker-compose restart ollama
docker-compose restart chroma

# Testes
npm run test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### **Deploy**
```bash
# Build local
npm run docker:build

# Deploy para staging
npm run deploy:staging

# Deploy para produção (via GitHub Actions)
git push origin main

# Deploy manual
docker-compose -f docker-compose.prod.yml up -d
```

### **Monitoramento**
```bash
# Acessar interfaces
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
# Jaeger: http://localhost:16686
# MinIO: http://localhost:9001
# Sentry: http://localhost:9000

# Backup
./scripts/backup.sh

# Health check
curl http://localhost:3000/api/health
```

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Ciclo 1 - MVP**
- [ ] 3 academias piloto ativas
- [ ] 100 usuários cadastrados
- [ ] 80% uptime
- [ ] Tempo de resposta < 2s
- [ ] Deploy automático funcionando

### **Ciclo 2 - Expansão**
- [ ] 10 academias ativas
- [ ] 500 usuários cadastrados
- [ ] 95% uptime
- [ ] NPS > 50
- [ ] Receita recorrente > R$ 10k/mês

### **Ciclo 3 - Escala**
- [ ] 50 academias ativas
- [ ] 2000 usuários cadastrados
- [ ] 99% uptime
- [ ] Receita recorrente > R$ 100k/mês

---

## 🔧 **CONFIGURAÇÕES NECESSÁRIAS**

### **GitHub Secrets**
```bash
# Docker Registry
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password

# Production VPS
PRODUCTION_HOST=your-vps-ip
PRODUCTION_USERNAME=ubuntu
PRODUCTION_SSH_KEY=your-private-ssh-key

# Application Secrets
OPENAI_API_KEY=sk-your-openai-api-key
MERCADOPAGO_ACCESS_TOKEN=APP_USR_your-access-token
JWT_SECRET=your-super-secret-jwt-key
POSTGRES_PASSWORD=your-secure-postgres-password

# Monitoring
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### **Variáveis de Ambiente**
```bash
# Database
DATABASE_URL=postgresql://fitos:password@postgres:5432/fitos
REDIS_URL=redis://redis:6379

# API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR_your-access-token
MERCADOPAGO_PUBLIC_KEY=APP_USR_your-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret

# JWT
JWT_SECRET=your-super-secret-jwt-key

# App Config
NODE_ENV=production
PORT_BACKEND=3001
PORT_FRONTEND=3000

# Multi-tenant
DEFAULT_DOMAIN=fitos.com
```

---

## 📚 **RECURSOS E DOCUMENTAÇÃO**

### **Links Úteis**
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Mercado Pago API Documentation](https://www.mercadopago.com.br/developers/pt/docs)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### **Ferramentas de Desenvolvimento**
- **IDE**: VS Code com extensões TypeScript, Prisma, Docker
- **API Testing**: Postman ou Insomnia
- **Database**: pgAdmin ou DBeaver
- **Monitoring**: Sentry, DataDog
- **Version Control**: Git + GitHub

---

## 🎯 **PRÓXIMOS PASSOS**

### **Imediatos (Semana 1)**
1. [ ] Configurar repositório GitHub
2. [ ] Setup GitHub Actions workflows
3. [ ] Configurar variáveis de ambiente
4. [ ] Setup banco de dados local
5. [ ] Primeiro commit e deploy

### **Curto Prazo (Semanas 2-4)**
1. [ ] Implementar multi-tenancy
2. [ ] Integrar Mercado Pago
3. [ ] Criar interface de onboarding
4. [ ] Deploy para staging

### **Médio Prazo (Semanas 5-8)**
1. [ ] Implementar IA Multiagente
2. [ ] Integrar wearables
3. [ ] Dashboard preditivo
4. [ ] Deploy para produção

### **Longo Prazo (Semanas 9-12)**
1. [ ] Admin dashboard
2. [ ] Monitoramento completo
3. [ ] Testes de carga
4. [ ] Documentação final

---

**Este roadmap é o documento definitivo para implementação do FitOS. Todas as modificações e melhorias foram consolidadas neste arquivo único para consulta durante todo o desenvolvimento.**
