import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export const connectDatabase = async (): Promise<void> => {
  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (config.nodeEnv === 'development') {
      (prisma as any).$on('query', (e: any) => {
        logger.debug('Query: ' + e.query);
        logger.debug('Params: ' + e.params);
        logger.debug('Duration: ' + e.duration + 'ms');
      });
    }

    // Log database errors
    (prisma as any).$on('error', (e: any) => {
      logger.error('Database error:', e);
    });

    // Test connection
    await prisma.$connect();
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

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return prisma;
};
