/**
 * Session Policy Middleware
 * 
 * Valida sessões contra políticas de role e previne abuse.
 */

import { Request, Response, NextFunction } from 'express';
import { sessionPolicyService } from '../services/session-policy.service';
import { logger } from '../utils/logger';

type AuthenticatedRequest = Request & { user?: any };

/**
 * Middleware para validar sessão contra política
 */
export const validateSessionPolicy = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obter session ID do header
    const sessionId = req.headers['x-session-id'] as string;
    const userId = req.user?.id;

    if (!userId || !sessionId) {
      // Se não tem session ID, passar adiante (outros middlewares tratarão)
      return next();
    }

    // Validar sessão contra política
    const validation = await sessionPolicyService.validateSession(sessionId, userId);

    if (!validation.valid) {
      logger.warn('Session policy violation:', {
        userId,
        sessionId,
        reason: validation.reason,
        terminated: validation.terminated
      });

      // Se sessão foi terminada, retornar erro específico
      if (validation.terminated) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SESSION_TERMINATED',
            message: 'Você fez login em outro dispositivo. Esta sessão foi encerrada.',
            action: 'RELOGIN_REQUIRED'
          }
        });
        return;
      }

      // Outros erros de validação
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: validation.reason || 'Sessão inválida'
        }
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error validating session policy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Middleware para validar criação de nova sessão
 * Impede criar sessão que viole políticas
 */
export const validateNewSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    // Obter fingerprint do dispositivo
    const deviceFingerprint = sessionPolicyService.generateDeviceFingerprint(req);
    
    // Validar se pode criar sessão (antes de criar)
    // Verificar limites de dispositivos e sessões
    
    // Adicionar fingerprint ao request para uso posterior
    (req as any).deviceFingerprint = deviceFingerprint;
    
    next();
  } catch (error) {
    logger.error('Error validating new session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};




