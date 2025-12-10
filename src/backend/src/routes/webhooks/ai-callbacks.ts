import { Router } from 'express';
import { Request, Response } from 'express';
import { getPrismaClient } from '../../config/database';
import { webhookValidator } from '../../services/webhook-validator.service';
import { aiClientFactory } from '../../services/ai-client.factory';
import { aiProviderService } from '../../services/ai-provider.service';
import { 
  WebhookCallbackPayload,
  AiServiceType,
  AiProviderType 
} from '../../../../shared/types/ai.types';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
const prisma = getPrismaClient();

/**
 * POST /api/webhooks/ai-callbacks/:providerId
 * Recebe callbacks de webhooks N8N e outros provedores assíncronos
 */
router.post('/:providerId', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;
  const payload = req.body;
  const signature = req.headers['x-webhook-signature'] as string;
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  // Buscar provedor
  const provider = await aiProviderService.getProviderById(providerId);
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Validar webhook se configurado
  if (provider.webhookSecret) {
    if (!signature || !timestamp) {
      return res.status(400).json({
        error: 'Missing webhook signature or timestamp',
        code: 'MISSING_WEBHOOK_HEADERS'
      });
    }

    // Validar timestamp (prevenir replay attacks)
    if (!webhookValidator.validateTimestamp(timestamp)) {
      return res.status(400).json({
        error: 'Invalid timestamp',
        code: 'INVALID_TIMESTAMP'
      });
    }

    // Validar assinatura HMAC
    const payloadString = JSON.stringify(payload);
    if (!webhookValidator.validateHmacSignature(payloadString, signature)) {
      return res.status(401).json({
        error: 'Invalid webhook signature',
        code: 'INVALID_SIGNATURE'
      });
    }
  }

  // Log do webhook recebido
  const webhookLog = await prisma.aiWebhookLog.create({
    data: {
      providerId,
      tenantId: provider.tenantId,
      direction: 'INBOUND',
      requestUrl: req.url,
      requestMethod: req.method,
      requestHeaders: JSON.stringify(req.headers),
      requestBody: JSON.stringify(payload),
      responseStatus: 200,
      responseHeaders: JSON.stringify({ 'Content-Type': 'application/json' }),
      responseBody: JSON.stringify({ status: 'processing' }),
      duration: 0,
      createdAt: new Date()
    }
  });

  try {
    // Processar callback baseado no tipo de provedor
    let result: any;

    switch (provider.provider) {
      case AiProviderType.N8N_WEBHOOK:
        result = await processN8NCallback(payload, provider);
        break;
      case AiProviderType.CUSTOM_WEBHOOK:
        result = await processCustomWebhookCallback(payload, provider);
        break;
      default:
        result = await processGenericCallback(payload, provider);
    }

    // Atualizar log com sucesso
    await prisma.aiWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        responseStatus: 200,
        responseBody: JSON.stringify(result),
        duration: Date.now() - webhookLog.createdAt.getTime()
      }
    });

    return res.json({
      status: 'success',
      message: 'Callback processed successfully',
      result
    });

  } catch (error: any) {
    // Atualizar log com erro
    await prisma.aiWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        responseStatus: 500,
        responseBody: JSON.stringify({ error: error.message }),
        error: error.message,
        duration: Date.now() - webhookLog.createdAt.getTime()
      }
    });

    return res.status(500).json({
      status: 'error',
      error: error.message,
      code: 'CALLBACK_PROCESSING_FAILED'
    });
  }
}));

/**
 * GET /api/webhooks/ai-callbacks/logs
 * Lista logs de webhooks com paginação
 */
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const providerId = req.query.providerId as string;
  const direction = req.query.direction as 'INBOUND' | 'OUTBOUND';
  const status = req.query.status as string;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = {};

  if (providerId) where.providerId = providerId;
  if (direction) where.direction = direction;
  if (status) where.responseStatus = parseInt(status);

  const [logs, total] = await prisma.$transaction([
    prisma.aiWebhookLog.findMany({
      where,
      skip,
      take,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            displayName: true,
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.aiWebhookLog.count({ where })
  ]);

  const formattedLogs = logs.map(log => ({
    ...log,
    requestHeaders: JSON.parse((log.requestHeaders as string) || '{}'),
    responseHeaders: JSON.parse((log.responseHeaders as string) || '{}'),
    requestBody: log.requestBody ? JSON.parse(log.requestBody as string) : null,
    responseBody: log.responseBody ? JSON.parse(log.responseBody as string) : null
  }));

  return res.json({
    data: formattedLogs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}));

/**
 * GET /api/webhooks/ai-callbacks/logs/:logId
 * Busca log específico por ID
 */
router.get('/logs/:logId', asyncHandler(async (req: Request, res: Response) => {
  const { logId } = req.params;

  const log = await prisma.aiWebhookLog.findUnique({
    where: { id: logId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true
        }
      }
    }
  });

  if (!log) {
    return res.status(404).json({
      error: 'Webhook log not found',
      code: 'WEBHOOK_LOG_NOT_FOUND'
    });
  }

  const formattedLog = {
    ...log,
    requestHeaders: JSON.parse((log.requestHeaders as string) || '{}'),
    responseHeaders: JSON.parse((log.responseHeaders as string) || '{}'),
    requestBody: log.requestBody ? JSON.parse(log.requestBody as string) : null,
    responseBody: log.responseBody ? JSON.parse(log.responseBody as string) : null
  };

  return res.json(formattedLog);
}));

/**
 * POST /api/webhooks/ai-callbacks/test/:providerId
 * Testa webhook enviando payload de teste
 */
router.post('/test/:providerId', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;
  const { testPayload } = req.body;

  const provider = await aiProviderService.getProviderById(providerId);
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  if (!provider.webhookUrl) {
    return res.status(400).json({
      error: 'Provider does not have webhook URL configured',
      code: 'NO_WEBHOOK_URL'
    });
  }

  const testPayloadData = testPayload || {
    test: true,
    timestamp: new Date().toISOString(),
    providerId,
    message: 'Test webhook from FitOS AI Management'
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...provider.headers
    };

    // Adicionar assinatura se configurado
    if (provider.webhookSecret) {
      const payloadString = JSON.stringify(testPayloadData);
      headers['X-Webhook-Signature'] = webhookValidator.generateHmacSignature(payloadString);
      headers['X-Webhook-Timestamp'] = webhookValidator.generateTimestamp();
    }

    const response = await fetch(provider.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayloadData)
    });

    const responseData = await response.text();

    // Log do webhook de teste
    await prisma.aiWebhookLog.create({
      data: {
        providerId,
        tenantId: provider.tenantId,
        direction: 'OUTBOUND',
        requestUrl: provider.webhookUrl,
        requestMethod: 'POST',
        requestHeaders: JSON.stringify(headers),
        requestBody: JSON.stringify(testPayloadData),
        responseStatus: response.status,
        responseHeaders: JSON.stringify(Object.fromEntries(response.headers.entries())),
        responseBody: responseData,
        duration: 0,
        createdAt: new Date()
      }
    });

    return res.json({
      status: 'success',
      message: 'Test webhook sent successfully',
      response: {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      code: 'WEBHOOK_TEST_FAILED'
    });
  }
}));

// Funções auxiliares para processar diferentes tipos de callbacks

async function processN8NCallback(payload: any, provider: any): Promise<any> {
  // Processar callback específico do N8N
  const { jobId, status, output, error, metadata } = payload;

  if (jobId) {
    // Atualizar job existente
    const job = await prisma.aiJob.findUnique({
      where: { id: jobId }
    });

    if (job) {
      await prisma.aiJob.update({
        where: { id: jobId },
        data: {
          status: status || 'completed',
          output: output ? JSON.stringify(output) : undefined,
          error: error || null,
          completedAt: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : undefined
        }
      });
    }
  }

  return {
    processed: true,
    jobId,
    status,
    timestamp: new Date().toISOString()
  };
}

async function processCustomWebhookCallback(payload: any, provider: any): Promise<any> {
  // Processar callback de webhook customizado
  const { serviceType, result, error } = payload;

  // Criar job para tracking
  const job = await prisma.aiJob.create({
    data: {
      serviceType: serviceType || AiServiceType.CUSTOM,
      providerId: provider.id,
      tenantId: provider.tenantId,
      status: error ? 'failed' : 'completed',
      input: JSON.stringify(payload),
      output: result ? JSON.stringify(result) : undefined,
      error: error || null,
      startedAt: new Date(),
      completedAt: new Date(),
      attempts: 1,
      metadata: JSON.stringify({ source: 'custom_webhook' })
    }
  });

  return {
    processed: true,
    jobId: job.id,
    status: job.status,
    timestamp: new Date().toISOString()
  };
}

async function processGenericCallback(payload: any, provider: any): Promise<any> {
  // Processar callback genérico
  return {
    processed: true,
    provider: provider.name,
    timestamp: new Date().toISOString(),
    payload: payload
  };
}

export default router;
