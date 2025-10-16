import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { emailService } from '../services/email';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

const router = Router();

// Validation rules
const sendEmailValidation = [
  body('to').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
];

const sendTemplateEmailValidation = [
  body('to').isEmail().withMessage('Valid email is required'),
  body('template').isIn(['welcome', 'password-reset', 'workout-reminder']).withMessage('Valid template is required'),
  body('data').isObject().withMessage('Template data is required'),
];

// Send custom email
router.post('/send', sendEmailValidation, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { to, subject, message, html } = req.body;

  const success = await emailService.sendEmail({
    to,
    subject,
    text: message,
    html: html || message,
  });

  if (success) {
    logger.info('Custom email sent successfully', { to, subject });
    return res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } else {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send email',
      },
    });
  }
}));

// Send template email
router.post('/send-template', sendTemplateEmailValidation, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { to, template, data } = req.body;
  let success = false;

  switch (template) {
    case 'welcome':
      success = await emailService.sendWelcomeEmail(
        to,
        data.userName,
        data.loginUrl || 'http://localhost:3000/login'
      );
      break;

    case 'password-reset':
      success = await emailService.sendPasswordResetEmail(
        to,
        data.userName,
        data.resetUrl
      );
      break;

    case 'workout-reminder':
      success = await emailService.sendWorkoutReminderEmail(
        to,
        data.userName,
        data.workoutName,
        data.workoutTime
      );
      break;

    default:
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid template type',
        },
      });
  }

  if (success) {
    logger.info('Template email sent successfully', { to, template });
    return res.json({
      success: true,
      message: 'Template email sent successfully',
    });
  } else {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send template email',
      },
    });
  }
}));

// Test email service
router.get('/test', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const testEmail = 'test@example.com';
  const testData = {
    userName: 'Usuário Teste',
    loginUrl: 'http://localhost:3000/login',
  };

  const success = await emailService.sendWelcomeEmail(
    testEmail,
    testData.userName,
    testData.loginUrl
  );

  if (success) {
    res.json({
      success: true,
      message: 'Test email sent successfully',
      testEmail,
    });
  } else {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send test email',
      },
    });
  }
}));

// Get available templates
router.get('/templates', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  res.json({
    success: true,
    templates: [
      {
        name: 'welcome',
        description: 'Email de boas-vindas para novos usuários',
        requiredData: ['userName', 'loginUrl'],
      },
      {
        name: 'password-reset',
        description: 'Email para redefinição de senha',
        requiredData: ['userName', 'resetUrl'],
      },
      {
        name: 'workout-reminder',
        description: 'Lembrete de treino',
        requiredData: ['userName', 'workoutName', 'workoutTime'],
      },
    ],
  });
}));

export { router as emailRoutes };
