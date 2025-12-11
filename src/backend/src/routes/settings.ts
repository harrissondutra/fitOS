import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getPrismaClient } from '../config/database';
import { SettingsService } from '../services/settings.service';
import { uploadAvatar, uploadLogo, validateImageDimensions, handleUploadError } from '../middleware/upload.middleware';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

// Tipos temporários para evitar erros de compilação
import { UserRole } from '../../../shared/types/auth.types';

// PrismaClient global compartilhado
const prisma = getPrismaClient();
const settingsService = new SettingsService(prisma);

const router = Router();

// Interface para requisições com tenant e auth
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

// Middleware de validação de role para system settings
const requireAdminRole = (req: RequestWithTenantAndAuth, res: Response, next: any) => {
  if (!req.user || !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { message: 'Acesso negado. Apenas administradores podem acessar configurações do sistema.' }
    });
  }
  return next();
};

// Validação para system settings
const validateSystemSettings = [
  body('general.companyName').optional().isString().isLength({ min: 1, max: 100 }),
  body('general.timezone').optional().isString(),
  body('general.language').optional().isIn(['pt-BR', 'en-US', 'es-ES']),
  body('general.currency').optional().isIn(['BRL', 'USD', 'EUR']),
  body('business.defaultMembershipType').optional().isString(),
  body('business.workingHours.start').optional().isString().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('business.workingHours.end').optional().isString().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('business.autoApproveMembers').optional().isBoolean(),
  body('integrations.googleCalendar').optional().isBoolean(),
  body('integrations.whatsapp').optional().isBoolean(),
  body('integrations.smtp').optional().isBoolean(),
  body('notifications.emailNotifications').optional().isBoolean(),
  body('notifications.smsNotifications').optional().isBoolean(),
  body('notifications.pushNotifications').optional().isBoolean(),
];

// Validação para profile settings
const validateProfileSettings = [
  body('personalData.firstName').optional().isString().isLength({ min: 1, max: 50 }),
  body('personalData.lastName').optional().isString().isLength({ min: 1, max: 50 }),
  body('personalData.phone').optional().isString().isLength({ min: 10, max: 20 }),
  body('avatar.type').optional().isIn(['upload', 'initials', 'google', 'apple', 'microsoft']),
  body('avatar.bgColor').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  body('theme.mode').optional().isIn(['light', 'dark']),
  body('theme.customColors.primary').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  body('theme.customColors.secondary').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  body('theme.customColors.accent').optional().isString().matches(/^#[0-9A-Fa-f]{6}$/),
  body('preferences.language').optional().isIn(['pt-BR', 'en-US', 'es-ES']),
  body('preferences.timezone').optional().isString(),
  body('preferences.notifications').optional().isBoolean(),
];

// GET /api/settings/system - Buscar configurações do sistema
router.get('/system', requireAdminRole, asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant ID não encontrado' }
      });
    }

    const settings = await settingsService.getSystemSettings(req.tenantId);

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching system settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro interno do servidor' }
    });
  }
}));

// PUT /api/settings/system - Atualizar configurações do sistema
router.put('/system', requireAdminRole, validateSystemSettings, asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Dados inválidos', details: errors.array() }
      });
    }

    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant ID não encontrado' }
      });
    }

    const settings = await settingsService.updateSystemSettings(req.tenantId, req.body);

    return res.json({
      success: true,
      data: settings,
      message: 'Configurações do sistema atualizadas com sucesso'
    });
  } catch (error) {
    logger.error('Error updating system settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro interno do servidor' }
    });
  }
}));

// GET /api/settings/profile - Buscar configurações de perfil
router.get('/profile', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Usuário não autenticado' }
      });
    }

    const settings = await settingsService.getUserProfileSettings(req.user.id);

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching profile settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro interno do servidor' }
    });
  }
}));

// PUT /api/settings/profile - Atualizar configurações de perfil
router.put('/profile', validateProfileSettings, asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Usuário não autenticado' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Dados inválidos', details: errors.array() }
      });
    }

    const settings = await settingsService.updateUserProfileSettings(req.user.id, req.body);

    return res.json({
      success: true,
      data: settings,
      message: 'Perfil atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Error updating profile settings:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro interno do servidor' }
    });
  }
}));

// POST /api/settings/profile/avatar - Upload de avatar
router.post('/profile/avatar', uploadAvatar as any, validateImageDimensions, handleUploadError, asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Usuário não autenticado' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'Nenhum arquivo enviado' }
      });
    }

    const avatarUrl = await settingsService.uploadAvatarToCloudinary(req.file, req.user.id);

    return res.json({
      success: true,
      data: { avatarUrl },
      message: 'Avatar atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro ao fazer upload do avatar' }
    });
  }
}));

// PUT /api/settings/profile/avatar/social - Usar foto de login social
router.put('/profile/avatar/social', [
  body('provider').isIn(['google', 'apple', 'microsoft']).withMessage('Provider inválido')
], asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Usuário não autenticado' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Dados inválidos', details: errors.array() }
      });
    }

    const { provider } = req.body;
    const avatarUrl = await settingsService.syncSocialAvatar(req.user.id, provider);

    return res.json({
      success: true,
      data: { avatarUrl },
      message: `Avatar do ${provider} sincronizado com sucesso`
    });
  } catch (error) {
    logger.error('Error syncing social avatar:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro ao sincronizar avatar social' }
    });
  }
}));

// POST /api/upload/logo - Upload de logo da empresa
router.post('/upload/logo', requireAdminRole, uploadLogo as any, validateImageDimensions, handleUploadError, asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tenant ID não encontrado' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'Nenhum arquivo enviado' }
      });
    }

    const logoUrl = await settingsService.uploadLogoToCloudinary(req.file, req.tenantId);

    return res.json({
      success: true,
      data: { url: logoUrl },
      message: 'Logo da empresa atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Error uploading logo:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Erro ao fazer upload do logo' }
    });
  }
}));

export default router;
