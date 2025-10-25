import { sharedConfig } from '../../../shared/config/env';

export const config = {
  // Server
  port: sharedConfig.server.port,
  nodeEnv: sharedConfig.server.nodeEnv,
  
  // Database
  database: {
    url: sharedConfig.database.url,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
  },

  // Redis
  redis: {
    url: sharedConfig.redis.url,
    password: sharedConfig.redis.password,
    db: sharedConfig.redis.db,
  },

  // JWT
  jwt: {
    secret: sharedConfig.jwt.secret,
    expiresIn: sharedConfig.jwt.expiresIn,
    refreshExpiresIn: sharedConfig.jwt.refreshExpiresIn,
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:3001"],
  },

  // AI Services
  ai: sharedConfig.ai,

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
      pass: process.env.EMAIL_PASS, // App Password do Gmail
    },
    from: process.env.EMAIL_FROM || 'noreply@fitos.com',
    // Configurações específicas do Gmail
    service: 'gmail',
    tls: {
      rejectUnauthorized: false,
    },
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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10), // limit each IP to 1000 requests per windowMs (increased for development)
  },

  // Multi-tenant
  tenant: {
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3000',
    subdomainPattern: process.env.SUBDOMAIN_PATTERN || '*.localhost:3000',
  },
};
