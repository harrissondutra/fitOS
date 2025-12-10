// Load environment variables FIRST
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '../../.env' });

// Configuração simples
export const config = {
  // Server
  port: parseInt(process.env.PORT || process.env.PORT_BACKEND || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Environment flags
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fitos',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
  },

  // AI Services
  ai: {
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
    },
    chroma: {
      baseUrl: process.env.CHROMA_BASE_URL || 'http://localhost:8000',
      collection: process.env.CHROMA_COLLECTION || 'fitos-knowledge',
    },
  },

  // External APIs
  external: {
    appleHealth: {
      apiUrl: process.env.APPLE_HEALTH_API_URL,
      clientId: process.env.APPLE_HEALTH_CLIENT_ID,
      clientSecret: process.env.APPLE_HEALTH_CLIENT_SECRET,
    },
    googleFit: {
      apiUrl: process.env.GOOGLE_FIT_API_URL,
      clientId: process.env.GOOGLE_FIT_CLIENT_ID,
      clientSecret: process.env.GOOGLE_FIT_CLIENT_SECRET,
    },
  },

  // Payment Gateways
  payments: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    mercadoPago: {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    },
  },

  // File Storage
  storage: {
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      bucket: process.env.MINIO_BUCKET || 'fitos',
    },
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    from: process.env.EMAIL_FROM || 'noreply@fitos.com',
    service: 'gmail',
    tls: {
      rejectUnauthorized: false,
    },
    resendApiKey: process.env.RESEND_API_KEY,
  },

  // Monitoring
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
    // Desabilitar rate limit em dev se configurado
    disabled: process.env.DISABLE_RATE_LIMIT_DEV === 'true' && (process.env.NODE_ENV || 'development') === 'development',
  },

  // Multi-tenant
  tenant: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3000',
    subdomainPattern: process.env.SUBDOMAIN_PATTERN || '*.localhost:3000',
  },

  // Cost Management
  costs: {
    redisCacheEnabled: process.env.COST_REDIS_CACHE_ENABLED === 'true',
    cacheTtl: parseInt(process.env.COST_CACHE_TTL || '3600', 10),
    alertEmailEnabled: process.env.COST_ALERT_EMAIL_ENABLED === 'true',
    reportScheduleEnabled: process.env.COST_REPORT_SCHEDULE_ENABLED === 'true',
    defaultCurrency: process.env.COST_DEFAULT_CURRENCY || 'BRL',
    alertThresholds: {
      warning: parseFloat(process.env.COST_ALERT_WARNING_THRESHOLD || '75'),
      critical: parseFloat(process.env.COST_ALERT_CRITICAL_THRESHOLD || '90'),
    },
  },
};



