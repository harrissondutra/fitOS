import { PrismaClient } from '@prisma/client';
import { config } from './config-simple';
import { logger } from '../utils/logger';
// import dotenv from 'dotenv';

// Carregar .env da raiz do projeto - DESABILITADO TEMPORARIAMENTE
// dotenv.config({ path: '../../.env' });

let prisma: PrismaClient;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Configurar URL do banco com parâmetros de pool otimizados
    const databaseUrl = process.env.DATABASE_URL || config.database.url;
    
    // Pool otimizado: menos conexões em dev, mais em prod
    const isDev = config.nodeEnv === 'development';
    const connectionLimit = isDev ? 5 : 20;
    const poolTimeout = isDev ? 30 : 60;
    const connectTimeout = isDev ? 30 : 60;
    
    const urlWithPool = databaseUrl.includes('?') 
      ? `${databaseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`
      : `${databaseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;

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

    // Log database errors
    (prisma as any).$on('error', (e: any) => {
      logger.error('Database error:', e);
    });

    // Log warnings
    (prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning:', e);
    });

    // Test connection
    await prisma.$connect();
    
    // Set search path to fitos schema
    await prisma.$executeRaw`SET search_path TO fitos, public;`;
    
    // Marcar como conectado
    isConnected = true;
    prismaInstance = prisma;
    
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

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    // Lazy loading: criar instância apenas quando necessário
    logger.debug('Creating PrismaClient instance (lazy loading)');
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || config.database.url,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
  }
  
  // Se não está conectado, tentar conectar
  if (!isConnected) {
    logger.debug('PrismaClient not connected, attempting connection...');
    prismaInstance.$connect().then(() => {
      isConnected = true;
      logger.debug('PrismaClient connected successfully');
    }).catch((error) => {
      logger.error('Failed to connect PrismaClient:', error);
    });
  }
  
  return prismaInstance;
};