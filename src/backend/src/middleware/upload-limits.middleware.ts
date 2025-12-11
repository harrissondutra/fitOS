import { Request, Response, NextFunction } from 'express';
import multer, { Multer } from 'multer';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { GlobalLimitsService } from '../services/global-limits.service';
import { IntegrationService } from '../services/integration.service';

const prisma = getPrismaClient();
const globalLimitsService = new GlobalLimitsService();
const integrationService = new IntegrationService();

// Configuração do multer para upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB por arquivo (será validado dinamicamente)
    files: 10 // máximo 10 arquivos por request
  },
  fileFilter: (req, file, cb) => {
    // Validação básica de tipo de arquivo será feita no middleware
    cb(null, true);
  }
});

// Interface para informações de upload
interface UploadInfo {
  tenantId: string;
  userId: string;
  fileSize: number;
  fileType: string;
  fileName: string;
  category?: string; // 'profile', 'workout', 'nutrition', 'general'
}

// Middleware principal de upload com validação de limites
export const uploadWithLimits = (options: {
  maxFileSizeMB?: number;
  allowedFileTypes?: string[];
  category?: string;
  requireAuth?: boolean;
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Verificar autenticação se necessário
      if (options.requireAuth !== false) {
        if (!req.user) {
          res.status(401).json({ message: 'Authentication required' });
          return;
        }
      }

      // 2. Obter informações do tenant e usuário
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;
      const userId = req.user?.id || req.headers['x-user-id'] as string;

      if (!tenantId) {
        res.status(400).json({ message: 'Tenant ID is required' });
        return;
      }

      // 3. Obter limites do tenant
      const limits = await globalLimitsService.getTenantOverride(tenantId);
      if (!limits) {
        res.status(400).json({ message: 'Tenant limits not found' });
        return;
      }

      // 4. Configurar multer com limites dinâmicos
      const maxFileSize = options.maxFileSizeMB
        ? options.maxFileSizeMB * 1024 * 1024
        : (limits.overrides.uploadLimits?.maxFileSize || 100) * 1024 * 1024;

      const allowedTypes = options.allowedFileTypes || limits.overrides.uploadLimits?.allowedFileTypes || ['jpg', 'jpeg', 'png', 'pdf'];

      // 5. Verificar quota mensal
      const monthlyUsage = await getMonthlyUploadUsage(tenantId);
      const quotaLimit = (limits.overrides.uploadLimits?.monthlyUploadQuota || 1000) * 1024 * 1024 * 1024; // Convert to bytes

      if (monthlyUsage >= quotaLimit) {
        res.status(413).json({
          message: 'Monthly upload quota exceeded',
          usage: monthlyUsage,
          limit: quotaLimit
        });
        return;
      }

      // 6. Configurar multer dinamicamente
      const dynamicUpload = multer({
        storage,
        limits: {
          fileSize: maxFileSize,
          files: 10
        },
        fileFilter: (req, file, cb) => {
          const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

          if (!fileExtension || !allowedTypes.includes(fileExtension)) {
            return cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
          }

          // Validações adicionais por tipo de arquivo
          if (fileExtension === 'pdf' && file.mimetype !== 'application/pdf') {
            return cb(new Error('Invalid PDF file'));
          }

          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
            if (!file.mimetype.startsWith('image/')) {
              return cb(new Error('Invalid image file'));
            }
          }

          cb(null, true);
        }
      });

      // 7. Processar upload
      (dynamicUpload as any).array('files', 10)(req, res, async (err: any): Promise<void> => {
        if (err) {
          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                res.status(413).json({
                  message: `File too large. Maximum size: ${maxFileSize / (1024 * 1024)}MB`
                });
                return;
              case 'LIMIT_FILE_COUNT':
                res.status(413).json({
                  message: 'Too many files. Maximum: 10 files per request'
                });
                return;
              case 'LIMIT_UNEXPECTED_FILE':
                res.status(400).json({
                  message: 'Unexpected file field'
                });
                return;
              default:
                res.status(400).json({
                  message: `Upload error: ${err.message}`
                });
                return;
            }
          }
          res.status(400).json({
            message: `File validation error: ${err.message}`
          });
          return;
        }

        // 8. Validar arquivos após upload
        if (!req.files || req.files.length === 0) {
          res.status(400).json({ message: 'No files uploaded' });
          return;
        }

        const files = Array.isArray(req.files) ? req.files : [req.files];
        const totalSize = files.reduce((sum, file) => sum + (file as any).size, 0);

        // 9. Verificar se o upload não excede a quota mensal
        if (monthlyUsage + totalSize > quotaLimit) {
          res.status(413).json({
            message: 'Upload would exceed monthly quota',
            currentUsage: monthlyUsage,
            uploadSize: totalSize,
            quotaLimit: quotaLimit
          });
          return;
        }

        // 10. Validar cada arquivo individualmente
        for (const file of files) {
          const multerFile = file as any;
          const uploadInfo: UploadInfo = {
            tenantId,
            userId,
            fileSize: multerFile.size,
            fileType: multerFile.originalname.split('.').pop()?.toLowerCase() || '',
            fileName: multerFile.originalname,
            category: options.category
          };

          // Validar tamanho individual
          if (multerFile.size > maxFileSize) {
            res.status(413).json({
              message: `File ${multerFile.originalname} exceeds maximum size of ${maxFileSize / (1024 * 1024)}MB`
            });
            return;
          }

          // Validar tipo de arquivo
          if (!allowedTypes.includes(uploadInfo.fileType)) {
            res.status(400).json({
              message: `File type .${uploadInfo.fileType} is not allowed for ${multerFile.originalname}`
            });
            return;
          }

          // Validações específicas por tipo
          const validationResult = await validateFileContent(multerFile, uploadInfo.fileType);
          if (!validationResult.valid) {
            res.status(400).json({
              message: `File validation failed for ${multerFile.originalname}: ${validationResult.error}`
            });
            return;
          }
        }

        // 11. Adicionar informações de upload ao request
        req.uploadInfo = {
          tenantId,
          userId,
          files: files.map(file => {
            const multerFile = file as any;
            return {
              originalname: multerFile.originalname,
              size: multerFile.size,
              mimetype: multerFile.mimetype,
              buffer: multerFile.buffer
            };
          }),
          totalSize,
          limits: {
            maxFileSize,
            allowedTypes,
            monthlyQuota: quotaLimit,
            monthlyUsage
          }
        };

        next();
      });

    } catch (error) {
      console.error('Upload middleware error:', error);
      res.status(500).json({
        message: 'Internal server error during upload validation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Função para obter uso mensal de upload
async function getMonthlyUploadUsage(tenantId: string): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Buscar logs de upload do tenant no mês atual
    // TODO: Implementar quando integrationUsageLog estiver disponível
    const usageLogs: any[] = [];

    // Somar tamanhos dos arquivos
    let totalSize = 0;
    for (const log of usageLogs) {
      const fileSize = log.metadata?.fileSize as number;
      if (fileSize) {
        totalSize += fileSize;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting monthly upload usage:', error);
    return 0;
  }
}

// Função para validar conteúdo do arquivo
async function validateFileContent(file: any, fileType: string): Promise<{ valid: boolean; error?: string }> {
  try {
    switch (fileType) {
      case 'pdf':
        // Verificar assinatura PDF
        if (file.buffer.length < 4 || file.buffer.toString('hex', 0, 4) !== '25504446') {
          return { valid: false, error: 'Invalid PDF file signature' };
        }
        break;

      case 'jpg':
      case 'jpeg':
        // Verificar assinatura JPEG
        if (file.buffer.length < 3 ||
          (file.buffer[0] !== 0xFF || file.buffer[1] !== 0xD8 || file.buffer[2] !== 0xFF)) {
          return { valid: false, error: 'Invalid JPEG file signature' };
        }
        break;

      case 'png':
        // Verificar assinatura PNG
        if (file.buffer.length < 8 ||
          file.buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
          return { valid: false, error: 'Invalid PNG file signature' };
        }
        break;

      case 'gif':
        // Verificar assinatura GIF
        if (file.buffer.length < 6 ||
          !file.buffer.toString('ascii', 0, 6).startsWith('GIF87a') &&
          !file.buffer.toString('ascii', 0, 6).startsWith('GIF89a')) {
          return { valid: false, error: 'Invalid GIF file signature' };
        }
        break;

      case 'webp':
        // Verificar assinatura WebP
        if (file.buffer.length < 12 ||
          file.buffer.toString('ascii', 0, 4) !== 'RIFF' ||
          file.buffer.toString('ascii', 8, 12) !== 'WEBP') {
          return { valid: false, error: 'Invalid WebP file signature' };
        }
        break;

      case 'doc':
      case 'docx':
        // Verificar assinatura DOC/DOCX
        if (fileType === 'docx') {
          // DOCX é um arquivo ZIP
          if (file.buffer.length < 4 || file.buffer.toString('hex', 0, 4) !== '504b0304') {
            return { valid: false, error: 'Invalid DOCX file signature' };
          }
        } else {
          // DOC tem assinatura específica
          if (file.buffer.length < 8 ||
            file.buffer.toString('hex', 0, 8) !== 'd0cf11e0a1b11ae1') {
            return { valid: false, error: 'Invalid DOC file signature' };
          }
        }
        break;

      case 'xls':
      case 'xlsx':
        // Verificar assinatura XLS/XLSX
        if (fileType === 'xlsx') {
          // XLSX é um arquivo ZIP
          if (file.buffer.length < 4 || file.buffer.toString('hex', 0, 4) !== '504b0304') {
            return { valid: false, error: 'Invalid XLSX file signature' };
          }
        } else {
          // XLS tem assinatura específica
          if (file.buffer.length < 8 ||
            file.buffer.toString('hex', 0, 8) !== 'd0cf11e0a1b11ae1') {
            return { valid: false, error: 'Invalid XLS file signature' };
          }
        }
        break;

      case 'txt':
        // Arquivos de texto são sempre válidos
        break;

      case 'csv': {
        // Verificar se é um CSV válido (linhas separadas por quebra de linha)
        const content = file.buffer.toString('utf8');
        if (!content.includes('\n') && !content.includes('\r')) {
          return { valid: false, error: 'Invalid CSV format' };
        }
        break;
      }

      default:
        return { valid: false, error: `Unsupported file type: ${fileType}` };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `File validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Middleware para logar uso de upload
export const logUploadUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.uploadInfo) {
      const { tenantId, files, totalSize } = req.uploadInfo;

      // Logar cada arquivo individualmente
      // TODO: Implementar quando integrationUsageLog estiver disponível
      for (const file of files) {
        console.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);
      }

      // Logar uso total
      console.log(`Upload session: ${files.length} files, ${totalSize} bytes total`);
    }

    next();
  } catch (error) {
    console.error('Error logging upload usage:', error);
    // Não falhar o request por erro de log
    next();
  }
};

// Middleware para verificar limites antes do upload
export const checkUploadLimits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ message: 'Tenant ID is required' });
      return;
    }

    // Verificar se o tenant pode fazer uploads
    const limits = await globalLimitsService.getTenantOverride(tenantId);
    if (!limits || !limits.overrides.featureLimits?.apiAccess) {
      res.status(403).json({
        message: 'File upload is not allowed for this tenant'
      });
      return;
    }

    // Verificar rate limiting básico
    // TODO: Implementar rate limiting mais sofisticado

    return next();
  } catch (error) {
    console.error('Error checking upload limits:', error);
    res.status(500).json({
      message: 'Error checking upload limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Middleware para limpeza de arquivos temporários
export const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  // Limpar buffers de arquivo após processamento
  if (req.uploadInfo?.files) {
    req.uploadInfo.files.forEach(file => {
      if (file.buffer) {
        file.buffer = Buffer.alloc(0); // Limpar buffer
      }
    });
  }
  next();
};

// Middleware para obter estatísticas de upload
export const getUploadStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({ message: 'Tenant ID is required' });
      return;
    }

    const stats = await getTenantUploadStats(tenantId);
    req.uploadStats = stats;

    return next();
  } catch (error) {
    console.error('Error getting upload stats:', error);
    res.status(500).json({
      message: 'Error getting upload statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return;
  }
};

// Função para obter estatísticas de upload do tenant
async function getTenantUploadStats(tenantId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Buscar logs de upload do mês atual
    // TODO: Implementar quando integrationUsageLog estiver disponível
    const monthlyLogs: any[] = [];

    // Calcular estatísticas
    const totalFiles = monthlyLogs.length;
    const totalSize = monthlyLogs.reduce((sum, log) => {
      const fileSize = log.metadata?.fileSize as number;
      return sum + (fileSize || 0);
    }, 0);

    const fileTypes = monthlyLogs.reduce((acc, log) => {
      const fileType = log.metadata?.fileType as string;
      if (fileType) {
        acc[fileType] = (acc[fileType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Obter limites do tenant
    const limits = await globalLimitsService.getTenantOverride(tenantId);
    const quotaLimit = limits?.overrides.uploadLimits?.monthlyUploadQuota || 0;
    const quotaUsed = totalSize / (1024 * 1024 * 1024); // Convert to GB
    const quotaPercentage = quotaLimit > 0 ? (quotaUsed / quotaLimit) * 100 : 0;

    return {
      monthly: {
        totalFiles,
        totalSize,
        quotaUsed,
        quotaLimit,
        quotaPercentage,
        fileTypes
      },
      limits: {
        maxFileSizeMB: limits?.overrides.uploadLimits?.maxFileSize || 0,
        allowedFileTypes: limits?.overrides.uploadLimits?.allowedFileTypes || [],
        monthlyUploadQuotaGB: quotaLimit
      }
    };
  } catch (error) {
    console.error('Error getting tenant upload stats:', error);
    return {
      monthly: {
        totalFiles: 0,
        totalSize: 0,
        quotaUsed: 0,
        quotaLimit: 0,
        quotaPercentage: 0,
        fileTypes: {}
      },
      limits: {
        maxFileSizeMB: 0,
        allowedFileTypes: [],
        monthlyUploadQuotaGB: 0
      }
    };
  }
}

// Extender tipos do Express para incluir uploadInfo
declare global {
  namespace Express {
    interface Request {
      uploadInfo?: {
        tenantId: string;
        userId: string;
        files: Array<{
          originalname: string;
          size: number;
          mimetype: string;
          buffer: Buffer;
        }>;
        totalSize: number;
        limits: {
          maxFileSize: number;
          allowedTypes: string[];
          monthlyQuota: number;
          monthlyUsage: number;
        };
      };
      uploadStats?: any;
    }
  }
}

export default {
  uploadWithLimits,
  logUploadUsage,
  checkUploadLimits,
  cleanupTempFiles,
  getUploadStats
};

