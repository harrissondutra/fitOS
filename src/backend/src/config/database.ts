import { PrismaClient } from '@prisma/client';
import { config } from './config-simple';
import { logger } from '../utils/logger';
// import dotenv from 'dotenv';

// Carregar .env da raiz do projeto - DESABILITADO TEMPORARIAMENTE
// dotenv.config({ path: '../../.env' });

let prisma: PrismaClient;

// Sistema de throttle para evitar spam de logs de erro
let lastConnectionErrorLog = 0;
const CONNECTION_ERROR_LOG_INTERVAL = 60000; // Log apenas a cada 60 segundos

function shouldLogConnectionError(): boolean {
  const now = Date.now();
  if (now - lastConnectionErrorLog > CONNECTION_ERROR_LOG_INTERVAL) {
    lastConnectionErrorLog = now;
    return true;
  }
  return false;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    // Configurar URL do banco com parâmetros de pool otimizados
    const databaseUrl = process.env.DATABASE_URL || config.database.url;

    // Pool otimizado com limites maiores para evitar P2024 timeout
    const isDev = config.nodeEnv === 'development';
    const connectionLimit = isDev ? 20 : 20;  // Aumentado: 20 conexões em dev, 20 em prod
    const poolTimeout = isDev ? 20 : 60;      // Timeout maior para aguardar conexões disponíveis
    const connectTimeout = isDev ? 20 : 30;   // Timeout de conexão maior

    // Adicionar parâmetros de pool na URL
    const baseParams = `connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;
    const urlWithPool = databaseUrl.includes('?')
      ? `${databaseUrl}&${baseParams}`
      : `${databaseUrl}?${baseParams}`;

    // Configuração de logs otimizada
    const logConfig: any[] = [
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ];

    // Adicionar logs de query apenas se DEBUG_QUERIES=true
    if (process.env.DEBUG_QUERIES === 'true') {
      logConfig.push({
        emit: 'event',
        level: 'query',
      });
    }

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: urlWithPool,
        },
      },
      log: logConfig,
    });

    // Log database queries apenas em modo DEBUG
    if (process.env.DEBUG_QUERIES === 'true') {
      (prisma as any).$on('query', (e: any) => {
        logger.query(e.query, e.params, e.duration);
      });
    }

    // Log database errors (downgrade idempotent RLS policy duplicates to info)
    (prisma as any).$on('error', (e: any) => {
      const msg: string = e?.message || '';
      const code: string = e?.meta?.code || e?.code || '';
      const errorCode = e?.errorCode || '';

      // Ignorar erros de RLS policy duplicados
      const isRlsDuplicate = code === '42710' || /already exists/i.test(msg);
      if (isRlsDuplicate && /policy|apply_tenant_rls_policies/i.test(msg)) {
        logger.info('ℹ️ Skipping duplicate RLS policy error:', { code, message: msg });
        return;
      }

      // Throttle logs de erros de conexão (P1001, P1017, P2037)
      const isConnectionError = errorCode === 'P1001' || errorCode === 'P1017' || errorCode === 'P2037' ||
        /Can't reach database server/i.test(msg) ||
        /Server has closed the connection/i.test(msg) ||
        /too many clients/i.test(msg);

      if (isConnectionError) {
        if (shouldLogConnectionError()) {
          logger.error('❌ Database connection error (too many clients):', {
            errorCode,
            message: msg.substring(0, 200),
            hint: 'Verifique se múltiplas instâncias do PrismaClient estão sendo criadas. Use getPrismaClient() singleton.'
          });
        }
        return; // Não logar erro completo para evitar spam
      }

      logger.error('Database error:', e);
    });

    // Log warnings
    (prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning:', e);
    });

    // Test connection
    await prisma.$connect();
    logger.info('✅ Prisma connected');

    // Marcar como conectado e atualizar instância global
    isConnected = true;
    prismaInstance = prisma;
    // Atualizar globalThis para garantir singleton mesmo em hot reload
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaInstance = prisma;

    // Em desenvolvimento, garantir que a instância persista após hot reload
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prisma;
    }

    // RLS policies will be applied automatically by migrations
    // No need to execute SET search_path - Prisma multiSchema handles this automatically

    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma?.$disconnect();
    logger.info('✅ Database disconnected');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
    throw error;
  }
};

// Cache da instância do Prisma para lazy loading
let prismaInstance: PrismaClient | null = null;
let isConnected = false;
let isConnecting = false;
let lastReconnectAttempt = 0;
const RECONNECT_ATTEMPT_INTERVAL = 30000; // Tentar reconectar apenas a cada 30 segundos

// Garantir singleton global usando globalThis (recomendado pelo Prisma para hot reload)
// Isso previne múltiplas instâncias mesmo em desenvolvimento com hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaInstance: PrismaClient | null;
};

export const getPrismaClient = (): PrismaClient => {
  // Simplificação: Retornar estritamente a instância global se existir
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Se não existir, criar nova instância
  const baseUrl = process.env.DATABASE_URL || config.database.url;

  // Configuração otimizada para evitar exaustão de conexões
  // Em desenvolvimento, manter pool pequeno pois hot-reload pode duplicar conexões momentaneamente
  const isDev = config.nodeEnv === 'development';
  const connectionLimit = isDev ? 20 : 20; // Reduzido em dev para segurança
  const poolTimeout = isDev ? 20 : 60; // Timeout menor em dev para falhar rápido e retentar
  const connectTimeout = isDev ? 20 : 30;

  const urlWithPool = baseUrl.includes('?')
    ? `${baseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`
    : `${baseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;

  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: urlWithPool,
      },
    },
    // Log apenas erros críticos em produção, mais detalhes em dev
    log: isDev
      ? ['query', 'info', 'warn', 'error']
      : ['error', 'warn'],
  });

  // Salvar na global imediatamente
  globalForPrisma.prisma = prismaInstance;
  globalForPrisma.prismaInstance = prismaInstance;

  return prismaInstance;
};