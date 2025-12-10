import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole } from '../middleware/permissions';
import { body, validationResult } from 'express-validator';
import { costTrackerService } from '../services/cost-tracker.service';
import { whatsAppConfigManager } from '../config/whatsapp.config';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/whatsapp/config
 * @desc Buscar configuração do WhatsApp
 * @access OWNER, SUPER_ADMIN
 */
router.get('/config', requireRole(['OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const config = await prisma.whatsAppConfig.findFirst({
      where: { tenantId: req.user.tenantId }
    });

    if (!config) {
      // Criar configuração padrão se não existir
      const defaultConfig = await prisma.whatsAppConfig.create({
        data: {
          tenantId: req.user.tenantId,
          provider: 'twilio',
          phoneNumber: '',
          apiKey: '',
          apiSecret: '',
          isActive: false,
          settings: {
            appointmentConfirmation: true,
            reminders: true,
            newMeasurement: true,
            workingHours: {
              start: '08:00',
              end: '18:00'
            },
            templates: {
              appointmentConfirmation: `Olá {{clientName}}! 

Seu agendamento foi confirmado:
📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
📍 Local: {{location}}
👨‍⚕️ Profissional: {{professionalName}}

Qualquer dúvida, entre em contato conosco!`,
              reminder: `Olá {{clientName}}!

Lembrete: Você tem um agendamento amanhã:
📅 Data: {{appointmentDate}}
🕐 Horário: {{appointmentTime}}
📍 Local: {{location}}

Nos vemos em breve!`,
              newMeasurement: `Olá {{clientName}}!

Sua nova medição biométrica foi registrada:
📊 Tipo: {{measurementType}}
📈 Valor: {{measurementValue}} {{unit}}
📅 Data: {{measurementDate}}

Continue acompanhando sua evolução!`
            }
          }
        }
      });

      return res.json({ success: true, config: defaultConfig });
    }

    return res.json({ success: true, config });
  } catch (error: any) {
    console.error('Erro ao buscar configuração WhatsApp:', error);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route PUT /api/whatsapp/config
 * @desc Atualizar configuração do WhatsApp
 * @access OWNER, SUPER_ADMIN
 */
router.put('/config',
  requireRole(['OWNER', 'SUPER_ADMIN']),
  [
    body('provider').optional().isString(),
    body('phoneNumber').optional().isString(),
    body('apiKey').optional().isString(),
    body('apiSecret').optional().isString(),
    body('isActive').optional().isBoolean(),
    body('settings').optional().isObject(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updateData = req.body;

      // Verificar se configuração existe
      const existingConfig = await prisma.whatsAppConfig.findFirst({
        where: { tenantId: req.user.tenantId }
      });

      let config;
      if (existingConfig) {
        config = await prisma.whatsAppConfig.update({
          where: { id: existingConfig.id },
          data: {
            ...updateData,
            updatedAt: new Date()
          }
        });
      } else {
        config = await prisma.whatsAppConfig.create({
          data: {
            tenantId: req.user.tenantId,
            ...updateData
          }
        });
      }

      // ✅ Invalidar cache quando config é atualizada
      whatsAppConfigManager.invalidateCache(req.user.tenantId);

      res.json({ success: true, config });
    } catch (error: any) {
      console.error('Erro ao atualizar configuração WhatsApp:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/whatsapp/test
 * @desc Enviar mensagem de teste
 * @access OWNER, SUPER_ADMIN
 */
router.post('/test',
  requireRole(['OWNER', 'SUPER_ADMIN']),
  [
    body('message').isString().notEmpty().withMessage('Mensagem é obrigatória'),
    body('phone').isString().notEmpty().withMessage('Telefone é obrigatório'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { message, phone } = req.body;

      // Buscar configuração
      const config = await prisma.whatsAppConfig.findFirst({
        where: { 
          tenantId: req.user.tenantId,
          isActive: true
        }
      });

      if (!config) {
        return res.status(400).json({ 
          success: false, 
          error: 'Configuração WhatsApp não encontrada ou inativa' 
        });
      }

      // Simular envio de mensagem (em produção, aqui seria a integração real)
      console.log('Enviando mensagem WhatsApp:', {
        to: phone,
        message,
        provider: config.provider,
        config: {
          phoneNumber: config.phoneNumber,
          apiKey: config.apiKey ? '***' : 'não configurado'
        }
      });

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.json({ 
        success: true, 
        message: 'Mensagem de teste enviada com sucesso!',
        details: {
          to: phone,
          provider: config.provider,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem de teste:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/whatsapp/send
 * @desc Enviar mensagem via WhatsApp
 * @access OWNER, ADMIN, SUPER_ADMIN
 */
router.post('/send',
  requireRole(['OWNER', 'ADMIN', 'SUPER_ADMIN']),
  [
    body('phone').isString().notEmpty().withMessage('Telefone é obrigatório'),
    body('template').isString().notEmpty().withMessage('Template é obrigatório'),
    body('variables').optional().isObject().withMessage('Variáveis devem ser um objeto'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { phone, template, variables = {} } = req.body;

      // ✅ Buscar configuração usando config central
      const config = await whatsAppConfigManager.getConfig(req.user.tenantId);

      if (!config) {
        return res.status(400).json({ 
          success: false, 
          error: 'Configuração WhatsApp não encontrada ou inativa' 
        });
      }

      // Processar template com variáveis
      const settings = config.settings as any;
      let processedMessage = settings?.templates?.[template] || template;
      
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedMessage = processedMessage.replace(regex, String(value));
      });

      // Simular envio de mensagem
      console.log('Enviando mensagem WhatsApp:', {
        to: phone,
        template,
        message: processedMessage,
        provider: config.provider
      });

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Rastrear custo do WhatsApp
      try {
        await costTrackerService.trackWhatsAppUsage({
          messageCount: 1,
          provider: config.provider,
          metadata: {
            phone,
            template,
            messageLength: processedMessage.length,
            tenantId: req.user.tenantId,
          },
          tenantId: req.user.tenantId,
          createdBy: req.user.id,
        });
      } catch (error) {
        console.warn('Failed to track WhatsApp usage:', error);
      }

      res.json({ 
        success: true, 
        message: 'Mensagem enviada com sucesso!',
        details: {
          to: phone,
          template,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
