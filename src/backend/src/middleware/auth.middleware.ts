/**
 * Middlewares de Autenticação - FitOS
 * 
 * Este arquivo contém todos os middlewares relacionados à autenticação:
 * - authenticateToken: Verifica JWT e adiciona dados do usuário ao request
 * - checkSessionActivity: Valida atividade da sessão e inatividade
 * - requireAuth: Middleware obrigatório de autenticação
 * - optionalAuth: Middleware opcional de autenticação
 * - requireRole: Middleware para verificação de roles específicas
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  User, 
  UserRole, 
  AuthenticatedRequest, 
  AuthMiddlewareOptions,
  AUTH_CONSTANTS
} from '../../../shared/types/auth.types';
import { getAuthService } from '../services/auth.service';

// Estender o tipo Request do Express para incluir dados de autenticação
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId?: string;
        name?: string;
      };
      session?: any;
      tenantId?: string;
    }
  }
}

export class AuthMiddleware {
  private prisma: PrismaClient;
  private authService: ReturnType<typeof getAuthService>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.authService = getAuthService(prisma);
  }

  // ============================================================================
  // MIDDLEWARE PRINCIPAL DE AUTENTICAÇÃO
  // ============================================================================

  /**
   * Middleware para verificar token JWT e carregar dados do usuário
   */
  authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'INVALID_TOKEN',
          message: 'Token de acesso não fornecido'
        });
        return;
      }

      // Verificar e decodificar token
      const payload = this.authService.verifyToken(token);
      
      // Buscar usuário no banco de dados
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          tenant: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Verificar se usuário está ativo
      if (user.status !== 'ACTIVE') {
        res.status(401).json({
          success: false,
          error: 'USER_INACTIVE',
          message: 'Usuário inativo'
        });
        return;
      }

      // Verificar se email foi verificado (opcional)
      if (!user.emailVerified) {
        res.status(401).json({
          success: false,
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Email não verificado'
        });
        return;
      }

      // Adicionar dados do usuário ao request
      req.user = user as User;
      req.tenantId = user.tenantId || undefined;

      next();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      
      let errorCode = 'INVALID_TOKEN';
      let message = 'Token inválido';

      if (error instanceof Error) {
        if (error.message === 'TOKEN_EXPIRED') {
          errorCode = 'TOKEN_EXPIRED';
          message = 'Token expirado';
        } else if (error.message === 'INVALID_TOKEN') {
          errorCode = 'INVALID_TOKEN';
          message = 'Token inválido';
        }
      }

      res.status(401).json({
        success: false,
        error: errorCode,
        message
      });
    }
  };

  // ============================================================================
  // MIDDLEWARE DE VERIFICAÇÃO DE SESSÃO
  // ============================================================================

  /**
   * Middleware para verificar atividade da sessão
   */
  checkSessionActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_AUTHENTICATED',
          message: 'Usuário não autenticado'
        });
        return;
      }

      // Buscar sessão ativa do usuário
      const session = await this.prisma.session.findFirst({
        where: {
          userId: req.user.id,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      if (!session) {
        res.status(401).json({
          success: false,
          error: 'SESSION_NOT_FOUND',
          message: 'Sessão não encontrada ou expirada'
        });
        return;
      }

      // Verificar se sessão está próxima de expirar
      const sessionData = {
        id: session.id,
        userId: session.userId,
        tenantId: req.user.tenantId || 'default-tenant',
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastActivity: session.updatedAt
      };

      if (this.authService.isSessionNearExpiry(sessionData)) {
        // Atualizar sessão para estender tempo de expiração
        await this.authService.updateSessionActivity(session.id);
      }

      req.session = sessionData;
      next();
    } catch (error) {
      console.error('Erro na verificação de sessão:', error);
      res.status(500).json({
        success: false,
        error: 'SESSION_CHECK_FAILED',
        message: 'Erro ao verificar sessão'
      });
    }
  };

  // ============================================================================
  // MIDDLEWARES DE AUTORIZAÇÃO
  // ============================================================================

  /**
   * Middleware obrigatório de autenticação
   */
  requireAuth = (options: AuthMiddlewareOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Primeiro verificar token
      await this.authenticateToken(req, res, (err) => {
        if (err) return;

        // Depois verificar sessão se necessário
        if (options.requireEmailVerification !== false) {
          this.checkSessionActivity(req as any, res, next);
        } else {
          next();
        }
      });
    };
  };

  /**
   * Middleware opcional de autenticação
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Tentar autenticar se token existe
        await this.authenticateToken(req, res, next);
      } else {
        // Continuar sem autenticação
        next();
      }
    } catch (error) {
      // Em caso de erro, continuar sem autenticação
      next();
    }
  };

  /**
   * Middleware para verificar roles específicas
   */
  requireRole = (requiredRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'USER_NOT_AUTHENTICATED',
          message: 'Usuário não autenticado'
        });
        return;
      }

      if (!this.authService.hasPermission(req.user.role, requiredRoles)) {
        res.status(403).json({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware para verificar acesso ao tenant
   */
  requireTenantAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_AUTHENTICATED',
        message: 'Usuário não autenticado'
      });
      return;
    }

    const requestedTenantId = (req as any).params.tenantId || (req as any).body.tenantId || (req as any).query.tenantId;

    // SUPER_ADMIN pode acessar qualquer tenant
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Outros usuários só podem acessar seu próprio tenant
    if (req.user.tenantId !== requestedTenantId) {
      res.status(403).json({
        success: false,
        error: 'TENANT_ACCESS_DENIED',
        message: 'Acesso negado ao tenant'
      });
      return;
    }

    next();
  };

  // ============================================================================
  // MIDDLEWARES ESPECÍFICOS POR ROLE
  // ============================================================================

  /**
   * Middleware para SUPER_ADMIN
   */
  requireSuperAdmin = this.requireRole(['SUPER_ADMIN']);

  /**
   * Middleware para ADMIN ou SUPER_ADMIN
   */
  requireAdminOrSuperAdmin = this.requireRole(['ADMIN', 'SUPER_ADMIN']);

  /**
   * Middleware para OWNER ou SUPER_ADMIN
   */
  requireOwnerOrSuperAdmin = this.requireRole(['OWNER', 'SUPER_ADMIN']);

  /**
   * Middleware para TRAINER ou superior
   */
  requireTrainerOrAbove = this.requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']);

  /**
   * Middleware para qualquer usuário autenticado
   */
  requireAnyAuth = this.requireRole(['CLIENT', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']);

  // ============================================================================
  // MIDDLEWARES DE RATE LIMITING
  // ============================================================================

  /**
   * Middleware para limitar tentativas de login
   */
  rateLimitLogin = (maxAttempts: number = AUTH_CONSTANTS.MAX_LOGIN_ATTEMPTS) => {
    const attempts = new Map<string, { count: number; lastAttempt: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const userAttempts = attempts.get(ip);

      if (userAttempts) {
        // Reset contador se passou do tempo de lockout
        if (now - userAttempts.lastAttempt > AUTH_CONSTANTS.LOCKOUT_DURATION) {
          attempts.delete(ip);
        } else if (userAttempts.count >= maxAttempts) {
          res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Muitas tentativas de login. Tente novamente em alguns minutos.'
          });
          return;
        }
      }

      next();
    };
  };

  // ============================================================================
  // MIDDLEWARES DE VALIDAÇÃO
  // ============================================================================

  /**
   * Middleware para validar dados de login
   */
  validateLoginData = (req: Request, res: Response, next: NextFunction): void => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Email e senha são obrigatórios'
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido'
      });
      return;
    }

    next();
  };

  /**
   * Middleware para validar dados de signup
   */
  validateSignupData = (req: Request, res: Response, next: NextFunction): void => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Todos os campos são obrigatórios'
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL_FORMAT',
        message: 'Formato de email inválido'
      });
      return;
    }

    // Validar senha
    const passwordValidation = this.authService.validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'PASSWORD_TOO_WEAK',
        message: 'Senha não atende aos critérios de segurança',
        details: passwordValidation
      });
      return;
    }

    // Verificar se senhas coincidem
    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: 'PASSWORDS_DO_NOT_MATCH',
        message: 'Senhas não coincidem'
      });
      return;
    }

    next();
  };
}

// Instância singleton do middleware
let authMiddlewareInstance: AuthMiddleware | null = null;

export function getAuthMiddleware(prisma: PrismaClient): AuthMiddleware {
  if (!authMiddlewareInstance) {
    authMiddlewareInstance = new AuthMiddleware(prisma);
  }
  return authMiddlewareInstance;
}
