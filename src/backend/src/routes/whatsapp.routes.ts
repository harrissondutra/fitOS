import { Router } from 'express';
import { WhatsAppService } from '../services/whatsapp/whatsapp.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { Joi } from 'joi';

const router = Router();
const whatsappService = WhatsAppService.getInstance();

// Validation schemas
const sendMessageSchema = Joi.object({
  to: Joi.string().required(),
  from: Joi.string().required(),
  body: Joi.string().required(),
  mediaUrl: Joi.string().uri().optional(),
  templateName: Joi.string().optional(),
  templateParams: Joi.object().optional(),
  priority: Joi.string().valid('high', 'normal', 'low').optional(),
});

const sendTemplateSchema = Joi.object({
  to: Joi.string().required(),
  templateName: Joi.string().required(),
  templateParams: Joi.object().required(),
});

const scheduleMessageSchema = Joi.object({
  to: Joi.string().required(),
  from: Joi.string().required(),
  body: Joi.string().required(),
  mediaUrl: Joi.string().uri().optional(),
  templateName: Joi.string().optional(),
  templateParams: Joi.object().optional(),
  scheduledAt: Joi.date().required(),
});

const createTemplateSchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().valid('UTILITY', 'MARKETING', 'AUTHENTICATION').required(),
  language: Joi.string().required(),
  components: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('HEADER', 'BODY', 'FOOTER', 'BUTTONS').required(),
      text: Joi.string().optional(),
      buttons: Joi.array().items(
        Joi.object({
          type: Joi.string().valid('URL', 'PHONE_NUMBER', 'QUICK_REPLY').required(),
          text: Joi.string().required(),
          url: Joi.string().uri().optional(),
          phone_number: Joi.string().optional(),
        })
      ).optional(),
    })
  ).required(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'PENDING_DELETION').required(),
});

/**
 * @route POST /api/whatsapp/send
 * @desc Send a WhatsApp message
 * @access Private
 */
router.post('/send', authenticateToken, validateRequest(sendMessageSchema), async (req, res) => {
  try {
    const { to, from, body, mediaUrl, templateName, templateParams, priority } = req.body;
    const tenantId = req.user?.tenantId;

    const result = await whatsappService.sendMessage({
      to,
      from,
      body,
      mediaUrl,
      templateName,
      templateParams,
      priority,
      tenantId,
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'WhatsApp message sent successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp message',
    });
  }
});

/**
 * @route POST /api/whatsapp/send-template
 * @desc Send a WhatsApp template message
 * @access Private
 */
router.post('/send-template', authenticateToken, validateRequest(sendTemplateSchema), async (req, res) => {
  try {
    const { to, templateName, templateParams } = req.body;
    const tenantId = req.user?.tenantId;

    const result = await whatsappService.sendTemplateMessage(to, templateName, templateParams, tenantId);

    if (result.success) {
      res.status(200).json({
        success: true,
        messageId: result.messageId,
        message: 'WhatsApp template message sent successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send WhatsApp template message',
    });
  }
});

/**
 * @route POST /api/whatsapp/send-bulk
 * @desc Send bulk WhatsApp messages
 * @access Private
 */
router.post('/send-bulk', authenticateToken, async (req, res) => {
  try {
    const { messages } = req.body;
    const tenantId = req.user?.tenantId;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required and must not be empty',
      });
    }

    const result = await whatsappService.sendBulkMessages(messages, tenantId);

    res.status(200).json({
      success: result.success,
      results: result.results,
      message: 'Bulk WhatsApp messages processed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk WhatsApp messages',
    });
  }
});

/**
 * @route POST /api/whatsapp/schedule
 * @desc Schedule a WhatsApp message
 * @access Private
 */
router.post('/schedule', authenticateToken, validateRequest(scheduleMessageSchema), async (req, res) => {
  try {
    const { to, from, body, mediaUrl, templateName, templateParams, scheduledAt } = req.body;
    const tenantId = req.user?.tenantId;

    const result = await whatsappService.scheduleMessage(
      { to, from, body, mediaUrl, templateName, templateParams },
      new Date(scheduledAt),
      tenantId
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        scheduledMessageId: result.scheduledMessageId,
        message: 'WhatsApp message scheduled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to schedule WhatsApp message',
    });
  }
});

/**
 * @route GET /api/whatsapp/stats
 * @desc Get WhatsApp message statistics
 * @access Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;

    const stats = await whatsappService.getMessageStats(
      tenantId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp statistics',
    });
  }
});

/**
 * @route GET /api/whatsapp/templates
 * @desc Get WhatsApp templates
 * @access Private
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const templates = await whatsappService.getTemplates(status as string);

    res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp templates',
    });
  }
});

/**
 * @route POST /api/whatsapp/templates
 * @desc Create a WhatsApp template
 * @access Private
 */
router.post('/templates', authenticateToken, validateRequest(createTemplateSchema), async (req, res) => {
  try {
    const template = req.body;
    const result = await whatsappService.createTemplate(template);

    if (result.success) {
      res.status(201).json({
        success: true,
        templateId: result.templateId,
        message: 'WhatsApp template created successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create WhatsApp template',
    });
  }
});

/**
 * @route POST /api/whatsapp/webhook/status
 * @desc Handle WhatsApp status webhook from Twilio
 * @access Public (Twilio webhook)
 */
router.post('/webhook/status', async (req, res) => {
  try {
    const { MessageSid, MessageStatus, To, From } = req.body;

    await whatsappService.handleWebhook({
      messageId: MessageSid,
      from: From,
      to: To,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: MessageStatus,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

/**
 * @route POST /api/whatsapp/webhook/message
 * @desc Handle incoming WhatsApp messages from Twilio
 * @access Public (Twilio webhook)
 */
router.post('/webhook/message', async (req, res) => {
  try {
    const { MessageSid, From, To, Body, MediaUrl0, MessageType } = req.body;

    await whatsappService.handleWebhook({
      messageId: MessageSid,
      from: From,
      to: To,
      timestamp: new Date().toISOString(),
      type: MessageType || 'text',
      body: Body,
      mediaUrl: MediaUrl0,
      status: 'delivered',
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

/**
 * @route POST /api/whatsapp/process-scheduled
 * @desc Process scheduled messages (cron job endpoint)
 * @access Private
 */
router.post('/process-scheduled', authenticateToken, async (req, res) => {
  try {
    await whatsappService.processScheduledMessages();

    res.status(200).json({
      success: true,
      message: 'Scheduled messages processed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process scheduled messages',
    });
  }
});

export default router;
