# FitOS - Configurações Técnicas Complementares
## Arquivo de Referência para Desenvolvimento

**Este arquivo contém todas as configurações técnicas específicas necessárias para implementação.**

---

## 🗄️ **SCHEMA DE BANCO DE DADOS**

### **Tabelas Principais**

```sql
-- Tabela de Tenants (Organizações)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_email VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Usuários (com tenant_id)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- owner, admin, trainer, member
  profile JSONB NOT NULL DEFAULT '{}',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Tabela de Membros (com tenant_id)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  membership_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  biometric_data JSONB DEFAULT '{}',
  goals JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Treinos (com tenant_id)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  feedback JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Sessões de Chat IA
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL, -- coach, nutrition, business
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Dados Biométricos
CREATE TABLE biometric_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL, -- heart_rate, hrv, sleep, steps
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMP NOT NULL,
  source VARCHAR(50) NOT NULL, -- apple_health, google_fit, manual
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Predições de Churn
CREATE TABLE churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  churn_probability DECIMAL(5,4) NOT NULL,
  risk_factors JSONB NOT NULL DEFAULT '[]',
  suggested_actions JSONB NOT NULL DEFAULT '[]',
  predicted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_members_tenant_id ON members(tenant_id);
CREATE INDEX idx_workouts_tenant_member ON workouts(tenant_id, member_id);
CREATE INDEX idx_biometric_data_member_date ON biometric_data(member_id, recorded_at);
CREATE INDEX idx_churn_predictions_tenant ON churn_predictions(tenant_id);
```

---

## 🔧 **CONFIGURAÇÕES DE AMBIENTE**

### **Desenvolvimento (.env.development)**
```bash
# Database
DATABASE_URL=postgresql://fitos:fitos123@localhost:5432/fitos_dev
REDIS_URL=redis://localhost:6379

# API Keys (usar chaves de teste)
OPENAI_API_KEY=sk-test-your-openai-api-key
ANTHROPIC_API_KEY=test-your-anthropic-api-key

# Stripe (modo teste)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_test_your-webhook-secret

# JWT
JWT_SECRET=dev-super-secret-jwt-key

# App Config
NODE_ENV=development
PORT_BACKEND=3001
PORT_FRONTEND=3000

# Multi-tenant
DEFAULT_DOMAIN=localhost:3000

# External APIs (sandbox)
APPLE_HEALTH_API_URL=https://api.apple.com/health/sandbox
GOOGLE_FIT_API_URL=https://www.googleapis.com/fitness/v1/sandbox
```

### **Produção (.env.production)**
```bash
# Database
DATABASE_URL=postgresql://fitos:${POSTGRES_PASSWORD}@postgres:5432/fitos
REDIS_URL=redis://redis:6379

# API Keys (chaves de produção)
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Stripe (modo produção)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# JWT
JWT_SECRET=${JWT_SECRET}

# App Config
NODE_ENV=production
PORT_BACKEND=3001
PORT_FRONTEND=3000

# Multi-tenant
DEFAULT_DOMAIN=fitos.com

# External APIs (produção)
APPLE_HEALTH_API_URL=https://api.apple.com/health
GOOGLE_FIT_API_URL=https://www.googleapis.com/fitness/v1

# Deployment info
APP_VERSION=${APP_VERSION}
DEPLOY_DATE=${DEPLOY_DATE}
```

---

## 🧪 **CONFIGURAÇÕES DE TESTE**

### **Jest Setup Backend**
```typescript
// src/backend/src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fitos_test'
    }
  }
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Limpar dados de teste
  await prisma.aiSession.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
});

export { prisma };
```

### **Jest Setup Frontend**
```typescript
// src/frontend/jest.setup.js
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
```

---

## 🔐 **CONFIGURAÇÕES DE SEGURANÇA**

### **Helmet Configuration**
```typescript
// src/backend/src/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

### **Rate Limiting**
```typescript
// src/backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});
```

---

## 📊 **CONFIGURAÇÕES DE MONITORAMENTO**

### **Sentry Configuration**
```typescript
// src/backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

export { Sentry };
```

### **Logging Configuration**
```typescript
// src/backend/src/config/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fitos-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export { logger };
```

---

## 🚀 **SCRIPTS DE DEPLOY**

### **Deploy Staging**
```bash
#!/bin/bash
# scripts/deploy-staging.sh

set -e

echo "🚀 Deploying to staging..."

# Build and push image
docker build -f docker/Dockerfile -t fitos:staging .
docker tag fitos:staging fitos:staging-$(date +%Y%m%d-%H%M%S)

# Deploy to staging server
ssh staging-server "cd /opt/fitos && docker-compose -f docker-compose.staging.yml up -d"

echo "✅ Staging deploy completed!"
```

### **Health Check Script**
```bash
#!/bin/bash
# scripts/health-check.sh

set -e

HEALTH_URL="http://localhost:3000/api/health"
MAX_ATTEMPTS=10
ATTEMPT=1

echo "🏥 Starting health check..."

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."
  
  if curl -f $HEALTH_URL >/dev/null 2>&1; then
    echo "✅ Health check passed!"
    exit 0
  fi
  
  echo "⏳ Waiting 10 seconds..."
  sleep 10
  ATTEMPT=$((ATTEMPT + 1))
done

echo "❌ Health check failed after $MAX_ATTEMPTS attempts"
exit 1
```

---

## 📱 **CONFIGURAÇÕES PWA**

### **Service Worker**
```typescript
// src/frontend/public/sw.js
const CACHE_NAME = 'fitos-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/api/workouts/offline',
  '/api/health'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna cache se disponível, senão busca na rede
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### **Manifest PWA**
```json
{
  "name": "FitOS - Fitness Operating System",
  "short_name": "FitOS",
  "description": "Sistema completo de gestão de academias com IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔧 **CONFIGURAÇÕES DE DESENVOLVIMENTO**

### **VS Code Settings**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.prisma": "prisma"
  },
  "prisma.showPrismaDataPlatformNotification": false
}
```

### **ESLint Configuration**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  ignorePatterns: ['node_modules/', '.next/', 'dist/']
};
```

### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

---

**Este arquivo complementar contém todas as configurações técnicas específicas necessárias para implementação completa do FitOS. Use em conjunto com o roadmap principal.**
