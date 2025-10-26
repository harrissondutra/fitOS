/**
 * Laboratory Exam Service - FitOS Sprint 4
 * 
 * Gerencia exames laboratoriais dos clientes com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface LaboratoryExamCreateInput {
  tenantId: string;
  clientId: string;
  examType: string; // blood, urine, etc
  examName: string;
  examDate: Date;
  labName?: string;
  doctorName?: string;
  notes?: string;
  imageUrl?: string;
}

export interface LaboratoryExamUpdateInput extends Partial<LaboratoryExamCreateInput> {
  id: string;
}

export interface ExamResultCreateInput {
  examId: string;
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status?: string; // normal, high, low
  notes?: string;
}

export interface LaboratoryExamFilters {
  clientId: string;
  examType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ExamAnalysisResult {
  examId: string;
  analysisType: string;
  inputData: any;
  outputData: any;
  confidence?: number;
  status: string;
  errorMessage?: string;
}

export class LaboratoryExamService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo exame laboratorial
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createExam(data: LaboratoryExamCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const exam = await this.prisma.laboratoryExam.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          examType: data.examType,
          examName: data.examName,
          examDate: data.examDate,
          labName: data.labName,
          doctorName: data.doctorName,
          notes: data.notes,
          imageUrl: data.imageUrl
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          results: true,
          labAnalysis: true
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateExamCache(data.clientId);

      logger.info(`✅ Laboratory exam created: ${exam.examName} for ${exam.client.user.name} (${exam.id})`);
      return exam;
    } catch (error) {
      logger.error('Error creating laboratory exam:', error);
      throw error;
    }
  }

  /**
   * Busca exame por ID com cache
   */
  async getExamById(id: string) {
    const cacheKey = `laboratory-exam:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Laboratory exam by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Laboratory exam by ID: ${id}`);
      const exam = await this.prisma.laboratoryExam.findUnique({
        where: { id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          results: {
            orderBy: { parameter: 'asc' }
          },
          labAnalysis: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // 3. Cachear se encontrado
      if (exam) {
        await this.redis.set(cacheKey, exam, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
        });
      }

      return exam;
    } catch (error) {
      logger.error('Error getting laboratory exam by ID:', error);
      throw error;
    }
  }

  /**
   * Busca exames do cliente com filtros e cache
   */
  async getClientExams(filters: LaboratoryExamFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Client laboratory exams: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Client laboratory exams: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const exams = await this.prisma.laboratoryExam.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          results: {
            orderBy: { parameter: 'asc' }
          },
          labAnalysis: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { examDate: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, exams, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
      });

      return exams;
    } catch (error) {
      logger.error('Error getting client laboratory exams:', error);
      throw error;
    }
  }

  /**
   * Adiciona resultado ao exame
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async addExamResult(data: ExamResultCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const result = await this.prisma.examResult.create({
        data: {
          examId: data.examId,
          parameter: data.parameter,
          value: data.value,
          unit: data.unit,
          referenceRange: data.referenceRange,
          status: data.status,
          notes: data.notes
        },
        include: {
          exam: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateExamCache(result.exam.clientId, data.examId);

      logger.info(`✅ Exam result added: ${result.parameter} = ${result.value} (${result.id})`);
      return result;
    } catch (error) {
      logger.error('Error adding exam result:', error);
      throw error;
    }
  }

  /**
   * Atualiza exame laboratorial
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateExam(data: LaboratoryExamUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.examType) updateData.examType = data.examType;
      if (data.examName) updateData.examName = data.examName;
      if (data.examDate) updateData.examDate = data.examDate;
      if (data.labName !== undefined) updateData.labName = data.labName;
      if (data.doctorName !== undefined) updateData.doctorName = data.doctorName;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      const exam = await this.prisma.laboratoryExam.update({
        where: { id: data.id },
        data: updateData,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          results: {
            orderBy: { parameter: 'asc' }
          },
          labAnalysis: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateExamCache(exam.clientId, exam.id);

      logger.info(`✅ Laboratory exam updated: ${exam.examName} (${exam.id})`);
      return exam;
    } catch (error) {
      logger.error('Error updating laboratory exam:', error);
      throw error;
    }
  }

  /**
   * Remove exame laboratorial
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteExam(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const exam = await this.prisma.laboratoryExam.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateExamCache(exam.clientId, exam.id);

      logger.info(`✅ Laboratory exam deleted: ${exam.examName} (${exam.id})`);
      return exam;
    } catch (error) {
      logger.error('Error deleting laboratory exam:', error);
      throw error;
    }
  }

  /**
   * Inicia análise de exame com IA
   */
  async startExamAnalysis(examId: string, analysisType: string, inputData: any) {
    try {
      const analysis = await this.prisma.labExamAnalysis.create({
        data: {
          examId,
          analysisType,
          inputData,
          outputData: {},
          status: 'processing'
        }
      });

      // Invalidar cache
      await this.invalidateExamCache(null, examId);

      logger.info(`✅ Exam analysis started: ${analysisType} for exam ${examId} (${analysis.id})`);
      return analysis;
    } catch (error) {
      logger.error('Error starting exam analysis:', error);
      throw error;
    }
  }

  /**
   * Completa análise de exame com IA
   */
  async completeExamAnalysis(analysisId: string, outputData: any, confidence?: number, errorMessage?: string) {
    try {
      const analysis = await this.prisma.labExamAnalysis.update({
        where: { id: analysisId },
        data: {
          outputData,
          confidence,
          status: errorMessage ? 'failed' : 'completed',
          errorMessage
        },
        include: {
          exam: {
            include: {
              client: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Invalidar cache
      await this.invalidateExamCache(analysis.exam.clientId, analysis.examId);

      logger.info(`✅ Exam analysis completed: ${analysis.analysisType} (${analysis.id})`);
      return analysis;
    } catch (error) {
      logger.error('Error completing exam analysis:', error);
      throw error;
    }
  }

  /**
   * Busca análises de exame
   */
  async getExamAnalyses(examId: string) {
    const cacheKey = `laboratory-exam:analyses:${examId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Exam analyses: ${examId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Exam analyses: ${examId}`);
      const analyses = await this.prisma.labExamAnalysis.findMany({
        where: { examId },
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, analyses, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_LAB_ANALYSIS || '300')
      });

      return analyses;
    } catch (error) {
      logger.error('Error getting exam analyses:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de exames
   */
  async getExamStats(clientId: string) {
    const cacheKey = `laboratory-exam:stats:${clientId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Laboratory exam stats: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Laboratory exam stats: ${clientId}`);
      
      const [
        totalExams,
        bloodExams,
        urineExams,
        otherExams,
        totalResults,
        abnormalResults,
        totalAnalyses,
        completedAnalyses
      ] = await Promise.all([
        this.prisma.laboratoryExam.count({
          where: { clientId }
        }),
        this.prisma.laboratoryExam.count({
          where: { clientId, examType: 'blood' }
        }),
        this.prisma.laboratoryExam.count({
          where: { clientId, examType: 'urine' }
        }),
        this.prisma.laboratoryExam.count({
          where: { 
            clientId,
            examType: { notIn: ['blood', 'urine'] }
          }
        }),
        this.prisma.examResult.count({
          where: { exam: { clientId } }
        }),
        this.prisma.examResult.count({
          where: { 
            exam: { clientId },
            status: { in: ['high', 'low'] }
          }
        }),
        this.prisma.labExamAnalysis.count({
          where: { exam: { clientId } }
        }),
        this.prisma.labExamAnalysis.count({
          where: { 
            exam: { clientId },
            status: 'completed'
          }
        })
      ]);

      const stats = {
        exams: {
          total: totalExams,
          blood: bloodExams,
          urine: urineExams,
          other: otherExams
        },
        results: {
          total: totalResults,
          abnormal: abnormalResults,
          normalRate: totalResults > 0 ? Math.round(((totalResults - abnormalResults) / totalResults) * 100) : 0
        },
        analyses: {
          total: totalAnalyses,
          completed: completedAnalyses,
          completionRate: totalAnalyses > 0 ? Math.round((completedAnalyses / totalAnalyses) * 100) : 0
        }
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting laboratory exam stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: LaboratoryExamFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof LaboratoryExamFilters]}`)
      .join('|');
    
    return `laboratory-exam:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: LaboratoryExamFilters) {
    const where: any = {
      clientId: filters.clientId
    };

    if (filters.examType) {
      where.examType = filters.examType;
    }

    if (filters.startDate || filters.endDate) {
      where.examDate = {};
      if (filters.startDate) {
        where.examDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.examDate.lte = filters.endDate;
      }
    }

    return where;
  }

  /**
   * Invalida cache de exames laboratoriais
   */
  private async invalidateExamCache(clientId?: string, examId?: string) {
    try {
      if (examId) {
        // Invalidar cache específico do exame
        await this.redis.del(`laboratory-exam:${examId}`, { namespace: 'nutrition' });
        await this.redis.del(`laboratory-exam:analyses:${examId}`, { namespace: 'nutrition' });
      }

      if (clientId) {
        // Invalidar cache específico do cliente
        await this.redis.invalidatePattern(`laboratory-exam:*clientId:${clientId}*`, { namespace: 'nutrition' });
        await this.redis.del(`laboratory-exam:stats:${clientId}`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('laboratory-exam:search:*', { namespace: 'nutrition' });

      logger.info('🗑️ Laboratory exam cache invalidated');
    } catch (error) {
      logger.error('Error invalidating laboratory exam cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.laboratoryExam.count();
      
      // Testar Redis
      const redisHealth = await this.redis.healthCheck();
      
      return {
        status: 'healthy',
        database: 'connected',
        redis: redisHealth.status,
        redisLatency: redisHealth.latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const laboratoryExamService = new LaboratoryExamService();
