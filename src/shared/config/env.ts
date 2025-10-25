// import dotenv from 'dotenv';
import path from 'path';

// Carregar .env da raiz do projeto - DESABILITADO TEMPORARIAMENTE
// const envPath = path.resolve(__dirname, '../../../.env');
// dotenv.config({ path: envPath });

// Garantir que as variáveis estão carregadas
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not found in environment variables');
}

// Configurações compartilhadas
export const sharedConfig = {
  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'fitos',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
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
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  },

  // Server
  server: {
    port: parseInt(process.env.PORT_BACKEND || '3001', 10),
    frontendPort: parseInt(process.env.PORT_FRONTEND || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Frontend
  frontend: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'FitOS',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Email
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@fitos.com',
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

  // Google Calendar OAuth
  google: {
    oauth: {
      clientId: process.env.GOOGLE_OAUTH_ID || '',
      clientSecret: process.env.GOOGLE_OAUTH_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google-calendar/callback',
    },
  },

  // WhatsApp Business API
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'twilio',
    phoneNumber: process.env.WHATSAPP_PHONE_NUMBER || '',
    apiKey: process.env.WHATSAPP_API_KEY || '',
    apiSecret: process.env.WHATSAPP_API_SECRET || '',
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
  },

  // SMS Service
  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio',
    accountSid: process.env.SMS_ACCOUNT_SID || '',
    authToken: process.env.SMS_AUTH_TOKEN || '',
    fromNumber: process.env.SMS_FROM_NUMBER || '',
  },

  // File Storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'cloudinary',
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dwmi8p7mo',
      apiKey: process.env.CLOUDINARY_API_KEY || '262953911313355',
      apiSecret: process.env.CLOUDINARY_API_SECRET || 'EJzZ3APhGl_Brg2qeigm4aramS8',
      url: process.env.CLOUDINARY_URL || 'cloudinary://262953911313355:EJzZ3APhGl_Brg2qeigm4aramS8@dwmi8p7mo',
    },
    s3: {
      bucket: process.env.S3_BUCKET || '',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    minio: {
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      bucket: process.env.MINIO_BUCKET || 'fitos',
    },
  },

  // Multi-tenant
  tenant: {
    defaultId: process.env.DEFAULT_TENANT_ID || 'default-tenant',
    defaultDomain: process.env.DEFAULT_DOMAIN || 'localhost:3000',
    subdomainPattern: process.env.SUBDOMAIN_PATTERN || '*.localhost:3000',
  },

  // Development flags
  development: {
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableGraphQLPlayground: process.env.ENABLE_GRAPHQL_PLAYGROUND === 'true',
  },
};

export default sharedConfig;

