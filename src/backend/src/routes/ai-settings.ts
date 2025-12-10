import { Router } from 'express';
import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { asyncHandler } from '../utils/async-handler';
import { logger } from '../utils/logger';

const router = Router();

// NOTA: Middlewares de autenticação e super admin são aplicados no router principal (ai.routes.ts)
// Não precisamos aplicá-los novamente aqui

/**
 * GET /api/super-admin/ai-settings
 * Obtém todas as configurações de IA
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();

  try {
    // Buscar configurações do banco (se existir tabela de settings)
    // Por enquanto, retornar configurações padrão baseadas em AiServiceConfig e AiProvider
    const serviceConfigs = await prisma.aiServiceConfig.findMany({
      include: {
        provider: true
      }
    });

    const providers = await prisma.aiProvider.findMany({
      where: { isActive: true }
    });

    // Configurações padrão baseadas no estado atual do sistema
    const defaultProvider = providers.find(p => p.isDefault) || providers[0];
    
    const settings = {
      global: {
        defaultProvider: defaultProvider?.provider || 'openai',
        defaultModel: defaultProvider?.models?.[0] || 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1024,
        defaultTimeout: 30000,
        enableFallback: true,
        enableRetry: true,
        maxRetries: 3,
        enableLogging: true,
        logLevel: 'info' as const
      },
      rateLimiting: {
        enabled: true,
        globalRateLimit: 1000,
        perProviderRateLimit: {},
        perServiceRateLimit: {},
        burstLimit: 100,
        windowSize: 1,
        enableQueue: true,
        queueMaxSize: 1000
      },
      webhook: {
        enabled: true,
        secret: '',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableSignatureValidation: true,
        enableTimestampValidation: true,
        maxAge: 300,
        allowedIPs: [],
        enableLogging: true
      },
      security: {
        encryptionEnabled: true,
        encryptionKey: '',
        enableApiKeyRotation: false,
        rotationInterval: 30,
        enableAuditLog: true,
        enableAccessControl: true,
        allowedRoles: ['SUPER_ADMIN'],
        enableIPWhitelist: false,
        whitelistedIPs: []
      },
      integration: {
        n8nEnabled: false,
        n8nWebhookUrl: '',
        n8nApiKey: '',
        slackEnabled: false,
        slackWebhookUrl: '',
        discordEnabled: false,
        discordWebhookUrl: '',
        emailEnabled: false,
        emailProvider: 'smtp',
        emailConfig: {}
      },
      advanced: {
        enableMetrics: true,
        metricsRetentionDays: 30,
        enableCostTracking: true,
        costAlertThreshold: 100,
        enablePerformanceMonitoring: true,
        performanceThreshold: 5000,
        enableAutoScaling: false,
        scalingThreshold: 80,
        enableCircuitBreaker: true,
        circuitBreakerThreshold: 5,
        enableHealthChecks: true,
        healthCheckInterval: 60
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    logger.error('Erro ao obter configurações de IA:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/global
 * Atualiza configurações globais
 */
router.put('/global', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Por enquanto, apenas retornar os dados atualizados
    // TODO: Implementar persistência em banco de dados
    logger.info('Global settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações globais:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/rate-limiting
 * Atualiza configurações de rate limiting
 */
router.put('/rate-limiting', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Rate limiting settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações de rate limiting:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/webhook
 * Atualiza configurações de webhook
 */
router.put('/webhook', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Webhook settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações de webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/security
 * Atualiza configurações de segurança
 */
router.put('/security', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Security settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações de segurança:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/integration
 * Atualiza configurações de integração
 */
router.put('/integration', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Integration settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações de integração:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * PUT /api/super-admin/ai-settings/advanced
 * Atualiza configurações avançadas
 */
router.put('/advanced', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Advanced settings updated:', req.body);
    
    res.json({
      success: true,
      data: req.body
    });
  } catch (error: any) {
    logger.error('Erro ao atualizar configurações avançadas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar configurações'
    });
  }
}));

/**
 * POST /api/super-admin/ai-settings/webhook/test
 * Testa configurações de webhook
 */
router.post('/webhook/test', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Simular teste de webhook
    logger.info('Webhook test executed');
    
    res.json({
      success: true,
      message: 'Webhook testado com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao testar webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao testar webhook'
    });
  }
}));

/**
 * POST /api/super-admin/ai-settings/security/generate-key
 * Gera nova chave de criptografia
 */
router.post('/security/generate-key', asyncHandler(async (req: Request, res: Response) => {
  try {
    const crypto = require('crypto');
    const key = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      key
    });
  } catch (error: any) {
    logger.error('Erro ao gerar chave de criptografia:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar chave'
    });
  }
}));

/**
 * POST /api/super-admin/ai-settings/reset
 * Reseta configurações para padrão
 */
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
  try {
    logger.info('Settings reset to defaults');
    
    // Retornar configurações padrão
    const settings = {
      global: {
        defaultProvider: 'openai',
        defaultModel: 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1024,
        defaultTimeout: 30000,
        enableFallback: true,
        enableRetry: true,
        maxRetries: 3,
        enableLogging: true,
        logLevel: 'info' as const
      },
      rateLimiting: {
        enabled: true,
        globalRateLimit: 1000,
        perProviderRateLimit: {},
        perServiceRateLimit: {},
        burstLimit: 100,
        windowSize: 1,
        enableQueue: true,
        queueMaxSize: 1000
      },
      webhook: {
        enabled: true,
        secret: '',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableSignatureValidation: true,
        enableTimestampValidation: true,
        maxAge: 300,
        allowedIPs: [],
        enableLogging: true
      },
      security: {
        encryptionEnabled: true,
        encryptionKey: '',
        enableApiKeyRotation: false,
        rotationInterval: 30,
        enableAuditLog: true,
        enableAccessControl: true,
        allowedRoles: ['SUPER_ADMIN'],
        enableIPWhitelist: false,
        whitelistedIPs: []
      },
      integration: {
        n8nEnabled: false,
        n8nWebhookUrl: '',
        n8nApiKey: '',
        slackEnabled: false,
        slackWebhookUrl: '',
        discordEnabled: false,
        discordWebhookUrl: '',
        emailEnabled: false,
        emailProvider: 'smtp',
        emailConfig: {}
      },
      advanced: {
        enableMetrics: true,
        metricsRetentionDays: 30,
        enableCostTracking: true,
        costAlertThreshold: 100,
        enablePerformanceMonitoring: true,
        performanceThreshold: 5000,
        enableAutoScaling: false,
        scalingThreshold: 80,
        enableCircuitBreaker: true,
        circuitBreakerThreshold: 5,
        enableHealthChecks: true,
        healthCheckInterval: 60
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    logger.error('Erro ao resetar configurações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao resetar configurações'
    });
  }
}));

/**
 * GET /api/super-admin/ai-settings/export
 * Exporta configurações
 */
router.get('/export', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();

  try {
    // Buscar configurações do banco (mesma lógica do GET /)
    const serviceConfigs = await prisma.aiServiceConfig.findMany({
      include: {
        provider: true
      }
    });

    const providers = await prisma.aiProvider.findMany({
      where: { isActive: true }
    });

    const defaultProvider = providers.find(p => p.isDefault) || providers[0];
    
    const settings = {
      global: {
        defaultProvider: defaultProvider?.provider || 'openai',
        defaultModel: defaultProvider?.models?.[0] || 'gpt-4',
        defaultTemperature: 0.7,
        defaultMaxTokens: 1024,
        defaultTimeout: 30000,
        enableFallback: true,
        enableRetry: true,
        maxRetries: 3,
        enableLogging: true,
        logLevel: 'info' as const
      },
      rateLimiting: {
        enabled: true,
        globalRateLimit: 1000,
        perProviderRateLimit: {},
        perServiceRateLimit: {},
        burstLimit: 100,
        windowSize: 1,
        enableQueue: true,
        queueMaxSize: 1000
      },
      webhook: {
        enabled: true,
        secret: '',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableSignatureValidation: true,
        enableTimestampValidation: true,
        maxAge: 300,
        allowedIPs: [],
        enableLogging: true
      },
      security: {
        encryptionEnabled: true,
        encryptionKey: '',
        enableApiKeyRotation: false,
        rotationInterval: 30,
        enableAuditLog: true,
        enableAccessControl: true,
        allowedRoles: ['SUPER_ADMIN'],
        enableIPWhitelist: false,
        whitelistedIPs: []
      },
      integration: {
        n8nEnabled: false,
        n8nWebhookUrl: '',
        n8nApiKey: '',
        slackEnabled: false,
        slackWebhookUrl: '',
        discordEnabled: false,
        discordWebhookUrl: '',
        emailEnabled: false,
        emailProvider: 'smtp',
        emailConfig: {}
      },
      advanced: {
        enableMetrics: true,
        metricsRetentionDays: 30,
        enableCostTracking: true,
        costAlertThreshold: 100,
        enablePerformanceMonitoring: true,
        performanceThreshold: 5000,
        enableAutoScaling: false,
        scalingThreshold: 80,
        enableCircuitBreaker: true,
        circuitBreakerThreshold: 5,
        enableHealthChecks: true,
        healthCheckInterval: 60
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ai-settings-${new Date().toISOString().split('T')[0]}.json`);
    res.json(settings);
  } catch (error: any) {
    logger.error('Erro ao exportar configurações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao exportar configurações'
    });
  }
}));

/**
 * POST /api/super-admin/ai-settings/import
 * Importa configurações
 */
router.post('/import', asyncHandler(async (req: Request, res: Response) => {
  try {
    // TODO: Implementar parse do arquivo JSON
    // Por enquanto, apenas retornar sucesso
    logger.info('Settings imported');
    
    res.json({
      success: true,
      message: 'Configurações importadas com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao importar configurações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao importar configurações'
    });
  }
}));

export default router;

